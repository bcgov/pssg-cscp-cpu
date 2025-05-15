using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

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

        public KeycloakAuthService(IConfiguration configuration, HttpClient httpClient)
        {
            _client = httpClient;
            _client.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/x-www-form-urlencoded")
            );
            _configuration = configuration;
            _accessTokenExpiration = DateTime.Now;
            _token = "";
        }

        public async Task<string> GetToken()
        {
            if (DateTime.Now.CompareTo(_accessTokenExpiration) > 0)
            {
                try
                {
                    string authUrl = _configuration["KEYCLOAK_URL"];
                    string clientId = _configuration["KEYCLOAK_CLIENT_ID"];
                    string grantType = _configuration["KEYCLOAK_GRANT_TYPE"];
                    string clientSecret = _configuration["KEYCLOAK_CLIENT_SECRET"];

                    if (
                        !string.IsNullOrEmpty(authUrl)
                        && !string.IsNullOrEmpty(clientId)
                        && !string.IsNullOrEmpty(grantType)
                        && !string.IsNullOrEmpty(clientSecret)
                    )
                    {
                        var pairs = new List<KeyValuePair<string, string>>
                        {
                            new KeyValuePair<string, string>("client_id", clientId),
                            new KeyValuePair<string, string>("grant_type", grantType),
                            new KeyValuePair<string, string>("client_secret", clientSecret),
                        };

                        var content = new FormUrlEncodedContent(pairs);
                        _client.DefaultRequestHeaders.Accept.Add(
                            new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue(
                                "application/x-www-form-urlencoded"
                            )
                        );
                        var _httpResponse = await _client.PostAsync(authUrl, content);
                        var _responseContent = await _httpResponse.Content.ReadAsStringAsync();

                        JObject response = JObject.Parse(
                            _httpResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                        );
                        string token = response.GetValue("access_token").ToString();
                        int expirationSeconds;
                        bool secondsParsed = int.TryParse(
                            response.GetValue("expires_in").ToString(),
                            out expirationSeconds
                        );

                        if (!secondsParsed)
                        {
                            expirationSeconds = 300;
                            throw new Exception(
                                "The expiration seconds were not parsed so a default of one hour is used."
                            );
                        }
                        if (token == null)
                        {
                            //token problem
                            return "";
                            throw new Exception("The token couldn't be parsed.");
                        }

                        // set global access token expiry time to the value returned subtract 60 seconds for minute long authentication communication delays
                        this._accessTokenExpiration = DateTime.Now.AddSeconds(expirationSeconds - 60);
                        this._token = token;
                        return token;
                    }
                    else
                    {
                        throw new Exception("Keycloak URL, client ID, grant type, or client secret is not configured.");
                    }
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
            else
            {
                return this._token;
            }
        }
    }
}
