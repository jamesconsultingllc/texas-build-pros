---
applyTo: '**'
---

# Texas Build Pros - Development Instructions

## Core Principles

Follow these principles in order of priority:

1. **Security First** - All code must be secure by default
2. **Accessibility** - All UI must be accessible (WCAG 2.1 AA)
3. **Localization** - All user-facing text must be localizable
4. **Documentation** - All code must be fully documented
5. **Observability** - Add logging, metrics, and telemetry

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

### Documentation Requirements

- **Functions/Methods**: Purpose, parameters, return values, exceptions
- **Classes/Interfaces**: Purpose and usage patterns
- **Complex Logic**: Inline comments for non-obvious algorithms
- **Public APIs**: Request/response examples
- **Configuration**: All environment variables documented

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
