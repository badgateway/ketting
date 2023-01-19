.PHONY: build
build: browser/ketting.min.js browser/mocha-tests.js tsbuild

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

.PHONY: tsbuild
tsbuild:
	npx tsc

.PHONY: watch
watch:
	npx tsc --watch

.PHONY: browserbuild
browserbuild: tsbuild
	mkdir -p browser
	npx webpack

browser/ketting.min.js: browserbuild
browser/mocha-tests.js: browserbuild

testserver: build
	npx ts-node test/testserver.ts
