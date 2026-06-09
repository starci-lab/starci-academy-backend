package com.starci.orderservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final List<Order> orders = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong counter = new AtomicLong(0);

    @GetMapping
    public Collection<Order> getAll() {
        synchronized (orders) {
            return new ArrayList<>(orders);
        }
    }

    @PostMapping
    public ResponseEntity<Order> create(@RequestBody Order order) {
        long id = counter.incrementAndGet();
        Order created = new Order(id, order.getProductId(), order.getQuantity(), "PENDING");
        orders.add(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

class Order {
    private Long id;
    private Long productId;
    private Integer quantity;
    private String status;

    public Order() {}
    public Order(Long id, Long productId, Integer quantity, String status) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
