package academy.starci.replication.orders;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OrdersController {

    private final OrdersService ordersService;

    public OrdersController(OrdersService ordersService) {
        this.ordersService = ordersService;
    }

    @PostMapping("/seed/{count}")
    public ResponseEntity<Map<String, Object>> seed(@PathVariable("count") int count) {
        Map<String, Object> result = ordersService.seed(count);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderEntity> create(@RequestBody OrderEntity order) {
        OrderEntity created = ordersService.create(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderEntity>> findAll() {
        List<OrderEntity> result = ordersService.findAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/replication/status")
    public ResponseEntity<List<Map<String, Object>>> getReplicationStatus() {
        List<Map<String, Object>> result = ordersService.getReplicationStatus();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/partitions")
    public ResponseEntity<List<Map<String, Object>>> getPartitionInfo() {
        List<Map<String, Object>> result = ordersService.getPartitionInfo();
        return ResponseEntity.ok(result);
    }
}
