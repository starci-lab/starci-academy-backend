using MongoDB.Bson;
using MongoDB.Driver;
using SqlVsNosql.Models;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace SqlVsNosql.Services
{
    public class NosqlService
    {
        private readonly IMongoCollection<ProductDocument> _collection;

        public NosqlService(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("sql_nosql_db");
            _collection = database.GetCollection<ProductDocument>("products");
        }

        public async Task<ProductDocument> CreateAsync(CreateProductDto dto)
        {
            var metadataDict = dto.Metadata != null 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(dto.Metadata.ToJsonString()) 
                : null;

            var doc = new ProductDocument
            {
                Name = dto.Name,
                Price = dto.Price,
                Category = dto.Category,
                Metadata = metadataDict,
                CreatedAt = DateTime.UtcNow
            };

            await _collection.InsertOneAsync(doc);
            return doc;
        }

        public async Task CreateManyAsync(List<CreateProductDto> dtos)
        {
            var docs = new List<ProductDocument>();
            foreach (var dto in dtos)
            {
                var metadataDict = dto.Metadata != null 
                    ? JsonSerializer.Deserialize<Dictionary<string, object>>(dto.Metadata.ToJsonString()) 
                    : null;

                docs.Add(new ProductDocument
                {
                    Name = dto.Name,
                    Price = dto.Price,
                    Category = dto.Category,
                    Metadata = metadataDict,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (docs.Count > 0)
            {
                await _collection.InsertManyAsync(docs);
            }
        }

        public async Task<List<ProductDocument>> FindAllAsync()
        {
            return await _collection.Find(new BsonDocument())
                .SortByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ProductDocument>> FindByCategoryAsync(string category)
        {
            return await _collection.Find(p => p.Category == category)
                .SortByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ProductDocument>> SearchAsync(string keyword)
        {
            // Regex match name case-insensitive
            var filter = Builders<ProductDocument>.Filter.Regex(p => p.Name, new BsonRegularExpression(keyword, "i"));
            return await _collection.Find(filter)
                .SortByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task DeleteAllAsync()
        {
            await _collection.DeleteManyAsync(new BsonDocument());
        }

        public async Task<long> CountAsync()
        {
            return await _collection.CountDocumentsAsync(new BsonDocument());
        }
    }
}
