package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
)

type Order struct {
	ID        int64  `json:"id"`
	ProductID int64  `json:"productId"`
	Quantity  int    `json:"quantity"`
	Status    string `json:"status"`
}

var (
	orders   = make(map[int64]Order)
	ordersMu sync.RWMutex
	counter  int64
)

func main() {
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
			var input Order
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`{"message":"Invalid body"}`))
				return
			}
			id := atomic.AddInt64(&counter, 1)
			created := Order{
				ID:        id,
				ProductID: input.ProductID,
				Quantity:  input.Quantity,
				Status:    "PENDING",
			}
			ordersMu.Lock()
			orders[id] = created
			ordersMu.Unlock()
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(created)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	log.Println("Order Service listening on :3003")
	if err := http.ListenAndServe(":3003", nil); err != nil {
		log.Fatalf("Order Service failed: %v", err)
	}
}
