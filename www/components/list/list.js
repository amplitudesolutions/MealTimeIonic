angular.module('mealtime.services.lists', ['ionic', 'firebase'])

  .factory('list', ['$firebaseArray', 'Auth', 'getDBUrl', function($firebaseArray, Auth, getDBUrl) {
    //var list = $firebaseArray(new Firebase(getDBUrl.path + '/' + user.get().uid + '/lists/Default'));
    //var listItems = $firebaseArray(new Firebase(getDBUrl.path + '/' + user.get().uid + '/lists/Default/items'));

    var baseRef = new Firebase(getDBUrl.path + '/' + Auth.$getAuth().uid);
    var itemsRef = baseRef.child('items');
    var listRef = baseRef.child('lists/Default');
    var transactions = baseRef.child("transactions");

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
          //     //Item in list.. need to tell them
          // } else {
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
            //Item in list.. need to tell them
            //Add a Transaction
            
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

;