package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type OrderEntity struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CustomerID string    `gorm:"column:customer_id;type:varchar;not null" json:"customerId"`
	Product    string    `gorm:"type:varchar;not null" json:"product"`
	Amount     string    `gorm:"type:numeric(10,2);not null" json:"amount"`
	Region     string    `gorm:"type:varchar;not null" json:"region"`
	Status     string    `gorm:"type:varchar;not null;default:'pending'" json:"status"`
	CreatedAt  time.Time `gorm:"column:created_at;default:now()" json:"createdAt"`
}

func (OrderEntity) TableName() string {
	return "orders"
}

var (
	primaryDB *gorm.DB
	replicaDB *gorm.DB
)

func initDB() {
	pgUser := os.Getenv("POSTGRES_USER")
	if pgUser == "" {
		pgUser = "postgres"
	}
	pgPass := os.Getenv("POSTGRES_PASSWORD")
	if pgPass == "" {
		pgPass = "Cuong123_A"
	}
	pgDb := os.Getenv("POSTGRES_DB")
	if pgDb == "" {
		pgDb = "orders_db"
	}

	// Primary DB
	pgMasterHost := os.Getenv("POSTGRES_MASTER_HOST")
	if pgMasterHost == "" {
		pgMasterHost = "localhost"
	}
	pgMasterPort := os.Getenv("POSTGRES_MASTER_PORT")
	if pgMasterPort == "" {
		pgMasterPort = "5432"
	}
	masterDsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgMasterHost, pgMasterPort, pgUser, pgPass, pgDb)
	var err error
	primaryDB, err = gorm.Open(postgres.Open(masterDsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to connect primary db: %v", err))
	}

	// Replica DB
	pgReplicaHost := os.Getenv("POSTGRES_REPLICA_HOST")
	if pgReplicaHost == "" {
		pgReplicaHost = "localhost"
	}
	pgReplicaPort := os.Getenv("POSTGRES_REPLICA_PORT")
	if pgReplicaPort == "" {
		pgReplicaPort = "5433"
	}
	replicaDsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgReplicaHost, pgReplicaPort, pgUser, pgPass, pgDb)
	replicaDB, err = gorm.Open(postgres.Open(replicaDsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to connect replica db: %v", err))
	}
}

var (
	regions   = []string{"us-east", "us-west", "eu-west", "eu-east", "ap-southeast"}
	products  = []string{"Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse"}
	statuses  = []string{"pending", "completed", "cancelled"}
)

func main() {
	initDB()

	r := gin.Default()

	// POST /api/seed/:count
	r.POST("/api/seed/:count", func(c *gin.Context) {
		countStr := c.Param("count")
		count, err := strconv.Atoi(countStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid count"})
			return
		}

		randSource := rand.New(rand.NewSource(time.Now().UnixNano()))
		orders := make([]OrderEntity, count)

		for i := 0; i < count; i++ {
			month := (i % 12) + 1
			day := (i % 28) + 1
			amount := 10.0 + randSource.Float64()*2000.0

			orders[i] = OrderEntity{
				CustomerID: fmt.Sprintf("cust-%04d", i+1),
				Product:    products[i%len(products)],
				Amount:     fmt.Sprintf("%.2f", amount),
				Region:     regions[i%len(regions)],
				Status:     statuses[i%len(statuses)],
				CreatedAt:  time.Date(2024, time.Month(month), day, 12, 0, 0, 0, time.UTC),
			}
		}

		// Save to primary
		if err := primaryDB.Create(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"inserted": count})
	})

	// POST /api/orders
	r.POST("/api/orders", func(c *gin.Context) {
		var req struct {
			CustomerID string  `json:"customerId" binding:"required"`
			Product    string  `json:"product" binding:"required"`
			Amount     float64 `json:"amount" binding:"required"`
			Region     string  `json:"region" binding:"required"`
			Status     string  `json:"status"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		status := req.Status
		if status == "" {
			status = "pending"
		}

		order := OrderEntity{
			CustomerID: req.CustomerID,
			Product:    req.Product,
			Amount:     fmt.Sprintf("%.2f", req.Amount),
			Region:     req.Region,
			Status:     status,
			CreatedAt:  time.Now(),
		}

		if err := primaryDB.Create(&order).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, order)
	})

	// GET /api/orders
	r.GET("/api/orders", func(c *gin.Context) {
		var orders []OrderEntity
		// Read from replica
		if err := replicaDB.Order("created_at desc").Limit(100).Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, orders)
	})

	// GET /api/replication/status
	r.GET("/api/replication/status", func(c *gin.Context) {
		var results []struct {
			ClientAddr           string `json:"client_addr" gorm:"column:client_addr"`
			State                string `json:"state" gorm:"column:state"`
			SentLsn              string `json:"sent_lsn" gorm:"column:sent_lsn"`
			ReplayLsn            string `json:"replay_lsn" gorm:"column:replay_lsn"`
			ReplicationLagBytes string `json:"replication_lag_bytes" gorm:"column:replication_lag_bytes"`
			SyncState            string `json:"sync_state" gorm:"column:sync_state"`
		}

		// Must query primary
		err := primaryDB.Raw("SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, cast(pg_wal_lsn_diff(sent_lsn, replay_lsn) as text) AS replication_lag_bytes, sync_state FROM pg_stat_replication").Scan(&results).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, results)
	})

	// GET /api/partitions
	r.GET("/api/partitions", func(c *gin.Context) {
		var results []struct {
			ParentTable         string `json:"parent_table" gorm:"column:parent_table"`
			PartitionName       string `json:"partition_name" gorm:"column:partition_name"`
			PartitionExpression string `json:"partition_expression" gorm:"column:partition_expression"`
			PartitionSize       string `json:"partition_size" gorm:"column:partition_size"`
		}

		// Query primary
		err := primaryDB.Raw("SELECT parent.relname AS parent_table, child.relname AS partition_name, pg_get_expr(child.relpartbound, child.oid) AS partition_expression, pg_size_pretty(pg_relation_size(child.oid)) AS partition_size FROM pg_inherits JOIN pg_class parent ON pg_inherits.inhparent = parent.oid JOIN pg_class child ON pg_inherits.inhrelid = child.oid WHERE parent.relname = 'orders' ORDER BY child.relname").Scan(&results).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, results)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}
	_ = r.Run(":" + port)
}
