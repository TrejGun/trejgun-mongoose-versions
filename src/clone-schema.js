import defaultMongoose from "mongoose";

export default function (schema, mongoose = defaultMongoose) {
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
