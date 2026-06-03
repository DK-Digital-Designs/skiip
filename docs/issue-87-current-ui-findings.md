# Issue 87 Current UI Findings

- Buyer menu add-to-cart currently works from `app/src/pages/attendee/Menu.jsx` by calling `useCart().addItem(product)` directly for every simple product. Quantity lookup uses `cart.find((item) => item.id === itemId)`, so the screen assumes one product maps to one cart line.
- Cart state in `app/src/lib/hooks/useCart.js` stores persisted local lines as product-shaped objects with `id`, `name`, `price`, `store_id`, and `quantity`. Add, increment, decrement, and remove are keyed by `product.id`.
- Checkout in `app/src/pages/attendee/Checkout.jsx` renders each cart item by `item.id`, calculates totals from `item.price * item.quantity`, and sends the whole cart to `OrderService.createOrder`.
- Checkout payload creation in `app/src/lib/services/order.service.js` strips cart lines down to `{ product_id: item.id, quantity }`; there is no modifier or line-note payload today.
- Vendor dashboard order views render `order.order_items` directly and display only quantity, product snapshot name, and line total.
- Buyer order tracker renders `order.order_items` directly and displays only quantity, product snapshot name, and line total.
- Admin order details currently focus on payment details. Recent orders do not fetch order items, so item-level modifier display needs either embedded mock/future data or a later query expansion.
- UI areas that need modifier-aware rendering are buyer menu details/configuration, sticky cart preview, checkout summary, vendor fulfilment cards, buyer tracker summaries, admin expanded order details, and vendor product editing.
