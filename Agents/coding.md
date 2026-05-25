# Coding — garage

Use this skill for focused implementation work in the garage repository.

## Stack
- React 18 + TypeScript + Vite 5
- FastAPI + SQLAlchemy + Alembic backend
- PostgreSQL on the VPN via `DATABASE_URL`
- lucide-react for icons
- Plain CSS in `src/styles.css`
- Frontend deployment through Azure Static Web Apps
- Backend deployment on the VPS

## Defaults
- Read the relevant file before editing.
- Keep components typed and small.
- Avoid adding routing, state libraries, or CSS frameworks unless the feature clearly needs them.
- Keep database access in the backend only.
- Preserve deploy-time BugZero widget integration.
- Run `pytest backend/tests/test_api.py -q`, `npm test`, and `npm run build` after meaningful full-stack changes.

## Key Files
- `src/main.tsx`
- `src/garage.ts`
- `src/styles.css`
- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `index.html`
- `package.json`
