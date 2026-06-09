package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

type User struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var (
	users   = make([]User, 0)
	usersMu sync.Mutex
	counter int64
)

func main() {
	http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			usersMu.Lock()
			list := append([]User(nil), users...)
			usersMu.Unlock()
			_ = json.NewEncoder(w).Encode(list)
		} else if r.Method == http.MethodPost {
			var input User
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`{"message":"Invalid body"}`))
				return
			}
			usersMu.Lock()
			counter++
			created := User{ID: counter, Name: input.Name, Email: input.Email}
			users = append(users, created)
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
