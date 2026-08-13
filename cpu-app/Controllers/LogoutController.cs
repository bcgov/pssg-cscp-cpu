using System;
// using Gov.Cscp.Victims.Public.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace Gov.Cscp.Victims.Public.Controllers
{
    [Route("[controller]")]
    public class LogoutController : Controller
    {

        // **********FROM PILL PRESS *****************
        private readonly IConfiguration _configuration;
        // private readonly IHostingEnvironment _env;
        // private readonly SiteMinderAuthOptions _options = new SiteMinderAuthOptions();

        public LogoutController(
            IConfiguration configuration
            // IHostingEnvironment env
            )
        {
            _configuration = configuration;
            //     _env = env;      
        }

        [HttpGet]
        [AllowAnonymous]
        public ActionResult Logout(string path)
        {
            // clear session
            HttpContext.Session.Clear();

            // Removing Cookies
            CookieOptions option = new CookieOptions();
            if (Request.Cookies[".AspNetCore.Session"] != null)
            {
                option.Expires = DateTime.UtcNow.AddDays(-1);
                Response.Cookies.Append(".AspNetCore.Session", "", option);
            }

            if (Request.Cookies["AuthenticationToken"] != null)
            {
                option.Expires = DateTime.UtcNow.AddDays(-1);
                Response.Cookies.Append("AuthenticationToken", "", option);
            }

            string logoutPath = string.IsNullOrEmpty(_configuration["SITEMINDER_LOGOUT_URL"]) ? "/" : _configuration["SITEMINDER_LOGOUT_URL"];
            return Redirect(logoutPath + $"?returl={_configuration["BASE_URI"]}{_configuration["BASE_PATH"]}&retnow=1");
        }
    }
}
