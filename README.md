# Nimbus — Chatbot-as-a-Service (CaaS)

[![CI](https://github.com/malikfahadsaeed/CaaS/actions/workflows/ci.yml/badge.svg)](https://github.com/malikfahadsaeed/CaaS/actions/workflows/ci.yml)

A cloud-native **Chatbot-as-a-Service** platform: a customizable chat interface
backed by a FastAPI service, deployed to AWS as a **fully serverless** stack over
HTTPS, with answers from **Amazon Bedrock**.

This is **Milestone 2** — the container-on-EC2 foundation release migrated to
serverless (static frontend on S3 + CloudFront; FastAPI on Lambda behind API
Gateway) and wired to Bedrock. Persistence/auth/multi-tenancy remain deferred;
the chat service is the single seam where those extend. See
[plan-new.md](plan-new.md) for the migration plan and [decisions.md](decisions.md)
for why each choice was made.

## Features

- 💬 **Customizable chat UI** — responsive Next.js + Tailwind interface, light/dark
  aware, fully re-brandable from a single theme file. Ships as a static export.
- 🤖 **Bedrock-backed answers** — the chat service calls Bedrock's `converse` API.
  Conversation context is carried by the client (no database), so replies stay
  in-session while the backend remains stateless.
- ⚡ **FastAPI on Lambda** — clean layered architecture (routes → services), typed,
  with a consistent response envelope and unit tests. Runs unchanged locally and
  on Lambda via the AWS Lambda Web Adapter.
- 🔒 **HTTPS out of the box** — CloudFront's default certificate; a single
  distribution serves the SPA and proxies `/api/*` to API Gateway (same-origin,
  no CORS).
- ☁️ **Infrastructure as code** — one `terraform apply` provisions the full
  serverless stack (S3, CloudFront, API Gateway, Lambda, ECR, IAM).
- 🚀 **CI/CD** — GitHub Actions lints, type-checks, tests, then deploys via GitHub
  OIDC (no static keys): image → ECR + Lambda, static export → S3 + CloudFront.

## Architecture

![Architecture diagram](docs/architecture.svg)

*Browser → CloudFront (HTTPS): `/*` → private S3 (static Next.js export via OAC),
`/api/*` → API Gateway → Lambda (container image; Web Adapter → uvicorn → FastAPI)
→ Amazon Bedrock. CloudWatch alarms → SNS → email for ops alerts. Terraform
provisions the resources; CI/CD deploys via OIDC.
Editable source: [docs/architecture.drawio](docs/architecture.drawio) — open at
[app.diagrams.net](https://app.diagrams.net) or the VS Code Draw.io extension,
then re-export to `docs/architecture.svg`.*

> **Note — no static public IP.** Serverless endpoints (CloudFront/API Gateway)
> are anycast, so there is no fixed IP as with the previous Elastic IP; the app is
> reached by its HTTPS hostname.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router, static export), TypeScript, Tailwind CSS |
| Backend | Python 3.12, FastAPI, Pydantic, uv, aioboto3 |
| LLM | Amazon Bedrock (`converse`) |
| Compute / API | AWS Lambda (container image) + Lambda Web Adapter, API Gateway HTTP API |
| Hosting / CDN / TLS | Amazon S3 (private) + CloudFront (OAC), default certificate |
| Registry | Amazon ECR |
| Infrastructure | Terraform (AWS provider) |
| CI/CD | GitHub Actions + GitHub OIDC |
| Local runtime | Docker, Docker Compose |

## Project structure

```
.
├── backend/                # FastAPI service (routes → services), Bedrock chat service, tests
├── frontend/               # Next.js chat UI (static export), API client
├── infra/
│   ├── Caddyfile           # local-only reverse proxy for `docker compose`
│   └── terraform/          # serverless AWS infrastructure
├── docker-compose.yml      # local development stack
├── docs/architecture.drawio
├── plan-new.md             # serverless migration plan
├── decisions.md            # decision log
└── .github/workflows/ci.yml
```

## Getting started (local)

The local stack still runs behind Caddy (frontend served as a static export,
backend as the same image used on Lambda):

```bash
docker compose up --build
# open http://localhost
```

Or run each service directly for development:

```bash
# Backend → http://localhost:8090
cd backend
cp env.example .env           # set BEDROCK_MODEL_ID / BEDROCK_REGION for real replies
uv run uvicorn app.main:app --reload --port 8090

# Frontend → http://localhost:3000
cd frontend
cp env.example .env.local     # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8090/api/v1
npm install
npm run dev
```

Local Bedrock calls use your ambient AWS credentials (`aws configure`) and require
Bedrock model access enabled in the account.

## Testing & quality

```bash
# Backend
cd backend
uv run ruff check .      # lint
uv run mypy app          # types
uv run pytest -q         # tests

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build            # produces the static export in out/
```

## Deployment (AWS)

**Prerequisites:** an AWS account with credentials configured (`aws configure`),
Terraform ≥ 1.5, Docker, and **Bedrock model access enabled** for your chosen
model/region.

1. **Configure** — copy the example vars and fill them in (kept local; never
   committed):
   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars   # github_repo, bedrock model/region, alert_email
   ```
2. **Seed the image** — Lambda uses a container image, so push one before the first
   apply (CI does this afterwards):
   ```bash
   terraform init && terraform apply -target=aws_ecr_repository.backend
   REPO=$(terraform output -raw ecr_repository_url)
   aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin "${REPO%/*}"
   # --provenance/--sbom=false and a single --platform are required: Lambda
   # rejects buildx attestation manifests / multi-platform image indexes.
   # Note the braces on ${REPO}: in zsh, "$REPO:latest" applies a :l modifier.
   docker buildx build --platform linux/amd64 --provenance=false --sbom=false \
     -t "${REPO}:latest" --push ../../backend
   ```
3. **Provision** — creates S3, CloudFront, API Gateway, Lambda, ECR, IAM and the
   GitHub OIDC deploy role:
   ```bash
   terraform apply
   ```
4. **Publish the frontend** — build the static export and sync it, then invalidate:
   ```bash
   cd ../../frontend && npm ci && npm run build
   aws s3 sync out/ "s3://$(cd ../infra/terraform && terraform output -raw s3_bucket_name)/" --delete
   aws cloudfront create-invalidation \
     --distribution-id "$(cd ../infra/terraform && terraform output -raw cloudfront_distribution_id)" --paths "/*"
   ```

Browse to `terraform output -raw site_url`. After the first apply, set the CI
repository variables (`AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `ECR_REPOSITORY`,
`LAMBDA_FUNCTION`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`) from the
Terraform outputs so pushes to `main` deploy automatically.

### Redeploy

Merge to `main` (CI deploys), or manually: rebuild + `docker push`, then
`aws lambda update-function-code`; rebuild the frontend and re-sync to S3 +
invalidate CloudFront (as in step 4).

### Teardown

```bash
cd infra/terraform && terraform destroy
```

## Monitoring & alerts

CloudWatch alarms publish to an SNS topic (`caas-alerts`) that emails
`alert_email`. All alarms use count/window thresholds (not single events) and
treat missing data as *not breaching*, so a quiet app stays green instead of
false-alarming. Defined in [infra/terraform/monitoring.tf](infra/terraform/monitoring.tf);
thresholds live in a `locals` block there.

| Alarm | Fires when |
|---|---|
| `caas-bedrock-failures` | ≥3 Bedrock failures / 5 min |
| `caas-apigw-5xx` | ≥5 API Gateway 5xx / 5 min |
| `caas-lambda-errors` | ≥3 unhandled Lambda errors / 5 min |
| `caas-lambda-throttles` | ≥1 throttle / 5 min |
| `caas-lambda-duration` | p95 duration > 25s (of the 29s cap) |

**Why the Bedrock alarm is special:** the chat service catches Bedrock errors and
returns a friendly fallback, so an outage produces **zero** Lambda errors and 5xx
— invisible to default metrics. A CloudWatch Logs metric filter on the
`"Bedrock converse call failed"` log line surfaces it as an alarmable metric (no
app code change).

**Two one-time steps when you apply:**

```bash
# 1. If the Lambda has already run, AWS auto-created its log group — import it once:
terraform import aws_cloudwatch_log_group.backend /aws/lambda/caas-backend
# 2. Confirm the SNS subscription: AWS emails a link to alert_email; alarms
#    won't deliver until you click it.
```

## Roadmap

The chat service and infrastructure are intentionally extensible. Planned next:

- **Streaming** Bedrock responses (Lambda Function URL + adapter response streaming)
- **Persistence** (Aurora Serverless v2 PostgreSQL) — reintroduces a VPC + endpoints
- **Authentication** and per-tenant configuration
- Remote Terraform state (S3 + DynamoDB lock)
