package main

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// JSONMap maps PostgreSQL JSONB type to Go map.
type JSONMap map[string]interface{}

func (jm JSONMap) Value() (driver.Value, error) {
	if jm == nil {
		return nil, nil
	}
	return json.Marshal(jm)
}

func (jm *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*jm = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, jm)
}

// ProductEntity represents SQL product structure.
type ProductEntity struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Price     string    `gorm:"type:numeric(10,2);not null" json:"price"`
	Category  string    `gorm:"type:varchar(100);not null" json:"category"`
	Metadata  JSONMap   `gorm:"type:jsonb" json:"metadata"`
	CreatedAt time.Time `gorm:"column:created_at;default:now()" json:"createdAt"`
}

// TableName defines GORM table name.
func (ProductEntity) TableName() string {
	return "products"
}

// ProductDocument represents MongoDB product structure.
type ProductDocument struct {
	ID        primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
	Name      string                 `bson:"name" json:"name"`
	Price     float64                `bson:"price" json:"price"`
	Category  string                 `bson:"category" json:"category"`
	Metadata  map[string]interface{} `bson:"metadata" json:"metadata"`
	CreatedAt time.Time              `bson:"createdAt" json:"createdAt"`
}

var (
	gormDB      *gorm.DB
	mongoClient *mongo.Client
	mongoColl   *mongo.Collection
)

func initDB() {
	// Postgres connection
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
		pgPass = "Cuong123_A"
	}
	pgDb := os.Getenv("POSTGRES_DB")
	if pgDb == "" {
		pgDb = "sql_nosql_db"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPass, pgDb)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to connect postgres: %v", err))
	}
	gormDB = db

	// AutoMigrate table
	err = gormDB.AutoMigrate(&ProductEntity{})
	if err != nil {
		panic(fmt.Sprintf("failed to migrate postgres: %v", err))
	}

	// MongoDB connection
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/sql_nosql_db"
	}
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("failed to connect mongo: %v", err))
	}
	mongoClient = client
	mongoColl = mongoClient.Database("sql_nosql_db").Collection("products")
}

var categories = []string{
	"Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food", "Automotive",
}

func main() {
	initDB()

	r := gin.Default()

	// POST /api/seed
	r.POST("/api/seed", func(c *gin.Context) {
		countStr := c.DefaultQuery("count", "1000")
		count, err := strconv.Atoi(countStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid count"})
			return
		}

		// Clear tables
		gormDB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&ProductEntity{})
		_ = mongoColl.Drop(context.Background())

		// Generate random data
		sqlProducts := make([]ProductEntity, count)
		mongoDocs := make([]interface{}, count)
		rSource := rand.New(rand.NewSource(time.Now().UnixNano()))

		for i := 0; i < count; i++ {
			name := fmt.Sprintf("Product-%d", i+1)
			priceVal := 1.0 + rSource.Float64()*500.0
			priceStr := fmt.Sprintf("%.2f", priceVal)
			priceRound, _ := strconv.ParseFloat(priceStr, 64)
			category := categories[rSource.Intn(len(categories))]

			meta := JSONMap{
				"sku":     fmt.Sprintf("SKU-%06d", i+1),
				"weight":  math.Round(rSource.Float64()*10.0*100) / 100,
				"inStock": rSource.Float64() > 0.2,
			}

			sqlProducts[i] = ProductEntity{
				Name:      name,
				Price:     priceStr,
				Category:  category,
				Metadata:  meta,
				CreatedAt: time.Now(),
			}

			mongoDocs[i] = ProductDocument{
				Name:      name,
				Price:     priceRound,
				Category:  category,
				Metadata:  meta,
				CreatedAt: time.Now(),
			}
		}

		// Insert into Postgres
		if err := gormDB.Create(&sqlProducts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Insert into Mongo
		_, err = mongoColl.InsertMany(context.Background(), mongoDocs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"seeded": count})
	})

	// POST /api/sql/products
	r.POST("/api/sql/products", func(c *gin.Context) {
		var req struct {
			Name     string                 `json:"name" binding:"required"`
			Price    float64                `json:"price" binding:"required"`
			Category string                 `json:"category" binding:"required"`
			Metadata map[string]interface{} `json:"metadata"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		product := ProductEntity{
			Name:      req.Name,
			Price:     fmt.Sprintf("%.2f", req.Price),
			Category:  req.Category,
			Metadata:  req.Metadata,
			CreatedAt: time.Now(),
		}

		if err := gormDB.Create(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, product)
	})

	// GET /api/sql/products/category/:category
	r.GET("/api/sql/products/category/:category", func(c *gin.Context) {
		category := c.Param("category")
		var products []ProductEntity
		if err := gormDB.Where("category = ?", category).Order("created_at desc").Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, products)
	})

	// GET /api/nosql/products/category/:category
	r.GET("/api/nosql/products/category/:category", func(c *gin.Context) {
		category := c.Param("category")
		filter := bson.M{"category": category}
		opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
		cursor, err := mongoColl.Find(context.Background(), filter, opts)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		var products []ProductDocument = []ProductDocument{}
		if err := cursor.All(context.Background(), &products); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, products)
	})

	// GET /api/compare
	r.GET("/api/compare", func(c *gin.Context) {
		category := c.DefaultQuery("category", "Electronics")

		// SQL Category timing
		start := time.Now()
		var sqlProducts []ProductEntity
		_ = gormDB.Where("category = ?", category).Order("created_at desc").Find(&sqlProducts).Error
		sqlCatMs := float64(time.Since(start).Nanoseconds()) / 1e6

		// NoSQL Category timing
		start = time.Now()
		filter := bson.M{"category": category}
		opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
		cursor, _ := mongoColl.Find(context.Background(), filter, opts)
		var nosqlProducts []ProductDocument = []ProductDocument{}
		if cursor != nil {
			_ = cursor.All(context.Background(), &nosqlProducts)
			cursor.Close(context.Background())
		}
		nosqlCatMs := float64(time.Since(start).Nanoseconds()) / 1e6

		// SQL Search timing
		keyword := "Product-1"
		start = time.Now()
		var sqlSearch []ProductEntity
		_ = gormDB.Where("name LIKE ?", "%"+keyword+"%").Order("created_at desc").Find(&sqlSearch).Error
		sqlSearchMs := float64(time.Since(start).Nanoseconds()) / 1e6

		// NoSQL Search timing
		start = time.Now()
		filterSearch := bson.M{"name": bson.M{"$regex": keyword, "$options": "i"}}
		optsSearch := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
		cursorSearch, _ := mongoColl.Find(context.Background(), filterSearch, optsSearch)
		var nosqlSearch []ProductDocument = []ProductDocument{}
		if cursorSearch != nil {
			_ = cursorSearch.All(context.Background(), &nosqlSearch)
			cursorSearch.Close(context.Background())
		}
		nosqlSearchMs := float64(time.Since(start).Nanoseconds()) / 1e6

		c.JSON(http.StatusOK, gin.H{
			"findByCategory": gin.H{
				"sqlMs":      math.Round(sqlCatMs*100) / 100,
				"nosqlMs":    math.Round(nosqlCatMs*100) / 100,
				"sqlCount":   len(sqlProducts),
				"nosqlCount": len(nosqlProducts),
			},
			"search": gin.H{
				"sqlMs":      math.Round(sqlSearchMs*100) / 100,
				"nosqlMs":    math.Round(nosqlSearchMs*100) / 100,
				"sqlCount":   len(sqlSearch),
				"nosqlCount": len(nosqlSearch),
			},
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	_ = r.Run(":" + port)
}
