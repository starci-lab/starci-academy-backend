package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/segmentio/kafka-go"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Kafka struct {
		Brokers         string `yaml:"brokers"`
		Topic           string `yaml:"topic"`
		GroupID         string `yaml:"groupId"`
		ClientID        string `yaml:"clientId"`
		ConsumerDelayMs int    `yaml:"consumerDelayMs"`
	} `yaml:"kafka"`
}

type PublishEventRequest struct {
	PartitionKey *string                `json:"partitionKey"`
	Type         string                 `json:"type" binding:"required"`
	Payload      map[string]interface{} `json:"payload" binding:"required"`
}

type Envelope struct {
	Type         string                 `json:"type" json:"type"`
	Payload      map[string]interface{} `json:"payload" json:"payload"`
	PartitionKey string                 `json:"partitionKey" json:"partitionKey"`
	Timestamp    string                 `json:"timestamp" json:"timestamp"`
}

func main() {
	log.SetFlags(0)

	// Load config
	config := Config{}
	configFile, err := os.Open("config.yaml")
	if err == nil {
		defer configFile.Close()
		dec := yaml.NewDecoder(configFile)
		_ = dec.Decode(&config)
	}

	// Override with Env
	brokersStr := os.Getenv("KAFKA_BROKERS")
	if brokersStr == "" {
		brokersStr = config.Kafka.Brokers
	}
	if brokersStr == "" {
		brokersStr = "localhost:9092"
	}
	brokers := strings.Split(brokersStr, ",")

	topic := os.Getenv("KAFKA_TOPIC")
	if topic == "" {
		topic = config.Kafka.Topic
	}
	if topic == "" {
		topic = "platform-events"
	}

	groupId := os.Getenv("KAFKA_GROUP_ID")
	if groupId == "" {
		groupId = config.Kafka.GroupID
	}
	if groupId == "" {
		groupId = "broker-demo-group"
	}

	clientId := os.Getenv("KAFKA_CLIENT_ID")
	if clientId == "" {
		clientId = config.Kafka.ClientID
	}
	if clientId == "" {
		clientId = "broker-client"
	}

	consumerDelayMs := config.Kafka.ConsumerDelayMs
	if delayStr := os.Getenv("CONSUMER_DELAY_MS"); delayStr != "" {
		if d, err := strconv.Atoi(delayStr); err == nil {
			consumerDelayMs = d
		}
	}

	runConsumer := os.Getenv("KAFKA_GROUP_ID") != "" || os.Getenv("PORT") == ""

	if runConsumer {
		// Start Kafka Consumer
		reader := kafka.NewReader(kafka.ReaderConfig{
			Brokers:  brokers,
			GroupID:  groupId,
			Topic:    topic,
			MinBytes: 10e3,
			MaxBytes: 10e6,
		})

		go func() {
			processed := 0
			defer reader.Close()
			for {
				m, err := reader.ReadMessage(context.Background())
				if err != nil {
					if err == io.EOF {
						break
					}
					log.Printf("Read message error: %v", err)
					time.Sleep(1 * time.Second)
					continue
				}

				if consumerDelayMs > 0 {
					time.Sleep(time.Duration(consumerDelayMs) * time.Millisecond)
				}

				processed++
				var env Envelope
				if err := json.Unmarshal(m.Value, &env); err == nil {
					pKey := env.PartitionKey
					if pKey == "" {
						pKey = "?"
					}
					tStr := env.Type
					if tStr == "" {
						tStr = "?"
					}
					log.Printf("[%s] #%d partitionKey=%s type=%s", clientId, processed, pKey, tStr)
				}
			}
		}()
	}

	// HTTP Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Create Kafka Writer
	writer := &kafka.Writer{
		Addr:     kafka.TCP(brokers...),
		Topic:    topic,
		Balancer: &kafka.Hash{},
	}
	defer writer.Close()

	r := gin.Default()
	r.POST("/events", func(c *gin.Context) {
		var req PublishEventRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"statusCode": http.StatusBadRequest,
				"message":    []string{err.Error()},
				"error":      "Bad Request",
			})
			return
		}

		partitionKey := "default"
		if req.PartitionKey != nil {
			partitionKey = *req.PartitionKey
		}

		envelope := Envelope{
			Type:         req.Type,
			Payload:      req.Payload,
			PartitionKey: partitionKey,
			Timestamp:    time.Now().UTC().Format(time.RFC3339Nano),
		}

		valBytes, err := json.Marshal(envelope)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		err = writer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(partitionKey),
			Value: valBytes,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		log.Printf("Produced to %s key=%s", topic, partitionKey)

		c.JSON(http.StatusCreated, gin.H{
			"status": "queued",
			"topic":  topic,
			"key":    partitionKey,
		})
	})

	_ = r.Run(":" + port)
}
