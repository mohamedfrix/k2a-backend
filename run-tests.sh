#!/bin/bash

# K2A Backend Test Runner
echo "🧪 K2A Backend Test Suite"

# Change to backend directory
cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Running pre-test checks...${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if server is running
echo -e "${BLUE}� Checking if server is running...${NC}"
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is already running${NC}"
else
    echo -e "${YELLOW}⚠️  Server is not running. Please start it with: npm run dev${NC}"
    echo -e "${YELLOW}   The API tests will fail without the server running.${NC}"
fi

echo -e "${BLUE}🧪 Running tests...${NC}"

# Run tests based on argument
case "${1:-all}" in
    "utils")
        echo -e "${BLUE}Running utility tests only...${NC}"
        npm run test:utils
        ;;
    "auth")
        echo -e "${BLUE}Running authentication tests only...${NC}"
        npm run test:auth
        ;;
    "all"|*)
        echo -e "${BLUE}Running all tests...${NC}"
        npm run test
        ;;
esac

# Check test result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
