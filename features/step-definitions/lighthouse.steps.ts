import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import type { CustomWorld } from '../support/hooks.js';

/**
 * Lighthouse Step Definitions for Cucumber/Playwright
 *
 * Uses playwright-lighthouse for performance, accessibility, best practices, and SEO audits
 */

/**
 * Run full Lighthouse audit and check minimum scores
 */
Then('the page should pass Lighthouse audit with minimum scores:', async function (
  this: CustomWorld,
  dataTable: any
) {
  const thresholds = dataTable.rowsHash();

  // Convert string values to numbers
  const lighthouseOptions = {
    thresholds: {
      performance: parseInt(thresholds.performance || '50', 10),
      accessibility: parseInt(thresholds.accessibility || '90', 10),
      'best-practices': parseInt(thresholds['best-practices'] || '80', 10),
      seo: parseInt(thresholds.seo || '80', 10),
    },
    port: 9222, // Chrome DevTools port
  };

  await playAudit({
    page: this.page,
    thresholds: lighthouseOptions.thresholds,
    port: lighthouseOptions.port,
  });

  // If playAudit doesn't throw, the thresholds were met
  expect(true).toBe(true);
});

/**
 * Run Lighthouse audit for accessibility only
 */
Then('the page should have a Lighthouse accessibility score of at least {int}', async function (
  this: CustomWorld,
  minScore: number
) {
  await playAudit({
    page: this.page,
    thresholds: {
      accessibility: minScore,
    },
    port: 9222,
  });

  expect(true).toBe(true);
});

/**
 * Run Lighthouse audit for performance only
 */
Then('the page should have a Lighthouse performance score of at least {int}', async function (
  this: CustomWorld,
  minScore: number
) {
  await playAudit({
    page: this.page,
    thresholds: {
      performance: minScore,
    },
    port: 9222,
  });

  expect(true).toBe(true);
});

/**
 * Run Lighthouse audit for best practices
 */
Then('the page should have a Lighthouse best practices score of at least {int}', async function (
  this: CustomWorld,
  minScore: number
) {
  await playAudit({
    page: this.page,
    thresholds: {
      'best-practices': minScore,
    },
    port: 9222,
  });

  expect(true).toBe(true);
});

/**
 * Run Lighthouse audit for SEO
 */
Then('the page should have a Lighthouse SEO score of at least {int}', async function (
  this: CustomWorld,
  minScore: number
) {
  await playAudit({
    page: this.page,
    thresholds: {
      seo: minScore,
    },
    port: 9222,
  });

  expect(true).toBe(true);
});

/**
 * Run Lighthouse audit for all categories with custom thresholds
 */
Then('the page should meet Lighthouse thresholds', async function (this: CustomWorld) {
  // Default WCAG 2.1 AA compliance targets
  await playAudit({
    page: this.page,
    thresholds: {
      performance: 50, // Performance is secondary to accessibility
      accessibility: 90, // WCAG 2.1 AA target
      'best-practices': 80,
      seo: 80,
    },
    port: 9222,
  });

  expect(true).toBe(true);
});
