# CPU (Community Programs Unit) k6 Load Testing Suite

This is the fourth of four planned load-test suites (Restitution done, VSU done, VSD done, CPU here) - but unlike the other three, **this suite is intentionally read-only and covers a much smaller endpoint surface**. See "Why this suite is read-only" below before assuming you can extend it the same way the others were extended.

## Why this suite is read-only

CPU (`cpu-app`) authenticates users via a **SiteMinder header-trust model**, not the Keycloak/OIDC JWT pattern VSD uses:

- The default auth scheme (`site-minder-auth`, [SiteminderAuthenticationHandler.cs](../../cpu-app/Authentication/SiteminderAuthenticationHandler.cs)) trusts plain HTTP headers (`sm_user`/`sm_universalid`, `smgov_userguid`, `smgov_usertype`, etc.) with **no cryptographic signature verification** - authentication succeeds as long as those headers are non-empty strings (and `smgov_userguid` parses as a GUID), regardless of whether they correspond to a real login.
- Every controller defaults to `RequireAuthenticatedUser()` ([Program.cs](../../cpu-app/Program.cs)) except in `ASPNETCORE_ENVIRONMENT=Development`, where a second global filter makes the entire API anonymous. `docker-compose.yml` runs `Production`, and the deployed dev/test/prod tiers' actual `ASPNETCORE_ENVIRONMENT` value is set via the CI/CD pipeline (not confirmed from this repo) - don't assume the Dev bypass applies there.
- A separate JWT Bearer scheme exists, but it's scoped to exactly 3 Dynamics-integration controllers (`ContractController`, `ProgramController`, `ScheduleGController`) - internal service-to-service endpoints, not user-facing business flows.

**Net effect**: there is no legitimate, low-effort way to authenticate as a test user against CPU's real business endpoints (`ProgramApplicationController`, `CAPApplicationController`, `FileController`, `ExpenseReportController`, etc.) today. The only way in would be either (a) spoofing the unsigned SiteMinder headers directly - which is exploiting an authentication weakness, not "configuring a test harness," and is explicitly out of scope without separate written sign-off - or (b) provisioning a real test identity through some legitimate mechanism that doesn't currently exist for CPU. Both were discussed and deferred; **this suite is scoped only to what's genuinely reachable without either.**

### Fully anonymous endpoints (any environment, no bypass needed)

- `GET /hc` - health check (API + Dataverse status)
- `GET /api/Configuration` - feature flags / outage banner config
- `GET /api/User/isLoggedIn` - session-status probe, always 200 regardless of auth state
- `GET /Logout` - **excluded from this suite anyway** (see below)
- `GET /login/token/{userid}` - dev-only cookie injector; only feeds `PermissionHandler`'s fine-grained permission checks, does NOT satisfy `SiteminderAuthenticationHandler`'s authentication requirement, so it's not useful for reaching `[Authorize]` endpoints - excluded

### Why `/Logout` is excluded even though it's `[AllowAnonymous]`

[LogoutController.cs](../../cpu-app/Controllers/LogoutController.cs) 302-redirects to an external BC Gov identity endpoint (`SITEMINDER_LOGOUT_URL`, e.g. `https://logon.gov.bc.ca/clp-cgi/logoff.cgi`). Repeatedly hitting that external service at load-test volume is out of scope, the same reasoning used to exclude VSD's AEM PDF endpoints and VSU's CAS vendor-validation calls in their respective suites.

### Folder layout

```
loadtests/k6/
  config/environments.js   # local/dev/test/prod base URLs
  lib/profiles.js          # smoke/load/stress/spike/soak - identical to the other 3 suites
  lib/thresholds.js        # read-only thresholds - no writeThresholds (nothing to write-test)
  scenarios/smoke.js
  scenarios/anonymous-read.js
  run.ps1 / run.sh         # convenience wrappers around `k6 run`
  report.ps1               # pretty-print a summary JSON without installing k6
  results/                 # gitignored - k6 --summary-export output lands here
```

## Prerequisites

Install k6, or run it via Podman/Docker with the `grafana/k6` image (no local install needed) - both `run.ps1`/`run.sh` support `-Container`/`--container`.

`local` assumes `dotnet run` from `cpu-app` (Kestrel port 8080 per `docker-compose.yml`, `BASE_PATH` unset). If k6 itself is running inside a container and `local` needs to reach the host, override with `-e BASE_URL=http://host.containers.internal:8080`.

| Environment | Base URL                       | API path            |
| ----------- | ------------------------------ | ------------------- |
| local       | http://localhost:8080          | /api                |
| dev         | https://dev.justice.gov.bc.ca  | /coastcontracts/api |
| test        | https://test.justice.gov.bc.ca | /coastcontracts/api |
| prod        | https://justice.gov.bc.ca      | /coastcontracts/api |

**Confirmed against dev** (2026-09-25): `dev.justice.gov.bc.ca/coastcontracts` is correct - `smoke.js` and `anonymous-read.js` both pass cleanly (9/9 and 15/15 checks, p95 well under budget). **Requires the Cisco AnyConnect VPN** to be connected - without it, every request gets a TCP `connection reset by peer` (not a 404), which is easy to mistake for a wrong hostname/path or a WAF block. `test`/`prod` values are the same convention but not yet independently verified - confirm with `smoke` before trusting them.

### How to run tests

With a local k6 install, `run.ps1`/`run.sh` invoke `k6` directly:

```powershell
# Smoke test (always run this first, especially given the unverified hostnames above)
./run.ps1 smoke -e ENV=dev

# Read-only load test
./run.ps1 anonymous-read -e ENV=dev -e PROFILE=load
```

