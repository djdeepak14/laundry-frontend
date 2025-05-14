import React from 'react';

   const BookedMachinesList = ({ weekBookings, selectedWeekKey, handleUnbook }) => {
     return (
       <div className="mt-6">
         <h3 className="text-lg font-bold mb-2">Booked Machines</h3>
         {weekBookings.length === 0 ? (
           <p>No bookings for this week.</p>
         ) : (
           <ul className="space-y-2">
             {weekBookings.map((booking) => (
               <li key={booking.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                 <span>
                   {booking.machine} ({booking.day}, {booking.time})
                 </span>
                 <button
                   onClick={() => handleUnbook(selectedWeekKey, booking.id)}
                   className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                 >
                   Unbook
                 </button>
               </li>
             ))}
           </ul>
         )}
       </div>
     );
   };

   export default BookedMachinesList;