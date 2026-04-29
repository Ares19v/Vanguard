#!/usr/bin/env bash
set -e

cat << 'EOF'

  ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗
  ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
  ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
  ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
   ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝

  AUTOMATED SECURITY OPERATIONS CENTER  //  VANGUARD v1.0
  ─────────────────────────────────────────────────────────

EOF

# ── Check Docker ──────────────────────────────────────────────────────────────
if docker info >/dev/null 2>&1; then
  echo "  [*] Docker detected — launching via docker-compose..."
  docker compose up --build
  exit 0
fi

echo "  [*] Docker not running — launching manually..."

# Create .env if missing
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "  [*] Created backend/.env from .env.example"
fi

# ── Backend ───────────────────────────────────────────────────────────────────
echo "  [*] Starting FastAPI backend..."
cd backend

if [ ! -d ".venv" ]; then
  echo "  [*] Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "  [*] Starting Vite frontend..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  ✓  Backend:   http://localhost:8000"
echo "  ✓  Frontend:  http://localhost:5173"
echo "  ✓  API Docs:  http://localhost:8000/api/docs"
echo ""
echo "  Press Ctrl+C to stop all services"

# ── Cleanup on Ctrl+C ─────────────────────────────────────────────────────────
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '  [*] Vanguard stopped.'" INT TERM
wait
