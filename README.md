# garage

Application de suivi garage pour gerer les vehicules, depenses d'entretien,
pieces changees et rappels de maintenance.

## Stack

- Frontend: React 18, TypeScript, Vite, CSS simple.
- Backend: FastAPI, SQLAlchemy, Alembic.
- Database: PostgreSQL via `DATABASE_URL` (production actuelle: Postgres dedie sur le VPS, expose en localhost).
- Auth: Google OAuth gere par le backend, session en cookie `HttpOnly`.
- Deploy frontend: Azure Static Web Apps.
- Deploy backend: VPS, typiquement avec `uvicorn` derriere un reverse proxy.

## Configuration

Copier `.env.example` vers `.env` sur le VPS et renseigner les secrets locaux.
Ne jamais committer `.env`.

```bash
DATABASE_URL=postgresql+psycopg://garage_user:change-me@10.0.0.10:5432/garage
CORS_ORIGINS=https://garage.app.amazing-ai.tools,http://localhost:5173
APP_ORIGIN=https://garage.app.amazing-ai.tools
API_PUBLIC_ORIGIN=https://api.garage.app.amazing-ai.tools
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
SESSION_COOKIE_SECURE=true
VITE_API_BASE_URL=https://api.garage.app.amazing-ai.tools
```

Le frontend lit uniquement `VITE_API_BASE_URL`. Il ne doit jamais se connecter
directement a PostgreSQL.

Google Cloud OAuth doit autoriser:

- Authorized JavaScript origin: `https://garage.app.amazing-ai.tools`
- Authorized redirect URI: `https://api.garage.app.amazing-ai.tools/api/auth/google/callback`

## Backend local

```bash
python3 -m pip install -e '.[dev]' --break-system-packages
DATABASE_URL=sqlite:///./garage-dev.db alembic upgrade head
DATABASE_URL=sqlite:///./garage-dev.db uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

En production VPS actuelle:

- API publique: `https://api.garage.app.amazing-ai.tools`
- Service systemd: `garage-api.service`
- Reverse proxy: Caddy vers `127.0.0.1:8011`
- Env root-only: `/etc/garage/garage-api.env`
- PostgreSQL: conteneur Docker `garage-postgres`, port host `127.0.0.1:5451`

Si une base PostgreSQL VPN externe est fournie plus tard, remplacer seulement
`DATABASE_URL` dans `/etc/garage/garage-api.env`, lancer `alembic upgrade head`,
puis redemarrer `garage-api.service`.

## Frontend local

```bash
npm install --include=dev
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Verification

```bash
DATABASE_URL=sqlite:///./test-garage.db pytest backend/tests/test_api.py -q
npm test
npm run build
```

## Repository variables

Variables historiques du template BugZero/Azure Static Web Apps:

- `APP_DISPLAY_NAME`
- `APP_DOMAIN`
- `BUGZERO_APP_KEY`
- `BUGZERO_WIDGET_URL`
- `RUNNER_LABEL`
- `VITE_API_BASE_URL`

Secret Azure Static Web Apps:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
