.PHONY: build
build:
	npx tsc

.PHONY: clean
clean:
	-rm -r browser/
	-rm -r dist/

.PHONY: test
test: lint
	npx tsx --test

.PHONY: lint
lint:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY: fix
fix:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY: watch
watch:
	npx tsc --watch
