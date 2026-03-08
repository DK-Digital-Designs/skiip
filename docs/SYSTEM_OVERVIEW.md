# Skiip System Overview

## Dashboards & Core Infrastructure
The system requires three main dashboards and robust infrastructure components.

### Core Infrastructure
- **Auth**: Secure authentication handling (Google, Apple, etc.).
- **Databases**: Scalable data storage.
- **Global Hosting**: Hosting platform capable of supporting a high volume of users ("tons of users").

## Payment & Commerce
- **Payment Gateways**: Integration with Stripe and potentially others.
- **Live Ordering System**:
  - Real-time updates.
  - Customer history.
- **Order Tracking**: End-to-end status tracking for orders.

## User Roles & Interfaces

### 1. Client
- **Ordering System**: User-facing application for browsing menus and placing orders.

### 3. Vendor
- **Vendor Dashboard**:
  - View incoming orders.
  - Update order status.
  - Complete, reject, or manage orders.
  - **Notifications**: Integration with WhatsApp API to send notifications regarding order pickups.

### 4. Organisers
- **Management Dashboard**:
  - **Manage Events**: View and control all events.
  - **Manage Vendors**: Oversee vendor accounts.
  - **Statistics**: Service-level stats relating to vendors.
- **Analytics & Marketing**:
  - View marketing information.
  - Monitor total orders placed.
  - Comprehensive analytics views.

## Connections & Tech Stack Attributes
- **Authentication**: Google, Apple, etc.
- **API**: Backend API layer.
- **Database**: Persistent storage implementation.
- **WhatsApp API**: Messaging integration.
- **Stripe**: Payment processing.
- **Bot Detection**: Security and spam prevention.
- **Hosting**: High-scale global hosting platform.
