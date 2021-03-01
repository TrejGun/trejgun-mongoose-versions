import assert from "assert";
import {Schema} from "mongoose";

import setSchemaOptions from "../src/set-schema-options";

describe("set-schema-options", function () {
  it("should set options for passed schema", function () {
    const testSchema = new Schema({
      name: String,
      date: Date,
    });

    setSchemaOptions(testSchema, {
      option: true,
    });

    assert.strictEqual(testSchema.get("option"), true);
  });

  it("should set do nothing if no option object was passed as argument", function () {
    const testSchema = new Schema({
      name: String,
      date: Date,
    });

    setSchemaOptions(testSchema);
  });
});
