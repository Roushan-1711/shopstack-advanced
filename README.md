# ShopStack — Full-Stack Product Catalogue, User Analytics & CSS Generator

ShopStack is a student full-stack e-commerce catalogue project. It includes the original product listing experience plus two tutor-requested extensions: an admin user-analytics dashboard and a browser-based CSS generator.

## Features

### Product catalogue (existing functionality)
- Responsive product listing and product details pages.
- Search by product name or description.
- Filter by category and minimum/maximum price.
- Express REST APIs with input validation and useful HTTP status codes.
- SQLite relational database with 12 sample products.

### User analytics (admin dashboard)
- Logs normal HTTP requests with the observed client IP, method, requested path, response status and timestamp.
- Displays total requests, unique IP addresses, country totals and recent activity.
- Simulates visits from different sample IP addresses using reserved documentation-only TEST-NET addresses mapped to example countries.
- Looks up country names for eligible public IP addresses using the ipapi.co country endpoint; if lookup is unavailable, the country remains `Unknown`.
- Refresh and clear-log controls.

**Important:** The simulator creates sample log records; it does not route traffic through another country or spoof a real public IP. Loopback/private and reserved sample addresses are not sent to the geolocation provider. For real visitor lookups, the server sends the visitor's public IP to ipapi.co. Review that provider's terms and privacy policy before using this beyond a classroom demo. The free endpoint may have usage limits and can fail, in which case country is shown as `Unknown`.

### CSS generator
- Customize primary, page background, card and text colours.
- Choose a font family and adjust base font size and corner radius.
- See changes in a live preview.
- View the generated CSS and download it as `shopstack-theme.css`.
- The downloaded stylesheet is a reusable theme starting point; add it to a page after the site's base stylesheet to apply the generated theme, and adjust selectors if your page uses different class names.

## Technology
- Frontend: HTML5, CSS3 and vanilla JavaScript.
- Backend: Node.js 18+ and Express.js.
- Database: SQLite using `better-sqlite3`.

## Run locally

1. Install Node.js 18 or newer and npm.
2. Open a terminal in the `shopstack` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create/reset the local SQLite database and seed the sample catalogue:

   ```bash
   npm run db:setup
   ```

   **Note:** This command recreates the database and clears existing local request logs. The server also creates the database automatically on first run if it does not exist.

5. Start the server:

   ```bash
   npm start
   ```

6. Open these pages:
   - Storefront: `   `
   - User analytics dashboard: `http://localhost:3000/admin.html`
   - CSS generator: `http://localhost:3000/css-generator.html`

For development with automatic server restart, run `npm run dev`.

## Project structure

```text
shopstack/
├── database/
│   ├── schema.sql          # Products and request_logs tables
│   ├── seed.sql            # Sample catalogue records
│   └── setup.js            # Creates and seeds SQLite database
├── public/
│   ├── css/
│   │   ├── styles.css      # Storefront styles
│   │   ├── admin.css       # Admin dashboard styles
│   │   └── generator.css   # CSS generator styles
│   ├── js/
│   │   ├── app.js          # Product listing, search and filters
│   │   ├── product.js      # Product details
│   │   ├── admin.js        # Analytics dashboard
│   │   └── css-generator.js  # Theme controls, preview and CSS download
│   ├── images/
│   ├── index.html
│   ├── product.html
│   ├── admin.html
│   └── css-generator.html
├── screenshots/
├── server.js               # Express server, APIs and request logging
├── package.json
└── README.md
```

## Architecture

1. **Frontend:** Browser pages use HTML/CSS and vanilla JavaScript. The storefront calls catalogue APIs with `fetch()`. The analytics page calls admin log APIs. The CSS generator builds a CSS string in the browser and downloads it as a file.
2. **Backend:** Express receives requests, validates catalogue inputs, runs SQL queries and returns JSON. A request-logging middleware records completed non-admin requests.
3. **Database:** SQLite stores catalogue data in `products` and request activity in `request_logs`. The frontend does not connect directly to SQLite.

## REST API

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get all products |
| GET | `/products?q=watch` | Search products |
| GET | `/products?category=Home` | Filter by category |
| GET | `/products?minPrice=500&maxPrice=2000` | Filter by price range |
| GET | `/products/:id` | Get one product by ID |
| GET | `/categories` | Get available categories |
| GET | `/health` | Check API status |
| GET | `/admin/logs?limit=100` | Get analytics summary, country counts and recent request logs |
| POST | `/admin/simulate` | Add a simulated visit; JSON body: `{"ip":"203.0.113.10"}` |
| DELETE | `/admin/logs` | Clear request logs |

### Example product response

`GET /api/products` returns JSON containing a `count` and a `products` array. Invalid filters return `400 Bad Request`; a missing product returns `404 Not Found`.

## Database

### `products`

Stores product ID, name, description, price, category, image URL, stock and creation time.

### `request_logs`

Stores log ID, IP address, country, HTTP method, requested path, response status, source (`live` or `simulated`) and timestamp.

`database/schema.sql` defines both tables and indexes. `database/seed.sql` inserts the 12 sample products. `npm run db:setup` creates the database from these scripts.

## Screenshots

Add current screenshots of the running application to `screenshots/` before final submission:
- `product-listing.png` — product catalogue.
- `product-details.png` — individual product details.
- Recommended additional evidence: `admin-analytics.png` and `css-generator.png`.

## Security and privacy notes

This is a local classroom demonstration, not a production-ready admin system. Admin endpoints are not protected by login/authentication; do not deploy them publicly without adding authentication, authorization, rate limits and appropriate safeguards. Real public IP geolocation sends the IP to the configured external provider. For deployment behind a reverse proxy, configure Express `trust proxy` only for infrastructure you control; do not blindly trust client-supplied `X-Forwarded-For` headers.
