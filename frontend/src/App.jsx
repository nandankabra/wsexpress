import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import HomePage from './pages/public/HomePage';
import ServicesPage from './pages/public/ServicesPage';
import TrackPage from './pages/public/TrackPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateShipment from './pages/customer/CreateShipment';
import ShipmentHistory from './pages/customer/ShipmentHistory';
import ProfilePage from './pages/customer/ProfilePage';

import CarrierDashboard from './pages/carrier/CarrierDashboard';
import CarrierShipments from './pages/carrier/CarrierShipments';

import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerManagement from './pages/admin/CustomerManagement';
import CarrierManagement from './pages/admin/CarrierManagement';
import ShipmentMonitoring from './pages/admin/ShipmentMonitoring';
import Analytics from './pages/admin/Analytics';

import ShipmentDetail from './pages/ShipmentDetail';

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/customer" element={<ProtectedRoute role="CUSTOMER" />}>
              <Route index element={<CustomerDashboard />} />
              <Route path="create" element={<CreateShipment />} />
              <Route path="history" element={<ShipmentHistory />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="/carrier" element={<ProtectedRoute role="CARRIER" />}>
              <Route index element={<CarrierDashboard />} />
              <Route path="shipments" element={<CarrierShipments />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="carriers" element={<CarrierManagement />} />
              <Route path="shipments" element={<ShipmentMonitoring />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="*" element={<HomePage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
