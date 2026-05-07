## Ryza

Next.js app that stores product data and uploaded media **inside a GitHub repo**:

- **Products DB**: `public/data/products.json` (read/write via `app/api/products/route.ts`)
- **Uploads**: images/videos uploaded to `public/images/...` in the repo (via `app/api/upload` and `app/api/upload-video`)
- **Media serving**: files are served through the proxy route `app/api/images/[...path]/route.ts` as `/api/images/<path>`

## Why you see “GitHub storage not configured”

This project requires server-side environment variables to talk to GitHub’s API.
If any of these are missing, routes will warn/throw:

- `GITHUB_TOKEN`
- `GITHUB_REPO_OWNER`
- `GITHUB_REPO_NAME`
- `GITHUB_BRANCH` (optional, defaults to `main`)

The warning you mentioned is emitted in `app/api/products/route.ts` when reading products without config.

## Setup (local)

1. Create `.env.local` in the project root (do **not** commit it).
2. Copy values from `.env.example` and fill them.
3. Install and run:

```bash
npm install
npm run dev
```

## GitHub token requirements

Create a GitHub Personal Access Token (classic) or fine-grained token that can:

- **Read/Write repository contents** (needed for uploading images/videos and updating `products.json`)

If you’re using a fine-grained token, grant it access to the target repo and enable **Contents: Read and write**.