# Vidyai — AWS Deployment Guide

> **URL:** `https://vidyai.saiii.in` (subdomain of your existing `saiii.in`)
> **Scope:** CBSE Class 10 Mathematics MVP — EC2 t2.micro + RDS PostgreSQL 16 + Redis + S3
> **Estimated monthly cost: ~$25–30 USD** (ap-south-1 / Mumbai region)

> **Your existing `saiii.in` portfolio is completely unaffected.** You are only adding a new DNS record for the `vidyai` subdomain that points to a brand-new EC2 instance. Nothing touches the existing server or DNS records.

---

## Architecture

```
User browser
     │
     ▼
vidyai.saiii.in  (new A record → new EC2 Elastic IP)
     │
   Nginx  ──── Let's Encrypt SSL
     │
  ┌──┴───────────────┐
  │                  │
Next.js :3000    FastAPI :8000
                     │
           ┌─────────┤
           │         │
       Redis :6379  RDS PostgreSQL :5432
       (on EC2)      (managed, pgvector)
                     │
                  S3 Bucket
                (PDF storage)

saiii.in (portfolio) ─── unchanged, separate server/IP
```

---

## Cost Breakdown

| Service | Type | Cost/month |
|---|---|---|
| EC2 | t2.micro (1 vCPU, 1 GB RAM) | ~$8.50 (free tier yr 1) |
| RDS | db.t3.micro PostgreSQL 16 | ~$15 |
| Elastic IP | Attached to EC2 | Free |
| S3 | ~5 GB | ~$0.50 |
| Data Transfer | Minimal | ~$1 |
| **Total** | | **~$25–30** |

> **Free Tier note:** If your AWS account is under 12 months old, EC2 t2.micro (750 hrs/month) and RDS db.t3.micro (750 hrs/month) are both free tier eligible — bringing the cost to ~$2/month.

---

## Prerequisites

Before starting, have these ready:

- [ ] AWS account with billing enabled
- [ ] `saiii.in` DNS access (wherever you manage its DNS — GoDaddy, Cloudflare, Route 53, etc.)
- [ ] OpenAI API key (`sk-...`)
- [ ] AWS CLI installed on your Mac → `brew install awscli`
- [ ] Git repository with all latest code committed and pushed

---

## Phase 1 — AWS Account Setup

### 1.1 Create an IAM User (do NOT use root account)

1. Go to **AWS Console → IAM → Users → Create user**
2. Username: `vidyai-deploy`
3. Select **"Attach policies directly"**
4. Attach these managed policies:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonS3FullAccess`
5. Click **Create user**
6. Open the user → **Security credentials** tab → **Create access key**
7. Choose **"Command Line Interface (CLI)"** → Next → Create
8. **Download the CSV immediately** — the secret key is shown only once

Configure AWS CLI on your Mac:

```bash
aws configure
# AWS Access Key ID:     <paste from CSV>
# AWS Secret Access Key: <paste from CSV>
# Default region:        ap-south-1
# Default output format: json
```

Verify:

```bash
aws sts get-caller-identity
# Should show your account ID and user ARN
```

---

### 1.2 Create S3 Bucket for PDF Storage

Pick a globally unique bucket name (e.g., `vidyai-textbooks-prod-2024`):

```bash
BUCKET_NAME="vidyai-textbooks-prod-2024"   # change this to something unique

aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Block all public access
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Bucket created: $BUCKET_NAME"
```

---

### 1.3 Create EC2 Key Pair

```bash
aws ec2 create-key-pair \
  --key-name vidyai-key \
  --region ap-south-1 \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/vidyai-key.pem

