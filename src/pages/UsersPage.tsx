import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { userService, User as ServiceUser } from '../services/userService';
import { staffService, StaffMember as ServiceStaffMember, CreateStaffData } from '../services/staffService';
import { usePermissions } from '../hooks/usePermissions';

type UserStatus = 'active' | 'disabled';
enum StaffRole {
  STAFF = 'staff',
  ADMIN = 'admin'
}

interface User extends Omit<ServiceUser, 'status'> {
  role: 'user';
  status: UserStatus;
}

interface StaffMember extends Omit<ServiceStaffMember, 'status'> {
  role: 'staff' | 'admin';
  status: UserStatus;
}

interface StaffFormData {
  email: string;
  displayName: string;
  password: string;
  role: StaffRole;
  permissions: {
    canViewUsers: boolean;
    canManageRooms: boolean;
    canManageBookings: boolean;
    canAccessSettings: boolean;
    canManageStaff: boolean;
  };
  phoneNumber: string;
  notes: string;
  shift: 'day' | 'night';
  department: 'housekeeping' | 'maintenance' | 'frontdesk';
}

export const UsersPage = () => {
  const permissions = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and filter states
  const [searchQuery] = useState('');
  const [roleFilter] = useState<'all' | 'admin' | 'user' | 'staff'>('all');
  
  const [filteredUsers, setFilteredUsers] = useState<(User | StaffMember)[]>([]);

  const initialStaffFormData: StaffFormData = {
    email: '',
    displayName: '',
    password: '',
    role: StaffRole.STAFF,
    permissions: {
      canViewUsers: false,
      canManageRooms: false,
      canManageBookings: false,
      canAccessSettings: false,
      canManageStaff: false,
    },
    phoneNumber: '',
    notes: '',
    shift: 'day',
    department: 'housekeeping',
  };

  const [staffFormData, setStaffFormData] = useState<StaffFormData>(initialStaffFormData);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, staffData] = await Promise.all([
        userService.getAllUsers(),
        staffService.getAllStaff(),
      ]);
      
      const mappedUsers: User[] = usersData.map(user => ({
        ...user,
        role: 'user',
        status: user.status === 'active' ? 'active' : 'disabled'
      }));

      const mappedStaff: StaffMember[] = staffData.map(staff => ({
        ...staff,
        status: staff.status === 'active' ? 'active' : 'disabled'
      }));

      setUsers(mappedUsers);
      setStaff(mappedStaff);
      
      setFilteredUsers([...mappedUsers, ...mappedStaff]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search users
  useEffect(() => {
    let result = [...users, ...staff];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.displayName?.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => 
        roleFilter === 'user' ? user.role === 'user' : 
        user.role === roleFilter
      );
    }
    
    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users, staff]);

  const handleToggleUserStatus = async (user: User | StaffMember) => {
    try {
      if (!permissions.canManageStaff || !permissions.canAccessSettings) {
        alert('Only administrators can disable or enable users.');
        return;
      }

      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      
      if (user.role === 'staff' || user.role === 'admin') {
        // Staff member
        await staffService.updateStaff(user.id, {
          status: newStatus === 'active' ? 'active' : 'inactive'
        });
      } else {
        // Regular user
        await userService.toggleUserStatus(user.id, newStatus === 'active');
      }
      fetchData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const staffData: CreateStaffData & { password: string } = {
        email: staffFormData.email,
        password: staffFormData.password,
        displayName: staffFormData.displayName,
        role: staffFormData.role === StaffRole.ADMIN ? 'admin' : 'staff',
        permissions: staffFormData.permissions,
        phoneNumber: staffFormData.phoneNumber,
        notes: staffFormData.notes,
        shift: staffFormData.shift,
        department: staffFormData.department,
        status: 'active'
      };
      await staffService.createStaff(staffData);
      setIsModalOpen(false);
      setStaffFormData(initialStaffFormData);
      await fetchData();
    } catch (error) {
      console.error('Error creating staff:', error);
      alert(error instanceof Error ? error.message : 'Failed to create staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permissions.canViewUsers) return <div>Access denied</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in the system including their name, email, role and status.
          </p>
        </div>
        {permissions.canManageStaff && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Staff
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0">
                    Name
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
                      {user.displayName}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">{user.email}</td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 md:pr-0">
                      {permissions.canManageStaff && (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {user.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <form onSubmit={handleCreateStaff} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Staff Member</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Please fill in the details for the new staff member.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={staffFormData.email}
                          onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                          Display Name
                        </label>
                        <input
                          type="text"
                          name="displayName"
                          id="displayName"
                          value={staffFormData.displayName}
                          onChange={(e) => setStaffFormData({ ...staffFormData, displayName: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          value={staffFormData.password}
                          onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={staffFormData.role}
                          onChange={(e) => setStaffFormData({ 
                            ...staffFormData, 
                            role: e.target.value === 'admin' ? StaffRole.ADMIN : StaffRole.STAFF 
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value={StaffRole.STAFF}>Staff</option>
                          <option value={StaffRole.ADMIN}>Admin</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <select
                          id="department"
                          name="department"
                          value={staffFormData.department}
                          onChange={(e) => setStaffFormData({ 
                            ...staffFormData, 
                            department: e.target.value as 'housekeeping' | 'maintenance' | 'frontdesk'
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="housekeeping">Housekeeping</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="frontdesk">Front Desk</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="shift" className="block text-sm font-medium text-gray-700">
                          Shift
                        </label>
                        <select
                          id="shift"
                          name="shift"
                          value={staffFormData.shift}
                          onChange={(e) => setStaffFormData({ 
                            ...staffFormData, 
                            shift: e.target.value as 'day' | 'night'
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="day">Day</option>
                          <option value="night">Night</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          id="phoneNumber"
                          value={staffFormData.phoneNumber}
                          onChange={(e) => setStaffFormData({ ...staffFormData, phoneNumber: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          id="notes"
                          rows={3}
                          value={staffFormData.notes}
                          onChange={(e) => setStaffFormData({ ...staffFormData, notes: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <fieldset>
                        <legend className="text-sm font-medium text-gray-700">Permissions</legend>
                        <div className="mt-2 space-y-2">
                          <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id="canViewUsers"
                                name="canViewUsers"
                                type="checkbox"
                                checked={staffFormData.permissions.canViewUsers}
                                onChange={(e) => setStaffFormData({
                                  ...staffFormData,
                                  permissions: {
                                    ...staffFormData.permissions,
                                    canViewUsers: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="canViewUsers" className="font-medium text-gray-700">
                                View Users
                              </label>
                            </div>
                          </div>

                          <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id="canManageRooms"
                                name="canManageRooms"
                                type="checkbox"
                                checked={staffFormData.permissions.canManageRooms}
                                onChange={(e) => setStaffFormData({
                                  ...staffFormData,
                                  permissions: {
                                    ...staffFormData.permissions,
                                    canManageRooms: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="canManageRooms" className="font-medium text-gray-700">
                                Manage Rooms
                              </label>
                            </div>
                          </div>

                          <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id="canManageBookings"
                                name="canManageBookings"
                                type="checkbox"
                                checked={staffFormData.permissions.canManageBookings}
                                onChange={(e) => setStaffFormData({
                                  ...staffFormData,
                                  permissions: {
                                    ...staffFormData.permissions,
                                    canManageBookings: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="canManageBookings" className="font-medium text-gray-700">
                                Manage Bookings
                              </label>
                            </div>
                          </div>

                          <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id="canAccessSettings"
                                name="canAccessSettings"
                                type="checkbox"
                                checked={staffFormData.permissions.canAccessSettings}
                                onChange={(e) => setStaffFormData({
                                  ...staffFormData,
                                  permissions: {
                                    ...staffFormData.permissions,
                                    canAccessSettings: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="canAccessSettings" className="font-medium text-gray-700">
                                Access Settings
                              </label>
                            </div>
                          </div>

                          <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id="canManageStaff"
                                name="canManageStaff"
                                type="checkbox"
                                checked={staffFormData.permissions.canManageStaff}
                                onChange={(e) => setStaffFormData({
                                  ...staffFormData,
                                  permissions: {
                                    ...staffFormData.permissions,
                                    canManageStaff: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="canManageStaff" className="font-medium text-gray-700">
                                Manage Staff
                              </label>
                            </div>
                          </div>
                        </div>
                      </fieldset>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                      >
                        {isSubmitting ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}; 