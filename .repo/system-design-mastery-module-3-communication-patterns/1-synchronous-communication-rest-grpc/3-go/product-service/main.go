package main

import (
	"context"
	"log"
	"net"
	"sync"

	"api-gateway/pb"
	"google.golang.org/grpc"
)

type productServer struct {
	pb.UnimplementedProductServiceServer
	products   map[int32]*pb.Product
	productsMu sync.RWMutex
}

func (s *productServer) FindOne(ctx context.Context, req *pb.ProductById) (*pb.Product, error) {
	s.productsMu.RLock()
	defer s.productsMu.RUnlock()
	p, ok := s.products[req.Id]
	if !ok {
		return &pb.Product{Id: 0, Name: "Not Found", Price: 0.0, Stock: 0}, nil
	}
	return p, nil
}

func main() {
	lis, err := net.Listen("tcp", ":5002")
	if err != nil {
		log.Fatalf("failed to listen on port 5002: %v", err)
	}

	s := &productServer{
		products: make(map[int32]*pb.Product),
	}

	// Seed initial data
	s.products[1] = &pb.Product{
		Id:    1,
		Name:  "Laptop",
		Price: 999.99,
		Stock: 42,
	}

	grpcServer := grpc.NewServer()
	pb.RegisterProductServiceServer(grpcServer, s)

	log.Println("Product gRPC Service listening on :5002")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve gRPC: %v", err)
	}
}
