using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using ShardingStrategies.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShardingStrategies.Services
{
    public class UsersService
    {
        private static readonly string[] Countries = {
            "US", "UK", "DE", "FR", "JP", "KR", "IN", "BR", "AU", "CA",
            "SG", "VN", "TH", "ID", "MX", "ES", "IT", "NL", "SE", "PL"
        };

        private static readonly string[] Tiers = {"free", "pro", "enterprise"};

        private static readonly string[] FirstNames = {
            "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace",
            "Henry", "Iris", "Jack", "Karen", "Leo", "Mia", "Noah", "Olivia"
        };

        private static readonly string[] LastNames = {
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
            "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"
        };

        private readonly IMongoClient _client;
        private readonly IMongoDatabase _database;
        private readonly IMongoCollection<UserEntity> _usersCollection;

        public UsersService(IMongoClient client)
        {
            _client = client;
            _database = client.GetDatabase("app");
            _usersCollection = _database.GetCollection<UserEntity>("users");
        }

        public async Task<UserEntity> CreateAsync(UserEntity user)
        {
            if (user.CreatedAt == default)
            {
                user.CreatedAt = DateTime.UtcNow;
            }
            await _usersCollection.InsertOneAsync(user);
            return user;
        }

        public async Task<UserEntity?> FindByUserIdAsync(string userId)
        {
            var filter = Builders<UserEntity>.Filter.Eq(u => u.UserId, userId);
            return await _usersCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<UserEntity>> FindByCountryAsync(string country)
        {
            var filter = Builders<UserEntity>.Filter.Eq(u => u.Country, country);
            return await _usersCollection.Find(filter).ToListAsync();
        }

        public async Task<List<UserEntity>> FindByTierAsync(string tier)
        {
            var filter = Builders<UserEntity>.Filter.Eq(u => u.Tier, tier);
            return await _usersCollection.Find(filter).ToListAsync();
        }

        public async Task<object> SeedAsync(int count)
        {
            var rand = new Random();
            var batchSize = 1000;
            var inserted = 0;

            for (int i = 0; i < count; i += batchSize)
            {
                int currentBatchSize = Math.Min(batchSize, count - i);
                var batch = new List<UserEntity>(currentBatchSize);

                for (int j = 0; j < currentBatchSize; j++)
                {
                    var firstName = FirstNames[rand.Next(FirstNames.Length)];
                    var lastName = LastNames[rand.Next(LastNames.Length)];
                    var suffix = Guid.NewGuid().ToString("n").Substring(0, 8);

                    var user = new UserEntity
                    {
                        UserId = $"user-{suffix}-{i + j}",
                        Email = $"{firstName.ToLower()}.{lastName.ToLower()}.{suffix}@example.com",
                        Name = $"{firstName} {lastName}",
                        Country = Countries[rand.Next(Countries.Length)],
                        Tier = Tiers[rand.Next(Tiers.Length)],
                        LoginCount = rand.Next(500),
                        LastLoginAt = DateTime.UtcNow.AddDays(-rand.Next(30)),
                        CreatedAt = DateTime.UtcNow.AddDays(-rand.Next(365))
                    };
                    batch.Add(user);
                }

                await _usersCollection.InsertManyAsync(batch, new InsertManyOptions { IsOrdered = false });
                inserted += currentBatchSize;
            }

            return new { inserted };
        }

        public async Task<object> GetShardDistributionAsync()
        {
            var command = new BsonDocument("collStats", "users");
            var stats = await _database.RunCommandAsync<BsonDocument>(command);

            return new
            {
                ns = stats.GetValue("ns", "").ToString(),
                sharded = stats.GetValue("sharded", false).AsBoolean,
                count = stats.GetValue("count", 0L).ToInt64(),
                size = stats.GetValue("size", 0L).ToInt64(),
                storageSize = stats.GetValue("storageSize", 0L).ToInt64(),
                nchunks = stats.GetValue("nchunks", 0).ToInt32(),
                shards = BsonTypeMapper.MapToDotNetValue(stats.GetValue("shards", new BsonDocument()))
            };
        }

        public async Task<object> GetShardStatusAsync()
        {
            var adminDb = _client.GetDatabase("admin");
            var shardsDoc = await adminDb.RunCommandAsync<BsonDocument>(new BsonDocument("listShards", 1));
            var databasesDoc = await adminDb.RunCommandAsync<BsonDocument>(new BsonDocument("listDatabases", 1));

            var configDb = _client.GetDatabase("config");
            
            var chunksCursor = await configDb.GetCollection<BsonDocument>("chunks").FindAsync(new BsonDocument("ns", "app.users"));
            var chunksList = await chunksCursor.ToListAsync();

            var collectionsCursor = await configDb.GetCollection<BsonDocument>("collections").FindAsync(new BsonDocument());
            var colList = await collectionsCursor.ToListAsync();

            var chunks = chunksList.Select(c => new
            {
                shard = c.GetValue("shard", "").ToString(),
                min = BsonTypeMapper.MapToDotNetValue(c.GetValue("min")),
                max = BsonTypeMapper.MapToDotNetValue(c.GetValue("max"))
            }).ToList();

            var shardedCollections = colList.Select(c => new
            {
                ns = c.GetValue("_id", "").ToString(),
                key = BsonTypeMapper.MapToDotNetValue(c.GetValue("key")),
                unique = c.GetValue("unique", false).AsBoolean
            }).ToList();

            return new
            {
                shards = BsonTypeMapper.MapToDotNetValue(shardsDoc.GetValue("shards", new BsonArray())),
                databases = BsonTypeMapper.MapToDotNetValue(databasesDoc.GetValue("databases", new BsonArray())),
                chunks,
                shardedCollections
            };
        }

        public async Task<object> ExplainQueryAsync(string field, string value)
        {
            var query = new BsonDocument
            {
                { "find", "users" },
                { "filter", new BsonDocument(field, value) }
            };
            var explainCmd = new BsonDocument
            {
                { "explain", query },
                { "verbosity", "executionStats" }
            };
            var explanation = await _database.RunCommandAsync<BsonDocument>(explainCmd);
            return BsonTypeMapper.MapToDotNetValue(explanation);
        }
    }
}
