// src/components/LaundryBookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking, cancelBooking, getBookings, getMachines } from '../api';
import { DateTime } from 'luxon';
import '../App.css';

const HELSINKI_TZ = 'Europe/Helsinki';

const LaundryBookingPage = ({
  selectedDay,
  timeSlots = [
    '8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00',
    '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00',
    '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
    '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
    '20:00 - 21:00', '21:00 - 22:00'
  ],
}) => {
  const [openMachines, setOpenMachines] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [machines, setMachines] = useState([]);
  const navigate = useNavigate();

  // --- Helper functions ---
  const getBookingMachineId = (b) => (b?.machine?._id || b?.machine || '').toString();

  const parseSlotStartHour = (slotLabel) => {
    const start = slotLabel.split('-')[0].trim();
    const [h, m] = start.split(':').map(Number);
    return { hour: Number.isFinite(h) ? h : 0, minute: Number.isFinite(m) ? m : 0 };
  };

  const selectedDayDate =
    selectedDay?.date instanceof Date ? selectedDay.date : new Date(selectedDay?.date);

  const startUtcFromSlot = (slotLabel) => {
    const { hour, minute } = parseSlotStartHour(slotLabel);
    const local = DateTime.fromJSDate(selectedDayDate, { zone: HELSINKI_TZ })
      .set({ hour, minute: minute || 0, second: 0, millisecond: 0 });
    return local.toUTC();
  };

  const isSameUtcHour = (isoA, isoB) => {
    const a = DateTime.fromISO(isoA, { zone: 'utc' }).set({ second: 0, millisecond: 0 });
    const b = DateTime.fromISO(isoB, { zone: 'utc' }).set({ second: 0, millisecond: 0 });
    return a.toMillis() === b.toMillis();
  };

  // === REFRESH BOOKINGS ===
  const refreshBookings = useCallback(async (retries = 2) => {
    try {
      const bookings = await getBookings();
      setUserBookings(Array.isArray(bookings) ? bookings : []);
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 600));
        return refreshBookings(retries - 1);
      }
      console.error('Failed to refresh bookings:', err);
      setError('Failed to refresh bookings: ' + (err.message || 'Unknown error'));
    }
  }, []);

  // === LOAD MACHINES AND BOOKINGS ===
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const machineResponse = await getMachines();
        const rawMachines = machineResponse?.data || machineResponse || [];
        const fetchedMachines = rawMachines
          .map((m) => ({
            ...m,
            _id: m._id || m.id || '',
            name: m.name || m.code || 'Unnamed Machine',
            type: m.type || 'unknown',
          }))
          .filter((m) => m._id);
        console.log('Fetched machines:', fetchedMachines);
        setMachines(fetchedMachines);
        await refreshBookings();
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load initial data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [refreshBookings]);

  const toggleMachineOpen = (machineName) => {
    setOpenMachines((prev) => ({
      ...prev,
      [machineName]: !prev[machineName],
    }));
  };

  // === BOOK / UNBOOK FUNCTION ===
  const toggleBooking = async (slotId, machineName, machineType) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to book or unbook a slot.');
        return;
      }

      const parts = slotId.split('_');
      const timeRange = parts[2];
      const startUtc = startUtcFromSlot(timeRange);
      const endUtc = startUtc.plus({ hours: 1 });

      const machine = machines.find((m) => m.name === machineName && m.type === machineType);
      if (!machine || !machine._id) {
        throw new Error(`Machine "${machineName}" not found`);
      }
      const machineId = machine._id.toString();

      const isBooked = userBookings.some(
        (b) =>
          getBookingMachineId(b) === machineId &&
          isSameUtcHour(b.start, startUtc.toISO()) &&
          b.status === 'booked'
      );

      if (isBooked) {
        const toCancel = userBookings.find(
          (b) =>
            getBookingMachineId(b) === machineId && isSameUtcHour(b.start, startUtc.toISO())
        );
        if (!toCancel?._id) throw new Error('Booking not found for unbooking');
        await cancelBooking(toCancel._id);
        await refreshBookings();
        alert(`🧺 Unbooked ${machine.name} successfully!`);
      } else {
        const payload = {
          machineId,
          start: startUtc.toISO({ suppressMilliseconds: true }),
          end: endUtc.toISO({ suppressMilliseconds: true }),
        };
        await createBooking(payload);
        await refreshBookings();
        alert(`✅ Booked ${machine.name} successfully!`);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Booking error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setError('');
    setLoading(true);
    try {
      await cancelBooking(bookingId);
      await refreshBookings();
      alert('❌ Booking cancelled successfully!');
    } catch (err) {
      console.error('Cancel booking error:', err);
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* === HEADER === */}
      <div className="home-header">
        <button className="home-header-button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>

      <h1>
        Schedule for {selectedDay?.dayName}, {selectedDayDate.toDateString()}
      </h1>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {/* === MACHINE LIST === */}
      <div className="machine-list">
        {machines.length === 0 && !loading ? (
          <p>No machines available.</p>
        ) : (
          machines.map((machine) => (
            <div key={machine._id} className="machine-schedule">
              <h3 onClick={() => toggleMachineOpen(machine.name)}>
                {machine.name} ({machine.type}) {openMachines[machine.name] ? '▲' : '▼'}
              </h3>

              {openMachines[machine.name] && (
                <div className="time-slots-grid">
                  {timeSlots.map((slot) => {
                    const slotId = `${selectedDayDate.toDateString()}_${machine.name}_${slot}`;
                    const machineId = machine._id.toString();
                    const slotStartUtc = startUtcFromSlot(slot).toISO();

                    const isBooked = userBookings.some(
                      (b) =>
                        getBookingMachineId(b) === machineId &&
                        isSameUtcHour(b.start, slotStartUtc) &&
                        b.status === 'booked'
                    );

                    return (
                      <div key={slotId} className="time-slot-item">
                        <span className="time-slot-label">{slot}</span>
                        <button
                          onClick={() => toggleBooking(slotId, machine.name, machine.type)}
                          className={`time-slot-button ${isBooked ? 'unbook' : 'book'}`}
                          disabled={loading}
                        >
                          {isBooked ? 'Unbook' : 'Book'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* === MY BOOKINGS === */}
      <div className="booked-list">
        <h2>Booked Laundry</h2>
        {userBookings.filter((b) => b.status === 'booked').length === 0 ? (
          <p>No bookings this week.</p>
        ) : (
          <ul>
            {userBookings
              .filter((b) => b.status === 'booked')
              .map((booking) => {
                const startLocal = DateTime.fromISO(booking.start, { zone: 'utc' }).setZone(HELSINKI_TZ);
                const endLocal = DateTime.fromISO(booking.end, { zone: 'utc' }).setZone(HELSINKI_TZ);
                const m = booking.machine;
                const machineName =
                  typeof m === 'object' && m !== null ? m.name || m.code || 'Unknown Machine' : 'Unknown Machine';
                const machineType =
                  typeof m === 'object' && m !== null ? m.type || 'Unknown Type' : 'Unknown Type';

                return (
                  <li key={booking._id}>
                    <div>
                      <strong>{machineName}</strong> ({machineType})<br />
                      {startLocal.toFormat('cccc, dd LLL yyyy')}
                      <br />
                      {startLocal.toFormat('HH:mm')} - {endLocal.toFormat('HH:mm')}
                    </div>
                    <button onClick={() => handleCancel(booking._id)} disabled={loading}>
                      Cancel
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LaundryBookingPage;
