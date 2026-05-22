-- ──────────────────────────────────────────────
-- Seed data cho PostgreSQL — tao bang products va insert du lieu mau.
-- (EN: Seed data for PostgreSQL — create products table and insert sample data.)
-- ──────────────────────────────────────────────

-- Tao bang products neu chua ton tai.
-- (EN: Create products table if it does not exist.)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert du lieu mau vao bang products.
-- (EN: Insert sample data into products table.)
INSERT INTO products (name, price, category, metadata) VALUES
    ('Laptop Pro 15', 1299.99, 'Electronics', '{"sku": "SKU-000001", "weight": 2.1, "inStock": true}'),
    ('Wireless Mouse', 29.99, 'Electronics', '{"sku": "SKU-000002", "weight": 0.15, "inStock": true}'),
    ('USB-C Hub', 49.99, 'Electronics', '{"sku": "SKU-000003", "weight": 0.3, "inStock": true}'),
    ('Cotton T-Shirt', 19.99, 'Clothing', '{"sku": "SKU-000004", "weight": 0.2, "inStock": true}'),
    ('Denim Jeans', 59.99, 'Clothing', '{"sku": "SKU-000005", "weight": 0.8, "inStock": false}'),
    ('Running Shoes', 89.99, 'Sports', '{"sku": "SKU-000006", "weight": 0.6, "inStock": true}'),
    ('Yoga Mat', 34.99, 'Sports', '{"sku": "SKU-000007", "weight": 1.2, "inStock": true}'),
    ('Clean Code Book', 39.99, 'Books', '{"sku": "SKU-000008", "weight": 0.5, "inStock": true}'),
    ('Design Patterns Book', 44.99, 'Books', '{"sku": "SKU-000009", "weight": 0.6, "inStock": true}'),
    ('Garden Hose', 24.99, 'Home & Garden', '{"sku": "SKU-000010", "weight": 1.5, "inStock": true}');
