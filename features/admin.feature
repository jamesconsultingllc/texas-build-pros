# Admin Dashboard Features
@e2e @auth
Feature: Admin Dashboard
  As an administrator
  I want to access the admin dashboard
  So that I can manage projects and content

  Background:
    Given I am logged in as an admin

  @smoke
  Scenario: Access admin dashboard
    When I navigate to the admin dashboard
    Then I should see the admin dashboard
    And I should see the project management section

  Scenario: View project list
    When I navigate to the admin dashboard
    Then I should see a list of projects
    And each project should have edit and delete options

  Scenario: Create new project
    When I navigate to the admin dashboard
    And I click the "Add Project" button
    Then I should see the project creation form

  Scenario: Unauthorized user cannot access admin
    Given I am not logged in
    When I try to navigate to the admin dashboard
    Then I should be redirected to the login page
