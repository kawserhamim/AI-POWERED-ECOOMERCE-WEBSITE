# E-Commerce Backend (Node.js / Express / MongoDB)

A consolidated Express + MongoDB backend for a full e-commerce site: auth,
products, cart, orders, payments, reviews, and an admin role. All endpoints
are mounted on a single Node process.

## Setup

```bash
npm install
cp .env.example .env   # then edit secrets
npm run seed           # seeds products + default admin (ADMIN_EMAIL/ADMIN_PASSWORD)
npm start              # http://localhost:8000
```

Default admin (from `.env`):

```
email:    admin@example.com
password: Admin@12345
```

Change `ADMIN_PASSWORD` in `.env` and re-run `npm run seed` for production.

## Environment variables

| Var              | Default                                   | Purpose                          |
|------------------|-------------------------------------------|----------------------------------|
| `PORT`           | `8000`                                    | HTTP port                        |
| `MONGO_URL`      | `mongodb://localhost:27017/ecommerce_db`  | MongoDB connection string        |
| `JWT_SECRET`     | `supersecretkey`                          | **Change in production**         |
| `JWT_EXPIRES_IN` | `7d`                                      | Token lifetime                   |
| `ADMIN_EMAIL`    | `admin@example.com`                       | Default admin email (seed)       |
| `ADMIN_PASSWORD` | `Admin@12345`                             | Default admin password (seed)    |
| `APP_NAME`       | `ShopEasy`                                | Branding in 2FA codes             |
| `FRONTEND_URL`   | `http://localhost:5173`                   | Used in auth redirects           |
| `STORE_ID`       | —                                         | SSLCommerz sandbox/live store ID |
| `STORE_PASSWD`    | —                                         | SSLCommerz store password       |
| `IS_LIVE`        | `false`                                    | `true` for production gateway   |
| `BACKEND_URL`    | auto-derived                               | Public backend URL for callbacks |
| `SSL_COMMERZ_CURRENCY` | `BDT`                               | Currency sent to SSLCommerz     |

## API reference

All paths are relative to `http://localhost:8000`. Protected routes require
`Authorization: Bearer <token>`.

### Auth — `/auth`

| Method | Path                  | Auth   | Description                              |
|--------|-----------------------|--------|------------------------------------------|
| POST   | `/auth/register`      | —      | Register a new user                      |
| POST   | `/auth/login`         | —      | Log in, returns `{ token, user }` or a 2FA challenge |
| POST   | `/auth/login/2fa`     | —      | Complete 2FA sign-in with a challenge token |
| GET    | `/auth/me`            | user   | Get current user                         |
| PUT    | `/auth/me`            | user   | Update `name` or `shippingAddress`       |
| PUT    | `/auth/change-password` | user | Change password                          |
| GET    | `/auth/2fa/setup`     | user   | Generate authenticator QR code           |
| POST   | `/auth/2fa/enable`    | user   | Verify and enable authenticator login    |
| POST   | `/auth/2fa/disable`   | user   | Disable authenticator login              |
| GET    | `/auth`               | admin  | List all users                           |

Registration is direct: `/auth/register` creates the user synchronously and returns `{ token, user }`. There is no email verification step or background queue.

### Products — `/products`

| Method | Path                                  | Auth   | Description |
|--------|---------------------------------------|--------|-------------|
| GET    | `/products`                           | —      | List with filters: `category`, `brand`, `search`, `minPrice`, `maxPrice`, `sort` (`newest`\|`oldest`\|`price-asc`\|`price-desc`\|`rating-desc`\|`name-asc`), `page`, `limit`, `featured=true` |
| GET    | `/products/featured`                  | —      | Top 8 by rating |
| GET    | `/products/categories`                | —      | Distinct `categories` and `brands` |
| GET    | `/products/by-ids?ids=a,b,c`          | —      | Bulk fetch for cart/checkout |
| GET    | `/products/:id`                       | —      | Product detail (specs, good sides, images, rating) |
| POST   | `/products`                           | admin  | Create a product |
| PUT    | `/products/:id`                       | admin  | Update a product |
| DELETE | `/products/:id`                       | admin  | Delete a product |
| GET    | `/products/:productId/reviews`        | —      | List reviews for a product |
| POST   | `/products/:productId/reviews`        | user   | Create review (one per user per product); auto-recomputes product rating |
| PUT    | `/products/:productId/reviews/:rid`   | owner  | Edit own review |
| DELETE | `/products/:productId/reviews/:rid`   | owner/admin | Delete a review (restocks rating) |

