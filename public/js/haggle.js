var items = [];
var ingredients = [];
var shopping_list = [];

var updateTable = function() {
  
  $('#item-list').html('');
  for(var i = 0; i < shopping_list.length; i++) {
    
    var best_deal_by_pounds = get_lowest_rate_by_pounds(shopping_list[i]);
    var best_deal_by_count = get_lowest_rate_by_count(shopping_list[i]);

    var poundage_label = best_deal_by_pounds ? convert_price_to_price_per_pound_label(best_deal_by_pounds.today_per_lb) : "--";
    var per_each_label = best_deal_by_count ? convert_price_to_price_per_each_label(best_deal_by_count.today_per_count) : "--"

    best_deal_label = "??";

    var row = '' + 
      '<tr class="item-row" data-item-id="'+get_item_id_for_item(shopping_list[i])+'">' + 
        '<td class="delete"></td>' + 
        '<td class="name">' + shopping_list[i]  + '</td>' +
        '<td class="label">' + best_deal_label + '</td>' +
        '<td class="price">' + poundage_label + '</td>' +
        '<td class="price">' + per_each_label + '</td>' +
        '<td class="clear"><button>clear prices</button></td>' +
      '</tr>'
    ;
    $('#item-list').append(row);
  }

  highlight_best_values();
};

var zero_out_the_dollars_slider = function() {
  $('#slider-first').labeledslider("value", 0);
  on_dollar_slider_change(0)
};

var zero_out_the_pounds_slider = function() {
  $('#slider-second').labeledslider("value", 0);
  on_pounds_slider_change(0)
};

var unhighlight_ingredient = function() {
  $('.item-buttons button.selected').removeClass('selected');
  $('#showcase .name').text('');
  $('#showcase .icon').removeClass($('#showcase .icon').data('last-class'))
  zero_out_the_dollars_slider();
  zero_out_the_pounds_slider();
};

var highlight_ingredient = function(name) {
  $('.item-buttons button').removeClass('selected').each(function() {
    if($(this).text() == name)
      $(this).addClass('selected');
  });

  $('#showcase .name').text(name);
  $('#showcase .icon').removeClass($('#showcase .icon').data('last-class')).addClass(name).data('last-class', name);

};

var highlight_best_values = function() {
  return;var rows = $('tr.item-row');
  $(rows).find('.best').removeClass('.best');
  for(var i = 0; i < rows.length; i++) {
    var this_row = rows.eq(i);
    var this_item = $(this_row).find('.name').text();
    
    var best_deal = get_lowest_rate(this_item);
    if(best_deal)
      $('.item-row[data-item-id='+best_deal.item_id+']').addClass('best');
  }
};

var get_lowest_rate_by_pounds = function() {
  return _.chain(items).select(function(this_item) {
    return this_item.today_per_lb > 0;
  }).reduce(function(list, this_item, memo) {
    return (this_item.today_per_lb < memo.today_per_lb ? this_item : memo);
  }).first().value();
};

var get_lowest_rate_by_count = function() {
  return _.chain(items).select(function(this_item) {
    return this_item.today_per_count > 0;
  }).reduce(function(list, this_item, memo) {
    return (this_item.today_per_count < memo.today_per_count ? this_item : memo);
  }).first().value();
};

var get_lowest_rate = function(item_name) {
  var lowest_rated_item;

  for(var i = 0; i < items.length; i++) {
    var this_item = items[i];
    var this_rate = items[i].today_per_lb;

    if(this_item.name == item_name && (!lowest_rated_item || this_rate < lowest_rated_item.today_per_lb))
      lowest_rated_item = this_item;
  }

  return lowest_rated_item;
};

var clear_prices = function(item_name) {
  items = _.chain(items).reject(function(this_item) {
    return this_item.name == item_name;
  }).value();

  save_to_firebase();
  updateTable();
};

var addItem = function(name, price, per_pound_price, weight_per_item, count) {
  var labels = [];

  if(per_pound_price != Infinity)
    labels.push(convert_price_to_price_per_pound_label(per_pound_price));
  
  if(count > 0) {
    var per_count_price = price / count;
    labels.push("$" + price  + " for " + count);
  }

  var today_per_lb = per_pound_price == Infinity ? 0 : per_pound_price;
  var today_per_count = count == 0 ? 0 : per_count_price;

  var this_item = {
    item_id: create_uuid(),
    name: name,
    today: price,
    today_per_lb: today_per_lb,
    best: '--',
    count: count,
    labels: labels
  };

  items.push(this_item);

  updateTable();
  save_to_firebase();
  unhighlight_ingredient();
};

