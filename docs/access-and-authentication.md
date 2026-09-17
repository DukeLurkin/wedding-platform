# Wedding Platform — Access and Authentication

## Purpose

The platform requires two different access models:

1. Guest access to wedding invitations and RSVP functionality.
2. Administrator access to private wedding-management tools.

These access models should remain separate because they serve different users and have different security requirements.

## Guest Access

Wedding guests should not be required to create traditional username-and-password accounts.

The guest RSVP experience should prioritize simplicity while still preventing unauthorized access to other invitations.

The platform will support two guest access methods.

### Primary Method: Unique Invitation Link

Each invitation party should receive a unique secure access link.

The link may also be represented as a QR code on a printed or digital invitation.

Example concept:

```text
https://example.com/rsvp/access/<secure-token>
```

The token should:

* Be randomly generated.
* Be sufficiently long to resist guessing.
* Not contain sequential database identifiers.
* Not expose internal record IDs.
* Be validated on the server.

The guest should be taken directly to the appropriate invitation party after the token is validated.

## Token Storage

Raw access tokens should not be stored directly in the database.

When an invitation token is generated:

1. Generate a cryptographically secure random token.
2. Provide the raw token in the guest invitation link.
3. Hash the token.
4. Store only the token hash in the database.

When the guest later accesses the link:

1. Receive the raw token.
2. Hash the incoming token using the same method.
3. Compare the hash with the stored value.
4. Load the matching invitation party only if validation succeeds.

This reduces exposure if the database is compromised.

## Fallback Method: Invitation Code and Last Name

Guests who do not have their direct invitation link should be able to visit the main RSVP page and manually locate their invitation.

The fallback flow should request:

* Invitation code
* Last name

Example invitation code:

```text
K7M4-PQ92
```

The server should validate both values before returning invitation information.

Invitation codes should:

* Be randomly generated.
* Avoid sequential patterns.
* Be difficult to guess.
* Be unique.
* Never be used as the database primary key.

## Authorization

Successfully finding an invitation does not grant access to unrelated invitation records.

Every RSVP read or update operation should verify that the guest-access credential belongs to the invitation party being requested.

Changing URLs, form values, or internal identifiers should never provide access to another party's information.

## Guest Session

After successful guest access, the platform may create a short-lived secure session so the guest does not need to repeatedly enter the invitation code during the RSVP workflow.

The final session implementation will be determined during application development.

Any guest session should:

* Be tied to one InvitationParty.
* Expire after an appropriate period.
* Use secure cookie settings.
* Be validated on the server.
* Never grant administrative permissions.

## Administrator Authentication

Administrators require traditional authenticated access.

Administrative users should be able to access:

* Guest records
* Invitation parties
* RSVP responses
* Event data
* Meal totals
* Dietary information
* Administrative editing tools

Guest invitation credentials must never grant administrator access.

## Administrator Authorization

Every administrative route or server action should verify that the current user has administrative permission.

Protecting only the visual dashboard is not sufficient.

Authorization must also occur on the server before sensitive data is returned or modified.

## Security Requirements

The access system should protect against:

* Sequential identifier guessing
* Unauthorized invitation access
* Modification of another invitation's RSVP
* Direct URL manipulation
* Forged form submissions
* Reuse of invalid or expired credentials where applicable
* Exposure of raw access tokens through database storage
* Administrative access through guest credentials

## Design Principle

The application should use the least amount of authentication friction appropriate for each user.

Guests need a simple invitation-access system.

Administrators need stronger authenticated access.

Security should be enforced by the server rather than relying only on the user interface.
