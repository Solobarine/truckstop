import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";

import type { Segment } from "../types";
import { useState } from "react";
import "leaflet/dist/leaflet.css";

interface RouteProps {
  coordinates: [number, number][];
  segments: Segment[];
  closeMap: () => void;
}

const Map = ({ coordinates, segments, closeMap }: RouteProps) => {
  const path: LatLngExpression[] = [];
  const [showDirection, setShowDirection] = useState(false);

  segments.forEach((segment) => {
    segment.steps.forEach((step) => {
      const [start, end] = step.way_points;
      const sliced = coordinates.slice(start, end + 1);
      sliced.forEach(([lon, lat]) => path.push([lat, lon]));
    });
  });

  const mapCenter = Math.round(path.length / 2) - 1;
  return (
    <div className="fixed bg-white min-h-svh z-20 top-0 right-0 w-full max-w-xl overflow-hidden">
      <button
        className="absolute z-30 top-1 right-1 text-xl w-8 aspect-square text-neutral-100 rounded-md bg-red-500"
        onClick={closeMap}
      >
        &times;
      </button>
      {!showDirection && (
        <button
          className="absolute bg-green-500 px-6 py-3 rounded-md bottom-2 left-1/2 -translate-x-1/2 z-30"
          onClick={() => setShowDirection(true)}
        >
          Show Directions
        </button>
      )}
      <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
        <MapContainer
          center={path[mapCenter]}
          zoom={7}
          className="h-svh w-full rounded-lg z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={path} color="blue" />
          <Marker position={path[0]}>
            <Popup>Start</Popup>
          </Marker>
          <Marker position={path[path.length - 1]}>
            <Popup>End</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div
        className={`absolute rounded-xl w-full right-0 bg-white shadow-md border border-gray-200 h-1/2 overflow-x-auto ${
          showDirection ? "bottom-4 z-50" : "-bottom-1/2 -z-10"
        }`}
      >
        <div className="sticky bg-white top-0 px-6 py-5 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Directions</h3>
          <button
            className="px-4 py-1.5 text-neutral-800 rounded-md bg-neutral-200"
            onClick={() => setShowDirection(false)}
          >
            Hide Directions
          </button>
        </div>
        <div className="space-y-6 px-6 pb-6">
          {segments.map((segment) =>
            segment.steps.map((step, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm"
              >
                <p className="text-base text-gray-700 font-medium">
                  {step.instruction}
                </p>
                <p className="text-sm text-gray-500 italic">{step.name}</p>
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold">
                      {(step.distance / 1609.34).toFixed(3)}
                    </span>{" "}
                    miles
                  </p>
                  <p>
                    <span className="font-semibold">
                      {(step.duration / 60 / 60).toFixed(2)}
                    </span>{" "}
                    hrs
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
