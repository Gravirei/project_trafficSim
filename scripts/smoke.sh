#!/usr/bin/env bash
# scripts/smoke.sh — end-to-end smoke for the GREENWAVE backend.
# Run after `docker compose up -d postgres` and `npm run migrate`.
#
# Exits non-zero on the first failure. Intended for CI and pre-deploy.
set -euo pipefail

API="${API:-http://localhost:3001}"
EMAIL="${EMAIL:-admin@gravirei.com}"
PASSWORD="${PASSWORD:-Admin@123!}"

echo "→ health check"
curl -fsS "$API/api/health" >/dev/null

echo "→ login as $EMAIL"
TOKEN=$(curl -fsS -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${EMAIL%%@*}\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

echo "→ /api/auth/me"
curl -fsS "$API/api/auth/me" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "→ /api/junctions"
curl -fsS "$API/api/junctions" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "→ /api/telemetry/junctions (expect 5 rows)"
COUNT=$(curl -fsS "$API/api/telemetry/junctions" -H "Authorization: Bearer $TOKEN" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["data"]))')
[ "$COUNT" -ge 5 ] || { echo "expected ≥5 junctions, got $COUNT"; exit 1; }

echo "→ /api/commands/cross/reset (ADMIN)"
curl -fsS -X POST "$API/api/commands/cross/reset" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "→ /api/commands/cross/preempt (ADMIN)"
curl -fsS -X POST "$API/api/commands/cross/preempt" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"leg":1}' >/dev/null

echo "→ /api/commands/cross/snapshot (any auth)"
curl -fsS -X POST "$API/api/commands/cross/snapshot" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"junctionId":"cross","simT":1,"phase":0,"interval":"G","queues":[0,0,0,0],"served":0,"waitAvg":0,"waitMax":0,"pushedAt":0}' >/dev/null

echo "OK"
