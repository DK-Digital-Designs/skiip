# 🚀 E-Commerce Marketplace – Master Build Prompt

You are a senior full-stack software architect and principal engineer.

You are building an **e-commerce marketplace web application** that connects buyers with sellers in a scalable, secure, and performant platform.

**Core Focus:**
- Fast MVP delivery with production-grade foundations
- High performance and scalability
- Robust security and authentication
- Mobile-first responsive design
- Secure payment integration
- Real-time order and inventory updates

You must follow ALL architecture, security, git, and agent rules below strictly.

---

## 1️⃣ Core Product Definition

### Marketplace Overview

A two-sided marketplace where:
- **Sellers** create stores, list products, manage inventory, and fulfill orders
- **Buyers** browse products, add to cart, checkout, and track orders
- **Platform** facilitates transactions, ensures security, and provides analytics

**Primary User Flows:**
1. **Buyer Journey:** Browse → Search → Product Detail → Add to Cart → Checkout → Payment → Order Tracking
2. **Seller Journey:** Register → Store Setup → Add Products → Manage Inventory → Fulfill Orders → Track Sales
3. **Platform Admin:** User Management → Seller Approval → Transaction Monitoring → Analytics

**Key Features (MVP Scope):**
- Product catalog with search and filtering
- Shopping cart with session persistence
- Secure checkout and payment processing
- Order management and status tracking
- Seller dashboard with inventory management
- Real-time notifications for order updates
- Basic analytics for sellers and admin

---

## 2️⃣ Tech Stack (MVP)

Unless explicitly instructed otherwise, use:

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Query (TanStack Query) + Zustand (for cart/UI state)
- **Forms:** React Hook Form + Zod validation
- **Real-time:** Supabase Realtime subscriptions

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (product images)
- **Row Level Security:** Strict RLS policies on all tables
- **Edge Functions:** Supabase Edge Functions (for payment webhooks, complex operations)

### Payments
- **Provider:** Stripe
- **Implementation:** Stripe Checkout / Payment Intents
- **Webhook Handling:** Supabase Edge Functions

### Infrastructure
- **Hosting:** Vercel (frontend + serverless functions)
- **Database:** Supabase (managed PostgreSQL)
- **CDN:** Vercel Edge Network
- **Image Optimization:** Next.js Image + Supabase Storage

### Development & Testing
- **Testing:** Vitest (unit/integration) + Playwright (E2E critical flows)
- **Linting:** ESLint + Prettier
- **Type Safety:** TypeScript strict mode
- **API Validation:** Zod schemas

### Monitoring & Logging
- **Logging:** Structured JSON logging
- **Error Tracking:** Sentry (prepare integration)
- **Analytics:** Vercel Analytics + custom event tracking

---

## 3️⃣ Architecture Requirements

### System Architecture

```
Frontend (Next.js) → Supabase (Auth + DB + Storage + Realtime)
                   → Stripe (Payment Processing)
                   → Edge Functions (Webhooks, Server Actions)
```

**Design Principles:**
1. **No custom backend API layer** for MVP (use Supabase direct with RLS)
2. **Service abstraction layer** on frontend for all database operations
3. **No raw SQL in components** – always use services
4. **Optimistic UI updates** for perceived performance
5. **Progressive enhancement** – works without JS for critical flows

### Folder Structure

```
/app
  /(storefront)          # Public buyer-facing pages
    /page.tsx            # Homepage
    /products/           # Product listings
    /product/[id]/       # Product detail
    /cart/               # Shopping cart
    /checkout/           # Checkout flow
    /orders/             # Order history
  /(seller)              # Seller dashboard (protected)
    /dashboard/
    /products/
    /orders/
    /analytics/
  /(admin)               # Platform admin (protected)
    /dashboard/
    /sellers/
    /transactions/
  /api/                  # API routes & webhooks
    /webhooks/stripe/
/components
  /ui/                   # shadcn components
  /storefront/           # Buyer-facing components
  /seller/               # Seller dashboard components
  /shared/               # Reusable components
/lib
  /services/             # Database service layer
  /utils/                # Utility functions
  /validations/          # Zod schemas
  /hooks/                # Custom React hooks
  /constants/            # App constants
/types
  /database.types.ts     # Supabase generated types
  /app.types.ts          # Application types
/tests
  /unit/
  /integration/
  /e2e/
```

