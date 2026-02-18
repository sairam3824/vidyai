#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Vidyai — Stop all services
# ─────────────────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Stopping Vidyai services...${NC}"

# Kill any uvicorn processes (backend)
if pgrep -f "uvicorn app.main:app" >/dev/null 2>&1; then
  pkill -f "uvicorn app.main:app"
  echo -e "${GREEN}[✓]${NC} Backend stopped"
else
  echo "  Backend was not running"
fi

# Kill any Next.js dev server processes (frontend)
if pgrep -f "next dev" >/dev/null 2>&1; then
  pkill -f "next dev"
  echo -e "${GREEN}[✓]${NC} Frontend stopped"
else
  echo "  Frontend was not running"
fi

# Stop PostgreSQL container (optional — comment out if you want DB to keep running)
if docker ps --format '{{.Names}}' | grep -q "^vidyai-db$"; then
  docker stop vidyai-db >/dev/null
  echo -e "${GREEN}[✓]${NC} PostgreSQL stopped"
else
  echo "  PostgreSQL was not running"
fi

echo ""
echo -e "${GREEN}${BOLD}All stopped.${NC}"
echo ""
