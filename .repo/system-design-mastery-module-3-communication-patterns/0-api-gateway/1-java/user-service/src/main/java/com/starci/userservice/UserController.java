package com.starci.userservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/users")
public class UserController {

    private final List<User> users = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong counter = new AtomicLong(0);

    @GetMapping
    public Collection<User> getAll() {
        synchronized (users) {
            return new ArrayList<>(users);
        }
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        long id = counter.incrementAndGet();
        User created = new User(id, user.getName(), user.getEmail());
        users.add(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

class User {
    private Long id;
    private String name;
    private String email;

    public User() {}
    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
