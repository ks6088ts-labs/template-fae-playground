# Git
GIT_REVISION ?= $(shell git rev-parse --short HEAD)
GIT_TAG ?= $(shell git describe --tags --abbrev=0 --always | sed -e s/v//g)

# Tools
TOOLS_DIR ?= /usr/local/bin

# E2E (set E2E_HEADED=true to show the browser UI instead of running headless)
E2E_HEADED ?= false

.PHONY: help
help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.DEFAULT_GOAL := help

.PHONY: install-deps-dev
install-deps-dev: ## install dependencies for development
	@which actionlint || echo "install actionlint https://github.com/rhysd/actionlint"
	@# https://pnpm.io/installation
	@which pnpm || npm install -g pnpm
	pnpm install --frozen-lockfile

.PHONY: install-deps-e2e
install-deps-e2e: install-deps-dev ## install dependencies for E2E tests
	pnpm exec playwright install --with-deps chromium

.PHONY: lint
lint: ## lint
	pnpm check
	pnpm audit
	actionlint

.PHONY: build
build: ## build applications
	pnpm build

.PHONY: format
format: ## format code
	pnpm format

.PHONY: ci-test
ci-test: install-deps-dev lint build ## run CI test

.PHONY: e2e
e2e: ## run E2E tests (E2E_HEADED=true shows the browser)
	E2E_HEADED=$(E2E_HEADED) pnpm e2e

.PHONY: ci-test-e2e
ci-test-e2e: install-deps-e2e e2e ## run E2E CI test

.PHONY: dev
dev: ## run development server
	pnpm dev

.PHONY: preview
preview: ## preview production build
	pnpm preview

.PHONY: update
update: ## update dependencies
	pnpm update --latest

# ---
# Docker
# ---
DOCKER_REPO_NAME ?= ks6088ts
DOCKER_IMAGE_NAME ?= template-typescript-react
DOCKER_FILE ?= docker/Dockerfile
TRIVY_VERSION ?= 0.69.3

.PHONY: docker-build
docker-build: ## build Docker image
	docker build -f $(DOCKER_FILE) \
		-t $(DOCKER_REPO_NAME)/$(DOCKER_IMAGE_NAME):$(GIT_TAG) \
		--build-arg GIT_REVISION=$(GIT_REVISION) \
		--build-arg GIT_TAG=$(GIT_TAG) \
		.

.PHONY: docker-run
docker-run: ## run Docker container (serves on http://localhost:8080)
	docker run --rm -p 8080:80 $(DOCKER_REPO_NAME)/$(DOCKER_IMAGE_NAME):$(GIT_TAG)

.PHONY: docker-lint
docker-lint: ## lint Dockerfile
	docker run --rm -i hadolint/hadolint < $(DOCKER_FILE)

.PHONY: docker-scan
docker-scan: ## scan Docker image
	@which trivy || curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $(TOOLS_DIR) v$(TRIVY_VERSION)
	trivy image $(DOCKER_REPO_NAME)/$(DOCKER_IMAGE_NAME):$(GIT_TAG)

.PHONY: ci-test-docker
ci-test-docker: docker-lint docker-build docker-scan ## run CI test for Docker (build only, no run)
