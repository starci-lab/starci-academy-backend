package com.starci.productservice;

import com.starci.grpc.*;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProductGrpcService extends ProductServiceGrpc.ProductServiceImplBase {

    private final Map<Integer, Product> products = new ConcurrentHashMap<>();

    public ProductGrpcService() {
        products.put(1, Product.newBuilder()
                .setId(1)
                .setName("Laptop")
                .setPrice(999.99)
                .setStock(42)
                .build());
    }

    @Override
    public void findOne(ProductById request, StreamObserver<Product> responseObserver) {
        Product product = products.get(request.getId());
        if (product != null) {
            responseObserver.onNext(product);
        } else {
            responseObserver.onNext(Product.newBuilder().setId(0).setName("Not Found").setPrice(0.0).setStock(0).build());
        }
        responseObserver.onCompleted();
    }
}
