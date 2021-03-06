'use strict';

var Collection = require('backbone').Collection;
var Immutable = require('immutable');
var extend = Collection.extend;
var _ = require('underscore');

var OrderedMap;
var Record;
if (Immutable) {
  OrderedMap = Immutable.OrderedMap;
  Record = Immutable.Record;
}

var BACKBONE_EVENTS = 'add remove change reset sync';

var CrudStore = function () {
  this.initialize();
};
CrudStore.extend = extend;
CrudStore.instance = function () {
  return new this();
};

function isImmutableRecord(klass) {
  if (typeof klass !== 'function') {
    return false;
  }
  return true;
}

_(CrudStore.prototype).extend({
  collection: Collection,

  initialize: function () {
    if (this._isUsingViewModel()) {
      if (!Immutable) {
        throw 'You need to install Immutable.js to set viewModel';
      }

      if (!isImmutableRecord(this.viewModel)) {
        throw 'viewModel, if defined, must be an Immutable.Record class';
      }

      this._viewModels = new OrderedMap();
    }

    if (!this.collection) {
      throw 'collection must be set on the Store class';
    }
    this._collection = new this.collection();

    this._isFetchingAll = false;
    this._isFetching = {};
  },

  addChangeListener: function (callback) {
    if (!_(callback).isFunction()) {
      throw 'Callback param is not a function!';
    }

    this._collection.on(BACKBONE_EVENTS, callback);
  },

  removeChangeListener: function (callback) {
    if (!_(callback).isFunction()) {
      throw 'Callback param is not a function!';
    }

    this._collection.off(BACKBONE_EVENTS, callback);
  },

  getAll: function () {
    if (this._isFetchingAll) {
      return this._loadingResponse;
    }

    if (!this._isUsingViewModel()) {
      return this._collection.toJSON();
    }

    // First pass is to remove any unused models
    this._viewModels.keySeq().forEach(function (key) {
      if (!this._collection.get(key)) {
        this._viewModels = this._viewModels.remove(key);
      }
    }.bind(this));

    // This updates and creates models as necessary
    this._collection.each(this._cacheViewModel.bind(this));

    return this._viewModels;
  },

  get: function (id) {
    if (this._isFetchingAll || this._isFetching[id]) {
      return this._loadingResponse;
    }

    var model = this._collection.get(id);

    if (!model) {
      return null;
    } else {
      if (!this._isUsingViewModel()) {
        return model.toJSON();
      }

      return this._cacheViewModel(model);
    }
  },

  _loadingResponse: {
    isLoading: true
  },

  _isUsingViewModel: function () {
    return !!this.viewModel;
  },

  _cacheViewModel: function (model) {
    var viewModel = this._viewModels.get(model.cid);
    if (viewModel) {
      _(model.toJSON()).forEach(function (value, key) {
        viewModel = viewModel.set(key, value);
      });
    } else {
      viewModel = new this.viewModel(model.toJSON());
    }

    this._viewModels = this._viewModels.set(model.cid, viewModel);
    return viewModel;
  }
});

module.exports = CrudStore;
