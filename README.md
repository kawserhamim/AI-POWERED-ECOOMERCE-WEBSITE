# ShopEasy AI — AI-Powered E-Commerce Platform

A full-stack e-commerce platform built with React, Node.js, and MongoDB, featuring an AI-powered shopping assistant using RAG (Retrieval-Augmented Generation) with LangChain, Qdrant, and Groq LLaMA 3.3.

---

## ⭐ What Makes This Special

Most e-commerce platforms treat AI as an add-on — a search bar upgrade or a support chatbot.
**This platform is different.** AI is woven into the core shopping experience.

### 🧠 Semantic Search, Not Keyword Matching
Users don't have to guess the right keywords. They can type naturally — *"lightweight phone with great camera under $500"* — and the platform **understands the intent**. Under the hood, Google Gemini converts the query into a 768-dimensional vector, Qdrant finds the closest product matches by meaning (not just text overlap), and Groq LLaMA 3.3 synthesizes a human-quality answer with context from those products. No traditional search engine does this.

### 💬 A Chatbot That Actually Knows the Store
The floating AI assistant isn't connected to a generic knowledge base — it's grounded exclusively in **your product catalog**. Every product is indexed into Qdrant as vector embeddings, so answers are always relevant, always accurate, and never hallucinated from outside knowledge.

### 🔐 Authentication Done Right
Most tutorials store JWTs in `localStorage` — readable by any JavaScript on the page, making them vulnerable to XSS attacks. This project stores the JWT in a single **httpOnly cookie**: invisible to JavaScript, automatically sent by the browser on every request, and scoped with `SameSite` to prevent CSRF. The role is encoded inside the JWT — no second readable cookie, no client-side role manipulation.

### 🛡️ Security as a First-Class Concern
- **Nobody can self-register as admin** — the `role` field is completely ignored on registration
- **Rate limiting** on every sensitive endpoint — auth routes (15 req/15min), AI routes (30 req/15min), global (200 req/15min)
- **Helmet.js** enforces 12 HTTP security headers out of the box
- **bcrypt** with 10 salt rounds, and the `password` field has `select: false` so hashes never appear in query results

### 🛒 Guest Cart That Survives Login
A guest can browse and add products to their cart without an account. When they eventually log in, their guest cart is **automatically merged** with their server-side cart — no items lost, no friction.

### 🎙️ Voice Navigation
Built-in voice control using the Web Speech API — no third-party service, no extra cost. Users can navigate the store hands-free.

### 🏗️ Monorepo, Single Process Backend
The entire backend — auth, products, cart, orders, payments, reviews, AI search — runs as a **single Express process** on one port. No microservices complexity, no inter-service networking, no Docker Compose required to run locally. Simple to understand, simple to deploy.

---


## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **AI Shopping Assistant** — Semantic product search using vector embeddings (Gemini + Qdrant) and natural language answers (Groq LLaMA 3.3)
- **Authentication** — JWT stored in a secure httpOnly cookie; single-token session
- **Product Catalog** — Full CRUD, category/brand filtering, pagination, ratings, reviews
- **Shopping Cart** — Guest cart (localStorage) with automatic merge on login
- **Checkout & Orders** — Shipping address, order creation, status tracking
- **Payments** — SSLCommerz gateway integration + Cash on Delivery
- **Admin Dashboard** — Manage products, orders, payments
- **Voice Navigation** — Web Speech API for hands-free browsing
- **Rate Limiting** — Brute-force protection on auth and AI endpoints
- **Security Headers** — Helmet.js for HTTP security headers

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TailwindCSS
- React Router v6
- Axios

**Backend**
- Node.js 20 (ES Modules)
- Express 4
- MongoDB + Mongoose
- JWT + bcryptjs
- Helmet + express-rate-limit

**AI / Search**
- LangChain
- Qdrant (vector database)
- Google Gemini (embeddings)
- Groq LLaMA 3.3 70B (LLM)

---

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Qdrant cloud account or local Qdrant instance
- Google Gemini API key
- Groq API key
- SSLCommerz account (optional — for online payments)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/shop-easy-ai.git
cd shop-easy-ai
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variables

### Backend — `/backend/.env`

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `8000` | No | HTTP server port |
| `NODE_ENV` | `development` | No | Environment (`development` / `production`) |
| `MONGO_URL` | `mongodb://localhost:27017/ecommerce_db` | Yes | MongoDB connection string |
| `JWT_SECRET` | — | **Yes** | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | No | Token expiry duration |
| `ADMIN_EMAIL` | `admin@example.com` | No | Default admin email (used by seed script) |
| `ADMIN_PASSWORD` | `Admin@12345` | No | Default admin password (used by seed script) |
| `CORS_ORIGIN` | `http://localhost:5173` | Yes | Frontend URL for CORS |
| `GOOGLE_API_KEY` | — | Yes | Google Gemini API key (embeddings) |
| `GROQ_API_KEY` | — | Yes | Groq API key (LLM) |
| `QDRANT_URL` | — | Yes | Qdrant cluster URL |
| `QDRANT_API_KEY` | — | Yes | Qdrant API key |
| `SSLCOMMERZ_STORE_ID` | — | No | SSLCommerz store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | — | No | SSLCommerz store password |
| `IS_LIVE` | `false` | No | `true` for SSLCommerz production gateway |
| `SSL_COMMERZ_CURRENCY` | `BDT` | No | Currency for SSLCommerz |
| `BACKEND_URL` | — | No | Public backend URL (required for SSLCommerz callbacks) |
| `FRONTEND_URL` | `http://localhost:5173` | No | Frontend URL (used in payment redirects) |

