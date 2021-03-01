"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _saveCollection = _interopRequireDefault(require("./save-collection"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(schema, options) {
  if (typeof options === "string") {
    options = {
      collection: options
    };
  }

  options = options || {};
  options.collection = options.collection || "versions";
  options.logError = options.logError || false;
  options.strategy = options.strategy || "array";
  options.maxVersions = options.maxVersions || Number.MAX_VALUE;
  options.suppressVersionIncrement = options.suppressVersionIncrement !== false;
  options.mongoose = options.mongoose || require("mongoose");
  options.removeVersions = !!options.removeVersions;
  options.ignorePaths = options.ignorePaths || [];
  (0, _saveCollection.default)(schema, options);
}