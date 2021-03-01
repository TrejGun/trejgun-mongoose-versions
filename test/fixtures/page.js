import {Schema} from "mongoose";
import textSearch from "mongoose-text-search";

import version from "../../src";

const Page = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  tags: [String],

  attachments: [String],
  images: [String],
  modifiedBy: String,
  lastModified: Date,
  created: Date,
  deleted: {
    type: Boolean,
    default: false,
  },
});

Page.plugin(version, {
  documentProperty: "title",
  logError: true,
});

Page.plugin(textSearch);

Page.index({
  deleted: 1,
});

Page.index(
  {
    title: "text",
    content: "text",
    tags: "text",
  },
  {
    title: "page_contents",
    weights: {
      title: 5,
      content: 1,
      tags: 3,
    },
  },
);

export default function (connection) {
  return connection.model("schemausingtextsearchplugin", Page);
}
