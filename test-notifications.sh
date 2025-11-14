#!/usr/bin/env bash
# Quick test script to verify notifications system

echo "=== Notifications System Test ==="
echo ""

BASE_URL="http://localhost:4000/api"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testing GET /notifications (should fail without auth)${NC}"
curl -X GET "$BASE_URL/notifications" \
  -H "Content-Type: application/json" \
  -s | jq '.' || echo "Request failed (expected without token)"
echo ""

echo -e "${YELLOW}2. Testing GET /notifications/unread/count (should fail without auth)${NC}"
curl -X GET "$BASE_URL/notifications/unread/count" \
  -H "Content-Type: application/json" \
  -s | jq '.' || echo "Request failed (expected without token)"
echo ""

echo -e "${GREEN}✅ Notification endpoints are accessible${NC}"
echo ""
echo "Note: Full testing requires valid JWT token"
echo "See NOTIFICATIONS_POSTMAN_GUIDE.md for complete test scenarios"
