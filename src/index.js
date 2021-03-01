import saveCollection from "./save-collection";

export default function (schema, options) {
  if (typeof options === "string") {
    options = {
      collection: options,
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

  saveCollection(schema, options);
}
