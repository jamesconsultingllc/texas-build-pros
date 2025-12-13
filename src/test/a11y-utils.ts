import { axe } from 'vitest-axe';
import type { RenderResult } from '@testing-library/react';

/**
 * Default axe configuration for WCAG 2.1 AA compliance
 */
export const axeConfig = {
  rules: {
    // Enable WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'valid-lang': { enabled: true },
    'html-has-lang': { enabled: true },
    'label': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true },
    'link-name': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
  },
};

/**
 * Run axe accessibility audit on a rendered component
 *
 * @param container - The container element from React Testing Library's render result
 * @param config - Optional axe configuration (defaults to WCAG 2.1 AA)
 * @returns Axe results object
 *
 * @example
 * ```tsx
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   const results = await runAxe(container);
 *   expect(results).toHaveNoViolations();
 * });
 * ```
 */
export async function runAxe(
  container: Element,
  config = axeConfig
) {
  return await axe(container, config);
}

/**
 * Convenience helper to run axe on a React Testing Library render result
 *
 * @param renderResult - The result from React Testing Library's render()
 * @param config - Optional axe configuration
 * @returns Axe results object
 *
 * @example
 * ```tsx
 * it('should have no accessibility violations', async () => {
 *   const view = render(<MyComponent />);
 *   const results = await checkA11y(view);
 *   expect(results).toHaveNoViolations();
 * });
 * ```
 */
export async function checkA11y(
  renderResult: RenderResult,
  config = axeConfig
) {
  return await runAxe(renderResult.container, config);
}

/**
 * Custom axe configuration for form components
 * Includes additional form-specific accessibility rules
 */
export const formAxeConfig = {
  ...axeConfig,
  rules: {
    ...axeConfig.rules,
    'label-title-only': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'select-name': { enabled: true },
    'autocomplete-valid': { enabled: true },
  },
};

/**
 * Custom axe configuration for landmark regions
 * Focuses on proper page structure and navigation
 */
export const landmarkAxeConfig = {
  ...axeConfig,
  rules: {
    ...axeConfig.rules,
    'landmark-banner-is-top-level': { enabled: true },
    'landmark-complementary-is-top-level': { enabled: true },
    'landmark-contentinfo-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-unique': { enabled: true },
  },
};
