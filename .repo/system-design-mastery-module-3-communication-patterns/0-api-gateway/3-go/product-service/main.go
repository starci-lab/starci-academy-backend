package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
)

type Product struct {
	ID    int64   `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

var (
	products   = make(map[int64]Product)
	productsMu sync.RWMutex
	counter    int64
)

func main() {
	// Seed initial data
	id1 := atomic.AddInt64(&counter, 1)
	products[id1] = Product{ID: id1, Name: "Laptop", Price: 1500.0, Stock: 10}

	http.HandleFunc("/products", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			productsMu.RLock()
			list := make([]Product, 0, len(products))
			for _, p := range products {
				list = append(list, p)
			}
			productsMu.RUnlock()
			_ = json.NewEncoder(w).Encode(list)
		} else if r.Method == http.MethodPost {
			var input Product
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`{"message":"Invalid body"}`))
				return
			}
			id := atomic.AddInt64(&counter, 1)
			created := Product{
				ID:    id,
				Name:  input.Name,
				Price: input.Price,
				Stock: input.Stock,
			}
			productsMu.Lock()
			products[id] = created
			productsMu.Unlock()
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(created)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	log.Println("Product Service listening on :3002")
	if err := http.ListenAndServe(":3002", nil); err != nil {
		log.Fatalf("Product Service failed: %v", err)
	}
}
