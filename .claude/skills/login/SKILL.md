# Login

A skill that automates browser-based login flows by navigating to a URL, locating credential input fields, submitting the form, and verifying successful authentication.

## Inputs

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| url | string | Yes | The full URL of the login page to navigate to |
| username | string | Yes | The username or email address to enter into the login form |
| password | string | Yes | The password to enter into the login form |
| username_selector | string | No | CSS or XPath selector for the username input field; defaults to common patterns if omitted |
| password_selector | string | No | CSS or XPath selector for the password input field; defaults to common patterns if omitted |
| submit_selector | string | No | CSS or XPath selector for the submit button; defaults to common patterns if omitted |
| success_indicator | string | No | URL fragment, page title, or element selector used to confirm a successful login |

## Outputs

| Field | Type | Description |
| --- | --- | --- |
| success | boolean | Whether the login attempt was detected as successful |
| current_url | string | The URL of the page after the login attempt completed |
| error | string | Human-readable error message if the login failed or an unexpected state was encountered |

## Example

```json
{
  "url": "https://app.example.com/login",
  "username": "alice@example.com",
  "password": "s3cur3P@ssword",
  "username_selector": "#email",
  "password_selector": "#password",
  "submit_selector": "button[type='submit']",
  "success_indicator": "/dashboard"
}
```

Expected output:

```json
{
  "success": true,
  "current_url": "https://app.example.com/dashboard",
  "error": null
}
```

## Constraints

- A running browser context (e.g., Playwright or Puppeteer) must be available in the execution environment.
- The target login page must be reachable from the network where the skill is executed.
- Multi-factor authentication (MFA) flows are not supported; the skill handles single-step username/password forms only.
- CAPTCHA-protected login pages may cause the skill to fail or hang.
- Credentials are consumed as plain-text inputs; ensure secrets are passed via environment variables or a secrets manager rather than hard-coded values.
- The `success_indicator` check is a best-effort heuristic (URL substring or element presence); complex post-login redirects may require a custom selector.