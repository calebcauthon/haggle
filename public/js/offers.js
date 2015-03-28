var Offers = function(offers_list) {
  function weightOf(product_name) {
    var offer = _.chain(offers.forA(product_name).get()).select(function(offer) {
      return offer.weight && offer.each;
    }).first().value();

    if(offer)
      return offer.weight / offer.each;
    else
      return .25;
  }

  function add(offer) {
    if(offer.weight)
      offer.rate = offer.cost / offer.weight;
    else
      offer.rate = offer.cost / (offer.each * offers.weightOf(offer.name));

    offers_list.push(offer);
  }

  function get() {
    return offers_list;
  };

  function forA(product_name) {
    return Offers(_.chain(offers_list).select(function(this_offer) {
      return this_offer.name == product_name
    }).value());
  }

  function remove(offer) {
    offers_list = _.chain(offers_list).reject(function(this_offer) {
      return this_offer.description == offer.description && this_offer.name == this_offer.name;
    }).value();
  }

  function best(product_name) {
    return _.chain(offers_list).reduce(function(best_offer, this_offer) {
      if(this_offer.rate < best_offer.rate)
        return this_offer;
      else
        return best_offer;
    }).value();
  }

  return {
    best: best,
    add: add,
    get: get,
    forA: forA,
    remove: remove,
    weightOf: weightOf
  };
};

var offers = Offers([]);