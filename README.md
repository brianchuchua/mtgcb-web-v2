# MTG Collection Builder - Frontend

This is the latest MTG CB front-end codebase.

I'm not actively looking for contributors until I knock out some tech debt, but if you're super excited about a new feature, reach out and we can talk about it.

## Setup

Dependencies:

- MTG CB API (v3)
- TODO: Prepare end-to-end test environment documentation and Docker setup for other developers

## OpenGraph Preview Testing

- http://local.mtgcb.com:3000/test-og (for local testing)

## Gotchas

- When updating an .env value in Heroku, you have to trigger a new build -- Next.js bakes env values at build time, not runtime.
