// Approximate [longitude, latitude] of the museums/collections where the
// artworks currently live. Used by the Artworks view to place a painting's
// thumbnail at its current location. Keys must match the `location` strings in
// the data files exactly. Works without a known location fall back to the
// painter's country of origin.
export const MUSEUM_COORDS = {
  "Art Institute of Chicago": [-87.6238, 41.8796],
  "Musée d'Orsay, Paris": [2.3266, 48.86],
  "Gallerie dell'Accademia, Venice": [12.3283, 45.4319],
  "Apostolic Palace, Vatican City": [12.4544, 41.9046],
  "Sistine Chapel, Vatican City": [12.4545, 41.9029],
  "Mauritshuis, The Hague": [4.3143, 52.0806],
  "National Gallery, London": [-0.1281, 51.5089],
  "National Gallery of Modern Art, New Delhi": [77.235, 28.611],
  "Musée Marmottan Monet, Paris": [2.2664, 48.8592],
  "Munch Museum, Oslo": [10.7565, 59.9048],
  "Hamburger Kunsthalle, Hamburg": [10.0007, 53.5553],
  "Wallace Collection, London": [-0.1526, 51.5175],
  "Uffizi Gallery, Florence": [11.2556, 43.7687],
};
