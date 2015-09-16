/* 
	MEALTIME SERVICES
	v1.0
*/


angular.module('mealtime.services', ['firebase'])

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

  	.factory('user', ['$q', 'Auth', 'getDBUrl', '$rootScope', function($q, Auth, getDBUrl, $rootScope) {

    	// Used to setup any defaults for the user in firebase.
    	function setupUser(user, email) {
      		var baseRef = new Firebase(getDBUrl.path + '/' + user.uid);

      		baseRef.once("value", function(snapshot) {
	       		if (!snapshot.exists()) {

			        // Initial Setup of Default Values on first login.
		          
					// Setup Default Category
					baseRef.child("categories").push({color: 'default', default: true, name: 'Default Category'})

					// Setup Default List
					// Will worry about it when I add multiple list support for users.

					// Setup Default Settings
					baseRef.child('settings').set({defaultlist: 'Default', uom: 'metric', email: email});
					// Check to see if email is part of user object, if not, don't bother adding it just yet.

					// Setup Receipe Schedule
					var scheduleRef = baseRef.child('schedule');
					scheduleRef.child(0).set({abbrev: 'Su', name: 'Sunday'});
					scheduleRef.child(1).set({abbrev: 'M', name: 'Monday'});
					scheduleRef.child(2).set({abbrev: 'T', name: 'Tuesday'});
					scheduleRef.child(3).set({abbrev: 'W', name: 'Wednesday'});
					scheduleRef.child(4).set({abbrev: 'Th', name: 'Thursday'});
					scheduleRef.child(5).set({abbrev: 'F', name: 'Friday'});
					scheduleRef.child(6).set({abbrev: 'S', name: 'Saturday'});
				}
	      	});
    	}

	    return {
	    	get: function() {
		        return Auth.$getAuth();
	      	},
	      	login: function(user) {
	        	var deferred = $q.defer();

		        Auth.$authWithPassword(user).then(function(authData) {
	    	    	setupUser(authData, user.group);
	    	    	$rootScope.currentUser = authData;

					deferred.resolve(authData);
	        	}).catch(function(error) {
	          		deferred.reject(error);
	        	});
	        	return deferred.promise;
	      	},
	      	logout: function() {
	      		$rootScope.currentUser = '';
	        	return Auth.$unauth();
	      	},
	      	create: function(user) {
	        	var deferred = $q.defer();

	        	Auth.$createUser(user).then(function(userData) {
	          		deferred.resolve(userData);
	        	}).catch(function(error){
	          		deferred.reject(error);
	        	});

	        	return deferred.promise;
	      	}
	    }
  	}])

	.factory('list', ['$firebaseArray', 'user', 'getDBUrl', function($firebaseArray, user, getDBUrl) {
	    var baseRef = new Firebase(getDBUrl.path + '/' + user.get().uid);
	    var itemsRef = baseRef.child('items');
	    var listRef = baseRef.child('lists/Default');
	    var transactions = baseRef.child("transactions");

	    var items = $firebaseArray(itemsRef);
	    var listItems = $firebaseArray(listRef.child('items'));

	    return {
	      	get: function() {
	        	return list;
	      	},
	      	getListItems: function() {
		        return listItems;
	    	},
	      	addToCart: function(item) {
	        	//This is used when the checkbox of an item is checked and then added to "In your basket"
	        	var listItemRef = listRef.child("/items");
	        	//Check if item exists, if not create it.
	        	listItemRef.child(item.$id + "/gotit").transaction(function(gotit){
	          		if (gotit !== null) {          		
	            		//Add a Transaction
	            		var purchaseDate = Firebase.ServerValue.TIMESTAMP;
	            
			            itemsRef.child(item.$id + "/lastpurchase").transaction(function(lastpurchase) {
			              return purchaseDate;
			            });

			            itemsRef.child(item.$id + "/stock").transaction(function(stock) {
			              return stock+item.quantity;
			            });

	            		transactions.push({list: 'Default', item: item.$id, date: purchaseDate, quantity: item.quantity});
	            		return !gotit;
	          		}
	        	}, function(error, committed, snapshot) {
	          		if (error) {
	            		console.log('Transaction failed abnormally!', error);
	          		}
	        	});
	      	},
	      	removeFromCart: function(item) {
		        var listItemRef = listRef.child("/items");
	    	    //Check if item exists, if not create it.
	        	listItemRef.child(item.$id + "/gotit").transaction(function(gotit){
	          		if (gotit !== null) {
		            
	    		        transactions.orderByChild("item").endAt(item.$id).limitToLast(2).once("value", function(snapShot) {
		            		var nIndex = 1;
		              		snapShot.forEach(function(itemSnap) {
			                	if (nIndex === 1) {
			                  		// Set the last purchase date = to the previous transaction
			                  		itemsRef.child(item.$id + "/lastpurchase").transaction(function(lastpurchase) {
			                    		return itemSnap.val().date;
			                  		});
			                	} else if(nIndex === 2) {
			                  		//delete the last transaction. When they uncheck in the cart, assuming Undo.
			                  		transactions.child(itemSnap.key()).remove();
			                	}
			                	nIndex++;
		            		});
	            		});           
	            	
	    	        	itemsRef.child(item.$id + "/stock").transaction(function(stock) {
		              		return stock-item.quantity;
	            		});

	            		// transactions.push({list: $scope.list[0].$id, item: item.$id, date: purchaseDate});
	            		return !gotit;
	          		}
	        	}, function(error, committed, snapshot) {
	          		if (error) {
	            		console.log('Transaction failed abnormally!', error);
	          		}
	        	});
	      	},
	      	add: function(item) {
	        	var listItemRef = listRef.child("/items");
	        	//Check if item exists, if not create it.
	        	listItemRef.child(item.$id).transaction(function(currentData){
	          		if (currentData === null) {
	              		return { quantity: 1, category: item.category, gotit: false};
	          		} else {
	            		listItemRef.child(item.$id + "/quantity").transaction(function(quantity) {
	              			return quantity+1;
	            		});
	          		}
	        	}, function(error, committed, snapshot) {
	          		if (error) {
	            		console.log('Transaction failed abnormally!', error);
	          		}
	        	});
	      	},
	      	remove: function(item) {
	        	removeItem(item);
	      	},
			addQuantity: function(item, qty) {
	        	var listItemRef = listRef.child("/items");
	        	//Check if item exists, if not create it.

	        	listItemRef.child(item.$id + "/quantity").transaction(function(quantity) {
	          		return quantity+qty;
	        	}), function(error, committed, snapshot) {
	          		if (error) {
	            		console.log('Transaction failed abnormally!', error);
	          		}
	        	};
	      	},
	      	removeQuantity: function(item, qty) {
	        	var listItemRef = listRef.child("/items");
	        	//Check if item exists, if not create it.

	        	listItemRef.child(item.$id + "/quantity").transaction(function(quantity) {
		        	if (quantity <= 1) {
		            	removeItem(item);
					} else {
						return quantity-qty;
					}
	        	}), function(error, committed, snapshot) {
	          		if (error) {
	            		console.log('Transaction failed abnormally!', error);
	          		}
	        	};
	      	}
	    }
	}])

	.factory('inventory', ['$q', '$firebaseArray', 'getDBUrl', 'category', 'user', function($q, $firebaseArray, getDBUrl, category, user){
	  var baseRef = new Firebase(getDBUrl.path + '/' + user.get().uid);
	  
	  var listRef = baseRef.child('lists');
	  var categoriesRef = baseRef.child('categories');
	  var itemsRef = baseRef.child('items');

	  var items = $firebaseArray(itemsRef);
	  
	  return {
	    get: function() {
	      return items;
	    },
	    add: function(item) {
	      var deferred = $q.defer();

	      var defaultCategory = category.getDefault();
	      
	      if (item.name) {
	        itemsRef.orderByChild("name").startAt(item.name).endAt(item.name).once('value', function(dataSnapshot) {
	            if (dataSnapshot.val() === null) {
	            //Create New Item
	              items.$add({ name: item.name, category: defaultCategory, stock: 0, minstock: 0}).then(function(ref) {         
	                categoriesRef.child("/" + defaultCategory + "/items/" + ref.key()).set(true);
	                deferred.resolve(items.$getRecord(ref.key()));
	              });
	            } else {
	              dataSnapshot.forEach(function(snap){
	                deferred.resolve(items.$getRecord(snap.key()));
	              });
	            }
	        });
	      } else {
	        deferred.reject('Issue retrieving information, please try again.')
	      }

	      return deferred.promise;
	    },
	    remove: function(item) {
	      //Delete Item from Inventory
	      var category = null;

	      itemsRef.child(item.$id).once('value', function(data){
	          category = data.val().category;
	      });

	      categoriesRef.child("/" + category + "/items/" + item.$id).set(null);
	      listRef.child("/Default/items/" + item.$id).remove();
	      itemsRef.child(item.$id).remove();
	    },
	    save: function (item) {
	      var name = items[items.$indexFor(item.$id)].name.trim();
	      if (name) {
	        item.name = name;
	        items.$save(item);
	      }
	    },
	    changeCategory: function(item, category_id) {
	      itemsRef.child(item.$id + "/category").transaction(function(category) {
	        listRef.child('/Default/items/' + item.$id + '/category').transaction(function(category){
	          if (category !== null)
	            return category_id;
	          });

	          return category_id;
	      }), function(error, committed, snapshot) {
	        if (error) {
	          console.log('Transaction failed abnormally!', error);
	        }
	      };
	    },
	    addStock: function(item, quantity) {
	      itemsRef.child(item.$id + "/stock").transaction(function(stock) {
	        return stock+quantity;
	      }), function(error, committed, snapshot) {
	        if (error) {
	          console.log('Transaction failed abnormally!', error);
	        }
	      };
	    },
	    removeStock: function(item, quantity) {
	      //Add Check in here so that you can't go below 0... if Qty is 22 and you subtract that but there is only 10 in there. it will go to -12.
	      itemsRef.child(item.$id + "/stock").transaction(function(stock) {
	        if (stock != 0) {
	          return stock-quantity;
	        }
	      }), function(error, committed, snapshot) {
	        if (error) {
	          console.log('Transaction failed abnormally!', error);
	        }
	      };
	    },
	    addMinStock: function(item, quantity) {
	      itemsRef.child(item.$id + "/minstock").transaction(function(minstock) {
	        return minstock+quantity;
	      }), function(error, committed, snapshot) {
	        if (error) {
	          console.log('Transaction failed abnormally!', error);
	        }
	      };
	    },
	    removeMinStock: function(item, quantity) {
	      //Add Check in here so that you can't go below 0... if Qty is 22 and you subtract that but there is only 10 in there. it will go to -12.
	      itemsRef.child(item.$id + "/minstock").transaction(function(minstock) {
	        if (minstock != 0) {
	          return minstock-quantity;
	        }
	      }), function(error, committed, snapshot) {
	        if (error) {
	          console.log('Transaction failed abnormally!', error);
	        }
	      };
	    }

	  }
	}])

	.factory('category', ['$firebaseArray', 'getDBUrl', 'user', function($firebaseArray, getDBUrl, user){
	  var baseRef = new Firebase(getDBUrl.path + '/' + user.get().uid);
	  var categoriesRef = baseRef.child('categories');
	  var categories = $firebaseArray(categoriesRef);
	  // var fbCategories = $firebase(categoriesRef);
	  // var categories = fbCategories.$asArray();

	  function setDefault(category) {
	    category.child('default').set(true);
	  }
	  
	  return {
	    getDefault: function() {
	      var returnData = null;
	      categoriesRef.orderByChild('default').startAt(true).endAt(true).once('value', function(snap) {
	        snap.forEach(function(snapData) {
	          returnData = snapData.key();
	        });
	      });
	      return returnData;
	    },
	    setDefault: function(category) {
	      setDefault(category);
	    },
	    get: function() {
	      return categories;
	    },
	    add: function(category) {
	      categories.$add({ name: category.name, color: category.color }).then(function(ref) {
	        //var id = ref;
	        if (categories.length == 1) {
	          setDefault(ref);
	        }
	      });
	    },
	    save: function(category) {
	      var name = category.name.trim();
	      if (name) {
	        category.name = name;
	        var cat = categories.$indexFor(category.$id);
	        categories[cat] = category;
	        categories.$save(cat);
	       }
	    }
	  }

	}])

;