-- START
-- 1. SETUP & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CLEANUP
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS price_logs CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. USERS TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. EXCHANGE RATES
-- Tracks the history of USD/EUR vs VES (Bolivars).
CREATE TABLE exchange_rates (
    rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(5) NOT NULL, -- 'USD', 'EUR', 'USDT'
    rate_to_ves DECIMAL(18, 8) NOT NULL, -- 65.50 (Bs per Dollar)
    source VARCHAR(50), -- 'BCV', 'Paralelo', 'Binance'
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. STORES
-- Places where users shop.
CREATE TABLE stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'Farmatodo', 'Bio Mercado'
    address TEXT,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS
-- Populated by scanning barcodes (OpenFoodFacts or User input).
CREATE TABLE products (
    barcode VARCHAR(20) PRIMARY KEY, -- EAN-13 or UPC.
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(50), -- 'Grocery', 'Pharmacy'
    image_url TEXT,
    data_source VARCHAR(20) DEFAULT 'USER', -- 'OFF' or 'USER'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRICE LOGS
-- Every time a user scans a product at a store, we log the price.
CREATE TABLE price_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_barcode VARCHAR(20) REFERENCES products(barcode),
    store_id UUID REFERENCES stores(store_id),
    user_id UUID REFERENCES users(user_id),
    price DECIMAL(18, 8) NOT NULL,
    currency VARCHAR(5) DEFAULT 'USD', -- Always recommend storing as USD
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. SHOPPING LISTS
-- The budget container.
CREATE TABLE shopping_lists (
    list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    name VARCHAR(100) NOT NULL, -- "Monthly Grocery", "BBQ Weekend"
    budget_limit DECIMAL(18, 8), -- The "Upper limit" $110
    currency VARCHAR(5) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'ARCHIVED'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. LIST ITEMS
-- The actual items inside a shopping list.
CREATE TABLE list_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES shopping_lists(list_id) ON DELETE CASCADE,
    product_barcode VARCHAR(20) REFERENCES products(barcode),
    quantity INTEGER DEFAULT 1,
    planned_price DECIMAL(18, 8),
    is_purchased BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL
);

-- 9. PASSWORD RESETS
-- Stores temporary 6-digit codes for password recovery.
CREATE TABLE password_resets (
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL, -- The 6-digit PIN ('123456')
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES & VIEWS

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_price_logs_barcode ON price_logs(product_barcode);
CREATE INDEX idx_price_logs_store ON price_logs(store_id);
CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);

-- VIEW: SMART PRICE ESTIMATOR
-- Calculates the average price of a product based on the last 30 days of data.
CREATE OR REPLACE VIEW v_smart_price_estimates AS
SELECT 
    p.barcode,
    p.name,
    p.image_url,
    PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY pl.price) as estimated_price_usd,
    MAX(pl.price) as highest_price,
    MIN(pl.price) as lowest_price,
    COUNT(pl.log_id) as data_points
FROM 
    products p
JOIN 
    price_logs pl ON p.barcode = pl.product_barcode
WHERE 
    pl.recorded_at > NOW() - INTERVAL '30 days'
GROUP BY 
    p.barcode, p.name, p.image_url;

-- VIEW: PRICE PREDICTION TRENDS
CREATE OR REPLACE VIEW v_price_predictions AS
SELECT
    product_barcode,
    (
        (regr_slope(price, EXTRACT(EPOCH FROM recorded_at)) * EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 day'))) 
        + regr_intercept(price, EXTRACT(EPOCH FROM recorded_at))
    )::numeric as predicted_price_usd,
    
    regr_r2(price, EXTRACT(EPOCH FROM recorded_at)) as reliability_score
FROM
    price_logs
WHERE
    recorded_at > NOW() - INTERVAL '60 days'
GROUP BY
    product_barcode
HAVING 
    count(*) > 5;
-- END