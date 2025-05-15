using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Serilog;

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

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken
        )
        {
            _logger.Debug("Starting request {Method} {Uri}", request.Method, request.RequestUri);

            string accessToken;
            try
            {
                _logger.Debug("Requesting Keycloak token…");
                accessToken = await _keycloakAuthService.GetToken();
                _logger.Debug(
                    "Received token (first 10 chars): {TokenStart}…",
                    accessToken?.Substring(0, Math.Min(10, accessToken.Length))
                );
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Failed to acquire Keycloak token");
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
                _logger.Error(ex, "HTTP call failed for {Method} {Uri}", request.Method, request.RequestUri);
                throw;
            }

            return response;
        }
    }
}
