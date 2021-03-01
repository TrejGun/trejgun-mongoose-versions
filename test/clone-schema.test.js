import {Schema} from "mongoose";
import assert from "assert";

import cloneSchema from "../src/clone-schema";

const selectPaths = function (schema) {
  const paths = [];
  schema.eachPath(function (key, path) {
    paths.push(path);
  });
  return paths;
};

describe("clone-schema", function () {
  it("should clone schema", function () {
    const testSchema = new Schema({
      name: String,
      date: Date,
    });
    const cloned = cloneSchema(testSchema);

    assert.ok(cloned);
  });

  it("should clone all schema path", function () {
    const testSchema = new Schema({
      name: String,
      date: Date,
    });
    const cloned = cloneSchema(testSchema);
    const paths = selectPaths(cloned);

    assert.strictEqual(paths.length, 3); // 2 fields plus _id
  });

  it("should clone all schema path with correct data types", function () {
    const testSchema = new Schema({
      string: String,
      number: Number,
      date: Date,
      buffer: Buffer,
      boolean: Boolean,
      array: Array,
      map: Map,
      mixed: Schema.Types.Mixed,
      objectId: Schema.Types.ObjectId,
      decimal128: Schema.Types.Decimal128,
    });

    const cloned = cloneSchema(testSchema);

    assert.strictEqual(cloned.path("string").options.type, String);
    assert.strictEqual(cloned.path("number").options.type, Number);
    assert.strictEqual(cloned.path("date").options.type, Date);
    assert.strictEqual(cloned.path("buffer").options.type, Buffer);
    assert.strictEqual(cloned.path("boolean").options.type, Boolean);
    assert.strictEqual(cloned.path("array").options.type, Array);
    assert.strictEqual(cloned.path("map").options.type, Map);
    assert.strictEqual(cloned.path("mixed").options.type, Schema.Types.Mixed);
    assert.strictEqual(cloned.path("objectId").options.type, Schema.Types.ObjectId);
    assert.strictEqual(cloned.path("decimal128").options.type, Schema.Types.Decimal128);
  });

  it("should clone all schema path with build-in validators", function () {
    const validators = {
      required: [true, "valueMissing"],
      match: [/^[a-z0-9-]$/i, "patternMismatch"],
      enum: {
        values: ["a", "b", "c"],
        message: "badInput",
      },
      min: [1, "rangeUnderflow"],
      max: [100, "rangeOverflow"],
    };

    const testSchema = new Schema({
      required: {
        type: String,
        required: validators.required,
      },
      match: {
        type: String,
        match: validators.match,
      },
      enum: {
        type: String,
        enum: validators.enum,
      },
      min: {
        type: Number,
        min: validators.min,
      },
      max: {
        type: Number,
        max: validators.max,
      },
    });
    const cloned = cloneSchema(testSchema);

    assert.deepStrictEqual(cloned.path("required").options.required, validators.required);
    assert.strictEqual(cloned.path("required").validators.length, 1);
    assert.deepStrictEqual(cloned.path("match").options.match, validators.match);
    assert.strictEqual(cloned.path("match").validators.length, 1);
    assert.deepStrictEqual(cloned.path("enum").options.enum, validators.enum);
    assert.strictEqual(cloned.path("enum").validators.length, 1);
    assert.deepStrictEqual(cloned.path("min").options.min, validators.min);
    assert.strictEqual(cloned.path("min").validators.length, 1);
    assert.deepStrictEqual(cloned.path("max").options.max, validators.max);
    assert.strictEqual(cloned.path("max").validators.length, 1);
  });

  it("should clone all schema path with custom validators", function () {
    const single = val => val;
    const multiple = [
      {
        validator: single,
        msg: "badInput",
      },
    ];

    const testSchema = new Schema({
      single: {
        type: String,
        validate: single,
      },
      multiple: {
        type: String,
        validate: multiple,
      },
    });
    const cloned = cloneSchema(testSchema);

    assert.strictEqual(cloned.path("single").options.validate, single);
    assert.strictEqual(cloned.path("single").validators.length, 1);
    assert.deepStrictEqual(cloned.path("multiple").options.validate, multiple);
    assert.strictEqual(cloned.path("multiple").validators.length, 1);
  });

  it("should clone all schema path with multiple validators", function () {
    const validators = {
      required: [() => true, "valueMissing"],
      custom: val => val,
    };

    const testSchema = new Schema({
      number: {
        type: String,
        required: validators.required,
        validate: validators.custom,
      },
    });
    const cloned = cloneSchema(testSchema);

    assert.deepStrictEqual(cloned.path("number").options.required, validators.required);
    assert.strictEqual(cloned.path("number").options.validate, validators.custom);
    assert.strictEqual(cloned.path("number").validators.length, 2);
  });
});
