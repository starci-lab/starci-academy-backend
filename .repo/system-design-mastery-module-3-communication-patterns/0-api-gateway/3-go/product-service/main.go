package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

type Product struct {
	ID    int64   `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

var (
	products   = make([]Product, 0)
	productsMu sync.Mutex
	counter    int64
)

func main() {
	http.HandleFunc("/products", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			productsMu.Lock()
			list := append([]Product(nil), products...)
			productsMu.Unlock()
			_ = json.NewEncoder(w).Encode(list)
		} else if r.Method == http.MethodPost {
			var input Product
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`{"message":"Invalid body"}`))
				return
			}
			productsMu.Lock()
			counter++
			created := Product{ID: counter, Name: input.Name, Price: input.Price, Stock: input.Stock}
			products = append(products, created)
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
