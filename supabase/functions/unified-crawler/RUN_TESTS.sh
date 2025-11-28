#!/bin/bash
#
# Quick test runner script for unified-crawler test suite
# Usage: ./RUN_TESTS.sh [options]
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    print_error "Deno is not installed!"
    echo ""
    echo "Install Deno using one of these methods:"
    echo ""
    echo "  macOS/Linux:"
    echo "    curl -fsSL https://deno.land/install.sh | sh"
    echo ""
    echo "  macOS (Homebrew):"
    echo "    brew install deno"
    echo ""
    echo "  Windows (PowerShell):"
    echo "    irm https://deno.land/install.ps1 | iex"
    echo ""
    exit 1
fi

print_success "Deno is installed: $(deno --version | head -n 1)"
echo ""

# Change to the test directory
cd "$(dirname "$0")"

# Parse command line options
case "${1:-all}" in
    all)
        print_header "Running All Tests"
        deno test --allow-all
        ;;

    extractors)
        print_header "Running Extractor Tests"
        deno test extractors.test.ts --allow-all
        ;;

    utilities)
        print_header "Running Utility Tests"
        deno test crawler-utilities.test.ts --allow-all
        ;;

    validation)
        print_header "Running Validation Tests"
        deno test validation.test.ts --allow-all
        ;;

    specialized)
        print_header "Running Specialized Extractor Tests"
        deno test specialized-extractors.test.ts --allow-all
        ;;

    coverage)
        print_header "Running Tests with Coverage"
        deno test --coverage=coverage --allow-all
        echo ""
        print_header "Coverage Report"
        deno coverage coverage
        ;;

    watch)
        print_header "Running Tests in Watch Mode"
        print_warning "Tests will re-run automatically on file changes"
        print_warning "Press Ctrl+C to stop"
        echo ""
        deno test --watch --allow-all
        ;;

    help|--help|-h)
        echo "Unified Crawler Test Runner"
        echo ""
        echo "Usage: ./RUN_TESTS.sh [option]"
        echo ""
        echo "Options:"
        echo "  all          - Run all test files (default)"
        echo "  extractors   - Run only extractor tests"
        echo "  utilities    - Run only utility tests"
        echo "  validation   - Run only validation tests"
        echo "  specialized  - Run only specialized extractor tests"
        echo "  coverage     - Run tests with coverage report"
        echo "  watch        - Run tests in watch mode (auto-rerun on changes)"
        echo "  help         - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./RUN_TESTS.sh"
        echo "  ./RUN_TESTS.sh extractors"
        echo "  ./RUN_TESTS.sh coverage"
        echo "  ./RUN_TESTS.sh watch"
        echo ""
        ;;

    *)
        print_error "Unknown option: $1"
        echo ""
        echo "Run './RUN_TESTS.sh help' for usage information"
        exit 1
        ;;
esac

echo ""
print_success "Test run complete!"
