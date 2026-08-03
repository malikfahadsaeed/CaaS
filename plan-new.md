# CaaS — Serverless Migration Plan (Frontend + Backend + Bedrock)

Living plan for **Milestone 2**: move the EC2/Docker-Compose deployment to AWS serverless and
replace the static greeting with real answers from Amazon Bedrock.

> For the rationale behind each choice below, see [decisions.md](decisions.md).

## Status: 🚧 IN PROGRESS (local changes only — no deploy yet)

---

## Context

Milestone 1 runs as **three Docker containers on one EC2 instance** (Caddy → Next.js + FastAPI),
behind an Elastic IP, with DuckDNS DNS and Caddy/Let's Encrypt TLS, provisioned by Terraform in
`us-east-2`. The box runs 24/7 (~$15–20/mo) regardless of load.

Milestone 2 moves both tiers to serverless (idle cost ~$0, scale on demand, AWS-managed TLS) and
wires the chat service to Bedrock.

### Decisions (confirmed)
- **Frontend:** Next.js static export → private **S3** + **CloudFront** (OAC).
- **Backend:** container image on **ECR** → **Lambda**, run via the **AWS Lambda Web Adapter**
  (reuse the existing `uvicorn` container — **no Mangum**) → **API Gateway HTTP API (v2)**, non-streaming for now.
- **Routing:** ONE CloudFront distribution, two origins — `/api/*` → API Gateway, everything else
  → S3. Same-origin ⇒ **no CORS**; `frontend/lib/api.ts` base URL default stays `/api/v1`.
- **Bedrock:** wired into `chat_service` (the existing LLM seam), non-streaming `converse`.
- **Database:** **deferred** (YAGNI). Session memory works **without a DB** — the client holds the
  conversation in React state and sends the running history each turn; the backend forwards it to
  Bedrock for context. A DB is only needed later for cross-session persistence, auth, analytics.
- **Domain/TLS:** default `*.cloudfront.net` cert. No custom domain / Route 53 / ACM / DuckDNS.
- **Cutover:** full — add serverless, validate, then retire EC2/EIP/SG/VPC/Caddy/DuckDNS.
- **No VPC:** no DB ⇒ Lambda stays out of a VPC; Bedrock is reached over its public HTTPS endpoint.
- **Naming:** resources prefixed `caas-` (`project_name = "caas"`).

---

## Target architecture

```
Browser ── https://<dist>.cloudfront.net  (CloudFront, default TLS cert)
  ├─ /*     → S3 (private, OAC)                       static Next.js export
  └─ /api/* → API Gateway HTTP API → Lambda (container image, ECR)
                 └─ Lambda Web Adapter → uvicorn → FastAPI → Bedrock (converse)
```

---

## Backend changes

1. **Dependencies** — `backend/pyproject.toml`: add `aioboto3` (async Bedrock client). Keep `uvicorn`. `uv lock`.
2. **Lambda Web Adapter** — `backend/Dockerfile` runtime stage adds the adapter extension so ONE
   image runs locally and on Lambda:
   ```dockerfile
   COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
   ENV AWS_LWA_PORT=8090
   # CMD stays: uvicorn app.main:app --host 0.0.0.0 --port 8090
   ```
   `AWS_LWA_INVOKE_MODE` stays default `BUFFERED` (API Gateway). No handler file, no Mangum.
3. **Config** — `backend/app/core/config.py`: add `bedrock_model_id`, `bedrock_region` (default
   `us-east-2`), `bedrock_max_tokens` (e.g. 512), optional `system_prompt`. All env-overridable.
4. **Chat schema** — `backend/app/schemas/chat.py`: keep `message`; add `history: list[ChatTurn]`
   (`role: Literal["user","assistant"]`, `content: str`) for no-DB session memory.
5. **Bedrock in the service** — `backend/app/services/chat_service.py`: replace the static return
   with a `converse` call (`bedrock-runtime` via `aioboto3`). Build `messages` from `history +
   message`, pass `system_prompt`, cap `maxTokens`. On error: log + friendly fallback (envelope stays consistent).
6. **Route** — `backend/app/api/v1/chat.py` stays thin; pass `message` + `history` to the service.
7. **IAM (Terraform)** — Lambda role: `bedrock:InvokeModel` (+ `...WithResponseStream` for later).

CORS stays same-origin. Local `docker compose up` still works (same image).

## Frontend changes

1. `frontend/next.config.mjs`: `output: "standalone"` → `output: "export"` (emits `frontend/out/`).
2. Session context — `frontend/lib/api.ts` `sendChatMessage(message, history)` sends prior turns;
   `frontend/components/ChatApp.tsx` passes its `messages` state as history. `NEXT_PUBLIC_API_BASE_URL` stays `/api/v1`.

