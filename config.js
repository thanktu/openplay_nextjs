import KML from "ol/format/KML.js";
import { fromLonLat, toLonLat } from "ol/proj";

const SCALE_UNIT = 1;
const SCALE_DETAIL = 16; // Level scale detail
const DEBUG_MODE = false;
const CLICK_SHOW_POPUP = true;
const MAP_TILER_KEY = "17YhaUehJVmGcqQaZ2up"; // "https://api.maptiler.com/maps/basic-v2/?key=17YhaUehJVmGcqQaZ2up#1.0/0.00000/0.00000";

const MARRIOT_LOC = fromLonLat([105.783089061, 21.007448175]);
const METRI_PART_LOC = fromLonLat([105.77148046, 21.007552187]);
const ICON_LOC = fromLonLat([105.794633289, 21.00786928]);
const LOTTE_LOC = fromLonLat([105.813080887, 21.076551416]);
const FILTER_LOC = fromLonLat([105.735447973, 21.057766731]); // Area Show Data to Filter
const CLUSTER_LOC = fromLonLat([16.340115111, 48.232346294]);

export {
  SCALE_UNIT,
  SCALE_DETAIL,
  DEBUG_MODE,
  CLICK_SHOW_POPUP,
  //
  MAP_TILER_KEY,
  //
  MARRIOT_LOC,
  METRI_PART_LOC,
  ICON_LOC,
  LOTTE_LOC,
  FILTER_LOC,
  CLUSTER_LOC,
};
