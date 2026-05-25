# Backend Testing — garage

Use this skill only if backend code or API integrations are introduced.

## Current State
The backend lives under `backend/` and uses FastAPI, SQLAlchemy, Alembic, and PostgreSQL.

## Expectations For Future Backend Work
- Unit tests for pure service logic.
- API tests for contracts and validation.
- Health-check coverage.
- Migration checks for schema changes.
- Use SQLite for fast local tests unless explicitly running a VPN/PostgreSQL smoke.

## Rule
Run `DATABASE_URL=sqlite:///./test-garage.db pytest backend/tests/test_api.py -q` after backend changes.
