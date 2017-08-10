
export PATH:=$(PATH):./node_modules/.bin/

.PHONY: build
build: dist/bundle.js

.PHONY: clean
clean:
	rm dist/bundle.js

dist/bundle.js: lib/*.js
	mkdir -p dist
	webpack \
		--display-modules \
		lib/index.js dist/bundle.js	
