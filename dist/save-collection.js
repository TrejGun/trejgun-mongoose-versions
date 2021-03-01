"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _cloneSchema = _interopRequireDefault(require("./clone-schema"));

var _setSchemaOptions = _interopRequireDefault(require("./set-schema-options"));

var _version = _interopRequireDefault(require("mongoose/lib/error/version"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const debug = require("debug")("mongoose:version");

function _default(schema, options) {
  const versionedSchema = (0, _cloneSchema.default)(schema, options.mongoose);
  const mongoose = options.mongoose;
  const ObjectId = mongoose.Schema.Types.ObjectId;
  (0, _setSchemaOptions.default)(versionedSchema, options);
  versionedSchema.add({
    refId: {
      type: ObjectId,
      index: true
    },
    refVersion: {
      type: Number,
      index: true
    }
  });
  versionedSchema.index({
    refId: 1,
    refVersion: 1
  }); // Add reference to model to original schema

  schema.statics.VersionedModel = {};
  schema.on("init", function (Model) {
    const VersionedModel = Model.db.model(options.collection, versionedSchema);
    VersionedModel.createIndexes(function (err) {
      if (err) debug("ENSURE INDEX", err);
    });
    VersionedModel.on("index", function (err) {
      if (err) debug("INDEX", err);
    }); // Add reference to model to original schema

    schema.statics.VersionedModel = VersionedModel;
    Model.VersionedModel = VersionedModel;
  });
  schema.pre("save", function (next) {
    if (!options.suppressVersionIncrement) {
      const self = this;
      self.increment(); // Increment origins version
      // Checks for version conflict

      schema.statics.VersionedModel.find({
        refId: self._id,
        refVersion: {
          $exists: true
        } // keep it backwards compatible

      }).sort({
        refVersion: -1
      }).limit(1).exec(function (err, docs) {
        if (err) debug("SAVE", err);

        if (docs.length !== 0 && docs[0].refVersion > (self._doc[schema.options.versionKey] || 0)) {
          const error = new _version.default({}, 0, []);
          debug(error);
          return next(error);
        }

        createVersion.call(self, next);
      });
    } else {
      createVersion.call(this, next);
    }
  });

  function createVersion(next) {
    const clone = _objectSpread({}, this._doc); // shallow clone


    delete clone._id; // Saves current document version, first time to 0

    clone.refVersion = typeof this._doc[schema.options.versionKey] === "undefined" ? 0 : this._doc[schema.options.versionKey] + 1; // we are in the prehook so need to increment

    clone.refId = this._id; // Sets origins document id as a reference

    new schema.statics.VersionedModel(clone).save(function (err) {
      if (err) {
        debug(err);
      } else {
        debug("Created versioned model in mongodb");
      }

      next();
    });
  }

  schema.pre("remove", function (next) {
    if (!options.removeVersions) {
      return next();
    }

    schema.statics.VersionedModel.deleteOne({
      refId: this._id
    }, function (err) {
      if (err) {
        debug(err);
      } else {
        debug("Removed versioned model from mongodb");
      }

      next();
    });
  });
}