chmod 400 ~/.ssh/vidyai-key.pem
echo "Key saved to ~/.ssh/vidyai-key.pem"
```

---

### 1.4 Create Security Groups

Get your default VPC ID:

```bash
VPC_ID=$(aws ec2 describe-vpcs \
  --region ap-south-1 \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"
```

**EC2 Security Group** (allows SSH from your IP, HTTP + HTTPS from everywhere):

```bash
EC2_SG_ID=$(aws ec2 create-security-group \
  --group-name vidyai-ec2-sg \
  --description "Vidyai EC2 - HTTP/HTTPS/SSH" \
  --vpc-id $VPC_ID \
  --region ap-south-1 \
  --query 'GroupId' \
  --output text)

echo "EC2 SG: $EC2_SG_ID"

# Your current IP only for SSH (more secure than 0.0.0.0/0)
MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG_ID --protocol tcp --port 22 \
  --cidr ${MY_IP}/32 --region ap-south-1

# HTTP — needed for Let's Encrypt domain verification
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG_ID --protocol tcp --port 80 \
  --cidr 0.0.0.0/0 --region ap-south-1

# HTTPS — production traffic
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG_ID --protocol tcp --port 443 \
  --cidr 0.0.0.0/0 --region ap-south-1
```

**RDS Security Group** (PostgreSQL only from EC2, never from internet):

```bash
RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name vidyai-rds-sg \
  --description "Vidyai RDS - PostgreSQL from EC2 only" \
  --vpc-id $VPC_ID \
  --region ap-south-1 \
  --query 'GroupId' \
  --output text)

echo "RDS SG: $RDS_SG_ID"

aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID --protocol tcp --port 5432 \
  --source-group $EC2_SG_ID --region ap-south-1
```

---

### 1.5 Launch RDS PostgreSQL 16

> pgvector is pre-installed on RDS PostgreSQL 15+. No custom parameter group needed.

```bash
aws rds create-db-instance \
  --db-instance-identifier vidyai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.6 \
  --master-username vidyai \
  --master-user-password "YourStrongDBPassword123!" \
  --db-name vidyai \
  --allocated-storage 20 \
  --storage-type gp3 \
  --no-multi-az \
  --no-publicly-accessible \
  --vpc-security-group-ids $RDS_SG_ID \
  --backup-retention-period 7 \
  --region ap-south-1
```

RDS takes ~8–10 minutes to provision. Wait for it:

```bash
echo "Waiting for RDS... (takes ~8 minutes)"
aws rds wait db-instance-available \
  --db-instance-identifier vidyai-db \
  --region ap-south-1

# Get and save the endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier vidyai-db \
  --region ap-south-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS endpoint: $RDS_ENDPOINT"
# Example: vidyai-db.abcdef123456.ap-south-1.rds.amazonaws.com
```

**Save this endpoint** — you need it for the `.env` file.

---

### 1.6 Launch EC2 t2.micro

Find the latest Ubuntu 24.04 LTS AMI:

```bash
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters \
    "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" \
    "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text \
  --region ap-south-1)

echo "AMI: $AMI_ID"
```

Launch the instance:

```bash
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t2.micro \
  --key-name vidyai-key \
  --security-group-ids $EC2_SG_ID \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=vidyai-app}]' \
  --region ap-south-1 \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Wait for it to start
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region ap-south-1
echo "Instance is running"
```

Allocate an Elastic IP (keeps IP stable if instance restarts):

```bash
ALLOC_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --region ap-south-1 \
  --query 'AllocationId' \
  --output text)

aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --allocation-id $ALLOC_ID \
  --region ap-south-1

ELASTIC_IP=$(aws ec2 describe-addresses \
  --allocation-ids $ALLOC_ID \
  --region ap-south-1 \
  --query 'Addresses[0].PublicIp' \
  --output text)

echo "Elastic IP: $ELASTIC_IP"
# Example: 13.233.45.67  ← save this, you'll add it to DNS
```

---

## Phase 2 — DNS Setup

> **This step only adds a new record. It does NOT touch your existing `saiii.in` portfolio records.**

Log in to wherever `saiii.in` DNS is managed (GoDaddy, Cloudflare, Namecheap, Route 53, etc.) and add **one new A record**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `vidyai` | `<YOUR_ELASTIC_IP>` | 300 |

This creates `vidyai.saiii.in` → your new EC2 instance. Your existing `saiii.in` and `www.saiii.in` records remain exactly as they are.

Wait 2–5 minutes for DNS to propagate, then verify from your Mac:

```bash
nslookup vidyai.saiii.in
# Address should match your Elastic IP
```

---

## Phase 3 — Server Setup

SSH into the new EC2 instance:

```bash
ssh -i ~/.ssh/vidyai-key.pem ubuntu@<YOUR_ELASTIC_IP>
```

All commands from here run **on the EC2 instance**.

---

### 3.1 Add Swap Space (critical for t2.micro — 1 GB RAM)

t2.micro only has 1 GB RAM. Without swap, the Docker image build will likely run out of memory and crash. Add 2 GB swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
# Should show ~2G under Swap
```

