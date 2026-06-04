package com.starci.userservice;

import com.starci.grpc.*;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    private final Map<Integer, User> users = new ConcurrentHashMap<>();
    private final AtomicInteger counter = new AtomicInteger(0);

    public UserGrpcService() {
        int id1 = counter.incrementAndGet();
        users.put(id1, User.newBuilder().setId(id1).setName("Alice").setEmail("alice@starci.com").build());
        int id2 = counter.incrementAndGet();
        users.put(id2, User.newBuilder().setId(id2).setName("Bob").setEmail("bob@starci.com").build());
    }

    @Override
    public void findAll(Empty request, StreamObserver<UserList> responseObserver) {
        UserList.Builder builder = UserList.newBuilder();
        builder.addAllUsers(users.values());
        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void findOne(UserById request, StreamObserver<User> responseObserver) {
        User user = users.get(request.getId());
        if (user != null) {
            responseObserver.onNext(user);
        } else {
            responseObserver.onNext(User.newBuilder().setId(0).setName("Not Found").setEmail("").build());
        }
        responseObserver.onCompleted();
    }

    @Override
    public void create(CreateUserInput request, StreamObserver<User> responseObserver) {
        int id = counter.incrementAndGet();
        User created = User.newBuilder()
                .setId(id)
                .setName(request.getName())
                .setEmail(request.getEmail())
                .build();
        users.put(id, created);
        responseObserver.onNext(created);
        responseObserver.onCompleted();
    }
}
