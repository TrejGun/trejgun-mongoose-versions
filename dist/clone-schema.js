"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(schema, mongoose = _mongoose.default) {
  const clonedSchema = new mongoose.Schema();
  schema.eachPath((key, path) => {
    if (key !== "_id") {
      const clonedPath = {};
      clonedPath[key] = path.options;
      clonedPath[key].unique = false;
      clonedPath[key].index = false;

      clonedPath[key].set = value => value;

      clonedSchema.add(clonedPath);
    }
  });
  return clonedSchema;
}