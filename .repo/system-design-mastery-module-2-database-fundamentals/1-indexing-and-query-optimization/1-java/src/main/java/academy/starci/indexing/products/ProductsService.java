package academy.starci.indexing.products;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@Service
public class ProductsService {

    private static final String[] CATEGORIES = {
        "Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food & Beverage", "Health", "Automotive", "Music"
    };

    private static final String[] BRANDS = {
        "Acme", "Zenith", "Pinnacle", "Vertex", "Nova", "Apex", "Stellar", "Orbit", "Quantum", "Flux", "Titan", "Vortex", "Prism", "Nexus", "Echo"
    };

    private static final String[] ADJECTIVES = {
        "Premium", "Ultra", "Pro", "Elite", "Classic", "Advanced", "Essential", "Deluxe", "Standard", "Compact"
    };

    private static final String[] NOUNS = {
        "Widget", "Gadget", "Device", "Tool", "Kit", "System", "Module", "Unit", "Pack", "Set"
    };

    private final JdbcTemplate jdbcTemplate;

    public ProductsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> seed(int count) {
        Random rand = new Random();
        int batchSize = 500;
        int inserted = 0;

        String sql = "INSERT INTO products (id, name, sku, price, category, brand, description, stock, rating, created_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

        for (int i = 0; i < count; i += batchSize) {
            int currentBatchSize = Math.min(batchSize, count - i);
            List<Object[]> batchArgs = new ArrayList<>();

            for (int j = 0; j < currentBatchSize; j++) {
                String adjective = ADJECTIVES[rand.nextInt(ADJECTIVES.length)];
                String noun = NOUNS[rand.nextInt(NOUNS.length)];
                String brand = BRANDS[rand.nextInt(BRANDS.length)];
                String name = brand + " " + adjective + " " + noun;
                String sku = String.format("%c%c-%d-%d", 
                    (char)('A' + rand.nextInt(26)), 
                    (char)('A' + rand.nextInt(26)), 
                    System.currentTimeMillis(), 
                    i + j);
                double price = Math.round((rand.nextDouble() * 999.0 + 1.0) * 100.0) / 100.0;
                String category = CATEGORIES[rand.nextInt(CATEGORIES.length)];
                String description = String.format("High-quality %s %s by %s. Built for performance and reliability.", 
                    adjective.toLowerCase(), noun.toLowerCase(), brand);
                int stock = rand.nextInt(1000);
                double rating = Math.round((rand.nextDouble() * 4.0 + 1.0) * 10.0) / 10.0;

                batchArgs.add(new Object[]{
                    UUID.randomUUID(),
                    name,
                    sku,
                    price,
                    category,
                    brand,
                    description,
                    stock,
                    rating
                });
            }

            jdbcTemplate.batchUpdate(sql, batchArgs);
            inserted += currentBatchSize;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("inserted", inserted);
        return result;
    }

    public Map<String, Object> findWithoutIndex(String category) {
        long start = System.nanoTime();
        List<Map<String, Object>> rows = jdbcTemplate.execute((Connection conn) -> {
            try (var stmt = conn.createStatement()) {
                stmt.execute("SET enable_indexscan = OFF");
                stmt.execute("SET enable_bitmapscan = OFF");

                List<Map<String, Object>> results = new ArrayList<>();
                String query = "SELECT * FROM products WHERE category = ? ORDER BY price ASC";
                try (PreparedStatement pStmt = conn.prepareStatement(query)) {
                    pStmt.setString(1, category);
                    try (ResultSet rs = pStmt.executeQuery()) {
                        while (rs.next()) {
                            Map<String, Object> row = new LinkedHashMap<>();
                            row.put("id", rs.getString("id"));
                            row.put("name", rs.getString("name"));
                            row.put("sku", rs.getString("sku"));
                            row.put("price", rs.getString("price"));
                            row.put("category", rs.getString("category"));
                            row.put("brand", rs.getString("brand"));
                            row.put("description", rs.getString("description"));
                            row.put("stock", rs.getInt("stock"));
                            row.put("rating", rs.getDouble("rating"));
                            var ts = rs.getTimestamp("created_at");
                            row.put("createdAt", ts != null ? ts.toInstant().toString() : null);
                            results.add(row);
                        }
                    }
                }

                stmt.execute("SET enable_indexscan = ON");
                stmt.execute("SET enable_bitmapscan = ON");
                return results;
            }
        });

        double duration = (System.nanoTime() - start) / 1_000_000.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rows", rows);
        result.put("executionTimeMs", Math.round(duration * 1000.0) / 1000.0);
        return result;
    }

    public Map<String, Object> findWithIndex(String category, double minPrice) {
        long start = System.nanoTime();
        String query = "SELECT * FROM products WHERE category = ? AND price >= ? ORDER BY price ASC";
        List<Map<String, Object>> rows = jdbcTemplate.query(query, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("name", rs.getString("name"));
            row.put("sku", rs.getString("sku"));
            row.put("price", rs.getString("price"));
            row.put("category", rs.getString("category"));
            row.put("brand", rs.getString("brand"));
            row.put("description", rs.getString("description"));
            row.put("stock", rs.getInt("stock"));
            row.put("rating", rs.getDouble("rating"));
            var ts = rs.getTimestamp("created_at");
            row.put("createdAt", ts != null ? ts.toInstant().toString() : null);
            return row;
        }, category, minPrice);

        double duration = (System.nanoTime() - start) / 1_000_000.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rows", rows);
        result.put("executionTimeMs", Math.round(duration * 1000.0) / 1000.0);
        return result;
    }

