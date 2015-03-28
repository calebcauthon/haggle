var firebase = function() {
  
  var ref = new Firebase("https://haggle.firebaseio.com/");

  return {
    save: function(data) {
      ref.child('haggle').set(data);
    }, 
    get: function() {
      var promise = $.Deferred();
      
      ref.child('haggle').on("value", function(snapshot) {
        promise.resolve(snapshot.val());
      });

      return promise;
    }

  }
}();