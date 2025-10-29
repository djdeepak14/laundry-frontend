import React from "react";
import { DateTime } from "luxon";

const MachineBookingCard = ({
  machine,
  userBookings,
  handleToggleBooking,
  loading,
}) => {
  const isBooked = userBookings.some(
    (b) =>
      b.machine._id.toString() === machine._id.toString() &&
      DateTime.fromJSDate(new Date(b.start)).toISODate() ===
        DateTime.fromISO(machine.date).toISODate() &&
      DateTime.fromJSDate(new Date(b.start)).toFormat("HH:mm") === machine.time
  );

  return (
    <div className="border p-4 rounded shadow mb-2 flex justify-between items-center">
      <div>
        <h3 className="font-bold">{machine.name}</h3>
        <p>Type: {machine.type}</p>
        <p>Date: {machine.date}</p>
        <p>Time: {machine.time}</p>
      </div>
      <div>
        <button
          onClick={() =>
            handleToggleBooking(machine, machine.date, machine.time)
          }
          disabled={loading}
          className={`${
            isBooked ? "bg-red-500" : "bg-green-500"
          } text-white px-4 py-2 rounded transition`}
        >
          {loading ? "Processing..." : isBooked ? "Unbook" : "Book"}
        </button>
      </div>
    </div>
  );
};

export default MachineBookingCard;
