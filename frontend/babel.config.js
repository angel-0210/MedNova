module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo already wraps @react-native/babel-preset internally.
    // Listing both here made two copies of babel-plugin-syntax-hermes-parser
    // fight over which one parses the file -- "More than one plugin attempted
    // to override parsing."
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
