import { useEffect, useRef } from "react";
import Head from "next/head";
import { _createCircle, _createMousePosition } from "../maps/help";
import { mapInit } from "../maps/map";

const MapComponent = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    mapInit();

    // const mapObj = new Map({
    //   view: new View({
    //     center: fromLonLat([126.972656, 37.5516258]),
    //     zoom: 16,
    //   }),
    //   layers: [
    //     new TileLayer({
    //       source: new XYZ({ url: "https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}", crossOrigin: "anonymous" }),
    //     }),
    //   ],
    //   target: mapRef.current,
    // });

    // const vectorSource = new VectorSource();
    // const vectorLayer = new VectorLayer({
    //   source: vectorSource,
    // });

    // const newMarkers = [{ lon: 126.972656, lat: 37.5516258, name: "Starbucks Dongja" }];

    // const markerStyle = new Style({
    //   image: new Icon({
    //     anchor: [0.5, 1],
    //     src: "https://openlayers.org/en/latest/examples/data/icon.png",
    //   }),
    // });

    // const newFeatures = newMarkers.map((marker) => {
    //   const point = new Point(fromLonLat([marker.lon, marker.lat]));
    //   const feature = new Feature({
    //     geometry: point,
    //     name: marker.name,
    //   });
    //   feature.setStyle(markerStyle);
    //   return feature;
    // });

    // mapObj.on("click", (evt) => {
    //   const feature = mapObj.forEachFeatureAtPixel(evt.pixel, (feature) => {
    //     return feature;
    //   });

    //   if (feature) {
    //     alert(feature.get("name"));
    //   }
    // });
    // mapObj.addLayer(vectorLayer);

    // vectorSource.addFeatures(newFeatures);

    // //mapObj.addLayer(vectorLayer);
    // mapObj.setTarget(mapRef.current);

    //return () => mapObj.setTarget("");

    // =====================================
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Maps</title>
      </Head>
      <div>
        <div style={{ width: "calc(100% - 300px)", float: "right" }}>
          <div id="map" className="map" ref={mapRef}>
            <div id="popupIcon" />
            <div id="popup" className="ol-popup">
              <a href="#" id="popup-closer" className="ol-popup-closer" />
              <div id="popup-content" />
            </div>
            <div id="info" />
          </div>
        </div>
        <div style={{ width: 300, float: "left", padding: 10 }}>
          <div>
            {/* Btn Control  */}
            <div>
              <div className="cls" />
              <button className="btn btn-outline-primary btn-sm" id="zoom-out">
                Zoom out
              </button>
              <button className="btn btn-outline-primary btn-sm" id="zoom-in">
                Zoom in
              </button>
              <div className="cls" />
              <button className="btn btn-primary btn-sm" id="goToLotte">
                GoTo Lotte
              </button>
              <button className="btn btn-primary btn-sm" id="goToMarriot">
                GoTo Marriot
              </button>
              <button className="btn btn-primary btn-sm" id="goToIcon">
                Go Icon
              </button>
              <div className="cls" />
              <button type="button" className="btn btn-success btn-sm btn-block" id="goToMulty">
                Go All
              </button>
            </div>
            {/* Filter */}
            <div className="cls">
              <hr />
              <div className="cls" />
              <button type="button" className="btn btn-primary btn-sm btn-block" id="goToFilterArea">
                Filter Area
              </button>
              <div className="cls" />
              <form>
                <div id="status">
                  <h4>Filter:</h4>
                  <span className="min-year" /> and <span className="max-year" />
                </div>
                <label htmlFor="min-year">Minimum year:</label>
                <input id="min-year" type="range" min={1850} max={2015} step={1} defaultValue={1850} />
                <label htmlFor="max-year">Maximum year:</label>
                <input id="max-year" type="range" min={1850} max={2015} step={1} defaultValue={2015} />
              </form>
            </div>
            {/* Cluster */}
            <div className="cls">
              <hr />
              <div className="cls" />
              <span className="head">Cluster Data,Group &amp; Zoom to Extent </span>
              <button type="button" className="btn btn-warning btn-sm btn-block" id="goToCluster">
                Go -&gt; Cluster
              </button>
            </div>
            {/* With Label */}
            <div class="cls">
              <hr />
              <span class="head">ROAD Map </span>
              <button type="button" class="btn btn-success btn-sm btn-block" id="goRoadMap">
                RoadMap Area
              </button>
              <div class="cls"></div>
            </div>

            {/* Info */}
            <div className="cls">
              <hr />
              <span style={{ fontWeight: "bold" }}>Cursor Location:</span>
              <span id="mouse-position"> </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapComponent;
