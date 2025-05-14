import React, { useState, useEffect } from 'react';
import './App.css';

import CalendarHeader from './components/CalendarHeader';

import CalendarGrid from './components/CalendarGrid';
import MachineBookingCard from './components/MachineBookingCard';
import SelectedDaySchedule from './components/SelectedDaySchedule';
import LogoHeader from './components/LogoHeader';
import BookedMachinesList from './BookedMachinesList';
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const machines = [
  { name: "Washer 1", type: "washer" },
  { name: "Washer 2", type: "washer" },
  { name: "Dryer 1", type: "dryer" },
  { name: "Dryer 2", type: "dryer" },
];

const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour}:00 - ${hour + 1}:00`);
  }
  return slots;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const App = () => {
  const today = new Date(2025, 4, 6);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('sevasBookings');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedSlots, setSelectedSlots] = useState(() => {
    const saved = localStorage.getItem('sevasSelectedSlots');
    return saved ? JSON.parse(saved) : {};
  });

  const timeSlots = generateTimeSlots(8, 22);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  useEffect(() => {
    localStorage.setItem('sevasBookings', JSON.stringify(bookings));
    localStorage.setItem('sevasSelectedSlots', JSON.stringify(selectedSlots));
  }, [bookings, selectedSlots]);

  const handleMonthChange = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const dayName = weekdays[date.getDay()];
    setSelectedDay({ date, dayName });
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  };

  const toggleBooking = (id, machine, machineType) => {
    if (!id) return;
    const [day, time] = id.split('-');
    const date = new Date(selectedDay.date);
    const weekKey = getWeekKey(date);
    const booking = { id, day, time, machine, machineType };

    const weekBookings = bookings[weekKey] || [];

    const washerCount = weekBookings.filter((b) => b.machineType === 'washer').length;
    const dryerCount = weekBookings.filter((b) => b.machineType === 'dryer').length;

    const isBooked = weekBookings.some((b) => b.id === id);

    if (isBooked) {
      setBookings((prev) => ({
        ...prev,
        [weekKey]: prev[weekKey].filter((b) => b.id !== id),
      }));
      setSelectedSlots((prev) => ({ ...prev, [`${day}-${machine}`]: '' }));
    } else {
      if (machineType === 'washer' && washerCount >= 2) {
        alert("You can only book 2 washing machines per week.");
        return;
      }
      if (machineType === 'dryer' && dryerCount >= 2) {
        alert("You can only book 2 dryers per week.");
        return;
      }
      setBookings((prev) => ({
        ...prev,
        [weekKey]: [...weekBookings, booking],
      }));
    }
  };

  const isSlotDisabled = (id, machine, machineType) => {
    const date = new Date(selectedDay.date);
    const weekKey = getWeekKey(date);
    const weekBookings = bookings[weekKey] || [];

    const isSelected = weekBookings.some((b) => b.id === id);
    const isBookedElsewhere = weekBookings.some(
      (b) => b.machine === machine && b.id !== id
    );

    const washerCount = weekBookings.filter((b) => b.machineType === 'washer').length;
    const dryerCount = weekBookings.filter((b) => b.machineType === 'dryer').length;

    return (
      ((machineType === 'washer' && washerCount >= 2) ||
       (machineType === 'dryer' && dryerCount >= 2)) &&
      !isSelected
    ) || isBookedElsewhere;
  };

  const handleUnbookFromList = (weekKey, id) => {
    setBookings((prev) => ({
      ...prev,
      [weekKey]: prev[weekKey].filter((b) => b.id !== id),
    }));
    const [day, , machine] = id.split('-');
    setSelectedSlots((prev) => ({ ...prev, [`${day}-${machine}`]: '' }));
  };

  const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const selectedWeekKey = selectedDay ? getWeekKey(selectedDay.date) : null;
  const weekBookings = bookings[selectedWeekKey] || [];

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <LogoHeader />

      <h1 className="heading text-2xl font-bold text-center mb-6">Sevas Online Laundry Booking System</h1>

      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        months={months}
        onChange={handleMonthChange}
      />

      <CalendarGrid
        weekdays={weekdays}
        calendarDays={calendarDays}
        today={today}
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onDayClick={handleDayClick}
      />

      {selectedDay && (
        <SelectedDaySchedule
          selectedDay={selectedDay}
          currentYear={currentYear}
          currentMonth={currentMonth}
          machines={machines}
          selectedSlots={selectedSlots}
          setSelectedSlots={setSelectedSlots}
          bookings={bookings}
          toggleBooking={toggleBooking}
          isSlotDisabled={isSlotDisabled}
          timeSlots={timeSlots}
          selectedWeekKey={selectedWeekKey}
        />
      )}

      <BookedMachinesList
        weekBookings={weekBookings}
        selectedWeekKey={selectedWeekKey}
        handleUnbook={handleUnbookFromList}
      />
    </div>
  );
};

export default App;