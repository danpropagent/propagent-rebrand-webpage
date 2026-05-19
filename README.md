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

## Build + deploy

```sh
npm run build                    # build.mjs: copies marketing/ → dist/, then vite build
firebase deploy --only hosting   # ships dist/ to the propagentlanding Firebase project
```

After deploy, tag the commit so we have a permanent "this was live" marker:

```sh
git tag -a deploy-YYYY-MM-DD -m "What changed in this deploy"
git push --tags
```
