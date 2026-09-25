// Shared pass/fail thresholds. Keep these in one place so every scenario is
// judged the same way and CI can fail the build consistently.
//
// CPU only has read thresholds today - every endpoint this suite covers is
// a cheap, anonymous, no-write lookup (health check, feature-flag config,
// session-status probe). See MANUAL.md "Why this suite is read-only" for
// why write endpoints aren't covered.
export const readThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
};

// Merge a base threshold set with per-scenario custom thresholds/tags.
export function withThresholds(base, overrides = {}) {
  return { ...base, ...overrides };
}
