import assert from "assert";
import {Schema} from "mongoose";

import mongotest from "./mongotest";
import version from "../../src";

describe("version", function () {
  beforeEach(mongotest.prepareDb("mongodb://localhost/mongoose_version_tests"));
  afterEach(mongotest.disconnect());

  describe("#VersionModel", function () {
    it("should expose a version model in the original schema", function () {
      const testSchema = new Schema();

      testSchema.plugin(version, {
        collection: "should_expose_version_model_versions",
      });

      const Test = mongotest.connection.model("should_expose_version_model", testSchema);

      assert.ok(Test.VersionedModel);
    });
  });

  it("should save a version model when saving origin model", function () {
    const testSchema = new Schema({
      name: String,
    });

    testSchema.plugin(version, {
      collection: "should_save_version_of_origin_model_versions",
    });

    const Test = mongotest.connection.model("should_save_version_of_origin_model", testSchema);

    const test = new Test({
      name: "franz",
    });

    return test.save().then(() => {
      return Test.VersionedModel.findOne({
        refId: test._id,
        refVersion: test.__v,
      }).then(versionedModel => {
        assert.ok(versionedModel);
        assert.strictEqual(versionedModel.name, "franz");
        assert.strictEqual(versionedModel.__v, 0);
      });
    });
  });

  it("should NOT save a version model when saving origin model fails", function () {
    const testSchema = new Schema({
      name: String,
    });

    testSchema.plugin(version, {
      collection: "should_save_version_of_origin_model_versions",
      suppressVersionIncrement: false, // let's increment the version on updates
    });

    const Test = mongotest.connection.model("should_save_version_of_origin_model", testSchema);

    const test = new Test({
      name: "franz",
    });

    return test
      .save()
      .then(doc => {
        assert.strictEqual(doc.__v, 0);
      })
      .then(() => {
        return Test.VersionedModel.find({
          refId: test._id,
        }).then(function (versionedModels) {
          assert.strictEqual(versionedModels.length, 1);
          assert.ok(versionedModels[0]);
          assert.strictEqual(versionedModels[0].name, "franz");
          assert.strictEqual(versionedModels[0].refVersion, 0);
        });
      })
      .then(() => {
        test.name = "Franz I";
        test.__v = 0;
        return test.save().then(doc => {
          assert.strictEqual(doc.__v, 1);
        });
      })
      .then(() => {
        return Test.VersionedModel.find({
          refId: test._id,
        }).then(versionedModels => {
          assert.strictEqual(versionedModels.length, 2);
          assert.ok(versionedModels[0]);
          assert.strictEqual(versionedModels[0].name, "franz");
          assert.strictEqual(versionedModels[0].refVersion, 0);
          assert.ok(versionedModels[1]);
          assert.strictEqual(versionedModels[1].name, "Franz I");
          assert.strictEqual(versionedModels[1].refVersion, 1);
        });
      })
      .then(() => {
        test.name = "Franz Invalid";
        test.__v = 0; // create a version conflict
        return test
          .save()
          .then(assert.ifError) // should not happen
          .catch(err => {
            assert.strictEqual(err.name, "VersionError");
          });
      })
      .then(() => {
        return Test.VersionedModel.find({
          refId: test._id,
        }).then(versionedModels => {
          assert.strictEqual(versionedModels.length, 2);
        });
      });
  });

  it("should save the correct version, defined at the versionKey of the origin model", function () {
    const testSchema = new Schema(
      {
        name: String,
      },
      {
        versionKey: "__version", // define a custom one
      },
    );

    testSchema.plugin(version, {
      collection: "should_save_version_of_origin_model_versions",
      suppressVersionIncrement: false, // let's increment the version on updates
    });

    const Test = mongotest.connection.model("should_save_version_of_origin_model", testSchema);

    const test = new Test({
      name: "franz",
    });

    return test
      .save()
      .then(() => {
        assert.strictEqual(test.__version, 0);

        return Test.VersionedModel.findOne({
          refId: test._id,
          refVersion: test.__version,
        });
      })
      .then(versionedModel => {
        assert.ok(versionedModel);
        assert.strictEqual(versionedModel.name, "franz");
        assert.strictEqual(versionedModel.refVersion, 0);

        test.name = "Franz I";
        return test.save();
      })
      .then(() => {
        assert.strictEqual(test.name, "Franz I");
        assert.strictEqual(test.__version, 1);

        return Test.VersionedModel.findOne({
          refId: test._id,
          refVersion: test.__version,
        });
      })
      .then(updatedVersionedModel => {
        assert.ok(updatedVersionedModel);
        assert.strictEqual(updatedVersionedModel.name, "Franz I");
        assert.strictEqual(updatedVersionedModel.refVersion, 1);

        test.name = "Franz II";
        return test.save();
      })
      .then(() => {
        assert.strictEqual(test.name, "Franz II");
        assert.strictEqual(test.__version, 2);

        return Test.VersionedModel.findOne({
          refId: test._id,
          refVersion: test.__version,
        });
      })
      .then(updatedVersionedModel => {
        assert.ok(updatedVersionedModel);
        assert.strictEqual(updatedVersionedModel.name, "Franz II");
        assert.strictEqual(updatedVersionedModel.refVersion, 2);
      });
  });

  it("should accept options as string", function () {
    const testSchema = new Schema({
      name: String,
    });

    testSchema.plugin(version, "should_accept_string");

    const Test = mongotest.connection.model("should_accept_string_origin_model", testSchema);

    assert.strictEqual(Test.VersionedModel.collection.name, "should_accept_string");
  });

  it("should save a version model in a collection when using `collection` strategy", function () {
    const testSchema = new Schema({
      name: String,
      desc: String,
    });

    testSchema.plugin(version, {
      strategy: "collection",
      collection: "should_save_version_in_collection",
    });

    const Test = mongotest.connection.model("should_save_version_in_collection_origin_model", testSchema);

    const test = new Test({
      name: "franz",
    });

    return test.save().then(() => {
      return Test.VersionedModel.find({
        refId: test._id,
      }).then(versionedModels => {
        assert.ok(versionedModels);

        assert.strictEqual(versionedModels.length, 1);

        test.desc = "A lunar crater";
        return test.save().then(() => {
          return Test.VersionedModel.find({
            refId: test._id,
          }).then(versionedModels => {
            assert.ok(versionedModels);
            assert.ok(versionedModels.length, 2);
            // One of them should have the new property
            assert.strictEqual(
              versionedModels.filter(function (m) {
                return m.desc === "A lunar crater";
              }).length,
              1,
            );
          });
        });
      });
    });
  });
});