var add_to_ingredients = function(name) {
  var index = ingredients.indexOf(name);
  if(index == -1) {
    ingredients.push(name);          
  }

  ingredients = ingredients.sort();

  save_to_firebase();
  create_ingredient_buttons();
};

var create_ingredient_buttons = function() {
  var undef; 
  $('.item-buttons').html('');
  for(var i = 0; i < ingredients.length; i++) {
    var this_ingredient = ingredients[i];
    if(this_ingredient != undef && this_ingredient.length > 0)
      $('.item-buttons').append('<button type="button"><span class="'+ this_ingredient.replace(/\ /, '-').toLowerCase() +'"></span>'+this_ingredient+'</button>')
  }
};

var delete_from_shopping_list = function(item_name) {
  shopping_list = _.chain(shopping_list).reject(function(this_item_name) { return this_item_name == item_name }).value()
  save_to_firebase();
  updateTable();
};

var delete_from_items = function(item_id) {
  var new_items = [];
  for(var i = 0; i < items.length; i++) {
    var this_item = items[i];
    if(this_item.item_id != item_id) {
      new_items.push(this_item);
    }
  }

  items = new_items;
  save_to_firebase();
  updateTable();
}

var create_uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

var show_weight = function() {
  $('tr.hidden.weight').removeClass('hidden');
};

var hide_weight = function() {
  $('tr.weight').addClass('hidden');
};

var show_count = function() {
  $('tr.hidden.count').removeClass('hidden');
};

var hide_count = function() {
  $('tr.count').addClass('hidden');
};


var convert_price_to_price_per_each_label = function(per_count_price) {
  if(per_count_price < 1) {
    var per_count_price_label = Math.floor(per_count_price * 100) + "&#162;";
  } else {
    var per_count_price_label = "$" + (Math.round(per_count_price * 100, 2).toFixed(0) / 100).toFixed(2);
  }
  
  return per_pound_price_label;
}
var convert_price_to_price_per_pound_label = function(per_pound_price) {
  if(per_pound_price < 1) {
    var per_pound_price_label = Math.floor(per_pound_price * 100) + "&#162;";
  } else {
    var per_pound_price_label = "$" + (Math.round(per_pound_price * 100, 2).toFixed(0) / 100).toFixed(2);
  }
  
  return per_pound_price_label;
};

var get_item_id_for_item = function(item_name) {
  return _.chain(items).select(function(this_item) {
    return this_item.name == item_name;
  }).first().value().item_id;
}

var get_item_by_item_id = function(item_id) {
  for(var i = 0; i < items.length; i++) {
    var this_item = items[i];
    if(this_item.item_id == item_id)
      return this_item;
  }
};

