#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Vidyai — Start all services locally
# Run this every time you want to start the app.
# Press Ctrl+C to stop everything cleanly.
# ─────────────────────────────────────────────────────────────────────────────

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONDA_ENV_NAME="vidyai"

log()    { echo -e "${BLUE}[start]${NC} $1"; }
success(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# PIDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# ── Cleanup on Ctrl+C ────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}All services stopped. Goodbye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Locate conda ─────────────────────────────────────────────────────────────
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
  error "Conda not found. Run ./setup.sh first."
fi

# ── Check setup was done ──────────────────────────────────────────────────────
if ! "$CONDA_CMD" env list | grep -q "^$CONDA_ENV_NAME "; then
  error "Conda env '$CONDA_ENV_NAME' not found. Run ./setup.sh first."
fi

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  error "backend/.env not found. Run ./setup.sh first."
fi

# ── Check Docker is running ───────────────────────────────────────────────────
if ! docker info &>/dev/null; then
  error "Docker Desktop is not running. Open Docker Desktop first."
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Vidyai — Starting Services        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Start PostgreSQL ───────────────────────────────────────────────────────
log "Starting PostgreSQL..."

if docker ps --format '{{.Names}}' | grep -q "^vidyai-db$"; then
  success "PostgreSQL already running"
else
  if docker ps -a --format '{{.Names}}' | grep -q "^vidyai-db$"; then
    docker start vidyai-db >/dev/null
    success "PostgreSQL started"
  else
    warn "Container not found. Run ./setup.sh first."
    error "PostgreSQL container 'vidyai-db' does not exist."
  fi
fi

# Wait for PostgreSQL to be ready
for i in {1..20}; do
  if docker exec vidyai-db pg_isready -U edusaas -q 2>/dev/null; then
    break
  fi
  sleep 1
done
success "PostgreSQL is ready (localhost:5432)"

# ── 2. Start FastAPI backend ──────────────────────────────────────────────────
log "Starting FastAPI backend..."

cd "$ROOT_DIR/backend"

# Write backend logs to file and tail them
BACKEND_LOG="$ROOT_DIR/backend.log"
"$CONDA_CMD" run -n "$CONDA_ENV_NAME" \
  uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 \
  > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
log "Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    success "Backend is ready (http://localhost:8000)"
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo ""
    error "Backend crashed on startup. Check logs: cat backend.log"
  fi
  if [ "$i" -eq 30 ]; then
    error "Backend did not start in time. Check: cat backend.log"
  fi
  sleep 1
done

cd "$ROOT_DIR"

# ── 3. Start Next.js frontend ─────────────────────────────────────────────────
log "Starting Next.js frontend..."

cd "$ROOT_DIR/frontend"

FRONTEND_LOG="$ROOT_DIR/frontend.log"
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
log "Waiting for frontend to be ready..."
for i in {1..60}; do
  if curl -sf http://localhost:3000 >/dev/null 2>&1; then
    success "Frontend is ready (http://localhost:3000)"
    break
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo ""
    error "Frontend crashed on startup. Check logs: cat frontend.log"
  fi
  if [ "$i" -eq 60 ]; then
    error "Frontend did not start in time. Check: cat frontend.log"
  fi
  sleep 1
done

cd "$ROOT_DIR"

# ── All services running ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   All services running!                      ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}App${NC}       →  ${CYAN}http://localhost:3000${NC}"
echo -e "  ${BOLD}API docs${NC}  →  ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  Logs:"
echo -e "    Backend  →  tail -f backend.log"
echo -e "    Frontend →  tail -f frontend.log"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# ── Open browser automatically ────────────────────────────────────────────────
sleep 1
open "http://localhost:3000" 2>/dev/null || true

# ── Keep running until Ctrl+C ────────────────────────────────────────────────
wait
