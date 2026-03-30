.PHONY: build
build:
	npx tsc -p tsconfig.lib.json && npx tsc -p tsconfig.test.json

.PHONY: clean
clean:
	-rm -r dist/

.PHONY: test
test: lint
	npx tsx --tsconfig tsconfig.test.json --test

.PHONY: lint
lint:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY: fix
fix:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY: watch
watch:
	npx tsc -p tsconfig.lib.json --watch
