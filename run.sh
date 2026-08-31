#!/usr/bin/env bash
#
# Start the backing services and JupyterLab with the workflow extension.
#
#   ./run.sh                 Services up, build, then launch JupyterLab.
#   ./run.sh --watch         ... and rebuild on source changes.
#   ./run.sh --no-build      Skip the build.
#   ./run.sh --no-docker     Leave the backing services alone.
#   ./run.sh --down          Stop the backing services and exit.
#   ./run.sh --setup         Install and build, then exit without launching.
#   ./run.sh --venv PATH     Use that environment instead of ./venv.
#   ./run.sh --port N        Serve on this port (default 8888).
#
# Standalone by default. This repo owns dev/docker-compose.yaml, so it is also
# the script that brings the catalogue / workflow / containerizer services up —
# the top-level NaaVRE-implementation/run.sh delegates that here rather than
# duplicating it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

VENV="$ROOT/venv"
DEV="$ROOT/dev"
PORT=8888
HOST=127.0.0.1
WATCH=0
BUILD=1
DOCKER=1
DOWN=0
SETUP_ONLY=0

usage() {
  cat <<'EOF'
Start the backing services and JupyterLab with the NaaVRE workflow extension.

  ./run.sh                 Services up, build, then launch JupyterLab.
  ./run.sh --watch         ... and rebuild on source changes.
  ./run.sh --no-build      Skip the build.
  ./run.sh --no-docker     Leave the backing services alone.
  ./run.sh --down          Stop the backing services and exit.
  ./run.sh --setup         Install and build, then exit without launching.
  ./run.sh --venv PATH     Use that environment instead of ./venv.
  ./run.sh --port N        Serve on this port (default 8888).
  ./run.sh --host IP       Bind to this address (default 127.0.0.1).
                           Use 0.0.0.0 to let other machines connect —
                           read the security note in the script first.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --watch) WATCH=1 ;;
    --no-build) BUILD=0 ;;
    --no-docker) DOCKER=0 ;;
    --down) DOWN=1 ;;
    --setup) SETUP_ONLY=1 ;;
    --venv) VENV="$2"; shift ;;
    --port) PORT="$2"; shift ;;
    --host) HOST="$2"; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "Unknown option: $1 (try --help)" >&2; exit 1 ;;
  esac
  shift
done

say() { printf '\033[1;34m==> [workflow]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m==> [workflow] %s\033[0m\n' "$*" >&2; }

# Compose runs from dev/ because the services mount config files by relative path.
compose() {
  local files=(-f docker-compose.yaml)
  [ -f "$DEV/docker-compose.local.yaml" ] && files+=(-f docker-compose.local.yaml)
  (cd "$DEV" && docker compose "${files[@]}" "$@")
}

if [ "$DOWN" = "1" ]; then
  say "Stopping backing services"
  compose down
  exit 0
fi

if [ "$DOCKER" = "1" ]; then
  # Three different problems produce "docker doesn't work", with three
  # different fixes. Say which one it is.
  if ! command -v docker >/dev/null 2>&1; then
    warn "Docker is not installed."
    warn "  Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
    warn "  Then: sudo usermod -aG docker \$USER   (and log out and back in)"
    warn "Or pass --no-docker to run without the backing services."
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    DOCKER_ERR=$(docker info 2>&1 || true)
    case "$DOCKER_ERR" in
      *"permission denied"*|*"connect: permission denied"*)
        warn "Docker is installed but this user cannot reach it (permission denied)."
        warn "  sudo usermod -aG docker \$USER"
        warn "  Then log out and back in — a new group only applies to new logins."
        warn "  To test without logging out: newgrp docker" ;;
      *"Cannot connect to the Docker daemon"*|*"docker daemon is not running"*)
        warn "Docker is installed but the daemon is not running."
        warn "  sudo systemctl enable --now docker" ;;
      *)
        warn "Docker is installed but not usable:"
        printf '%s\n' "$DOCKER_ERR" | head -3 | sed 's/^/      /' >&2 ;;
    esac
    warn "Or pass --no-docker to run without the backing services."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    warn "The Docker Compose plugin is missing (\`docker compose\` not available)."
    warn "  Ubuntu/Debian: sudo apt install docker-compose-plugin"
    exit 1
  fi
  if [ ! -f "$DEV/docker-compose.local.yaml" ] && [ "$(uname -m)" = "arm64" ]; then
    warn "dev/docker-compose.local.yaml is missing. On Apple Silicon the"
    warn "ghcr.io/naavre images need an explicit linux/amd64 platform, and the"
    warn "containerizer service comes from that overlay. Expect failures."
  fi
  say "Starting backing services"
  compose up -d
fi

[ -f .yarnrc.yml ] || echo "nodeLinker: node-modules" > .yarnrc.yml
rm -f .pnp.cjs .pnp.loader.mjs

if [ ! -d "$VENV" ]; then
  say "Creating $VENV (this takes a few minutes)"
  python3 -m venv "$VENV"
  "$VENV/bin/python" -m pip install --upgrade pip wheel
  "$VENV/bin/python" -m pip install 'jupyterlab>=4.0.0,<5'
fi

export PATH="$VENV/bin:$PATH"

