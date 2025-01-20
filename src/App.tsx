import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import RoomsPage from './pages/RoomsPage';
import { BookingsPage } from './pages/BookingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

const App = () => {
  console.log('App rendering');
  
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={
              <ProtectedRoute requiredPermission="canViewUsers">
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="rooms" element={
              <ProtectedRoute requiredPermission="canManageRooms">
                <RoomsPage />
              </ProtectedRoute>
            } />
            <Route path="bookings" element={
              <ProtectedRoute requiredPermission="canViewBookings">
                <BookingsPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute requiredPermission="canAccessSettings">
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
