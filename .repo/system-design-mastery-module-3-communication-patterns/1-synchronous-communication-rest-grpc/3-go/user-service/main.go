package main

import (
	"context"
	"log"
	"net"
	"sync"
	"sync/atomic"

	"api-gateway/pb"
	"google.golang.org/grpc"
)

type userServer struct {
	pb.UnimplementedUserServiceServer
	users   map[int32]*pb.User
	usersMu sync.RWMutex
	counter int32
}

func (s *userServer) FindAll(ctx context.Context, req *pb.Empty) (*pb.UserList, error) {
	s.usersMu.RLock()
	defer s.usersMu.RUnlock()
	list := make([]*pb.User, 0, len(s.users))
	for _, u := range s.users {
		list = append(list, u)
	}
	return &pb.UserList{Users: list}, nil
}

func (s *userServer) FindOne(ctx context.Context, req *pb.UserById) (*pb.User, error) {
	s.usersMu.RLock()
	defer s.usersMu.RUnlock()
	u, ok := s.users[req.Id]
	if !ok {
		return &pb.User{Id: 0, Name: "Not Found", Email: ""}, nil
	}
	return u, nil
}

func (s *userServer) Create(ctx context.Context, req *pb.CreateUserInput) (*pb.User, error) {
	id := atomic.AddInt32(&s.counter, 1)
	u := &pb.User{
		Id:    id,
		Name:  req.Name,
		Email: req.Email,
	}
	s.usersMu.Lock()
	s.users[id] = u
	s.usersMu.Unlock()
	return u, nil
}

func main() {
	lis, err := net.Listen("tcp", ":5001")
	if err != nil {
		log.Fatalf("failed to listen on port 5001: %v", err)
	}

	s := &userServer{
		users: make(map[int32]*pb.User),
	}

	// Seed initial data
	id1 := atomic.AddInt32(&s.counter, 1)
	s.users[id1] = &pb.User{Id: id1, Name: "Alice", Email: "alice@starci.com"}
	id2 := atomic.AddInt32(&s.counter, 1)
	s.users[id2] = &pb.User{Id: id2, Name: "Bob", Email: "bob@starci.com"}

	grpcServer := grpc.NewServer()
	pb.RegisterUserServiceServer(grpcServer, s)

	log.Println("User gRPC Service listening on :5001")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve gRPC: %v", err)
	}
}
