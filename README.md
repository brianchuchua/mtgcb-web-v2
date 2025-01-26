# TODOs

## Now

- Start porting over mtgcb-web to this project, using the latest React best practices
- Goals should probably be under Collection, as should be Locations
- Collection should better show that it's a dropdown and feel less awkward

## Later

- Reduce number of /auth/me calls if appropriate, keep an eye on it for now
- Clean up this README -- make a separate TODO file?
- Continue writing front-end tests -- paused them to focus on feature work since the app is so simple to validate manually
- Evaluate if e2e tests should mock less and test the full stack in the test environment -- or perhaps both in different tests ("page level" unit tests vs "full stack" tests)
- Sentry integration
- Performance testing
- Switch from Google reCAPTCHA to Cloudflare Turnstile
- TODO hunting
- Legal disclaimer

## Known Bugs

- Moderate: Logout isn't redirecting the user -- probably want them back to the login page.
- Minor (UX): I hate how the collection submenu behaves. Add a carat?
- Minor: When logging out of a page that requires authentication, redirectTo is set to the page you were on during logout.
- Minor: The background color of the sidenav is different on mobile.

## UX Thoughts

- How to best handle filters and searching on mobile? How do other tools do it?
- Let's make UX changes as we port components over.
- Need a main landing page that doesn't suck. It needs a large call-to-action to register and show off the features of the site.
