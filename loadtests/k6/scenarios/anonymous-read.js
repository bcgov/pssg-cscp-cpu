// Read-only journey: every genuinely anonymous GET endpoint on CPU,
// regardless of environment (no dev-only bypass relied upon).
//
//   k6 run -e ENV=dev -e PROFILE=load scenarios/anonymous-read.js
//
// Why only 3 endpoints: CPU's default authorization policy requires an
// authenticated user on every controller action unless the action is
// explicitly [AllowAnonymous] AND doesn't depend on the Development-only
// global AllowAnonymousFilter bypass (see MANUAL.md "Why this suite is
// read-only"). These 3 are the only ones that qualify:
//   - GET /hc                      - health check (API + Dataverse status)
//   - GET /api/Configuration       - feature flags / outage banner config
//   - GET /api/User/isLoggedIn     - session-status probe (always returns
//                                    200 with a boolean body, authenticated
//                                    or not - never itself requires auth)
//
// GET /Logout is intentionally excluded even though it's [AllowAnonymous]:
// it 302-redirects to an external BC Gov SiteMinder logoff page
// (SITEMINDER_LOGOUT_URL), and repeatedly hitting that external identity
// service at load-test volume is out of scope (same reasoning as excluding
// VSD's AEM PDF endpoints or VSU's CAS vendor-validation calls).
import { check } from 'k6';
import http from 'k6/http';
import { getEnvironment } from '../config/environments.js';
import { getProfile } from '../lib/profiles.js';
import { readThresholds } from '../lib/thresholds.js';

const env = getEnvironment();
const profile = getProfile();

export const options = {
  scenarios: {
    [profile.name]: profile.config,
  },
  // CPU's dev/test edge resets connections from k6's default User-Agent
  // (WAF/bot-detection) - a browser-like UA avoids that, same fix as VSU's
  // suite. See MANUAL.md "Known gotchas".
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  thresholds: readThresholds,
};

export default function () {
  const hcRes = http.get(env.healthUrl, { tags: { name: 'GET /hc' } });
  check(hcRes, { 'hc is 200': (r) => r.status === 200 });

  const configRes = http.get(`${env.apiUrl}/Configuration`, { tags: { name: 'GET /api/Configuration' } });
  check(configRes, { 'configuration is 200': (r) => r.status === 200 });

  const isLoggedInRes = http.get(`${env.apiUrl}/User/isLoggedIn`, { tags: { name: 'GET /api/User/isLoggedIn' } });
  check(isLoggedInRes, { 'isLoggedIn is 200': (r) => r.status === 200 });
}
