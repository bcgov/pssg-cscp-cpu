using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using Serilog;

namespace Gov.Cscp.Victims.Public.Services
{
    public interface IKeycloakAuthService
    {
        Task<string> GetToken();
    }

    public class KeycloakAuthService : IKeycloakAuthService
    {
        private HttpClient _client;
        private IConfiguration _configuration;
        private DateTime _accessTokenExpiration;
        private string _token;
        private readonly ILogger _logger;

        public KeycloakAuthService(IConfiguration configuration, HttpClient httpClient)
        {
            _client = httpClient;
            _client.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/x-www-form-urlencoded")
            );
            _configuration = configuration;
            _accessTokenExpiration = DateTime.Now;
            _token = "";
            _logger = Log.Logger;
        }

        public async Task<string> GetToken()
        {
            _logger.Debug("GetToken called. Now={Now}, Expiration={Expiration}", DateTime.Now, _accessTokenExpiration);

            if (DateTime.Now > _accessTokenExpiration)
            {
                _logger.Debug("Token expired or missing—acquiring new token.");

                try
                {
                    string authUrl = _configuration["KEYCLOAK_URL"];
                    string clientId = _configuration["KEYCLOAK_CLIENT_ID"];
                    string grantType = _configuration["KEYCLOAK_GRANT_TYPE"];
                    string clientSecret = _configuration["KEYCLOAK_CLIENT_SECRET"];

                    _logger.Debug(
                        "Config values: Url={Url}, ClientId={ClientId}, GrantType={GrantType}",
                        authUrl,
                        clientId,
                        grantType
                    );

                    if (
                        string.IsNullOrEmpty(authUrl)
                        || string.IsNullOrEmpty(clientId)
                        || string.IsNullOrEmpty(grantType)
                        || string.IsNullOrEmpty(clientSecret)
                    )
                    {
                        throw new Exception("Keycloak URL, client ID, grant type, or client secret is not configured.");
                    }

                    var pairs = new List<KeyValuePair<string, string>>
                    {
                        new("client_id", clientId),
                        new("grant_type", grantType),
                        new("client_secret", clientSecret),
                    };

                    var content = new FormUrlEncodedContent(pairs);
                    _logger.Debug("Sending POST to {Url} with form data.", authUrl);

                    var response = await _client.PostAsync(authUrl, content);
                    var responseContent = await response.Content.ReadAsStringAsync();

                    _logger.Debug(
                        "Received HTTP {StatusCode}. Response content (truncated)={Content}",
                        response.StatusCode,
                        responseContent.Length > 200 ? responseContent.Substring(0, 200) + "…" : responseContent
                    );

                    var json = JObject.Parse(responseContent);
                    string token = json.Value<string>("access_token");
                    _logger.Debug(
                        "Parsed access_token (first 10 chars)={TokenStart}…",
                        token?.Substring(0, Math.Min(10, token.Length))
                    );

                    if (token == null)
                        throw new Exception("Keycloak token is null.");

                    if (!int.TryParse(json.Value<string>("expires_in"), out int expirationSeconds))
                    {
                        _logger.Debug("Failed to parse expires_in—using default 300s.");
                        expirationSeconds = 300;
                    }
                    _logger.Debug(
                        "Token expires in {Seconds}s; setting expiration to now + {SecondsMinusBuffer}s.",
                        expirationSeconds,
                        expirationSeconds - 60
                    );

                    _accessTokenExpiration = DateTime.Now.AddSeconds(expirationSeconds - 60);
                    _token = token;

                    return token;
                }
                catch (Exception e)
                {
                    _logger.Error(e, "Error occurred while acquiring Keycloak token.");
                    throw;
                }
            }
            else
            {
                _logger.Debug("Returning cached token; valid until {Expiration}.", _accessTokenExpiration);
                return _token;
            }
        }
    }
}
