import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Page imports
import LandingPage from './pages/LandingPage';
import AttendeeVendors from './pages/attendee/VendorList';
import AttendeeMenu from './pages/attendee/Menu';
import AttendeeCheckout from './pages/attendee/Checkout';
import AttendeeOrderTracker from './pages/attendee/OrderTracker';
import BuyerProfile from './pages/attendee/BuyerProfile';

import UnifiedLogin from './pages/shared/Login';
import UnifiedSignup from './pages/shared/Signup';
import ForgotPassword from './pages/shared/ForgotPassword';
import ResetPassword from './pages/shared/ResetPassword';
import ReportIssue from './pages/shared/ReportIssue';

import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorProfile from './pages/vendor/Profile';

import AdminDashboard from './pages/admin/DashboardV2';
import AdminOrders from './pages/admin/Orders';
import AdminVendors from './pages/admin/Vendors';
import AdminEvents from './pages/admin/Events';
import AdminSettings from './pages/admin/Settings';
import AdminIssues from './pages/admin/Issues';
import NotFound from './pages/NotFound';

import ProtectedRoute from './components/shared/ProtectedRoute';
import GlobalHeader from './components/shared/GlobalHeader';
import AppFooter from './components/shared/AppFooter';
import { ToastContainer } from './components/ui/Toast';
import { captureAnalyticsAttribution } from './lib/analytics';

function App() {
    const location = useLocation();
    const isBuyerFlow = location.pathname.startsWith('/order');

    React.useEffect(() => {
        captureAnalyticsAttribution();
    }, [location.key]);

    return (
        <>
            {!isBuyerFlow && <GlobalHeader />}
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Unified Auth */}
                <Route path="/login" element={<UnifiedLogin />} />
                <Route path="/signup" element={<UnifiedSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                    path="/report-issue"
                    element={
                        <ProtectedRoute roles={['buyer', 'seller']}>
                            <ReportIssue />
                        </ProtectedRoute>
                    }
                />
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
                <Route
                    path="/vendor/dashboard"
                    element={
                        <ProtectedRoute roles={['seller']}>
                            <VendorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/vendor/products"
                    element={
                        <ProtectedRoute roles={['seller']}>
                            <VendorProducts />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/vendor/profile"
                    element={
                        <ProtectedRoute roles={['seller']}>
                            <VendorProfile />
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
                    path="/admin/orders"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminOrders />
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
                <Route
                    path="/admin/issues"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminIssues />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminSettings />
                        </ProtectedRoute>
                    }
                />
                {/* 404 Catch-all */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            <AppFooter />
            <ToastContainer />
            <Analytics />
            <SpeedInsights />
        </>
    );
}

export default App;
