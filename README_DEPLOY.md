# Deploying sewrica-cafe-frontend

This file explains deployment options and required secrets.

Recommended: Vercel (easy GitHub integration) or Netlify. You can also deploy a Docker image built by the workflow.

Required GitHub Secrets for automatic deploy:
- `VERCEL_TOKEN` (create from your Vercel account)
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (found on your Vercel project settings)

If you prefer Vercel integration (no Actions needed):
1. Connect the `sewrica-cafe-frontend` repository in Vercel.
2. Set environment variables (if any) in Vercel Dashboard.
3. Vercel will deploy on every push to `main`.
