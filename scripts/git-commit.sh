#!/usr/bin/env bash
set -euo pipefail

# go to repo root (script is expected in scripts/)
cd "$(dirname "$0")/.."

# Default commit message (can pass custom msg as first arg)
DEFAULT_MSG="chore(repo): add verify script and final checklist"
COMMIT_MSG="${1:-$DEFAULT_MSG}"

# Initialize git if not present
if [ ! -d .git ]; then
  git init
  # create main branch
  git checkout -b main
else
  # if 'main' branch doesn't exist, create it; otherwise checkout main
  if git show-ref --verify --quiet refs/heads/main; then
    git checkout main
  else
    git checkout -b main
  fi
fi

# Stage everything
git add .

# If nothing to commit, print message
if git diff --cached --quiet; then
  echo "Nothing to commit (no changes staged)."
else
  git commit -m "$COMMIT_MSG"
  echo "Committed with message: $COMMIT_MSG"
fi

echo ""
echo "Next steps:"
echo "  npx prisma generate"
echo "  npx prisma migrate dev --name init"
echo ""
echo "To push to remote:"
echo "  git remote add origin <YOUR_REMOTE_URL>"
echo "  git push -u origin main"
