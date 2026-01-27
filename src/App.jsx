import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Page imports
import LandingPage from './pages/LandingPage';
import AttendeeVendors from './pages/attendee/VendorList';
import AttendeeMenu from './pages/attendee/Menu';
import AttendeeCheckout from './pages/attendee/Checkout';
import AttendeeOrderTracker from './pages/attendee/OrderTracker';

import VendorLogin from './pages/vendor/Login';
import VendorDashboard from './pages/vendor/Dashboard';

import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminVendors from './pages/admin/Vendors';
import AdminEvents from './pages/admin/Events';

function App() {
    return (
        <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Attendee Flow */}
            <Route path="/order" element={<AttendeeVendors />} />
            <Route path="/order/vendor/:vendorId" element={<AttendeeMenu />} />
            <Route path="/order/checkout" element={<AttendeeCheckout />} />
            <Route path="/order/track/:orderId" element={<AttendeeOrderTracker />} />

            {/* Vendor Portal */}
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />

            {/* Admin Dashboard */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/vendors" element={<AdminVendors />} />
            <Route path="/admin/events" element={<AdminEvents />} />
        </Routes>
    );
}

export default App;
