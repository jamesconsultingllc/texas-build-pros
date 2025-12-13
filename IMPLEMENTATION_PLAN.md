# Implementation Plan: API Security

## Overview

Secure all admin API endpoints with proper authentication and authorization using **middleware**. 

## Status: ? Core Implementation Complete

All core security implementation is complete. Remaining tasks are verification and documentation cleanup.

## Related Documentation

**Consulted before implementation:**
- `docs/API-IMPLEMENTATION-PLAN.md` - API Security Architecture section (updated with middleware approach)
- `docs/authentication-implementation-plan.md` - Phase 2 backend implementation checklist (updated)

## Architecture: Middleware Approach

```
Request ? SWA Route Auth ? AuthenticationMiddleware ? AuthorizationMiddleware ? Function
                                    ?                         ?
                              Parse x-ms-client-principal    Check admin role
                              Set context.Items["User"]      Return 401/403 if denied
```

## Completed Tasks

### Infrastructure & Models
- [x] 1. Update `staticwebapp.config.json` - Added route authentication rules
- [x] 2. Create `api/Models/ApiError.cs` - Structured error response with codes
- [x] 3. Create `api/Models/ClientPrincipal.cs` - SWA user principal model

### Middleware Implementation
- [x] 4. Create `api/Middleware/AuthenticationMiddleware.cs` - Parse x-ms-client-principal
- [x] 5. Create `api/Middleware/AuthorizationMiddleware.cs` - Enforce admin role
- [x] 6. Register middleware in `api/Program.cs`

### Telemetry & Logging
- [x] 7. Update `api/Services/TelemetryService.cs` - Added `TrackAuthorizationFailure()`

### E2E Test Updates
- [x] 8. Update `features/support/api-helpers.ts` - Added auth header support

### Build & Test Verification
- [x] 10. API builds without errors
- [x] 11. Frontend builds without errors
- [x] 12. Unit tests pass (231 tests)

### Documentation Updates
- [x] 14. Update `api/README.md` with security requirements
- [x] 15. Mark completed items in `docs/authentication-implementation-plan.md`
- [x] 16. Verify `docs/API-IMPLEMENTATION-PLAN.md` security section is accurate

## Remaining Tasks

- [ ] 9. Remove TODO comments from function files (optional cleanup)
- [ ] 13. E2E smoke tests pass (requires SWA CLI running)
- [ ] 17. Delete this `IMPLEMENTATION_PLAN.md` before merging

## Files Created

| File | Description |
|------|-------------|
| `api/Models/ApiError.cs` | Structured error response with error codes |
| `api/Models/ClientPrincipal.cs` | SWA client principal model |
| `api/Middleware/AuthenticationMiddleware.cs` | Parse x-ms-client-principal header |
| `api/Middleware/AuthorizationMiddleware.cs` | Enforce admin role for protected routes |

## Files Modified

| File | Changes |
|------|---------|
| `staticwebapp.config.json` | Added route authentication rules |
| `api/Program.cs` | Registered middleware pipeline |
| `api/Services/TelemetryService.cs` | Added `TrackAuthorizationFailure()` |
| `features/support/api-helpers.ts` | Added auth header support |
| `api/README.md` | Added security documentation |
| `docs/authentication-implementation-plan.md` | Marked completed items |
| `.github/copilot-instructions.md` | Added branch closing checklist |
| `CLAUDE.md` | Added branch closing checklist |

## Security Summary

| Endpoint Pattern | Protection | Role Required |
|-----------------|------------|---------------|
| `/api/manage/*` | ? Protected | `admin` |
| `/api/dashboard` | ? Protected | `admin` |
| `/api/projects/*` | ? Public | None |
| `/admin/*` (frontend) | ? Protected | `authenticated` |

## Acceptance Criteria

- [x] All admin endpoints require authentication (enforced by middleware)
- [x] Admin endpoints require "admin" role (enforced by middleware)
- [x] Public endpoints remain accessible without authentication
- [x] Structured error responses with codes
- [x] Authorization failures logged via telemetry
- [x] E2E test helpers support auth header injection
- [x] API builds without errors
- [x] Unit tests pass
- [x] Documentation updated

## Next Steps

1. Run E2E tests with `npm run swa:start` + `npm run test:smoke`
2. Verify middleware works in deployed environment
3. Delete this file before merging to `develop`