    public Map<String, Object> explainQuery(String sql) {
        String planSql = "EXPLAIN ANALYZE " + sql;
        List<String> planLines = jdbcTemplate.query(planSql, (rs, rowNum) -> rs.getString(1));
        String plan = String.join("\n", planLines);
        Map<String, Object> res = new HashMap<>();
        res.put("plan", plan);
        return res;
    }

    public Map<String, Object> compareQueries() {
        Random rand = new Random();
        String category = CATEGORIES[rand.nextInt(CATEGORIES.length)];
        double minPrice = Math.round((rand.nextDouble() * 200.0 + 50.0) * 100.0) / 100.0;

        String sql = String.format(Locale.US, "SELECT * FROM products WHERE category = '%s' AND price >= %.2f ORDER BY price ASC", category, minPrice);

        // Without index
        String planWithout = jdbcTemplate.execute((Connection conn) -> {
            try (var stmt = conn.createStatement()) {
                stmt.execute("SET enable_indexscan = OFF");
                stmt.execute("SET enable_bitmapscan = OFF");

                List<String> lines = new ArrayList<>();
                try (ResultSet rs = stmt.executeQuery("EXPLAIN ANALYZE " + sql)) {
                    while (rs.next()) {
                        lines.add(rs.getString(1));
                    }
                }

                stmt.execute("SET enable_indexscan = ON");
                stmt.execute("SET enable_bitmapscan = ON");
                return String.join("\n", lines);
            }
        });

        // With index
        List<String> linesWith = jdbcTemplate.query("EXPLAIN ANALYZE " + sql, (rs, rowNum) -> rs.getString(1));
        String planWith = String.join("\n", linesWith);

        String timeWithout = extractExecutionTime(planWithout);
        String timeWith = extractExecutionTime(planWith);

        Map<String, Object> res = new LinkedHashMap<>();
        
        Map<String, Object> withoutIdx = new LinkedHashMap<>();
        withoutIdx.put("plan", planWithout);
        withoutIdx.put("executionTimeMs", timeWithout);

        Map<String, Object> withIdx = new LinkedHashMap<>();
        withIdx.put("plan", planWith);
        withIdx.put("executionTimeMs", timeWith);

        res.put("withoutIndex", withoutIdx);
        res.put("withIndex", withIdx);
        res.put("summary", String.format(Locale.US, "Query: SELECT * FROM products WHERE category='%s' AND price >= %.2f ORDER BY price ASC", category, minPrice));

        return res;
    }

    private String extractExecutionTime(String plan) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("Execution Time:\\s+([\\d.]+)\\s+ms").matcher(plan);
        if (m.find()) {
            return m.group(1) + " ms";
        }
        return "N/A";
    }

    public Map<String, Object> getTableStats() {
        String statsSql = "SELECT relname AS table_name, seq_scan, idx_scan, n_live_tup AS live_rows " +
                           "FROM pg_stat_user_tables WHERE relname = 'products'";

        List<Map<String, Object>> statsList = jdbcTemplate.query(statsSql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("table_name", rs.getString("table_name"));
            map.put("seq_scan", rs.getLong("seq_scan"));
            map.put("idx_scan", rs.getLong("idx_scan"));
            map.put("live_rows", rs.getLong("live_rows"));
            return map;
        });

        Map<String, Object> tableStats = statsList.isEmpty() ? new HashMap<>() : statsList.get(0);

        String indexSql = "SELECT indexrelname AS index_name, idx_scan AS times_used, " +
                          "pg_size_pretty(pg_relation_size(indexrelid)) AS index_size " +
                          "FROM pg_stat_user_indexes WHERE relname = 'products'";

        List<Map<String, Object>> indexStats = jdbcTemplate.query(indexSql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("index_name", rs.getString("index_name"));
            map.put("times_used", rs.getLong("times_used"));
            map.put("index_size", rs.getString("index_size"));
            return map;
        });

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("tableStats", tableStats);
        res.put("indexStats", indexStats);
        return res;
    }
}
