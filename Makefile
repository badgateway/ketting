.PHONY: build
build:
	npx tsc -p tsconfig.lib.json && npx tsc -p tsconfig.test.json

.PHONY: clean
clean:
	-rm -r dist/

.PHONY: test
test: lint build
	npx playwright install && npx vitest run --browser.headless

.PHONY: lint
lint:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY: lint-package
lint-package: build
	npx publint --strict

.PHONY: fix
fix:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY: watch
watch:
	npx tsc -p tsconfig.lib.json --watch

.PHONY: ci-workflow-test
ci-workflow-test: lint-package test