### Cart — `/cart`  (all require auth)

| Method | Path                          | Description |
|--------|-------------------------------|-------------|
| GET    | `/cart`                       | Get current cart with subtotal |
| POST   | `/cart/items`                 | Add `{ productId, quantity }` |
| PUT    | `/cart/items/:productId`      | Update quantity |
| DELETE | `/cart/items/:productId`      | Remove item |
| DELETE | `/cart`                       | Clear cart |

Cart responses are decorated with the live product snapshot and a per-line
`lineTotal` plus cart `subtotal`.

### Orders — `/orders`  (all require auth)

| Method | Path                  | Auth   | Description |
|--------|-----------------------|--------|-------------|
| POST   | `/orders`             | user   | Create order from `{ items: [{productId, quantity}], shippingAddress? }`. Validates stock, decrements stock, computes subtotal + $5 shipping + 8% tax. |
| GET    | `/orders/mine`        | user   | List current user's orders |
| GET    | `/orders`             | admin  | List all orders (filter `?status=`, `?userId=`) |
| GET    | `/orders/:id`         | owner/admin | Get one order |
| PUT    | `/orders/:id/cancel`   | owner  | Cancel own order (only if `created` or `processing`); restocks items |
| PUT    | `/orders/:id/status`  | admin  | Update status; restocks items when moving to `cancelled` |

### Payments — `/payments`  (all require auth)

| Method | Path                  | Auth   | Description |
|--------|-----------------------|--------|-------------|
| POST   | `/payments`           | user   | Start a payment for `{ orderId, method? }`. `sslcommerz` returns `{ payment, gatewayUrl }` for redirect-based checkout; `cod` still creates a completed local payment record. |
| GET    | `/payments/mine`      | user   | List current user's payments |
| GET    | `/payments`           | admin  | List all payments (filter `?status=`) |
| GET    | `/payments/:id`       | owner/admin | Get one payment |
| PUT    | `/payments/:id/refund`| admin  | Mark a successful payment as `refunded` |
| GET    | `/payments/sslcommerz/success` | public | SSLCommerz success callback; validates and redirects into the frontend result page |
| GET    | `/payments/sslcommerz/fail`    | public | SSLCommerz fail callback; redirects into the frontend result page |
| GET    | `/payments/sslcommerz/cancel`  | public | SSLCommerz cancel callback; redirects into the frontend result page |
| POST   | `/payments/sslcommerz/ipn`     | public | SSLCommerz IPN callback |

### Health

`GET /health` — `{ status, service, uptime, timestamp }`.

## Example flow

```bash
# 1) register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123","name":"Jane"}'

# 2) browse
curl 'http://localhost:8000/products?category=Smartphone&sort=price-asc&page=1&limit=10'

# 3) add to cart
curl -X POST http://localhost:8000/cart/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":"<id>","quantity":2}'

# 4) place order
curl -X POST http://localhost:8000/orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<id>","quantity":2}]}'

# 5) pay for the order
curl -X POST http://localhost:8000/payments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"orderId":"<orderId>"}'

# 6) leave a review
curl -X POST http://localhost:8000/products/<productId>/reviews \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Excellent phone!"}'
```

## Security / hardening checklist (next steps)

- Add `helmet`, `cors`, and `express-rate-limit` to `server.js` and set
  `CORS_ORIGIN` in `.env`.
- Move cart/order/payment writes into MongoDB transactions.
- Plug a real payments provider (Stripe / PayPal) into `createPayment`.
- Add request-level validation (e.g. `zod`) and an `express-mongo-sanitize`
  middleware.
