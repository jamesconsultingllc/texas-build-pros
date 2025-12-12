import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

// Set default timeout to 30 seconds
setDefaultTimeout(30 * 1000);

let browser: Browser;

// Custom World class for sharing state
export class CustomWorld extends World {
  page!: Page;
  context!: BrowserContext;
  baseUrl: string;

  constructor(options: IWorldOptions) {
    super(options);
    // SWA CLI runs on 4280, dev server on 8080
    this.baseUrl = process.env.BASE_URL || 'http://localhost:4280';
  }

  // Helper to login via SWA mock auth
  async loginAsMockUser(userId: string = 'test-user', userDetails?: Record<string, string>) {
    const details = userDetails || {
      userId,
      userIdp: 'aad',
      userRoles: 'authenticated,anonymous',
    };
    
    // SWA CLI mock auth endpoint
    const mockAuthUrl = `${this.baseUrl}/.auth/login/aad?post_login_redirect_uri=/`;
    await this.page.goto(mockAuthUrl);
    
    // Fill mock auth form if present
    const userIdInput = this.page.locator('input[name="userId"]');
    if (await userIdInput.count() > 0) {
      await userIdInput.fill(details.userId || userId);
      
      const userRolesInput = this.page.locator('input[name="userRoles"]');
      if (await userRolesInput.count() > 0 && details.userRoles) {
        await userRolesInput.fill(details.userRoles);
      }
      
      await this.page.locator('button[type="submit"]').click();
    }
    
    await this.page.waitForLoadState('networkidle');
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
});

After(async function (this: CustomWorld) {
  await this.page?.close();
  await this.context?.close();
});
