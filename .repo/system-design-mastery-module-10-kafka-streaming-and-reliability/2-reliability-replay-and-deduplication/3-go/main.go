package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Kafka struct {
		Brokers  string `yaml:"brokers"`
		Topic    string `yaml:"topic"`
		DlqTopic string `yaml:"dlqTopic"`
		GroupID  string `yaml:"groupId"`
		ClientID string `yaml:"clientId"`
	} `yaml:"kafka"`
	Redis struct {
		Host string `yaml:"host"`
		Port int    `yaml:"port"`
	} `yaml:"redis"`
	Postgres struct {
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		DBName   string `yaml:"dbname"`
	} `yaml:"postgres"`
}

type PublishEventRequest struct {
	ClientMessageId *string                `json:"clientMessageId"`
	Type            *string                `json:"type"`
	Payload         map[string]interface{} `json:"payload"`
	SimulateFailure *bool                  `json:"simulateFailure"`
}

type Envelope struct {
	ClientMessageId string                 `json:"clientMessageId"`
	Type            string                 `json:"type"`
	Payload         map[string]interface{} `json:"payload"`
	SimulateFailure *bool                  `json:"simulateFailure"`
	Timestamp       string                 `json:"timestamp"`
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
		topic = "reliability-events"
	}

	dlqTopic := os.Getenv("KAFKA_DLQ_TOPIC")
	if dlqTopic == "" {
		dlqTopic = config.Kafka.DlqTopic
	}
	if dlqTopic == "" {
		dlqTopic = "reliability-events-dlq"
	}

	groupId := os.Getenv("KAFKA_GROUP_ID")
	if groupId == "" {
		groupId = config.Kafka.GroupID
	}
	if groupId == "" {
		groupId = "broker-lesson2-group"
	}

	clientId := os.Getenv("KAFKA_CLIENT_ID")
	if clientId == "" {
		clientId = config.Kafka.ClientID
	}
	if clientId == "" {
		clientId = "reliability-consumer"
	}

	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = config.Redis.Host
	}
	if redisHost == "" {
		redisHost = "localhost"
	}
	redisPortStr := os.Getenv("REDIS_PORT")
	redisPort := config.Redis.Port
	if redisPortStr != "" {
		if p, err := strconv.Atoi(redisPortStr); err == nil {
			redisPort = p
		}
	}
	if redisPort == 0 {
		redisPort = 6379
	}

	pgHost := os.Getenv("POSTGRES_HOST")
	if pgHost == "" {
		pgHost = config.Postgres.Host
	}
	if pgHost == "" {
		pgHost = "localhost"
	}
	pgPortStr := os.Getenv("POSTGRES_PORT")
	pgPort := config.Postgres.Port
	if pgPortStr != "" {
		if p, err := strconv.Atoi(pgPortStr); err == nil {
			pgPort = p
		}
	}
	if pgPort == 0 {
		pgPort = 5432
	}
	pgUser := os.Getenv("POSTGRES_USER")
	if pgUser == "" {
		pgUser = config.Postgres.User
	}
	if pgUser == "" {
		pgUser = "postgres"
	}
	pgPassword := os.Getenv("POSTGRES_PASSWORD")
	if pgPassword == "" {
		pgPassword = config.Postgres.Password
	}
	if pgPassword == "" {
		pgPassword = "postgres"
	}
	pgDBName := os.Getenv("POSTGRES_DB")
	if pgDBName == "" {
		pgDBName = config.Postgres.DBName
	}
	if pgDBName == "" {
		pgDBName = "reliability_lab"
	}

	// Setup Postgres
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPassword, pgDBName)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open postgres connection: %v", err)
	}
	defer db.Close()

	// Wait and create table
	for i := 0; i < 5; i++ {
		_, err = db.Exec(`CREATE TABLE IF NOT EXISTS processed_events (
			id SERIAL PRIMARY KEY,
			client_message_id VARCHAR(255) UNIQUE NOT NULL,
			event_type VARCHAR(255) NOT NULL,
			sequence BIGINT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`)
		if err == nil {
			break
		}
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Printf("Warning: Failed to create database table: %v", err)
	}

	// Setup Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", redisHost, redisPort),
	})
	defer rdb.Close()

	runConsumer := os.Getenv("KAFKA_GROUP_ID") != "" || os.Getenv("PORT") == ""

	if runConsumer {
		// DLQ Writer
		dlqWriter := &kafka.Writer{
			Addr:  kafka.TCP(brokers...),
			Topic: dlqTopic,
		}
		defer dlqWriter.Close()

		// Start Kafka Consumer
		reader := kafka.NewReader(kafka.ReaderConfig{
			Brokers:  brokers,
			GroupID:  groupId,
			Topic:    topic,
			MinBytes: 10e3,
			MaxBytes: 10e6,
		})

		go func() {
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

				var env Envelope
				if err := json.Unmarshal(m.Value, &env); err != nil {
					log.Printf("Unmarshal error: %v", err)
					_ = reader.CommitMessages(context.Background(), m)
					continue
				}

				clientMessageId := env.ClientMessageId
				if clientMessageId == "" {
					clientMessageId = "<unknown>"
				}

				// 1. Redis SETNX
				dedupKey := "dedup:event:" + clientMessageId
				isNew, err := rdb.SetNX(context.Background(), dedupKey, "1", 3600*time.Second).Result()
				if err != nil {
					log.Printf("Redis error: %v", err)
					// Proceed but don't block
				} else if !isNew {
					log.Printf("Duplicate skipped clientMessageId=%s", clientMessageId)
					_ = reader.CommitMessages(context.Background(), m)
					continue
				}

				// 2. Simulate Failure
				if env.SimulateFailure != nil && *env.SimulateFailure {
					log.Printf("Failed: Simulated processing failure for DLQ demo — will retry / DLQ via Kafka")
					// Send to DLQ
					_ = dlqWriter.WriteMessages(context.Background(), kafka.Message{
						Key:   m.Key,
						Value: m.Value,
					})
					_ = reader.CommitMessages(context.Background(), m)
					continue
				}

				// 3. Redis INCR sequence
				seq, err := rdb.Incr(context.Background(), "reliability:sequence").Result()
				if err != nil {
					seq = 1
				}

				// 4. Postgres persistence using ON CONFLICT DO NOTHING
				res, err := db.Exec(`INSERT INTO processed_events (client_message_id, event_type, sequence) 
					VALUES ($1, $2, $3) ON CONFLICT (client_message_id) DO NOTHING`, clientMessageId, env.Type, seq)
				if err != nil {
					log.Printf("Postgres insert error: %v", err)
					// Treat as error, send to DLQ
					_ = dlqWriter.WriteMessages(context.Background(), kafka.Message{
						Key:   m.Key,
						Value: m.Value,
					})
				} else {
					rowsAffected, _ := res.RowsAffected()
					if rowsAffected == 0 {
						log.Printf("Duplicate skipped clientMessageId=%s", clientMessageId)
					} else {
						log.Printf("Processed %s seq=%d topic=%s", clientMessageId, seq, topic)
					}
				}

				_ = reader.CommitMessages(context.Background(), m)
			}
		}()
	}

	// HTTP Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

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

		if req.ClientMessageId == nil || *req.ClientMessageId == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"statusCode": http.StatusBadRequest,
				"message":    []string{"clientMessageId must be a string"},
				"error":      "Bad Request",
			})
			return
		}

		if req.Type == nil || *req.Type == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"statusCode": http.StatusBadRequest,
				"message":    []string{"type must be a string"},
				"error":      "Bad Request",
			})
			return
		}

		envelope := Envelope{
			ClientMessageId: *req.ClientMessageId,
			Type:            *req.Type,
			Payload:         req.Payload,
			SimulateFailure: req.SimulateFailure,
			Timestamp:       time.Now().UTC().Format(time.RFC3339Nano),
		}

		valBytes, err := json.Marshal(envelope)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		err = writer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(*req.ClientMessageId),
			Value: valBytes,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		log.Printf("Produced to %s key=%s", topic, *req.ClientMessageId)

		c.JSON(http.StatusCreated, gin.H{
			"status": "queued",
			"topic":  topic,
			"key":    *req.ClientMessageId,
		})
	})

	_ = r.Run(":" + port)
}
