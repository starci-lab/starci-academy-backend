using SqlVsNosql.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text.Json.Nodes;
using System.Threading.Tasks;

namespace SqlVsNosql.Services
{
    public class CompareService
    {
        private static readonly string[] Categories = {
            "Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food", "Automotive"
        };

        private readonly SqlService _sqlService;
        private readonly NosqlService _nosqlService;

        public CompareService(SqlService sqlService, NosqlService nosqlService)
        {
            _sqlService = sqlService;
            _nosqlService = nosqlService;
        }

        public async Task<object> SeedAsync(int count)
        {
            var dtos = new List<CreateProductDto>(count);
            var rand = new Random();

            for (int i = 0; i < count; i++)
            {
                var name = $"Product-{i + 1}";
                var price = Math.Round(rand.NextDouble() * 500.0 + 1.0, 2);
                var category = Categories[rand.Next(Categories.Length)];
                
                var metadata = new JsonObject
                {
                    ["sku"] = $"SKU-{(i + 1):D6}",
                    ["weight"] = Math.Round(rand.NextDouble() * 10.0, 2),
                    ["inStock"] = rand.NextDouble() > 0.2
                };

                dtos.Add(new CreateProductDto
                {
                    Name = name,
                    Price = price,
                    Category = category,
                    Metadata = metadata
                });
            }

            await _sqlService.DeleteAllAsync();
            await _nosqlService.DeleteAllAsync();

            await _sqlService.CreateManyAsync(dtos);
            await _nosqlService.CreateManyAsync(dtos);

            return new { seeded = count };
        }

        public async Task<object> CompareAsync(string category)
        {
            var sw = new Stopwatch();

            // SQL Category
            sw.Start();
            var sqlCatRes = await _sqlService.FindByCategoryAsync(category);
            sw.Stop();
            double sqlCatMs = sw.Elapsed.TotalMilliseconds;

            // NoSQL Category
            sw.Reset();
            sw.Start();
            var nosqlCatRes = await _nosqlService.FindByCategoryAsync(category);
            sw.Stop();
            double nosqlCatMs = sw.Elapsed.TotalMilliseconds;

            // SQL Search
            var keyword = "Product-1";
            sw.Reset();
            sw.Start();
            var sqlSearchRes = await _sqlService.SearchAsync(keyword);
            sw.Stop();
            double sqlSearchMs = sw.Elapsed.TotalMilliseconds;

            // NoSQL Search
            sw.Reset();
            sw.Start();
            var nosqlSearchRes = await _nosqlService.SearchAsync(keyword);
            sw.Stop();
            double nosqlSearchMs = sw.Elapsed.TotalMilliseconds;

            return new
            {
                findByCategory = new
                {
                    sqlMs = Math.Round(sqlCatMs, 2),
                    nosqlMs = Math.Round(nosqlCatMs, 2),
                    sqlCount = sqlCatRes.Count,
                    nosqlCount = nosqlCatRes.Count
                },
                search = new
                {
                    sqlMs = Math.Round(sqlSearchMs, 2),
                    nosqlMs = Math.Round(nosqlSearchMs, 2),
                    sqlCount = sqlSearchRes.Count,
                    nosqlCount = nosqlSearchRes.Count
                }
            };
        }
    }
}