### Frontend — `/frontend/.env`

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `` (empty) | Backend base URL. Leave empty in dev — Vite proxy handles it. |

---

## Running the App

### Development

**Backend** (runs on `http://localhost:8000`):

```bash
cd backend
npm run dev
```

**Frontend** (runs on `http://localhost:5173`):

```bash
cd frontend
npm run dev
```

### Seed the database

Populates sample products and creates the default admin account:

```bash
cd backend
npm run seed
```

Default admin credentials:
```
Email:    admin@example.com
Password: Admin@12345
```

> **Important:** Change `ADMIN_PASSWORD` in `.env` before running in production.

### Production

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Serve the dist/ folder with nginx, Vercel, etc.
```

---

## API Reference

All API routes are prefixed at `http://localhost:8000`. Authentication uses an httpOnly cookie (`auth_token`) set automatically on login.

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Login and receive session cookie |
| `POST` | `/auth/logout` | — | Clear session cookie |
| `GET` | `/auth/me` | User | Get current user profile |
| `PUT` | `/auth/me` | User | Update name or shipping address |
| `PUT` | `/auth/change-password` | User | Change password |

### Products — `/products`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products` | — | List products (supports `?category`, `?brand`, `?search`, `?minPrice`, `?maxPrice`, `?sort`, `?page`, `?limit`) |
| `GET` | `/products/featured` | — | Top 8 products by rating |
| `GET` | `/products/categories` | — | Distinct categories and brands |
| `GET` | `/products/by-ids?ids=a,b,c` | — | Bulk fetch by IDs |
| `GET` | `/products/:id` | — | Product detail |
| `POST` | `/products` | Admin | Create a product |
| `PUT` | `/products/:id` | Admin | Update a product |
| `DELETE` | `/products/:id` | Admin | Delete a product |

### Reviews — `/products/:productId/reviews`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | — | List reviews for a product |
| `POST` | `/` | User | Create a review (one per user per product) |
| `PUT` | `/:reviewId` | Owner | Edit own review |
| `DELETE` | `/:reviewId` | Owner / Admin | Delete a review |

### Cart — `/cart`

All cart routes require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/cart` | Get cart with subtotal |
| `POST` | `/cart/items` | Add item `{ productId, quantity }` |
| `PUT` | `/cart/items/:productId` | Update item quantity |
| `DELETE` | `/cart/items/:productId` | Remove item |
| `DELETE` | `/cart` | Clear cart |

### Orders — `/orders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orders` | User | Create order from items + shipping address |
| `GET` | `/orders/mine` | User | Get own order history |
| `GET` | `/orders` | Admin | Get all orders (filter `?status=`) |
| `GET` | `/orders/:id` | Owner / Admin | Get order detail |
| `PUT` | `/orders/:id/cancel` | Owner | Cancel order (if `created` or `processing`) |
| `PUT` | `/orders/:id/status` | Admin | Update order status |

### Payments — `/payments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/payments` | User | Start payment `{ orderId, method }` |
| `GET` | `/payments/mine` | User | Get own payments |
| `GET` | `/payments` | Admin | Get all payments |
| `GET` | `/payments/:id` | Owner / Admin | Get payment detail |
| `PUT` | `/payments/:id/refund` | Admin | Mark payment as refunded |

### AI Search — `/smart-search`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/smart-search` | — | `{ input: string }` → `{ ai: string, products?: [] }` |

### Health

```
GET /health → { status, service, uptime, timestamp }
```

---

## Project Structure

```
AI-powered-Ecommerce-platform/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/              # Axios API calls
│       ├── components/       # Reusable UI components
│       ├── context/          # AuthContext, CartContext
│       ├── pages/            # Page components
│       ├── admin/            # Admin panel components
│       └── utils/            # Utility functions
│
├── backend/
│   ├── config/               # Database connection
│   ├── controllers/          # Route handler logic
│   ├── middleware/           # Auth, error, validation middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── services/             # AI/RAG service
│   ├── utils/                # Helpers
│   └── scripts/              # Seed script
│
└── README.md
```

---

## Security

- **Helmet.js** — sets security-related HTTP headers
- **Rate limiting** — 200 req/15min globally, 15/15min on `/auth`, 30/15min on `/smart-search`
- **httpOnly cookie** — JWT is not accessible via JavaScript
- **SameSite cookie** — `lax` in development, `none` (+ `Secure`) in production
- **bcrypt** — passwords hashed with 10 salt rounds, `select: false` on the field
- **Role enforcement** — `register` always creates `role: "user"`; admin promotion requires an existing admin

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to your branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).
# AI-POWERED-ECOOMERCE-WEBSITE