---

### 3.2 Install Docker and Docker Compose

```bash
sudo apt-get update && sudo apt-get upgrade -y

sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Allow ubuntu user to run docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version        # Docker version 27.x
docker compose version  # Docker Compose version v2.x
```

---

### 3.3 Install Nginx, Certbot, and PostgreSQL Client

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx postgresql-client git

sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### 3.4 Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/vidyai.git ~/vidyai
cd ~/vidyai
```

---

## Phase 4 — Application Configuration

### 4.1 Reduce Uvicorn Workers for t2.micro

On t2.micro (1 GB RAM), 4 uvicorn workers is too heavy when running alongside Next.js and Redis. Change it to 2:

```bash
nano ~/vidyai/docker-compose.prod.yml
```

Find this line:
```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
Change `4` to `2`:
```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

Save and close (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

### 4.2 Generate a Secret Key

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Example: a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5
# Copy this — it becomes SECRET_KEY
```

---

### 4.3 Create Backend `.env`

```bash
nano ~/vidyai/backend/.env
```

Paste and fill in your real values (every `CHANGE_ME` must be replaced):

```env
# ── App
APP_NAME=Vidyai
APP_VERSION=1.0.0
DEBUG=false
ENVIRONMENT=production
API_V1_PREFIX=/api/v1

# ── Database
DATABASE_URL=postgresql://vidyai:YourStrongDBPassword123!@vidyai-db.REPLACE_WITH_RDS_ENDPOINT.ap-south-1.rds.amazonaws.com:5432/vidyai

# ── Redis (internal Docker network — do not change this)
REDIS_URL=redis://redis:6379/0
CACHE_TTL_SECONDS=604800

# ── JWT
SECRET_KEY=PASTE_YOUR_GENERATED_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── OpenAI
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o
EMBEDDING_DIMENSIONS=1536
RAG_TOP_K=6

# ── Storage
STORAGE_MODE=s3
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
S3_BUCKET_NAME=vidyai-textbooks-prod-2024

# ── Usage Limits
FREE_TESTS_PER_WEEK=3
BASIC_TESTS_PER_WEEK=20
PREMIUM_TESTS_PER_WEEK=100

# ── Rate Limiting
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_WINDOW_SECONDS=3600

# ── CORS
ALLOWED_ORIGINS=["https://vidyai.saiii.in"]
```

---

### 4.4 Create Frontend `.env.production`

Next.js bakes `NEXT_PUBLIC_*` variables into the JavaScript bundle **at build time**. This file must exist before running `docker compose up --build`.

```bash
cat > ~/vidyai/frontend/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://vidyai.saiii.in/api/v1
EOF
```

---

### 4.5 Update `docker-compose.prod.yml` Domain

```bash
nano ~/vidyai/docker-compose.prod.yml
```

Update these two lines:

```yaml
# In backend environment:
ALLOWED_ORIGINS: '["https://vidyai.saiii.in"]'

# In frontend environment:
NEXT_PUBLIC_API_URL: https://vidyai.saiii.in/api/v1
```

Save and close.

---

## Phase 5 — Enable pgvector on RDS

Connect to your RDS instance from EC2 and enable the extension:

```bash
psql "postgresql://vidyai:YourStrongDBPassword123!@REPLACE_RDS_ENDPOINT:5432/vidyai"
```

Inside the psql prompt:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
-- Expected output:
--  extname | extversion
-- ---------+------------
--  vector  | 0.7.0

\q
```

---

## Phase 6 — Deploy the Application

```bash
cd ~/vidyai

# Build all images and start in detached mode
# First build takes 5–10 minutes on t2.micro
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Watch the logs until both services are ready:

```bash
docker compose logs -f
```

Look for these two lines, then press `Ctrl+C`:
```
vidyai-backend  | INFO  | uvicorn.server | Application startup complete.
vidyai-frontend | ▲ Next.js 14.2.18
```

---

### 6.1 Verify Migrations

The backend automatically runs `alembic upgrade head` on startup. Confirm both migrations applied:

