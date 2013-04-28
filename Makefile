
build: components index.js
	@component build --dev
	@component build --standalone Snap $ --out "." --name snap
	@node_modules/uglify-js/bin/uglifyjs snap.js -o snap.min.js

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean
