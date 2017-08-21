.PHONY: build
build: dist/restl.js

.PHONY: clean
clean:
	rm dist/restl.js

.PHONY: test
test:
	npm test

.PHONY: lint
lint:
	node_modules/.bin/eslint lib/

dist/restl.js: lib/*.js
	mkdir -p dist
	node_modules/.bin/webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size
