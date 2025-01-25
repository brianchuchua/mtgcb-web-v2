# TODOs

## Now

- Start porting over mtgcb-web to this project, using the latest React best practices
- Reduce number of /auth/me calls if appropriate

## Later

- Clean up this README -- make a separate TODO file?
- Continue writing front-end tests -- paused them to focus on feature work since the app is so simple to validate manually
- Evaluate if e2e tests should mock less and test the full stack in the test environment -- or perhaps both in different tests ("page level" unit tests vs "full stack" tests)
- Sentry integration
- Performance testing
- Switch from Google reCAPTCHA to Cloudflare Turnstile
- TODO hunting

## UX Thoughts

- How to best handle filters and searching on mobile? How do other tools do it?
- Let's make UX changes as we port components over.
- Need a main landing page that doesn't suck. It needs a large call-to-action to register and show off the features of the site.
