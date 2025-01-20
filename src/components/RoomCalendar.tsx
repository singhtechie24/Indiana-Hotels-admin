import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Room } from '../services/roomService';
import { Booking } from '../services/bookingService';
import { Maintenance } from '../services/maintenanceService';

interface RoomCalendarProps {
  room: Room;
  bookings: Booking[];
  maintenanceList: Maintenance[];
  onBookingClick?: (booking: Booking) => void;
  onDateSelect?: (start: Date, end: Date) => void;
}

export const RoomCalendar: React.FC<RoomCalendarProps> = ({
  room,
  bookings,
  maintenanceList,
  onBookingClick,
  onDateSelect,
}) => {
  const events = [
    // Booking events
    ...bookings.map(booking => ({
      id: booking.id,
      title: `Room ${room.number} - ${booking.guestName || 'Guest'} (${booking.status})`,
      start: booking.checkIn,
      end: booking.checkOut,
      backgroundColor: getStatusColor(booking.status),
      borderColor: getStatusColor(booking.status),
      textColor: '#ffffff',
      extendedProps: { booking },
    })),
    // Maintenance events
    ...maintenanceList.map(maintenance => ({
      id: maintenance.id,
      title: `Maintenance: ${maintenance.reason} (${maintenance.status})`,
      start: maintenance.startDate,
      end: maintenance.endDate,
      backgroundColor: '#EF4444', // red-500
      borderColor: '#DC2626', // red-600
      textColor: '#ffffff',
      extendedProps: { maintenance },
    })),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981'; // green-500
      case 'pending':
        return '#F59E0B'; // yellow-500
      case 'cancelled':
        return '#EF4444'; // red-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  return (
    <div className="h-[600px] bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={(arg) => {
          // Only allow selection if room is available
          if (room.status === 'available') {
            onDateSelect?.(arg.start, arg.end);
          }
        }}
        eventClick={(arg) => {
          const booking = arg.event.extendedProps?.booking;
          if (booking) {
            onBookingClick?.(booking);
          }
        }}
        height="100%"
        selectConstraint={{
          start: new Date().setHours(0, 0, 0, 0), // Today
          end: '2025-01-31', // Far future date
        }}
        validRange={{
          start: new Date().setHours(0, 0, 0, 0), // Only allow dates from today
        }}
      />
    </div>
  );
}; 