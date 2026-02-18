#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Vidyai — One-time local setup script
# Run this ONCE when you first clone the project.
# ─────────────────────────────────────────────────────────────────────────────

set -e  # stop on any error

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONDA_ENV_NAME="vidyai"
PYTHON_VERSION="3.12"

log()    { echo -e "${BLUE}[setup]${NC} $1"; }
success(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()   { echo -e "\n${BOLD}━━━  $1  ━━━${NC}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Vidyai — Local Setup              ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check prerequisites ────────────────────────────────────────────────────
step "Checking prerequisites"

# Docker
if ! command -v docker &>/dev/null; then
  error "Docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/ and try again."
fi
if ! docker info &>/dev/null; then
  error "Docker Desktop is installed but not running. Open Docker Desktop first, wait for it to start, then re-run this script."
fi
success "Docker is running"

# Node.js
if ! command -v node &>/dev/null; then
  error "Node.js not found. Install from https://nodejs.org (LTS version)"
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  error "Node.js version too old (found v$NODE_VER, need v18+). Update from https://nodejs.org"
fi
success "Node.js $(node -v) found"

# npm
if ! command -v npm &>/dev/null; then
  error "npm not found. It should come with Node.js."
fi
success "npm $(npm -v) found"

# Conda
CONDA_CMD=""
if command -v conda &>/dev/null; then
  CONDA_CMD="conda"
elif [ -f "$HOME/miniconda3/bin/conda" ]; then
  CONDA_CMD="$HOME/miniconda3/bin/conda"
  export PATH="$HOME/miniconda3/bin:$PATH"
elif [ -f "$HOME/anaconda3/bin/conda" ]; then
  CONDA_CMD="$HOME/anaconda3/bin/conda"
  export PATH="$HOME/anaconda3/bin:$PATH"
elif [ -f "/opt/homebrew/Caskroom/miniconda/base/bin/conda" ]; then
  CONDA_CMD="/opt/homebrew/Caskroom/miniconda/base/bin/conda"
  export PATH="/opt/homebrew/Caskroom/miniconda/base/bin:$PATH"
else
  warn "Conda not found. Installing Miniconda automatically..."
  MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh"
  # Detect Intel Mac
  if [[ $(uname -m) == "x86_64" ]]; then
    MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh"
  fi
  curl -fsSL "$MINICONDA_URL" -o /tmp/miniconda.sh
  bash /tmp/miniconda.sh -b -p "$HOME/miniconda3"
  rm /tmp/miniconda.sh
  export PATH="$HOME/miniconda3/bin:$PATH"
  CONDA_CMD="$HOME/miniconda3/bin/conda"
  "$CONDA_CMD" init bash zsh 2>/dev/null || true
  success "Miniconda installed at ~/miniconda3"
fi
success "Conda found: $CONDA_CMD"

# ── 2. Create conda environment ───────────────────────────────────────────────
step "Setting up Python $PYTHON_VERSION conda environment: '$CONDA_ENV_NAME'"

if "$CONDA_CMD" env list | grep -q "^$CONDA_ENV_NAME "; then
  warn "Conda env '$CONDA_ENV_NAME' already exists — skipping creation"
else
  log "Creating conda env (this may take a minute)..."
  "$CONDA_CMD" create -n "$CONDA_ENV_NAME" python="$PYTHON_VERSION" -y
  success "Conda env '$CONDA_ENV_NAME' created"
fi

# ── 3. Install Python dependencies ───────────────────────────────────────────
step "Installing Python dependencies"

log "Running pip install in conda env '$CONDA_ENV_NAME'..."
"$CONDA_CMD" run -n "$CONDA_ENV_NAME" pip install --upgrade pip -q
"$CONDA_CMD" run -n "$CONDA_ENV_NAME" pip install -r "$ROOT_DIR/backend/requirements.txt"
success "Python packages installed"

# ── 4. Install Node dependencies ──────────────────────────────────────────────
step "Installing Node.js (frontend) dependencies"

cd "$ROOT_DIR/frontend"
npm install --silent
success "npm packages installed"
cd "$ROOT_DIR"

# ── 5. Configure backend .env ────────────────────────────────────────────────
step "Configuring backend environment"

if [ -f "$ROOT_DIR/backend/.env" ]; then
  warn "backend/.env already exists — skipping (delete it to reconfigure)"
else
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"

  # Generate a random SECRET_KEY
  SECRET_KEY=$("$CONDA_CMD" run -n "$CONDA_ENV_NAME" python3 -c "import secrets; print(secrets.token_hex(32))")
  sed -i.bak "s|CHANGE_ME_generate_a_strong_random_secret_key|$SECRET_KEY|g" "$ROOT_DIR/backend/.env"
  rm -f "$ROOT_DIR/backend/.env.bak"

  # Ask for OpenAI key
  echo ""
  echo -e "${YELLOW}You need an OpenAI API key to generate AI tests.${NC}"
  echo -e "Get one at: ${BOLD}https://platform.openai.com/api-keys${NC}"
  echo ""
  read -rp "  Enter your OpenAI API key (sk-...): " OPENAI_KEY
  if [ -n "$OPENAI_KEY" ]; then
    sed -i.bak "s|OPENAI_API_KEY=sk-...|OPENAI_API_KEY=$OPENAI_KEY|g" "$ROOT_DIR/backend/.env"
    rm -f "$ROOT_DIR/backend/.env.bak"
    success "OpenAI key saved"
  else
    warn "No OpenAI key entered. Edit backend/.env later and add OPENAI_API_KEY=sk-..."
  fi

  success "backend/.env created"
fi

# ── 6. Configure frontend .env.local ─────────────────────────────────────────
if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
  success "frontend/.env.local created"
else
  warn "frontend/.env.local already exists — skipping"
fi

# ── 7. Start PostgreSQL + pgvector ────────────────────────────────────────────
step "Starting PostgreSQL + pgvector (Docker)"

if docker ps -a --format '{{.Names}}' | grep -q "^vidyai-db$"; then
  if docker ps --format '{{.Names}}' | grep -q "^vidyai-db$"; then
    success "PostgreSQL container 'vidyai-db' is already running"
  else
    log "Starting existing container 'vidyai-db'..."
    docker start vidyai-db
    success "PostgreSQL started"
  fi
else
  log "Creating and starting PostgreSQL + pgvector container..."
  docker run -d \
    --name vidyai-db \
    -e POSTGRES_USER=edusaas \
    -e POSTGRES_PASSWORD=edusaas \
    -e POSTGRES_DB=edusaas \
    -p 5432:5432 \
    --restart unless-stopped \
    pgvector/pgvector:pg16
  success "PostgreSQL container created and started"
fi

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec vidyai-db pg_isready -U edusaas -q 2>/dev/null; then
    success "PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    error "PostgreSQL did not become ready in time. Check: docker logs vidyai-db"
  fi
  sleep 1
done

# ── 8. Run Alembic migrations ─────────────────────────────────────────────────
step "Running database migrations"

cd "$ROOT_DIR/backend"
"$CONDA_CMD" run -n "$CONDA_ENV_NAME" alembic upgrade head
success "Database schema created"
cd "$ROOT_DIR"

# ── 9. Seed curriculum data ───────────────────────────────────────────────────
step "Seeding CBSE Class 10 curriculum"

cd "$ROOT_DIR/backend"
"$CONDA_CMD" run -n "$CONDA_ENV_NAME" python scripts/seed_data.py
success "Curriculum seeded"
cd "$ROOT_DIR"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   Setup complete!                        ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Next step → run:  ${BOLD}./start.sh${NC}"
echo ""
echo -e "  Frontend  → ${BOLD}http://localhost:3000${NC}"
echo -e "  Backend   → ${BOLD}http://localhost:8000/docs${NC}"
echo ""
