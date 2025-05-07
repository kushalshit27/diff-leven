.PHONY: all init clean test build
# Makefile for a JavaScript project
# This Makefile automates the process of initializing, cleaning, testing, and building a JavaScript project.
# It uses npm commands to perform these tasks.
# The Makefile defines several targets:

all: clean init build test
	@echo "Running all tasks..."

init:
	@echo "Initializing the project..."
	npm ci

clean:
	@echo "Cleaning the directory..."
	rm -rf node_modules dist

test:
	@echo "Running tests..."
	npm test

build:
	@echo "Building the project..."
	npm run build

format:
	@echo "Running format..."
	npm run format
	@echo "Formatting completed."

lint: format
	@echo "Running linter..."
	npm run lint
	@echo "Linting completed."

