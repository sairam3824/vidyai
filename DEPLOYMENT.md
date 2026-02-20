# Vidyai — Full Deployment Guide

## Architecture

```
Vercel (Next.js frontend)
    ↕ Supabase Auth (JWT)
    ↕ API calls

AWS EC2 t2.micro (Docker)
    ├── FastAPI backend  (port 8000)
    ├── Celery worker    (PDF ingestion queue)
    └── Redis            (port 6379, cache + queue)

Supabase
    ├── PostgreSQL + pgvector (metadata + embeddings)
    └── Auth (email/password + Google OAuth)

AWS S3
    └── PDF files
```

---

## Step 1 — Supabase Setup

### 1.1 Create a Supabase project
1. Go to https://supabase.com → New Project
2. Choose a region close to India (e.g. `ap-south-1` Singapore)
3. Save the **database password**

### 1.2 Run the schema
1. Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

### 1.3 Get your keys
Go to **Project Settings → API**. You need:
- `Project URL` → `SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
- **Project Settings → API → JWT Settings → JWT Secret** → `SUPABASE_JWT_SECRET`
- **Project Settings → Database → Connection string (Transaction)** → `DATABASE_URL`

### 1.4 Enable Google OAuth
1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable it
3. Go to **Google Cloud Console** (console.cloud.google.com):
   - Create a project → **APIs & Services → Credentials → OAuth 2.0 Client ID**
   - Application type: **Web Application**
   - Authorized redirect URI: `https://[ref].supabase.co/auth/v1/callback`
4. Paste the **Client ID** and **Client Secret** back into Supabase
5. In Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 1.5 Set your first admin user
After you register in the app, run this in Supabase SQL Editor:
```sql
update public.profiles
set is_admin = true
where email = 'your@email.com';
```

---

## Step 2 — AWS Setup

### 2.1 Create S3 bucket
```bash
# Using AWS CLI
aws s3 mb s3://vidyai-pdfs --region ap-south-1

# Disable public access (backend uses presigned URLs)
aws s3api put-public-access-block \
  --bucket vidyai-pdfs \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2.2 Create IAM user for backend
1. AWS Console → **IAM → Users → Create User**
2. Attach policy: `AmazonS3FullAccess` (or scope to bucket only)
3. Create **Access Key** → save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### 2.3 Launch EC2 instance
1. EC2 → **Launch Instance**
   - AMI: **Ubuntu 22.04 LTS**
   - Instance type: **t2.micro** (free tier)
   - Storage: 20 GB gp3
   - Security Group — open:
     - Port 22 (SSH) — your IP only
     - Port 80 (HTTP) — 0.0.0.0/0
     - Port 443 (HTTPS) — 0.0.0.0/0
     - Port 8000 (API) — 0.0.0.0/0 (or via Nginx only)
2. Create/select a **key pair** (.pem file)
3. **Allocate an Elastic IP** and associate it to the instance

---

## Step 3 — EC2 Server Setup

SSH into your instance:
```bash
ssh -i your-key.pem ubuntu@<ELASTIC-IP>
```

### 3.1 Install Docker + Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Run Docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker compose version
```

### 3.2 Install Nginx
```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

### 3.3 Clone your repo
```bash
git clone https://github.com/yourusername/vidyai.git
cd vidyai
```

### 3.4 Create backend environment file
```bash
cp backend/.env.example backend/.env
nano backend/.env
# Fill in all values (Supabase, OpenAI, AWS, Redis)
```

### 3.5 Start services
```bash
docker compose up -d --build
```

Verify:
```bash
docker compose ps           # all containers running
curl http://localhost:8000/health   # {"status":"ok"}
```

### 3.6 Configure Nginx (reverse proxy)
```bash
sudo nano /etc/nginx/sites-available/vidyai
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 50M;   # allow large PDF uploads

    location / {
        proxy_pass         http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;   # allow time for PDF uploads
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/vidyai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.7 SSL with Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
# Follow prompts — auto-renews
```

---

## Step 4 — Vercel (Frontend)

### 4.1 Deploy
```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel
# Follow prompts — select project, set framework to Next.js
```

Or use **Vercel Dashboard** → Import Git Repository.

### 4.2 Set environment variables
In Vercel Dashboard → Project → **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` |

### 4.3 Update Supabase redirect URL
Supabase Dashboard → **Authentication → URL Configuration**:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## Step 5 — DNS

Point your domain to EC2:
```
api.yourdomain.com  →  A record  →  <ELASTIC-IP>
```

---

## Step 6 — Local Development

```bash
# 1. Clone
git clone https://github.com/yourusername/vidyai.git
cd vidyai

# 2. Backend env (connect to Supabase cloud — no local DB)
cp backend/.env.example backend/.env
# Fill in Supabase keys, OpenAI key, AWS S3 keys
# Set STORAGE_MODE=local for local dev (PDFs saved to ./storage)

# 3. Frontend env
cp frontend/.env.example frontend/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Start backend + Redis + Celery worker
docker compose up -d

# 5. Start frontend (separate terminal)
cd frontend
npm install
npm run dev

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API docs: http://localhost:8000/docs (DEBUG=true only)
```

---

## Maintenance

### View logs
```bash
docker compose logs -f backend    # FastAPI
docker compose logs -f worker     # Celery
docker compose logs -f redis
```

### Restart after code changes
```bash
git pull
docker compose up -d --build
```

### Monitor Celery queue
```bash
docker compose exec worker celery -A app.worker.celery_app inspect active
```

### Set admin user (SQL Editor)
```sql
update public.profiles
set is_admin = true
where email = 'admin@yourdomain.com';
```

### Update subscription tier
```sql
update public.profiles
set subscription_tier = 'premium'
where email = 'user@example.com';
```

---

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| AWS EC2 t2.micro | ~$8.50 |
| AWS S3 (PDFs, ~10 GB) | ~$0.25 |
| Supabase Pro (if needed) | $25 (free tier: 500 MB DB) |
| Vercel (Hobby) | Free |
| OpenAI (embeddings + GPT-4o) | ~$5–20 depending on usage |
| **Total** | **~$15–55/month** |

> Supabase free tier: 500 MB DB, 1 GB storage, 50k MAU — sufficient for early stage.
