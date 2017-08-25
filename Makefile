.PHONY: build
build: dist/ketting.min.js

.PHONY: clean
clean:
	rm dist/ketting.js

.PHONY: test
test:
	npm test

.PHONY: lint
lint:
	node_modules/.bin/eslint lib/

dist/ketting.min.js: lib/*.js
	mkdir -p dist
	node_modules/.bin/webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size
