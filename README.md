> # THIS REPO DEPLOYS TO www.propagent.ai
>
> The live marketing site is built from `marketing/index.html` and `marketing/styles.css` in this repository. Everything else (HTML mockups under `propagent-monorepo/docs/mockups/`, sibling `propagent-marketing-v*` folders on Desktop) is **design scratch — not connected to deploy**. To change what visitors see at www.propagent.ai, edit files in **this** repo.
>
> **Workflow:**
> ```
> git checkout -b my-change         # branch per design iteration
> # edit marketing/index.html or marketing/styles.css
> npm run dev                       # live preview at localhost:3010 with hot reload
> git commit -am "..."              # commit when happy
> git push -u origin my-change      # opens PR; auto-builds a preview URL
> # merge PR → main → auto-deploys to www.propagent.ai
> ```
>
> The footer of the live site shows the current deployed version (e.g. `v18 · live`). If the live footer doesn't match what's on `main`, somebody bypassed the auto-deploy.

---

# Propagent marketing site

Vite + Firebase Hosting. The `marketing/` folder holds the static landing page; `dist/rfp-grader/` is a React subapp built by Vite and served at `/rfp-grader/`.

## Run locally

Prerequisites: Node.js.

```sh
npm install
# set GEMINI_API_KEY in .env.local
npm run dev   # http://localhost:3010
```

## Deploy

**Auto-deploy is the primary path.** Push to `main` → GitHub Actions builds and ships to the live channel of the `propagentlanding` Firebase project. PRs against `main` get an automatic preview-channel deploy (the bot comments the preview URL on the PR). Workflows live in `.github/workflows/firebase-hosting-*.yml`.

Manual deploy is still available if you need it:

```sh
npm run build                    # build.mjs: copies marketing/ → dist/, then vite build
firebase deploy --only hosting   # ships dist/ to the propagentlanding Firebase project
```

After a deploy that represents a milestone, tag the commit:

```sh
git tag -a deploy-YYYY-MM-DD -m "What changed in this deploy"
git push --tags
```

### One-time CI setup (already done as of 2026-05-18, kept here for reference)

The workflows need a `FIREBASE_SERVICE_ACCOUNT_PROPAGENTLANDING` repo secret:

1. Firebase Console → ⚙️ Project Settings → **Service accounts** tab → **Generate new private key**. Download the JSON.
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Name: `FIREBASE_SERVICE_ACCOUNT_PROPAGENTLANDING`. Value: paste the full JSON.

If the secret is rotated, replace it with the new JSON — no code changes needed.
