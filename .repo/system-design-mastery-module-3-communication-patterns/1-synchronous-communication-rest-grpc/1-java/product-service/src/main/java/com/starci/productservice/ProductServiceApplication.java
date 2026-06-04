package com.starci.productservice;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;

@SpringBootApplication
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}

@Component
class GrpcServerRunner implements CommandLineRunner {

    @Autowired
    private ProductGrpcService productGrpcService;

    @Override
    public void run(String... args) throws Exception {
        Server server = ServerBuilder.forPort(5002)
                .addService(productGrpcService)
                .build()
                .start();
        System.out.println("gRPC Server product-service started on port 5002");
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (server != null) {
                server.shutdown();
            }
        }));
        server.awaitTermination();
    }
}
