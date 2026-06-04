package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/nats-io/nats.go"
)

type EventRequest struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type Event struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload"`
	Timestamp string      `json:"timestamp"`
}

type EventResponse struct {
	Status  string `json:"status"`
	Subject string `json:"subject"`
	Event   Event  `json:"event"`
}

func main() {
	nc, err := nats.Connect("nats://localhost:4222")
	if err != nil {
		log.Fatalf("failed to connect to NATS: %v", err)
	}
	defer nc.Close()

	http.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var body EventRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid body"})
			return
		}

		event := Event{
			Type:      body.Type,
			Payload:   body.Payload,
			Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		}

		bytes, err := json.Marshal(event)
		if err == nil {
			_ = nc.Publish("app.events", bytes)
		}

		resp := EventResponse{
			Status:  "published",
			Subject: "app.events",
			Event:   event,
		}

		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(resp)
	})

	log.Println("Go Publisher Service listening on :3001")
	if err := http.ListenAndServe(":3001", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
