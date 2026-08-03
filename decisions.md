# CaaS — Decision Log

A running record of the notable decisions taken during the **Milestone 2 serverless migration**,
with the options considered and why each choice was made. Newest decisions at the bottom.
See [plan-new.md](plan-new.md) for the plan these decisions shape.

Format: **Decision · Options considered · Chosen · Why**

---

## 1. Frontend hosting — S3 + CloudFront (static export)

- **Options:** (a) S3 + CloudFront static export; (b) AWS Amplify Hosting; (c) SSR on Lambda via OpenNext/SST; (d) keep Next.js standalone on a Node runtime.
- **Chosen:** **(a) S3 + CloudFront** with Origin Access Control (private bucket).
- **Why:** The frontend is a **pure client-side SPA** — a single `"use client"` component fetching the
  backend; no server components, route handlers, middleware, or server actions. There is nothing for a
  Node/SSR runtime to do, so static hosting is the cheapest and simplest correct option. Amplify and
  OpenNext add SSR machinery we don't use; they can be revisited if server rendering is ever adopted.

## 2. Backend compute — Lambda + API Gateway HTTP API

- **Options:** (a) Lambda + API Gateway HTTP API; (b) Lambda Function URL; (c) ECS Fargate / App Runner.
- **Chosen:** **(a) Lambda + API Gateway HTTP API (v2)**, non-streaming for now.
- **Why:** The backend is **stateless, no DB, low/spiky traffic** — an ideal per-request Lambda fit that
  scales to zero. HTTP API gives clean routing, stages, throttling, and CloudFront-origin integration at
  ~$1/M requests. Fargate/App Runner keep a container warm 24/7 (defeats the cost goal). Function URL is
  reserved for the later streaming step (see #9).

## 3. Backend packaging — container image on ECR

- **Options:** (a) zip + dependencies; (b) container image on ECR.
- **Chosen:** **(b) container image on ECR.**
- **Why:** User preference to reuse the existing Docker workflow/mental model. A bonus: building deps
  **inside the Linux image** sidesteps the `pydantic-core` native-wheel cross-arch problem that a
  macOS-built zip would hit — the only rule is keeping image arch == Lambda arch (x86_64).

## 4. Lambda adapter — AWS Lambda Web Adapter (not Mangum)

- **Options:** (a) Mangum ASGI handler; (b) AWS Lambda Web Adapter (LWA).
- **Chosen:** **(b) Lambda Web Adapter.**
- **Why:** With a container image, LWA lets us **reuse the existing `uvicorn` container almost as-is** —
  no Mangum dependency, no Lambda-only `handler` module, and the *same image runs locally and on Lambda*
  (the adapter is inert off-Lambda). It also supports **response streaming**, which we'll want once
  Bedrock is answering (see #9). Mangum would have been an extra Lambda-specific code path with no streaming.
  *(Mangum and "image on ECR" are orthogonal — one is the adapter, the other is where the image lives —
  but choosing the container route made LWA the cleaner adapter.)*

## 5. API routing — single CloudFront distribution, two origins

- **Options:** (a) one CloudFront distribution: `/api/*` → API Gateway, `/*` → S3; (b) call the API
  Gateway URL directly with CORS.
- **Chosen:** **(a) single distribution, multi-origin.**
- **Why:** Keeps the browser **same-origin** (mirrors today's Caddy path routing), so **no CORS**, a
  **single TLS cert/domain**, one place for logging/WAF, and — importantly — `frontend/lib/api.ts` needs
  **no change** (its `/api/v1` default just works). The direct-URL alternative reintroduces CORS and a
  second domain. Cost is a little more CloudFront config.
- **Critical config:** the `/api/*` behavior must use the `AllViewerExceptHostHeader` origin-request
  policy (forwarding the viewer `Host` to `execute-api` causes a 403) and `CachingDisabled`.

## 6. Domain / TLS — default `*.cloudfront.net` certificate

- **Options:** (a) default CloudFront domain + cert; (b) custom domain via Route 53 + ACM; (c) keep DuckDNS.
- **Chosen:** **(a) default `*.cloudfront.net`.**
- **Why:** Zero DNS/cert work, valid HTTPS out of the box, fastest path to a working stack. A custom
  domain can be added later without rearchitecting. DuckDNS + CloudFront + ACM DNS-validation is fragile
  (apex-CNAME and validation-record limits), so DuckDNS is retired.
- **Trade-off accepted:** serverless (CloudFront/API Gateway are anycast) has **no static public IP** —
  the original "public IP" requirement becomes a DNS-hostname contract. Releasing the Elastic IP is
  irreversible, so it happens only after validation.

## 7. Cutover — full replacement of the EC2 stack

- **Options:** (a) full cutover (retire EC2 after validation); (b) run serverless and EC2 side-by-side indefinitely.
- **Chosen:** **(a) full cutover**, done in an additive-then-decommission sequence.
- **Why:** Single source of truth and no double-running cost. Risk is contained by adding the serverless
  stack **alongside** the running EC2, validating on the CloudFront URL, and only then destroying
  EC2/EIP/SG/VPC. Nothing is deleted before the new path is proven.

## 8. Database — deferred (YAGNI)

- **Options:** (a) Aurora Serverless v2 (Postgres); (b) DynamoDB; (c) RDS Postgres; (d) defer.
- **Chosen:** **(d) defer.**
- **Why:** No persistence is needed yet. Deferring keeps the stack **VPC-free and truly scale-to-zero**.
  Crucially, **session memory does not require a DB**: the frontend already holds the conversation in
  React state and sends the running history each turn, which the backend forwards to Bedrock for context.
- **Consequence to plan for:** adding a relational DB later (Aurora Serverless v2 recommended)
  **reintroduces a VPC** (private subnets, RDS SG, Secrets Manager, and a Bedrock/Secrets VPC endpoint or
  NAT). Treated as a deliberate later milestone; nothing in M2 blocks it.

## 9. Bedrock transport — non-streaming via API Gateway now

- **Options:** (a) non-streaming `converse` behind API Gateway; (b) streaming via Lambda Function URL.
- **Chosen:** **(a) non-streaming now**, with LWA (#4) already positioning us for streaming later.
- **Why:** Simplest front door; matches the API Gateway choice (#2). Constraint accepted: API Gateway
  caps requests at **30s**, so we cap `BEDROCK_MAX_TOKENS` and set Lambda `timeout=29`. When token-by-token
  UX is wanted, switch the `/api/*` origin to a Lambda **Function URL** with the adapter in `RESPONSE_STREAM`
  mode — no rewrite of the app.
- **Open item:** Anthropic Claude on Bedrock isn't in every region; from `us-east-2` use a **US
  cross-region inference profile** (`us.anthropic.claude-*`) or point `BEDROCK_REGION` at a supported
  region. Exact model id/availability must be **verified in the AWS console** and model access enabled
  before first call.

## 10. Session memory without a DB — client-sent history

- **Options:** (a) client sends conversation history each request; (b) server-side session store (needs a DB/cache).
- **Chosen:** **(a) client-sent history.**
- **Why:** The SPA already keeps `messages` in state, so passing it as `history` gives Bedrock full
  conversation context with **zero backend state** — consistent with the deferred-DB decision (#8). The
  backend stays stateless; the request/response envelope is unchanged apart from the added `history` field.
  Cross-session/device persistence is explicitly out of scope until a DB is added.

## 11. CI/CD auth — GitHub OIDC (no long-lived AWS keys)

- **Options:** (a) GitHub OIDC role assumption; (b) static AWS access keys in repo secrets.
- **Chosen:** **(a) OIDC**, assuming a `caas-gha-deploy` role scoped to `main`.
- **Why:** No long-lived secrets to store or rotate; the trust policy restricts which repo/branch can
  assume the role. Replaces the ghcr image-push flow with ECR push + `lambda:UpdateFunctionCode` and
  S3 sync + CloudFront invalidation.

## 12. Resource naming — `caas-` prefix

- **Options:** (a) `fahad-` (personal) prefix; (b) `caas-` (project) prefix.
- **Chosen:** **(b) `caas-`** via `project_name = "caas"`.
- **Why:** Project-scoped, impersonal naming reads better for a shared/handoff-ready codebase than a
  personal prefix. Terraform already parameterizes the prefix through `var.project_name`.

## 13. Error alerting — CloudWatch alarms → SNS email

- **Options:** (a) CloudWatch alarms → SNS email; (b) SES-based custom alert mail; (c) third-party paging (PagerDuty/Opsgenie); (d) no alerting.
- **Chosen:** **(a) CloudWatch alarms → SNS topic → email subscription** (`infra/terraform/monitoring.tf`).
- **Why:** SNS email is the proportionate, ~$0 fit for a small serverless app. SES is for app→user mail,
  not ops alerts; paging tools add cost/rotation machinery we don't need yet.
- **Key insight — the alarm CloudWatch can't give for free:** `chat_service.py` deliberately catches
  Bedrock errors and returns a friendly fallback, so a Bedrock outage produces **zero Lambda errors and
  zero 5xx** — invisible to default metrics. A **CloudWatch Logs metric filter** on the existing
  `logger.exception("Bedrock converse call failed")` line turns that swallowed failure into an alarmable
  metric (custom namespace `CaaS/Backend`, metric `BedrockFailures`). No app code change needed.
- **Alarm set:** Bedrock failures (≥3/5min), API GW `5xx` (≥5/5min), Lambda `Errors` (≥3/5min),
  Lambda `Throttles` (≥1/5min), Lambda `Duration` p95 (>25s of the 29s cap).
- **Design choices:** count/window thresholds (not single events) and `treat_missing_data=notBreaching`
  to avoid alert fatigue and false alarms on a quiet app; **count-based, not rate-based**, because at low
  traffic a percentage divides by tiny numbers and gets noisy. `alert_email` is an env-overridable var;
  empty ⇒ topic created without a subscriber. Email needs a one-time SNS confirmation click.
- **Consequence to plan for:** SNS email has no dedup/escalation/on-call rotation — graduate to
  PagerDuty/Opsgenie or AWS Incident Manager if paging is ever needed.
