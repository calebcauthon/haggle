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

function show_new_product() {
  $('#shopping-list, #product-in-focus').hide();
  $('#new-product').show().find('input').focus();
  bind_back_button(show_new_product);
}

function show_shopping_list() {
  $('#new-product, #product-in-focus').hide();
  $('#shopping-list').show();
  bind_back_button(show_shopping_list);
}

function show_product_in_focus() {
  $('#product-in-focus').show();
  $('#new-product, #shopping-list').hide();
  bind_back_button(show_product_in_focus);
}

$(document).ready(function() {
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
  $scope.add_product = function(new_product) {
    products.push(new_product.name.capitalizeFirstLetter());

    $scope.all_products = all_products();
    $scope.new_product = {};
  };

  $scope.add_offer = function(offer_form) {
    
    var description;

    if(offer_form.each > 0) {
      description = "$" + offer_form.cost + "/" + offer_form.each;
    } else {
      description = "$" + offer_form.cost + "/" + offer_form.weight + "lb";
    }

    var this_offer = {
      name: offer_form.name,
      description: description,
      weight: offer_form.weight,
      cost: offer_form.cost,
      each: offer_form.each
    };

    $scope.new_offer = {};
    $('#slider-cost').labeledslider("value", 0);
    $('#slider-weight').labeledslider("value", 0);
    $('#slider-each').labeledslider("value", 0);

    offers.push(this_offer);
    $scope.offers = all_offers();
  };

  var products = [ 'mushrooms (1lb)', 'jalepeno (2)', 'paneer', 'cilantro', 'ginger', 'garlic', 'onions', 'tomatoes', 'jackfruit', 'cauliflower' ];
  var purchased = [];

  var offers = [];

  function all_offers() {
    return offers;
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

  function offers_for(product_name) {
    return _.chain(offers).select(function(this_offer) {
      return this_offer.name == product_name
    }).value();
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
    offers = _.chain(offers).reject(function(this_offer) {
      return this_offer.description == offer.description && this_offer.name == this_offer.name;
    }).value();

    $scope.offers = all_offers();
  }

  function remove_product(product) {
    products = _.chain(products).reject(function(this_product) {
      return this_product == product.name;
    }).value();

    $scope.all_products = all_products();
  }

  function best_offer_for(product_name) {
    return _.chain(offers_for(product_name)).reduce(function(best_offer, this_offer) {
      var best_offer_rate = best_offer.cost / best_offer.weight || 99999;
      var this_offer_rate = this_offer.cost / this_offer.weight || 99999;

      if(this_offer_rate < best_offer_rate)
        return this_offer;
      else
        return best_offer;
    }).value();
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

  function current_weight_each_label() {
    return;
  }

  function current_cost() {
    if($scope.new_offer)
      return accounting.formatMoney($scope.new_offer.cost);
    else
      return accounting.formatMoney(0);
  }

  $scope.current_weight_each_label = current_weight_each_label;
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
});