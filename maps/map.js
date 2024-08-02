import monotoneChainConvexHull from "monotone-chain-convex-hull";
import { _createCircle, _createMousePosition } from "./help";
import { Map, View } from "ol";
import { OSM, XYZ, TileDebug, DataTile, TileWMS, StadiaMaps, OGCMapTile, Vector as VectorSource, Vector, Cluster } from "ol/source";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Icon, Style, Circle as CircleStyle, Fill, Stroke, Text } from "ol/style";
import { Vector as VectorLayer, Tile as TileLayer } from "ol/layer";
import { toStringHDMS } from "ol/coordinate";
import { defaults as defaultControls } from "ol/control";
import WebGLPointsLayer from "ol/layer/WebGLPoints";
import Overlay from "ol/Overlay";
import { LineString, Polygon } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { createEmpty, extend, getHeight, getWidth } from "ol/extent";

import {
  SCALE_UNIT,
  SCALE_DETAIL,
  DEBUG_MODE,
  CLICK_SHOW_POPUP,
  MARRIOT_LOC,
  METRI_PART_LOC,
  ICON_LOC,
  LOTTE_LOC,
  FILTER_LOC,
  CLUSTER_LOC,
} from "../config";

const mapInit = () => {
  const mousePositionControl = _createMousePosition(); // Mouse Position

  // #region Custom Circle Render
  const circleMarriotFeature = _createCircle(MARRIOT_LOC[0], MARRIOT_LOC[1], "20,45,220", 200);
  const circleMetriPartFeature = _createCircle(METRI_PART_LOC[0], METRI_PART_LOC[1], "225,0,0", 500);
  const circleLotteFeature = _createCircle(LOTTE_LOC[0], LOTTE_LOC[1], "0,0,0", 800);
  // #endregion

  // #region Elements that make up the popup.
  const container = document.getElementById("popup");
  const content = document.getElementById("popup-content");
  const closer = document.getElementById("popup-closer");

  // Create an overlay to anchor the popup to the map.
  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  });

  // Add a click handler to hide the popup.
  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };
  // #endregion

  // #region Icons
  const iconFeature = new Feature({
    geometry: new Point([ICON_LOC[0], ICON_LOC[1]]),
    name: "Nothing Here :D",
    population: 4000,
    rainfall: 500,
  });

  const iconStyle = new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: "fraction",
      anchorYUnits: "pixels",
      src: "icon.png",
    }),
  });

  iconFeature.setStyle(iconStyle);

  const iconVectorSource = new VectorSource({
    features: [iconFeature],
  });

  // #endregion

  // #region Filter
  const vectorSourceWebGL = new Vector({
    attributions: "NASA",
  });

  const oldColor = "#db3db7"; // "rgba(242,56,22,0.8)";
  const newColor = "green"; // "#ffe52c";
  const period = 10; // Animation period in seconds

  const animRatio = [
    "^",
    [
      "/",
      [
        "%",
        [
          "+",
          ["time"],
          ["interpolate", ["linear"], ["get", "year"], 1850, 0, 2015, period], //
        ],
        period,
      ],
      period,
    ],
    0.5,
  ];

  const filterStyle = {
    variables: {
      minYear: 1850,
      maxYear: 2015,
    },
    filter: ["between", ["get", "year"], ["var", "minYear"], ["var", "maxYear"]], //
    "circle-radius": [
      "*",
      ["interpolate", ["linear"], ["get", "mass"], 0, 4, 200000, 13], //
      ["-", 1.75, ["*", animRatio, 0.75]],
    ],
    "circle-fill-color": ["interpolate", ["linear"], animRatio, 0, newColor, 1, oldColor],
    "circle-opacity": ["-", 1.0, ["*", animRatio, 0.75]], //
  };

  // handle input values & events
  const minYearInput = document.getElementById("min-year");
  const maxYearInput = document.getElementById("max-year");

  function updateStatusText() {
    const div = document.getElementById("status");
    div.querySelector("span.min-year").textContent = minYearInput.value;
    div.querySelector("span.max-year").textContent = maxYearInput.value;
  }

  minYearInput.addEventListener("input", function () {
    filterStyle.variables.minYear = parseInt(minYearInput.value);
    updateStatusText();
  });
  maxYearInput.addEventListener("input", function () {
    filterStyle.variables.maxYear = parseInt(maxYearInput.value);
    updateStatusText();
  });
  updateStatusText();

  // load Filter Data;
  const client = new XMLHttpRequest();
  client.open("GET", "https://raw.githubusercontent.com/thanktu/thanktu.github.io/main/data/filter_data.csv");
  client.onload = function () {
    const csv = client.responseText;
    const features = [];

    let prevIndex = csv.indexOf("\n") + 1; // scan past the header line

    let curIndex;
    while ((curIndex = csv.indexOf("\n", prevIndex)) != -1) {
      const line = csv.substr(prevIndex, curIndex - prevIndex).split(",");

      prevIndex = curIndex + 1;

      const coords = fromLonLat([parseFloat(line[4]), parseFloat(line[3])]);
      if (isNaN(coords[0]) || isNaN(coords[1])) {
        continue;
      }

      features.push(
        new Feature({
          mass: parseFloat(line[1]) || 0,
          year: parseInt(line[2]) || 0,
          geometry: new Point(coords),
        })
      );
    }

    vectorSourceWebGL.addFeatures(features);
  };
  client.send();
  // #endregion

  // #region Cluster + Group + Zooms
  const circleDistanceMultiplier = 1;
  const circleFootSeparation = 28;
  const circleStartAngle = Math.PI / 2;

  const convexHullFill = new Fill({
    color: "rgba(85, 13, 0, 0.4)",
  });
  const convexHullStroke = new Stroke({
    color: "rgba(24, 85, 0, 1)",
    width: 1.5,
  });
  const outerCircleFill = new Fill({
    color: "rgba(85, 13, 102, 0.3)",
  });
  const innerCircleFill = new Fill({
    color: "rgba(85, 15, 0, 0.7)",
  });
  const textFill = new Fill({
    color: "#fff",
  });
  const textStroke = new Stroke({
    color: "rgba(0, 0, 0, 0.6)",
    width: 3,
  });
  const innerCircle = new CircleStyle({
    radius: 14,
    fill: innerCircleFill,
  });
  const outerCircle = new CircleStyle({
    radius: 20,
    fill: outerCircleFill,
  });
  const darkIcon = new Icon({
    src: "./emoticon-cool.svg",
  });
  const lightIcon = new Icon({
    src: "./emoticon-cool-outline.svg",
  });

  // Single feature style, users for clusters with 1 feature and cluster circles.
  // Kiểu tính năng đơn, người dùng cho các cụm có 1 tính năng và vòng tròn cụm
  function clusterMemberStyle(clusterMember) {
    return new Style({
      geometry: clusterMember.getGeometry(),
      image: clusterMember.get("LEISTUNG") > 5 ? darkIcon : lightIcon,
    });
  }

  let clickFeature, clickResolution;
  //  Style for clusters with features that are too close to each other, activated on click.
  // Kiểu cho các cụm có tính năng quá gần nhau, được kích hoạt khi nhấp chuột.
  function clusterCircleStyle(cluster, resolution) {
    if (cluster !== clickFeature || resolution !== clickResolution) {
      return null;
    }
    const clusterMembers = cluster.get("features");
    const centerCoordinates = cluster.getGeometry().getCoordinates();
    return generatePointsCircle(clusterMembers.length, cluster.getGeometry().getCoordinates(), resolution).reduce((styles, coordinates, i) => {
      const point = new Point(coordinates);
      const line = new LineString([centerCoordinates, coordinates]);
      styles.unshift(
        new Style({
          geometry: line,
          stroke: convexHullStroke,
        })
      );
      styles.push(
        clusterMemberStyle(
          new Feature({
            ...clusterMembers[i].getProperties(),
            geometry: point,
          })
        )
      );
      return styles;
    }, []);
  }

  // https://github.com/Leaflet/Leaflet.markercluster/blob/31360f2/src/MarkerCluster.Spiderfier.js#L55-L72
  // Arranges points in a circle around the cluster center, with a line pointing from the center to each point.
  // Sắp xếp các điểm thành một vòng tròn quanh tâm cụm, với một đường thẳng hướng từ tâm đến mỗi điểm.
  function generatePointsCircle(count, clusterCenter, resolution) {
    const circumference = circleDistanceMultiplier * circleFootSeparation * (2 + count);
    let legLength = circumference / (Math.PI * 2); //radius from circumference
    const angleStep = (Math.PI * 2) / count;
    const res = [];
    let angle;

    legLength = Math.max(legLength, 35) * resolution; // Minimum distance to get outside the cluster icon.

    for (let i = 0; i < count; ++i) {
      // Clockwise, like spiral.
      angle = circleStartAngle + i * angleStep;
      res.push([clusterCenter[0] + legLength * Math.cos(angle), clusterCenter[1] + legLength * Math.sin(angle)]);
    }

    return res;
  }

  let hoverFeature;
  // Style for convex hulls of clusters, activated on hover.
  // Kiểu cho các thân lồi của cụm, được kích hoạt khi di chuột.
  function clusterHullStyle(cluster) {
    if (cluster !== hoverFeature) {
      return null;
    }
    const originalFeatures = cluster.get("features");
    const points = originalFeatures.map((feature) => feature.getGeometry().getCoordinates());
    return new Style({
      geometry: new Polygon([monotoneChainConvexHull(points)]),
      fill: convexHullFill,
      stroke: convexHullStroke,
    });
  }

  function clusterStyle(feature) {
    const size = feature.get("features").length;
    if (size > 1) {
      return [
        new Style({
          image: outerCircle,
        }),
        new Style({
          image: innerCircle,
          text: new Text({
            text: size.toString(),
            fill: textFill,
            stroke: textStroke,
          }),
        }),
      ];
    }
    const originalFeature = feature.get("features")[0];
    return clusterMemberStyle(originalFeature);
  }

  const vectorSource = new VectorSource({
    format: new GeoJSON(),
    url: "https://raw.githubusercontent.com/thanktu/thanktu.github.io/main/data/dynamic_cluster.json",
  });

  const clusterSource = new Cluster({
    attributions: 'Data: <a href="https://www.data.gv.at/auftritte/?organisation=stadt-wien">Stadt Wien</a>',
    distance: 35,
    source: vectorSource,
  });

  // Layer displaying the convex hull of the hovered cluster.
  const clusterHulls = new VectorLayer({
    source: clusterSource,
    style: clusterHullStyle,
  });

  // Layer displaying the clusters and individual features.
  const clusters = new VectorLayer({
    source: clusterSource,
    style: clusterStyle,
  });

  // Layer displaying the expanded view of overlapping cluster members.
  const clusterCircles = new VectorLayer({
    source: clusterSource,
    style: clusterCircleStyle,
  });
  // #endregion

  // ================================== MAP  ==================================
  const map = new Map({
    target: "map",
    controls: defaultControls().extend([mousePositionControl]),
    overlays: [overlay],
    layers: [
      // type layer: image -> use default from OpenStreetMap

      // new TileLayer({
      //   source: new OSM(),
      //   visible: true,
      //   preload: Infinity, //  preload: 0, // default value || Infinity
      // }),

      new TileLayer({
        source: new XYZ({
          url: "https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
          crossOrigin: "anonymous",
        }),
      }),

      new VectorLayer({
        source: new VectorSource({
          features: [circleMarriotFeature],
        }),
      }),
      new VectorLayer({
        source: new VectorSource({
          features: [circleMetriPartFeature],
        }),
      }),
      new VectorLayer({
        source: new VectorSource({
          features: [circleLotteFeature],
        }),
      }),

      // Icon GG_Map
      new VectorLayer({
        source: iconVectorSource,
      }),

      // Filter Layer
      new WebGLPointsLayer({
        style: filterStyle,
        source: vectorSourceWebGL,
        disableHitDetection: false,
      }),

      // Cluster
      clusterHulls, // Line scope
      clusters,
      clusterCircles,

      // Layer Debug
      ...(DEBUG_MODE
        ? [
            new TileLayer({
              source: new TileDebug(),
            }),
          ]
        : []),
    ],

    view: new View({
      center: [0, 0], // --> Default
      zoom: 2,
      maxZoom: 21,
    }),
  });

  // ================================= Handle =================================
  // #region Zoom In, Zoom Out
  document.getElementById("zoom-out").onclick = function () {
    const view = map.getView();
    const zoom = view.getZoom();
    view.setZoom(zoom - SCALE_UNIT);
  };

  document.getElementById("zoom-in").onclick = function () {
    const view = map.getView();
    const zoom = view.getZoom();
    view.setZoom(zoom + SCALE_UNIT);
  };
  // #endregion

  // #region Icon vs Popup info
  const elementPopupIcon = document.getElementById("popupIcon");

  const popupIcon = new Overlay({
    element: elementPopupIcon,
    positioning: "bottom-center",
    stopEvent: false,
  });
  map.addOverlay(popupIcon);

  let popoverIcon;
  function disposePopover() {
    if (popoverIcon) {
      popoverIcon.dispose();
      popoverIcon = undefined;
    }
  }

  // Close the popup when the map is moved
  map.on("movestart", disposePopover);
  // #endregion

  // #region Animation
  function onClick(id, callback) {
    document.getElementById(id).addEventListener("click", callback);
  }

  function flyTo(location, scale = SCALE_DETAIL, done) {
    const view = map.getView();
    view.setZoom(scale);

    const duration = 2000;
    const zoom = view.getZoom();
    let parts = 2;
    let called = false;
    function callback(complete) {
      --parts;
      if (called) {
        return;
      }
      if (parts === 0 || !complete) {
        called = true;
        done(complete);
      }
    }
    view.animate(
      {
        center: location,
        duration: duration,
      },
      callback
    );
    view.animate(
      {
        zoom: zoom - 1,
        duration: duration / 2,
      },
      {
        zoom: zoom,
        duration: duration / 2,
      },
      callback
    );
  }

  onClick("goToLotte", () => flyTo(LOTTE_LOC, SCALE_DETAIL, function () {}));
  onClick("goToMarriot", () => flyTo(MARRIOT_LOC, SCALE_DETAIL, function () {}));
  onClick("goToIcon", () => flyTo(ICON_LOC, SCALE_DETAIL, function () {}));
  onClick("goToFilterArea", () => flyTo(FILTER_LOC, 2, function () {}));
  onClick("goToCluster", () => flyTo(CLUSTER_LOC, 11, function () {}));

  onClick("goToMulty", () => {
    const view = map.getView();
    view.setZoom(SCALE_DETAIL);

    const locations = [LOTTE_LOC, MARRIOT_LOC, ICON_LOC, LOTTE_LOC, MARRIOT_LOC, ICON_LOC];
    let index = -1;
    function next(more) {
      if (more) {
        ++index;
        if (index < locations.length) {
          const delay = index === 0 ? 0 : 750;
          setTimeout(function () {
            flyTo(locations[index], SCALE_DETAIL, next);
          }, delay);
        } else {
          alert("Complete :v");
        }
      } else {
        alert("Cancelled");
      }
    }
    next(true);
  });
  // #endregion

  // #region Animate the map
  function animate() {
    map.render();
    window.requestAnimationFrame(animate);
  }
  animate();
  // #endregion

  // #region - Event
  const info = document.getElementById("info");
  info.style.pointerEvents = "none";
  const tooltip = new bootstrap.Tooltip(info, {
    animation: false,
    customClass: "pe-none",
    offset: [0, 5],
    title: "-",
    trigger: "manual",
  });

  let currentFeature;
  const displayFeatureInfo = function (pixel, target) {
    const feature = target.closest(".ol-control")
      ? undefined
      : map.forEachFeatureAtPixel(pixel, function (feature) {
          return feature;
        });
    if (feature) {
      info.style.left = pixel[0] + "px";
      info.style.top = pixel[1] + "px";
      if (feature !== currentFeature) {
        tooltip.setContent({ ".tooltip-inner": feature.get("name") });
      }
      if (currentFeature) {
        //tooltip.update();
      } else {
        /// tooltip.show();
      }
    } else {
      //tooltip.hide();
    }
    currentFeature = feature;
  };

  map.on("pointermove", (event) => {
    // ========================== Cluster ==========================
    clusters.getFeatures(event.pixel).then((features) => {
      if (features[0] !== hoverFeature) {
        // Display the convex hull on hover.
        hoverFeature = features[0];
        clusterHulls.setStyle(clusterHullStyle);
        // Change the cursor style to indicate that the cluster is clickable.
        map.getTargetElement().style.cursor = hoverFeature && hoverFeature.get("features").length > 1 ? "pointer" : "";
      }
    });

    // ========================== Change mouse cursor when over marker ==========================
    const pixel = map.getEventPixel(event.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);
    map.getTargetElement().style.cursor = hit ? "pointer" : "";

    // ========================== xxxxxx ==========================
    if (event.dragging) {
      // tooltip.hide();
      currentFeature = undefined;
      return;
    }
    displayFeatureInfo(pixel, event.originalEvent.target);
  });

  map.on("click", (event) => {
    // ===================== Cluster handle when click =====================
    clusters.getFeatures(event.pixel).then((features) => {
      if (features.length > 0) {
        const clusterMembers = features[0].get("features");
        if (clusterMembers.length > 1) {
          // Calculate the extent of the cluster members.
          const extent = createEmpty();
          clusterMembers.forEach((feature) => extend(extent, feature.getGeometry().getExtent()));
          const view = map.getView();
          const resolution = map.getView().getResolution();
          if (view.getZoom() === view.getMaxZoom() || (getWidth(extent) < resolution && getHeight(extent) < resolution)) {
            // Show an expanded view of the cluster members.
            clickFeature = features[0];
            clickResolution = resolution;
            clusterCircles.setStyle(clusterCircleStyle);
          } else {
            // Zoom to the extent of the cluster members.
            view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
          }
        }
      }
    });

    // ===================== Display Popup when Click =====================
    const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
      return feature;
    });
    disposePopover();
    if (!feature) return;

    popupIcon.setPosition(event.coordinate);
    popoverIcon = new bootstrap.Popover(elementPopupIcon, {
      placement: "top",
      html: true,
      content: feature.get("name"),
    });
    popoverIcon.show();

    // ========================== xxxxxx ==========================
    displayFeatureInfo(event.pixel, event.originalEvent.target);
  });

  map.on("singleclick", function (event) {
    // =========================== Popup Localtion =========================
    if (!CLICK_SHOW_POPUP) return;
    const coordinate = event.coordinate;
    const hdms = toStringHDMS(toLonLat(coordinate));
    content.innerHTML = `
      <p style="font-weight: 700">
        Click Location:
      </p>
      <code> ${hdms}</code>
      <code> Latitude: ${JSON.stringify(coordinate[0])}</code>
      <code> Longitude: ${JSON.stringify(coordinate[1])}</code>
    `;
    overlay.setPosition(coordinate);
  });

  map.getTargetElement().addEventListener("pointerleave", function () {
    tooltip.hide();
    currentFeature = undefined;
  });
  // #endregion

  return map;
};

export { mapInit };
