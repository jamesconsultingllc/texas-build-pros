# Homepage Features
@e2e
Feature: Homepage
  As a visitor to Texas Build Pros website
  I want to see information about the company
  So that I can learn about their services

  Background:
    Given I am on the homepage

  @smoke
  Scenario: View hero section
    Then I should see the hero section
    And the hero section should contain a call to action

  @smoke
  Scenario: View navigation
    Then I should see the navigation header
    And the navigation should contain links to main pages

  Scenario: View services section
    When I scroll to the services section
    Then I should see the available services

  Scenario: View portfolio preview
    When I scroll to the portfolio section
    Then I should see featured projects

  @smoke
  Scenario: View footer
    Then I should see the footer
    And the footer should contain contact information
