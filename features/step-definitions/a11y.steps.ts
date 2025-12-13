import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CustomWorld } from '../support/hooks.js';

/**
 * Accessibility Step Definitions for Cucumber/Playwright
 *
 * Uses @axe-core/playwright for WCAG 2.1 AA compliance testing
 */

/**
 * Run accessibility audit and assert no violations
 */
Then('the page should have no accessibility violations', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

/**
 * Run accessibility audit with specific rules
 */
Then('the page should pass {string} accessibility checks', async function (this: CustomWorld, ruleType: string) {
  let tags: string[] = [];

  switch (ruleType.toLowerCase()) {
    case 'wcag2a':
      tags = ['wcag2a'];
      break;
    case 'wcag2aa':
      tags = ['wcag2a', 'wcag2aa'];
      break;
    case 'wcag21a':
      tags = ['wcag21a'];
      break;
    case 'wcag21aa':
      tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
      break;
    case 'best-practice':
      tags = ['best-practice'];
      break;
    default:
      tags = ['wcag2a', 'wcag2aa'];
  }

  const results = await new AxeBuilder({ page: this.page })
    .withTags(tags)
    .analyze();

  expect(results.violations).toEqual([]);
});

/**
 * Run accessibility audit on a specific region/element
 */
Then('the {string} should have no accessibility violations', async function (this: CustomWorld, selector: string) {
  // Convert common names to selectors
  const selectorMap: Record<string, string> = {
    'header': 'header',
    'navigation': 'nav',
    'footer': 'footer',
    'main content': 'main',
    'hero section': 'section.relative, h1',
  };

  const targetSelector = selectorMap[selector.toLowerCase()] || selector;

  const results = await new AxeBuilder({ page: this.page })
    .include(targetSelector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

/**
 * Check for specific accessibility features
 */
Then('all images should have alt text', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules(['image-alt'])
    .analyze();

  expect(results.violations).toEqual([]);
});

Then('all form inputs should have labels', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules(['label', 'label-title-only'])
    .analyze();

  expect(results.violations).toEqual([]);
});

Then('all interactive elements should have accessible names', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules(['button-name', 'link-name'])
    .analyze();

  expect(results.violations).toEqual([]);
});

Then('the page should have proper heading hierarchy', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules(['heading-order', 'page-has-heading-one'])
    .analyze();

  expect(results.violations).toEqual([]);
});

Then('the page should have sufficient color contrast', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules(['color-contrast'])
    .analyze();

  expect(results.violations).toEqual([]);
});

Then('the page should have proper ARIA attributes', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules([
      'aria-valid-attr',
      'aria-valid-attr-value',
      'aria-roles',
      'aria-required-children',
      'aria-required-parent',
    ])
    .analyze();

  expect(results.violations).toEqual([]);
});

Then('the page should have proper landmark regions', async function (this: CustomWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withRules([
      'landmark-one-main',
      'region',
      'landmark-unique',
      'landmark-no-duplicate-banner',
      'landmark-no-duplicate-contentinfo',
    ])
    .analyze();

  expect(results.violations).toEqual([]);
});

/**
 * Keyboard navigation checks
 */
Then('all interactive elements should be keyboard accessible', async function (this: CustomWorld) {
  // Check for elements with tabindex and proper focus management
  const results = await new AxeBuilder({ page: this.page })
    .withRules(['tabindex', 'focus-order-semantics'])
    .analyze();

  expect(results.violations).toEqual([]);
});

/**
 * Disable specific rules if needed (for known/accepted violations)
 */
Then('the page should have no accessibility violations except {string}', async function (
  this: CustomWorld,
  disabledRules: string
) {
  const rulesToDisable = disabledRules.split(',').map(rule => rule.trim());

  const results = await new AxeBuilder({ page: this.page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(rulesToDisable)
    .analyze();

  expect(results.violations).toEqual([]);
});
