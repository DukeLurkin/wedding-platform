# Wedding Platform — Initial Data Model

## Purpose

The data model should support the main wedding as well as optional additional events such as:

* Welcome gathering
* Rehearsal dinner
* After-party
* Day-after brunch

Not every guest will necessarily be invited to every event.

The model should allow event-specific invitations and RSVP responses without requiring major structural changes later.

## Core Entities

### InvitationParty

An `InvitationParty` represents a group of guests who receive and manage an invitation together.

Examples:

* A married couple
* A family
* An individual guest
* An individual guest with an allowed plus-one

Potential fields:

* id
* displayName
* invitationCode
* primaryContactGuestId
* createdAt
* updatedAt

## Guest

A `Guest` represents a specifically invited person.

Potential fields:

* id
* invitationPartyId
* firstName
* lastName
* email
* phone
* isPrimaryContact
* createdAt
* updatedAt

A Guest belongs to one InvitationParty.

Guest identity information should remain separate from RSVP response information.

## Event

An `Event` represents one wedding-related event.

Examples:

* Wedding ceremony and reception
* Welcome gathering
* Rehearsal dinner
* After-party
* Brunch

Potential fields:

* id
* name
* description
* date
* startTime
* endTime
* venueName
* address
* rsvpDeadline
* isPublic
* createdAt
* updatedAt

The main wedding should be represented as an Event rather than being hard-coded into RSVP logic.

## EventInvitation

An `EventInvitation` determines whether a specific guest is invited to a specific event.

Potential fields:

* id
* guestId
* eventId
* allowsPlusOne
* createdAt
* updatedAt

This allows different guests within the same InvitationParty to receive different event invitations if necessary.

For example, two members of an invitation party may both be invited to the wedding while only one is invited to another wedding-related event.

## RSVPResponse

An `RSVPResponse` represents a guest's response to a specific EventInvitation.

Potential fields:

* id
* eventInvitationId
* attending
* mealOptionId
* dietaryRestrictions
* submittedAt
* updatedAt

A response should be associated with the guest's invitation to a specific event rather than stored directly on the Guest record.

This keeps guest identity separate from event-specific decisions.

## PlusOne

A `PlusOne` represents an unnamed guest permitted by a specific EventInvitation.

Potential fields:

* id
* eventInvitationId
* firstName
* lastName
* attending
* mealOptionId
* dietaryRestrictions
* createdAt
* updatedAt

A plus-one should only be available when the related EventInvitation explicitly permits one.

Plus-one support should remain event-specific because a guest may be allowed to bring a guest to one event but not another.

## MealOption

A `MealOption` represents an available meal selection.

Potential fields:

* id
* eventId
* name
* description
* isActive
* createdAt
* updatedAt

Meal options should belong to an Event because different events may offer different menus.

## Relationship Summary

The major relationships are:

* InvitationParty has many Guests.
* Guest belongs to one InvitationParty.
* Guest has many EventInvitations.
* Event has many EventInvitations.
* Event has many MealOptions.
* EventInvitation belongs to one Guest.
* EventInvitation belongs to one Event.
* EventInvitation may permit a PlusOne.
* EventInvitation may have one RSVPResponse.
* RSVPResponse belongs to one EventInvitation.
* RSVPResponse may reference one MealOption.
* PlusOne belongs to one EventInvitation.
* PlusOne may reference one MealOption.

## Conceptual Relationship Diagram

```text
InvitationParty
    |
    +-- Guest
          |
          +-- EventInvitation -------- Event
                  |                       |
                  |                       +-- MealOption
                  |
                  +-- RSVPResponse
                  |
                  +-- PlusOne
```

## Design Decisions

### Separate Guest Identity from RSVP Data

Guest records represent people.

RSVPResponse records represent decisions those people make for a particular event.

These concerns should remain separate.

### Make Events First-Class Records

Wedding-related events should be stored as Event records rather than hard-coded into application logic.

This allows future events to be added without redesigning the database.

### Make Invitations Event-Specific

A guest may be invited to one event but not another.

EventInvitation provides the relationship between Guest and Event.

### Keep Plus-Ones Event-Specific

Plus-one eligibility may vary by event.

Plus-one permissions therefore belong to EventInvitation rather than Guest or InvitationParty.

### Avoid Premature Complexity

The model should support multiple events from the beginning, but additional event features should only be implemented when required by actual wedding plans.

The main wedding remains the primary V1 use case.

## Open Questions

The following decisions remain to be finalized:

* Whether invitation codes belong to InvitationParty or require a separate Invitation record.
* Whether RSVP history should be retained after updates.
* Whether event-specific custom questions require their own tables.
* Whether children require a distinct guest type.
* Whether meal selection is required for every event.
* Whether administrators need manually overridden RSVP states.
* How invitation lookup and authentication will be implemented securely.
