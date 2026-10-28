# Wedding Platform

A full-stack wedding website and guest management application for an April 11, 2027 wedding at the Water Works in Philadelphia.

## Project Goals

- Create a polished, production-ready wedding website for real guests.
- Build a complete RSVP and guest management system.
- Develop the project using professional software engineering practices.
- Document the full development process through Git commits, branches, issues, and pull requests.
- Use the finished application as a portfolio project for software engineering opportunities.

## Design Direction

The visual direction is **Neoclassical Luxe**, inspired by the architecture of the Water Works in Philadelphia.

The site will combine:

- Elegant neoclassical architecture
- Modern luxury web design
- Traditional wedding styling
- Fixed architectural columns framing the desktop experience
- A clean, simplified mobile layout without side columns

## Planned Technology

The site uses Next.js, React, TypeScript, Tailwind CSS, Vercel hosting, and Neon PostgreSQL.

## Local RSVP testing

Run `npm run dev` and open `/#rsvp`. The default is a browser-only sample flow. To test persisted sample invitations, run `npm run rsvp:setup-preview` after saving the local Neon credential in the ignored `.env.database.local` file, then restart the dev server. Private sample codes are saved in ignored `.env.rsvp-demo-codes.json`.

See [database setup and deployment modes](db/README.md) for migrations, secure access, testing, and the requirements before real guest RSVPs open. The real guest list and credentials must never be committed.

Run `npm test` for unit tests, `npm run test:rsvp-db` for database integration tests, and `npm run build` to verify the production build. Use Node.js 24.
