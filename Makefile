LOCAL_DIR=.local
UPLOAD_DIR=.upload
UPLOAD_TARGET=floppnet@echeclus.uberspace.de:/var/www/virtual/floppnet/2oc.de/

.PHONY: setup
setup:
	npm install

.PHONY: build-local
build-local:
	mkdir -p ${LOCAL_DIR} ${LOCAL_DIR}/css ${LOCAL_DIR}/img ${LOCAL_DIR}/js
	cp html/index.html ${LOCAL_DIR}/
	cp css/style.css node_modules/bulma/css/bulma.min.css node_modules/leaflet/dist/leaflet.css ${LOCAL_DIR}/css/
	cp node_modules/feather-icons/dist/feather-sprite.svg ${LOCAL_DIR}/img/
	cp .secrets.js ${LOCAL_DIR}/js/api-keys.js
	node_modules/.bin/webpack js/main.js --mode development -o ${LOCAL_DIR}/js/bundle.js

.PHONY: run-local
run-local: build-local
	node_modules/.bin/http-server ${LOCAL_DIR}

.PHONY: build-upload
build-upload:
	mkdir -p ${UPLOAD_DIR} ${UPLOAD_DIR}/css ${UPLOAD_DIR}/img ${UPLOAD_DIR}/js
	sed -e "/<!--TRACKING-->/r .tracking" html/index.html > ${UPLOAD_DIR}/index.html
	cp css/style.css node_modules/bulma/css/bulma.min.css node_modules/leaflet/dist/leaflet.css ${UPLOAD_DIR}/css/
	cp node_modules/feather-icons/dist/feather-sprite.svg ${UPLOAD_DIR}/img
	cp .secrets-production.js ${UPLOAD_DIR}/js/api-keys.js
	node_modules/.bin/webpack js/main.js --mode production -o ./${UPLOAD_DIR}/js/bundle.js

.PHONY: upload
upload: build-upload
	(cd ${UPLOAD_DIR} && rsync -v -r . ${UPLOAD_TARGET})
