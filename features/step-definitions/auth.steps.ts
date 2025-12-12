import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/hooks.js';

// Authentication Steps
Given('I am logged in as a test user', async function (this: CustomWorld) {
  await this.loginAsMockUser('test-user');
});

Given('I am logged in as an admin', async function (this: CustomWorld) {
  await this.loginAsMockUser('admin-user', {
    userId: 'admin-user',
    userIdp: 'aad',
    userRoles: 'authenticated,anonymous,admin',
  });
});

Given('I am not logged in', async function (this: CustomWorld) {
  // Just navigate without auth - cookie should not exist
  await this.page.goto(this.baseUrl);
});

When('I click the login button', async function (this: CustomWorld) {
  const loginButton = this.page.getByRole('button', { name: /login|sign in/i })
    .or(this.page.getByRole('link', { name: /login|sign in/i }));
  
  if (await loginButton.count() > 0) {
    await loginButton.first().click();
  }
});

When('I click the logout button', async function (this: CustomWorld) {
  const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i })
    .or(this.page.getByRole('link', { name: /logout|sign out/i }));
  
  if (await logoutButton.count() > 0) {
    await logoutButton.first().click();
  }
});

Then('I should see the login button', async function (this: CustomWorld) {
  const loginButton = this.page.getByRole('button', { name: /login|sign in/i })
    .or(this.page.getByRole('link', { name: /login|sign in/i }));
  await expect(loginButton.first()).toBeVisible();
});

Then('I should see my user profile', async function (this: CustomWorld) {
  // Look for user avatar, profile menu, or username display
  const userIndicator = this.page.locator('[data-testid="user-profile"]')
    .or(this.page.getByRole('button', { name: /profile|account/i }));
  
  await expect(userIndicator.first()).toBeVisible();
});

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  // SWA auth pages or login redirect
  const url = this.page.url();
  expect(url).toMatch(/\.auth|login/i);
});

Then('I should have access to admin features', async function (this: CustomWorld) {
  const adminLink = this.page.getByRole('link', { name: /admin|dashboard/i });
  await expect(adminLink.first()).toBeVisible();
});

Then('I should not have access to admin features', async function (this: CustomWorld) {
  const adminLink = this.page.getByRole('link', { name: /admin|dashboard/i });
  await expect(adminLink).toHaveCount(0);
});
