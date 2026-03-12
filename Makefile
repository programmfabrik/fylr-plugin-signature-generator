ZIP_NAME ?= "signaturegenerator.zip"
PLUGIN_NAME = fylr-plugin-signature-generator

COFFEE_FILES =  \
	signature-generator-custom-field.coffee \
	objecttype-selector-base-config.coffee \
	field-selector-base-config.coffee \
	signature-generator-custom-field.coffee \
	signature-generator-pool-manager.coffee

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

all: build zip ## build and zip

build: clean buildinfojson ## build plugin

	npm init -y
	npm install flatted
	npm install https

	mkdir -p build
	mkdir -p build/$(PLUGIN_NAME)
	mkdir -p build/$(PLUGIN_NAME)/webfrontend
	mkdir -p build/$(PLUGIN_NAME)/l10n
	mkdir -p build/$(PLUGIN_NAME)/server

	mkdir -p src/tmp # build code from coffee
	cp src/webfrontend/*.coffee src/tmp
	cd src/tmp && coffee -b --compile ${COFFEE_FILES} # bare-parameter is obligatory!
	cat src/tmp/*.js > build/$(PLUGIN_NAME)/webfrontend/signature-generator.js
	rm -rf src/tmp # clean tmp

	cp src/webfrontend/css/signature-generator.css build/$(PLUGIN_NAME)/webfrontend/signature-generator.css # copy css

	## build server code, add all files to one, so we can easily use it in the plugin without require or similar

	touch build/$(PLUGIN_NAME)/server/signature-generator.js
	cat src/server/helpers.js >> build/$(PLUGIN_NAME)/server/signature-generator.js
	cat src/server/sequence.js >> build/$(PLUGIN_NAME)/server/signature-generator.js
	cat src/server/validate.js >> build/$(PLUGIN_NAME)/server/signature-generator.js
	cat src/server/render.js >> build/$(PLUGIN_NAME)/server/signature-generator.js
	cat src/server/signature-generator.js >> build/$(PLUGIN_NAME)/server/signature-generator.js

	cp l10n/signature-generator.csv build/$(PLUGIN_NAME)/l10n/signature-generator.csv # copy l10n

	cp manifest.master.yml build/$(PLUGIN_NAME)/manifest.yml # copy manifest

	cp build-info.json build/$(PLUGIN_NAME)/build-info.json

buildinfojson:
	repo=`git remote get-url origin | sed -e 's/\.git$$//' -e 's#.*[/\\]##'` ;\
	rev=`git show --no-patch --format=%H` ;\
	lastchanged=`git show --no-patch --format=%ad --date=format:%Y-%m-%dT%T%z` ;\
	builddate=`date +"%Y-%m-%dT%T%z"` ;\
	echo '{' > build-info.json ;\
	echo '  "repository": "'$$repo'",' >> build-info.json ;\
	echo '  "rev": "'$$rev'",' >> build-info.json ;\
	echo '  "lastchanged": "'$$lastchanged'",' >> build-info.json ;\
	echo '  "builddate": "'$$builddate'"' >> build-info.json ;\
	echo '}' >> build-info.json

clean: ## clean
				rm -rf build

zip: build ## zip file
			cd build && zip ${ZIP_NAME} -r $(PLUGIN_NAME)/
