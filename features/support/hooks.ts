import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { ApiHelpers } from './api-helpers.js';

// Set default timeout to 30 seconds
setDefaultTimeout(30 * 1000);

let browser: Browser;

/**
 * Custom World class for sharing state across step definitions.
 * 
 * @description Provides access to Playwright browser/page instances,
 * API helpers for test data management, and mock authentication utilities.
 * All test resources created through apiHelpers are automatically cleaned up
 * after each scenario.
 */
export class CustomWorld extends World {
  page!: Page;
  context!: BrowserContext;
  baseUrl: string;
  apiHelpers!: ApiHelpers;

  constructor(options: IWorldOptions) {
    super(options);
    // SWA CLI runs on 4280, dev server on 8080
    this.baseUrl = process.env.BASE_URL || 'http://localhost:4280';
  }

  /**
   * Helper to login via SWA mock auth.
   * 
   * @description The SWA CLI provides a mock authentication endpoint that
   * simulates Azure AD login. This method navigates to that endpoint and
   * fills out the mock login form.
   * 
   * For deployed SWA slots (non-localhost), it uses the x-ms-client-principal
   * header injection approach instead.
   * 
   * @param userId - The mock user ID
   * @param userDetails - Additional user details (roles, idp, etc.)
   */
  async loginAsMockUser(userId: string = 'test-user', userDetails?: Record<string, string>) {
    const details = userDetails || {
      userId,
      userIdp: 'aad',
      userRoles: 'authenticated,anonymous',
    };
    
    // Check if running against deployed SWA (not localhost)
    const isDeployed = !this.baseUrl.includes('localhost');
    
    if (isDeployed) {
      // For deployed SWA slots, inject x-ms-client-principal header
      // This header is trusted by SWA for authentication simulation
      const clientPrincipal = {
        identityProvider: details.userIdp || 'aad',
        userId: details.userId || userId,
        userDetails: details.userId || userId,
        userRoles: (details.userRoles || 'authenticated,admin').split(/[,\n]/).map(r => r.trim()),
        claims: [],
      };
      
      const encodedPrincipal = Buffer.from(JSON.stringify(clientPrincipal)).toString('base64');
      
      // Set the header for all subsequent requests in this context
      await this.context.setExtraHTTPHeaders({
        'x-ms-client-principal': encodedPrincipal,
      });
      
      console.log('Using x-ms-client-principal header for deployed SWA authentication');
      return;
    }
    
    // SWA CLI mock auth endpoint (localhost only)
    const mockAuthUrl = `${this.baseUrl}/.auth/login/aad?post_login_redirect_uri=/`;
    
    try {
      await this.page.goto(mockAuthUrl, { timeout: 10000 });
      
      // Wait for the form to be ready
      await this.page.waitForLoadState('domcontentloaded');
      
      // The SWA CLI mock auth page has multiple fields:
      // 1. First, an identity provider selector (may be a datalist)
      // 2. Then username, user ID, roles, claims fields
      
      // Wait a moment for the page to stabilize
      await this.page.waitForTimeout(500);
      
      // Try to find and fill the username field (not the identity provider field)
      const usernameInput = this.page.locator('input#username, input[name="username"]');
      const userIdInput = this.page.locator('input#userId, input[name="userId"]');
      const userRolesInput = this.page.locator('input#userRoles, input[name="userRoles"], textarea#userRoles, textarea[name="userRoles"]');
      
      // Fill username if visible
      if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await usernameInput.fill(details.userId || userId);
      }
      
      // Fill userId if visible and separate from username
      if (await userIdInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Leave auto-generated or set explicitly
        const currentValue = await userIdInput.inputValue();
        if (!currentValue) {
          await userIdInput.fill(details.userId || userId);
        }
      }
      
      // Fill roles if visible
      if (await userRolesInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await userRolesInput.fill(details.userRoles || 'authenticated\nadmin');
      }
      
      // Submit the form
      const submitButton = this.page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        await this.page.waitForLoadState('domcontentloaded');
        // Wait for redirect
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      // If mock auth fails, continue anyway - tests should handle unauthenticated state
      console.warn('Mock auth navigation failed:', error);
    }
  }
}

setWorldConstructor(CustomWorld);

BeforeAll(async function () {
  browser = await chromium.launch({
    headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
  });
});

AfterAll(async function () {
  await browser?.close();
});

Before(async function (this: CustomWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
  // Initialize API helpers for test data management
  this.apiHelpers = new ApiHelpers(this.baseUrl);
});

After(async function (this: CustomWorld) {
  // Clean up any test data created during the scenario
  try {
    const cleanupResult = await this.apiHelpers?.cleanup();
    if (cleanupResult && (cleanupResult.projectsDeleted > 0 || cleanupResult.imagesDeleted > 0)) {
      console.log(`Test cleanup: Deleted ${cleanupResult.projectsDeleted} projects, ${cleanupResult.imagesDeleted} images`);
    }
  } catch (error) {
    console.warn('Warning: Test cleanup encountered an error:', error);
  }

  await this.page?.close();
  await this.context?.close();
});
