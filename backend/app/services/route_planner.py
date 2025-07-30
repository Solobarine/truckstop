from typing import Any, TypedDict
import requests
from django.conf import settings


class ErrorResponse(TypedDict):
    error: str


class RouteResponse(TypedDict):
    distance_miles: float
    duration_hours: int
    route_information: list
    coordinates: list


def get_trip_information(start, end) -> RouteResponse | ErrorResponse:
    OPEN_ROUTE_URL = settings.OPEN_ROUTE_URL
    API_KEY = settings.API_KEY

    # Get Co-ordinates of pickup and dropoff points
    pickup_url = f"{OPEN_ROUTE_URL}/geocode/search?api_key={API_KEY}&text={start}"
    dropoff_url = f"{OPEN_ROUTE_URL}/geocode/search?api_key={API_KEY}&text={end}"

    pickup_response: Any = get_request(url=pickup_url)
    dropoff_response: Any = get_request(url=dropoff_url)

    # Retrieve Co-ordinates from first feature
    pickup_coordinates = pickup_response["features"][0]["geometry"]["coordinates"] if pickup_response["features"] and len(
        pickup_response["features"]) > 0 else None
    dropoff_coordinates = dropoff_response["features"][0]["geometry"]["coordinates"] if dropoff_response["features"] and len(
        dropoff_response["features"]) > 0 else None

    if pickup_coordinates is None or dropoff_coordinates is None:
        return {"error": "Unable to get co-ordinates"}

    # Estimate distance and duration along with route properties
    route_information_url = f"{OPEN_ROUTE_URL}/v2/directions/driving-car?api_key={API_KEY}&start={pickup_coordinates[0]},{pickup_coordinates[1]}&end={dropoff_coordinates[0]},{dropoff_coordinates[1]}"

    route_information_response: Any = get_request(url=route_information_url)

    if "error" in route_information_response:
        return {"error": "Something went wrong"}

    return {
        "distance_miles": route_information_response["features"][0]["properties"]["summary"]["distance"] / 1609.34,
        "duration_hours": round(route_information_response["features"][0]["properties"]["summary"]["duration"] / 60),
        "route_information": route_information_response["features"][0]["properties"]["segments"],
        "coordinates": route_information_response["features"][0]["geometry"]["coordinates"]
    }


def plan_trip(data):
    pickup = data["pickup_location"]
    dropoff = data["dropoff_location"]
    cycle_used = data["cycle_hours_used"]

    trip_info = get_trip_information(pickup, dropoff)

    if "error" in trip_info:
        return trip_info

    # DOT constants
    CYCLE_LIMIT = 70
    MAX_DAILY_DRIVE = 11
    MAX_ONDUTY_PER_DAY = 14
    REQUIRED_REST = 10
    BREAK_REQUIRED_AFTER = 8  # hours of driving
    BREAK_DURATION = 1        # 30 minutes
    CYCLE_RESET_HOURS = 34
    MAX_NON_DRIVE = 3         # max on-duty non-driving time

    total_driving_hours = min(trip_info["duration_hours"], CYCLE_LIMIT)

    logs = []
    hours_remaining = total_driving_hours
    cycle_hour = cycle_used
    day = 0
    drive_since_last_break = 0

    # If cycle is already maxed out, add a cycle reset
    if cycle_used >= CYCLE_LIMIT:
        day += 1
        logs.append({
            "day": f"{day} (cycle reset)",
            "drive": 0,
            "non_drive": 0,
            "breaks": [],
            "on_duty": 0,
            "off_duty_rest": CYCLE_RESET_HOURS,
            "start_cycle_hour": cycle_hour,
            "end_cycle_hour": cycle_hour + CYCLE_RESET_HOURS
        })
        cycle_hour += CYCLE_RESET_HOURS
        cycle_used = 0
        total_driving_hours = min(trip_info["duration_hours"], CYCLE_LIMIT)
        hours_remaining = total_driving_hours

    while hours_remaining > 0:
        day += 1
        log = {
            "day": day,
            "drive": 0,
            "non_drive": 0,
            "breaks": [],
            "on_duty": 0,
            "off_duty_rest": 0,
            "start_cycle_hour": cycle_hour,
        }

        drive_today = 0
        non_drive_time = 0

        # Pickup or Dropoff: Only first/last day
        if day == 1:
            non_drive_time += 1  # pickup
        if hours_remaining <= MAX_DAILY_DRIVE:
            non_drive_time += 1  # dropoff

        # Simulate driving hour-by-hour
        while drive_today < MAX_DAILY_DRIVE and hours_remaining > 0:
            if drive_since_last_break >= BREAK_REQUIRED_AFTER:
                log["breaks"].append("30-minute DOT break")
                break_time = min(
                    BREAK_DURATION, MAX_NON_DRIVE - non_drive_time)
                non_drive_time += break_time
                cycle_hour += break_time
                drive_since_last_break = 0

            if non_drive_time >= MAX_NON_DRIVE:
                break  # can't go on-duty longer without violating rule

            drive_today += 1
            drive_since_last_break += 1
            hours_remaining -= 1
            cycle_hour += 1

        # Final non-drive additions like fueling or inspection, max capped
        remaining_nd = MAX_NON_DRIVE - non_drive_time
        if remaining_nd > 0:
            non_drive_time += remaining_nd
            cycle_hour += remaining_nd

        # Calculate on-duty and enforce 14-hour daily limit
        on_duty = min(drive_today + non_drive_time, MAX_ONDUTY_PER_DAY)

        log.update({
            "drive": drive_today,
            "non_drive": round(non_drive_time, 2),
            "on_duty": round(on_duty, 2),
            "off_duty_rest": REQUIRED_REST,
            "end_cycle_hour": round(cycle_hour + REQUIRED_REST, 2)
        })

        logs.append(log)

        cycle_hour += REQUIRED_REST
        cycle_used += on_duty
        drive_since_last_break = 0

        if cycle_used >= CYCLE_LIMIT and hours_remaining > 0:
            day += 1
            logs.append({
                "day": f"{day} (cycle reset)",
                "drive": 0,
                "non_drive": 0,
                "breaks": [],
                "on_duty": 0,
                "off_duty_rest": CYCLE_RESET_HOURS,
                "start_cycle_hour": cycle_hour,
                "end_cycle_hour": cycle_hour + CYCLE_RESET_HOURS
            })
            cycle_hour += CYCLE_RESET_HOURS
            cycle_used = 0

    return {
        "route": {
            "pickup": pickup,
            "dropoff": dropoff,
            "distance_miles": trip_info["distance_miles"],
            "duration_hours": trip_info["duration_hours"],
            "segments": trip_info["route_information"],
            "coordinates": trip_info["coordinates"]
        },
        "logs": logs
    }


def get_request(url):
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()

        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
