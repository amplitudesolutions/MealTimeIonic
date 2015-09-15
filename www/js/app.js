// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'firebase', 'listServices'])

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })

  // MAIN APPLICATION

  .controller('MainCtrl', ['$scope', 'Auth', 'getDBUrl', '$firebaseArray', 'list', function($scope, Auth, getDBUrl, $firebaseArray, list) {
    var user = {email: 'demo@mealtime.io', password: 'demo'};
    $scope.userAuth = '';


    //TODO: NEED TO MOVE TO ACTUAL LOGIN SCREEN ONE DAY
    Auth.$authWithPassword(user).then(function(authData) {
      $scope.userAuth = authData;
    }).catch(function(error) {
      console.log(error);
    });

    // Get Grocery List Items and bind to list.

    var itemsRef = new Firebase(getDBUrl.path + '/' + Auth.$getAuth().uid + '/items');
    $scope.items = $firebaseArray(itemsRef);

    var listRef = new Firebase(getDBUrl.path + '/' + Auth.$getAuth().uid + '/lists/Default/items');
    $scope.listItems = $firebaseArray(listRef);

    $scope.addToCart = function(item) {
      list.addToCart(item);
    };

    $scope.removeFromCart = function(item) {
      list.removeFromCart(item);
    };

  }])

  // CORE SERVICES

  .factory('Auth', ['$firebaseAuth', 'getDBUrl', function($firebaseAuth, getDBUrl) {
    var ref = new Firebase(getDBUrl.path);
    return $firebaseAuth(ref);
    }
  ])

  .factory('getDBUrl', ['$location', function($location) {

    // FOR IONIC DEVELOPMENT, THERE IS NO localhost or location to find.

    var dbURL = null;
    // if ($location.host() == 'localhost' || $location.host() == 'mealtimedev.firebaseapp.com') {
      // DEV DB
        dbURL = "https://mealtimedev.firebaseio.com";
    // } else if ($location.host() == 'intense-inferno-9799.firebaseapp.com') {
    // } else if ($location.host() == 'mealtimeprod.firebaseapp.com') {
    //   dbURL = "https://mealtimeprod.firebaseio.com";
    // }
    
    return {path: dbURL};
  }])

;