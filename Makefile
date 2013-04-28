
build: components index.js
	@component build --dev
	@component build --standalone Snap $ --out "." --name snap

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean
