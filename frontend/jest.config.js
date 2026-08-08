module.exports = {
  // react-native 0.81 ships its own preset. The standalone @react-native/jest-preset
  // package has no 0.81.x release -- pinning it to 0.86 dragged in a react ^19.2.3
  // peer that conflicts with the react 19.1.0 this RN version requires.
  preset: 'react-native',
};
