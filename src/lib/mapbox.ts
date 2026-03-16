export const MAPBOX_TOKEN = "sk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tdHAxYm1tMXgwbTJzcGxyMHh5dGM4diJ9.8AZ9Ve3HN66Za49JMby4-A";

export const MAPBOX_DARK_STYLE: mapboxgl.Style = {
  version: 8,
  name: "FiDriver Dark",
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};
