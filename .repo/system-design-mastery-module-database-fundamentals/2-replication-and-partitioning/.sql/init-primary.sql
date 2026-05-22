-- ============================================================
-- Khởi tạo database primary — bảng orders phân vùng + replication.
-- (EN: Primary database init — partitioned orders table + replication.)
--
-- 1. Tạo enum trạng thái đơn hàng.
--    (EN: Create order status enum.)
-- 2. Tạo bảng orders PARTITION BY RANGE(created_at).
--    (EN: Create orders table PARTITION BY RANGE(created_at).)
-- 3. Tạo partition Q1–Q4 năm 2024 + default.
--    (EN: Create Q1–Q4 2024 partitions + default.)
-- 4. Tạo user replication và publication.
--    (EN: Create replication user and publication.)
-- ============================================================

-- Tạo enum type cho trạng thái đơn hàng.
-- (EN: Create enum type for order status.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orders_status_enum') THEN
    CREATE TYPE orders_status_enum AS ENUM ('pending', 'completed', 'cancelled');
  END IF;
END
$$;

-- Tạo bảng cha phân vùng theo RANGE(created_at).
-- (EN: Create parent table partitioned by RANGE(created_at).)
CREATE TABLE IF NOT EXISTS orders (
  id            UUID DEFAULT gen_random_uuid(),
  customer_id   VARCHAR(255) NOT NULL,
  product       VARCHAR(255) NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  region        VARCHAR(100) NOT NULL,
  status        orders_status_enum NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partition Q1 2024 (tháng 1–3).
-- (EN: Q1 2024 partition (Jan–Mar).)
CREATE TABLE IF NOT EXISTS orders_2024_q1 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Partition Q2 2024 (tháng 4–6).
-- (EN: Q2 2024 partition (Apr–Jun).)
CREATE TABLE IF NOT EXISTS orders_2024_q2 PARTITION OF orders
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Partition Q3 2024 (tháng 7–9).
-- (EN: Q3 2024 partition (Jul–Sep).)
CREATE TABLE IF NOT EXISTS orders_2024_q3 PARTITION OF orders
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

-- Partition Q4 2024 (tháng 10–12).
-- (EN: Q4 2024 partition (Oct–Dec).)
CREATE TABLE IF NOT EXISTS orders_2024_q4 PARTITION OF orders
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- Partition mặc định cho dữ liệu ngoài 2024.
-- (EN: Default partition for data outside 2024.)
CREATE TABLE IF NOT EXISTS orders_default PARTITION OF orders DEFAULT;

-- Index trên region để hỗ trợ partition-pruning demo.
-- (EN: Index on region to support partition-pruning demos.)
CREATE INDEX IF NOT EXISTS idx_orders_region ON orders (region);

-- Tạo user replication cho streaming replication.
-- (EN: Create replication user for streaming replication.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'replicator') THEN
    CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replicator_pass';
  END IF;
END
$$;

-- Publication cho logical replication reference (streaming dùng physical).
-- (EN: Publication for logical replication reference (streaming uses physical).)
CREATE PUBLICATION orders_pub FOR TABLE orders;
