# MTG CB Web v2

## Overview

Next.js web app for Magic: The Gathering Collection Builder - Track collections with TCGPlayer pricing.

## For Every Feature (Once I Confirm It's Complete)

- First run `yarn type-check` to ensure TypeScript types are correct
- Run `date` command to get the current date
- Update the version number using semver conventions in `package.json` and `src/app/changelog/changelog.ts`
  - Only read the first ~60 lines of changelog.ts to see the current version and format (no need to read the entire file)
  - The headers auto-update based on what's in the changelog.ts file
  - Use the current date from the `date` command for the changelog entry
  - Update the minor version if it's a feature, and the patch version if it's a bug fix
  - IMPORTANT: Write changelog entries in user-friendly language, avoiding technical jargon
    - Good: "Fixed pagination text wrapping to two lines on wider screens"
    - Bad: "Fixed pagination text wrapping by allowing dynamic width expansion for item range display"
  - After updating, provide a commit message under 50 characters in this style: "feat: add feature name here"

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
- `yarn test` - Jest unit tests
- `yarn test:e2e` - Playwright E2E tests
- `yarn test:e2e tests/path/to/test.ts` - Run specific test file

## E2E Testing (Playwright)

### Prerequisites

- Local web server running (`yarn dev`)
- Local API server running
- After Playwright updates: `yarn playwright install chromium`

### Workflow

1. Write/run the specific test file: `yarn test:e2e tests/path/to/test.ts`
2. Run full suite to catch regressions: `yarn test:e2e`

### Test File Location

- E2E tests live in `/tests/` with subdirectories mirroring features
- Example: `/tests/browse/browse.e2e.test.ts`, `/tests/login.test.ts`

### Writing Tests

```typescript
import { expect, test } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    await expect(page.getByTestId('element-id')).toBeVisible();
  });
});
```

### Key Patterns

- **Use `data-testid` attributes** for reliable element selection
- **Scope selectors** when elements repeat (e.g., pagination top/bottom):
  ```typescript
  const paginationTop = page.getByTestId('pagination-top');
  await paginationTop.getByTestId('pagination-next').click();
  ```
- **Mock API calls** for auth/mutation tests:
  ```typescript
  await page.route('http://local.mtgcb.com:5000/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { userId: '123' } }),
    });
  });
  ```
- **Wait for dynamic content** with `waitForFunction`:
  ```typescript
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="card-name"]').length > 0,
    { timeout: 10000 }
  );
  ```

## Agent-Driven Manual Testing

A separate test suite under `tests/manual/` for **agent-driven exploratory verification** of user stories. These are **not** regression tests — they exist so an AI agent (or a human) can drive a flow end-to-end, capture screenshots, and inspect outcomes without writing brittle assertions.

### Why a separate suite?

