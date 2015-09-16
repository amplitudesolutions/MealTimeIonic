angular.module('mealtime.controllers', [])

  .controller('MainCtrl', ['$scope', 'list', 'inventory', 'user', '$state', function($scope, list, inventory, user, $state) {
    // Get Grocery List Items and bind to list.

    $scope.items = inventory.get();
    $scope.listItems = list.getListItems();

    $scope.addToCart = function(item) {
      list.addToCart(item);
    };

    $scope.removeFromCart = function(item) {
      list.removeFromCart(item);
    };

    $scope.logout = function() {
    	user.logout();
    	$state.go('login');
    };

  }])

  .controller('LoginCtrl', ['$scope', 'user', '$state', '$ionicLoading', function($scope, user, $state, $ionicLoading) {
    $scope.user = {};

    $scope.login = function() {
    	$scope.errorCaught = '';
    	$scope.errorMessage = 'Username or Password Incorrect';

      	var userCopy = angular.copy($scope.user);
	      userCopy.email += '@mealtime.io'; //or maybe get mealtime.guru
	      $ionicLoading.show({
      			template: 'Getting Started...'
    		});
	      user.login(userCopy).then(function(userObj) {
	      	$scope.user.password = '';
	      	
	      	$ionicLoading.hide();
	        
	        $state.go('list');
	      }).catch(function(error) {
	      	$ionicLoading.hide();
	      		$scope.errorCaught = true;
	      		console.log(error.code);
	   //      switch(error.code) {
	   //      	case "INVALID_EMAIL":
	   //       		console.log(error);
	   //          	break;
				// case "INVALID_PASSWORD":
				// 	console.log(error);
				// 	break;
				// case "INVALID_USER":
				// 	console.log(error);
				// 	break;
				// default:
				// 	console.log(error);
	   //      }
	    });
    };
  }])
;