$(document).ready(function() {
  
  load_from_firebase().done(function() {
  
    if(items == null)
      items = [];

    shopping_list.forEach(add_to_ingredients);

    create_ingredient_buttons();

    $('#item-list').on('click', '.delete', function() {
      var item_name = $(this).parent('tr').find('.name').text();
      delete_from_shopping_list(item_name);
    });

    $('#item-list').on('click', '.clear', function() {
      var item_name = $(this).parent('tr').find('.name').text();
      clear_prices(item_name);
    });

    $('button#add').click(function() {
      var name = $('input#name').val();
      add_to_ingredients(name);

      var amount1 = parseFloat($('input#price-first').val());
      var amount2 = parseFloat($('input#price-second').val());
      var label1 = $('input#label-first').val();
      var label2 = $('input#label-second').val();
      var weight = parseFloat($('input#weight').val());
      var count = parseInt($('#count-big').text(), 10);
      
      if(label2 == "count")
        amount1// = amount1 / amount2;

      var middle = " for ";

      var amounts = [amount1, amount2];
      var labels = [label1, label2];

      var dollars = amount1;
      var pounds = amount2;

      var pound_per_count;

      if(name == "") {
        var name = prompt("Must choose item.");
        add_to_ingredients(name);
        return;
      }

      if(dollars == 0) {
        alert("Must choose dollars.");
        return;
      }
      
      var numerator = "$" + amount1.toFixed(2);
      var dollars = amount1;

      if(pounds == 0) {
        label2 = "";
        amount2 = count;
      }


      var denominator = amount2 + " " + label2;

      var per_pound_price = dollars / pounds;
      var price_label = numerator + middle + denominator;
      
      addItem(name, price_label, per_pound_price, pounds / count, count);  

      $('input#weight').val('');
      $('input#count').val('');
      hide_weight();
      hide_count();
    });

    $('.item-buttons').on('click', 'button', function() {
      var item = $(this).text();
      $('#name').val(item);
      highlight_ingredient(item);
    });

    $('#item-list').on('click', 'name', function() {
      var item = $(this).text();
      $('#name').val(item);
      highlight_ingredient(item);
    });

    updateTable();

    $('#costs').each(function() {
      var table = $(this);

      var first_amount  = $(table).find('input[type=text]').eq(0);
      var second_amount = $(table).find('input[type=text]').eq(2);

      var first_label  = $(table).find('input[type=text]').eq(1);
      var second_label = $(table).find('input[type=text]').eq(3);

      var first_value = function() {
        return parseFloat($(first_amount).val());
      };

      $(table).find('.increments button.first.increment').click(function() {
        var increment = parseFloat($(this).data('increment'));
        var initial_value = parseFloat($(first_amount).val());
        var new_amount = initial_value + increment;
        $(first_amount).val(new_amount);  
      });

      $(table).find('.increments button.first.set').click(function() {
        var new_amount = $(this).data('set');
        $(first_amount).val(new_amount);  
      });

      $(table).find('.increments button.second.increment').click(function() {
        var increment = parseFloat($(this).data('increment'));
        var initial_value = parseFloat($(second_amount).val());
        var new_amount = initial_value + increment;
        $(second_amount).val(new_amount);  
      });

      $(table).find('.increments button.second.set').click(function() {
        var new_amount = $(this).data('set');
        $(second_amount).val(new_amount);  
      });

      $(table).find('.label-buttons').find('button.second').click(function() {
        $(second_label).val($(this).text());  
      });

      $(table).find('.label-buttons').find('button.first').click(function() {
        $(first_label).val($(this).text());  
      });

      $(table).find('.label-buttons').find('.count, .basket, .pounds').click(function() {
        if($(this).hasClass('.first')) {
          $('#price-second').val('1');
          $('#label-second').val('dollars');
        }
      });

      $(table).find('.label-buttons').find('.basket').click(function() {
        if($(this).hasClass('first'))
          $('#price-first').val('1');

        if($(this).hasClass('second'))
          $('#price-second').val('1');
      });
    });

    $('#item-list').on('click', 'td.name', function() {
      var item = $(this).text();
      $('#name').val(item);
      highlight_ingredient(item);
    });

    $('#item-list').on('click', 'td.label', function() {
      var item_id = $(this).parent('tr').data('item-id');
      var item = get_item_by_item_id(item_id);
      var current_label = $(this).text();

      var labels = item.labels;

      if(labels.length == 1)
        return;

      var index = labels.indexOf(current_label);
      if(labels[index+1])
        $(this).html(labels[index+1]);
      else
        $(this).html(labels[0]);
    });
  });
  var add_to_shopping_list = function(item) {
    shopping_list.push(item);
    updateTable();
    add_to_ingredients(item);
    save_to_firebase();
  };

  $('#new-shopping-item').click(function() {
    var item = prompt("Item name?");
    add_to_shopping_list(item);
    highlight_ingredient(item);
    save_to_firebase();
  }); 
  
  $('#slider-first').labeledslider({
    step: .50,
    min: 0, max: 10,
    slide: function( event, ui ) {
      on_dollar_slider_change(ui.value);      
    }
  });

  $('#slider-second').labeledslider({
    step: .50,
    min: 0, max: 10,
    slide: function( event, ui ) {
      on_pounds_slider_change(ui.value);
    }
  });

  $('#slider-count').labeledslider({
    step: 1,
    min: 0, max: 10,
    slide: function( event, ui ) {
      $('#count-big').text(ui.value);
    }
  });
});
var on_dollar_slider_change = function(value) {
  $('#price-first').val(value);
  $('#dollars-big').html('<span class="dollar-sign">$</span>' + value.toFixed(2));
};

var on_pounds_slider_change = function(value) {
  $('#price-second').val(value);
  $('#weight-big').text(value.toFixed(2) + ' lb');
};

var myFirebaseRef = new Firebase("https://haggle.firebaseio.com/");

var save_to_firebase = function() {
  myFirebaseRef.set({
    items: items,
    ingredients: ingredients,
    shopping_list: shopping_list
  });
};

var load_from_firebase = function() {
  var promise = $.Deferred();
  var finished_count = 0;

  myFirebaseRef.child("items").on("value", function(snapshot) {
    items = snapshot.val();

    finished_count++;
    if(finished_count == 3)
      promise.resolve();
  });

  myFirebaseRef.child("ingredients").on("value", function(snapshot) {
    ingredients = snapshot.val();

    finished_count++;
    if(finished_count == 3)
      promise.resolve();
  });

  myFirebaseRef.child("shopping_list").on("value", function(snapshot) {
    shopping_list = snapshot.val() || [];

    finished_count++;
    if(finished_count == 3)
      promise.resolve();
  });

  updateTable();

  return promise;
};