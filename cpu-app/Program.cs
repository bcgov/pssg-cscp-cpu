using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Database;
using Gov.Cscp.Victims.Public.Authentication;
using Gov.Cscp.Victims.Public.Authorization;
using Gov.Cscp.Victims.Public.Background;
using Gov.Cscp.Victims.Public.HealthChecks;
using Gov.Cscp.Victims.Public.Services;
using Manager;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using NWebsec.AspNetCore.Mvc;
using NWebsec.AspNetCore.Mvc.Csp;
using Serilog;
using Serilog.Enrichers.Span;
using Serilog.Exceptions;

namespace Gov.Cscp.Victims.Public
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateWebHostBuilder(args).Build();
            host.Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    var env = hostingContext.HostingEnvironment;

                    config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                            .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: true);
                    config.AddEnvironmentVariables();
                })
                .ConfigureLogging((hostingContext, logging) =>
                {
                    logging.AddSimpleConsole(options => options.IncludeScopes = true);
                    logging.SetMinimumLevel(LogLevel.Debug);
                    logging.AddDebug();
                    logging.AddEventSourceLogger();
                })
                .UseStartup<Startup>();
    }

    public class Startup
    {
        public IConfiguration Configuration { get; }
        private IWebHostEnvironment CurrentEnvironment { get; set; }

        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            CurrentEnvironment = env;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            services.AddTransient<TokenHandler>();
            services.AddTransient<KeycloakHandler>();

            services.AddHandlers();
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<InvoiceHandlers>());

            services.AddHttpClient<ICOASTAuthService, COASTAuthService>();
            services.AddHttpClient<IKeycloakAuthService, KeycloakAuthService>();

            services
                .AddHttpClient<IDynamicsResultService, DynamicsResultService>()
                .AddHttpMessageHandler<TokenHandler>();
            services
                .AddHttpClient<IDocumentMergeService, DocumentMergeService>()
                .AddHttpMessageHandler<KeycloakHandler>();

            services.AddDistributedMemoryCache();

            services.AddHttpLogging(logging =>
            {
                logging.CombineLogs = true;
                logging.LoggingFields = HttpLoggingFields.All;
                logging.RequestBodyLogLimit = 8192;
                logging.ResponseBodyLogLimit = 8192;
            });

            // for security reasons, the following headers are set.
            services
                .AddControllers(opts =>
                {
                    opts.EnableEndpointRouting = true;
                    // default deny
                    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
                    opts.Filters.Add(new AuthorizeFilter(policy));

                    opts.Filters.Add(typeof(NoCacheHttpHeadersAttribute));
                    opts.Filters.Add(new XRobotsTagAttribute() { NoIndex = true, NoFollow = true });
                    opts.Filters.Add(typeof(XContentTypeOptionsAttribute));
                    opts.Filters.Add(typeof(XDownloadOptionsAttribute));
                    opts.Filters.Add(typeof(XFrameOptionsAttribute));
                    opts.Filters.Add(typeof(XXssProtectionAttribute));
                    //CSPReportOnly
                    opts.Filters.Add(typeof(CspReportOnlyAttribute));
                    opts.Filters.Add(new CspScriptSrcReportOnlyAttribute { None = true });

                    if (CurrentEnvironment.IsDevelopment())
                    {
                        // Allow anonymous for local development
                        opts.Filters.Add(new AllowAnonymousFilter());
                    }
                })
                .AddNewtonsoftJson(opts =>
                {
                    opts.SerializerSettings.Formatting = Newtonsoft.Json.Formatting.Indented;
                    opts.SerializerSettings.DateFormatHandling = Newtonsoft.Json.DateFormatHandling.IsoDateFormat;
                    opts.SerializerSettings.DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Utc;

                    // ReferenceLoopHandling is set to Ignore to prevent JSON parser issues with the user / roles model.
                    opts.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;

                    // Use camelCase for JSON property names
                    opts.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
                });

            services.AddJwtBearerAuth(
                Configuration["JWT_TOKEN_KEY"],
                Configuration["JWT_VALID_ISSUER"],
                !string.IsNullOrEmpty(Configuration["JWT_DISABLE_ISSUER_VALIDATION"])
            );
            services.AddSiteminderAuth();

            services.RegisterPermissionHandler();

            // setup key ring to persist in storage.
            if (!string.IsNullOrEmpty(Configuration["KEY_RING_DIRECTORY"]))
            {
                services
                    .AddDataProtection()
                    .PersistKeysToFileSystem(new DirectoryInfo(Configuration["KEY_RING_DIRECTORY"]));
            }

            if (CurrentEnvironment.IsProduction())
            {
                // In production, the Angular files will be served from this directory
                services.AddSpaStaticFiles(configuration =>
                {
                    configuration.RootPath = "wwwroot";
                });
            }

            // add dynamics database adapter
            services.AddDatabase(Configuration);

            services.AddAutoMapper();

            services.AddBackgroundTask();

            // allow for large files to be uploaded
            services.Configure<FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = 1073741824; // 1 GB
            });

            // health checks
            services
                .AddHealthChecks()
                .AddCheck<ApiSelfHealthCheck>(
                    "API",
                    failureStatus: HealthStatus.Degraded,
                    tags: new[] { "self", "process" }
                )
                .AddCheck<DataverseHealthCheck>(
                    "Dataverse",
                    failureStatus: HealthStatus.Unhealthy,
                    tags: new[] { "dataverse", "dynamics", "ready" }
                );

            services.AddSession(x =>
            {
                x.IdleTimeout = TimeSpan.FromHours(1.0);
            });

            services.AddSerilog();

            // Add Swagger/OpenAPI
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "CPU Portal API",
                    Version = "v1",
                    Description = "API documentation for CPU Portal"
                });
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            ConfigureLogging(env);

            string pathBase = Configuration["BASE_PATH"];

            if (!string.IsNullOrEmpty(pathBase))
            {
                app.UsePathBase(pathBase);
            }

            if (!CurrentEnvironment.IsProduction())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseSerilogRequestLogging(options =>
            {
                // Reduce log level for specific endpoints
                options.GetLevel = (httpContext, elapsed, ex) =>
                {
                    if (ex != null)
                        return Serilog.Events.LogEventLevel.Error;

                    var path = httpContext.Request.Path.ToString();

                    if (path.StartsWith("/hc", StringComparison.OrdinalIgnoreCase))
                        return httpContext.Response.StatusCode >= 500
                            ? Serilog.Events.LogEventLevel.Error
                            : Serilog.Events.LogEventLevel.Verbose;

                    if (path.StartsWith("/api/lookup", StringComparison.OrdinalIgnoreCase))
                        return Serilog.Events.LogEventLevel.Verbose;

                    return elapsed > 1000
                        ? Serilog.Events.LogEventLevel.Warning
                        : Serilog.Events.LogEventLevel.Information;
                };

                options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
                {
                    diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
                    diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
                    diagnosticContext.Set(
                        "UserAgent",
                        httpContext.Request.Headers["User-Agent"].ToString()
                    );
                };
            });

            // Enable Swagger middleware
            if (env.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CPU Portal API v1");
                    c.RoutePrefix = "swagger";
                });
            }

            app.Use(
                async (ctx, next) =>
                {
                    ctx.Response.Headers.Append(
                        "Strict-Transport-Security",
                        "max-age=31536000; includeSubDomains; preload"
                    );
                    await next();
                }
            );

            app.UseXContentTypeOptions();
            app.UseReferrerPolicy(opts => opts.NoReferrer());
            app.UseXXssProtection(options => options.EnabledWithBlockMode());
            app.UseXfo(options => options.Deny());

            if (!CurrentEnvironment.IsDevelopment()) // when running locally we can't have a strict CSP
            {
                // Content-Security-Policy header
                app.UseCsp(opts =>
                {
                    opts.BlockAllMixedContent()
                        .StyleSources(s =>
                            s.Self()
                                .UnsafeInline()
                                .CustomSources(
                                    "https://use.fontawesome.com",
                                    "https://stackpath.bootstrapcdn.com",
                                    "https://fonts.googleapis.com",
                                    "https://fonts.gstatic.com"
                                )
                        )
                        .FontSources(s =>
                            s.Self().CustomSources("https://use.fontawesome.com", "https://fonts.gstatic.com")
                        )
                        .FormActions(s => s.Self())
                        .FrameAncestors(s => s.Self())
                        .ImageSources(s => s.Self().CustomSources("data:"))
                        .DefaultSources(s => s.Self())
                        .ObjectSources(s => s.Self().CustomSources("data:"))
                        .FrameSources(s => s.Self().CustomSources("data:"))
                        .ScriptSources(s =>
                            s.Self()
                                .UnsafeInline()
                                .UnsafeEval()
                                .CustomSources(
                                    "https://apis.google.com",
                                    "https://maxcdn.bootstrapcdn.com",
                                    "https://cdnjs.cloudflare.com",
                                    "https://code.jquery.com",
                                    "https://stackpath.bootstrapcdn.com",
                                    "https://fonts.googleapis.com"
                                )
                        );
                });
            }

            StaticFileOptions staticFileOptions = new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    ctx.Context.Response.Headers[HeaderNames.CacheControl] =
                        "no-cache, no-store, must-revalidate, private";
                    ctx.Context.Response.Headers[HeaderNames.Pragma] = "no-cache";
                    ctx.Context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
                    ctx.Context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
                    ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                }
            };

            app.UseStaticFiles(staticFileOptions);
            if (CurrentEnvironment.IsProduction())
            {
                app.UseSpaStaticFiles(staticFileOptions);
            }

            app.UseRouting();

            app.UseNoCacheHttpHeaders();
            // IMPORTANT: This session call MUST go before UseMvc()
            app.UseSession();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseCookiePolicy(
                new CookiePolicyOptions
                {
                    HttpOnly = HttpOnlyPolicy.Always,
                    Secure = CookieSecurePolicy.Always,
                    MinimumSameSitePolicy = Microsoft.AspNetCore.Http.SameSiteMode.None
                }
            );

            app.UseHttpLogging();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                // Health check – returns JSON with API + Dataverse status.
                // Overall status (and HTTP status code) is driven solely by the API self-check so that
                // a Dataverse outage does not cause a pod crash-restart loop.
                endpoints.MapHealthChecks(
                    "/hc",
                    new HealthCheckOptions
                    {
                        // Allow the endpoint to be reached even when the aggregate status is Unhealthy.
                        ResultStatusCodes =
                        {
                            [HealthStatus.Healthy]   = 200,
                            [HealthStatus.Degraded]  = 200,
                            [HealthStatus.Unhealthy] = 200,
                        },
                        ResponseWriter = async (context, report) =>
                        {
                            // Determine overall status from the API self-check only.
                            // Dataverse failures are surfaced in the per-check details but do not
                            // flip the overall status to Unhealthy (which would restart the pod).
                            var overallStatus = report.Entries.TryGetValue("API", out var apiEntry)
                                ? apiEntry.Status
                                : report.Status;

                            context.Response.StatusCode = overallStatus == HealthStatus.Unhealthy ? 503 : 200;
                            context.Response.ContentType = "application/json";

                            var result = JsonSerializer.Serialize(
                                new
                                {
                                    status = overallStatus.ToString(),
                                    checks = report.Entries.Select(e => new
                                    {
                                        name = e.Key,
                                        status = e.Value.Status.ToString(),
                                        description = e.Value.Description,
                                    }),
                                },
                                new JsonSerializerOptions { WriteIndented = true }
                            );

                            await context.Response.WriteAsync(result);
                        },
                    }
                );
            });

            if (CurrentEnvironment.IsProduction())
            {
                app.UseSpa(spa => { });
            }
        }

        private void ConfigureLogging(IWebHostEnvironment env)
        {
            var loggerConfiguration = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .Enrich.WithExceptionDetails()
                .Enrich.WithMachineName()
                .Enrich.WithProperty("app", "CPU")
                .Enrich.WithProperty("environment", env.EnvironmentName)
                .Enrich.WithEnvironmentUserName()
                .Enrich.WithCorrelationId()
                .Enrich.WithSpan()
                .Enrich.WithProperty(
                    "version",
                    Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "Unknown"
                )
                .Enrich.WithProperty("UTC_Timestamp", DateTime.UtcNow.ToString("o"));

            // Set minimum level based on environment
            if (env.IsDevelopment())
            {
                loggerConfiguration.MinimumLevel.Debug();
            }
            else
            {
                loggerConfiguration.MinimumLevel.Information();
            }

            // Override for specific namespaces
            loggerConfiguration
                .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
                .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning);

            loggerConfiguration.WriteTo.Console();

            var splunkCollectorUrl = Configuration["SPLUNK_COLLECTOR_URL"];
            var splunkToken = Configuration["SPLUNK_TOKEN"];

            if (!string.IsNullOrEmpty(splunkCollectorUrl) && !string.IsNullOrEmpty(splunkToken))
            {
                // Use proper certificate validation or provide custom validator
                HttpClientHandler handler = null;

                if (env.IsDevelopment())
                {
                    handler = new HttpClientHandler
                    {
                        ServerCertificateCustomValidationCallback =
                            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
                    };
                }

                loggerConfiguration.WriteTo.EventCollector(
                    splunkHost: splunkCollectorUrl,
                    eventCollectorToken: splunkToken,
                    sourceType: "coast:cpu:api",
                    restrictedToMinimumLevel: Serilog.Events.LogEventLevel.Information,
                    messageHandler: handler,
                    batchSizeLimit: 100,
                    batchIntervalInSeconds: 2
                );
            }

            Log.Logger = loggerConfiguration.CreateLogger();

            Serilog.Debugging.SelfLog.Enable(msg =>
            {
                Console.Error.WriteLine($"Serilog Error: {msg}");
            });

            Log.Logger.Information("CPU API Started");
        }
    }
}
