LOCAL_DIR=.local
UPLOAD_DIR=.upload
UPLOAD_TARGET=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/2oc.de/

.PHONY: setup
setup:
	npm install

.PHONY: update-translation
update-translation:
	tools/find-i18n.py \
		-t lang/en/translation.json \
		-t lang/de/translation.json \
		html/*.html src/*.ts

.PHONY: lint
lint:
	npm run lint-tslint

.PHONY: build-local
build-local:
	mkdir -p ${LOCAL_DIR} ${LOCAL_DIR}/css ${LOCAL_DIR}/img ${LOCAL_DIR}/lang ${LOCAL_DIR}/js
	cp html/index.html ${LOCAL_DIR}/
	cp css/style.css node_modules/bulma/css/bulma.min.css node_modules/leaflet/dist/leaflet.css ${LOCAL_DIR}/css/
	cp img/* ${LOCAL_DIR}/img/
	cp node_modules/feather-icons/dist/feather-sprite.svg ${LOCAL_DIR}/img/
	node_modules/.bin/webpack --mode development --output-path ${LOCAL_DIR}/js

.PHONY: run-local
run-local: build-local
	node_modules/.bin/http-server ${LOCAL_DIR}

.PHONY: build-upload
build-upload:
	mkdir -p ${UPLOAD_DIR} ${UPLOAD_DIR}/css ${UPLOAD_DIR}/img ${UPLOAD_DIR}/lang ${UPLOAD_DIR}/js
	sed -e "/<!--TRACKING-->/r .tracking" html/index.html > ${UPLOAD_DIR}/index.html
	cp css/style.css node_modules/bulma/css/bulma.min.css node_modules/leaflet/dist/leaflet.css ${UPLOAD_DIR}/css/
	cp img/* ${LOCAL_DIR}/img/
	cp node_modules/feather-icons/dist/feather-sprite.svg ${UPLOAD_DIR}/img
	node_modules/.bin/webpack --mode production

.PHONY: upload
upload: build-upload
	(cd ${UPLOAD_DIR} && rsync -v -r . ${UPLOAD_TARGET})
