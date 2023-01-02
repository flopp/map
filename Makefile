UPLOAD_TARGET=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/flopp.net/
UPLOAD_TARGET_DEV=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/2oc.de/
BUILD_DATE=$(shell date +%s)

.PHONY: setup
setup:
	npm install .
	./node_modules/.bin/cspell-dict-de-de-link

.PHONY: spell
spell:
	./node_modules/.bin/cspell \
		--config .cspell.json \
		src/**/*.html \
		src/**/*.ts \
		src/**/*.scss

.PHONY: lint
lint:
	./node_modules/.bin/tslint  \
		--project tsconfig.json \
		--config tslint.json \
		src/*.ts \
		src/**/*.ts
	./node_modules/.bin/prettier  \
		--check \
		src/*.ts \
		src/**/*.ts

.PHONY: format
format:
	./node_modules/.bin/prettier  \
		--write \
		src/*.ts \
		src/**/*.ts


.PHONY: update-translation
update-translation:
	./tools/find-i18n.py \
		-t src/lang/en/translation.json \
		-t src/lang/de/translation.json \
		-t src/lang/fr/translation.json \
		src/*.html \
		src/*.ts \
		src/components/*.ts

.PHONY: run-dev
run-dev:
	./node_modules/.bin/webpack serve --open --config webpack.dev.js

.PHONY: build
build:
	echo "export const Version = { build_date: ${BUILD_DATE} }" > src/components/version.ts
	./node_modules/.bin/webpack --config webpack.prod.js
	echo "{ \"build_date\": ${BUILD_DATE} }" > dist/version.json
	cp src/.htaccess dist/

.PHONY: upload
upload: build
	(cd dist && rsync -v -r --delete . ${UPLOAD_TARGET})

.PHONY: upload-dev
upload-dev: build
	(cd dist && rsync -v -r --delete . ${UPLOAD_TARGET_DEV})