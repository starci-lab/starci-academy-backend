package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/segmentio/kafka-go"
)

type OrderEvent struct {
	EventType   string `json:"eventType"`
	OrderId     int    `json:"orderId"`
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
}

func main() {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9092"},
		GroupID:  "notification-consumer",
		Topic:    "order-events",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})
	defer reader.Close()

	log.Println("Go Notification Service Kafka Consumer started...")

	for {
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		var event OrderEvent
		if err := json.Unmarshal(m.Value, &event); err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}

		if event.EventType == "ORDER_CREATED" {
			fmt.Printf("notification-service | Received ORDER_CREATED: order %d (%s x%d)\n", event.OrderId, event.ProductName, event.Quantity)
			fmt.Printf("notification-service | Sending notification for order %d...\n", event.OrderId)
		}
	}
}
