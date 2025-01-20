import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyPoundIcon,
} from '@heroicons/react/24/outline';
import { userService } from '../services/userService';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { Room } from '../types/room';
import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

type HeroIcon = ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string | undefined;
    titleId?: string | undefined;
} & RefAttributes<SVGSVGElement>>;

interface DashboardStat {
  name: string;
  stat: string | number;
  icon: HeroIcon;
  change: string;
  changeType: 'increase' | 'decrease';
}

interface Booking {
  id: string;
  guestName: string;
  roomId: string;
  checkIn: Date;
  status: string;
  totalPrice?: number;
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStat[]>([
    {
      name: 'Total Bookings',
      stat: '0',
      icon: CalendarIcon,
      change: '0%',
      changeType: 'increase',
    },
    {
      name: 'Total Revenue',
      stat: '£0',
      icon: CurrencyPoundIcon,
      change: '0%',
      changeType: 'increase',
    },
    {
      name: 'Active Rooms',
      stat: '0',
      icon: BuildingOfficeIcon,
      change: '0%',
      changeType: 'increase',
    },
    {
      name: 'Total Users',
      stat: '0',
      icon: UserGroupIcon,
      change: '0%',
      changeType: 'increase',
    },
  ]);

  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch total users (only regular users, not staff/admin)
        const users = await userService.getAllUsers();
        const totalUsers = users.length;

        // Fetch rooms
        const rooms = await roomService.getAllRooms();
        const activeRooms = rooms.filter((room: Room) => room.status === 'available').length;

        // Fetch recent bookings
        const bookingsQuery = await bookingService.getAllBookings();
        const bookings = bookingsQuery
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);
        const totalBookings = bookings.length;

        // Calculate total revenue from confirmed bookings
        const confirmedBookings = bookings.filter((booking: Booking) => booking.status === 'confirmed');
        const totalRevenue = confirmedBookings.reduce((sum: number, booking: Booking) => 
          sum + (booking.totalPrice || 0), 0);

        // Update stats
        setStats(prev => prev.map(stat => {
          if (stat.name === 'Total Users') {
            return { ...stat, stat: totalUsers };
          }
          if (stat.name === 'Active Rooms') {
            return { ...stat, stat: activeRooms };
          }
          if (stat.name === 'Total Bookings') {
            return { ...stat, stat: totalBookings };
          }
          if (stat.name === 'Total Revenue') {
            return { ...stat, stat: `£${totalRevenue}` };
          }
          return stat;
        }));

        setRecentBookings(bookings);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-2xl leading-6 font-medium text-gray-900">
          Dashboard
        </h3>
      </div>

      <div className="mt-5">
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 rounded-lg overflow-hidden shadow"
            >
              <dt>
                <div className="absolute bg-blue-600 rounded-md p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {item.stat}
                </p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'increase'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8">
        <div className="align-middle inline-block min-w-full border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Bookings
          </h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading dashboard data...</p>
            </div>
          ) : recentBookings.length > 0 ? (
            <table className="min-w-full">
              <thead>
                <tr className="border-t border-gray-200">
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.guestName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.roomId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.checkIn instanceof Date 
                        ? booking.checkIn.toLocaleDateString() 
                        : new Date(booking.checkIn).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">No recent bookings found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 