# Install, and re-install whenever the packaging metadata changes. Entry points
# and dependencies are registered at *install* time, not at build time, so after
# a `git pull` that touches pyproject.toml a plain rebuild would leave this
# environment on the old ones. That matters most for the jupyter_ydoc entry
# point: if its name no longer matches the document's content type, the
# collaboration server silently falls back to a generic YFile and the board
# stops syncing while still looking fine.
STAMP="$VENV/.NaaVRE_workflow_jupyterlab-pyproject.sha256"
PYPROJECT_SHA=$("$VENV/bin/python" -c \
  "import hashlib;print(hashlib.sha256(open('pyproject.toml','rb').read()).hexdigest())")
if ! "$VENV/bin/python" -c 'import NaaVRE_workflow_jupyterlab' 2>/dev/null; then
  say "Installing the extension into $(basename "$VENV")"
  "$VENV/bin/python" -m pip install -e '.[collaboration]'
  echo "$PYPROJECT_SHA" > "$STAMP"
elif [ "$(cat "$STAMP" 2>/dev/null)" != "$PYPROJECT_SHA" ]; then
  say "pyproject.toml changed — reinstalling so entry points and deps re-register"
  "$VENV/bin/python" -m pip install -e '.[collaboration]'
  echo "$PYPROJECT_SHA" > "$STAMP"
fi

# Always (re)link the labextension, deliberately NOT guarded by the install
# check above: `pip install -e` COPIES the built labextension into the
# environment, so a venv that already has the package keeps serving whatever
# was built at install time and every later rebuild is invisible in the
# browser. `develop --overwrite` replaces that copy with a symlink to this
# repo's build output. It is idempotent and cheap.
"$VENV/bin/jupyter" labextension develop . --overwrite > /dev/null

[ -d node_modules ] || { say "Installing node dependencies"; jlpm install; }

# Point the extensions at the local services.
#
# Merged into the live file, never copied over it. That file is shared by every
# extension in this environment, and it holds settings this repo does not
# manage — the containerizer's service URLs, for one. Overwriting it silently
# reverts those to their defaults, which are relative paths like
# "/NaaVRE-containerizer-service"; the communicator then sees an empty domain
# and rejects every call with "Domain is not allowed".
#
# dev/overrides.local.json is the local-only overlay (same convention as
# dev/docker-compose.local.yaml) for services outside this repo.
mkdir -p "$VENV/share/jupyter/lab/settings"
"$VENV/bin/python" - "$VENV/share/jupyter/lab/settings/overrides.json" \
  "$DEV/overrides.json" "$DEV/overrides.local.json" <<'MERGE'
import json, pathlib, sys
target, *sources = sys.argv[1:]
t = pathlib.Path(target)
merged = {}
if t.exists():
    try:
        merged = json.loads(t.read_text())
    except ValueError:
        merged = {}
for src in sources:
    p = pathlib.Path(src)
    if not p.exists():
        continue
    for plugin, settings in json.loads(p.read_text()).items():
        merged.setdefault(plugin, {}).update(settings)
t.write_text(json.dumps(merged, indent=2) + "\n")
MERGE

if [ "$BUILD" = "1" ] && [ "$WATCH" = "0" ]; then
  say "Building"
  jlpm build
fi

if [ "$WATCH" = "1" ]; then
  say "Watching sources (log: /tmp/naavre-workflow-watch.log)"
  if [ "$SETUP_ONLY" = "1" ]; then
    nohup jlpm watch > /tmp/naavre-workflow-watch.log 2>&1 &
  else
    jlpm watch > /tmp/naavre-workflow-watch.log 2>&1 &
    trap 'kill %1 2>/dev/null || true' EXIT
  fi
fi

if [ "$SETUP_ONLY" = "1" ]; then
  say "Ready (not launching JupyterLab)"
  exit 0
fi

mkdir -p notebook-dir

# Long-lived fake token, allowed domains, SSL off.
while IFS= read -r line; do
  case "$line" in '' | \#*) continue ;; esac
  export "$line"
done < "$DEV/jupyterlab.env"
# The containerizer service only exists in the local compose overlay, so its
# host is not in the committed jupyterlab.env.
export NAAVRE_ALLOWED_DOMAINS="localhost:62438,localhost:8000,localhost:41918"

say "Extensions in this environment:"
jupyter labextension list 2>&1 | grep -E "naavre|collaboration" | sed 's/^/    /' || true

# Keep the Yjs update store beside this repo rather than wherever the shell
# happened to be: jupyter-collaboration defaults it to '.jupyter_ystore.db' in
# the *current directory*, which otherwise litters whichever folder you ran from.
# Binding beyond 127.0.0.1 exposes a Jupyter server, which can run arbitrary
# code on this machine as whoever started it. The dev stack behind it is also
# unauthenticated by design (DISABLE_AUTH on every service, an admin/admin
# catalogue, a never-expiring fake OAuth token in dev/jupyterlab.env), so do
# this only on a network you trust, keep the login token, and restrict the port
# with the firewall or security group. The backing services stay bound to the
# VM's own localhost either way — the browser never talks to them directly, the
# communicator proxies every call server-side.
EXTRA=()
if [ "$HOST" != "127.0.0.1" ] && [ "$HOST" != "localhost" ]; then
  warn "Binding to $HOST — reachable from other machines. Keep the token and firewall the port."
  EXTRA+=(--no-browser)
fi

say "Starting JupyterLab on http://$HOST:$PORT"
exec jupyter lab \
  --notebook-dir="$ROOT/notebook-dir" \
  --ip="$HOST" \
  --port="$PORT" \
  --SQLiteYStore.db_path="$ROOT/.jupyter_ystore.db" \
  ${EXTRA+"${EXTRA[@]}"}
