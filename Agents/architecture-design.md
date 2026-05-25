# Architecture Design — garage

Use this skill when changing the structure of the app or choosing product architecture.

## Current Architecture
- Vite/React frontend served by Azure Static Web Apps.
- FastAPI backend intended to run on the VPS.
- PostgreSQL is reached from the backend over the VPN through `DATABASE_URL`.
- BugZero widget settings are supplied by GitHub Actions variables/secrets.

## Guidance
- Keep the browser thin: no direct database access from React.
- Put persistence and validation in FastAPI.
- Use Alembic for every schema change.
- Document any new deploy/runtime dependency in `README.md`.
- Prefer boring, maintainable boundaries over speculative platform work.
