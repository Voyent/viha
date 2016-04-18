#!/bin/bash
set +e
HOST=web1d

echo "...Updating from Git..."
git pull
echo "...Removing old Bower components and Dist..."
rm -rf ./app/bower_components
rm -rf ./dist
echo "...Updating Bower with new install..."
bower install
