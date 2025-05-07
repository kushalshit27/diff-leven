.PHONY: all init clean test build
# Makefile for a JavaScript project
# This Makefile automates the process of initializing, cleaning, testing, and building a JavaScript project.
# It uses npm commands to perform these tasks.
# The Makefile defines several targets:

all: clean init build test
	@echo "Running all tasks..."

init:
	@echo "Initializing the project..."
	npm install

clean:
	@echo "Cleaning the build directory..."
	rm -rf node_modules dist

test:
	@echo "Running tests..."
	npm test

build:
	@echo "Building the project..."
	npm run build