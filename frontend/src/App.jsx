import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/layouts/PublicLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

import HomePage from './pages/public/HomePage';
import TrackPage from './pages/public/TrackPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import VerifyEmail from './pages/public/VerifyEmail';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateShipment from './pages/customer/CreateShipment';
import ShipmentHistory from './pages/customer/ShipmentHistory';
import ProfilePage from './pages/customer/ProfilePage';

import CarrierDashboard from './pages/carrier/CarrierDashboard';
import CarrierShipments from './pages/carrier/CarrierShipments';
import CarrierProfile from './pages/carrier/CarrierProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerManagement from './pages/admin/CustomerManagement';
import CarrierManagement from './pages/admin/CarrierManagement';
import ShipmentMonitoring from './pages/admin/ShipmentMonitoring';
import Analytics from './pages/admin/Analytics';

import ShipmentDetail from './pages/ShipmentDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors expand={true} />
        <Routes>
          {/* Public Routes with PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Protected Dashboard Routes with DashboardLayout */}
          <Route element={<DashboardLayout />}>
            <Route path="/customer" element={<ProtectedRoute role="CUSTOMER" />}>
              <Route index element={<CustomerDashboard />} />
              <Route path="create" element={<CreateShipment />} />
              <Route path="shipments" element={<ShipmentHistory />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="/carrier" element={<ProtectedRoute role="CARRIER" />}>
              <Route index element={<CarrierDashboard />} />
              <Route path="shipments" element={<CarrierShipments />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route path="profile" element={<CarrierProfile />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="carriers" element={<CarrierManagement />} />
              <Route path="monitoring" element={<ShipmentMonitoring />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
