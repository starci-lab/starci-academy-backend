-- ============================================================
-- Seed dữ liệu mẫu — đơn hàng trải đều 5 khu vực và 12 tháng 2024.
-- (EN: Seed sample data — orders spread across 5 regions and 12 months of 2024.)
-- ============================================================

INSERT INTO orders (customer_id, product, amount, region, status, created_at) VALUES
-- Tháng 1 (Q1) — us-east, us-west
-- (EN: January (Q1) — us-east, us-west)
('cust-0001', 'Laptop',   1299.99, 'us-east',      'completed',  '2024-01-05'),
('cust-0002', 'Phone',     899.50, 'us-west',      'pending',    '2024-01-12'),
('cust-0003', 'Tablet',    549.00, 'eu-west',      'completed',  '2024-01-20'),

-- Tháng 2 (Q1) — eu-west, eu-east
-- (EN: February (Q1) — eu-west, eu-east)
('cust-0004', 'Monitor',   429.99, 'eu-east',      'cancelled',  '2024-02-03'),
('cust-0005', 'Keyboard',   89.99, 'ap-southeast', 'completed',  '2024-02-14'),
('cust-0006', 'Mouse',      49.99, 'us-east',      'pending',    '2024-02-28'),

-- Tháng 3 (Q1) — ap-southeast
-- (EN: March (Q1) — ap-southeast)
('cust-0007', 'Laptop',   1499.00, 'us-west',      'completed',  '2024-03-10'),
('cust-0008', 'Phone',     799.00, 'eu-west',      'pending',    '2024-03-22'),

-- Tháng 4 (Q2) — us-east
-- (EN: April (Q2) — us-east)
('cust-0009', 'Tablet',    599.99, 'eu-east',      'completed',  '2024-04-01'),
('cust-0010', 'Monitor',   349.00, 'ap-southeast', 'cancelled',  '2024-04-15'),

-- Tháng 5 (Q2) — us-west, eu-west
-- (EN: May (Q2) — us-west, eu-west)
('cust-0011', 'Keyboard',  119.99, 'us-east',      'pending',    '2024-05-05'),
('cust-0012', 'Mouse',      59.99, 'us-west',      'completed',  '2024-05-20'),

-- Tháng 6 (Q2) — eu-east, ap-southeast
-- (EN: June (Q2) — eu-east, ap-southeast)
('cust-0013', 'Laptop',   1799.99, 'eu-west',      'completed',  '2024-06-08'),
('cust-0014', 'Phone',     949.00, 'eu-east',      'pending',    '2024-06-25'),

-- Tháng 7 (Q3) — us-east, us-west
-- (EN: July (Q3) — us-east, us-west)
('cust-0015', 'Tablet',    479.00, 'ap-southeast', 'cancelled',  '2024-07-04'),
('cust-0016', 'Monitor',   599.99, 'us-east',      'completed',  '2024-07-18'),

-- Tháng 8 (Q3) — eu-west, eu-east
-- (EN: August (Q3) — eu-west, eu-east)
('cust-0017', 'Keyboard',   79.99, 'us-west',      'pending',    '2024-08-02'),
('cust-0018', 'Mouse',      39.99, 'eu-west',      'completed',  '2024-08-19'),

-- Tháng 9 (Q3) — ap-southeast
-- (EN: September (Q3) — ap-southeast)
('cust-0019', 'Laptop',   1599.00, 'eu-east',      'completed',  '2024-09-07'),
('cust-0020', 'Phone',     699.99, 'ap-southeast', 'pending',    '2024-09-28'),

-- Tháng 10 (Q4) — us-east, us-west
-- (EN: October (Q4) — us-east, us-west)
('cust-0021', 'Tablet',    529.00, 'us-east',      'cancelled',  '2024-10-10'),
('cust-0022', 'Monitor',   449.99, 'us-west',      'completed',  '2024-10-22'),

-- Tháng 11 (Q4) — eu-west, eu-east
-- (EN: November (Q4) — eu-west, eu-east)
('cust-0023', 'Keyboard',   99.99, 'eu-west',      'pending',    '2024-11-05'),
('cust-0024', 'Mouse',      69.99, 'eu-east',      'completed',  '2024-11-18'),

-- Tháng 12 (Q4) — ap-southeast
-- (EN: December (Q4) — ap-southeast)
('cust-0025', 'Laptop',   1399.00, 'ap-southeast', 'completed',  '2024-12-01'),
('cust-0026', 'Phone',     849.99, 'us-east',      'pending',    '2024-12-15'),
('cust-0027', 'Tablet',    499.00, 'us-west',      'cancelled',  '2024-12-28'),
('cust-0028', 'Monitor',   379.99, 'eu-west',      'completed',  '2024-12-31');
