import Feature from "ol/Feature";
import { Circle } from "ol/geom";
import { Style } from "ol/style";
import { MousePosition } from "ol/control";
import { createStringXY } from "ol/coordinate";

// Create Circle Custom Func
function _createCircle(lat, lon, rgbStr = "225,0,0", width = 200) {
  let circleRes = new Feature({
    geometry: new Circle([lat, lon], width),
  });
  circleRes.setStyle(
    new Style({
      renderer(coordinates, state) {
        const [[x, y], [x1, y1]] = coordinates;
        const ctx = state.context;
        const dx = x1 - x;
        const dy = y1 - y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        const innerRadius = 0;
        const outerRadius = radius * 1.5;

        const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, `rgba(${rgbStr},0)`);
        gradient.addColorStop(0.5, `rgba(${rgbStr},0.2)`);
        gradient.addColorStop(1, `rgba(${rgbStr},0.8)`);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.strokeStyle = `rgba(${rgbStr},1)`;
        ctx.stroke();
      },
    })
  );

  return circleRes;
}

function _createMousePosition() {
  return new MousePosition({
    coordinateFormat: createStringXY(9),
    projection: "EPSG:4326", // EPSG:4326 vs EPSG:3857
    className: "custom-mouse-position",
    target: document.getElementById("mouse-position"),
  });
}

export {
  //
  _createCircle,
  _createMousePosition,
};
