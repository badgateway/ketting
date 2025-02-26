.PHONY: build
build:
	npx tsc

.PHONY: clean
clean:
	-rm -r browser/
	-rm -r dist/

.PHONY: test
test: lint
	npx nyc mocha

.PHONY: test-debug
test-debug:
	npx mocha --inspect-brk

.PHONY: lint
lint:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY: fix
fix:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY: watch
watch:
	npx tsc --watch
