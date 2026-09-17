# RSVP Workflow

## Purpose

The RSVP system should provide guests with a simple, secure way to respond to their invitation without requiring a traditional user account.

The workflow should support households, individual invitees, plus-ones, meal selections, dietary restrictions, and later RSVP updates.

## Guest Flow

### 1. Find Invitation

The guest begins on the RSVP page.

The application should ask for identifying information that allows the correct invitation to be located.

Possible identification methods may include:

* Invitation code
* Guest name
* Household name
* A combination of invitation code and guest information

The final identification strategy will be determined during the security and data-model design phase.

## 2. Display Invitation Party

Once the invitation is found, the application should display the people associated with that invitation.

Example:

* John Smith
* Jane Smith
* Emily Smith

The guest should clearly understand which people are included in the invitation.

## 3. Select Attendance

Each invited guest should be marked as:

* Attending
* Declining

The application should only request additional information for guests who are attending.

## 4. Plus-One Handling

Some invitations may allow an unnamed guest.

When a plus-one is allowed, the invited guest should be able to provide the plus-one's name.

The system should distinguish between:

* Named invited guests
* Unnamed plus-one allowances

A plus-one should not be available unless the invitation specifically permits one.

## 5. Meal Selection

Each attending guest should select a meal when required.

Potential meal options may include:

* Beef
* Chicken
* Fish
* Vegetarian

Final meal options will be updated when the venue menu is confirmed.

Meal selections should only appear for attending guests.

## 6. Dietary Restrictions

Attending guests should be able to provide dietary restrictions or allergies.

This information should be associated with the specific guest rather than only the household.

## 7. Additional Questions

The RSVP flow may include additional questions depending on wedding requirements.

Possible examples:

* Transportation needs
* Hotel accommodations
* Special accessibility needs
* Song requests

These questions should remain configurable rather than being tightly coupled to the core RSVP logic.

## 8. Review

Before submission, the guest should be shown a summary of the RSVP.

The review screen should clearly display:

* Attending guests
* Declining guests
* Plus-one information
* Meal selections
* Dietary restrictions
* Additional responses

The guest should be able to return to previous steps and make corrections.

## 9. Submit

After review, the RSVP is submitted and stored in the database.

The submission should:

* Validate all required fields.
* Prevent invalid guest or plus-one combinations.
* Store the RSVP securely.
* Record the submission or update time.
* Provide clear error messaging if the submission fails.

## 10. Confirmation

After a successful submission, the guest should see a confirmation screen.

A confirmation email may also be sent.

The confirmation should summarize the submitted RSVP.

## 11. Update Existing RSVP

Guests should be able to return before the RSVP deadline and modify their response.

The application should retrieve the existing RSVP and pre-populate the current selections.

Updates should replace or modify the appropriate existing records rather than creating duplicate RSVP submissions.

## RSVP Deadline

The system should support a configurable RSVP deadline.

After the deadline:

* Guests may be prevented from changing their RSVP.
* The couple may retain the ability to modify responses through the administrative dashboard.

The deadline should not be hard-coded into individual UI components.

## Security Requirements

The RSVP system should prevent:

* One household from accessing another household's invitation.
* Guests from adding people who were not invited.
* Unauthorized modification of another guest's RSVP.
* Guessing sequential invitation identifiers.
* Direct manipulation of RSVP URLs or parameters.

Sensitive internal database identifiers should not be exposed as the primary guest authentication mechanism.

## Validation Requirements

The system should validate:

* Invitation identity
* Attendance selections
* Plus-one eligibility
* Plus-one names when required
* Meal selections for attending guests
* Required additional questions
* RSVP deadline restrictions

Validation should occur both in the user interface and on the server.

Client-side validation should improve usability but should never be treated as the only security layer.

## Accessibility

The RSVP workflow should support:

* Keyboard navigation
* Screen readers
* Proper form labels
* Clear validation messages
* Visible focus states
* Touch-friendly controls
* Responsive layouts

## Mobile Experience

The RSVP system should be designed mobile-first.

Guests should be able to complete the entire RSVP comfortably from a phone without horizontal scrolling or small interaction targets.

## Administrative Impact

RSVP data should support administrative reporting such as:

* Total attending
* Total declined
* Total pending
* Meal counts
* Dietary restrictions
* Plus-one totals
* Household status
* Last RSVP update time

The data model should be designed so these values can be queried reliably without duplicating unnecessary data.
