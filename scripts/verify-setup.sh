#!/bin/bash
set -euo pipefail

# Default values
PORT=${PORT:-3000}
MAX_WAIT=${MAX_WAIT:-60}

echo "🔍 Verifying application setup..."
echo "📡 Checking if app is running on port $PORT..."

# Wait for app to be ready
WAIT_COUNT=0
while ! curl -s -f "http://localhost:$PORT/api" > /dev/null 2>&1; do
  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ App did not start within $MAX_WAIT seconds"
    exit 1
  fi
  echo "⏳ Waiting for app to start... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

echo "✅ App is running on port $PORT"

# Check if Swagger docs are accessible
if curl -s -f "http://localhost:$PORT/api" > /dev/null 2>&1; then
  echo "✅ Swagger documentation is accessible at http://localhost:$PORT/api"
else
  echo "❌ Swagger documentation is not accessible"
  exit 1
fi

# Check if swagger.json exists
if [ -f "docs/swagger.json" ]; then
  echo "✅ Swagger JSON file exists at docs/swagger.json"
else
  echo "⚠️  Swagger JSON file not found at docs/swagger.json (run 'npm run build:swagger' to generate)"
fi

echo ""
echo "🎉 Setup verification completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  - Access API docs: http://localhost:$PORT/api"
echo "  - Run tests: npm test"
echo "  - Run e2e tests: npm run test:e2e"
echo "  - Export Postman collection: npm run export:postman"