UPLOAD_TARGET=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/2oc.de/

.PHONY: setup
setup:
	npm install .

.PHONY: update-translation
update-translation:
	tools/find-i18n.py \
		-t src/lang/en/translation.json \
		-t src/lang/de/translation.json \
		src/*.html \
		src/components/*.ts

.PHONY: run-dev
run-dev:
	node_modules/.bin/webpack serve --open --config webpack.dev.js

.PHONY: build
build:
	node_modules/.bin/webpack --config webpack.prod.js

.PHONY: upload
upload: build
	(cd dist && rsync -v -r . ${UPLOAD_TARGET})
