package academy.starci.replication.orders;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class OrdersService {

    private static final String[] REGIONS = {"us-east", "us-west", "eu-west", "eu-east", "ap-southeast"};
    private static final String[] PRODUCTS = {"Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse"};
    private static final String[] STATUSES = {"pending", "completed", "cancelled"};

    private final OrderRepository orderRepository;
    private final JdbcTemplate jdbcTemplate;

    public OrdersService(OrderRepository orderRepository, JdbcTemplate jdbcTemplate) {
        this.orderRepository = orderRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public OrderEntity create(OrderEntity order) {
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<OrderEntity> findAll() {
        // Querying from replica (read-only)
        List<OrderEntity> all = orderRepository.findAllByOrderByCreatedAtDesc();
        if (all.size() > 100) {
            return all.subList(0, 100);
        }
        return all;
    }

    @Transactional
    public Map<String, Object> seed(int count) {
        List<OrderEntity> orders = new ArrayList<>();
        Random rand = new Random();

        for (int i = 0; i < count; i++) {
            int month = (i % 12) + 1;
            int day = (i % 28) + 1;
            
            OrderEntity order = new OrderEntity();
            order.setCustomerId(String.format("cust-%04d", i + 1));
            order.setProduct(PRODUCTS[i % PRODUCTS.length]);
            double amount = Math.round((rand.nextDouble() * 2000.0 + 10.0) * 100.0) / 100.0;
            order.setAmount(BigDecimal.valueOf(amount));
            order.setRegion(REGIONS[i % REGIONS.length]);
            order.setStatus(STATUSES[i % STATUSES.length]);
            
            String dateStr = String.format("2024-%02d-%02dT12:00:00Z", month, day);
            order.setCreatedAt(Instant.parse(dateStr));
            orders.add(order);
        }

        // Bulk save
        orderRepository.saveAll(orders);

        Map<String, Object> result = new HashMap<>();
        result.put("inserted", orders.size());
        return result;
    }

    @Transactional
    public List<Map<String, Object>> getReplicationStatus() {
        // Runs on primary because transaction is read-write
        String sql = "SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, " +
                     "cast(pg_wal_lsn_diff(sent_lsn, replay_lsn) as text) AS replication_lag_bytes, " +
                     "sync_state FROM pg_stat_replication";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("client_addr", rs.getString("client_addr"));
            map.put("state", rs.getString("state"));
            map.put("sent_lsn", rs.getString("sent_lsn"));
            map.put("replay_lsn", rs.getString("replay_lsn"));
            map.put("replication_lag_bytes", rs.getString("replication_lag_bytes"));
            map.put("sync_state", rs.getString("sync_state"));
            return map;
        });
    }

    @Transactional
    public List<Map<String, Object>> getPartitionInfo() {
        // Runs on primary because transaction is read-write
        String sql = "SELECT parent.relname AS parent_table, child.relname AS partition_name, " +
                     "pg_get_expr(child.relpartbound, child.oid) AS partition_expression, " +
                     "pg_size_pretty(pg_relation_size(child.oid)) AS partition_size " +
                     "FROM pg_inherits " +
                     "JOIN pg_class parent ON pg_inherits.inhparent = parent.oid " +
                     "JOIN pg_class child ON pg_inherits.inhrelid = child.oid " +
                     "WHERE parent.relname = 'orders' ORDER BY child.relname";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("parent_table", rs.getString("parent_table"));
            map.put("partition_name", rs.getString("partition_name"));
            map.put("partition_expression", rs.getString("partition_expression"));
            map.put("partition_size", rs.getString("partition_size"));
            return map;
        });
    }
}