```bash
docker exec vidyai-backend alembic current
# Expected: 002 (head)
```

If it shows anything else, run:

```bash
docker exec vidyai-backend alembic upgrade head
```

---

### 6.2 Verify Curriculum Seed

The 14 CBSE Class 10 Maths chapters are seeded automatically. Confirm:

```bash
docker exec vidyai-backend python scripts/seed_data.py
# Expected: ✓ Seed data already exists — skipping.
```

Print chapter IDs (needed for PDF ingestion):

```bash
docker exec vidyai-backend python3 -c "
from app.database import SessionLocal
from app.models.board import Chapter
db = SessionLocal()
for c in db.query(Chapter).order_by(Chapter.chapter_number).all():
    print(f'ID={c.id:2d}  Ch={c.chapter_number:02d}  {c.chapter_name}')
db.close()
"
```

Expected output:
```
ID= 1  Ch=01  Real Numbers
ID= 2  Ch=02  Polynomials
ID= 3  Ch=03  Pair of Linear Equations in Two Variables
ID= 4  Ch=04  Quadratic Equations
ID= 5  Ch=05  Arithmetic Progressions
ID= 6  Ch=06  Triangles
ID= 7  Ch=07  Coordinate Geometry
ID= 8  Ch=08  Introduction to Trigonometry
ID= 9  Ch=09  Some Applications of Trigonometry
ID=10  Ch=10  Circles
ID=11  Ch=11  Areas Related to Circles
ID=12  Ch=12  Surface Areas and Volumes
ID=13  Ch=13  Statistics
ID=14  Ch=14  Probability
```

---

### 6.3 Ingest CBSE Class 10 Maths PDFs

The PDFs are already in your cloned repository (`CBSC/Class 10/Mathematics/`). Copy them into the running backend container and ingest each chapter:

```bash
# Copy all PDFs into the container
docker cp ~/vidyai/CBSC/. vidyai-backend:/app/CBSC/
```

Now ingest all 14 chapters (calls OpenAI embeddings API — total cost ~$0.15):

```bash
declare -A CHAPTERS=(
  [1]="Real Numbers chapter 1.pdf"
  [2]="Polynomials chapter 2.pdf"
  [3]="Pair Of Liner Equations In Two Variables chapter 3.pdf"
  [4]="Quadratic Equations chapter 4.pdf"
  [5]="Arthmetic Progression chapter 5.pdf"
  [6]="Traingles chapter 6.pdf"
  [7]="Coordinate Geometry chapter 7.pdf"
  [8]="Introduction to Trignometry chapter 8.pdf"
  [9]="Some Applications of Trignometry chapter 9.pdf"
  [10]="Circles chapter 10.pdf"
  [11]="Areas Related to Circles chapter 11.pdf"
  [12]="Surface Areas and Volumes chapter 12.pdf"
  [13]="Statistics chapter 13.pdf"
  [14]="Probability chapter 14.pdf"
)

for ID in $(seq 1 14); do
  PDF="${CHAPTERS[$ID]}"
  echo "━━━ Ingesting chapter $ID: $PDF"
  docker exec vidyai-backend python scripts/ingest_pdf.py \
    --pdf "/app/CBSC/Class 10/Mathematics/$PDF" \
    --chapter-id $ID
done

echo "✓ All chapters ingested"
```

Each chapter takes ~30–60 seconds. Total: ~10–15 minutes.

Verify the chunks are in the database:

```bash
docker exec vidyai-backend python3 -c "
from app.database import SessionLocal
from app.models.text_chunk import TextChunk
db = SessionLocal()
print(f'Total chunks: {db.query(TextChunk).count()}')
db.close()
"
# Expected: 300–600 chunks
```

---

## Phase 7 — Nginx and SSL

### 7.1 Temporary Nginx Config (for Certbot verification)

```bash
sudo tee /etc/nginx/sites-available/vidyai << 'EOF'
server {
    listen 80;
    server_name vidyai.saiii.in;

    location / {
        return 200 'vidyai-ok';
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/vidyai /etc/nginx/sites-enabled/vidyai
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Confirm DNS is resolving and Nginx is responding:

```bash
curl http://vidyai.saiii.in
# Expected: vidyai-ok
```

If this fails, DNS hasn't propagated yet — wait a few more minutes and retry.

---

### 7.2 Obtain SSL Certificate

```bash
sudo certbot --nginx \
  -d vidyai.saiii.in \
  --non-interactive \
  --agree-tos \
  --email your-email@gmail.com
