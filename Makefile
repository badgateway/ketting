export PATH:=./node_modules/.bin/:$(PATH)

.PHONY: build
build: browser/ketting.min.js tsbuild

.PHONY: clean
clean:
	rm browser/ketting.js

.PHONY: test
test: lint
	nyc mocha

.PHONY: lint
lint:
	eslint src/

.PHONY: tsbuild
tsbuild:
	tsc

browser/ketting.min.js: src/*/*.ts src/*.js src/*/*.js webpack.config.js package.json
	mkdir -p browser
	webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size

testserver:
	cd test; node testserver.js
