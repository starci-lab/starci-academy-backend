package com.starci.gateway;

import com.starci.grpc.*;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.*;

@RestController
public class GatewayController {

    private ManagedChannel userChannel;
    private ManagedChannel productChannel;
    private UserServiceGrpc.UserServiceBlockingStub userStub;
    private ProductServiceGrpc.ProductServiceBlockingStub productStub;

    @PostConstruct
    public void init() {
        userChannel = ManagedChannelBuilder.forAddress("localhost", 5001)
                .usePlaintext()
                .build();
        userStub = UserServiceGrpc.newBlockingStub(userChannel);

        productChannel = ManagedChannelBuilder.forAddress("localhost", 5002)
                .usePlaintext()
                .build();
        productStub = ProductServiceGrpc.newBlockingStub(productChannel);
    }

    @PreDestroy
    public void shutdown() {
        if (userChannel != null) {
            userChannel.shutdown();
        }
        if (productChannel != null) {
            productChannel.shutdown();
        }
    }

    @GetMapping("/users")
    public Map<String, List<Map<String, Object>>> getUsers() {
        UserList response = userStub.findAll(Empty.getDefaultInstance());
        List<Map<String, Object>> usersList = new ArrayList<>();
        for (User user : response.getUsersList()) {
            Map<String, Object> u = new HashMap<>();
            u.put("id", user.getId());
            u.put("name", user.getName());
            u.put("email", user.getEmail());
            usersList.add(u);
        }
        Map<String, List<Map<String, Object>>> wrapper = new HashMap<>();
        wrapper.put("users", usersList);
        return wrapper;
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody CreateUserDto dto) {
        CreateUserInput input = CreateUserInput.newBuilder()
                .setName(dto.getName())
                .setEmail(dto.getEmail())
                .build();
        User response = userStub.create(input);
        Map<String, Object> res = new HashMap<>();
        res.put("id", response.getId());
        res.put("name", response.getName());
        res.put("email", response.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/products/{id}")
    public Map<String, Object> getProduct(@PathVariable int id) {
        ProductById request = ProductById.newBuilder().setId(id).build();
        Product response = productStub.findOne(request);
        Map<String, Object> res = new HashMap<>();
        res.put("id", response.getId());
        res.put("name", response.getName());
        res.put("price", response.getPrice());
        res.put("stock", response.getStock());
        return res;
    }
}

class CreateUserDto {
    private String name;
    private String email;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
