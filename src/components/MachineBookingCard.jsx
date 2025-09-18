import React from "react";

const BookingsTable = ({ bookings }) => {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white border border-gray-200 shadow rounded">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="py-2 px-4 border">Date</th>
            <th className="py-2 px-4 border">Day</th>
            <th className="py-2 px-4 border">Machine</th>
            <th className="py-2 px-4 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-4">
                No bookings yet.
              </td>
            </tr>
          ) : (
            bookings.map((booking, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="py-2 px-4 border">
                  {new Date(booking.date).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 border">{booking.dayName}</td>
                <td className="py-2 px-4 border">
                  {booking.machine} ({booking.machineType})
                </td>
                <td className="py-2 px-4 border">{booking.time}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BookingsTable;
