---
applyTo: '**'
---

# Texas Build Pros - Development Instructions

## Core Principles

Follow these principles in order of priority:

1. **Security First** - All code must be secure by default
2. **Mobile Responsiveness** - All UI must be mobile-friendly (mobile-first approach)
3. **Accessibility** - All UI must be accessible (WCAG 2.1 AA)
4. **Localization** - All user-facing text must be localizable
5. **Documentation** - All code must be fully documented
6. **Observability** - Add logging, metrics, and telemetry
7. **SOLID Principles** - Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
8. **DRY (Don't Repeat Yourself)** - Avoid code duplication; extract reusable components, hooks, and utilities

---

## Documentation Requirements

### Consult Documentation Before Implementation

**ALWAYS** consult the relevant documentation in the `docs/` folder before starting any implementation:

| Task Type | Consult These Docs |
|-----------|-------------------|
| API Development | `docs/API-IMPLEMENTATION-PLAN.md`, `docs/authentication-implementation-plan.md` |
| Authentication/Security | `docs/authentication-implementation-plan.md`, `docs/API-IMPLEMENTATION-PLAN.md` (Security section) |
| Telemetry | `docs/API-APPLICATION-INSIGHTS-SETUP.md`, `docs/telemetry-implementation.md` |
| Local Development | `docs/LOCAL-DEVELOPMENT-GUIDE.md` |
| Environment Setup | `docs/ENVIRONMENT-SETUP-GUIDE.md`, `docs/ENVIRONMENT-QUICK-START.md` |
| Deployment | `docs/Deployment.md` |

### Keep Documentation Updated

**Before closing any feature branch**, ensure:

1. **Update relevant docs** if the implementation changes any documented behavior
2. **Add new documentation** for new features or patterns
3. **Mark completed items** in implementation checklists (e.g., `docs/authentication-implementation-plan.md`)
4. **Remove `IMPLEMENTATION_PLAN.md`** from repo root (it's branch-specific)

### Documentation Structure

```
docs/
├── API-IMPLEMENTATION-PLAN.md          # API endpoints, data models, security architecture
├── API-APPLICATION-INSIGHTS-SETUP.md   # Backend telemetry configuration
├── authentication-implementation-plan.md # Full auth implementation checklist
├── ENVIRONMENT-SETUP-GUIDE.md          # Environment configuration
├── ENVIRONMENT-QUICK-START.md          # Quick environment commands
├── LOCAL-DEVELOPMENT-GUIDE.md          # Local dev setup
├── telemetry-implementation.md         # Frontend telemetry details
└── Deployment.md                       # Deployment procedures
```

---

## Feature Branch Closing Checklist

**Before merging any feature branch to `develop`**, verify ALL of the following:

### Required Checks

```bash
# 1. Build succeeds
cd api && dotnet build
npm run build

# 2. All unit tests pass
npm run test:unit

# 3. E2E tests pass (run against SWA CLI)
npm run swa:start  # In terminal 1
npm run test:smoke # In terminal 2

# 4. Accessibility tests pass
npm run test:a11y:unit
```

### Checklist

- [ ] **API builds without errors** (`cd api && dotnet build`)
- [ ] **Frontend builds without errors** (`npm run build`)
- [ ] **Unit tests pass** (`npm run test:unit`)
- [ ] **E2E smoke tests pass** (`npm run test:smoke`)
- [ ] **Accessibility tests pass** (`npm run test:a11y:unit`)
- [ ] **Documentation updated** (see Documentation Requirements above)
- [ ] **`IMPLEMENTATION_PLAN.md` deleted** (it's branch-specific)

### CI Will Also Verify

The CI pipeline (`azure-static-web-apps-*.yml`) runs on every PR and will block merge if:
- Unit tests fail
- Build fails
- E2E smoke tests fail
- Accessibility tests fail
- CodeQL security scan fails

---

## Security Requirements

### Authorization - Frontend (UI)

1. **Hide, Don't Disable**: Unauthorized features must be **hidden entirely**, not shown as disabled
2. **Conditional Rendering**: Check permissions before rendering menu items, buttons, pages
3. **Route Guards**: Redirect unauthorized route access attempts
4. **No Client-Side Trust**: UI hiding is for UX only; always enforce server-side

```tsx
// ✅ Correct: Hide unauthorized features
{hasPermission('users:manage') && <MenuItem>Manage Users</MenuItem>}

// ❌ Incorrect: Don't just disable
<MenuItem disabled={!hasPermission('users:manage')}>Manage Users</MenuItem>
```

### Authorization - Backend (API)

1. **Tenant Isolation**: Every request scoped to authenticated tenant
2. **Role Validation**: Return `403 Forbidden` for unauthorized access
3. **Deny by Default**: No implicit permissions
4. **Audit Logging**: Log all authorization failures and data modifications

```csharp
[Authorize(Policy = "RequireAdminRole")]
[TenantScoped]
public async Task<IActionResult> ManageUsers() { ... }
```

### API Error Codes

Always return structured error responses with error codes, NOT hardcoded messages:

```csharp
// ✅ Correct: Use error codes for localization
return new ApiError 
{
    Code = "PROJECT_NOT_FOUND",
    Message = "Project not found", // Default English, client localizes by code
    Details = new { ProjectId = id }
};

// ❌ Incorrect: Hardcoded messages that can't be localized
return BadRequest("The project you requested was not found");
```

Standard error codes:
- `AUTH_REQUIRED` - Authentication required
- `AUTH_FORBIDDEN` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Resource does not exist
- `VALIDATION_FAILED` - Input validation error
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

---

## Code Documentation

All code must be fully documented:

### TypeScript/JavaScript (JSDoc)

```typescript
/**
 * Fetches published projects for the public portfolio.
 * 
 * @description Retrieves all projects with status 'published', 
 * sorted by completion date descending. Results are cached for 5 minutes.
 * 
 * @returns Promise resolving to array of published projects
 * @throws {ApiError} When the API request fails
 * 
 * @example
 * const { data: projects, isLoading } = usePublishedProjects();
 */
export function usePublishedProjects() { ... }
```

### C# (.NET XML Documentation)

```csharp
/// <summary>
/// Retrieves all published projects for public display.
/// </summary>
/// <remarks>
/// Projects are filtered by IsPublished=true and sorted by CompletionDate descending.
/// This endpoint is publicly accessible without authentication.
/// </remarks>
/// <returns>A list of published projects with public-safe fields only.</returns>
/// <response code="200">Returns the list of projects</response>
/// <response code="500">If an internal error occurs</response>
[HttpGet]
[ProducesResponseType(typeof(IEnumerable<ProjectDto>), StatusCodes.Status200OK)]
public async Task<IActionResult> GetPublishedProjects() { ... }
```

### Requirements Checklist

- [ ] Mobile-first CSS approach (base styles for mobile, add complexity with breakpoints)
- [ ] All interactive elements have minimum 44x44px touch targets
- [ ] Navigation is accessible on all screen sizes (hamburger menu for mobile)
- [ ] Forms are usable on mobile (appropriate input sizes, spacing)
- [ ] Tables adapt to mobile (card layout or horizontal scroll)
- [ ] Images are responsive (`max-w-full h-auto` or `object-fit`)
- [ ] Text is readable without zooming (minimum 16px body text)
- [ ] No horizontal scrolling on any viewport
- [ ] Test on actual mobile devices, not just browser dev tools
- [ ] Admin section is fully functional on mobile devices

---

## Accessibility (a11y)

All UI components must be accessible (WCAG 2.1 AA minimum):

### Semantic HTML

```tsx
// ✅ Correct: Use semantic elements
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/portfolio">Portfolio</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Project Title</h1>
    <p>Description...</p>
  </article>
</main>

// ❌ Incorrect: Divs for everything
<div class="nav">
  <div class="link">Portfolio</div>
</div>
```

### Interactive Elements

```tsx
// ✅ Correct: Accessible button with keyboard support
<button
  onClick={handleSubmit}
  aria-label="Submit contact form"
  aria-busy={isSubmitting}
  disabled={isSubmitting}
>
  {isSubmitting ? 'Sending...' : 'Send Message'}
</button>

// ✅ Correct: Icon button with label
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" aria-hidden="true" />
</button>
```

### Requirements Checklist

- [ ] Semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`)
- [ ] Proper ARIA attributes where semantic HTML is insufficient
- [ ] Keyboard navigation for all interactive elements
- [ ] Focus management for modals, dropdowns, dynamic content
- [ ] Visible focus indicators (never `outline: none` without replacement)
- [ ] Sufficient color contrast (4.5:1 for text, 3:1 for large text)
- [ ] Alt text for all images and meaningful icons
- [ ] Screen reader support with labels and live regions
- [ ] Skip links for main content
- [ ] Form labels associated with inputs

---

## Localization (i18n)

All user-facing text must be localizable:

### Translation Keys

```tsx
// ✅ Correct: Use translation keys
import { useTranslation } from 'react-i18next';

function ContactForm() {
  const { t } = useTranslation();
  
  return (
    <form>
      <label htmlFor="name">{t('contact.form.name.label')}</label>
      <input 
        id="name"
        placeholder={t('contact.form.name.placeholder')}
      />
      <button type="submit">{t('contact.form.submit')}</button>
    </form>
  );
}

// ❌ Incorrect: Hardcoded strings
function ContactForm() {
  return (
    <form>
      <label>Your Name</label>
      <input placeholder="Enter your name" />
      <button type="submit">Send Message</button>
    </form>
  );
}
```

### Error Messages from API

```tsx
// ✅ Correct: Localize error codes from API
function handleApiError(error: ApiError) {
  const { t } = useTranslation();
  
  // Map error codes to localized messages
  const message = t(`errors.${error.code}`, { 
    defaultValue: t('errors.UNKNOWN'),
    ...error.details 
  });
  
  toast.error(message);
}

// Translation file (en.json)
{
  "errors": {
    "PROJECT_NOT_FOUND": "Project not found",
    "AUTH_REQUIRED": "Please sign in to continue",
    "AUTH_FORBIDDEN": "You don't have permission to do that",
    "VALIDATION_FAILED": "Please check your input and try again",
    "UNKNOWN": "Something went wrong. Please try again."
  }
}
```

### Requirements Checklist

- [ ] Never hardcode user-facing strings
- [ ] Use translation keys with react-i18next
- [ ] Support RTL layouts (CSS logical properties)
- [ ] Format dates/numbers/currencies per locale
- [ ] Account for text expansion (30-50% longer than English)
- [ ] Externalize strings to resource files
- [ ] Use ICU message format for pluralization

---

## Logging and Metrics

### Frontend Telemetry

```tsx
import { appInsights } from '@/lib/telemetry';

// ✅ Track user actions
function handleProjectView(projectId: string) {
  appInsights.trackEvent({
    name: 'ProjectViewed',
    properties: { projectId }
  });
}

// ✅ Track errors
function handleError(error: Error, context: string) {
  appInsights.trackException({
    exception: error,
    properties: { context }
  });
}
```

### Backend Logging

```csharp
// ✅ Structured logging with context
_logger.LogInformation(
    "Project created: {ProjectId} by {UserId}", 
    project.Id, 
    userId
);

// ✅ Audit logging for sensitive operations
_auditLogger.LogDataModification(
    action: "ProjectDeleted",
    resourceType: "Project",
    resourceId: projectId,
    userId: userId,
    details: new { Reason = reason }
);

// ✅ Authorization failure logging
_logger.LogWarning(
    "Authorization failed: {UserId} attempted {Action} on {Resource}",
    userId, action, resourceId
);
```

---

## Testing Requirements

### Coverage Requirements

- **Minimum 90% code coverage** for all new code
- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<ProjectCard project={mockProject} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Authorization Testing

```typescript
// Test unauthorized access returns 403
it('should return 403 for non-admin users', async () => {
  const response = await request(app)
    .get('/api/admin/projects')
    .set('Authorization', `Bearer ${userToken}`);
  
  expect(response.status).toBe(403);
  expect(response.body.code).toBe('AUTH_FORBIDDEN');
});

// Test feature hiding
it('should hide admin link for non-admin users', () => {
  render(<Header />, { user: regularUser });
  expect(screen.queryByText('Admin')).not.toBeInTheDocument();
});
```

---

## File Structure for New Features

```
src/
├── components/
│   └── FeatureName/
│       ├── FeatureName.tsx      # Component with JSDoc
│       ├── FeatureName.test.tsx # Unit tests (90%+ coverage)
│       └── index.ts             # Barrel export
├── hooks/
│   └── use-feature.ts           # Custom hook with JSDoc
├── locales/
│   ├── en/
│   │   └── feature.json         # English translations
│   └── es/
│       └── feature.json         # Spanish translations
└── types/
    └── feature.ts               # TypeScript interfaces

api/
├── Functions/
│   └── FeatureFunction.cs       # XML documented endpoint
├── Services/
│   └── FeatureService.cs        # Business logic with logging
└── Models/
    └── FeatureDto.cs            # Data transfer objects
```

---

## GitFlow Branch Management

This project uses **GitFlow** for branch management. **Always follow these rules when creating branches:**

### Branch Creation Rules

| Branch Type | Create From | Merge To | Naming Pattern |
|-------------|-------------|----------|----------------|
| `feature/*` | `develop` | `develop` | `feature/descriptive-name` |
| `release/*` | `develop` | `main` + `develop` | `release/x.y.z` |
| `hotfix/*` | `main` | `main` + `develop` | `hotfix/x.y.z` |
| `bugfix/*` | `develop` | `develop` | `bugfix/descriptive-name` |

### Critical Rules

1. **NEVER create feature branches from `main`** - Always branch from `develop`
2. **Feature branches merge back to `develop`** - Not directly to `main`
3. **Only `release/*` and `hotfix/*` branches touch `main`**
4. **Hotfixes must be merged to both `main` AND `develop`**

### Merge Process (REQUIRED)

**⚠️ NEVER merge branches directly via `git merge`** - Always create a Pull Request:

1. **Push the branch** to origin
2. **Create a PR** to `develop` using `gh pr create` or GitHub web UI
3. **Wait for CI** checks to pass (unit tests, E2E tests, build, CodeQL)
4. **Merge via GitHub** (not locally) - use squash merge for feature branches

```bash
# ✅ Correct: Push branch and create PR
git push origin feature/my-feature
gh pr create --base develop --head feature/my-feature \
  --title "feat: description" --body "Details..."

# Wait for CI to pass, then merge via GitHub UI or:
gh pr merge --squash

# ❌ Incorrect: Never do this
git checkout develop
git merge feature/my-feature  # WRONG - bypasses CI and branch protection
git push origin develop
```

**Why PRs are required:**
- CI pipeline validates the changes (tests, build, security scan)
- Branch protection rules are enforced
- Code review can happen before merge
- Full audit trail of changes in GitHub

### Branch Commands

```bash
# Start a new feature (always from develop)
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Or using git-flow CLI
git flow feature start my-feature

# Push and create PR (DO NOT merge locally)
git push origin feature/my-feature
gh pr create --base develop --head feature/my-feature

# After CI passes, merge via GitHub UI or CLI
gh pr merge --squash
```

### When Creating Branches Programmatically

When using GitHub API or MCP tools to create branches:

```typescript
// ✅ Correct: Feature branch from develop
create_branch({
  branch: "feature/admin-mobile-responsive",
  from_branch: "develop"  // ALWAYS develop for features
})

// ❌ Incorrect: Feature branch from main
create_branch({
  branch: "feature/admin-mobile-responsive",
  from_branch: "main"  // NEVER do this for features
})
```

---

## Implementation Plan Workflow

**Before starting work on any new feature branch**, create an implementation plan:

### Required Steps

1. **Create `IMPLEMENTATION_PLAN.md`** at the repository root with:
   - Feature description and goals
   - Numbered task checklist with checkboxes
   - Files to be created/modified
   - Testing requirements
   - Acceptance criteria

2. **Follow the plan** - Check off each item as progress is made:
   ```markdown
   ## Tasks
   - [x] 1. Install dependencies
   - [x] 2. Create utility function
   - [ ] 3. Add unit tests
   - [ ] 4. Update documentation
   ```

3. **Resume work easily** - When returning to a branch, read `IMPLEMENTATION_PLAN.md` to see where you left off

4. **Remove before merging** - Delete `IMPLEMENTATION_PLAN.md` before merging the feature branch to `develop`

### Template

```markdown
# Implementation Plan: [Feature Name]

## Overview
[Brief description of the feature and its goals]

## Tasks
- [ ] 1. [First task]
- [ ] 2. [Second task]
- [ ] 3. [Third task]

## Files to Modify
- `path/to/file.ts` - [what changes]
- `path/to/another.ts` - [what changes]

## Testing Requirements
- [ ] Unit tests for [component/function]
- [ ] E2E tests for [user flow]
- [ ] Accessibility tests

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

### Benefits

- **Continuity**: Both Copilot and Claude can read the plan to understand context
- **Progress tracking**: Know exactly where work left off
- **Clean merges**: No plan files in develop/main branches
