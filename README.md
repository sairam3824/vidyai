<div align="center">

# Vidyai

**AI-powered test generation for CBSE Class 10 — and beyond.**

[![Live](https://img.shields.io/badge/live-vidyaedtech.saiii.in-brightgreen)](https://vidyaedtech.saiii.in)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)

**Live demo: [vidyaedtech.saiii.in](https://vidyaedtech.saiii.in)**

Vidyai is a production-grade SaaS platform that uses Retrieval-Augmented Generation (RAG) and GPT-4o to generate contextually accurate, curriculum-aligned multiple-choice questions from uploaded textbook PDFs. Students pick a chapter, and within seconds receive a full 10-question test with explanations — powered by the actual textbook content.

</div>

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Quick Start (Docker)](#quick-start-docker)
6. [Manual Setup](#manual-setup)
   - [Prerequisites](#prerequisites)
   - [Backend](#backend)
   - [Frontend](#frontend)
7. [PDF Ingestion (RAG Pipeline)](#pdf-ingestion-rag-pipeline)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [Deployment](#deployment)
    - [Frontend — Vercel](#frontend--vercel)
    - [Backend — AWS EC2](#backend--aws-ec2)
11. [Extending the Curriculum](#extending-the-curriculum)
12. [Payment Integration](#payment-integration)
13. [Security](#security)
14. [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **AI Test Generation** | 10 MCQs per test, graded by difficulty (30% easy / 50% medium / 20% hard), generated from real textbook content |
| **RAG Pipeline** | PDFs → text chunks → OpenAI embeddings → pgvector → GPT-4o prompting for contextually accurate questions |
| **Answer Submission & Scoring** | Submit answers, receive score and per-question explanations |
| **Curriculum Hierarchy** | Boards → Classes → Subjects → Chapters (seeded with CBSE Class 10; extensible to any board) |
| **Tier-Based Usage Limits** | Free (3/week), Basic (20/week), Premium (100/week) — Redis-cached with weekly resets |
| **Supabase Auth** | Email/password + Google OAuth via Supabase; JWT-protected API |
| **Admin Dashboard** | Upload PDFs, monitor ingestion jobs, manage users and subscription tiers |
| **Async Ingestion** | Celery + Redis workers handle PDF processing in the background without blocking the API |
| **Cloud-Ready** | Docker Compose for local dev; EC2 + Vercel + S3 + Supabase for production |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 14 Frontend                        │
│             TypeScript · Tailwind CSS · Zustand                 │
│                 Deployed on Vercel (or EC2)                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST (JWT)
┌──────────────────────────────▼──────────────────────────────────┐
│                       FastAPI Backend                            │
│         Auth · Boards · Tests · Usage · Admin Routers           │
│              JWT Auth · Rate Limiting · CORS                    │
└───────┬──────────────────────────────────────────┬──────────────┘
        │ SQLAlchemy ORM                           │ OpenAI SDK
┌───────▼───────────────────┐         ┌────────────▼─────────────┐
│  Supabase PostgreSQL      │         │  OpenAI API              │
│  + pgvector extension     │         │  text-embedding-3-small  │
│  users, boards, chapters  │         │  gpt-4o                  │
│  text_chunks (embeddings) │         └──────────────────────────┘
│  tests, usage, jobs       │
└───────┬───────────────────┘
        │ Celery / boto3
┌───────▼───────────────────┐   ┌──────────────────────────────┐
│  Redis                    │   │  AWS S3                      │
│  Task queue · Cache       │   │  Textbook PDFs (read once    │
│  Usage rate limiting      │   │  at ingest time)             │
└───────────────────────────┘   └──────────────────────────────┘
```

**RAG Flow (test generation):**

```
User selects chapter
  → Check weekly usage limit (Redis)
  → Cosine similarity search in pgvector (filtered by chapter_id)
  → Top-K chunks assembled into prompt context
  → GPT-4o generates 10 MCQs with options + explanations
  → Test stored in database
  → JSON returned to frontend
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 (async Python) |
| Database | Supabase PostgreSQL 15/16 + pgvector |
| ORM | SQLAlchemy 2.0 |
| Auth | Supabase Auth (JWT + OAuth2) |
| AI | OpenAI `gpt-4o` + `text-embedding-3-small` (1536-dim) |
| Queue | Celery 5.4 + Redis 7 |
| PDF Parsing | pypdf 5.1 |
| Storage | AWS S3 (production) / Local FS (development) |
| Server | Uvicorn (ASGI) |
| Migrations | Alembic |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 |
| State | Zustand 5.0 (persisted) |
| Auth | @supabase/supabase-js |
| Animation | Framer Motion 12 |
| Icons | lucide-react |

### Infrastructure
| Component | Technology |
|---|---|
| Auth + Database | Supabase (managed) |
| Frontend Hosting | Vercel |
| Backend Hosting | AWS EC2 (Docker) |
| PDF Storage | AWS S3 |
| Reverse Proxy | Nginx + Let's Encrypt |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
vidyai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, middleware, routers
│   │   ├── config.py            # Pydantic Settings (env-driven)
│   │   ├── database.py          # SQLAlchemy engine + session factory
│   │   ├── core/
│   │   │   ├── security.py      # JWT validation + Supabase auth
│   │   │   └── exceptions.py    # Typed HTTP exceptions
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # auth, boards, tests, usage, admin
│   │   ├── services/            # Business logic: RAG, generation, storage, usage
│   │   ├── middleware/          # Rate limiting
│   │   ├── tasks/               # Celery async tasks (PDF ingestion)
│   │   └── worker.py            # Celery worker config
│   ├── migrations/              # Alembic migration scripts
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
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── (auth)/               # /login, /register
│   │   │   └── (dashboard)/          # /dashboard, /generate, /tests/[id], /profile
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Card, Input, Badge, Toast, Spinner…
│   │   │   ├── layout/               # Sidebar, Header
│   │   │   ├── auth/                 # LoginForm, RegisterForm
│   │   │   └── test/                 # ChapterSelector, TestDisplay, QuestionCard
│   │   ├── hooks/                    # useAuth, useToast
│   │   ├── store/                    # Zustand auth store (localStorage persisted)
│   │   ├── lib/                      # api.ts (typed API client), utils.ts, supabase.ts
│   │   └── types/                    # Shared TypeScript interfaces
│   ├── middleware.ts                  # Next.js route protection
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── supabase/
│   └── schema.sql               # Full database schema (run in Supabase SQL editor)
├── docker-compose.yml           # Local dev: Redis + Backend + Celery Worker
├── docker-compose.prod.yml      # Production overrides
├── setup.sh                     # One-shot local setup script
├── start.sh / stop.sh           # Convenience scripts
└── DEPLOYMENT.md                # Detailed AWS + Vercel deployment guide
```

---

## Quick Start (Docker)

The fastest way to run Vidyai locally. Requires Docker and a Supabase project.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/vidyai.git
cd vidyai

# 2. Set up Supabase
#    - Create a free project at https://supabase.com
#    - Run supabase/schema.sql in the Supabase SQL editor
#    - Enable the pgvector extension in Supabase Dashboard → Extensions

# 3. Configure environment
cp backend/.env.example backend/.env
# Required values to set in backend/.env:
#   DATABASE_URL       — from Supabase Project Settings → Database → Connection string
#   SUPABASE_URL       — from Supabase Project Settings → API
#   SUPABASE_ANON_KEY  — from Supabase Project Settings → API
#   SUPABASE_SERVICE_ROLE_KEY — from Supabase Project Settings → API
#   OPENAI_API_KEY     — from platform.openai.com

cp frontend/.env.example frontend/.env.local
# Required values to set in frontend/.env.local:
#   NEXT_PUBLIC_SUPABASE_URL      — same as SUPABASE_URL above
#   NEXT_PUBLIC_SUPABASE_ANON_KEY — same as SUPABASE_ANON_KEY above
#   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# 4. Start all services
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Redis | localhost:6379 |

```bash
# Stop and clean up
docker compose down -v
```

---

## Manual Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- Redis 7 (for Celery and rate limiting)
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenAI](https://platform.openai.com) API key

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — at minimum set: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY,
#             SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY

# Run database migrations
alembic upgrade head

# Seed CBSE Class 10 curriculum
python scripts/seed_data.py

# Start development server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal, for PDF ingestion)
celery -A app.worker worker --loglevel=info
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#                   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

App available at: http://localhost:3000

---

## PDF Ingestion (RAG Pipeline)

PDFs are processed once: text is extracted, chunked into ~900-character segments, embedded via OpenAI, and stored in PostgreSQL with pgvector. **Test generation queries the database only — not S3.**

### Local ingestion

```bash
# Activate backend virtualenv
source backend/.venv/bin/activate

# Get chapter IDs (after seeding)
# Check the seed output or query:  SELECT id, chapter_name FROM chapters;

# Ingest a PDF for a specific chapter
python backend/scripts/ingest_pdf.py \
  --pdf /path/to/cbse_class10_science_chapter1.pdf \
  --chapter-id 1

# Repeat for each chapter
```

### Via Admin UI

1. Log in as an admin user
2. Navigate to **Admin → Upload**
3. Select a chapter and upload the PDF
4. Monitor the ingestion job status (pending → processing → ready)

### Via Admin API

```bash
# Upload and ingest a chapter PDF
curl -X POST http://localhost:8000/api/v1/admin/upload \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -F "chapter_id=1" \
  -F "file=@/path/to/chapter.pdf"

# Poll job status
curl http://localhost:8000/api/v1/admin/jobs/<job_id> \
  -H "Authorization: Bearer <admin_jwt_token>"
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Supabase PostgreSQL connection string (use the pooled connection on port 6543) |
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | — | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Supabase service role key (admin operations) |
| `OPENAI_API_KEY` | ✅ | — | OpenAI secret key |
| `REDIS_URL` | — | `redis://localhost:6379/0` | Redis connection URL |
| `DEBUG` | — | `false` | Enable Swagger UI and verbose logging |
| `ENVIRONMENT` | — | `development` | `development` or `production` |
| `OPENAI_CHAT_MODEL` | — | `gpt-4o` | GPT model for question generation |
| `OPENAI_EMBEDDING_MODEL` | — | `text-embedding-3-small` | Embedding model |
| `EMBEDDING_DIMENSIONS` | — | `1536` | Must match embedding model output |
| `RAG_TOP_K` | — | `6` | Number of chunks retrieved per query |
| `STORAGE_MODE` | — | `local` | `local` or `s3` |
| `LOCAL_STORAGE_PATH` | — | `./storage` | Path for local PDF storage (when `STORAGE_MODE=local`) |
| `AWS_ACCESS_KEY_ID` | S3 only | — | AWS credentials for S3 access |
| `AWS_SECRET_ACCESS_KEY` | S3 only | — | AWS credentials for S3 access |
| `AWS_REGION` | S3 only | `us-east-1` | S3 bucket region |
| `S3_BUCKET_NAME` | S3 only | — | S3 bucket name for PDF storage |
| `FREE_TESTS_PER_WEEK` | — | `3` | Weekly test limit for free tier |
| `BASIC_TESTS_PER_WEEK` | — | `20` | Weekly test limit for basic tier |
| `PREMIUM_TESTS_PER_WEEK` | — | `100` | Weekly test limit for premium tier |
| `ALLOWED_ORIGINS` | — | `["http://localhost:3000"]` | CORS origins (JSON array string) |

Generate a secure `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL (e.g. `https://api.yourdomain.com/api/v1`) |

---

## API Reference

All endpoints (except `/health` and auth) require a `Authorization: Bearer <jwt>` header.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register new user |
| `POST` | `/api/v1/auth/login` | No | Login → access token |
| `GET` | `/api/v1/auth/me` | JWT | Get current user profile |
| `PATCH` | `/api/v1/auth/me` | JWT | Update user profile |

### Curriculum
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/boards` | JWT | Full hierarchy: boards → classes → subjects → chapters |
| `GET` | `/api/v1/boards/chapters/{id}` | JWT | Chapter details + chunk count |
| `POST` | `/api/v1/boards/chapters/{id}/summary` | JWT | Generate AI chapter summary |

### Tests
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/tests/generate` | JWT | Generate a new 10-MCQ test |
| `GET` | `/api/v1/tests` | JWT | List user's test history |
| `GET` | `/api/v1/tests/{id}` | JWT | Get a single test |
| `POST` | `/api/v1/tests/{id}/submit` | JWT | Submit answers → receive score |

### Usage
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/usage` | JWT | Weekly usage stats and limits |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | Admin | List all users |
| `PATCH` | `/api/v1/admin/users/{id}/tier` | Admin | Update user subscription tier |
| `GET` | `/api/v1/admin/chapters` | Admin | List chapters with ingestion status |
| `POST` | `/api/v1/admin/upload` | Admin | Upload PDF for async ingestion |
| `GET` | `/api/v1/admin/jobs/{id}` | Admin | Poll ingestion job status |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Service health check |

Full interactive docs (when `DEBUG=true`): http://localhost:8000/docs

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for a complete step-by-step guide. Summary below.

### Frontend — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Backend — AWS EC2

```bash
# 1. Launch EC2 (Amazon Linux 2023, t3.small+)
#    Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

# 2. Install Docker
sudo dnf update -y && sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# 3. Clone and configure
git clone https://github.com/yourusername/vidyai.git && cd vidyai
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# 4. Deploy (uses Supabase for DB, no local Postgres container needed)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 5. Nginx reverse proxy + SSL
sudo dnf install -y nginx certbot python3-certbot-nginx
# Configure /etc/nginx/conf.d/vidyai.conf (see DEPLOYMENT.md)
sudo certbot --nginx -d api.yourdomain.com
```

#### Production `.env` additions

```bash
ENVIRONMENT=production
DEBUG=false
STORAGE_MODE=s3
S3_BUCKET_NAME=your-vidyai-pdfs
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
ALLOWED_ORIGINS=["https://your-app.vercel.app"]
```

---

## Extending the Curriculum

The schema is curriculum-agnostic. CBSE Class 10 is just seed data.

```python
# backend/scripts/seed_data.py — add any board/class/subject/chapter
board = Board(name="Maharashtra State Board", code="MSBSHSE")
class_obj = Class(board_id=board.id, class_number=9, display_name="Class 9")
subject = Subject(class_id=class_obj.id, subject_name="Science", subject_code="SCI09")
chapter = Chapter(subject_id=subject.id, chapter_number=1, chapter_name="Living World")
```

No API or frontend changes required — the curriculum tree is served dynamically from the database.

---

## Payment Integration

The `subscription_tier` field on `User` and the `TIER_LIMITS` config are already wired up. Plugging in Razorpay or Stripe takes three steps:

1. **Add a webhook handler** that listens for successful payment events
2. **Update the user tier**: `UPDATE profiles SET subscription_tier = 'premium' WHERE id = ?`
3. **Add a pricing page** in the frontend that calls your payment provider's SDK

The rate limiting logic reads from `TIER_LIMITS` automatically — **no other backend changes needed**.

---

## Security

| Check | Status |
|---|---|
| Passwords hashed with bcrypt | ✅ |
| JWT tokens with expiry (Supabase-managed) | ✅ |
| All routes protected via `get_current_user` dependency | ✅ |
| CORS locked to `ALLOWED_ORIGINS` | ✅ |
| Rate limiting middleware | ✅ |
| SQL injection protected (SQLAlchemy ORM, parameterised) | ✅ |
| No secrets in source (`.env` in `.gitignore`) | ✅ |
| Supabase Row Level Security (RLS) supported | ✅ |
| S3 bucket public access blocked | Recommended |
| RDS/Supabase encryption at rest | Enabled by default (Supabase) |
| AWS WAF in front of load balancer | Recommended for production |

---

## License

Copyright 2024 Sairam Maruri

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full text.
