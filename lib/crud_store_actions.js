'use strict';

var assign = require('object-assign');
var extend = require('backbone').Collection.extend;
var _ = require('underscore');

var CrudStoreActions = function () {
};
CrudStoreActions.extend = extend;
CrudStoreActions.bindTo = function(Store) {
  var actions = new this();

  var functionAttrs = _(actions).functions();
  _(functionAttrs).each(function (attr) {
    actions[attr] = actions[attr].bind(Store);
  });

  return actions;
};

assign(CrudStoreActions.prototype, {
  create: function (data) {
    var model = new this._collection.model(data);
    this._collection.add(model);
  },

  createAndSave: function (data) {
    this._collection.create(data);
  },

  update: function (id, data) {
    this._collection.get(id).set(data);
  },

  updateAndSave: function (id, data) {
    var model = this._collection.get(id);
    model.set(data);
    model.save();
  },

  destroy: function (id) {
    this._collection.remove(id);
  },

  destroyAndSave: function (id) {
    this._collection.get(id).destroy();
  },

  load: function (models) {
    this._collection.reset(models);
  },

  fetchAll: function () {
    this._fetchingAll = true;
    this._collection.fetch({
      silent: true,
      success: function () {
        this._fetchingAll = false;
      }.bind(this)
    });
  },

  save: function (id) {
    var model = this._collection.get(id);
    model.save();
  }
});

module.exports = CrudStoreActions;