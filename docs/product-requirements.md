# Wedding Platform — Product Requirements

## Project Overview

This project is a full-stack wedding website and guest management application for a wedding taking place on April 11, 2027 at the Water Works in Philadelphia.

The application serves two purposes:

1. Provide wedding guests with a polished, easy-to-use source of wedding information and RSVP functionality.
2. Serve as a professional software engineering portfolio project demonstrating front-end development, back-end development, database design, authentication, testing, accessibility, responsive design, version control, and deployment.

## Primary Users

### Wedding Guests

Guests should be able to:

* View wedding information.
* Learn about the venue and event schedule.
* View travel, hotel, transportation, and parking information.
* Read frequently asked questions.
* Access registry links.
* Submit an RSVP.
* View the members of their invitation or household.
* Indicate which invited guests will attend.
* Submit meal selections.
* Submit dietary restrictions when necessary.
* Provide information for an invited plus-one when applicable.
* Review their RSVP before submission.
* Return later and update their RSVP before the RSVP deadline.

### Administrators

The couple should be able to:

* Sign in securely.
* View overall RSVP statistics.
* View invited households and individual guests.
* Search and filter guests.
* See who is attending, declining, or has not yet responded.
* Review meal selections and dietary restrictions.
* Manage plus-one information.
* Add or edit guest information.
* Review individual RSVP submissions.
* Export guest information when needed.

## Public Site — Version 1

The initial public application should include:

* Home
* Our Story
* The Wedding
* Travel
* FAQ
* Registry
* RSVP

### Home

The homepage should include:

* Couple names.
* Wedding date.
* Venue.
* Hero photography.
* Wedding countdown.
* Navigation to major sections.
* Neoclassical architectural framing on larger displays.

## Design Direction

The visual style is **Neoclassical Luxe**.

The wedding is being hosted by Cescaphe at the Water Works in Philadelphia.

The design should combine:

* Neoclassical architecture.
* Elegant luxury styling.
* Modern web design.
* Traditional wedding design elements.
* Strong symmetry.
* Generous whitespace.
* Refined serif typography.
* Warm stone, ivory, cream, charcoal, and restrained metallic accents.

### Architectural Frame

On larger displays, the website should appear as though the visitor is viewing the content through a neoclassical architectural structure.

Decorative columns should remain fixed near the sides of the viewport while the primary site content scrolls between or behind them.

The architectural elements should frame the experience without interfering with navigation or content readability.

### Mobile Behavior

Side columns should not be displayed on small mobile screens.

Mobile layouts should prioritize:

* Readability.
* Navigation.
* Touch-friendly controls.
* Photography.
* Performance.
* Clear RSVP interactions.

The design should retain the same luxury identity without sacrificing usable screen space.

## RSVP — Version 1

The RSVP system will be one of the primary technical features of the application.

The expected guest flow is:

1. Find invitation.
2. Identify invited household or party.
3. Select which invited guests are attending.
4. Enter information for an invited plus-one when applicable.
5. Select meals for attending guests.
6. Provide dietary restrictions when applicable.
7. Answer any additional wedding questions.
8. Review the RSVP.
9. Submit the RSVP.
10. Receive confirmation.
11. Return later to modify the RSVP before the deadline.

Guests should not be required to create conventional username-and-password accounts.

The application should provide a secure method for accessing the appropriate invitation while preventing guests from modifying another household's RSVP.

## Administrative Dashboard — Version 1

The administrative dashboard should initially provide:

* Total invited guests.
* Total attending.
* Total declined.
* Total awaiting response.
* Meal totals.
* Dietary restriction visibility.
* Guest search.
* Guest filtering.
* Household management.
* RSVP detail views.

Additional administrative functionality may be added later based on actual wedding-planning needs.

## Engineering Goals

The project should demonstrate:

* React application development.
* Next.js application architecture.
* TypeScript.
* Responsive user interface development.
* Reusable component design.
* Server-side application logic.
* Relational database design.
* Authentication and authorization.
* Form validation.
* Error handling.
* Accessibility.
* Automated testing.
* Git feature branches.
* Meaningful Git commit history.
* GitHub Issues and pull requests.
* Production deployment.
* Documentation.

## Development Philosophy

Features should be implemented incrementally.

Commits should represent meaningful units of work rather than large batches of unrelated changes.

The repository history should clearly demonstrate the progression from planning and architecture through implementation, testing, refinement, and deployment.
