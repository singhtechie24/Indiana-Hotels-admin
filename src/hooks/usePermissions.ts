import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../services/userService';

interface Permissions {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRooms: boolean;
  canManageBookings: boolean;
  canViewBookings: boolean;
  canEditBookings: boolean;
  canDeleteBookings: boolean;
  canAccessSettings: boolean;
  canToggleUserStatus: boolean;
  canManageStaff: boolean;
}

export const usePermissions = (): Permissions => {
  const { user } = useContext(AuthContext);
  const role = user?.role || 'user';
  const staffPermissions = user?.permissions || {};

  // If user is admin, they have all permissions
  if (role === 'admin') {
    return {
      canManageUsers: true,
      canManageRoles: true,
      canViewUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRooms: true,
      canManageBookings: true,
      canViewBookings: true,
      canEditBookings: true,
      canDeleteBookings: true,
      canAccessSettings: true,
      canToggleUserStatus: true,
      canManageStaff: true,
    };
  }

  // If user is staff, use their specific permissions
  if (role === 'staff') {
    return {
      canManageUsers: staffPermissions.canViewUsers || false,
      canManageRoles: false, // Staff can never manage roles
      canViewUsers: staffPermissions.canViewUsers || false,
      canEditUsers: false, // Staff can never edit users
      canDeleteUsers: false, // Staff can never delete users
      canManageRooms: staffPermissions.canManageRooms || false,
      canManageBookings: staffPermissions.canManageBookings || false,
      canViewBookings: staffPermissions.canManageBookings || false,
      canEditBookings: staffPermissions.canManageBookings || false,
      canDeleteBookings: false, // Staff can never delete bookings
      canAccessSettings: staffPermissions.canAccessSettings || false,
      canToggleUserStatus: false, // Staff can never toggle user status
      canManageStaff: staffPermissions.canManageStaff || false,
    };
  }

  // Default permissions for regular users (no permissions)
  return {
    canManageUsers: false,
    canManageRoles: false,
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewBookings: false,
    canEditBookings: false,
    canDeleteBookings: false,
    canAccessSettings: false,
    canToggleUserStatus: false,
    canManageStaff: false,
  };
}; 