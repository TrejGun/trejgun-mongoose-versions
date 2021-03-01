export default function (schema, options) {
  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      schema.set(key, options[key]);
    }
  }
}
