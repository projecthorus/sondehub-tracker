#!/bin/bash

set -e

VERSION="`git rev-parse --short HEAD`"
BUILD_DATE="`date -u +%Y-%m-%dT%H:%M:%SZ`"

# create version check file
echo -n "Generating js/version.json... "
echo "{\"build_date\": \"$BUILD_DATE\", \"version\": \"$VERSION\", \"refresh\": 86400}" > js/version.json
echo "Done!"

# cache fixes
echo -n "Generating index.html... "
sed -e "s/{VER}/$VERSION/" -e "s/{BUILD_DATE}/$BUILD_DATE/" index.template.html > index.html
echo "Done!"

echo -n "Generating service-worker.js... "
sed -e "s/{VER}/$VERSION/" service-worker.template.js > service-worker.js
echo "Done!"

echo "Build version: $VERSION Build date: $BUILD_DATE"
