/*
 Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(document) {
  'use strict';

  function finishLazyLoading(){
    console.log('demo finishLazyLoading()');
    // Grab a reference to our auto-binding template
    // and give it some initial binding values
    // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
    var app = document.querySelector('#app');

    //save a reference to the actionable notifications route
    app.notificationsRoute = 'notifications-team';

    //set default host;
    app.host = 'dev.bridgeit.io';

    // Sets app default base URL
    app.baseUrl = '/';
    if (window.location.port === '') {  // if production
      // Uncomment app.baseURL below and
      // set app.baseURL to '/your-pathname/' if running from folder in production
      if(window.location.pathname.indexOf('client.html')!== -1){
        app.baseUrl = '/demos/viha/client.html';
        //app.baseUrl = '/demos/staging/viha/client.html/';
      }
      else{
        app.baseUrl = '/demos/viha/';
        //app.baseUrl = '/demos/staging/viha/';
      }
    }

    app.displayInstalledToast = function() {
      // Check to make sure caching is actually enabled—it won't be in the dev environment.
      if (!document.querySelector('platinum-sw-cache').disabled) {
        document.querySelector('#caching-complete').show();
      }
    };

    function setupNotificationListener(){
      bridgeit.xio.push.attach('http://'+app.host+'/pushio/demos/realms/' + bridgeit.io.auth.getLastKnownRealm(), bridgeit.io.auth.getLastKnownUsername());
      window.initializePushGroups(); //delegates to index.html for admins or client.html for regular users
    }

    document.addEventListener('notificationClicked',function(e) {
      var notification = e.detail.notification;
      //don't redirect link for admins since notifications
      //are only acted on by regular users
      if (app.$.demoView.isAdmin) {
        e.preventDefault();
        bridgeit.notify.hideNotification(e.detail.toast ? e.detail.toast : e.detail.native,0);
        return;
      }
      //set the current notification
      bridgeit.notify.selectNotification(notification);
      if (app.route === app.notificationsRoute) {
        var routeRef = app.$.demoView.querySelector(app.notificationsRoute+'-view');
        routeRef.loadNotification();
      }
      else {
        page.redirect('/'+app.notificationsRoute);
      }
    });
    document.addEventListener('notificationSelected',function() {
      function waitForApp() {
        if (!window.app || !app.$ || !app.$.demoView || !app.notificationsRoute) {
          setTimeout(waitForApp, 100);
          return;
        }
        //when the current notification is set we want to
        //load the notification if we are on the page
        if (app.route === app.notificationsRoute) {
          var routeRef = app.$.demoView.querySelector(app.notificationsRoute+'-view');
          routeRef.loadNotification();
        }
      }
      waitForApp();
    });

    document.addEventListener('afterQueueUpdated',function(e) {
      function waitForDemoData() {
        if (!window.app || !window.app.$ || !window.app.$.demoView || !window.app.$.demoView.$$('demo-data')) {
          setTimeout(waitForDemoData, 100);
          return;
        }
        var demoData = app.$.demoView.$$('demo-data');
        if (demoData) {
          //sync the notification queue
          demoData.set('notifications', e.detail.queue);
          //sync the notification count
          demoData.set('notificationCount', bridgeit.notify.getNotificationCount());
          //convert the queue array to an user map object so we can group by users on the notification page
          demoData.set('notificationsByGroup', e.detail.queue.reduce(function (map, obj) {
            if (!map[obj.group]) {
              map[obj.group] = [];
            }
            map[obj.group].push(obj);
            return map;
          }, {}));
        }
        else {
          console.warn('could not locate demoData element to store user notification');
        }
      }
      waitForDemoData();
    });

    // Listen for template bound event to know when bindings
    // have resolved and content has been stamped to the page
    app.addEventListener('dom-change', function() {
      console.log('Initializing demo');
      if( bridgeit.io.auth.isLoggedIn()){
        setTimeout(function(){
          setupNotificationListener();
        }, 5000);
      }
    });

    // Startup the Notification Push Listener after login
    window.addEventListener('onAfterLogin', function(){
      console.log('onAfterLogin callback: configuring notifications');
      setupNotificationListener();
    });

    // See https://github.com/Polymer/polymer/issues/1381
    window.addEventListener('WebComponentsReady', function() {
      // imports are loaded and elements have been registered
      console.log('WebComponentsReady!!!');
    });

    window.addEventListener('bridgeit-access-token-refreshed', function(e){
      console.log('demo app received event bridgeit-access-token-refreshed', e);
      bridgeit.xio.push.refreshConnection();
    });

    window.addEventListener('bridgeit-session-expired', function(e){
      console.log('demo app received event bridgeit-session-expired', e);
      bridgeit.xio.push.disconnect();

    });

    window.addEventListener('bridgeit-session-disconnected', function(e){
      console.log('demo app received event bridgeit-session-disconnected', e);
      bridgeit.xio.push.disconnect();
    });

    // Main area's paper-scroll-header-panel custom condensing transformation of
    // the appName in the middle-container and the bottom title in the bottom-container.
    // The appName is moved to top and shrunk on condensing. The bottom sub title
    // is shrunk to nothing on condensing.
    addEventListener('paper-header-transform', function(e) {
      var appName = document.querySelector('#mainToolbar .app-name');
      var middleContainer = document.querySelector('#mainToolbar .middle-container');
      var bottomContainer = document.querySelector('#mainToolbar .bottom-container');
      var detail = e.detail;
      var heightDiff = detail.height - detail.condensedHeight;
      var yRatio = Math.min(1, detail.y / heightDiff);
      var maxMiddleScale = 0.50;  // appName max size when condensed. The smaller the number the smaller the condensed size.
      var scaleMiddle = Math.max(maxMiddleScale, (heightDiff - detail.y) / (heightDiff / (1-maxMiddleScale))  + maxMiddleScale);
      var scaleBottom = 1 - yRatio;

      // Move/translate middleContainer
      Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);

      // Scale bottomContainer and bottom sub title to nothing and back
      Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);

      // Scale middleContainer appName
      Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
    });
  }

  var webComponentsSupported = (
  'registerElement' in document &&
  'import' in document.createElement('link') &&
  'content' in document.createElement('template'));

  if( !webComponentsSupported ){
    var script = document.createElement('script');
    script.async = true;
    script.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
    script.onload = finishLazyLoading;
    document.head.appendChild(script);
  }
  else{
    finishLazyLoading();
  }

})(document);
