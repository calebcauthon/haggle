String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

var sliderCostChange;
var sliderWeightChange;

var next_back_function;
function bind_back_button(back_function) {
  if(next_back_function)
    $('#back-button').unbind('mousedown').mousedown(next_back_function).text('Back');
  else
    $('#back-button').unbind('mousedown').text('');

  next_back_function = back_function;
}

function resetSliders() {
  $('#slider-cost').labeledslider("value", 0);
  $('#slider-weight').labeledslider("value", 0);
  $('#slider-each').labeledslider("value", 0);
}

function show_map() {
  $('.page').hide();
  $('#map-canvas').show();
  bind_back_button(show_new_product);
}

function show_new_product() {
  $('.page').hide();
  $('#new-product').show().find('input').focus();
  bind_back_button(show_new_product);
}

function show_shopping_list() {
  $('.page').hide();
  $('#shopping-list').show();
  bind_back_button(show_shopping_list);
}

function show_product_in_focus() {
  $('.page').hide();
  $('#product-in-focus').show();
  bind_back_button(show_product_in_focus);
}

var loadFromAngular = $.Deferred();

loadFromAngular.done(function() {
  $('#slider-cost').labeledslider({
    step: .25,
    min: 0, max: 7,
    slide: function( event, ui ) {
      sliderCostChange(ui.value)
    }
  });

  $('#slider-cost').labeledslider("value", 0);

  $('#slider-weight').labeledslider({
    step: .25,
    min: 0, max: 7,
    slide: function( event, ui ) {
      sliderWeightChange(ui.value)
    }
  });

  $('#slider-weight').labeledslider("value", 0);

  $('#slider-each').labeledslider({
    step: 1,
    min: 0, max: 10,
    slide: function( event, ui ) {
      sliderEachChange(ui.value)
    }
  });

  $('#slider-each').labeledslider("value", 0);

  show_shopping_list();
});

var haggleApp = angular.module('haggleApp', []);

