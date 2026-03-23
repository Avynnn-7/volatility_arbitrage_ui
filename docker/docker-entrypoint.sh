#!/bin/sh
# ============================================================================
# Docker Entrypoint Script
# Handles runtime environment variable injection and nginx startup
# ============================================================================

set -e

# ==========================
# Environment Variable Injection
# ==========================
# This allows runtime configuration of the application
# Environment variables prefixed with VITE_ will be injected into the app

ENV_JS_FILE="/usr/share/nginx/html/env.js"

# Create env.js with runtime environment variables
echo "window.__ENV__ = {" > "$ENV_JS_FILE"

# Iterate through all environment variables starting with VITE_
for var in $(env | grep ^VITE_ | cut -d= -f1); do
  value=$(eval echo \$$var)
  echo "  $var: \"$value\"," >> "$ENV_JS_FILE"
done

echo "};" >> "$ENV_JS_FILE"

echo "Runtime environment variables injected into $ENV_JS_FILE"

# ==========================
# Start nginx
# ==========================
exec "$@"
