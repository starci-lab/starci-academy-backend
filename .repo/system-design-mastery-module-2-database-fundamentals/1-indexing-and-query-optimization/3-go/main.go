package main

import (
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ProductEntity struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Sku         string    `gorm:"type:varchar(100);unique;not null" json:"sku"`
	Price       string    `gorm:"type:numeric(10,2);not null" json:"price"`
	Category    string    `gorm:"type:varchar(100);not null" json:"category"`
	Brand       string    `gorm:"type:varchar(100)" json:"brand"`
	Description string    `gorm:"type:text" json:"description"`
	Stock       int       `gorm:"type:int;default:0" json:"stock"`
	Rating      float64   `gorm:"type:numeric(3,1);default:0" json:"rating"`
	CreatedAt   time.Time `gorm:"column:created_at;default:now()" json:"createdAt"`
}

func (ProductEntity) TableName() string {
	return "products"
}

var db *gorm.DB

func initDB() {
	pgHost := os.Getenv("POSTGRES_HOST")
	if pgHost == "" {
		pgHost = "localhost"
	}
	pgPort := os.Getenv("POSTGRES_PORT")
	if pgPort == "" {
		pgPort = "5432"
	}
	pgUser := os.Getenv("POSTGRES_USER")
	if pgUser == "" {
		pgUser = "postgres"
	}
	pgPass := os.Getenv("POSTGRES_PASSWORD")
	if pgPass == "" {
		pgPass = "postgres"
	}
	pgDb := os.Getenv("POSTGRES_DB")
	if pgDb == "" {
		pgDb = "indexing_db"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPass, pgDb)
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to connect database: %v", err))
	}
}

var categories = []string{
	"Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food & Beverage", "Health", "Automotive", "Music",
}

var brands = []string{
	"Acme", "Zenith", "Pinnacle", "Vertex", "Nova", "Apex", "Stellar", "Orbit", "Quantum", "Flux", "Titan", "Vortex", "Prism", "Nexus", "Echo",
}

var adjectives = []string{
	"Premium", "Ultra", "Pro", "Elite", "Classic", "Advanced", "Essential", "Deluxe", "Standard", "Compact",
}

