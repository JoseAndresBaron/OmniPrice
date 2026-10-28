# OmniPrice - Real-Time Multi-Store Product Search & Comparison SaaS

A blazing-fast SaaS product comparison platform with a **SQLite database (WAL mode)**, **Authentication (JWT + bcrypt)**, and **Multi-Tier Subscriptions (Free, Pro, Enterprise)**. Powered by **Fastify**, **OpenWeb Ninja (Real-Time Product Search API)**, and an in-memory LRU cache.

---

## ⚡ Architecture & Features

- **Database Layer (`data.sqlite`):** Built with `better-sqlite3` in WAL mode for ultra-high throughput and sub-millisecond queries. Stores users, active subscriptions, and search history.
- **Authentication:** Secure registration & login with `bcryptjs` password hashing (salt rounds: 10) and JWT sessions (`jsonwebtoken`).
- **Subscription Tiers & Quota Engine:**
  - **Starter (Free):** $0/mo — 10 searches/day, verified stores filter.
  - **Pro Shopper:** $9.99/mo — 500 searches/day, priority cache refresh, savings calculator.
  - **Enterprise & API:** $29.99/mo — 5,000 searches/day, direct API access, batch processing.
- **Multi-Store Aggregator:** Live sync with OpenWeb Ninja (Google Shopping aggregator covering Amazon, Walmart, Best Buy, Target, Apple, etc.).
- **Sub-Millisecond Caching:** In-memory LRU cache returns repeat queries in **< 1ms**.
- **Modern SaaS UI:** Responsive web app with trending pills, deal callout banner, live latency HUD, and auth/subscription modals.

---

## 🚀 Running the Project

### 1. Environment Variables
Your `.env` file is pre-configured:
```env
PORT=4000
RAPIDAPI_KEY=your_key_here
RAPIDAPI_HOST=real-time-product-search.p.rapidapi.com
JWT_SECRET=your_jwt_secret_here (optional, defaults to secure fallback)
```

### 2. Start the Server
```bash
npm run dev
# or
npm start
```

### 3. Open in Browser
Visit:
```
http://localhost:4000
```

---

## 📡 API Reference

### 🔐 Authentication

#### Register
`POST /api/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```
**Response (201):** Returns `{ user, token }` with an automatic Free subscription.

#### Login
`POST /api/auth/login`
```json
{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```
**Response (200):** Returns `{ user, token }`.

#### Current User & Quota
`GET /api/auth/me`
*Header:* `Authorization: Bearer <token>`
Returns the logged-in user profile, tier, daily quota, and searches left today.

---

### 💳 Subscriptions

#### Get Plans
`GET /api/subscription/plans`
Returns the 3 available tiers (Free, Pro, Enterprise) and their feature matrices.

#### Upgrade Plan
`POST /api/subscription/upgrade`
*Header:* `Authorization: Bearer <token>`
```json
{
  "planId": "pro"
}
```
Instantly upgrades the user to the selected plan and activates a 30-day billing cycle.

#### Cancel Subscription
`POST /api/subscription/cancel`
*Header:* `Authorization: Bearer <token>`
Reverts the user to the Starter (Free) plan.

---

### 🔍 Product Search

`GET /api/search`
*Optional Header:* `Authorization: Bearer <token>` (enforces daily search quotas)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | *required* | Search query (e.g., `MacBook Air M2`, `Sony WH-1000XM5`) |
| `onlyTrusted` | boolean | `true` | Only return verified stores (Amazon, Walmart, Best Buy, etc.) |
| `sortBy` | string | `price_asc` | `price_asc`, `price_desc`, `rating_desc`, `discount_desc` |
| `limit` | number | `20` | Max items returned |

*When daily quota is exceeded (Free users at 10/10), returns HTTP `403` with `{ error: 'QUOTA_EXCEEDED' }`.*

---

### 📊 Business & Cache Analytics

`GET /api/stats`
Returns:
- **Business metrics:** Total registered users, total search queries logged, active paid subscribers.
- **Cache performance:** Cache hits, misses, hit ratio %, uptime.
