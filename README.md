# CaaS — Chatbot-as-a-Service (Milestone 1)

A minimal but production-shaped chatbot platform: a customizable Next.js chat UI,
a FastAPI backend, all served over HTTPS from a single AWS EC2 instance with a
static public IP. Milestone 1 keeps the backend deliberately simple (it replies
with a fixed greeting) while establishing the full end-to-end architecture so
real features (LLM, auth, persistence) can be added without re-architecting.

## Architecture

```
User ──HTTPS──▶ Elastic IP ──▶ EC2 (public subnet, SG: 22/80/443)
                                 └─ Caddy (auto Let's Encrypt TLS)
                                      /       ──▶ frontend (Next.js :3000)
                                      /api/*  ──▶ backend  (FastAPI :8090)
```

See [docs/architecture.drawio](docs/architecture.drawio) (open at
[app.diagrams.net](https://app.diagrams.net)) for the full resource diagram.

- **Hosting:** single EC2 instance running Docker Compose, with an Elastic IP.
- **TLS:** Caddy reverse proxy auto-issues/renews a Let's Encrypt certificate.
- **IaC:** Terraform provisions the VPC, subnet, gateway, security group, key
  pair, EC2 instance, and Elastic IP.
- **CI/CD:** GitHub Actions builds and pushes images to `ghcr.io`.
- **Database:** intentionally deferred — added when a feature needs it.

## Repository layout

| Path | What |
| --- | --- |
| `backend/` | FastAPI app (routes → services), tests, Dockerfile |
| `frontend/` | Next.js App Router UI, customizable theme, Dockerfile |
| `infra/Caddyfile` | Reverse-proxy + TLS config |
| `infra/docker-compose.prod.yml` | Production stack (pulls ghcr images) |
| `infra/terraform/` | AWS infrastructure |
| `docker-compose.yml` | Local dev stack (builds from source) |
| `.github/workflows/ci.yml` | CI: lint/test/build + push images |
| `docs/architecture.drawio` | Architecture diagram |

## Local development

Run the whole stack behind Caddy (plain HTTP locally):

```bash
docker compose up --build
# open http://localhost  → send a message, get the greeting back
```

Or run each app directly:

```bash
# Backend (http://localhost:8090)
cd backend
cp env.example .env
uv run uvicorn app.main:app --reload --port 8090

# Frontend (http://localhost:3000)
cd frontend
cp env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8090/api/v1
npm install
npm run dev
```

## Tests & checks

```bash
# Backend
cd backend
uv run ruff check .
uv run mypy app
uv run pytest -q

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Deploy to AWS

Prerequisites: an AWS account with credentials configured, Terraform ≥ 1.5, an
SSH key pair, a domain, and the container images published to `ghcr.io` (push to
`main` triggers CI; make the two packages **public** so the instance can pull
them without auth).

### DNS + SSL

DNS is a free **DuckDNS** subdomain; TLS is **Caddy + Let's Encrypt** (free,
auto-renewing). No paid DNS, no ACM/ALB — and the static Elastic IP is preserved.

1. At [duckdns.org](https://www.duckdns.org) (sign in with GitHub/Google), create
   a subdomain, e.g. `your-name.duckdns.org`, and copy your **token**.
2. Set `domain_name = "your-name.duckdns.org"` in `terraform.tfvars`, then apply:

   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars   # edit: domain, your IP/32, image_owner, key path
   terraform init && terraform plan && terraform apply
   ```

3. Point the DuckDNS subdomain at the Elastic IP (one-time — the IP is static):

   ```bash
   EIP=$(terraform output -raw public_ip)
   curl "https://www.duckdns.org/update?domains=your-name&token=YOUR_TOKEN&ip=$EIP"   # prints OK
   ```

Once DNS resolves to the Elastic IP, Caddy issues the Let's Encrypt cert
automatically on the first HTTPS request (it retries, so order isn't critical).
Verify by browsing to `https://your-name.duckdns.org`.

### Redeploy new images

```bash
ssh ec2-user@<public_ip>
cd /opt/caas && docker compose pull && docker compose up -d
```

### Teardown

```bash
cd infra/terraform
terraform destroy
```

## Notes / deferred for later milestones

- No database, auth, or real LLM yet — `app/services/chat_service.py` is the seam
  where an LLM plugs in.
- Terraform state is local; move to an S3 + DynamoDB backend as the team grows.
- Single EC2 is the Milestone 1 tradeoff; the documented scale target is
  ECS Fargate + ALB.
