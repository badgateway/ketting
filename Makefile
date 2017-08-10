
export PATH:=$(PATH):./node_modules/.bin/

.PHONY: build
build: dist/bundle.js

.PHONY: clean
clean:
	rm dist/bundle.js

.PHONY: test
test:
	npm test

dist/bundle.js: lib/*.js
	mkdir -p dist
	webpack \
		--display-modules \
		--sort-modules-by size
