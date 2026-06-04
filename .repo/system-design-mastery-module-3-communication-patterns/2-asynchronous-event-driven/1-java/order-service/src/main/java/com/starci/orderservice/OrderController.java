package com.starci.orderservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final Map<Integer, Order> orders = new ConcurrentHashMap<>();

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public Collection<Order> getOrders() {
        return orders.values();
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderDto dto) {
        int orderId = ThreadLocalRandom.current().nextInt(1, 100000);
        Order order = new Order(orderId, dto.getProductName(), dto.getQuantity(), "PENDING");
        orders.put(orderId, order);

        try {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("eventType", "ORDER_CREATED");
            event.put("orderId", orderId);
            event.put("productName", dto.getProductName());
            event.put("quantity", dto.getQuantity());
            event.put("timestamp", Instant.now().toString());

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("order-events", message);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}

class CreateOrderDto {
    private String productName;
    private int quantity;

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}

class Order {
    private int id;
    private String productName;
    private int quantity;
    private String status;

    public Order(int id, String productName, int quantity, String status) {
        this.id = id;
        this.productName = productName;
        this.quantity = quantity;
        this.status = status;
    }

    public int getId() { return id; }
    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public String getStatus() { return status; }
}
