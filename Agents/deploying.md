# Deploying — garage

Use this skill for CI/CD, hosting, and production rollout.

## Infrastructure
- Host: Azure Static Web Apps
- Domain: `garage.app.amazing-ai.tools`
- Repo: `https://github.com/amazing-ai-tools/garage`
- Runner label: `vps-garage`
- Workflow: `.github/workflows/deploy.yml`

## Required GitHub Configuration
- Variables: `APP_DISPLAY_NAME`, `APP_DOMAIN`, `BUGZERO_APP_KEY`, `BUGZERO_WIDGET_URL`, `RUNNER_LABEL`
- Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`

## Commands
- Install: `npm ci`
- Build: `npm run build`
- Local preview: `npm run preview`

## Notes
- Self-hosted runner registration was skipped during provisioning because no GitHub PAT was supplied.
- Never commit `.env` or deployment tokens.
