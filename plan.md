# CaaS Platform — Milestone 1 Plan

Living checklist for Milestone 1. Tick boxes as we complete each item.

## Status

**Built and verified locally** ✅ — backend, frontend, and the full Docker stack
run end-to-end behind Caddy (chat + health round-trip confirmed). Infra (Terraform),
CI, the architecture diagram, and docs are written. What remains is the **live AWS
deployment**, which needs your AWS account + domain (Steps 5 apply, 6, and the live
check in 9).

## Context

Chatbot-as-a-Service (CaaS) platform. Milestone 1 stands up the full end-to-end
shape of the product on AWS so later features (real LLM, auth, multi-tenancy,
persistence) slot in without re-architecting.

**Decisions:**
- **Hosting:** single **EC2** instance running **Docker Compose**, with an **Elastic IP** (static public IP).
- **SSL:** real **domain + Let's Encrypt**, auto-issued/renewed by a **Caddy** reverse proxy.
- **IaC:** **Terraform**.
- **Database:** **deferred** (YAGNI) — chat endpoint returns a static message, no DB.

## Architecture

```
Internet → DNS A record → Elastic IP → EC2 (public subnet, SG: 22/80/443)
   → Caddy (80/443, auto Let's Encrypt TLS)
        /       → frontend:3000 (Next.js)
        /api/*  → backend:8090  (FastAPI)
```

---

## Checklist

### Step 1 — Materialize `plan.md`
- [x] Create this living checklist at the repo root.

### Step 2 — Backend (FastAPI, no DB)
- [x] Scaffold `backend/` with `uv` + `pyproject.toml`.
- [x] `core/config.py`, `core/logging.py`, `core/constants.py`.
- [x] `schemas/common.py` (envelope), `schemas/chat.py`, `schemas/health.py`.
- [x] `services/chat_service.py` — static reply (seam for future LLM).
- [x] `api/v1/chat.py` (`POST /api/v1/chat`) and `api/v1/health.py` (`GET /api/v1/health`).
- [x] `main.py` — app factory, CORS, router mount, logging, error handler.
- [x] Tests: `test_chat.py`, `test_health.py`.
- [x] `Dockerfile` (multi-stage, slim), `env.example`. **ruff ✓ · mypy ✓ · 5 pytest ✓**

### Step 3 — Frontend (Next.js + TS + Tailwind)
- [x] Scaffold `frontend/` (App Router, TS, Tailwind), `output: 'standalone'`.
- [x] `lib/theme.ts` — customizable config (botName, primaryColor, welcomeMessage, avatars).
- [x] `components/ChatWidget.tsx` + `MessageList.tsx` + `MessageInput.tsx` — chat UI, welcome, typing state.
- [x] `lib/api.ts` — typed call to `/api/v1/chat`.
- [x] `Dockerfile` (standalone), `env.example`. **lint ✓ · typecheck ✓ · build ✓**

### Step 4 — Local orchestration
- [x] `docker-compose.yml` (dev) + `infra/docker-compose.prod.yml` (prod) with healthchecks.
- [x] `infra/Caddyfile` — `/` → frontend, `/api/*` → backend; TLS via domain.
- [x] **Verified end-to-end locally**: chat returns the greeting, health OK, empty message → 422, frontend served via Caddy.

### Step 5 — Infrastructure (Terraform)
- [x] `versions.tf`, `variables.tf`, `outputs.tf`.
- [x] `main.tf` — VPC + public subnet + IGW + route table; SG (22/80/443); key pair; EC2 (AL2023) + user-data; Elastic IP.
- [x] `user-data.sh.tftpl` — installs Docker + Compose, writes compose + Caddyfile, `docker compose up -d`.
- [x] `terraform.tfvars.example`.
- [ ] Run `terraform init && terraform plan && terraform apply` (requires your AWS account). *(terraform not installed locally — validate on your machine.)*

### Step 6 — Domain + SSL (deploy-time)
- [ ] Point an **A record** for `domain_name` → the Elastic IP.
- [ ] Confirm Caddy auto-issues the Let's Encrypt cert; verify valid cert + HTTP→HTTPS redirect.

### Step 7 — CI/CD (GitHub Actions → ghcr.io)
- [x] `ci.yml` — PR: backend lint+tests, frontend lint+build; merge to `main`: build & push images to `ghcr.io`.
- [ ] Push to GitHub and make the two `ghcr.io` packages **public** (so EC2 can pull unauthenticated).

### Step 8 — Architecture diagram (draw.io)
- [x] Author `docs/architecture.drawio`.
- [ ] Open in draw.io and export `architecture.png` (optional; source `.drawio` is committed).

### Step 9 — Docs & wrap-up
- [x] `README.md` — local dev, tests, Terraform apply, DNS setup, deploy, teardown.
- [ ] Final end-to-end check against the live `https://<domain>` URL after deploy.

---

## Deliberately deferred (YAGNI for M1)
- No database, no auth, no real LLM — the service layer is the seam for each later.
- Terraform state local in M1; move to S3 + DynamoDB backend when the team/infra grows.
- Single EC2 is the M1 tradeoff; documented migration target is ECS Fargate + ALB.
