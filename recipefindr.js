Recipes = new Meteor.Collection('recipes');

var turnOnLogs = true;

var logIt = function(string) {
	if(turnOnLogs && typeof console !== 'undefined') {
		console.log(string);
	}
};

var nl2br = function (str, is_xhtml) {   
	var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
	return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
};

if (Meteor.isClient) {

  Meteor.subscribe('recipes', function onComplete() {
	logIt('Recipes are loaded');
	Session.set('recipesLoaded', true);
  });

  Template.view.count = function () {
	var searchTerm = Session.get('searchQuery');
	var count = 0;
	if(!_.isNull(searchTerm) && !_.isUndefined(searchTerm)) {
		if(searchTerm === '')
			count = Recipes.find({}).count();
		else
			count = Recipes.find({'ingredients.ingredient': searchTerm}).count();
	} else {
		count = Recipes.find({}).count();
	}
	if(_.isNull(searchTerm) || _.isUndefined(searchTerm) || searchTerm === '')
		if (count === 0 )
			return 'No recipe available. Add one?';
		else if (count === 1)
			return 'Found ' + count + ' recipe...';
		else
			return 'Found ' + count + ' recipes...';
	else 
		if (count === 0)
			return 'No recipe found using ingredient <em><span class="label">' + searchTerm  + '</em>. Add one?';
		else if (count === 1)
			return 'Found ' + count + ' recipe using ingredient <em><span class="label label-success">' + searchTerm  + '</em>.';
		else
			return 'Found ' + count + ' recipes using ingredient <em><span class="label label-success">' + searchTerm  + '</em>.';
  };

  Template.view.recipes = function () {
	if(Session.get('recipesLoaded')) {
		var searchTerm = Session.get('searchQuery');
		if(!_.isNull(searchTerm) && !_.isUndefined(searchTerm)) {
			logIt('Search term found \'' + searchTerm + '\'');
			if(searchTerm === '')
				return Recipes.find({});
			else
				return Recipes.find({'ingredients.ingredient': searchTerm});
		} else {
			logIt('No search term. Displaying all recipes.');
			return Recipes.find({});
		}
	}
  };

  Template.add.currentRecipe = function() {
	// get current recipe from the Session
	var c = Session.get('currentRecipe');
	if(!_.isNull(c) && !_.isUndefined(c)) {
		var id = c._id;
		c = Recipes.findOne({_id: id});
		// logIt('Current recipe is ' + c._id);
	}
	return c;
  };

  Template.recipe.selectedRecipe = function() {
	// get selected recipe from Session
	var c = Session.get('selectedRecipe');
	if(!_.isNull(c) && !_.isUndefined(c)) {
		var id = c._id;
		c = Recipes.findOne({_id: id});
		logIt('Selected recipe is ' + c._id);
		if (!_.isNull(c.instructions) && !_.isUndefined(c.instructions)) {
			c.instructions = nl2br(c.instructions, false);
		}
	}
	return c;
  };

  Template.formIngredients.currentIngredients = function() {
	// get current recipe from the Session
	var c = Session.get('currentIngredients');
	logIt('Current ingredient is ' + c);
	return c;
  };

  Template.formIngredients.addIngredient = function() {
	logIt("Add ingredient? " + this);
	return Session.equals('addIngredient', true);
  }

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        logIt('You pressed the button');
    }
  });

  Template.search.events({
	'keydown .search-query' : function(event) {
		// search upon enter key
		if(event.which == 13) {
			Session.set('searchQuery', event.target.value);
			event.preventDefault();
		}
	},
	'click .btn-search' : function() {
		// search upon submit
	}
  });

  Template.view.events({
	'click .btn-edit' : function() {
		logIt('Selected for edit: ' + this._id);
		Session.set('currentRecipe', this);
		Session.set('currentIngredients', this.ingredients);
		$('#myModal').modal('show');
	},
	'click .recipe-link' : function() {
		logIt('Selected for view: ' + this._id);
		Session.set('selectedRecipe', this);
	}
  });
 
  Template.add.events({
	'click .add-recipe' : function() {
		Session.set('currentRecipe', null);
		Session.set('currentIngredients', null);
		$('#myModal').modal('show');
	},
	'click .save-recipe' : function(event) {
		// retrieve data from the form
		var recipe = {
			name: $('#inputName').val(),
			description: $('#inputDescription').val(),
			ingredients: Session.get('currentIngredients'),
			instructions: $('#inputInstructions').val()
		};


		var callback = function(error) {
			if (error) {
				// display the error to the user
				logIt(error);
				alert(error.reason);
			} else {
				logIt('Saved successfully');
				$('#myModal').modal('hide');
			}
		};

		var currentRecipe = Session.get('currentRecipe');
		if(_.isNull(currentRecipe) || _.isUndefined(currentRecipe)) {
			Recipes.insert(recipe, callback);
		} else {
			var currentRecipeId = currentRecipe._id;
			Recipes.update({_id: currentRecipeId}, {$set: recipe}, callback);
		}
	},
	'click .new-ingredient' : function(event) {
		Session.set('adding_ingredient', this._id);
	},
	'click .add-ingredient' : function(event) {
		var ingredient = {
			ingredient: $('#inputIngredientName').val(),
			qty: $('#inputIngredientQty').val()
		};
		
		var currentRecipe = Session.get('currentRecipe');
		var currentIngredients = Session.get('currentIngredients');

		if( _.isNull(currentIngredients) || _.isUndefined(currentIngredients) || (_.isArray(currentIngredients) && currentIngredients.length === 0) ) {
			currentIngredients = [];
		}
		logIt('Adding ingredient ' + ingredient);
		currentIngredients.push(ingredient);
		Session.set('currentIngredients', currentIngredients);

		$('#inputIngredientName').val('');
		$('#inputIngredientQty').val('');
	}
  });

  Template.recipe.events({
	'dblclick .edit-qty': function(event) {
		// TODO make editable
	}
  });

  Template.formIngredients.events({
	'click .ingredient': function(event) {
		// TODO make editable
		logIt('Selected ingredient: ' + this);
		$('#inputIngredientName').val(this.ingredient);
		$('#inputIngredientQty').val(this.qty);
	},
	'click .new-ingredient': function(event) {
		event.preventDefault();
		Session.set('addIngredient', true);
	}
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
  // Publish all recipes
  Meteor.publish('recipes', function() {
		return Recipes.find({});
  });
}
