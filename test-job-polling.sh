#!/bin/bash

# Script para probar el polling de jobs
# Requiere jq para parsear JSON

API_BASE="https://devalliance.com.ar"
TOKEN="${MINDVERSE_TEST_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: Necesitas un token de autenticación"
  echo "Exporta MINDVERSE_TEST_TOKEN con un JWT válido"
  exit 1
fi

echo "=== Test de Job Polling ==="
echo ""

# 1. Listar jobs existentes
echo "1. Listando jobs existentes..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/jobs?limit=5" | jq '.'

echo ""
echo "2. Para crear un job de batch generation, necesitas:"
echo "   - Un storyboardId válido"
echo "   - frameIndices (array de índices)"
echo ""
echo "Ejemplo:"
echo 'curl -X POST -H "Authorization: Bearer $TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"storyboardId": "xxx", "frameIndices": [0,1], "aspectRatio": "16:9"}'"'"' \'
echo "  $API_BASE/jobs/batch-generate-images"
echo ""
echo "3. Una vez que tengas un jobId, puedes consultarlo con:"
echo 'curl -H "Authorization: Bearer $TOKEN" $API_BASE/jobs/{jobId}'