### Running via container (Podman/Docker) - no local k6 install needed

```powershell
./run.ps1 smoke -Container -e ENV=dev
./run.ps1 anonymous-read -Container --% -e ENV=dev -e PROFILE=load
```

**PowerShell note**: when passing multiple `-e` flags in container mode, insert `--%` (the stop-parsing token) right before them so PowerShell doesn't try to interpret `-e`/`-E` as one of its own common parameters.

If you need to bypass `run.ps1` entirely (e.g. one-off debugging with extra k6 CLI flags), call `podman run` directly from `loadtests/k6`:

```powershell
cd loadtests/k6
podman run --rm -i -v "${PWD}:/scripts:Z" -w /scripts grafana/k6 run -e ENV=dev -e PROFILE=smoke scenarios/anonymous-read.js
```

### Reviewing results without k6 installed

```powershell
./report.ps1 results/anonymous-read-20260925-120000.summary.json
./report.ps1   # defaults to the most recently modified file in results/
```

## Safety rules

- No write scenarios exist in this suite - there's nothing to accidentally run against `prod` the way VSD/VSU/Restitution's `assertWritesAllowed()` guards against.
- Do not add SiteMinder header spoofing (`sm_user`, `smgov_userguid`, `smgov_usertype`, etc.) to any script in this folder without explicit written sign-off - see "Why this suite is read-only" above. This is a security-sensitive line, not a testing-convenience one.
- Get sign-off from the team before running `stress`/`spike`/`soak` profiles against a shared dev/test environment.

## Interpreting results

Same shape as the other 3 suites: check `checks_succeeded` (should be ~100%), `http_req_failed` rate (should be <1%), and `http_req_duration` percentiles against `readThresholds` in `lib/thresholds.js`.

## Support & maintenance

### Known gotchas

- **SiteMinder header-trust with no signature verification**: `SiteminderAuthenticationHandler` accepts any well-formed `sm_user`/`smgov_userguid`/`smgov_usertype` headers as valid authentication, with zero correlation to a real login event - see "Why this suite is read-only" for details and [SiteminderAuthenticationHandler.cs](../../cpu-app/Authentication/SiteminderAuthenticationHandler.cs). This is a pre-existing authentication-bypass risk independent of this load-testing project; it was reported to the team separately and is not something this suite works around or exploits.
- **Hardcoded real-looking org GUIDs in Angular source** (`ClientApp/src/app/core/services/state.service.ts`, `login()`/`getUserName()`): a set of real-named-organization `userId`/`orgId` pairs used for `localhost` dev convenience. Per the team, these are usable only in dev/test tiers, not prod, and have been in place for years without incident - noted here for awareness, not treated as a blocker for this read-only suite, but worth keeping in mind if CPU's auth model changes and these ever become reachable against a live environment.
- **Dev/test requires the Cisco AnyConnect VPN.** Without it connected, every request against `dev`/`test` gets a TCP `connection reset by peer` - not a 404 or a WAF challenge page - which looks identical to a wrong hostname/path. If you see resets on every single request regardless of endpoint, check the VPN before re-checking `config/environments.js`.
- **`ASPNETCORE_ENVIRONMENT` for deployed tiers is not confirmed from this repo** - if dev/test genuinely run `Development` (not just `docker-compose.yml`'s `Production`), the global `AllowAnonymousFilter` bypass would apply there and every controller would already be anonymous, which would change the calculus for extending this suite. Worth confirming with whoever owns the CI/CD pipeline variables.

### If CPU's auth model changes

If the team adds a legitimate token-based path for automated testing (e.g. a parallel `[JwtAuthorize]` policy scoped to non-prod, as discussed separately from this suite), re-visit this MANUAL and `config/environments.js`/`lib/thresholds.js` to add `writeThresholds` and a proper write-journey scenario (`application-submit.js`-equivalent) following the same pattern as VSD/VSU/Restitution - don't rebuild the pattern from scratch, copy theirs.

### TODO: write-journey coverage (RegisterNewUser, ProgramApplication, CAPApplication, FileController, etc.)

Blocked, not forgotten. Two separate things need to land before this suite can grow a write-journey scenario:

1. A legitimate auth path for the business endpoints (see "Why this suite is read-only" and "If CPU's auth model changes" above) - still pending a team decision.
2. **Usable test data in the target Dataverse environment.** While debugging local dev auth separately, we confirmed the hardcoded `userId`/`orgId` pairs in `ClientApp/src/app/core/services/state.service.ts` (e.g. the "Victimservices4 - Family Service of Greater Vancouver" pair) no longer resolve to a real Contact in whichever Dynamics org the local backend points at (`GET /api/cpuorgcontracts/{businessBceid}/{userBceid}` returns `"Error: No contact found with the supplied BCeID"`). Whatever test identity ends up being used for write-journey load testing (via option 1 above) will need to correspond to an actual, approved Contact/Account record in the **DEV and TEST** Dataverse environments specifically - confirm that data exists (or get it provisioned) before attempting to build `application-submit.js`-equivalent scenarios, or every write attempt will fail on this same "no contact found" condition regardless of the auth mechanism used to get there.

### When the API changes

Re-read `cpu-app/Controllers/ConfigurationController.cs`, `cpu-app/Controllers/UserController.cs`, and `cpu-app/Program.cs`'s health-check/auth setup before assuming this suite's 3 endpoints are still accurate and still anonymous.

## CI/CD integration

Not yet wired up. Given the small, purely read-only surface, this is a low priority compared to the other 3 suites - suggested next step: run `smoke` on every PR against `dev` as a pipeline gate once the hostname/base-path assumptions above are confirmed.
