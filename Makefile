.PHONY: all init clean test build
# This Makefile automates the process of initializing, cleaning, testing, and building a JavaScript project.
# It uses npm commands to perform these tasks.
# The Makefile defines several targets:

all: clean init build test example
	@echo "🚀 Running all tasks..."

init:
	@echo "🔧 Initializing the project..."
	npm install
	@echo "✅ Initialization completed."

clean:
	@echo "🧹 Cleaning the directory..."
	rm -rf node_modules dist

test:
	@echo "🧪 Running tests..."
	npm test

build:
	@echo "🏗️  Building the project..."
	npm run build

format:
	@echo "🎨 Running format..."
	npm run format:fix
	@echo "✅ Formatting completed."

lint: format
	@echo "🔍 Running linter..."
	npm run lint:fix
	@echo "✅ Linting completed."

examples-basic:
	@echo "📚 Running basic examples..."
	npm run examples:basic

examples-advanced:
	@echo "📚 Running advanced examples..."
	npm run examples:advanced

example: examples-basic examples-advanced
	@echo "✅ Example tasks completed."
