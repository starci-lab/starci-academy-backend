package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"api-gateway/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type CreateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func main() {
	userConn, err := grpc.Dial("localhost:5001", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to user service: %v", err)
	}
	defer userConn.Close()
	userClient := pb.NewUserServiceClient(userConn)

	productConn, err := grpc.Dial("localhost:5002", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to product service: %v", err)
	}
	defer productConn.Close()
	productClient := pb.NewProductServiceClient(productConn)

	http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			resp, err := userClient.FindAll(context.Background(), &pb.Empty{})
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
				return
			}
			users := make([]map[string]interface{}, 0)
			for _, u := range resp.Users {
				users = append(users, map[string]interface{}{
					"id":    u.Id,
					"name":  u.Name,
					"email": u.Email,
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"users": users})
		} else if r.Method == http.MethodPost {
			var body CreateUserRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid body"})
				return
			}
			resp, err := userClient.Create(context.Background(), &pb.CreateUserInput{
				Name:  body.Name,
				Email: body.Email,
			})
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
				return
			}
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"id":    resp.Id,
				"name":  resp.Name,
				"email": resp.Email,
			})
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/products/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 2 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid product id"})
			return
		}
		idVal, err := strconv.Atoi(parts[1])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid product id"})
			return
		}

		resp, err := productClient.FindOne(context.Background(), &pb.ProductById{Id: int32(idVal)})
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
			return
		}

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"id":    resp.Id,
			"name":  resp.Name,
			"price": resp.Price,
			"stock": resp.Stock,
		})
	})

	log.Println("Go REST Gateway listening on :3000")
	if err := http.ListenAndServe(":3000", nil); err != nil {
		log.Fatalf("Gateway server failed: %v", err)
	}
}
