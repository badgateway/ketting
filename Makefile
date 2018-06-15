.PHONY: build
build: browser/ketting.min.js tsbuild

.PHONY: clean
clean:
	rm browser/ketting.js

.PHONY: test
test: lint
	npm test

.PHONY: lint
lint:
	node_modules/.bin/eslint src/

.PHONY: tsbuild
tsbuild:
	node_modules/.bin/tsc

browser/ketting.min.js: src/*/*.ts src/*.js src/*/*.js webpack.config.js package.json
	mkdir -p browser
	node_modules/.bin/webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size

testserver:
	cd test; node testserver.js
