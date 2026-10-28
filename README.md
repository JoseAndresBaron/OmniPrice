# OmniPrice

**Real-time multi-store product search and price comparison.**

OmniPrice is a fast backend and web app that searches products across major retailers and ranks the results so you can find the best deal. It uses [Fastify](https://fastify.dev/) with a SQLite database, JWT authentication, and an in-memory LRU cache that serves repeat searches in under a millisecond.

---

## Features

- **Multi-store search:** Live results from retailers such as Amazon, Walmart, Best Buy, Target, and Apple, powered by the OpenWeb Ninja Real-Time Product Search API (via RapidAPI).
- **Sorting and filtering:** Sort by price, rating, or discount, and optionally limit results to verified stores.
- **Authentication:** Registration and login with bcrypt-hashed passwords and JWT sessions.
- **Search history:** Searches are logged to SQLite, including result count and best price/store found.
- **Fast caching:** An in-memory LRU cache returns repeated queries almost instantly.
- **SQLite in WAL mode:** `better-sqlite3` for low-latency, zero-setup storage.
- **Stats endpoint:** Usage metrics and cache performance at a glance.
- **Built-in web UI:** A static frontend served from the same server.

> **Note:** OmniPrice is currently free to use. There are no subscription plans or search quotas at this time.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Server | Fastify 5, `@fastify/cors`, `@fastify/static` |
| Database | SQLite via `better-sqlite3` (WAL mode) |
| Auth | `bcryptjs`, `jsonwebtoken` |
| Cache | `lru-cache` |
| Data source | OpenWeb Ninja Real-Time Product Search API (RapidAPI) |
| Runtime | Node.js 20+ (ES modules) |

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A [RapidAPI](https://rapidapi.com/) key subscribed to the Real-Time Product Search API

### Installation

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
PORT=4000
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=real-time-product-search.p.rapidapi.com
LOGO_DEV_KEY=your_logo_dev_key
JWT_SECRET=a_long_random_string
```

| Variable | Description |
| :--- | :--- |
| `PORT` | Port the server listens on. |
| `RAPIDAPI_KEY` | Your RapidAPI key. |
| `RAPIDAPI_HOST` | The RapidAPI host for the product search API. |
| `LOGO_DEV_KEY` | Logo.dev key used for store logos. |
| `JWT_SECRET` | Secret used to sign JWTs. Set this to a long random value in production. |

Never commit your `.env` file. It is already listed in `.gitignore`.

### Run

```bash
npm run dev   # development, restarts on file changes
npm start     # production
```

Then open <http://localhost:4000>.

---

## API Reference

### Authentication

#### `POST /api/auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

Creates an account. Returns `{ user, token }` with status `201`.

#### `POST /api/auth/login`

```json
{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

Returns `{ user, token }`.

#### `GET /api/auth/me`

Header: `Authorization: Bearer <token>`

Returns the profile of the logged-in user.

---

### Product Search

#### `GET /api/search`

Optional header: `Authorization: Bearer <token>` to associate the search with your account.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | *required* | Search query, e.g. `MacBook Air M2` or `Sony WH-1000XM5` |
| `onlyTrusted` | boolean | `true` | Only return verified stores (Amazon, Walmart, Best Buy, etc.) |
| `sortBy` | string | `price_asc` | `price_asc`, `price_desc`, `rating_desc`, or `discount_desc` |
| `limit` | number | `20` | Maximum number of items returned |

Example:

```bash
curl "http://localhost:4000/api/search?q=sony%20wh-1000xm5&sortBy=price_asc&limit=10"
```

---

### Stats

#### `GET /api/stats`

Returns:

- **Usage metrics:** total registered users and total searches logged.
- **Cache performance:** hits, misses, hit ratio, and uptime.

---

## Project Structure

```
.
├── server.js              # Fastify app entry point
├── package.json
├── public/                # Static web UI
└── src/
    ├── config.js          # Environment/config loading
    ├── database/
    │   └── db.js          # SQLite setup and schema
    └── routes/
        ├── api.js         # Search and stats routes
        └── authRoutes.js  # Register, login, and profile routes
```

The SQLite database file (`data.sqlite`) is created automatically on first run.

---

## Roadmap

- Subscription tiers and usage quotas
- Price history and price-drop alerts
- Saved searches and favorites

---

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss any significant change.

## License

Add your license here (for example, MIT).
