-- ──────────────────────────────────────────────
-- Tạo bảng products KHÔNG có index — để sinh viên thấy trước/sau khi thêm index.
-- (EN: Create products table WITHOUT indexes — so students see before/after adding indexes.)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    stock INT DEFAULT 0,
    rating DECIMAL(3, 1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
