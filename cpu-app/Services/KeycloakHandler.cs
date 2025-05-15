using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

namespace Gov.Cscp.Victims.Public.Services
{
    public class KeycloakHandler : DelegatingHandler
    {
        private readonly IKeycloakAuthService _keycloakAuthService;
        private readonly ILogger _logger;

        public KeycloakHandler(IKeycloakAuthService keycloakAuthService)
        {
            _keycloakAuthService = keycloakAuthService;
            _logger = Log.Logger;
        }

        public class KeycloakHandler : DelegatingHandler
        {
            private readonly IKeycloakAuthService _keycloakAuthService;
            private readonly ILogger<KeycloakHandler> _logger;

            public KeycloakHandler(IKeycloakAuthService keycloakAuthService, ILogger<KeycloakHandler> logger)
            {
                _keycloakAuthService = keycloakAuthService;
                _logger = logger;
            }

            protected override async Task<HttpResponseMessage> SendAsync(
                HttpRequestMessage request,
                CancellationToken cancellationToken
            )
            {
                _logger.LogDebug("Starting request {Method} {Uri}", request.Method, request.RequestUri);

                string accessToken;
                try
                {
                    _logger.LogDebug("Requesting Keycloak token…");
                    accessToken = await _keycloakAuthService.GetToken();
                    _logger.LogDebug(
                        "Received token (first 10 chars): {TokenStart}…",
                        accessToken?.Substring(0, Math.Min(10, accessToken.Length))
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to acquire Keycloak token");
                    throw;
                }

                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                _logger.LogDebug("Authorization header set, forwarding request…");

                HttpResponseMessage response;
                try
                {
                    response = await base.SendAsync(request, cancellationToken);
                    _logger.LogDebug(
                        "Received response {StatusCode} for {Method} {Uri}",
                        response.StatusCode,
                        request.Method,
                        request.RequestUri
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "HTTP call failed for {Method} {Uri}", request.Method, request.RequestUri);
                    throw;
                }

                return response;
            }
        }
    }
}
