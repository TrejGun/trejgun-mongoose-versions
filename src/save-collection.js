/* eslint-disable @babel/no-invalid-this */

import cloneSchema from "./clone-schema";
import setSchemaOptions from "./set-schema-options";
import VersionError from "mongoose/lib/error/version";

const debug = require("debug")("mongoose:version");

export default function (schema, options) {
  const versionedSchema = cloneSchema(schema, options.mongoose);
  const mongoose = options.mongoose;
  const ObjectId = mongoose.Schema.Types.ObjectId;

  setSchemaOptions(versionedSchema, options);

  versionedSchema.add({
    refId: {
      type: ObjectId,
      index: true,
    },
    refVersion: {
      type: Number,
      index: true,
    },
  });

  versionedSchema.index({refId: 1, refVersion: 1});

  // Add reference to model to original schema
  schema.statics.VersionedModel = {};

  schema.on("init", function (Model) {
    const VersionedModel = Model.db.model(options.collection, versionedSchema);
    VersionedModel.createIndexes(function (err) {
      if (err) debug("ENSURE INDEX", err);
    });
    VersionedModel.on("index", function (err) {
      if (err) debug("INDEX", err);
    });

    // Add reference to model to original schema
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
        refVersion: {$exists: true}, // keep it backwards compatible
      })
        .sort({refVersion: -1})
        .limit(1)
        .exec(function (err, docs) {
          if (err) debug("SAVE", err);
          if (docs.length !== 0 && docs[0].refVersion > (self._doc[schema.options.versionKey] || 0)) {
            const error = new VersionError({}, 0, []);
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
    const clone = {...this._doc}; // shallow clone

    delete clone._id;
    // Saves current document version, first time to 0
    clone.refVersion =
      typeof this._doc[schema.options.versionKey] === "undefined" ? 0 : this._doc[schema.options.versionKey] + 1; // we are in the prehook so need to increment
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

    schema.statics.VersionedModel.deleteOne(
      {
        refId: this._id,
      },
      function (err) {
        if (err) {
          debug(err);
        } else {
          debug("Removed versioned model from mongodb");
        }

        next();
      },
    );
  });
}
