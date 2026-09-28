// Environment registry for K6 load tests.
//
// Select an environment on the command line with:
//   k6 run -e ENV=dev scenarios/smoke.js
//
// `local` assumes `dotnet run` from cpu-app (default Kestrel port 8080 per
// docker-compose.yml, BASE_PATH unset). `dev` is confirmed (2026-09-25):
// `dev.justice.gov.bc.ca/coastcontracts` responds correctly to smoke.js and
// anonymous-read.js - but it requires the Cisco AnyConnect VPN to be
// connected, or every request gets a TCP `connection reset by peer` (looks
// identical to a wrong hostname/path - see MANUAL.md "Known gotchas").
// `test`/`prod` follow the same convention but are NOT yet independently
// verified - confirm with `smoke` before trusting them.
export const environments = {
  local: {
    baseUrl: 'http://localhost:8080',
    apiPath: '/api',
    healthPath: '/hc',
  },
  dev: {
    baseUrl: 'https://dev.justice.gov.bc.ca',
    apiPath: '/coastcontracts/api',
    healthPath: '/coastcontracts/hc',
  },
  test: {
    baseUrl: 'https://test.justice.gov.bc.ca',
    apiPath: '/coastcontracts/api',
    healthPath: '/coastcontracts/hc',
  },
  prod: {
    baseUrl: 'https://justice.gov.bc.ca',
    apiPath: '/coastcontracts/api',
    healthPath: '/coastcontracts/hc',
  },
};

export function getEnvironment() {
  const name = __ENV.ENV || 'local';
  const env = environments[name];

  if (!env) {
    throw new Error(`Unknown ENV "${name}". Valid options: ${Object.keys(environments).join(', ')}`);
  }

  // Optional override so `local` can be reached when k6 itself is running
  // inside a container (Podman/Docker), where "localhost" refers to the
  // container, not the host. Example: -e ENV=local -e BASE_URL=http://host.containers.internal:8080
  const baseUrl = __ENV.BASE_URL || env.baseUrl;

  return {
    name,
    ...env,
    baseUrl,
    apiUrl: `${baseUrl}${env.apiPath}`,
    healthUrl: `${baseUrl}${env.healthPath}`,
  };
}

// NOTE: there is intentionally no `writeEnabledEnvironments`/
// `assertWritesAllowed()` here, unlike the VSD/VSU/Restitution suites.
// This suite ONLY covers CPU's anonymous read endpoints - see MANUAL.md
// "Why this suite is read-only" for the auth-architecture reasons
// (SiteMinder header-trust model with no signature verification) that
// every write-capable business endpoint is currently out of scope.