## Terraform changes (`infra/terraform/`, `us-east-2`, no VPC)

**Add** — ECR repo `caas-backend`; IAM role `caas-lambda-exec` (+ Bedrock policy); `aws_lambda_function`
`caas-backend` (`package_type=Image`, x86_64, `timeout=29`, `memory_size=512`, Bedrock/LWA env); API
Gateway HTTP API (`AWS_PROXY`, `ANY /{proxy+}`, `$default` stage) + `aws_lambda_permission`; S3 bucket
`caas-frontend` (private) + OAC; `aws_cloudfront_distribution` `caas-cdn` (S3 + API GW origins,
`/api/*` behavior with `AllViewerExceptHostHeader` + `CachingDisabled`, 403/404 → `/index.html`,
default cert); bucket policy scoped to the distribution; GitHub OIDC provider + `caas-gha-deploy` role.

**Remove (at cutover)** — `aws_instance.app`, `aws_eip.app`, `aws_key_pair.main`,
`aws_security_group.web`, `data.aws_ssm_parameter.al2023`, the VPC block; delete
`user-data.sh.tftpl`, `infra/docker-compose.prod.yml`, `infra/Caddyfile`. Prune EC2 vars; rewrite
outputs to `cloudfront_domain_name` / `api_invoke_url` / `s3_bucket_name` / `site_url`.

## CI/CD changes (`.github/workflows/ci.yml`)

Keep the test jobs. Replace the ghcr `build-and-push` job with OIDC deploy jobs (assume
`caas-gha-deploy`): **backend** builds+pushes the image to ECR and `aws lambda update-function-code`;
**frontend** `next build` (export) → two-pass `aws s3 sync` (immutable assets, then no-cache HTML) →
CloudFront invalidation.

## Monitoring & alerting (`infra/terraform/monitoring.tf`)

CloudWatch alarms → SNS topic `caas-alerts` → email (`alert_email`, one-time confirmation click).
Count/window thresholds (not single events) + `treat_missing_data = notBreaching` to avoid alert
fatigue and false alarms on a quiet app; count-based, not rate-based (a percentage divides by tiny
numbers at low traffic). Alarms: **Bedrock failures** (≥3/5min), **API GW 5xx** (≥5/5min), **Lambda
errors** (≥3/5min), **Lambda throttles** (≥1/5min), **Lambda duration p95** (>25s). See
[decisions.md](decisions.md) #13.

The **Bedrock-failure alarm** is the one CloudWatch can't give for free: `chat_service` catches
Bedrock errors and returns a fallback, so an outage yields zero Lambda errors / 5xx. A **Logs metric
filter** on the existing `"Bedrock converse call failed"` line makes it alarmable — no app code change.
One-time apply steps: `terraform import aws_cloudwatch_log_group.backend /aws/lambda/caas-backend`
(if the function already ran) and confirm the SNS email subscription.

## Docs

Update `docs/architecture.drawio` + `docs/architecture.svg` and the README to the serverless
topology; note the "no static public IP" change and the deferred-DB roadmap.

---

## Cutover sequence

1. Code PR (additive) — verify `pytest`/`ruff`/`mypy` + `next build`.
2. Terraform additive apply alongside the running EC2 → get `*.cloudfront.net` URL.
3. Enable Bedrock model access in the console.
4. First deploys (image + S3), invalidate.
5. Validate on `*.cloudfront.net`.
6. Decommission EC2/VPC/Caddy/DuckDNS; remove ghcr push job. Announce IP→hostname before releasing the EIP.

## Verification

- **Local:** `cd backend && uv run pytest -q && uv run ruff check . && uv run mypy app`;
  `cd frontend && npm run build` (confirm `out/index.html`); `docker compose up` still serves.
- **AWS:** SPA loads (no CORS errors); `POST /api/v1/chat` returns a Bedrock answer and a follow-up
  uses prior context; `/api/v1/health` healthy; no `Host`-header 403; deep-links serve `index.html`.

## Key gotchas

1. Bedrock model access + region/model id (us-east-2 → US cross-region inference profile; verify in console).
2. 30s API Gateway cap → cap `BEDROCK_MAX_TOKENS`, `timeout=29` (streaming later ⇒ Function URL).
3. `AllViewerExceptHostHeader` on `/api/*` (else execute-api 403).
4. `$default` stage keeps the `/api/v1` prefix intact.
5. Two-pass S3 sync + CloudFront invalidation (avoid stale HTML).
6. 403/404 → `/index.html` for SPA/private-bucket.
7. No static public IP (anycast) — renegotiate IP-based needs to DNS before releasing the EIP.
8. Image arch == Lambda arch (x86_64).
9. Deferred DB later reintroduces a VPC (Aurora Serverless v2 + endpoints/NAT).
10. Remove EC2/VPC only after validation.
