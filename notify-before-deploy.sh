#!/bin/bash

# Pre-deployment notification script
# This script sends notifications to all subscribers before deployment
# Usage: ./notify-before-deploy.sh [server-url]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default to localhost if no URL provided
SERVER_URL="${1:-http://localhost:3000}"

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Pre-deployment Notification Script         ║${NC}"
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking server status...${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/status")

if [ "$STATUS" != "200" ]; then
  echo -e "${RED}❌ Server is not responding at $SERVER_URL${NC}"
  echo -e "${RED}   Please make sure the server is running.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Get current subscription count
SUBSCRIPTION_COUNT=$(curl -s "$SERVER_URL/api/status" | grep -o '"totalSubscriptions":[0-9]*' | grep -o '[0-9]*')
echo -e "${BLUE}📊 Current subscriptions: ${SUBSCRIPTION_COUNT}${NC}"

if [ "$SUBSCRIPTION_COUNT" = "0" ]; then
  echo -e "${YELLOW}⚠️  No active subscriptions. Exiting.${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}🔔 Sending resubscribe notifications to all subscribers...${NC}"
echo ""

# Send notifications
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/notify-resubscribe" -H "Content-Type: application/json")

# Parse response
TOTAL=$(echo "$RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
SENT=$(echo "$RESPONSE" | grep -o '"sent":[0-9]*' | grep -o '[0-9]*')
FAILED=$(echo "$RESPONSE" | grep -o '"failed":[0-9]*' | grep -o '[0-9]*')

echo -e "${GREEN}✅ Notifications sent!${NC}"
echo ""
echo -e "  Total:  ${TOTAL}"
echo -e "  ${GREEN}Sent:   ${SENT}${NC}"
if [ "$FAILED" != "0" ]; then
  echo -e "  ${RED}Failed: ${FAILED}${NC}"
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}You can now proceed with deployment!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Wait a few minutes for users to receive notifications"
echo -e "   2. Deploy your new version"
echo -e "   3. Users will tap the notification and be prompted to re-subscribe"
echo ""

