using System.Drawing.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.PowerPlatform.Dataverse.Client;
using System.Net.Http.Json;
using System.Net.Http;
using System.Text.Json;

namespace Database
{
    public static class ServiceCollectionExtensions
    {
        static IConfiguration Configuration;

        public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            Configuration = configuration;   
            services.AddSingleton<IOrganizationServiceAsync>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<ServiceClient>>();
                var connectionString = configuration["DYNAMICS_CONNECTIONSTRING"];
                var clientId = configuration["DYNAMICS_APP_GROUP_CLIENT_ID"];
                var clientSecret = configuration["DYNAMICS_APP_GROUP_SECRET"];
                Uri uri = new Uri(configuration["DYNAMICS_ODATA_URI"]);
                var client = new ServiceClient(uri, TokenProviderAdfs, false,logger);
                if (!client.IsReady) throw new InvalidOperationException($"Failed to connect to Dataverse: {client.LastError}", client.LastException);
                return client;
            });
            services.AddScoped(sp =>
            {
                var client = sp.GetRequiredService<IOrganizationServiceAsync>();
                return new DatabaseContext(client);
            });

            return services;
        }

        public record TokenResponse
        {
            public string access_token { get; set; }
            public string refresh_token { get; set; }
        }

        async static Task<string> TokenProviderAdfs(string instanceUri)
        {
            // add caching here...
           
            HttpClient http = new HttpClient();
            var adfsUrl = Configuration["ADFS_OAUTH2_URI"] ?? throw new ArgumentNullException("ADFS_OAUTH2_URI");
            var request = new HttpRequestMessage(HttpMethod.Post, adfsUrl);
            request.Headers.Add("Accept", "application/json");
            var content = new FormUrlEncodedContent(new Dictionary<string, string>() {
                { "grant_type", "password" },
                { "response_mode", "form_post"},
                { "client_id", Configuration["DYNAMICS_APP_GROUP_CLIENT_ID"] ?? throw new ArgumentNullException("DYNAMICS_APP_GROUP_CLIENT_ID") },
                { "client_secret",Configuration["DYNAMICS_APP_GROUP_SECRET"]},
                { "resource", Configuration["DYNAMICS_APP_GROUP_RESOURCE"] },
                { "scope", "openid" },
                { "username", Configuration["DYNAMICS_USERNAME"] ?? throw new ArgumentNullException("Username") },
                { "password", Configuration["DYNAMICS_PASSWORD"] ?? throw new ArgumentNullException("Password") },
            });

            var response = await http.PostAsync(adfsUrl, content);

            try
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                // response should be in JSON format.
                var result = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(responseContent);
                if (result.ContainsKey("access_token"))
                {
                    var token = result["access_token"].GetString();
                    return token;
                }
                else if (result.ContainsKey("error"))
                {
                    throw new Exception($"{result["error"].GetString()}: {result["error_description"].GetString()}");
                }
                else
                {
                    throw new Exception(responseContent);
                }
            }
            catch (Exception e)
            {
                throw new Exception($"Failed to obtain access token from OAuth2TokenEndpoint: {e.Message}", e);
            }

            
        }
    }
}
