# Security Audit — garage

Use this skill for security reviews and hardening.

## Current Risk Surface
- Static React app served by Azure Static Web Apps.
- GitHub Actions deployment secrets and variables.
- BugZero widget script.
- npm dependencies.

## Review Checklist
- No secrets in committed files.
- `.env` remains local-only.
- External scripts are intentional and isolated.
- User-provided text is not rendered as unsafe HTML.
- Workflow permissions are least-privilege.
- Dependencies are current enough and free of known high-impact CVEs.

## Future Backend Checklist
- Auth/session handling.
- Authorization and tenant isolation.
- Input validation.
- Rate limiting.
- Secret storage and rotation.