haggleApp.controller('ProductListCtrl', function ($scope) {
  function getDescription(offer) {
    if(offer.each > 0) {
        var each_rate = offer.cost / (offer.each * offers.weightOf(offer.name));
        return "$" + offer.cost + "/" + offer.each + " (" + accounting.formatMoney(each_rate) + "/lb)";
      } else {
        var rate = offer.cost / offer.weight;
        return "$" + offer.cost + "/" + offer.weight + "lb" + " (" + accounting.formatMoney(rate) + "/lb)";
      }
  }

  $scope.add_product = function(new_product) {
    products.push(new_product.name.capitalizeFirstLetter());

    $scope.all_products = all_products();
    $scope.new_product = {};
  };

  function Markers(data) {
    function add(marker_data) {
      data.push(marker_data);
      showOnMap(marker_data);
    }

    function showOnMap(marker_data) {
      marker_data.icon = "images/icons/square.png";
      map.addMarker(marker_data);
      map.map.setCenter(new google.maps.LatLng(marker_data.lat, marker_data.lng));
    }

    function get() {
      return data;
    }

    _.chain(data).map(showOnMap);

    return {
      add: add,
      get: get
    };
  };

  $scope.add_offer = function(offer_form) {
    
    var this_offer = {
      when: moment().format('MMMM Do YYYY, h:mm:ss a'),
      name: offer_form.name,
      description: getDescription(offer_form),
      weight: offer_form.weight,
      cost: offer_form.cost,
      each: offer_form.each
    };

    var promise = getLocation().then(function(data) {
      data.map = null;
      this_offer.where = data

      markers.add({
        lat: data.coords.latitude,
        lng: data.coords.longitude,
        title: offer_form.name
      });
    });

    offers.add(this_offer);

    resetSliders();
    $scope.new_offer = {};
    $scope.offers = all_offers();

    return promise;
  };

  function all_offers() {
    return offers.get();
  }

  function all_products() {
    return _.chain(products).map(function(this_product) {
      return {
        sortingValue: this_product.capitalizeFirstLetter(),
        name: this_product,
        purchased: is_purchased(this_product)
      }
    }).sortBy('sortingValue').value();
  };

  function is_purchased(product_name) {
    return _.chain(purchased).pluck('name').contains(product_name).value();
  }

  function is_redeemed(offer) {
    return _.chain(purchased).pluck('offer').contains(offer).value();
  }

  $scope.focus = function(product) {
    $scope.product_in_focus = product;
    show_product_in_focus();
  };

  function buy(product, offer) {
    purchased.push({
      name: product.name,
      offer: offer
    })

    $scope.all_products = all_products();
  }

  function unbuy(product, offer) {
    purchased = _.chain(purchased).reject(function(purchase) {
      return (purchase.name == product.name && offer.description == purchase.offer.description);
    }).value();

    $scope.all_products = all_products(); 
  }

  function remove_offer(offer) {
    offers.remove(offer);
    $scope.offers = all_offers();
  }

  function remove_product(product) {
    products = _.chain(products).reject(function(this_product) {
      return this_product == product.name;
    }).value();

    $scope.all_products = all_products();
  }

  function best_offer_for(product_name) {
    return offers.forA(product_name).best();
  }

  sliderCostChange = function(value) {
    $scope.new_offer = $scope.new_offer || {};
    $scope.new_offer.cost = value;
    $scope.$apply();      
  };

  sliderWeightChange = function(value) {
    $scope.new_offer = $scope.new_offer || {};
    $scope.new_offer.weight = value;
    $scope.$apply();      
  };

  sliderEachChange = function(value) {
    $scope.new_offer = $scope.new_offer || {};
    $scope.new_offer.each = value;
    $scope.$apply();      
  };

  function current_weight_label() {
    if($scope.new_offer && $scope.new_offer.weight) 
      return accounting.formatNumber($scope.new_offer.weight, 2) + " lbs";
    else
      return accounting.formatNumber(0, 2) + " lbs";
  }

  function current_cost() {
    if($scope.new_offer)
      return accounting.formatMoney($scope.new_offer.cost)
    else
      return accounting.formatMoney(0);
  }

  function current_price_label() {
    if($scope.new_offer)  {
      if($scope.new_offer.cost && $scope.new_offer.weight)
        return accounting.formatMoney($scope.new_offer.cost / $scope.new_offer.weight) + " / lb";      
      else 
        return "--";
    }
    else
      return "--";
  }

  function current_each_label() {
    if($scope.new_offer)  {
      if($scope.new_offer.cost && $scope.new_offer.each)
        return $scope.new_offer.each + " count";      
      else 
        return "--";
    }
    else
      return "--";
  }

  function offers_for(product_name) {
    return offers.forA(product_name).get();
  }

  function save() {
    firebase.save({
      markers: markers.get(),
      products: products,
      purchased: JSON.parse(angular.toJson(purchased)),
      offers: JSON.parse(angular.toJson(offers.get()))
    })
  }

  function load() {
    return firebase.get().done(function(data) {
      products  = (data && data.products) || [];
      purchased = (data && data.purchased) || [];
      offers    = Offers((data && data.offers) || []);
      markers   = Markers((data && data.markers) || []);
    });
  }

  var products;
  var purchased;
  var markers;
  
  load().done(function() {
    $scope.show_map = show_map;
    $scope.save = save
    $scope.load = load
    $scope.current_each_label = current_each_label;
    $scope.current_price_label = current_price_label;
    $scope.current_weight_label = current_weight_label;
    $scope.current_cost = current_cost;
    $scope.show_new_product = show_new_product;
    $scope.show_shopping_list = show_shopping_list;
    $scope.show_product_in_focus = show_product_in_focus;
    $scope.best_offer_for = best_offer_for;
    $scope.remove_product = remove_product;
    $scope.remove_offer = remove_offer;
    $scope.buy = buy;
    $scope.unbuy = unbuy;
    $scope.is_redeemed = is_redeemed;
    $scope.is_purchased = is_purchased;
    $scope.offers_for = offers_for;
    $scope.offers = all_offers();
    $scope.all_products = all_products();

    loadFromAngular.resolve();
    $scope.$apply();
  });
});