using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Gov.Cscp.Victims.Public.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;

namespace Gov.Cscp.Victims.Public.Services
{
    public interface IDocumentMergeService
    {
        // Task<HttpClientResult> Get(string endpointUrl);
        Task<HttpClientResult> Post(string requestJson);
    }

    public class DocumentMergeService : IDocumentMergeService
    {
        private HttpClient _client;
        private IConfiguration _configuration;
        private readonly ILogger _logger;

        public DocumentMergeService(IConfiguration configuration, HttpClient httpClient)
        {
            _client = httpClient;
            _configuration = configuration;
            _logger = Log.Logger;
        }

        // public async Task<HttpClientResult> Get(string endpointUrl)
        // {
        //     HttpClientResult blob = await DocumentMerge(HttpMethod.Get, endpointUrl, "");
        //     return blob;
        // }

        public async Task<HttpClientResult> Post(string modelJson)
        {
            HttpClientResult blob = await DocumentMerge(HttpMethod.Post, modelJson);
            return blob;
        }

        private async Task<HttpClientResult> DocumentMerge(HttpMethod method, string requestJson)
        {
            // 1) Read endpoint and IDs
            var endpointUrl = _configuration["JAG_DOCUMENT_MERGE_URL"];
            var correlationId = _configuration["JAG_CORRELATION_ID"];
            var clientId = _configuration["JAG_CLIENT_ID"];

            _logger.Debug("DocumentMerge called with method={Method} endpoint={Endpoint}", method, endpointUrl);
            _logger.Debug("Request JSON: {RequestJson}", requestJson);

            // 2) Build request
            var request = new HttpRequestMessage(method, endpointUrl)
            {
                Content = new StringContent(requestJson, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("X-Correlation-ID", correlationId);
            request.Headers.Add("X-Client-ID", clientId);

            // 3) Send and capture status
            HttpResponseMessage response;
            try
            {
                response = await _client.SendAsync(request);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "HTTP request to {Endpoint} failed", endpointUrl);
                throw;
            }

            var statusCode = response.StatusCode;
            _logger.Debug("Received HTTP {StatusCode} from {Endpoint}", statusCode, endpointUrl);

            // 4) Read the body
            string responseContent = null;
            try
            {
                responseContent = await response.Content.ReadAsStringAsync();
                _logger.Debug("Response content string length={Length}", responseContent?.Length ?? 0);
                _logger.Debug("Full response content: {ResponseContent}", responseContent);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Failed to read response content from {Endpoint}", endpointUrl);
                throw;
            }

            // 5) Parse JSON
            JObject parsed = null;
            try
            {
                parsed = JObject.Parse(responseContent);
                _logger.Debug("Successfully parsed response JSON");
            }
            catch (JsonReaderException jex)
            {
                _logger.Error(jex, "JSON parse error. Response content was:\n{ResponseContent}", responseContent);
                throw; // rethrow so you still see the original stack
            }
            catch (Exception ex)
            {
                _logger.Error(
                    ex,
                    "Unexpected error parsing JSON. Response content:\n{ResponseContent}",
                    responseContent
                );
                throw;
            }

            // 6) Wrap up
            var result = new HttpClientResult
            {
                statusCode = statusCode,
                responseMessage = response,
                result = parsed
            };

            _logger.Debug("DocumentMerge returning result with status={StatusCode}", statusCode);
            return result;
        }
    }
}
