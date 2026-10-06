# Playwright Codegen (Teachnation)

Playwright Codegen is a local development tool for recording browser actions against the deployed Teachnation site. It does not run inside Vercel's serverless runtime and does not change the live site by itself.

## Requirements

- Node.js and npm installed locally
- Internet access for `npx` to download the Playwright CLI on first use

## Record a browser flow

From the repository root, run:

```bash
node scripts/playwright-codegen.mjs
```

By default, Codegen opens `https://teachnation.in` and saves the generated Playwright Test script to `tests/e2e/recorded.spec.ts`.

To target a Vercel preview or another URL:

**PowerShell**

```powershell
$env:PLAYWRIGHT_BASE_URL="https://YOUR-VERCEL-PREVIEW.vercel.app"
node scripts/playwright-codegen.mjs
```

**macOS/Linux**

```bash
PLAYWRIGHT_BASE_URL="https://YOUR-VERCEL-PREVIEW.vercel.app" node scripts/playwright-codegen.mjs
```

To save to a different file, set `PLAYWRIGHT_CODEGEN_OUTPUT` before running the script. Review generated selectors and assertions before using the recording in CI. Do not record real passwords, payment details, or personal data.

## Run the recorded test

Codegen's generated output uses the Playwright Test runner. Install it as a development dependency and install Chromium:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
npx playwright test tests/e2e/recorded.spec.ts
```

Run Codegen locally against the deployed Vercel URL; pushing this helper/docs to GitHub does not itself run browser tests or deploy a change to the site's application code.