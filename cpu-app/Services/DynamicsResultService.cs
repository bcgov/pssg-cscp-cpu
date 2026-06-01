using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Gov.Cscp.Victims.Public.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Rest;
using Serilog;
using Microsoft.Extensions.Options;
using Database;


namespace Gov.Cscp.Victims.Public.Services
{
    public interface IDynamicsResultService
    {
        Task<HttpClientResult> Get(string endpointUrl);
        Task<HttpClientResult> Post(string endpointUrl, string requestJson);
    }

    public class DynamicsResultService : IDynamicsResultService
    {
        private HttpClient _client;
        private IConfiguration _configuration;
        private readonly ILogger _logger;
        private readonly DynamicsTokenProviderOptions _dynamicsOptions;

        public DynamicsResultService(IConfiguration configuration, HttpClient httpClient, IOptions<DynamicsTokenProviderOptions> dynamicsOptions)
        {
            _client = httpClient;
            _configuration = configuration;
            _logger = Log.Logger;
            _dynamicsOptions = dynamicsOptions.Value;
        }

        public async Task<HttpClientResult> Get(string endpointUrl)
        {
            HttpClientResult blob = await DynamicsResultAsync(HttpMethod.Get, endpointUrl, "");
            return blob;
        }

        public async Task<HttpClientResult> Post(string endpointUrl, string modelJson)
        {
            HttpClientResult blob = await DynamicsResultAsync(HttpMethod.Post, endpointUrl, modelJson);
            return blob;
        }

        private async Task<HttpClientResult> DynamicsResultAsync(HttpMethod method, string endpointUrl, string requestJson)
        {
            endpointUrl = _dynamicsOptions.GetDynamicsApiEndpointUrl() + endpointUrl;
            requestJson = requestJson.Replace("fortunecookie", "@odata.");

            _logger.Debug("Dynamics request: {Method} {Url}", method.Method, endpointUrl);
            _logger.Debug("Dynamics request body: {RequestBody}", requestJson);

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            HttpRequestMessage _httpRequest = new HttpRequestMessage(method, endpointUrl);
            _httpRequest.Content = new StringContent(requestJson, System.Text.Encoding.UTF8, "application/json");

            HttpResponseMessage _httpResponse = await _client.SendAsync(_httpRequest);
            HttpStatusCode _statusCode = _httpResponse.StatusCode;

            stopwatch.Stop();
            _logger.Debug("Dynamics response: {StatusCode} ({StatusCodeInt}) in {ElapsedMs}ms for {Method} {Url}",
                _statusCode, (int)_statusCode, stopwatch.ElapsedMilliseconds, method.Method, endpointUrl);

            string _responseContent = await _httpResponse.Content.ReadAsStringAsync();

            _logger.Debug("Dynamics response body: {ResponseBody}", _responseContent);

            HttpClientResult result = new HttpClientResult();
            result.statusCode = _statusCode;
            result.responseMessage = _httpResponse;
            string clean = _responseContent.Replace("@odata.", "fortunecookie");
            result.result = Newtonsoft.Json.Linq.JObject.Parse(clean);

            if (result.result.ContainsKey("IsSuccess") && result.result["IsSuccess"].ToString().Equals("False"))
            {
                _logger.Information(new HttpOperationException("Received a fail response from Dynamics endpoint. Source = CPU"), "Error calling Dynamics API function. \nSource = CPU.");
            }
            if (!(new HttpResponseMessage((HttpStatusCode)_statusCode).IsSuccessStatusCode))
            {
                _logger.Error(new HttpOperationException("Error calling API function. Source = CPU"), "Error calling API function Dynamics endpoint. Source = CPU.");
            }

            _logger.Debug("Dynamics result: IsSuccess={IsSuccess}, StatusCode={StatusCode} ({StatusCodeInt})",
                result.result.ContainsKey("IsSuccess") ? result.result["IsSuccess"].ToString() : "N/A",
                result.statusCode,
                (int)result.statusCode);

            return result;
        }
    }
}