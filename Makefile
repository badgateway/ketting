export PATH:=./node_modules/.bin/:$(PATH)

.PHONY: build
build: browser/ketting.min.js browser/mocha-tests.js tsbuild

.PHONY: clean
clean:
	rm -r browser/ dist/ node_modules/

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
tsbuild:
	tsc

.PHONY: watch
watch:
	tsc --watch

.PHONY: browserbuild
browerbuild:
	mkdir -p browser
	webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size


browser/%.js: browserbuild

testserver: build
	cd test; node testserver.js
