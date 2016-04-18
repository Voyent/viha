# Action Service

# Because we are using a Node.js image, it assumes we have a valid package.json
# file included and does some magic for us like installing dependencies and
# firing up the the start script.

# The name:version of the Docker image to use.  Must be the first non-comment.
FROM node:4.3

#Rather than a version, we can provide the name of a LTS (long term support) version.
#FROM node:argon

#Another option is the risingstack images as they are much smaller Linux
#resulting in significantly smaller image sizes.
#FROM risingstack/alpine:3.3-v4.3.0-2.0.0
#FROM risingstack/alpine:3.3-v4.3.1-3.1.0

# Basically the author of the image.
MAINTAINER ICEsoft Technologies, Inc.

# Currently, npm default logging for the official Node docker container has
# logging set to "info" which results in a lot of information being dumped.
# We turn it down by setting this but if you need more logging, comment
# this out before rebuilding the image.
ENV NPM_CONFIG_LOGLEVEL warn

# Set our working directory.
RUN mkdir /demo-viha
WORKDIR /demo-viha

COPY package.json ./
RUN npm install

#Gulp gets installed locally under this path during 'npm install'
ENV PATH $PATH:/demo-viha/node_modules/.bin/

COPY .bowerrc ./
COPY .jscsrc ./
COPY .jshintrc ./
COPY bower.json ./
COPY gulpfile.js ./
COPY wct.conf.json ./

RUN npm install -g bower
RUN bower install

COPY app ./app
COPY docs ./docs
RUN gulp
