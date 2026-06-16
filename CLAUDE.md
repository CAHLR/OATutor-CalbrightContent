# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OATutor is an open-source adaptive tutoring web application built on Bayesian Knowledge Tracing (BKT). It integrates with Canvas LMS via LTI and optionally logs data to Firebase Firestore. This repo is the Calbright-specific fork of the main OATutor platform.

## Commands

### Frontend (React)

```bash
npm start          # Dev server on port 3001 (runs preprocessProblemPool.js first)
npm run build      # Production build (also runs preprocessor first)
npm run build-localhost  # Build with PUBLIC_URL=/ for local serving
npm test           # Jest tests (also runs preprocessor first)
npm run deploy     # Build + deploy to GitHub Pages
```

The `prestart`/`prebuild`/`pretest` hooks all run `node src/tools/preprocessProblemPool.js` automatically — this generates `generated/processed-content-pool/oatutor.json` from the content submodule.

### Middleware (Express / AWS Lambda)

```bash
cd aws/lti-middleware
npm install
node index.js          # Local server
# PM2 for production: uses ecosystem.config.js / ecosystem.dev.config.js
```

## Architecture

### Content Pipeline

Problem content lives in `src/content-sources/oatutor/` (a git submodule pointing to OATutor-Content). Before the app can run, `src/tools/preprocessProblemPool.js` reads the raw JSON from that submodule and writes a merged `generated/processed-content-pool/oatutor.json`. The React app imports only from the generated file — never directly from the submodule at runtime.

Content structure inside the submodule:
- `content-pool/` — problem JSON files organized by skill
- `bkt-params/` — per-skill BKT parameters (prior, learn, guess, slip)
- `skillModel.json` — maps problem IDs to knowledge components (KCs)
- `coursePlans.json` — lesson/course definitions used by both frontend and middleware

### Frontend Data Flow

```
App.js → Platform.js → Problem.js / ProblemCard.js
```

- **`src/config/config.js`** — central feature flags (`ENABLE_FIREBASE`, `AB_TEST_MODE`, `ENABLE_BOTTOM_OUT_HINTS`, BKT parameters, A/B assignment logic). Nearly all behavioral toggles live here.
- **`common/global-config.js`** — shared constants (`SITE_NAME`, `CONTENT_SOURCE`, `SESSION_SYSTEM`) used by both frontend and middleware via the `@common/global-config` path alias.
- **`src/platform-logic/Platform.js`** — orchestrates the lesson flow: fetches the processed content pool, runs BKT updates, selects the next problem via heuristics, tracks progress in browser storage.
- **`src/models/BKT/BKT-brain.js`** — BKT algorithm (prior/learn/guess/slip update). Problem selection heuristics are in `src/models/BKT/problem-select-heuristics/`.
- **`src/components/Firebase.js`** — all Firestore read/write operations. Logging is gated by `DO_LOG_DATA` in config.
- **`src/platform-logic/checkAnswer.js`** — answer validation supporting algebraic (via `algebrite`), numeric (via `expr-eval`), and string comparison modes.
- **`src/platform-logic/renderText.js`** — custom renderer that handles LaTeX (`react-katex`), MathLive, dynamic text substitution, and HTML body types.

### Path Aliases

`jsconfig.paths.json` and `config-overrides.js` (react-app-rewired) define:
- `@components/*` → `src/components/*`
- `@generated/*` → `generated/*`
- `@common/global-config` → `common/global-config.js`

### LTI Middleware (`aws/lti-middleware/`)

A standalone Express server (deployable as AWS Lambda via `serverless-http`) that:
1. Handles LTI 1.1 launch from Canvas (`ims-lti`)
2. Issues JWTs for session authentication
3. Stores session state in DynamoDB
4. Routes students to lessons based on `coursePlans.json`
5. Generates personalized messages via OpenAI (`routes/personalizedMessage.js`)
6. Logs to Firebase Admin SDK server-side

The middleware URL is injected into the React app via `REACT_APP_MIDDLEWARE_URL`.

### A/B Testing

Controlled entirely in `src/config/config.js` via `AB_TEST_MODE`. When enabled, students are assigned to conditions based on a hash of their user ID. Experimental BKT params, hint pathways, and problem-selection heuristics can be swapped per condition without changing core logic.

## Key Environment Variables

See `.env.example`. Important ones for local dev:
- `PORT` — defaults to `3001` for the React dev server
- `REACT_APP_BUILD_TYPE` — controls build-time feature gating (`development`, `platform-staging`, etc.)
- `REACT_APP_MIDDLEWARE_URL` — LTI middleware endpoint
- `REACT_APP_FIREBASE_*` — Firebase SDK credentials (populated in `src/config/firebaseConfig.js`)

## Content Submodule

If the submodule is not initialized, run:
```bash
git submodule update --init --recursive
```

After pulling changes to the content submodule, re-run the preprocessor manually:
```bash
node src/tools/preprocessProblemPool.js
```

## Deployment Branches

- `main` — production
- `staging` — auto-deployed to OATutor-Staging via GitHub Actions
- `daniel-lin-frontend` — current active development branch

CI/CD lives in `.github/workflows/`. Production and staging deployments push to GitHub Pages.
