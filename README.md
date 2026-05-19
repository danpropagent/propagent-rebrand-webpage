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

### CI auth — Workload Identity Federation (no long-lived keys)

Auth flows via GitHub OIDC → Google Cloud STS → short-lived access token, scoped to this exact repo. No JSON key exists anywhere; the GCP org policy `iam.disableServiceAccountKeyCreation` is respected by design.

Resources provisioned in the `propagentlanding` GCP project (one-time, already done 2026-05-18):

- Service account: `github-deploy@propagentlanding.iam.gserviceaccount.com` (no key — keys are forbidden by org policy and not needed)
- Role: `roles/firebasehosting.admin` on the project
- Workload Identity Pool: `projects/472249298599/locations/global/workloadIdentityPools/github-pool`
- OIDC provider: `github-pool/providers/github-provider` (issuer `https://token.actions.githubusercontent.com`, restricted to `repository_owner == 'danpropagent'`)
- IAM binding on the SA: `principalSet://.../attribute.repository/danpropagent/propagent-rebrand-webpage` → `roles/iam.workloadIdentityUser`

If you ever fork this repo to a different owner or rename it, you must update the IAM binding on the SA to match the new repo path, otherwise auth will fail. Forks from external owners are intentionally blocked.
