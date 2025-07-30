import type React from "react";
import { useState } from "react";
import ELDLogs from "./components/eld";
import Map from "./components/map";
import type { FormData, TripResult } from "./types";

const App = () => {
  const [form, setForm] = useState<FormData>({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    cycle_hours_used: "",
  });

  const BACKEND_API = import.meta.env.VITE_BACKEND_URI;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>(
    {}
  );
  const [showMap, setShowMap] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!form.current_location.trim()) {
      errors.current_location = "Current location is required";
    }

    if (!form.pickup_location.trim()) {
      errors.pickup_location = "Pickup location is required";
    }

    if (!form.dropoff_location.trim()) {
      errors.dropoff_location = "Dropoff location is required";
    }

    if (!form.cycle_hours_used.trim()) {
      errors.cycle_hours_used = "Current cycle hours is required";
    } else {
      const hours = Number.parseInt(form.cycle_hours_used);
      if (isNaN(hours) || hours < 0 || hours > 70) {
        errors.cycle_hours_used = "Cycle hours must be between 0 and 70";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_API}/plan/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          cycle_hours_used: Number.parseInt(form.cycle_hours_used),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setResult(data);
    } catch (err) {
      console.error("Trip planning error:", err);
      setError(
        "Failed to plan trip. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-4 sm:px-20 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚛 Trip Planner
        </h1>
        <p className="text-gray-600">
          Plan your route and manage ELD compliance
        </p>
      </div>

      {/* Trip Details Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            🗺️ Trip Details
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter your trip information to get route planning and ELD log
            management
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="current_location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Location
                </label>
                <input
                  id="current_location"
                  name="current_location"
                  type="text"
                  placeholder="Enter current location"
                  value={form.current_location}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.current_location
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.current_location && (
                  <p className="text-sm text-red-500">
                    {validationErrors.current_location}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="pickup_location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Pickup Location
                </label>
                <input
                  id="pickup_location"
                  name="pickup_location"
                  type="text"
                  placeholder="Enter pickup location"
                  value={form.pickup_location}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.pickup_location
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.pickup_location && (
                  <p className="text-sm text-red-500">
                    {validationErrors.pickup_location}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dropoff_location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dropoff Location
                </label>
                <input
                  id="dropoff_location"
                  name="dropoff_location"
                  type="text"
                  placeholder="Enter dropoff location"
                  value={form.dropoff_location}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.dropoff_location
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.dropoff_location && (
                  <p className="text-sm text-red-500">
                    {validationErrors.dropoff_location}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cycle_hours_used"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Cycle Hours Used
                </label>
                <input
                  id="cycle_hours_used"
                  name="cycle_hours_used"
                  type="number"
                  min="0"
                  max="70"
                  placeholder="Enter hours (0-70)"
                  value={form.cycle_hours_used}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.cycle_hours_used
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.cycle_hours_used && (
                  <p className="text-sm text-red-500">
                    {validationErrors.cycle_hours_used}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Planning Trip...
                </>
              ) : (
                <>📍 Plan Trip</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Route Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                🗺️ Route Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl">📍</div>
                  <div>
                    <p className="text-sm text-gray-600">Total Distance</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {Math.round(result.route.distance_miles * 1000) / 1000}{" "}
                      miles
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl">⏱️</div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Duration</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {result.route.duration_hours} hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowMap(!showMap)}
            className="w-full sm:w-auto px-8 py-5 text-xl font-extrabold bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition duration-300 block mx-auto"
          >
            {showMap ? "Hide Map" : "Display Map"}
          </button>

          {/* Map Placeholder */}
          {showMap && (
            <Map
              coordinates={result.route.coordinates}
              segments={result.route.segments}
              closeMap={() => setShowMap(false)}
            />
          )}

          {/* ELD Logs */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                🚛 ELD Logs by Day
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Electronic Logging Device records for your planned trip
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {result.logs.map((log, index) => (
                  <ELDLogs key={index} data={log} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