- Regular e2e tests assert specific behavior and gate CI. They fail loudly if anything regresses.
- Manual tests **explore and capture state**. They take screenshots, log structured observations, and let a reviewer (Claude or human) inspect the output.
- Mixing them dilutes both: assertion-driven suites get noisy with screenshots, and exploratory suites get pruned every time someone tightens a flaky assertion.
- Best practice (2026): keep them separate. Industry-standard visual-regression tooling (Playwright's `toHaveScreenshot`, Chromatic, Percy) is *also* separate from functional e2e. We're doing the same with a lighter-weight pattern.

### Do NOT add `tests/manual/` to the regular e2e run.

`yarn test:e2e` continues to run only `tests/` (excluding `tests/manual/`). Manual tests are run on-demand:

```bash
yarn test:manual                                 # the whole suite
yarn test:manual tests/manual/goals/goal-flow.e2e.test.ts   # a single story
```

### File layout

```
tests/manual/
  <user-story>/
    <flow>.e2e.test.ts
```

One file per *flow*, grouped under the user story it belongs to. Examples:

- `tests/manual/browse/cards-grid.e2e.test.ts`
- `tests/manual/browse/jump-to-set-menu.e2e.test.ts`
- `tests/manual/goals/goal-flow.e2e.test.ts`
- `tests/manual/collection/edit-cards.e2e.test.ts`

Screenshots go to `test-results/manual-screenshots/<descriptive-name>.png` (gitignored).

### The pattern

```typescript
import { test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('User story: <one sentence>', () => {
  // For auth'd flows, skip cleanly when the JWT isn't set.
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('happy path: <flow description>', async ({ page }) => {
    // Listen for the React errors that matter — hook ordering, etc.
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (text.includes('Rendered more hooks') || text.includes('Rendered fewer hooks')
          || text.includes('Rules of Hooks') || text.includes('hook order')) {
        reactErrors.push(text);
      }
    });

    await page.goto('/some-route');
    await page.waitForLoadState('networkidle');

    // Snapshot at meaningful moments.
    await page.screenshot({ path: shot('01-landing'), fullPage: false });

    // Drive the flow: click, type, navigate.
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: shot('02-after-click') });

    // Emit structured observations the agent can grep out of `--reporter=line` output.
    console.log(JSON.stringify({
      url: page.url(),
      reactErrors,
      label: 'flow-result',
    }));
  });
});
```

### How the agent inspects results

When run with `--reporter=line`, the `console.log(JSON.stringify(...))` lines surface inline. The agent reads them out of the test output (Bash result) and inspects screenshots with the Read tool (PNG files render as images for vision-capable models). Examples:

```bash
yarn test:manual tests/manual/goals/goal-flow.e2e.test.ts --reporter=line
# Read tool: test-results/manual-screenshots/goal-03-after-switch.png
```

### Conventions / checklist for new manual tests

- **One file per flow.** Don't pack 12 tests into one file — they're tedious to inspect.
- **Use `fullPage: false` by default.** Top-of-page is usually what matters; `fullPage: true` for verifying scroll content.
- **Wait for *content* before screenshotting**, not just `networkidle`. Virtualized tables/grids populate lazily — wait for `>= N rows/items` before capturing.
- **Always log structured JSON** at decision points: URLs after navigation, counts, geometry data. Use a `label` field so the agent can grep specific entries.
- **Always listen for console errors** — at minimum the React hook-ordering ones. Check the array at the end and `expect(reactErrors).toEqual([])` if you want it to actually *fail* on regression. Otherwise just log it.
- **For auth'd flows**, use `test.skip(!getLocalTestJwt(), ...)` so the test doesn't fail when the JWT isn't set.
- **Keep them stable.** If the screenshot would only make sense in your specific dev DB, note that in a comment so future-you (or future-Claude) doesn't go chasing imaginary regressions.

### When to write a new manual test

- After a non-trivial refactor of a user-facing flow (hook restructure, component swap, big re-render-path change).
- When you suppress a lint rule with "this is intentional, here's why" — write a manual test that exercises the path the suppression protects.
- When the regular e2e suite passes but you want a human-or-agent eyeball on visual layout (popper anchoring, grid spacing, etc.).
- When debugging a flaky bug — the captured screenshots become the bug-report attachment.

### When *not* to write one

- Pure unit logic, validation rules, API responses → use jest or regular e2e.
- Anything you'd want CI to fail on → write a regular e2e in `tests/`.

## Code Conventions

- Functional components with arrow functions: `const Component = () => {}`
- Interfaces after components that use them
- Top-down readability (main logic first, helpers below)
- Descriptive names, self-documenting (no comments unless essential)
- Defensive programming with null checks
- MUI styled components for styling

### Info Icons (Click Behavior Only)

All info icons must use **click behavior with Popovers**, not hover tooltips, for mobile compatibility:

```tsx
// 1. Add state for the popover anchor
const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

// 2. Use IconButton with onClick (NOT Tooltip with hover)
<IconButton
  size="small"
  onClick={(e) => setAnchorEl(e.currentTarget)}
  sx={{
    padding: 0,
    color: 'action.disabled',
    '&:hover': {
      backgroundColor: 'transparent',
      color: 'primary.main',
    },
  }}
>
  <InfoOutlinedIcon fontSize="small" />
</IconButton>

// 3. Add Popover at component level (NOT nested in other components)
<Popover
  open={Boolean(anchorEl)}
  anchorEl={anchorEl}
  onClose={() => setAnchorEl(null)}
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'center',
  }}
  transformOrigin={{
    vertical: 'top',
    horizontal: 'center',
  }}
>
  <Box sx={{ p: 2, maxWidth: 300 }}>
    <Typography variant="body2" component="div">
      Info text here
    </Typography>
  </Box>
</Popover>
```

**Key requirements:**
- NEVER use `<Tooltip>` for info icons (not mobile-friendly)
- ALWAYS use `component="div"` on Typography to avoid hydration errors
- Place Popover at the same level as main component return (not inside Dialogs/nested components)

### Field Length Validation (REQUIRED)

All text input fields **MUST** enforce API character limits using HTML `maxLength` attribute:

```tsx
<TextField
  {...register('fieldName', {
    maxLength: { value: LIMIT, message: 'Error message' }
  })}
  slotProps={{
    htmlInput: {
      maxLength: LIMIT,  // REQUIRED - prevents typing beyond limit
    },
  }}
/>
```

**Common Limits:**
- Short text (username, email, location/goal names): 255
- Long text (descriptions): 1000
- Search fields (card name, oracle text, artist): 2000
- File uploads (CSV import): 30MB

### Numeric Input Validation (REQUIRED)

All numeric inputs that hit the API **MUST** clamp and mirror the API's bounds. Import constants from `@/utils/validationLimits`:

```tsx
import { COLLECTION_QUANTITY_MAX, COLLECTION_QUANTITY_MIN, clampCollectionQuantity } from '@/utils/validationLimits';

<TextField
  type="number"
  onChange={(e) => setValue(clampCollectionQuantity(parseInt(e.target.value) || 0))}
  inputProps={{ min: COLLECTION_QUANTITY_MIN, max: COLLECTION_QUANTITY_MAX }}
/>
```

**Numeric Limits (must match mtgcb-api-v3):**
- Collection quantities (set mode): 0..9999
- Collection quantity deltas (increment mode): -9999..9999
- Goal target quantities: 1..9999

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

## Notion Integration

Claude Code has access to the project's Notion workspace via the Notion MCP plugin. The main task tracking database is **MTG CB - Action Items**.

### Creating Tickets

Use the `mcp__plugin_Notion_notion__notion-create-pages` tool with `data_source_id: "291e7f6b-51f2-8051-84be-000bea5a5d69"` to create tickets. Required/common properties:

- **Name** (title) - ticket description
- **Type** - Bug, Feature, Enhancement, Tech Debt, Data Issue, Infrastructure, Chore, New Set
- **Status** - Captured (default for new), Planned, In Progress, Done, Won't Do
- **Priority** - P0 (This Week), P1 (This Month), P2 (This Quarter), P3 (Someday)
- **Source** - Patron, Sentry, Facebook, Email, Internal, Other, Wagers
- **Blocked** - "Blocked" if blocked (optional)

**Preference:** Put detailed context in the **page body content** (not the Notes property). Use the `content` field when creating tickets.

### Searching/Reading Tickets

- Use `mcp__plugin_Notion_notion__notion-search` to find tickets by keyword
- Use `mcp__plugin_Notion_notion__notion-fetch` with a page ID to read full ticket details
- Use `mcp__plugin_Notion_notion__notion-query-database-view` to query filtered views

## Important Notes

- All authenticated routes require auth token
- ReCAPTCHA required for auth flows
- Collection endpoints marked "UNUSED" should be avoided
- Use existing patterns when adding new features
- Defensive null checks throughout components
