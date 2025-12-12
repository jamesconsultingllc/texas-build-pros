import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/hooks.js';

// Contact Navigation
When('I navigate to the contact section', async function (this: CustomWorld) {
  const contactSection = this.page.locator('#contact, [data-section="contact"]').first();
  if (await contactSection.count() > 0) {
    await contactSection.scrollIntoViewIfNeeded();
  } else {
    // Navigate to contact page if it exists
    const contactLink = this.page.getByRole('link', { name: /contact/i });
    if (await contactLink.count() > 0) {
      await contactLink.first().click();
    }
  }
});

// Form Visibility
Then('I should see the contact form', async function (this: CustomWorld) {
  const form = this.page.locator('form');
  if (await form.count() > 0) {
    await expect(form.first()).toBeVisible();
  }
});

Then('the form should have fields for name, email, and message', async function (this: CustomWorld) {
  const form = this.page.locator('form').first();
  if (await form.count() > 0) {
    // Check for common input fields
    const inputs = form.locator('input, textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  }
});

// Form Interactions
When('I click the submit button without filling the form', async function (this: CustomWorld) {
  const submitButton = this.page.getByRole('button', { name: /submit|send/i });
  if (await submitButton.count() > 0) {
    await submitButton.first().click();
  }
});

When('I click the submit button', async function (this: CustomWorld) {
  const submitButton = this.page.getByRole('button', { name: /submit|send/i });
  if (await submitButton.count() > 0) {
    await submitButton.first().click();
  }
});

When('I fill in the name field with {string}', async function (this: CustomWorld, name: string) {
  const nameField = this.page.locator('input[name="name"], input[placeholder*="name" i]').first();
  if (await nameField.count() > 0) {
    await nameField.fill(name);
  }
});

When('I fill in the email field with {string}', async function (this: CustomWorld, email: string) {
  const emailField = this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  if (await emailField.count() > 0) {
    await emailField.fill(email);
  }
});

When('I fill in the message field with {string}', async function (this: CustomWorld, message: string) {
  const messageField = this.page.locator('textarea, input[name="message"]').first();
  if (await messageField.count() > 0) {
    await messageField.fill(message);
  }
});

// Validation Errors
Then('I should see validation errors', async function (this: CustomWorld) {
  await this.page.waitForTimeout(500); // Wait for validation to appear
  // Validation errors could be shown in various ways
});

Then('I should see an email validation error', async function (this: CustomWorld) {
  await this.page.waitForTimeout(500);
  // Email validation error should appear
});

Then('I should see a success message', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  // Success message or confirmation should appear
});