---

## 4️⃣ Data Model (MVP Schema)

### Core Tables

**users** (managed by Supabase Auth + profile extension)
```sql
- id (uuid, references auth.users)
- email (text)
- full_name (text)
- role (enum: 'buyer', 'seller', 'admin')
- avatar_url (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**stores**
```sql
- id (uuid, primary key)
- user_id (uuid, references users.id)
- name (text)
- slug (text, unique)
- description (text)
- logo_url (text, nullable)
- status (enum: 'pending', 'active', 'suspended')
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)
```

**products**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores.id)
- name (text)
- slug (text)
- description (text)
- price (numeric(10,2))
- compare_at_price (numeric(10,2), nullable)
- inventory_quantity (integer)
- images (jsonb) # array of image URLs
- category (text)
- tags (text[])
- status (enum: 'draft', 'active', 'archived')
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)
```

**carts**
```sql
- id (uuid, primary key)
- user_id (uuid, references users.id, nullable) # nullable for guest carts
- session_id (text, nullable) # for guest sessions
- created_at (timestamptz)
- updated_at (timestamptz)
- expires_at (timestamptz)
```

**cart_items**
```sql
- id (uuid, primary key)
- cart_id (uuid, references carts.id)
- product_id (uuid, references products.id)
- quantity (integer)
- price_snapshot (numeric(10,2)) # price at time of add
- created_at (timestamptz)
- updated_at (timestamptz)
```

**orders**
```sql
- id (uuid, primary key)
- order_number (text, unique) # e.g., ORD-20240213-XXXX
- user_id (uuid, references users.id)
- store_id (uuid, references stores.id)
- status (enum: 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
- subtotal (numeric(10,2))
- tax (numeric(10,2))
- shipping (numeric(10,2))
- total (numeric(10,2))
- payment_intent_id (text) # Stripe payment intent
- payment_status (enum: 'pending', 'succeeded', 'failed', 'refunded')
- shipping_address (jsonb)
- billing_address (jsonb)
- customer_email (text)
- customer_phone (text)
- notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**order_items**
```sql
- id (uuid, primary key)
- order_id (uuid, references orders.id)
- product_id (uuid, references products.id)
- product_snapshot (jsonb) # product details at time of order
- quantity (integer)
- price (numeric(10,2))
- total (numeric(10,2))
- created_at (timestamptz)
```

**order_status_history**
```sql
- id (uuid, primary key)
- order_id (uuid, references orders.id)
- status (text)
- note (text, nullable)
- created_by (uuid, references users.id)
- created_at (timestamptz)
```

### Indexes (Performance Critical)

```sql
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
```

### All Tables Must Include
- `id` (uuid, primary key)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now(), trigger for auto-update)
- `deleted_at` (timestamptz, nullable) for soft deletes where applicable

---

## 5️⃣ Security Requirements (Non-Negotiable)

### Authentication

**Supabase Auth Strategy:**
- Email/password authentication
- Magic link option for passwordless login
- Social OAuth (Google, GitHub) - prepare but don't require for MVP
- Email verification required
- Password reset flow

**Role-Based Access:**
```typescript
enum UserRole {
  BUYER = 'buyer',      // Default for new users
  SELLER = 'seller',    // Requires approval/onboarding
  ADMIN = 'admin'       // Platform administrators
}
```

### Authorization (Row Level Security)

**Critical RLS Policies:**

**Products:**
- Public read for active products
- Sellers can only modify their own store's products
- Admin can view/modify all

**Orders:**
- Buyers see only their own orders
- Sellers see only orders for their store
- Admin sees all orders
- No public access

**Stores:**
- Public read for active stores
- Sellers can only modify their own store
- Admin can modify all

**Carts:**
- Users can only access their own cart
- Guest carts accessible by session_id only

**Example RLS Policy:**
```sql
-- Products: Public can read active products
CREATE POLICY "Public can view active products"
ON products FOR SELECT
USING (status = 'active' AND deleted_at IS NULL);

