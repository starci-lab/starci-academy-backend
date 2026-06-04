using System;
using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShardingStrategies.Models
{
    public class UserEntity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [JsonIgnore] // Typically we don't expose MongoDB _id in responses or keep it ignored
        public string? Id { get; set; }

        [BsonElement("userId")]
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = null!;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = null!;

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;

        [BsonElement("country")]
        [JsonPropertyName("country")]
        public string Country { get; set; } = null!;

        [BsonElement("tier")]
        [JsonPropertyName("tier")]
        public string Tier { get; set; } = "free";

        [BsonElement("loginCount")]
        [JsonPropertyName("loginCount")]
        public int LoginCount { get; set; }

        [BsonElement("lastLoginAt")]
        [JsonPropertyName("lastLoginAt")]
        public DateTime LastLoginAt { get; set; }

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
