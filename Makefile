export PATH:=./node_modules/.bin/:$(PATH)

.PHONY: build
build: browser/ketting.min.js browser/mocha-tests.js tsbuild

.PHONY: clean
clean:
	-rm -r browser/
	-rm -r dist/
	-rm -rf node_modules/

.PHONY: test
test: lint
	nyc mocha

.PHONY: test-debug
test-debug:
	mocha --inspect-brk

.PHONY: lint
lint:
	eslint src/

.PHONY: tsbuild
tsbuild: node_modules
	tsc

.PHONY: watch
watch: node_modules
	tsc --watch

.PHONY: browserbuild
browserbuild:
	mkdir -p browser
	webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size


browser/ketting.min.js: browserbuild
browser/mocha-tests.js: browserbuild

node_modules: package-lock.json
	npm install

testserver: build
	ts-node test/testserver.ts
