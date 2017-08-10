
export PATH:=$(PATH):./node_modules/.bin/

.PHONY: build
build: dist/restl.js

.PHONY: clean
clean:
	rm dist/restl.js

.PHONY: test
test:
	npm test

dist/restl.js: lib/*.js
	mkdir -p dist
	webpack \
		-p \
		--display-modules \
		--sort-modules-by size
