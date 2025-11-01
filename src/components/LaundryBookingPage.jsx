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
  const [allBookings, setAllBookings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [machines, setMachines] = useState([]);
  const navigate = useNavigate();

  const getBookingMachineId = (b) => {
    const id = b?.machineId || b?.machine?._id || b?.machine?.id || '';
    return id.toString();
  };

  const parseSlotStartHour = (slotLabel) => {
    const start = slotLabel.split('-')[0].trim();
    const [h, m] = start.split(':').map(Number);
    return { hour: Number.isFinite(h) ? h : 0, minute: Number.isFinite(m) ? m : 0 };
  };

  const selectedDayDate = selectedDay?.date instanceof Date
    ? selectedDay.date
    : new Date(selectedDay?.date || Date.now());

  const startUtcFromSlot = (slotLabel) => {
    const { hour, minute } = parseSlotStartHour(slotLabel);
    const local = DateTime.fromJSDate(selectedDayDate, { zone: HELSINKI_TZ })
      .set({ hour, minute: minute || 0, second: 0, millisecond: 0 });
    return local.toUTC();
  };

  const isSameUtcHour = (isoA, isoB) => {
    const a = DateTime.fromISO(isoA, { zone: 'utc' }).startOf('hour');
    const b = DateTime.fromISO(isoB, { zone: 'utc' }).startOf('hour');
    return a.toMillis() === b.toMillis();
  };

  const refreshBookings = useCallback(async (retries = 2) => {
    try {
      const bookings = await getBookings();
      const validBookings = Array.isArray(bookings) ? bookings : [];
      setAllBookings(validBookings);
      const userId = localStorage.getItem('userId'); // Store this on login
      const myBookings = validBookings.filter(
        (b) => (b.user?._id === userId || b.userId === userId) && b.status === 'booked'
      );
      setUserBookings(myBookings);
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 600));
        return refreshBookings(retries - 1);
      }
      console.error('Failed to refresh bookings:', err);
      setError('Failed to refresh bookings: ' + (err.message || 'Unknown error'));
    }
  }, []);

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

  const toggleBooking = async (slotId, machineName, machineType) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to book or unbook a slot.');
        setLoading(false);
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
      const existingBooking = userBookings.find(
        (b) =>
          getBookingMachineId(b) === machineId &&
          isSameUtcHour(b.start, startUtc.toISO()) &&
          b.status === 'booked'
      );
      if (existingBooking) {
        await cancelBooking(existingBooking._id);
        await refreshBookings();
        alert(`Unbooked ${machine.name} successfully!`);
      } else {
        const payload = {
          machineId,
          start: startUtc.toISO({ suppressMilliseconds: true }),
          end: endUtc.toISO({ suppressMilliseconds: true }),
        };
        await createBooking(payload);
        await refreshBookings();
        alert(`Booked ${machine.name} successfully!`);
      }
    } catch (err) {
      console.error('Booking error:', err);
      const msg = err.message || 'Booking error occurred.';
      if (msg.includes('Not authorized')) {
        setError('You can only cancel your own bookings.');
      } else {
        setError(msg);
      }
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
      alert('Booking cancelled successfully!');
    } catch (err) {
      console.error('Cancel booking error:', err);
      const msg = err.message || 'Failed to cancel booking.';
      if (msg.includes('Not authorized')) {
        setError('You can only cancel your own bookings.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="home-header">
        <button className="home-header-button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
      <h1>
        Schedule for {selectedDay?.dayName}, {selectedDayDate.toDateString()}
      </h1>
      {error && (
        <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>
          {error}
        </p>
      )}
      {loading && <p style={{ textAlign: 'center', color: '#3498db' }}>Loading...</p>}
      <div className="machine-list">
        {machines.length === 0 && !loading ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d' }}>No machines available.</p>
        ) : (
          machines.map((machine) => (
            <div key={machine._id} className="machine-schedule">
              {/* Machine title */}
              <h3
                onClick={() => toggleMachineOpen(machine.name)}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1.2rem',
                  margin: '12px 0',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>
                  {openMachines[machine.name] ? '▼' : '▶'}
                </span>
                <strong>{machine.name}</strong>
                <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>
                  ({machine.type})
                </span>
              </h3>
              {/* Time slots */}
              {openMachines[machine.name] && (
                <div className="time-slots-grid">
                  {timeSlots.map((slot) => {
                    const slotId = `${selectedDayDate.toDateString()}_${machine.name}_${slot}`;
                    const machineId = machine._id.toString();
                    const slotStartUtc = startUtcFromSlot(slot).toISO();
                    const isTaken = allBookings.some(
                      (b) =>
                        getBookingMachineId(b) === machineId &&
                        isSameUtcHour(b.start, slotStartUtc) &&
                        b.status === 'booked'
                    );
                    const isMine = userBookings.some(
                      (b) =>
                        getBookingMachineId(b) === machineId &&
                        isSameUtcHour(b.start, slotStartUtc) &&
                        b.status === 'booked'
                    );
                    return (
                      <div key={slotId} className="time-slot-item">
                        <span className="time-slot-label">{slot}</span>
                        <button
                          onClick={() => (!isTaken || isMine) && toggleBooking(slotId, machine.name, machine.type)}
                          className={`time-slot-button ${isMine ? 'unbook' : isTaken ? 'taken' : 'book'}`}
                          disabled={loading || (isTaken && !isMine)}
                          style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading || (isTaken && !isMine) ? 'not-allowed' : 'pointer',
                            backgroundColor: isMine
                              ? '#e74c3c'
                              : isTaken
                              ? '#bdc3c7'
                              : '#2ecc71',
                            color: isTaken && !isMine ? '#7f8c8d' : 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {isMine ? 'Unbook' : isTaken ? 'Taken' : 'Book'}
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
      {/* User bookings list */}
      <div className="booked-list">
        <h2 style={{ marginTop: '32px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
          Your Upcoming Bookings
        </h2>
        {userBookings.filter((b) => b.status === 'booked').length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No upcoming bookings.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {userBookings
              .filter((b) => b.status === 'booked')
              .map((booking) => {
                const startLocal = DateTime.fromISO(booking.start, { zone: 'utc' }).setZone(HELSINKI_TZ);
                const endLocal = DateTime.fromISO(booking.end, { zone: 'utc' }).setZone(HELSINKI_TZ);
                const m = booking.machine || {};
                const machineName = m.name || m.code || 'Unknown Machine';
                const machineType = m.type || 'Unknown Type';
                return (
                  <li
                    key={booking._id}
                    style={{
                      marginBottom: '16px',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#2c3e50' }}>{machineName}</strong>
                      <span style={{ color: '#7f8c8d' }}> ({machineType})</span><br />
                      <span style={{ fontSize: '0.95rem', color: '#34495e' }}>
                        {startLocal.toFormat('cccc, dd LLL yyyy')}
                      </span><br />
                      <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                        {startLocal.toFormat('HH:mm')} - {endLocal.toFormat('HH:mm')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCancel(booking._id)}
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? '#95a5a6' : '#e74c3c',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#c0392b')}
                      onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#e74c3c')}
                    >
                      {loading ? 'Canceling...' : 'Cancel'}
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