```

Verify auto-renewal is working:

```bash
sudo certbot renew --dry-run
# Expected: Congratulations, all simulated renewals succeeded
```

---

### 7.3 Final Production Nginx Config

Replace the temporary config with the full production config:

```bash
sudo tee /etc/nginx/sites-available/vidyai << 'EOF'
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name vidyai.saiii.in;
    return 301 https://vidyai.saiii.in$request_uri;
}

# Main production server
server {
    listen 443 ssl;
    server_name vidyai.saiii.in;

    ssl_certificate     /etc/letsencrypt/live/vidyai.saiii.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vidyai.saiii.in/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    client_max_body_size 50M;

    # FastAPI backend — /api/ and /health
    location /api/ {
        proxy_pass         http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /health {
        proxy_pass       http://localhost:8000;
        proxy_set_header Host $host;
    }

    # Next.js static assets — long cache
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Next.js frontend — everything else
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
EOF

sudo nginx -t
# Expected: nginx: configuration file test is successful

sudo systemctl reload nginx
```

---

## Phase 8 — Smoke Test

Run these checks. All should pass before you call it done:

```bash
# 1. Health check
curl https://vidyai.saiii.in/health
# Expected: {"status":"ok","version":"1.0.0","env":"production"}

# 2. Curriculum API — should return CBSE + 14 chapters
curl https://vidyai.saiii.in/api/v1/boards | python3 -m json.tool | head -30

# 3. Register a test user
curl -s -X POST https://vidyai.saiii.in/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","full_name":"Test"}' \
  | python3 -m json.tool
# Expected: {"access_token":"...","token_type":"bearer"}

# 4. Open in browser
echo "Open: https://vidyai.saiii.in"
```

---

## Phase 9 — Auto-Restart on EC2 Reboot

```bash
sudo tee /etc/systemd/system/vidyai.service << 'EOF'
[Unit]
Description=Vidyai Docker Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/vidyai
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable vidyai.service
sudo systemctl start vidyai.service
sudo systemctl status vidyai.service
# Expected: Active: active (exited)
```

---

## Ongoing Operations

### Deploying Code Updates

**On your Mac:**
```bash
git add .
git commit -m "describe change"
git push origin main
```

**On EC2:**
```bash
cd ~/vidyai
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

### Adding a New Class or Subject (e.g., Class 10 Science)

1. Add the new subject and chapters to `backend/scripts/seed_data.py`
2. Commit, push, pull on EC2, rebuild
3. Run seed: `docker exec vidyai-backend python scripts/seed_data.py`
4. Get the new chapter IDs:
   ```bash
   docker exec vidyai-backend python3 -c "
   from app.database import SessionLocal
   from app.models.board import Chapter
   db = SessionLocal()
   for c in db.query(Chapter).order_by(Chapter.id).all():
       print(f'ID={c.id}  {c.chapter_name}')
   db.close()
   "
   ```
5. Copy PDFs to EC2:
   ```bash
   scp -i ~/.ssh/vidyai-key.pem -r "CBSC/Class 10/Science/" ubuntu@<ELASTIC_IP>:~/
   ```
6. Copy into container and ingest each chapter:
   ```bash
   docker cp ~/Science/ vidyai-backend:/app/CBSC/
   docker exec vidyai-backend python scripts/ingest_pdf.py \
     --pdf "/app/CBSC/Science/chapter1.pdf" --chapter-id <ID>
   ```

---

### Viewing Logs

```bash
# All containers live
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend

# Last 200 lines, no follow
docker compose logs --tail=200 backend
```

---

### Checking Memory Usage (important on t2.micro)

```bash
free -h                    # RAM + swap usage
docker stats --no-stream   # Per-container CPU/memory
```

If available RAM < 100 MB consistently, upgrade to t3.small (~$15/month) in the AWS Console: EC2 → Instances → Stop instance → Change instance type → t3.small → Start.

---

### Checking Cache Effectiveness

```bash
docker exec -it vidyai-redis redis-cli

# Inside redis-cli:
DBSIZE          # total cached keys
KEYS rag_ctx:*  # RAG context cache entries (one per chapter)
INFO memory     # memory stats
EXIT
```

After the first user generates each chapter's test, you should see 14 `rag_ctx:*` keys — all future requests for those chapters skip the OpenAI embedding API entirely.

---

### Database Backup

```bash
# Manual backup
pg_dump "postgresql://vidyai:YourPassword@REPLACE_RDS_ENDPOINT:5432/vidyai" \
  --no-owner --no-acl \
  -f ~/backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp ~/backup_*.sql s3://vidyai-textbooks-prod-2024/backups/

# List backups
aws s3 ls s3://vidyai-textbooks-prod-2024/backups/
```

RDS also takes automated daily snapshots with 7-day retention (configured above).

---

### Restart Individual Services

```bash
docker compose restart backend    # after backend .env changes
docker compose restart frontend   # after frontend rebuild
docker compose restart redis      # rarely needed
```

---

## Troubleshooting

**Build runs out of memory / killed:**
```bash
free -h   # check swap is active (should show ~2G)
# If swap isn't there, re-run the swap setup in Phase 3.1
```

**Backend fails to start:**
```bash
docker compose logs backend
# Look for: "could not connect to server" → check DATABASE_URL in .env
# Look for: "OPENAI_API_KEY" → check the key is set
```

**`alembic upgrade head` fails:**
```bash
# Test RDS connectivity from EC2
psql "postgresql://vidyai:YourPassword@REPLACE_RDS_ENDPOINT:5432/vidyai" -c "SELECT 1"
# If this fails → check RDS security group allows port 5432 from EC2 security group
```

**pgvector error during migration:**
```bash
psql "postgresql://vidyai:YourPassword@REPLACE_RDS_ENDPOINT:5432/vidyai"
CREATE EXTENSION IF NOT EXISTS vector;
\q
# Then re-run: docker exec vidyai-backend alembic upgrade head
```

**Frontend shows API errors in browser:**
```bash
# Check if NEXT_PUBLIC_API_URL was baked in correctly at build time
docker exec vidyai-frontend node -e "console.log(process.env.NEXT_PUBLIC_API_URL)"
# Should show: https://vidyai.saiii.in/api/v1
# If empty → frontend/.env.production was missing during build → recreate file, rebuild
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

**SSL cert fails:**
```bash
# Check domain is resolving to this EC2
curl http://vidyai.saiii.in       # must return vidyai-ok before certbot works
sudo certbot certificates          # check expiry dates
sudo certbot renew --force-renewal # force renew
```

**Disk space:**
```bash
df -h
docker system prune -f        # removes unused images, stopped containers
```

---

## Environment Variable Quick Reference

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | Full RDS connection string |
| `SECRET_KEY` | `backend/.env` | 32-byte hex, never share |
| `OPENAI_API_KEY` | `backend/.env` | `sk-...` |
| `REDIS_URL` | `backend/.env` | `redis://redis:6379/0` (don't change) |
| `STORAGE_MODE` | `backend/.env` | `s3` in production |
| `S3_BUCKET_NAME` | `backend/.env` | Your bucket name |
| `AWS_ACCESS_KEY_ID` | `backend/.env` | IAM user credentials |
| `AWS_SECRET_ACCESS_KEY` | `backend/.env` | IAM user credentials |
| `AWS_REGION` | `backend/.env` | `ap-south-1` |
| `ALLOWED_ORIGINS` | `backend/.env` | `["https://vidyai.saiii.in"]` |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.production` | `https://vidyai.saiii.in/api/v1` |

---

## Scaling Plan (when you're ready)

| Trigger | Action | Cost impact |
|---|---|---|
| RAM consistently > 80% | Upgrade EC2 to t3.small | +$6/month |
| Adding Class 10 Science | Re-run seed + ingest 15 new chapters | ~$0.15 OpenAI one-time |
| Adding Class 9 | Same process, new subject | ~$0.15 OpenAI one-time |
| High traffic (100+ concurrent users) | Add ALB + second EC2, or move to ECS | +$30–50/month |
| Multiple subjects across classes | Upgrade RDS to db.t3.small | +$15/month |
