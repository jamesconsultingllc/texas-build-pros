# Portfolio Features
@e2e
Feature: Portfolio
  As a potential customer
  I want to browse the project portfolio
  So that I can see examples of completed work

  @smoke
  Scenario: View portfolio page
    Given I am on the portfolio page
    Then I should see the portfolio heading
    And I should see project cards or empty state

  Scenario: View project details
    Given I am on the portfolio page
    When I click on a project card
    Then I should be navigated to the project detail page
    And I should see project images
    And I should see project description

  Scenario: Filter projects by category
    Given I am on the portfolio page
    When I select a project category filter
    Then I should only see projects in that category

  Scenario: Navigate back to portfolio
    Given I am viewing a project detail
    When I click the back button
    Then I should be on the portfolio page
