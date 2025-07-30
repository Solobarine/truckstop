import { useState, useCallback, useEffect } from "react";

interface ELDLogData {
  day: number;
  drive: number;
  end_cycle_hour: number;
  on_duty: number;
  rest: number;
  start_cycle_hour: number;
}

interface ELDLogsProps {
  data: ELDLogData;
  onDataChange?: (data: ELDLogData) => void;
}

type DutyStatus = "off_duty" | "sleeper" | "driving" | "on_duty";

interface TimeSlot {
  hour: number;
  status: DutyStatus;
}

const DUTY_STATUS_CONFIG = {
  off_duty: {
    label: "Off Duty",
    color: "bg-gray-400",
    textColor: "text-gray-700",
    row: 0,
  },
  sleeper: {
    label: "Sleeper Berth",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    row: 1,
  },
  driving: {
    label: "Driving",
    color: "bg-red-500",
    textColor: "text-red-700",
    row: 2,
  },
  on_duty: {
    label: "On-Duty (Not Driving)",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    row: 3,
  },
};

export default function ELDLogs({ data, onDataChange }: ELDLogsProps) {
  const [selectedStatus, setSelectedStatus] = useState<DutyStatus>("driving");
  const [isDrawing, setIsDrawing] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const distributeHours = useCallback((data: ELDLogData): TimeSlot[] => {
    const slots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      status: "off_duty" as DutyStatus,
    }));

    let currentHour = 0;

    // Drive
    for (let i = 0; i < data.drive && currentHour < 24; i++) {
      slots[currentHour].status = "driving";
      currentHour++;
    }

    // On-duty non-driving (capped to 3 hours)
    const nonDrive = Math.min(data.on_duty - data.drive, 3);
    for (let i = 0; i < nonDrive && currentHour < 24; i++) {
      slots[currentHour].status = "on_duty";
      currentHour++;
    }

    // Rest (sleeper)
    for (let i = 0; i < data.rest && currentHour < 24; i++) {
      slots[currentHour].status = "sleeper";
      currentHour++;
    }

    return slots;
  }, []);

  useEffect(() => {
    const newTimeSlots = distributeHours(data);
    setTimeSlots(newTimeSlots);
  }, [data, distributeHours]);

  useEffect(() => {
    if (onDataChange && timeSlots.length > 0) {
      const calculatedData = {
        ...data,
        drive: calculateHours("driving"),
        on_duty: calculateHours("driving") + calculateHours("on_duty"),
        rest: calculateHours("sleeper"),
      };
      onDataChange(calculatedData);
    }
  }, [timeSlots, data, onDataChange]);

  const handleMouseDown = useCallback(
    (hour: number) => {
      setIsDrawing(true);
      updateTimeSlot(hour, selectedStatus);
    },
    [selectedStatus]
  );

  const handleMouseEnter = useCallback(
    (hour: number) => {
      if (isDrawing) {
        updateTimeSlot(hour, selectedStatus);
      }
    },
    [isDrawing, selectedStatus]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const updateTimeSlot = (hour: number, status: DutyStatus) => {
    setTimeSlots((prev) =>
      prev.map((slot) => (slot.hour === hour ? { ...slot, status } : slot))
    );
  };

  const calculateHours = (status: DutyStatus) => {
    return timeSlots.filter((slot) => slot.status === status).length;
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-4 border-b border-black">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">RECORD OF DUTY STATUS</h1>
            <div className="text-right">
              <div className="text-lg font-semibold">Day: {data.day}</div>
              <div className="text-sm">
                24-Hour Period Starting Time: 12:00 AM
              </div>
            </div>
          </div>
        </div>
        {/* Driver Info Section */}
        <div className="p-4 border-b border-black bg-gray-50">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="mb-2">
                <span className="font-semibold">Driver Name: </span>
                <span className="border-b border-black inline-block w-48">
                  _________________
                </span>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Employee ID: </span>
                <span className="border-b border-black inline-block w-32">
                  ____________
                </span>
              </div>
            </div>
            <div>
              <div className="mb-2">
                <span className="font-semibold">Cycle Hours: </span>
                <span className="border-b border-black inline-block w-24">
                  {data.start_cycle_hour}
                </span>
                <span className="mx-2">to</span>
                <span className="border-b border-black inline-block w-24">
                  {data.end_cycle_hour}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Vehicle ID: </span>
                <span className="border-b border-black inline-block w-32">
                  ____________
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawing Tools */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
        <h3 className="text-lg font-semibold mb-3">
          Manual Override - Select Status:
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DUTY_STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key as DutyStatus)}
              className={`px-4 py-2 rounded border-2 font-medium transition-all ${
                selectedStatus === key
                  ? `${config.color} border-black text-white`
                  : `bg-white border-gray-300 ${config.textColor} hover:bg-gray-100`
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click on individual time slots to manually override the auto-generated
          schedule
        </p>
      </div>

      <div className="border-2 border-black">
        {/* Time Headers */}
        <div className="flex border-b-2 border-black bg-gray-100">
          <div className="w-28 p-2 border-r border-black font-semibold text-center flex-shrink-0">
            Status
          </div>
          <div className="grid grid-cols-24">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="flex-1 p-1 border-r border-black text-xs text-center font-medium min-w-0"
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        {/* Duty Status Rows */}
        {Object.entries(DUTY_STATUS_CONFIG).map(([statusKey, config]) => (
          <div key={statusKey} className="flex border-b border-black">
            <div
              className={`w-28 p-3 border-r-2 border-black font-semibold text-sm ${config.color} ${config.textColor} flex items-center justify-center flex-shrink-0`}
            >
              {config.label}
            </div>
            <div className="flex flex-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const isActive = timeSlots[hour]?.status === statusKey;
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-12 border-r border-gray-300 cursor-crosshair relative min-w-0 ${
                      isActive ? config.color : "bg-white hover:bg-gray-100"
                    }`}
                    onMouseDown={() => handleMouseDown(hour)}
                    onMouseEnter={() => handleMouseEnter(hour)}
                    onMouseUp={handleMouseUp}
                  >
                    {isActive && (
                      <div
                        className={`absolute inset-0 ${config.color} bg-opacity-20`}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Time Labels Bottom */}
        <div className="flex bg-gray-100">
          <div className="w-48 p-2 border-r border-black font-semibold text-center flex-shrink-0">
            Time
          </div>
          <div className="grid grid-cols-24 text-xs">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="flex-1 p-1 border-r border-black text-xs text-center min-w-0"
              >
                {formatTime(i)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-4 border-2 border-black p-4 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-end">
          <div>
            <div className="mb-2">
              <span className="font-semibold">Driver Signature: </span>
              <span className="border-b-2 border-black inline-block w-64">
                _________________________
              </span>
            </div>
            <div className="text-sm text-gray-600">
              I certify that my record is true and complete.
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="font-semibold">Date: </span>
              <span className="border-b-2 border-black inline-block w-32">
                ____________
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Total Miles:{" "}
              <span className="border-b border-black inline-block w-20">
                _______
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
