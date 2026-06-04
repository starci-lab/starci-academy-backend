package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
)

type User struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var (
	users   = make(map[int64]User)
	usersMu sync.RWMutex
	counter int64
)

func main() {
	// Seed initial data
	id1 := atomic.AddInt64(&counter, 1)
	users[id1] = User{ID: id1, Name: "Alice", Email: "alice@starci.com"}
	id2 := atomic.AddInt64(&counter, 1)
	users[id2] = User{ID: id2, Name: "Bob", Email: "bob@starci.com"}

	http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			usersMu.RLock()
			list := make([]User, 0, len(users))
			for _, u := range users {
				list = append(list, u)
			}
			usersMu.RUnlock()
			_ = json.NewEncoder(w).Encode(list)
		} else if r.Method == http.MethodPost {
			var input User
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`{"message":"Invalid body"}`))
				return
			}
			id := atomic.AddInt64(&counter, 1)
			created := User{
				ID:    id,
				Name:  input.Name,
				Email: input.Email,
			}
			usersMu.Lock()
			users[id] = created
			usersMu.Unlock()
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(created)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	log.Println("User Service listening on :3001")
	if err := http.ListenAndServe(":3001", nil); err != nil {
		log.Fatalf("User Service failed: %v", err)
	}
}
