package com.starci.productservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final Map<Long, Product> products = new ConcurrentHashMap<>();
    private final AtomicLong counter = new AtomicLong(0);

    public ProductController() {
        long id1 = counter.incrementAndGet();
        products.put(id1, new Product(id1, "Laptop", 1500.0, 10));
    }

    @GetMapping
    public Collection<Product> getAll() {
        return products.values();
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        long id = counter.incrementAndGet();
        Product created = new Product(id, product.getName(), product.getPrice(), product.getStock());
        products.put(id, created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

class Product {
    private Long id;
    private String name;
    private Double price;
    private Integer stock;

    public Product() {}
    public Product(Long id, String name, Double price, Integer stock) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
}
