export interface Step {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  type: number;
  way_points: [number, number];
}

export interface Segment {
  distance: number;
  duration: number;
  steps: Step[];
}

export interface FormData {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_hours_used: string;
}

export interface Log {
  day: number;
  drive: number;
  end_cycle_hour: number;
  on_duty: number;
  rest: number;
  start_cycle_hour: number;
}

export interface TripResult {
  route: {
    distance_miles: number;
    duration_hours: number;
    segments: Segment[];
    coordinates: [number, number][];
  };
  logs: Log[];
}
