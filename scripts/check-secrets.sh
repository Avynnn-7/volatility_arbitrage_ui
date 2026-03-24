#!/usr/bin/env bash
# ============================================================
# PRE-COMMIT SECRET SCANNER
# ============================================================
# Blocks commits that accidentally contain API keys or tokens.
# Install as pre-commit hook:
#   cp scripts/check-secrets.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
# ============================================================

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🔐 Running secret scan before commit..."

FAIL=0

# Patterns that should NEVER appear in committed code
PATTERNS=(
  "Bearer ey"                    # JWT Bearer token
  "UPSTOX_ACCESS_TOKEN=ey"       # Token set in code
  "accessToken.*=.*ey"           # Hardcoded JWT
  "apiSecret.*=.*[A-Za-z0-9]{20}" # Hardcoded secret
  "api_secret.*=.*[A-Za-z0-9]{20}"
  "ENTER_YOUR_ACCESS_TOKEN_HERE" # Unfilled placeholder committed
)

# Files staged for commit
STAGED=$(git diff --cached --name-only --diff-filter=ACM)

for FILE in $STAGED; do
  # Skip binary files, lock files, and this script itself
  case "$FILE" in
    *.lock|*.png|*.jpg|*.zip|*.exe|scripts/check-secrets.sh) continue ;;
  esac

  for PATTERN in "${PATTERNS[@]}"; do
    if git diff --cached "$FILE" | grep -qP "$PATTERN"; then
      echo -e "${RED}❌ BLOCKED: Potential secret found in $FILE${NC}"
      echo -e "${YELLOW}   Pattern matched: $PATTERN${NC}"
      echo -e "   Run: git diff --cached $FILE | grep -P '$PATTERN'"
      FAIL=1
    fi
  done
done

# Also block .env file from being committed
for FILE in $STAGED; do
  if [[ "$FILE" == ".env" || "$FILE" == *".env.local" ]]; then
    echo -e "${RED}❌ BLOCKED: Attempting to commit .env file: $FILE${NC}"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo ""
  echo -e "${RED}Commit blocked due to potential secret exposure.${NC}"
  echo "Fix the issues above and try again."
  exit 1
fi

echo -e "${GREEN}✓ No secrets detected. Proceeding with commit.${NC}"
exit 0
