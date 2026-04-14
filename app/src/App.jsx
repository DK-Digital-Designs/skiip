import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Page imports
import LandingPage from './pages/LandingPage';
import AttendeeVendors from './pages/attendee/VendorList';
import AttendeeMenu from './pages/attendee/Menu';
import AttendeeCheckout from './pages/attendee/Checkout';
import AttendeeOrderTracker from './pages/attendee/OrderTracker';
import BuyerProfile from './pages/attendee/BuyerProfile';

import UnifiedLogin from './pages/shared/Login';
import UnifiedSignup from './pages/shared/Signup';

import VendorSignup from './pages/vendor/Signup';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';

import AdminDashboard from './pages/admin/DashboardV2';
import AdminVendors from './pages/admin/Vendors';
import AdminEvents from './pages/admin/Events';
import NotFound from './pages/NotFound';

import ProtectedRoute from './components/shared/ProtectedRoute';
import GlobalHeader from './components/shared/GlobalHeader';
import { ToastContainer } from './components/ui/Toast';

function App() {
    return (
        <>
            <GlobalHeader />
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Unified Auth */}
                <Route path="/login" element={<UnifiedLogin />} />
                <Route path="/signup" element={<UnifiedSignup />} />
                {/* Legacy redirects keep old links from breaking */}
                <Route path="/order/login" element={<UnifiedLogin />} />
                <Route path="/vendor/login" element={<UnifiedLogin />} />
                <Route path="/admin/login" element={<UnifiedLogin />} />

                {/* Buyer / Attendee Flow */}
                <Route path="/order" element={<AttendeeVendors />} />
                <Route path="/order/vendor/:vendorId" element={<AttendeeMenu />} />
                <Route path="/order/checkout" element={<AttendeeCheckout />} />
                <Route path="/order/track" element={<AttendeeOrderTracker />} />
                <Route path="/order/track/:orderId" element={<AttendeeOrderTracker />} />
                <Route path="/order/profile" element={<BuyerProfile />} />

                {/* Vendor Portal */}
                <Route path="/vendor/signup" element={<VendorSignup />} />
                <Route
                    path="/vendor/dashboard"
                    element={
                        <ProtectedRoute roles={['seller', 'admin']}>
                            <VendorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/vendor/products"
                    element={
                        <ProtectedRoute roles={['seller', 'admin']}>
                            <VendorProducts />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Dashboard */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/vendors"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminVendors />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/events"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminEvents />
                        </ProtectedRoute>
                    }
                />

                {/* 404 Catch-all */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer />
        </>
    );
}

export default App;
