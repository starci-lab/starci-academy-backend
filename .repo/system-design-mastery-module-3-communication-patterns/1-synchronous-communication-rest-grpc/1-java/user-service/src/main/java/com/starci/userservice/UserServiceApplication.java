package com.starci.userservice;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;

@SpringBootApplication
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

@Component
class GrpcServerRunner implements CommandLineRunner {

    @Autowired
    private UserGrpcService userGrpcService;

    @Override
    public void run(String... args) throws Exception {
        Server server = ServerBuilder.forPort(5001)
                .addService(userGrpcService)
                .build()
                .start();
        System.out.println("gRPC Server user-service started on port 5001");
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (server != null) {
                server.shutdown();
            }
        }));
        server.awaitTermination();
    }
}
