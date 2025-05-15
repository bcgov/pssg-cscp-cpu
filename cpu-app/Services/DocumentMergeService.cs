using Gov.Cscp.Victims.Public.Models;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net;
using System.Threading.Tasks;
using System;
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
            string endpointUrl = _configuration["JAG_DOCUMENT_MERGE_URL"];

            // Console.WriteLine(endpointUrl);
            // Console.WriteLine(requestJson);

            HttpRequestMessage _httpRequest = new HttpRequestMessage(method, endpointUrl);
            _httpRequest.Headers.Add("X-Correlation-ID", _configuration["JAG_CORRELATION_ID"]);
            _httpRequest.Headers.Add("X-Client-ID", _configuration["JAG_CLIENT_ID"]);
            _httpRequest.Content = new StringContent(requestJson, System.Text.Encoding.UTF8, "application/json");

            HttpResponseMessage _httpResponse = await _client.SendAsync(_httpRequest);
            HttpStatusCode _statusCode = _httpResponse.StatusCode;

            _logger.Debug("Received HTTP {StatusCode} from {Endpoint}", _statusCode, endpointUrl);

            string _responseContent = await _httpResponse.Content.ReadAsStringAsync();

            HttpClientResult result = new HttpClientResult();
            result.statusCode = _statusCode;
            result.responseMessage = _httpResponse;
            result.result = Newtonsoft.Json.Linq.JObject.Parse(_responseContent);

            // Console.WriteLine(result.result);

            return result;
        }
    }
}