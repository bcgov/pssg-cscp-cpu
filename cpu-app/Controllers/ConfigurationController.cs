using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;

namespace Gov.Cscp.Victims.Public.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConfigurationController : ControllerBase
    {
        private readonly ILogger<ConfigurationController> logger;
        private readonly IConfiguration configuration;

        public ConfigurationController(ILogger<ConfigurationController> logger, IConfiguration configuration)
        {
            this.logger = logger;
            this.configuration = configuration;
        }

        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetConfiguration()
        {
            try
            {
                var config = new Configuration
                {
                    OutageMessage = configuration.GetValue<string>("CONFIGURATION_OUTAGEINFORMATION_MESSAGE"),
                    OutageStartDate = configuration.GetValue<string>("CONFIGURATION_OUTAGEINFORMATION_STARTDATE"),
                    OutageEndDate = configuration.GetValue<string>("CONFIGURATION_OUTAGEINFORMATION_ENDDATE"),
                    MaintenanceMode =
                        bool.TryParse(configuration["CONFIGURATION_MAINTENANCE_MODE"], out var maintenanceMode)
                        && maintenanceMode,
                    //check if it is prod env
                    IsProdCpu = !string.IsNullOrEmpty(configuration.GetValue<string>("PROD_CPU_PORT")),
                    FeatureHideReportSaveButton = !string.IsNullOrEmpty(configuration.GetValue<string>("FEATURE_HIDE_REPORT_SAVE")),

                };

                if (string.IsNullOrEmpty(config.OutageMessage) || string.IsNullOrEmpty(config.OutageStartDate) || string.IsNullOrEmpty(config.OutageEndDate))
                {
                    return Ok(new { config.IsProdCpu, config.FeatureHideReportSaveButton, config.MaintenanceMode });
                }
                ;

                return Ok(config);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to retrieve configuration information.");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }
    }
}

public class Configuration
{
    public string OutageMessage { get; set; }
    public string OutageStartDate { get; set; }
    public string OutageEndDate { get; set; }
    public bool MaintenanceMode { get; set; }
    public bool IsProdCpu { get; set; }
    public bool FeatureHideReportSaveButton { get; set; }
};
