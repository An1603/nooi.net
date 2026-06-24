# Nooi.net — Hermes Dev Profile Readiness Snapshot

> **Snapshot date:** 2026-06-23  
> **Profile:** `dev`  
> **Host:** `hadmin` / Linux 6.8.0-124-generic  
> **Working dir at check:** `/home/hadmin`

This note records the readiness check performed for the `nooi.net` web-app project on the active Hermes Dev profile. Use it as a quick reference when switching to another profile or reinstalling the environment.

---

## 1. Model & Provider

| Item | Value |
|---|---|
| Default model | `deepseek/deepseek-v4-pro` |
| Provider | `nous` (Nous Portal) |
| Base URL | `https://inference-api.nousresearch.com/v1` |
| Max turns | `150` |
| Nous subscription expires | `2026-06-24 00:08:19 UTC` |

**Verdict:** Model access is healthy and suitable for full-stack coding.

---

## 2. Enabled Toolsets (as of snapshot)

All toolsets useful for web-app development are enabled:

- `web` — web search & scraping
- `browser` — browser automation
- `terminal` — shell commands & processes
- `file` — file operations
- `code_execution` — sandboxed Python execution
- `vision` — image analysis
- `image_gen` — AI image generation
- `tts` — text-to-speech
- `skills` — skill management
- `todo` — in-session task planning
- `memory` — persistent cross-session memory
- `session_search` — search past conversations
- `clarify` — ask clarification questions
- `delegation` — subagent task delegation
- `cronjob` — scheduled background jobs
- `computer_use` — GUI automation
- `video_gen` — video generation
- `x_search` — X/Twitter search

Still disabled (not critical for nooi.net at this stage):

- `video` — generic video analysis (can be enabled if needed)
- `homeassistant`, `spotify`, `yuanbao`, `context_engine`

---

## 3. Credentials / API Keys Status

### Present

| Service | Status |
|---|---|
| Nous Portal | ✅ logged in |
| NVIDIA NIM | ✅ key present |
| Telegram gateway | ✅ configured (home: 430660136) |

### Missing / Not Configured

These should be added only if the project needs them:

| Service | Recommended env var / setup | Purpose |
|---|---|---|
| GitHub | `GITHUB_TOKEN` or `gh auth login` | git push, repo management, CI/CD |
| Cloudflare | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | DNS, Pages, Workers, R2 |
| Google Cloud | `GOOGLE_APPLICATION_CREDENTIALS` (service-account JSON path) or `GOOGLE_API_KEY` | GCP, Firebase, Cloud Run, Gemini API |
| Vercel | `VERCEL_TOKEN` | If deploying to Vercel |
| Netlify | `NETLIFY_AUTH_TOKEN` | If deploying to Netlify |
| Railway | `RAILWAY_TOKEN` | If deploying to Railway |
| Docker Hub / GHCR | `DOCKER_USERNAME`, `DOCKER_TOKEN` | Container builds |
| Database | `DATABASE_URL`, `POSTGRES_PASSWORD`, `REDIS_URL` | Backend data stores |
| Auth provider | `NEXTAUTH_SECRET`, `CLERK_API_KEY`, `AUTH0_*` | Authentication flows |

> **Security note:** Use least-privilege tokens (fine-grained PATs, scoped Cloudflare API tokens, service accounts with minimal roles).

---

## 4. Recommended Next Steps for Any Profile

1. Load the nooi.net project context (or create `AGENTS.md` / `.hermes.md` in the repo).
2. Fill in the missing credentials above (only the ones the project actually uses).
3. Verify with:
   - `hermes status`
   - `hermes config show`
   - `hermes tools list`
4. Run a small end-to-end task (e.g., `git clone`, build, or deploy a landing page) to confirm the toolchain works.

---

## 5. Open Questions for the Project Owner

Before beginning active development or autonomous deployment, clarify:

1. **Code source**
   - Does `nooi.net` already have a GitHub repo? If yes, paste the URL.
2. **Tech stack**
   - Frontend: Next.js, Astro, Nuxt, React + Vite, etc.
   - Styling: Tailwind, CSS-in-JS, etc.
   - Backend/DB: Node.js, Python, PostgreSQL, Supabase, Firebase, etc.
3. **Deployment target**
   - Cloudflare Pages, Vercel, Netlify, Google Cloud Run, VPS, etc.
4. **Deployment autonomy**
   - Should the agent deploy automatically when ready, or wait for explicit confirmation?
5. **Domain / DNS**
   - Use existing `nooi.net` domain, or a temporary preview/subdomain first?

---

## 6. Useful Commands

```bash
hermes status               # overall health & credentials
hermes config show          # current config
hermes tools list           # enabled/disabled toolsets
hermes config env-path      # path to .env store
hermes doctor               # detailed diagnostics
hermes setup                # interactive setup wizard
```

---

## 7. Notes

- `.env` lives at `/home/hadmin/.env` and is treated as Hermes' credential store; it cannot be read directly via `read_file`.
- Tool changes take effect after starting a new session (`/reset` or restart Hermes).
- Nous subscription provides managed web, image generation, TTS, and local Modal execution.
