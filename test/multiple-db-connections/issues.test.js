import assert from "assert";
import {Schema} from "mongoose";

import mongotest from "./mongotest";
import version from "../../src";
import pageModel from "../fixtures/page";

describe("issues", function () {
  beforeEach(mongotest.prepareDb("mongodb://localhost/mongoose_version_issues_tests"));
  afterEach(mongotest.disconnect());

  it("should play nice with text search plugin", function () {
    const Page = pageModel(mongotest.connection);
    const page = new Page({
      title: "Title",
      content: "content",
      path: "/path",
    });

    return page.save().then(() => {
      return Page.VersionedModel.findOne({
        refId: page._id,
      }).then(versionedModel => {
        assert.ok(versionedModel);
      });
    });
  });

  it("should allow to create an empty versioned model", function () {
    const UserSchema = new Schema({});

    UserSchema.plugin(version, {
      logError: true,
      collection: "userVersions",
    });

    const User = mongotest.connection.model("User", UserSchema);

    const user = new User({});

    return user.save().then(() => {
      return User.VersionedModel.find({}).then(models => {
        assert.ok(models.length);
      });
    });
  });

  it("should delete versioned model when deleting the model", function () {
    const UserSchema = new Schema({});

    UserSchema.plugin(version, {
      logError: true,
      removeVersions: true,
      collection: "User_should_be_deleted_when_model_is_deleted_versions",
    });

    const User = mongotest.connection.model("User_should_be_deleted_when_model_is_deleted", UserSchema);

    const user = new User({});

    return user.save().then(() => {
      return user.remove().then(() => {
        return User.VersionedModel.find({}).then(models => {
          assert.ok(!models.length);
        });
      });
    });
  });

  it("should delete versioned model when deleting the model in collection mode", function () {
    const UserSchema = new Schema({});

    UserSchema.plugin(version, {
      logError: true,
      removeVersions: true,
      collection: "User_should_be_deleted_when_model_is_deleted_in_collection_mode_versions",
      strategy: "collection",
    });

    const User = mongotest.connection.model(
      "User_should_be_deleted_when_model_is_in_collection_mode_deleted",
      UserSchema,
    );

    const user = new User({});

    return user.save().then(() => {
      return user.remove().then(() => {
        return User.VersionedModel.find({}).then(models => {
          assert.ok(!models.length);
        });
      });
    });
  });

  it("should ignore unique indexes in cloned model", function () {
    const UserSchema = new Schema({
      module: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      slug: {
        type: String,
        required: true,
      },
    });

    UserSchema.index(
      {
        module: 1,
        slug: 1,
      },
      {
        unique: true,
      },
    );

    UserSchema.plugin(version, {
      logError: true,
      collection: "User_should_ignore_indexes_in_cloned_model_versions",
    });

    const User = mongotest.connection.model("User_should_ignore_indexes_in_cloned_model", UserSchema);

    const user = new User({
      module: "538c5caa4f019dd4225fe4f7",
      slug: "test-module",
    });

    return user.save().then(() => {
      return user.remove().then(() => {
        const user = new User({
          module: "538c5caa4f019dd4225fe4f7",
          slug: "test-module",
        });
        return user.save().then(user => {
          return User.VersionedModel.findOne({
            refId: user._id,
          }).then(model => {
            assert.ok(model);
          });
        });
      });
    });
  });

  it("should not break when using the plugin with collection strategy #10", function () {
    const schema = new Schema({
      title: {
        type: String,
        required: true,
        trim: true,
      },
      content: {
        type: String,
        trim: true,
      },
    });

    schema.plugin(version, {
      collection: "PageVersionsCollectionIssue10",
    });

    const model = mongotest.connection.model("PageIssue10CollectionStrategy", schema);
    assert.ok(model);
  });
});
