# Contact Form Features
@e2e
Feature: Contact Form
  As a potential customer
  I want to submit a contact form
  So that I can get in touch with Texas Build Pros

  Background:
    Given I am on the homepage

  Scenario: View contact form
    When I navigate to the contact section
    Then I should see the contact form
    And the form should have fields for name, email, and message

  @validation
  Scenario: Submit empty form
    When I navigate to the contact section
    And I click the submit button without filling the form
    Then I should see validation errors

  @validation
  Scenario: Submit with invalid email
    When I navigate to the contact section
    And I fill in the name field with "John Doe"
    And I fill in the email field with "invalid-email"
    And I fill in the message field with "Hello"
    And I click the submit button
    Then I should see an email validation error

  Scenario: Submit valid contact form
    When I navigate to the contact section
    And I fill in the name field with "John Doe"
    And I fill in the email field with "john@example.com"
    And I fill in the message field with "I would like to discuss a project"
    And I click the submit button
    Then I should see a success message