var nouns = []string{
	"Widget", "Gadget", "Device", "Tool", "Kit", "System", "Module", "Unit", "Pack", "Set",
}

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
		batchSize := 500
		inserted := 0

		for i := 0; i < count; i += batchSize {
			currentBatchSize := batchSize
			if count-i < batchSize {
				currentBatchSize = count - i
			}

			batch := make([]ProductEntity, currentBatchSize)
			for j := 0; j < currentBatchSize; j++ {
				adjective := adjectives[randSource.Intn(len(adjectives))]
				noun := nouns[randSource.Intn(len(nouns))]
				brand := brands[randSource.Intn(len(brands))]
				name := brand + " " + adjective + " " + noun
				sku := fmt.Sprintf("%c%c-%d-%d",
					rune('A'+randSource.Intn(26)),
					rune('A'+randSource.Intn(26)),
					time.Now().UnixNano(),
					i+j,
				)
				price := 1.0 + randSource.Float64()*999.0
				category := categories[randSource.Intn(len(categories))]
				description := fmt.Sprintf("High-quality %s %s by %s. Built for performance and reliability.",
					strings.ToLower(adjective), strings.ToLower(noun), brand)
				stock := randSource.Intn(1000)
				rating := math.Round((1.0+randSource.Float64()*4.0)*10.0) / 10.0

				batch[j] = ProductEntity{
					Name:        name,
					Sku:         sku,
					Price:       fmt.Sprintf("%.2f", price),
					Category:    category,
					Brand:       brand,
					Description: description,
					Stock:       stock,
					Rating:      rating,
					CreatedAt:   time.Now(),
				}
			}

			if err := db.Create(&batch).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			inserted += currentBatchSize
		}

		c.JSON(http.StatusCreated, gin.H{"inserted": inserted})
	})

	// GET /api/query/no-index
	r.GET("/api/query/no-index", func(c *gin.Context) {
		category := c.Query("category")
		if category == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Category is required"})
			return
		}

		start := time.Now()
		var products []ProductEntity

		tx := db.Begin()
		tx.Exec("SET enable_indexscan = OFF")
		tx.Exec("SET enable_bitmapscan = OFF")

		tx.Where("category = ?", category).Order("price asc").Find(&products)

		tx.Exec("SET enable_indexscan = ON")
		tx.Exec("SET enable_bitmapscan = ON")
		tx.Commit()

		duration := float64(time.Since(start).Nanoseconds()) / 1e6

		c.JSON(http.StatusOK, gin.H{
			"rows":             products,
			"executionTimeMs":  math.Round(duration*1000) / 1000,
		})
	})

	// GET /api/query/with-index
	r.GET("/api/query/with-index", func(c *gin.Context) {
		category := c.Query("category")
		minPriceStr := c.Query("minPrice")

		if category == "" || minPriceStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "category and minPrice are required"})
			return
		}

		minPrice, err := strconv.ParseFloat(minPriceStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid minPrice"})
			return
		}

		start := time.Now()
		var products []ProductEntity
		db.Where("category = ? AND price >= ?", category, minPrice).Order("price asc").Find(&products)
		duration := float64(time.Since(start).Nanoseconds()) / 1e6

		c.JSON(http.StatusOK, gin.H{
			"rows":             products,
			"executionTimeMs":  math.Round(duration*1000) / 1000,
		})
	})

	// GET /api/explain
	r.GET("/api/explain", func(c *gin.Context) {
		sql := c.Query("sql")
		if sql == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "sql query is required"})
			return
		}

		var planLines []string
		rows, err := db.Raw("EXPLAIN ANALYZE " + sql).Rows()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var line string
			_ = rows.Scan(&line)
			planLines = append(planLines, line)
		}

		c.JSON(http.StatusOK, gin.H{"plan": strings.Join(planLines, "\n")})
	})

	// GET /api/compare
	r.GET("/api/compare", func(c *gin.Context) {
		randSource := rand.New(rand.NewSource(time.Now().UnixNano()))
		category := categories[randSource.Intn(len(categories))]
		minPrice := 50.0 + randSource.Float64()*200.0

		sql := fmt.Sprintf("SELECT * FROM products WHERE category = '%s' AND price >= %.2f ORDER BY price ASC", category, minPrice)

		// Without Index Plan
		tx := db.Begin()
		tx.Exec("SET enable_indexscan = OFF")
		tx.Exec("SET enable_bitmapscan = OFF")

		rowsWithout, err := tx.Raw("EXPLAIN ANALYZE " + sql).Rows()
		var planWithoutLines []string
		if err == nil {
			for rowsWithout.Next() {
				var line string
				_ = rowsWithout.Scan(&line)
				planWithoutLines = append(planWithoutLines, line)
			}
			rowsWithout.Close()
		}
		tx.Exec("SET enable_indexscan = ON")
		tx.Exec("SET enable_bitmapscan = ON")
		tx.Commit()

		planWithout := strings.Join(planWithoutLines, "\n")

		// With Index Plan
		rowsWith, err := db.Raw("EXPLAIN ANALYZE " + sql).Rows()
		var planWithLines []string
		if err == nil {
			for rowsWith.Next() {
				var line string
				_ = rowsWith.Scan(&line)
				planWithLines = append(planWithLines, line)
			}
			rowsWith.Close()
		}
		planWith := strings.Join(planWithLines, "\n")

		extractTime := func(plan string) string {
			re := regexp.MustCompile(`Execution Time:\s+([\d.]+)\s+ms`)
			m := re.FindStringSubmatch(plan)
			if len(m) > 1 {
				return m[1] + " ms"
			}
			return "N/A"
		}

		c.JSON(http.StatusOK, gin.H{
			"withoutIndex": gin.H{
				"plan":            planWithout,
				"executionTimeMs": extractTime(planWithout),
			},
			"withIndex": gin.H{
				"plan":            planWith,
				"executionTimeMs": extractTime(planWith),
			},
			"summary": fmt.Sprintf("Query: SELECT * FROM products WHERE category='%s' AND price >= %.2f ORDER BY price ASC", category, minPrice),
		})
	})

	// GET /api/stats
	r.GET("/api/stats", func(c *gin.Context) {
		var tableStats struct {
			TableName string `gorm:"column:table_name"`
			SeqScan   int64  `gorm:"column:seq_scan"`
			IdxScan   int64  `gorm:"column:idx_scan"`
			LiveRows  int64  `gorm:"column:live_rows"`
		}

		db.Raw("SELECT relname AS table_name, seq_scan, idx_scan, n_live_tup AS live_rows FROM pg_stat_user_tables WHERE relname = 'products'").Scan(&tableStats)

		type indexStat struct {
			IndexName string `json:"index_name" gorm:"column:index_name"`
			TimesUsed int64  `json:"times_used" gorm:"column:times_used"`
			IndexSize string `json:"index_size" gorm:"column:index_size"`
		}
		var indexStats []indexStat

		db.Raw("SELECT indexrelname AS index_name, idx_scan AS times_used, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size FROM pg_stat_user_indexes WHERE relname = 'products'").Scan(&indexStats)

		c.JSON(http.StatusOK, gin.H{
			"tableStats": gin.H{
				"table_name": tableStats.TableName,
				"seq_scan":   tableStats.SeqScan,
				"idx_scan":   tableStats.IdxScan,
				"live_rows":  tableStats.LiveRows,
			},
			"indexStats": indexStats,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}
	_ = r.Run(":" + port)
}
