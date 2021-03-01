module.exports = {
  reporter: "spec",
  require: "@babel/register",
  timeout: 10000,
  ui: "bdd",
  recursive: "./test/**/*.test.js",
};
