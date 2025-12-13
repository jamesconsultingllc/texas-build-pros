using System.Text.Json.Serialization;

namespace LegacyBuilders.Api.Models;

/// <summary>
/// Represents the Azure Static Web Apps client principal from the x-ms-client-principal header.
/// </summary>
/// <remarks>
/// Azure SWA injects this header for authenticated requests. The header value is Base64-encoded JSON.
/// This model deserializes that JSON payload to provide user identity and role information.
/// </remarks>
public class ClientPrincipal
{
    /// <summary>
    /// The identity provider used for authentication (e.g., "aad", "github", "twitter").
    /// </summary>
    [JsonPropertyName("identityProvider")]
    public string IdentityProvider { get; set; } = string.Empty;

    /// <summary>
    /// The unique user identifier from the identity provider.
    /// </summary>
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable user details (typically email or username).
    /// </summary>
    [JsonPropertyName("userDetails")]
    public string UserDetails { get; set; } = string.Empty;

    /// <summary>
    /// The roles assigned to the user.
    /// </summary>
    /// <remarks>
    /// Common roles include:
    /// - "anonymous" - All users (even unauthenticated)
    /// - "authenticated" - Any authenticated user
    /// - "admin" - Administrator role (custom role from Azure AD app registration)
    /// </remarks>
    [JsonPropertyName("userRoles")]
    public IEnumerable<string> UserRoles { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Additional claims from the identity provider.
    /// </summary>
    [JsonPropertyName("claims")]
    public IEnumerable<ClientPrincipalClaim> Claims { get; set; } = Array.Empty<ClientPrincipalClaim>();

    /// <summary>
    /// Checks if the user has a specific role (case-insensitive).
    /// </summary>
    /// <param name="role">The role to check for.</param>
    /// <returns>True if the user has the specified role.</returns>
    public bool IsInRole(string role) =>
        UserRoles.Contains(role, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Checks if the user has the admin role.
    /// </summary>
    public bool IsAdmin => IsInRole("admin");

    /// <summary>
    /// Checks if the user is authenticated (has any identity).
    /// </summary>
    public bool IsAuthenticated => !string.IsNullOrEmpty(UserId);
}

/// <summary>
/// Represents a claim from the identity provider.
/// </summary>
public class ClientPrincipalClaim
{
    /// <summary>
    /// The claim type (e.g., "name", "email").
    /// </summary>
    [JsonPropertyName("typ")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// The claim value.
    /// </summary>
    [JsonPropertyName("val")]
    public string Value { get; set; } = string.Empty;
}
