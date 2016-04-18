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


    //set default host;
    app.host = 'dev.bridgeit.io';

    // Sets app default base URL
    app.baseUrl = '/';
    if (window.location.port === '') {  // if production
      // Uncomment app.baseURL below and
      // set app.baseURL to '/your-pathname/' if running from folder in production
      if(window.location.pathname.indexOf('client.html')!== -1){
        app.baseUrl = '/demos/viha/client.html/';
      }
      else{
        app.baseUrl = '/demos/viha/';
      }
    }

    app.displayInstalledToast = function() {
      // Check to make sure caching is actually enabled—it won't be in the dev environment.
      if (!document.querySelector('platinum-sw-cache').disabled) {
        document.querySelector('#caching-complete').show();
      }
    };

    function tryParseJSON (jsonString){
      try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === 'object' && o !== null) {
          return o;
        }
      }
      catch (e) {
        console.log('error parsing json', e);
      }

      return false;
    }

    function setupNotificationListener(){
      bridgeit.xio.push.attach('http://'+app.host+'/pushio/demos/realms/' + bridgeit.io.auth.getLastKnownRealm(), bridgeit.io.auth.getLastKnownUsername());
      bridgeit.xio.push.addListener(function (payload) {
        console.log('Notification: ', JSON.stringify(payload));

        //normalize payload TODO!!
        if(tryParseJSON(payload.message)){
          payload.message = JSON.parse(payload.message);
        }

        if( payload.message && typeof payload.message === 'object' && payload.message.message){
          if(payload.message.options){
            payload.options = payload.message.options;
          }
          if(payload.message.event){
            payload.event = payload.message.event;
          }

          payload.message = payload.message.message;
        }

        //ignore first batch of notifications for admin as they are irrelevant
        payload.usernameFromGroup = payload.group.split('/').pop();
        if( payload.message === 'joined' && payload.username !== payload.usernameFromGroup ){
          console.log('suppressing notification display');
          return;
        }

        var messageToDisplay;
        if( payload.message === 'joined' ){
          messageToDisplay = payload.usernameFromGroup + ' joined';
        }
        else{
          messageToDisplay = payload.message;
        }

        var demoView = app.$.demoView;
        demoView.$$('demo-data').push('notifications', payload);

        demoView.message = messageToDisplay;
        demoView.querySelector('#toast').show();

        var demoData = demoView.$$('#demoData');
        if( demoData ){
          if( !demoData.notificationsByUser ){
            demoData.notificationsByUser = {};
          }
          var userNotificationList = demoData.notificationsByUser[payload.usernameFromGroup];
          if( !userNotificationList ){
            userNotificationList = demoData.notificationsByUser[payload.usernameFromGroup] = [];
          }
          userNotificationList.push(payload);
          demoData.lastNotificationTimestamp = payload.time;
        }
        else{
          console.warn('could not locate demoData element to store user notification');
        }
        if(window.location.pathname.indexOf('client.html')!== -1 && payload.options){
            var data = {};
            data.message = payload.message;
            data.options = payload.options;
            data.event = payload.event;
            var solicitView = document.querySelector('solicit-view');
            solicitView.queue.push(data);
            solicitView.messagesRemaining = solicitView.queue.length;
            if(window.location.hash.indexOf('#!/solicit') !== -1 && document.querySelector('solicit-view').queue.length === 1) {
              var solicit = document.getElementById('solicit');
              solicit.setAttribute('data', JSON.stringify(data));
              solicit.showSolicit();
              setTimeout(function () {
                var headerHeight = solicit.$$('.paper-header.bridgeit-solicit').clientHeight;
                var buttonHeight = solicit.$$('.selectionButton').clientHeight;
                var totalHeight = headerHeight + buttonHeight + 15;
                var solicitDiv = document.getElementById('solicitDiv');
                if (totalHeight > solicit.clientHeight) {
                  solicitDiv.style.height = totalHeight + 'px';
                }
                /* jshint ignore:start*/
                var buttons = document.getElementsByClassName('selectionButton');
                for (var i = 0; i < buttons.length; i++) {
                  buttons[i].onclick = function () {
                    document.querySelector('solicit-view').updateResponse(this.textContent.trim());
                  };
                }
                /* jshint ignore:end*/

              }, 100);
            }
          else{
              console.log('Adding to the queue');
          }
        }
      });

      window.initializePushGroups(); //delegates to index.html for admins or client.html for regular users
    }

    // Listen for template bound event to know when bindings
    // have resolved and content has been stamped to the page
    app.addEventListener('dom-change', function() {
      console.log('Initializing demo');
      if( bridgeit.io.auth.isLoggedIn()){
        setTimeout(function(){
          setupNotificationListener();
          //initialize lastNotificationTimestamp so user list displays
          var demoData = app.$.demoView.$$('#demoData');
          if( demoData ){
            demoData.lastNotificationTimestamp = new Date().getTime();
          }
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
      setTimeout(function(){
        window.alert('Session Expired');
      },500);
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

    // Close drawer after menu item is selected if drawerPanel is narrow
    app.onDataRouteClick = function() {
      var drawerPanel = document.getElementById('paperDrawerPanel');
      if (drawerPanel.narrow) {
        drawerPanel.closeDrawer();
      }
    };

    // Scroll page to top and expand header
    app.scrollPageToTop = function() {
      document.getElementById('mainContainer').scrollTop = 0;
    };

    app.closeDrawer = function() {
      var drawerPanel = document.getElementById('paperDrawerPanel');
      if( drawerPanel ){
        drawerPanel.closeDrawer();
      }
    };
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
