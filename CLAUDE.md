# MTG CB Web v2

## Overview

Next.js web app for Magic: The Gathering Collection Builder - Track collections with TCGPlayer pricing.

## For Every Feature (Once I Confirm It's Complete)

- Update the version number using semver conventions in `package.json` and `src/data/changelog.ts`
  - The headers auto-update based on what's in the changelog.ts file
  - Update the minor version if it's a feature, and the patch version if it's a bug fix

## Tech Stack

- Next.js 15 + React 19
- MUI 6 + Emotion
- Redux Toolkit + RTK Query
- TypeScript (strict mode)
- React Hook Form + React Virtuoso
- Playwright testing

## Commands

- `yarn dev` - Development server
- `yarn build` - Production build
- `yarn type-check` - TypeScript checking
- `yarn lint` - ESLint
- `yarn test` - Run tests

## Code Conventions

- Functional components with arrow functions: `const Component = () => {}`
- Interfaces after components that use them
- Top-down readability (main logic first, helpers below)
- Descriptive names, self-documenting (no comments unless essential)
- Defensive programming with null checks
- MUI styled components for styling

## Project Structure

```
/src/api/         - RTK Query endpoints
/src/app/         - Next.js pages
/src/components/  - Reusable UI components
/src/features/    - Feature modules
/src/redux/       - Store & slices
/src/types/       - TypeScript types
/src/utils/       - Utilities
```

## Architecture

```
Pages → Features → API (RTK Query) → Backend
```

## Key Pages

### Public Pages

- `/` - Home page
- `/browse` - Cards/sets browser with filters
- `/browse/cards/[cardSlug]/[cardId]` - Individual card details
- `/collections/[userId]` - Public collection view
- `/collections/[userId]/cards/[cardSlug]/[cardId]` - Card details in collection context

### Auth Required Pages

- `/collections/edit-cards` - Quick quantity updates
- `/account` - User settings
- `/import` - Import collection data
- `/export` - Export collection data
- `/goals` - Collection goals management
- `/locations` - Physical storage tracking

## API Structure

### Local Routes

- `/src/app/api/` - Handle reCAPTCHA validation

### Backend API (RTK Query)

Uses `NEXT_PUBLIC_MTGCB_API_BASE_URL` environment variable

### Main Endpoints

- **Auth**: login, logout, register, forgot-password, reset-password
- **Browse**: cards/search, sets/search, sets/types
- **Collection**: update, mass-update, summary, export, import, nuke
- **Locations**: CRUD operations, hierarchy, cards-in-location
- **Goals**: CRUD operations with progress tracking

## Important Notes

- All authenticated routes require auth token
- ReCAPTCHA required for auth flows
- Collection endpoints marked "UNUSED" should be avoided
- Use existing patterns when adding new features
- Defensive null checks throughout components
