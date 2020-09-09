.PHONY: build
build: browser/ketting.min.js browser/mocha-tests.js tsbuild

.PHONY: clean
clean:
	-rm -r browser/
	-rm -r dist/

.PHONY: test
test: lint
	./node_modules/.bin/nyc mocha

.PHONY: test-debug
test-debug:
	./node_modules/.bin/mocha --inspect-brk

.PHONY: lint
lint:
	./node_modules/.bin/eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY: fix
fix:
	./node_modules/.bin/eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY: tsbuild
tsbuild:
	./node_modules/.bin/tsc

.PHONY: watch
watch:
	./node_modules/.bin/tsc --watch

.PHONY: browserbuild
browserbuild: tsbuild
	mkdir -p browser
	./node_modules/.bin/webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size


browser/ketting.min.js: browserbuild
browser/mocha-tests.js: browserbuild

testserver: build
	./node_modules/.bin/ts-node test/testserver.ts
