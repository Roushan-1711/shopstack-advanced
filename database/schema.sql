-- Product catalogue table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);


-- HTTP request activity log (real requests are recorded with unknown country unless geolocation is configured).
CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Unknown',
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    source TEXT NOT NULL DEFAULT 'live',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_country ON request_logs(country);
