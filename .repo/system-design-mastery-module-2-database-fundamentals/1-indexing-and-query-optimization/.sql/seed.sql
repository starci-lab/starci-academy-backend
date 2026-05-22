-- ──────────────────────────────────────────────
-- Seed 10 000 sản phẩm mẫu bằng generate_series — dữ liệu đủ lớn để thấy khác biệt index.
-- (EN: Seed 10 000 sample products using generate_series — large enough to show index difference.)
-- ──────────────────────────────────────────────

DO $$
DECLARE
    categories TEXT[] := ARRAY['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Food & Beverage', 'Health', 'Automotive', 'Music'];
    brands TEXT[] := ARRAY['Acme', 'Zenith', 'Pinnacle', 'Vertex', 'Nova', 'Apex', 'Stellar', 'Orbit', 'Quantum', 'Flux', 'Titan', 'Vortex', 'Prism', 'Nexus', 'Echo'];
    adjectives TEXT[] := ARRAY['Premium', 'Ultra', 'Pro', 'Elite', 'Classic', 'Advanced', 'Essential', 'Deluxe', 'Standard', 'Compact'];
    nouns TEXT[] := ARRAY['Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'System', 'Module', 'Unit', 'Pack', 'Set'];
    i INT;
    v_brand TEXT;
    v_adj TEXT;
    v_noun TEXT;
    v_cat TEXT;
BEGIN
    FOR i IN 1..10000 LOOP
        v_brand := brands[1 + floor(random() * array_length(brands, 1))::int];
        v_adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
        v_noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
        v_cat := categories[1 + floor(random() * array_length(categories, 1))::int];

        INSERT INTO products (name, sku, price, category, brand, description, stock, rating)
        VALUES (
            v_brand || ' ' || v_adj || ' ' || v_noun,
            'SKU-' || lpad(i::text, 6, '0'),
            round((random() * 999 + 1)::numeric, 2),
            v_cat,
            v_brand,
            'High-quality ' || lower(v_adj) || ' ' || lower(v_noun) || ' by ' || v_brand || '.',
            floor(random() * 1000)::int,
            round((random() * 4 + 1)::numeric, 1)
        );
    END LOOP;
END $$;

-- Cập nhật thống kê bảng để PostgreSQL có dữ liệu chính xác cho query planner.
-- (EN: Update table statistics so PostgreSQL has accurate data for query planner.)
ANALYZE products;
