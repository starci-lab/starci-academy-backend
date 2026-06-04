package main

import (
	"context"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

type CreateOrderRequest struct {
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
}

type Order struct {
	Id          int    `json:"id"`
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
	Status      string `json:"status"`
}

type OrderEvent struct {
	EventType   string    `json:"eventType"`
	OrderId     int       `json:"orderId"`
	ProductName string    `json:"productName"`
	Quantity    int       `json:"quantity"`
	Timestamp   time.Time `json:"timestamp"`
}

var (
	orders   = make(map[int]Order)
	ordersMu sync.RWMutex
)

func main() {
	writer := &kafka.Writer{
		Addr:     kafka.TCP("localhost:9092"),
		Topic:    "order-events",
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

	http.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			ordersMu.RLock()
			list := make([]Order, 0, len(orders))
			for _, o := range orders {
				list = append(list, o)
			}
			ordersMu.RUnlock()
			_ = json.NewEncoder(w).Encode(list)
		} else if r.Method == http.MethodPost {
			var body CreateOrderRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid body"})
				return
			}

			// Seed random
			rand.Seed(time.Now().UnixNano())
			orderId := rand.Intn(100000-1) + 1

			order := Order{
				Id:          orderId,
				ProductName: body.ProductName,
				Quantity:    body.Quantity,
				Status:      "PENDING",
			}

			ordersMu.Lock()
			orders[orderId] = order
			ordersMu.Unlock()

			event := OrderEvent{
				EventType:   "ORDER_CREATED",
				OrderId:     orderId,
				ProductName: body.ProductName,
				Quantity:    body.Quantity,
				Timestamp:   time.Now().UTC(),
			}

			bytes, err := json.Marshal(event)
			if err == nil {
				_ = writer.WriteMessages(context.Background(), kafka.Message{
					Value: bytes,
				})
			}

			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(order)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	log.Println("Go Order Service listening on :3001")
	if err := http.ListenAndServe(":3001", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
