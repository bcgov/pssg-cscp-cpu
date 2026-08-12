# DST Readiness Report — COAST CPU Application

**Date:** 2026-08-12  
**Branch:** `development`  
**Scope:** BC DST elimination — application code, container configuration, scheduled jobs, integrations, date/time libraries

---

## Scan Coverage

| Area | Scanned |
|---|---|
| Angular frontend (TypeScript) | ✅ |
| ASP.NET Core backend (C#) | ✅ |
| Container configuration (Dockerfile, docker-compose) | ✅ |
| OpenShift legacy Dockerfiles (UBI8 .NET 3 / .NET 8) | ✅ |
| Scheduled/batch job logic (ScheduleG, invoice quarters) | ✅ |
| External integrations (Dynamics/Dataverse, SharePoint, Keycloak) | ✅ |
| Date/time libraries (`moment`, `moment-timezone`) | ✅ |
| Environment variables (`TZ`, `TIMEZONE`) | ✅ |

---

## Remediations Applied

### 1 — `cpu-app/ClientApp/src/app/core/store/configuration.store.ts`

**Severity:** High  
**Issue:** Outage banner used `moment-timezone` with `moment().tz("America/Vancouver")` to determine if the current time falls between configured start/end dates. `moment-timezone` bundles its own IANA timezone database — if BC drops DST, that bundled data becomes stale until the npm package is explicitly updated.  
**Fix:** Removed `import moment from "moment-timezone"` entirely. Replaced the three `moment` calls with native `Date.now()` / `new Date(x).getTime()` UTC arithmetic. The comparison is functionally identical and DST-independent.

```diff
- import moment from "moment-timezone";
  ...
- const current = moment().tz("America/Vancouver");
- const start   = moment(startDate).tz("America/Vancouver");
- const end     = moment(endDate).tz("America/Vancouver");
- return current.isBetween(start, end, null, "[]");
+ const now   = Date.now();
+ const start = new Date(startDate).getTime();
+ const end   = new Date(endDate).getTime();
+ return now >= start && now <= end;
```

---

### 2 — `cpu-app/ClientApp/package.json`

**Severity:** High  
**Issue:** `"moment-timezone": "^0.5.48"` was the sole DST-sensitive npm dependency. With no remaining imports, it was dead weight and a future update liability.  
**Fix:** Removed the dependency.

---

### 3 — `cpu-app/Controllers/ProgramController.cs`

**Severity:** Medium  
**Issue:** `GetInvoiceDate()` constructed five `DateTime` objects with `DateTimeKind.Local`. If the server ever ran in a timezone that observes DST, these dates would shift across a DST boundary. The time component was also sourced from `DateTime.Today.Hour/Minute/Second` (wall-clock local time), compounding the ambiguity.  
**Fix:** Replaced `DateTime.Today` with `DateTime.UtcNow` and `DateTimeKind.Local` with `DateTimeKind.Utc` across all five lines.

---

### 4 — `cpu-app/Services/KeycloakAuthService.cs`

**Severity:** Medium  
**Issue:** Three uses of `DateTime.Now` for tracking OAuth token expiry. `DateTime.Now` is DST-sensitive: if a DST transition occurs while a token is cached, the comparison `DateTime.Now.CompareTo(_accessTokenExpiration)` could skip a refresh or trigger a premature one.  
**Fix:** All three `DateTime.Now` → `DateTime.UtcNow`.

---

### 5 — `cpu-app/Controllers/LogoutController.cs` & `cpu-app/Controllers/UserController.cs`

**Severity:** Medium  
**Issue:** Cookie expiry set with `DateTime.Now.AddDays(-1)`. `LoginController.cs` already used `DateTime.UtcNow` — these two controllers were inconsistent.  
**Fix:** Four occurrences of `DateTime.Now.AddDays(-1)` → `DateTime.UtcNow.AddDays(-1)`.

---

### 6 — `cpu-app/Controllers/FileController.cs`

**Severity:** Medium  
**Issue:** `DateTime.Now` used to stamp the day/month/year on generated PDFs.  
**Fix:** `DateTime.Now` → `DateTime.UtcNow`.

---

### 7 — `cpu-app/Dockerfile`

**Severity:** Low  
**Issue:** Alpine Linux defaults to UTC, but no `TZ` variable was set explicitly. A base image change could silently introduce a DST-sensitive timezone.  
**Fix:** Added `ENV TZ=UTC` to the runtime stage with an explanatory comment.

---

## Findings Requiring No Code Change

| Location | Finding | Rationale |
|---|---|---|
| `task-list.component.ts` | `moment().endOf("day")` for overdue task comparison | Plain `moment` (no `moment-timezone`) — uses browser OS timezone, updated by platform vendors when BC changes DST rules |
| `program-summary-table.component.ts` | `moment()` for open/close hour arithmetic | Operates on HH:MM strings only; no timezone lookup |
| `hours-to-dynamics.ts` | `moment().hour().minute().format("HH:mm")` | Time-string formatting with no timezone context |
| `transmogrifier.class.ts` | `moment(date)` to find payment quarter | Extracts month/day from an ISO date to match a lookup table; no timezone conversion |
| `ScheduleGController.cs` | `DateTime.Today.Year`, `DateTime.Today.AddMonths(1)` | Server runs in Alpine (UTC); year and relative-month math are DST-immune |
| `openshift/Dockerfile.ubi8.*` (legacy) | No `TZ` set | UBI8 defaults to UTC; files are not used in the current build pipeline |
| Dynamics / SharePoint integration layer | No local-time conversions found | All API dates are ISO 8601 UTC strings |
| `docker-compose.yml` | No `TZ` env var | Development-only compose file; not a production concern |

---

## Residual Risks

1. **`moment` (plain) in Angular components** — Still present for task-list overdue checks and program hour calculations. These use browser local time, which is safe as long as browser/OS timezone data is kept current. No action required unless BC's TZ rules diverge significantly from what browsers ship.

2. **Outage banner date authoring** — The native `Date` comparison works correctly for any parseable date string. Dates stored in the configuration API must be ISO 8601 (e.g. `2026-11-03T08:00:00Z`). If they are stored as bare local strings without an offset (e.g. `2026-11-03 00:00`), `new Date()` will interpret them as UTC in most modern runtimes — verify this with whoever authors the outage window values.

3. **`ScheduleGController` task due-dates** — `DateTime.Today.AddMonths(1)` creates a `DateTimeKind.Unspecified` value stored to Dataverse. No DST issue on Alpine/UTC, but the kind is technically ambiguous. Low risk; flagged for awareness.
