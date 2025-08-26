#!/bin/bash

# K2A Backend Test Script
echo "🧪 Testing K2A Backend API..."

BASE_URL="http://localhost:5000"

# Test health endpoint
echo "📋 Testing health endpoint..."
curl -s "$BASE_URL/health" | jq . || echo "Health endpoint failed"

echo -e "\n🔧 Testing admin setup..."
# Setup admin account
curl -s -X POST "$BASE_URL/api/v1/auth/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@k2a.com",
    "password": "SecureAdmin123!",
    "firstName": "K2A",
    "lastName": "Administrator"
  }' | jq . || echo "Admin setup failed"

echo -e "\n🔐 Testing admin login..."
# Login with admin account
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@k2a.com",
    "password": "SecureAdmin123!"
  }')

echo "$LOGIN_RESPONSE" | jq .

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo -e "\n👤 Testing profile endpoint..."
  curl -s -X GET "$BASE_URL/api/v1/auth/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
else
  echo "No access token received - login may have failed"
fi

echo -e "\n✅ Test completed!"
