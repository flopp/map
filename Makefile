UPLOAD_TARGET=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/flopp.net/
UPLOAD_TARGET2=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/2oc.de/

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
		src/*.html \
		src/*.ts \
		src/components/*.ts

.PHONY: run-dev
run-dev:
	./node_modules/.bin/webpack serve --open --config webpack.dev.js

.PHONY: build
build:
	./node_modules/.bin/webpack --config webpack.prod.js

.PHONY: upload
upload: build
	#@echo "DRY RUN"
	#@(cd dist && rsync -v -r --delete --dry-run . ${UPLOAD_TARGET})
	#@echo "PRESS ENTER TO CONTINUE"
	#@read WAIT
	(cd dist && rsync -v -r --delete . ${UPLOAD_TARGET})

.PHONY: upload2
upload2: build
	(cd dist && rsync -v -r --delete . ${UPLOAD_TARGET2})