# Vidyai — AI-Powered Education Platform

> CBSE Class 10 AI test generator. Production-grade SaaS architecture, runs locally for development, deploys to AWS for production.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Local Setup (Manual)](#local-setup-manual)
4. [Local Setup (Docker)](#local-setup-docker)
5. [PDF Ingestion (RAG)](#pdf-ingestion-rag)
6. [AWS Production Deployment](#aws-production-deployment)
   - [RDS PostgreSQL Migration](#rds-postgresql-migration)
   - [S3 for PDF Storage](#s3-for-pdf-storage)
   - [EC2 Deployment](#ec2-deployment)
7. [Environment Variables Reference](#environment-variables-reference)
8. [API Reference](#api-reference)
9. [Adding More Boards / Classes / Subjects](#adding-more-boards--classes--subjects)
10. [Subscription / Payment Integration](#subscription--payment-integration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                  Next.js 14 · TypeScript · Tailwind              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST
┌──────────────────────────────▼──────────────────────────────────┐
│                       FastAPI Backend                            │
│   Auth · Boards · Tests · Usage  (JWT · Rate Limit · CORS)      │
└──────┬─────────────────────────────────────────────┬────────────┘
       │ SQLAlchemy ORM                              │ OpenAI SDK
┌──────▼──────────────┐                  ┌──────────▼────────────┐
│  PostgreSQL + pgvec │                  │  OpenAI API           │
│  users, boards,     │                  │  text-embedding-3-small│
│  chapters, chunks   │                  │  gpt-4o               │
│  (embeddings stored)│                  └───────────────────────┘
└─────────────────────┘
       │ boto3 (PDF upload only)
┌──────▼──────────────┐
│  AWS S3 / Local FS  │
│  Textbook PDFs      │
│  (read once at      │
│   ingest time)      │
└─────────────────────┘
```

**RAG Flow:**
```
User picks chapter → Check usage limit → Embed query →
pgvector cosine search (filtered by chapter_id) →
Top-K chunks → GPT-4o prompt → 10 MCQs → Store → Return JSON
```

---

## Folder Structure

```
vidyai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, routers
│   │   ├── config.py            # Pydantic Settings (env-driven)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── core/
│   │   │   ├── security.py      # JWT + bcrypt
│   │   │   └── exceptions.py    # Typed HTTP exceptions
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── routers/             # auth, boards, tests, usage
│   │   ├── services/            # auth, rag, generation, usage, storage
│   │   └── middleware/          # Rate limiter
│   ├── migrations/              # Alembic (initial schema + pgvector)
│   ├── scripts/
│   │   ├── seed_data.py         # CBSE Class 10 curriculum seed
│   │   └── ingest_pdf.py        # PDF → chunks → embeddings → DB
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── (auth)/          # login / register
│   │   │   └── (dashboard)/     # dashboard, generate, tests, profile
│   │   ├── components/
│   │   │   ├── ui/              # Button, Card, Input, Badge, Toast…
│   │   │   ├── layout/          # Sidebar, Header
│   │   │   ├── auth/            # LoginForm, RegisterForm
│   │   │   └── test/            # ChapterSelector, TestDisplay, QuestionCard
│   │   ├── hooks/               # useAuth, useToast
│   │   ├── store/               # Zustand auth store (persisted)
│   │   ├── lib/                 # api.ts, utils.ts
│   │   └── types/               # Shared TypeScript types
│   ├── middleware.ts             # Route protection (cookie-based)
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml           # Local dev (DB + backend + frontend)
├── docker-compose.prod.yml      # Production overrides
└── README.md
```

---

## Local Setup (Manual)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15/16 with **pgvector** extension
- An OpenAI API key

### 1. Install pgvector (macOS)

```bash
brew install postgresql@16
brew install pgvector   # or build from source
```

### 2. Create database

```sql
-- Connect as postgres superuser
CREATE DATABASE edusaas;
CREATE USER edusaas WITH PASSWORD 'edusaas';
GRANT ALL PRIVILEGES ON DATABASE edusaas TO edusaas;

-- Connect to edusaas database
\c edusaas
CREATE EXTENSION vector;
```

### 3. Backend setup

```bash
cd backend

# Copy and fill environment
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY, OPENAI_API_KEY

# Create virtualenv and install
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed CBSE Class 10 curriculum
python scripts/seed_data.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Frontend setup

```bash
cd frontend

# Copy and fill environment
cp .env.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm install
npm run dev
```

App: http://localhost:3000

---

## Local Setup (Docker)

> Easiest way to start. One command spins up everything.

```bash
# 1. Copy backend env
cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY and OPENAI_API_KEY at minimum

# 2. Start all services
docker compose up --build

# Services:
#   PostgreSQL:  localhost:5432
#   Backend:     localhost:8000  (auto-migrates + seeds on start)
#   Frontend:    localhost:3000
```

Stop and remove volumes:
```bash
docker compose down -v
```

---

## PDF Ingestion (RAG)

PDF textbooks are stored once (local or S3). Embeddings are extracted and stored in PostgreSQL. During test generation, **only the database is queried** — not S3.

### Step-by-step

```bash
# 1. Get the chapter ID from the DB (after seeding)
# Chapter IDs are printed after seeding, or query:
#   SELECT id, chapter_name FROM chapters;

# 2. Upload and ingest a PDF
python scripts/ingest_pdf.py \
  --pdf /path/to/cbse_class10_maths_chapter1.pdf \
  --chapter-id 1

# Repeat for each chapter PDF
# Each ingest: extracts text → chunks (~900 chars) → batch embeds → stores in DB
```

### With S3 (production)

```bash
# Set in .env:
# STORAGE_MODE=s3
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# S3_BUCKET_NAME=edusaas-textbooks

# Upload PDF to S3 manually or via the ingest script
# The ingest script reads from local path; upload separately:
aws s3 cp textbook.pdf s3://edusaas-textbooks/cbse/class10/maths/chapter1.pdf

# Then ingest embeddings into DB (ingest_pdf.py reads from local path):
python scripts/ingest_pdf.py --pdf textbook.pdf --chapter-id 1
```

---

## AWS Production Deployment

### RDS PostgreSQL Migration

#### 1. Create RDS instance
```
Engine:          PostgreSQL 16
Instance class:  db.t4g.micro (dev) / db.t3.medium (prod)
Storage:         20 GB gp3
Multi-AZ:        Yes (production)
VPC:             Same VPC as your EC2
```

#### 2. Enable pgvector on RDS

```sql
-- Connect to RDS instance
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. Update DATABASE_URL

```bash
# In backend/.env (production)
DATABASE_URL=postgresql://edusaas:<PASSWORD>@<RDS-ENDPOINT>:5432/edusaas
```

#### 4. Run migrations against RDS

```bash
cd backend
DATABASE_URL=postgresql://... alembic upgrade head
DATABASE_URL=postgresql://... python scripts/seed_data.py
```

---

### S3 for PDF Storage

#### 1. Create S3 bucket

```bash
aws s3api create-bucket \
  --bucket edusaas-textbooks \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Block public access
aws s3api put-public-access-block \
  --bucket edusaas-textbooks \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### 2. IAM policy for EC2 / ECS

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::edusaas-textbooks",
        "arn:aws:s3:::edusaas-textbooks/*"
      ]
    }
  ]
}
```

#### 3. Switch to S3 mode

```bash
# backend/.env
STORAGE_MODE=s3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=edusaas-textbooks
```

---

### EC2 Deployment

#### 1. Launch EC2

```
AMI:          Amazon Linux 2023
Instance:     t3.small (backend) — scale up as needed
Security Group: Allow 80, 443, 22 (your IP), 8000 (internal)
```

#### 2. Install dependencies

```bash
# Update system
sudo dnf update -y

# Docker
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Clone and configure

```bash
git clone https://github.com/yourorg/vidyai.git
cd vidyai

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env
# Set: DATABASE_URL (RDS), SECRET_KEY, OPENAI_API_KEY, STORAGE_MODE=s3, S3_BUCKET_NAME, ALLOWED_ORIGINS
```

#### 4. Deploy

```bash
# Production stack (no DB container — uses RDS)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

#### 5. Nginx reverse proxy + SSL (optional but recommended)

```bash
sudo dnf install -y nginx certbot python3-certbot-nginx

# /etc/nginx/conf.d/edusaas.conf
cat > /etc/nginx/conf.d/edusaas.conf << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | — | JWT signing key (generate: `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `OPENAI_API_KEY` | ✅ | — | OpenAI secret key |
| `DEBUG` | — | `false` | Enables /docs, verbose logs |
| `ENVIRONMENT` | — | `development` | Used in logs and health check |
| `OPENAI_CHAT_MODEL` | — | `gpt-4o` | GPT model for question generation |
| `OPENAI_EMBEDDING_MODEL` | — | `text-embedding-3-small` | Embedding model |
| `EMBEDDING_DIMENSIONS` | — | `1536` | Must match embedding model output |
| `RAG_TOP_K` | — | `6` | Number of chunks retrieved per query |
| `STORAGE_MODE` | — | `local` | `local` or `s3` |
| `LOCAL_STORAGE_PATH` | — | `./storage` | Path for local PDF storage |
| `AWS_ACCESS_KEY_ID` | S3 only | — | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | S3 only | — | AWS credentials |
| `AWS_REGION` | S3 only | `us-east-1` | S3 bucket region |
| `S3_BUCKET_NAME` | S3 only | — | S3 bucket name |
| `FREE_TESTS_PER_WEEK` | — | `3` | Weekly limit for free tier |
| `ALLOWED_ORIGINS` | — | `["http://localhost:3000"]` | CORS allowed origins (JSON array) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL (e.g. `https://api.yourdomain.com/api/v1`) |

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register new user |
| `POST` | `/api/v1/auth/login` | No | Login → access token |
| `GET` | `/api/v1/auth/me` | JWT | Current user profile |
| `GET` | `/api/v1/boards` | JWT | Full curriculum tree (boards→classes→subjects→chapters) |
| `POST` | `/api/v1/tests/generate` | JWT | Generate a new test (RAG + OpenAI) |
| `GET` | `/api/v1/tests` | JWT | List user's tests |
| `GET` | `/api/v1/tests/{id}` | JWT | Get single test |
| `POST` | `/api/v1/tests/{id}/submit` | JWT | Submit answers → score |
| `GET` | `/api/v1/usage` | JWT | Weekly usage stats |
| `GET` | `/health` | No | Health check |

---

## Adding More Boards / Classes / Subjects

The schema is fully generic. Class 10 CBSE is just seeded data.

```python
# scripts/seed_data.py — extend with new data
board = Board(name="Maharashtra State Board", code="MSBSHSE", ...)
class_9 = Class(board_id=board.id, class_number=9, display_name="Class 9")
science = Subject(class_id=class_9.id, subject_name="Science", subject_code="SCI")
# Add chapters...
```

No code changes needed — the API serves whatever is in the DB.

---

## Subscription / Payment Integration

The `subscription_tier` column on `User` and the `TIER_LIMITS` dict in `usage_service.py` are designed for this.

**To add Razorpay / Stripe:**

1. Add a `subscriptions` table or webhook handler
2. On successful payment webhook → `UPDATE users SET subscription_tier = 'basic' WHERE id = ?`
3. Usage limits automatically apply from `TIER_LIMITS` — **no other code changes needed**
4. Frontend: add a pricing/upgrade page that calls your payment provider's SDK

The architecture is payment-provider agnostic. The tier system is already live.

---

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT access tokens (60-min expiry)
- [x] Route-level auth via `get_current_user` dependency
- [x] CORS locked to `ALLOWED_ORIGINS`
- [x] Rate limiting middleware (in-process; replace with Redis for multi-instance)
- [x] SQL injection protected (SQLAlchemy ORM parameterised queries)
- [x] No secrets committed (`.env` in `.gitignore`)
- [ ] Enable RDS encryption at rest (AWS console)
- [ ] Enable S3 server-side encryption (SSE-S3 or SSE-KMS)
- [ ] Set up AWS WAF in front of ALB (production)
