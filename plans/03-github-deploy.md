# 03 — GitHub Repo + GitHub Pages Deployment

## Context
Deploy the bill-split app to GitHub Pages at `<user>.github.io/chill-bill/`.

## Steps

### 1. Install & authenticate `gh` CLI
- User runs: `! brew install gh && gh auth login`
- This is interactive so the user must run it themselves

### 2. Fix project config
- **`package.json`** — rename from `bill-split-temp` to `chill-bill`
- **`vite.config.ts`** — add `base: '/chill-bill/'` so assets resolve correctly under the GitHub Pages subpath

### 3. Create GitHub Actions workflow
- **New file:** `.github/workflows/deploy.yml`
- Uses the official GitHub Pages approach:
  - Trigger on push to `main`
  - Install deps, build, upload artifact, deploy to Pages
  - Uses `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`

### 4. Git init + first commit
- `git init` (already done)
- Stage all files, create initial commit
- Clean up leftover Vite template files (`src/App.css`, `src/assets/`)

### 5. Create repo + push
- `gh repo create chill-bill --public --source=. --push`

### 6. Enable GitHub Pages
- `gh api repos/{owner}/chill-bill -X PATCH -f pages.build_type=workflow` (or via Pages settings)

### Files to modify
1. `package.json` — name field
2. `vite.config.ts` — add `base`
3. `.github/workflows/deploy.yml` — new file

### Verification
- Push triggers the workflow
- `gh run watch` to monitor
- Site live at `https://<user>.github.io/chill-bill/`
