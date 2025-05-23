#!/bin/bash
# Test script for quickly testing the Every.org staging webhook with curl

# Define colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Webhook token for staging
TOKEN="c568380b7b28caa6bbb34fd6"

# Default URLs - you can override these with command line arguments
STAGING_URL="https://staging.stashdb.fyi/api/webhooks/staging-test"
LOCAL_URL="http://localhost:3000/api/webhooks/staging-test"

# Default to staging unless --local is specified
URL="$STAGING_URL"
if [[ "$1" == "--local" ]]; then
  URL="$LOCAL_URL"
  echo -e "${BLUE}Testing against local endpoint: $URL${NC}"
else
  echo -e "${BLUE}Testing against staging endpoint: $URL${NC}"
fi

# Create a sample webhook payload
PAYLOAD='{
  "event": "donation.completed",
  "data": {
    "donationId": "'$(date +%s)'",
    "reference": "stash-test-'$(date +%s)'",
    "status": "SUCCEEDED",
    "amount": 1500,
    "nonprofitId": "khan-academy",
    "nonprofitName": "Khan Academy"
  }
}'

echo -e "${BLUE}Sending test webhook with token: $TOKEN${NC}"
echo -e "${BLUE}Payload:${NC}"
echo "$PAYLOAD" | jq .

# Send the request
echo -e "${BLUE}Sending request...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PAYLOAD")

# Extract status code and body
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$ d')

# Check if successful
if [[ $HTTP_STATUS -eq 200 ]]; then
  echo -e "${GREEN}Success! (HTTP $HTTP_STATUS)${NC}"
  echo -e "${GREEN}Response:${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}Failed! (HTTP $HTTP_STATUS)${NC}"
  echo -e "${RED}Response:${NC}"
  echo "$BODY"
fi
