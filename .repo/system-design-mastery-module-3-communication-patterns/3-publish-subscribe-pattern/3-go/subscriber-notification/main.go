package main

import (
	"encoding/json"
	"fmt"
	"log"
	"runtime"

	"github.com/nats-io/nats.go"
)

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func main() {
	nc, err := nats.Connect("nats://localhost:4222")
	if err != nil {
		log.Fatalf("failed to connect to NATS: %v", err)
	}
	defer nc.Close()

	_, err = nc.Subscribe("app.events", func(m *nats.Msg) {
		str := string(m.Data)
		var ev Event
		if err := json.Unmarshal(m.Data, &ev); err != nil {
			log.Printf("Error decoding event: %v", err)
			return
		}

		// Print NestJS-like standard log prefix
		fmt.Printf("notification: %s\n", str)

		// Print expected JSON format with exact spacing
		payloadBytes, _ := json.Marshal(ev.Payload)
		fmt.Printf("{ \"service\": \"notification\", \"received\": { \"type\": \"%s\", \"payload\": %s } }\n", ev.Type, string(payloadBytes))
	})
	if err != nil {
		log.Fatalf("failed to subscribe to NATS subject: %v", err)
	}

	log.Println("Go Notification Subscriber listening on app.events...")
	runtime.Goexit()
}
