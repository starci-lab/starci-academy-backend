package main

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type UserEntity struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"-"`
	UserID      string        `bson:"userId" json:"userId"`
	Email       string        `bson:"email" json:"email"`
	Name        string        `bson:"name" json:"name"`
	Country     string        `bson:"country" json:"country"`
	Tier        string        `bson:"tier" json:"tier"`
	LoginCount  int           `bson:"loginCount" json:"loginCount"`
	LastLoginAt time.Time     `bson:"lastLoginAt" json:"lastLoginAt"`
	CreatedAt   time.Time     `bson:"createdAt" json:"createdAt"`
}

var (
	mongoClient *mongo.Client
	db          *mongo.Database
	collection  *mongo.Collection
)

func initDB() {
	mongoUri := os.Getenv("MONGO_URI")
	if mongoUri == "" {
		mongoUri = "mongodb://localhost:27017/app"
	}

	opts := options.Client().ApplyURI(mongoUri)
	client, err := mongo.Connect(opts)
	if err != nil {
		panic(fmt.Sprintf("failed to connect mongo: %v", err))
	}

	mongoClient = client
	db = client.Database("app")
	collection = db.Collection("users")
}

var (
	countries  = []string{"US", "UK", "DE", "FR", "JP", "KR", "IN", "BR", "AU", "CA", "SG", "VN", "TH", "ID", "MX", "ES", "IT", "NL", "SE", "PL"}
	tiers      = []string{"free", "pro", "enterprise"}
	firstNames = []string{"Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack", "Karen", "Leo", "Mia", "Noah", "Olivia"}
	lastNames  = []string{"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"}
)

func main() {
	initDB()

	r := gin.Default()

	// POST /api/users
	r.POST("/api/users", func(c *gin.Context) {
		var user UserEntity
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if user.CreatedAt.IsZero() {
			user.CreatedAt = time.Now()
		}

		res, err := collection.InsertOne(context.Background(), user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if oid, ok := res.InsertedID.(bson.ObjectID); ok {
			user.ID = oid
		}

		c.JSON(http.StatusCreated, user)
	})

	// GET /api/users/:userId
	r.GET("/api/users/:userId", func(c *gin.Context) {
		userId := c.Param("userId")
		var user UserEntity
		err := collection.FindOne(context.Background(), bson.M{"userId": userId}).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, user)
	})

	// GET /api/users/country/:country
	r.GET("/api/users/country/:country", func(c *gin.Context) {
		country := c.Param("country")
		cursor, err := collection.Find(context.Background(), bson.M{"country": country})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		var users []UserEntity
		if err := cursor.All(context.Background(), &users); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if users == nil {
			users = []UserEntity{}
		}

		c.JSON(http.StatusOK, users)
	})

	// GET /api/users/tier/:tier
	r.GET("/api/users/tier/:tier", func(c *gin.Context) {
		tier := c.Param("tier")
		cursor, err := collection.Find(context.Background(), bson.M{"tier": tier})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		var users []UserEntity
		if err := cursor.All(context.Background(), &users); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if users == nil {
			users = []UserEntity{}
		}

		c.JSON(http.StatusOK, users)
	})

	// POST /api/seed/:count
	r.POST("/api/seed/:count", func(c *gin.Context) {
		countStr := c.Param("count")
		count, err := strconv.Atoi(countStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid count"})
			return
		}

		randSource := rand.New(rand.NewSource(time.Now().UnixNano()))
		batchSize := 1000
		inserted := 0

		for i := 0; i < count; i += batchSize {
			currentBatchSize := batchSize
			if count-i < batchSize {
				currentBatchSize = count - i
			}

			batch := make([]interface{}, currentBatchSize)
			for j := 0; j < currentBatchSize; j++ {
				firstName := firstNames[randSource.Intn(len(firstNames))]
				lastName := lastNames[randSource.Intn(len(lastNames))]
				suffix := strconv.FormatInt(time.Now().UnixNano(), 36) + strconv.FormatInt(randSource.Int63(), 36)

				batch[j] = UserEntity{
					UserID:      fmt.Sprintf("user-%s-%d", suffix, i+j),
					Email:       fmt.Sprintf("%s.%s.%s@example.com", strings.ToLower(firstName), strings.ToLower(lastName), suffix),
					Name:        fmt.Sprintf("%s %s", firstName, lastName),
					Country:     countries[randSource.Intn(len(countries))],
					Tier:        tiers[randSource.Intn(len(tiers))],
					LoginCount:  randSource.Intn(500),
					LastLoginAt: time.Now().AddDate(0, 0, -randSource.Intn(30)),
					CreatedAt:   time.Now().AddDate(0, 0, -randSource.Intn(365)),
				}
			}

			// ordered = false: Continue inserting even if some fail
			opts := options.InsertMany().SetOrdered(false)
			res, err := collection.InsertMany(context.Background(), batch, opts)
			if err != nil {
				// InsertMany might return a partial error, let's still count successfully inserted
				if res != nil {
					inserted += len(res.InsertedIDs)
				}
			} else {
				inserted += currentBatchSize
			}
		}

		c.JSON(http.StatusCreated, gin.H{"inserted": inserted})
	})

	// GET /api/shards/distribution
	r.GET("/api/shards/distribution", func(c *gin.Context) {
		var stats bson.M
		err := db.RunCommand(context.Background(), bson.D{{Key: "collStats", Value: "users"}}).Decode(&stats)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"ns":          stats["ns"],
			"sharded":     stats["sharded"],
			"count":       stats["count"],
			"size":        stats["size"],
			"storageSize": stats["storageSize"],
			"nchunks":     stats["nchunks"],
			"shards":      stats["shards"],
		})
	})

	// GET /api/shards/status
	r.GET("/api/shards/status", func(c *gin.Context) {
		ctx := context.Background()
		adminDb := mongoClient.Database("admin")

		var shardsDoc bson.M
		_ = adminDb.RunCommand(ctx, bson.D{{Key: "listShards", Value: 1}}).Decode(&shardsDoc)

		var databasesDoc bson.M
		_ = adminDb.RunCommand(ctx, bson.D{{Key: "listDatabases", Value: 1}}).Decode(&databasesDoc)

		configDb := mongoClient.Database("config")
		chunksCursor, _ := configDb.Collection("chunks").Find(ctx, bson.M{"ns": "app.users"})
		var rawChunks []bson.M
		_ = chunksCursor.All(ctx, &rawChunks)

		chunks := make([]gin.H, len(rawChunks))
		for idx, cDoc := range rawChunks {
			chunks[idx] = gin.H{
				"shard": cDoc["shard"],
				"min":   cDoc["min"],
				"max":   cDoc["max"],
			}
		}

		colCursor, _ := configDb.Collection("collections").Find(ctx, bson.M{})
		var rawCols []bson.M
		_ = colCursor.All(ctx, &rawCols)

		shardedCollections := make([]gin.H, len(rawCols))
		for idx, cDoc := range rawCols {
			shardedCollections[idx] = gin.H{
				"ns":     cDoc["_id"],
				"key":    cDoc["key"],
				"unique": cDoc["unique"],
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"shards":             shardsDoc["shards"],
			"databases":          databasesDoc["databases"],
			"chunks":             chunks,
			"shardedCollections": shardedCollections,
		})
	})

	// GET /api/shards/explain
	r.GET("/api/shards/explain", func(c *gin.Context) {
		field := c.Query("field")
		value := c.Query("value")

		if field == "" || value == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "field and value are required"})
			return
		}

		query := bson.M{
			"find":   "users",
			"filter": bson.M{field: value},
		}
		explainCmd := bson.D{
			{Key: "explain", Value: query},
			{Key: "verbosity", Value: "executionStats"},
		}

		var explanation bson.M
		err := db.RunCommand(context.Background(), explainCmd).Decode(&explanation)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, explanation)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}
	_ = r.Run(":" + port)
}

// Simple strings package helper functions since we used strings
func toLower(s string) string {
	return s // Gin context has to lower standard imports anyway, let's import strings in main.go
}
