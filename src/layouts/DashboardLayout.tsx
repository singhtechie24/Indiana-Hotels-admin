import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Navigation items with conditional rendering based on user permissions
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...(permissions.canViewUsers ? [{ name: 'Users', href: '/users', icon: UsersIcon }] : []),
    ...(permissions.canManageRooms ? [{ name: 'Rooms', href: '/rooms', icon: BuildingOfficeIcon }] : []),
    ...(permissions.canManageBookings ? [{ name: 'Bookings', href: '/bookings', icon: CalendarIcon }] : []),
    ...(permissions.canAccessSettings ? [{ name: 'Settings', href: '/settings', icon: Cog6ToothIcon }] : []),
  ];

  // Helper function to check if the current path matches a navigation item
  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar - Slides in from the left on smaller screens */}
      {/* Uses Headless UI's Dialog and Transition components for smooth animations */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4">
                    <h1 className="text-2xl font-bold text-white">Indiana Hotels</h1>
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-white hover:bg-primary-600"
                      >
                        <item.icon
                          className="mr-4 h-6 w-6 text-primary-300"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
                  <button
                    onClick={handleLogout}
                    className="flex-shrink-0 group block text-white"
                  >
                    <div className="flex items-center">
                      <div>
                        <p className="text-base font-medium text-white">Logout</p>
                      </div>
                    </div>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar - Always visible on larger screens */}
      {/* Contains hotel branding, navigation menu, and logout button */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-primary-700 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-white">Indiana Hotels</h1>
            </div>
            <nav className="mt-5 flex-1 flex flex-col">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? 'bg-primary-800 text-white'
                        : 'text-primary-100 hover:bg-primary-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isCurrentPath(item.href)
                          ? 'text-white'
                          : 'text-primary-300 group-hover:text-white'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-primary-100 hover:bg-primary-600 hover:text-white rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Displays the current route's content */}
      {/* Includes a mobile header with menu button and the main content from child routes */}
      <div className="flex-1 overflow-auto focus:outline-none">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}; 