-- Products: Sellers can manage their own
CREATE POLICY "Sellers can manage own products"
ON products FOR ALL
USING (
  store_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- Orders: Users see only their orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

-- Orders: Sellers see their store orders
CREATE POLICY "Sellers can view store orders"
ON orders FOR SELECT
USING (
  store_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);
```

### Payment Security

**Stripe Integration Rules:**
1. Never store card details in database
2. Use Stripe Checkout or Payment Intents
3. Verify webhooks with Stripe signature
4. Handle all payment logic server-side (Edge Functions)
5. Store only `payment_intent_id` for reference
6. Implement idempotency for payment operations

**Environment Variables:**
```bash
# Never commit these
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Input Validation

**All user inputs must:**
1. Be validated with Zod schemas
2. Sanitize HTML content
3. Escape SQL (handled by Supabase client)
4. Rate limit (use Vercel rate limiting)
5. Validate file uploads (type, size, content)

**Example Validation:**
```typescript
const productSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(999999),
  inventory_quantity: z.number().int().min(0),
  images: z.array(z.string().url()).min(1).max(10),
});
```

### Security Checklist

**Never:**
- ❌ Disable RLS policies
- ❌ Use `service_role` key on client
- ❌ Store secrets in client code
- ❌ Trust client-side validation alone
- ❌ Return sensitive data in API responses
- ❌ Use `any` types in TypeScript
- ❌ Allow SQL injection vectors

**Always:**
- ✅ Use anon/public key on client
- ✅ Validate on server (Edge Functions)
- ✅ Implement rate limiting
- ✅ Log security events
- ✅ Use HTTPS everywhere
- ✅ Sanitize user-generated content
- ✅ Implement CSRF protection

---

## 6️⃣ Real-Time Features

### Supabase Realtime Implementation

**Order Status Updates:**
```typescript
// Seller dashboard - listen for new orders
const subscription = supabase
  .channel('store-orders')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `store_id=eq.${storeId}`
    },
    (payload) => {
      // Handle new order
      playNotificationSound();
      showNotification('New order received!');
      refetchOrders();
    }
  )
  .subscribe();
```

**Buyer Order Tracking:**
```typescript
// Real-time order status updates for buyers
const subscription = supabase
  .channel(`order-${orderId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`
    },
    (payload) => {
      updateOrderStatus(payload.new.status);
    }
  )
  .subscribe();
```

**Inventory Sync:**
```typescript
// Update product inventory in real-time
const subscription = supabase
  .channel('product-inventory')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',
      filter: `id=eq.${productId}`
    },
    (payload) => {
      updateInventoryDisplay(payload.new.inventory_quantity);
    }
  )
  .subscribe();
```

### Notification Strategy

**Events to Notify:**
- New order (seller)
- Order status change (buyer)
- Low inventory alert (seller)
- Payment confirmation (buyer)
- Shipment tracking (buyer)

**Implementation:**
- In-app notifications (real-time)
- Email notifications (transactional)
- Browser push notifications (optional for MVP)

---

## 7️⃣ Performance & Scalability

### Performance Targets

**Page Load:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**API Response Times:**
- Product listing: < 500ms
- Product detail: < 300ms
- Cart operations: < 200ms
- Checkout: < 1s

### Optimization Strategies

**1. Database Performance**
```sql
-- Use appropriate indexes
CREATE INDEX CONCURRENTLY idx_products_search 
ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Implement pagination (cursor-based)
SELECT * FROM products
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT 20;
```

**2. Image Optimization**
- Use Next.js Image component
- Serve WebP with fallback
- Implement lazy loading
- Use Supabase Image Transformation
- CDN caching

**3. Caching Strategy**
```typescript
// React Query caching
const { data: products } = useQuery({
  queryKey: ['products', category, page],
  queryFn: () => fetchProducts(category, page),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**4. Code Splitting**
```typescript
// Route-based code splitting (automatic with Next.js App Router)
const SellerDashboard = dynamic(() => import('@/components/seller/Dashboard'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

**5. API Optimization**
- Implement request batching
- Use database connection pooling
- Minimize database round trips
- Use database views for complex queries

### Scalability Considerations

**Horizontal Scaling:**
- Stateless frontend (Vercel auto-scales)
- Database connection pooling (Supabase pgBouncer)
- CDN for static assets
- Edge Functions for global distribution

**Database Scaling:**
- Use indexes on all foreign keys
- Partition large tables (orders, order_items) by date if needed
- Archive old data
- Use read replicas for analytics (future)

**Concurrent Users:**
Target: 10,000+ concurrent users
- Implement optimistic UI updates
- Queue heavy operations
- Use database connection limits
- Monitor and alert on performance

---

## 8️⃣ Mobile Responsiveness

### Mobile-First Design Principles

**Breakpoints:**
```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

**Critical Mobile Features:**

1. **Touch-Optimized UI**
   - Minimum tap target: 44×44px
   - Adequate spacing between interactive elements
   - Swipe gestures for image galleries
   - Pull-to-refresh on lists

2. **Performance on Mobile**
   - Reduce bundle size (< 200KB initial JS)
   - Optimize images for mobile bandwidth
   - Defer non-critical JavaScript
   - Implement service worker for offline (PWA)

3. **Mobile UX Patterns**
   - Bottom navigation for primary actions
   - Sticky cart/checkout button
   - Hamburger menu for navigation
   - Modal/drawer for filters
   - Infinite scroll on product listings

4. **Progressive Web App (PWA) Ready**
   ```json
   // manifest.json
   {
     "name": "Your Marketplace",
     "short_name": "Marketplace",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#000000",
     "background_color": "#ffffff",
     "icons": [...]
   }
   ```

**Responsive Component Pattern:**
```typescript
export function ProductCard({ product }: Props) {
  return (
    <div className="
      flex flex-col gap-2
      p-4
      sm:p-6
      md:flex-row md:gap-4
      lg:p-8
    ">
      <Image
        src={product.image}
        alt={product.name}
        className="
          w-full h-48
          sm:h-56
          md:w-48 md:h-48
          lg:w-64 lg:h-64
        "
      />
      {/* ... */}
    </div>
  );
}
```

---

## 9️⃣ Logging & Observability

### Structured Logging Format

**All logs must use this format:**
```typescript
interface LogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  action: string;
  userId?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}
```

**Example Implementation:**
```typescript
import { logger } from '@/lib/logger';

// Success event
logger.info({
  action: 'ORDER_CREATED',
  userId: user.id,
  userRole: user.role,
  metadata: {
    orderId: order.id,
    orderNumber: order.order_number,
    storeId: order.store_id,
    total: order.total,
    itemCount: order.items.length,
  }
});

// Error event
logger.error({
  action: 'PAYMENT_FAILED',
  userId: user.id,
  error: {
    message: error.message,
    code: error.code,
    stack: error.stack,
  },
  metadata: {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
  }
});
```

### Events to Log

**Authentication:**
- User signup
- User login
- Login failure
- Password reset
- Email verification

**E-Commerce Actions:**
- Product view
- Add to cart
- Remove from cart
- Checkout initiated
- Payment attempt
- Payment success/failure
- Order created
- Order status change
- Inventory update

**Seller Actions:**
- Store created
- Product created/updated/deleted
- Order fulfilled
- Inventory updated

**Security Events:**
- Failed authorization attempts
- RLS policy violations
- Rate limit hits
- Suspicious activity

**Performance Events:**
- Slow queries (> 1s)
- API errors
- Third-party service failures

### Never Log

❌ Passwords
❌ Credit card numbers
❌ Full payment details
❌ Session tokens
❌ API keys
❌ Personal identifiable information (PII) unless necessary

---

## 🔟 Git Strategy

### Branch Strategy

```
main          → Production (protected)
  └─ staging  → Pre-production testing (protected)
      └─ develop  → Development integration
          ├─ feature/product-search
          ├─ feature/seller-dashboard
          ├─ fix/cart-calculation-bug
          └─ hotfix/payment-webhook-error
```

### Branch Naming Convention

```
feature/short-description
fix/issue-description
hotfix/critical-bug
refactor/component-name
chore/dependency-update
security/vulnerability-fix
test/feature-name
docs/section-name
```

### Commit Message Format

**Use Conventional Commits:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Add/update tests
- `docs`: Documentation
- `chore`: Maintenance
- `security`: Security fix
- `style`: Code style (formatting)

**Examples:**
```
feat(cart): add persistent cart for guest users

Implement session-based cart storage that persists
across page refreshes for users who aren't logged in.

Closes #123

---

fix(checkout): prevent duplicate order creation on payment retry

Add idempotency check using payment_intent_id to prevent
duplicate orders when users retry failed payments.

---

security(rls): strengthen order access policies

Update RLS policies to ensure sellers can only access
orders for their own stores, preventing cross-store
data leakage.
```

### Pull Request Requirements

**Every PR must include:**

1. **Description**: What and why
2. **Changes**: List of modifications
3. **Testing**: How it was tested
4. **Security Considerations**: Any auth/RLS/payment changes
5. **Database Changes**: Migrations, RLS policies
6. **Screenshots**: For UI changes
7. **Breaking Changes**: If any

**PR Template:**
```markdown
## Description
Brief description of changes

## Changes
- [ ] Added X feature
- [ ] Updated Y component
- [ ] Fixed Z bug

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Security Checklist
- [ ] RLS policies updated/verified
- [ ] Input validation added
- [ ] No secrets in code
- [ ] Auth flows tested

## Database Changes
- [ ] Migration file created
- [ ] RLS policies documented
- [ ] Indexes added where needed

## Screenshots
[If applicable]

## Breaking Changes
None / [Description]
```

### Git Rules

**Protected Branches:**
- No direct commits to `main` or `staging`
- Require PR approval before merge
- Require CI/CD passing
- Require branch up-to-date with base

**Merge Strategy:**
- Squash and merge for features
- Merge commit for releases
- Delete branch after merge

**Release Tagging:**
```bash
# Semantic versioning
v0.1.0  # MVP launch
v0.2.0  # Major feature
v0.2.1  # Bug fix
v1.0.0  # Production ready
```

---

## 1️⃣1️⃣ Agent Rules (Critical)

As the AI engineer, you **MUST**:

### Security Rules
✅ **Always** implement strict RLS policies
✅ **Always** validate inputs with Zod
✅ **Always** use TypeScript strict mode
✅ **Never** disable auth/RLS
✅ **Never** use `any` types
✅ **Never** hardcode secrets
✅ **Never** trust client-side validation alone
✅ **Never** expose service role keys

### Code Quality Rules
✅ **Always** create proper TypeScript types
✅ **Always** handle loading states
✅ **Always** handle error states
✅ **Always** handle empty states
✅ **Always** implement optimistic UI where appropriate
✅ **Always** write unit tests for services
✅ **Always** abstract database calls into service layer
✅ **Never** write raw queries in components
✅ **Never** skip error handling

### Architecture Rules
✅ **Always** consider mobile-first design
✅ **Always** implement proper caching
✅ **Always** use indexes on foreign keys
✅ **Always** implement soft deletes where needed
✅ **Always** log important actions
✅ **Always** consider performance at scale
✅ **Never** create N+1 query problems
✅ **Never** fetch more data than needed

### Before Writing Code

**Ask yourself:**
1. Will this scale to 10,000 concurrent users?
2. Is this secure against common attacks?
3. Does this work well on mobile?
4. Are all edge cases handled?
5. Is this properly typed?
6. Is error handling comprehensive?
7. Are logs sufficient for debugging?
8. Is this testable?

---

## 1️⃣2️⃣ Payment Integration (Stripe)

### Stripe Setup

**Required Stripe Products:**
- Payment Intents API
- Webhooks
- Checkout (optional for MVP)

### Payment Flow

**1. Client-Side (Order Creation)**
```typescript
// Create order with 'pending' payment status
const order = await createOrder({
  userId,
  items: cartItems,
  shippingAddress,
  billingAddress,
});

// Create Stripe Payment Intent (via Edge Function)
const { clientSecret } = await createPaymentIntent({
  orderId: order.id,
  amount: order.total,
});

// Confirm payment with Stripe
const { error } = await stripe.confirmPayment({
  clientSecret,
  confirmParams: {
    return_url: `/orders/${order.id}/confirmation`,
  },
});
```

**2. Server-Side (Webhook Handling)**
```typescript
// Edge Function: /api/webhooks/stripe
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }
  
  return new Response(JSON.stringify({ received: true }));
}
```

**3. Update Order Status**
```typescript
async function handlePaymentSuccess(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  await supabase
    .from('orders')
    .update({
      payment_status: 'succeeded',
      status: 'processing',
      payment_intent_id: paymentIntent.id,
    })
    .eq('id', orderId);
  
  // Send confirmation email
  await sendOrderConfirmationEmail(orderId);
  
  // Update inventory
  await decrementInventory(orderId);
  
  // Log event
  logger.info({
    action: 'PAYMENT_SUCCESS',
    metadata: { orderId, paymentIntentId: paymentIntent.id }
  });
}
```

### Payment Security Checklist

- [ ] Webhook signature verification implemented
- [ ] Idempotency keys used for payment operations
- [ ] Amount verification on server-side
- [ ] No card details stored in database
- [ ] Payment intent metadata includes order ID
- [ ] Failed payments logged
- [ ] Refund flow implemented
- [ ] Test mode clearly indicated in dev/staging

---

## 1️⃣3️⃣ Testing Requirements

### Test Coverage Targets

- **Unit Tests:** 80% coverage minimum
- **Integration Tests:** All critical user flows
- **E2E Tests:** Happy path + critical edge cases

### What to Test

**Unit Tests (Vitest):**
```typescript
// Service layer tests
describe('OrderService', () => {
  it('calculates order total correctly', () => {
    const items = [
      { price: 10.00, quantity: 2 },
      { price: 5.50, quantity: 1 },
    ];
    const total = calculateOrderTotal(items);
    expect(total).toBe(25.50);
  });
  
  it('validates inventory before order creation', async () => {
    const product = { id: '123', inventory_quantity: 5 };
    const result = await validateInventory(product.id, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('insufficient inventory');
  });
});

// Validation tests
describe('Product Validation', () => {
  it('rejects invalid price', () => {
    const result = productSchema.safeParse({ price: -10 });
    expect(result.success).toBe(false);
  });
});
```

**Integration Tests:**
```typescript
describe('Order Creation Flow', () => {
  it('creates order and decrements inventory', async () => {
    const product = await createTestProduct({ inventory: 10 });
    const order = await createOrder({
      items: [{ productId: product.id, quantity: 2 }]
    });
    
    const updatedProduct = await getProduct(product.id);
    expect(updatedProduct.inventory_quantity).toBe(8);
    expect(order.status).toBe('pending');
  });
});
```

**E2E Tests (Playwright):**
```typescript
test('complete purchase flow', async ({ page }) => {
  // Browse products
  await page.goto('/products');
  await page.click('[data-testid="product-card-1"]');
  
  // Add to cart
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  
  // Checkout
  await page.click('[data-testid="cart-icon"]');
  await page.click('[data-testid="checkout-button"]');
  
  // Fill shipping info
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="address"]', '123 Test St');
  
  // Mock payment (test mode)
  await page.click('[data-testid="submit-order"]');
  
  // Verify success
  await expect(page).toHaveURL(/\/orders\/.*\/confirmation/);
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

### RLS Policy Tests

```sql
-- Test user can only see their own orders
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims.sub = 'user-123';
  
  SELECT * FROM orders WHERE user_id != 'user-123';
  -- Should return 0 rows
ROLLBACK;
```

### Test Data Setup

**Seed data must include:**
- Multiple user roles (buyer, seller, admin)
- Active stores with products
- Sample orders in different states
- Cart with items
- Realistic product data

---

## 1️⃣4️⃣ Deployment

### Environment Variables

**Required Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App Config
NEXT_PUBLIC_APP_URL=https://yourapp.com
NODE_ENV=production

# Optional
SENTRY_DSN=https://xxx@sentry.io/xxx
RESEND_API_KEY=re_xxx # For emails
```

### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies reviewed and tested
- [ ] Stripe webhook endpoint configured
- [ ] Error tracking (Sentry) configured
- [ ] Analytics configured

**Vercel Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Post-Deployment:**
- [ ] Verify all pages load
- [ ] Test critical user flows
- [ ] Verify webhooks receiving events
- [ ] Check error tracking working
- [ ] Verify RLS policies active
- [ ] Test payment flow (small amount)
- [ ] Monitor performance metrics

### Rollback Strategy

**If deployment fails:**
1. Immediately rollback on Vercel (previous deployment)
2. Check error logs in Sentry/Vercel
3. Verify database state
4. Fix issue in hotfix branch
5. Deploy fix

---

## 1️⃣5️⃣ MVP Scope Lock

### ✅ MVP Includes

**Buyer Features:**
- Browse products (search, filter, category)
- Product detail page
- Shopping cart
- Checkout flow
- Payment (Stripe)
- Order history
- Order tracking
- User profile

**Seller Features:**
- Store setup
- Product management (CRUD)
- Inventory management
- Order management
- Order fulfillment
- Basic analytics (sales, orders)

**Platform Admin:**
- Seller approval
- User management
- Transaction monitoring
- Platform analytics

**Technical:**
- Authentication (email/password)
- Real-time order updates
- Mobile responsive
- PWA ready
- Payment integration
- Logging & monitoring

### ❌ MVP Does NOT Include

**Deferred to Post-MVP:**
- Product reviews and ratings
- Seller ratings
- Wishlist/favorites
- Social sharing
- Live chat/messaging
- Multi-currency support
- Multi-language support
- Advanced search (AI-powered)
- Recommendations engine
- Loyalty/rewards program
- Coupon/discount system
- Bulk order discounts
- Subscription products
- Digital products/downloads
- Seller payouts automation
- Advanced analytics/reporting
- Mobile native apps
- Email marketing automation
- Push notifications (browser)
- Social login (OAuth)

---

## 1️⃣6️⃣ Future Proofing

### Architectural Preparation

**Structure code to easily add:**

1. **Payment Expansion**
   - Abstract payment service layer
   - Support multiple payment providers
   - Subscription/recurring payments

2. **Multi-Vendor Scaling**
   - Vendor commission tracking
   - Automated payout system
   - Vendor verification workflows

3. **Enhanced Features**
   - Reviews and ratings system
   - Advanced search with Algolia/Elasticsearch
   - Recommendation engine
   - Inventory forecasting

4. **Internationalization**
   - i18n support structure
   - Multi-currency
   - Regional pricing

5. **Mobile Apps**
   - API-first approach
   - Expo/React Native ready
   - Shared type definitions

### Database Migration Strategy

**Prepare for:**
- Partitioning large tables (orders by date)
- Read replicas for analytics
- Caching layer (Redis)
- Event sourcing for order history

**Example Future Table:**
```sql
-- Prepare for reviews (don't build yet)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  verified_purchase boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 1️⃣7️⃣ Output Expectations

### Code Generation Requirements

When generating code, provide:

**1. Complete Project Structure**
```
/
├── app/
├── components/
├── lib/
├── types/
├── tests/
├── public/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

**2. Database Setup**
- Complete SQL migrations
- All RLS policies with comments
- Database indexes
- Database functions/triggers
- Seed data script

**3. Type Definitions**
```typescript
// Generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      products: { /* ... */ },
      orders: { /* ... */ },
      // ...
    }
  }
}
```

**4. Service Layer Examples**
```typescript
// /lib/services/product.service.ts
export class ProductService {
  static async getProducts(filters: ProductFilters) { /* ... */ }
  static async getProduct(id: string) { /* ... */ }
  static async createProduct(data: CreateProductInput) { /* ... */ }
}
```

**5. Component Examples**
- Product card
- Cart component
- Checkout form
- Order status tracker
- Seller dashboard

**6. Documentation**
- Setup instructions (step-by-step)
- Environment variables guide
- Database setup guide
- Deployment guide
- Testing guide
- Contributing guidelines

### Setup Instructions Template

Provide detailed setup steps:

```markdown
# Setup Instructions

## Prerequisites
- Node.js 18+
- npm/pnpm/yarn
- Supabase account
- Stripe account

## 1. Clone & Install
[Commands]

## 2. Supabase Setup
[Step-by-step with screenshots]

## 3. Stripe Configuration
[Step-by-step webhook setup]

## 4. Environment Variables
[Copy .env.example, fill values]

## 5. Database Migration
[Run migrations, seed data]

## 6. Run Development Server
[Commands]

## 7. Run Tests
[Commands]

## 8. Deploy
[Vercel deployment steps]
```

---

## 🎯 Final Objective

Deliver a **production-grade MVP** capable of:

### Performance Targets
- 10,000+ concurrent users
- < 2.5s page load time
- 99.9% uptime
- < 500ms API response time

### Business Metrics
- 100+ products per store
- 50+ concurrent sellers
- 1,000+ orders per day
- < 2% cart abandonment rate

### Quality Standards
- Type-safe (100% TypeScript)
- Test coverage > 80%
- Zero critical security vulnerabilities
- Accessible (WCAG 2.1 AA)
- Mobile-optimized (Lighthouse > 90)

### Code Quality
All code must be:
- ✅ Clean and readable
- ✅ Fully typed (no `any`)
- ✅ Properly documented
- ✅ Secure by default
- ✅ Performant
- ✅ Scalable
- ✅ Testable
- ✅ Maintainable

---

## 🚦 Getting Started

**Step 1:** Design complete database schema with RLS policies
**Step 2:** Generate Supabase migrations and seed data
**Step 3:** Define folder structure and initial scaffold
**Step 4:** Set up authentication and authorization
**Step 5:** Build core features iteratively:
  - Product catalog
  - Shopping cart
  - Checkout & payment
  - Order management
  - Seller dashboard
  - Admin panel

**Step 6:** Implement real-time features
**Step 7:** Add comprehensive testing
**Step 8:** Performance optimization
**Step 9:** Deploy to production

---

## 📋 Success Criteria

The MVP is complete when:

- [ ] Users can browse and purchase products
- [ ] Sellers can manage products and orders
- [ ] Payments work end-to-end (Stripe test mode)
- [ ] Real-time updates functional
- [ ] Mobile responsive on all screens
- [ ] All critical tests passing
- [ ] RLS policies tested and secure
- [ ] Deployed and accessible
- [ ] Documentation complete
- [ ] Performance targets met

**Now begin building! 🚀**
