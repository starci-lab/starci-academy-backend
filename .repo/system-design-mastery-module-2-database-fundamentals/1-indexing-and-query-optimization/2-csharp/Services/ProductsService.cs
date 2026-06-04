using Microsoft.EntityFrameworkCore;
using IndexingOptimization.Data;
using IndexingOptimization.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace IndexingOptimization.Services
{
    public class ProductsService
    {
        private static readonly string[] Categories = {
            "Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food & Beverage", "Health", "Automotive", "Music"
        };

        private static readonly string[] Brands = {
            "Acme", "Zenith", "Pinnacle", "Vertex", "Nova", "Apex", "Stellar", "Orbit", "Quantum", "Flux", "Titan", "Vortex", "Prism", "Nexus", "Echo"
        };

        private static readonly string[] Adjectives = {
            "Premium", "Ultra", "Pro", "Elite", "Classic", "Advanced", "Essential", "Deluxe", "Standard", "Compact"
        };

        private static readonly string[] Nouns = {
            "Widget", "Gadget", "Device", "Tool", "Kit", "System", "Module", "Unit", "Pack", "Set"
        };

        private readonly SqlDbContext _context;

        public ProductsService(SqlDbContext context)
        {
            _context = context;
        }

        public async Task<object> SeedAsync(int count)
        {
            var rand = new Random();
            int batchSize = 500;
            int inserted = 0;

            for (int i = 0; i < count; i += batchSize)
            {
                int currentBatchSize = Math.Min(batchSize, count - i);
                var batch = new List<ProductEntity>();

                for (int j = 0; j < currentBatchSize; j++)
                {
                    var adjective = Adjectives[rand.Next(Adjectives.Length)];
                    var noun = Nouns[rand.Next(Nouns.Length)];
                    var brand = Brands[rand.Next(Brands.Length)];
                    var name = $"{brand} {adjective} {noun}";
                    var sku = $"{((char)('A' + rand.Next(26)))}{((char)('A' + rand.Next(26)))}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{i + j}";
                    var price = Math.Round(rand.NextDouble() * 999.0 + 1.0, 2);
                    var category = Categories[rand.Next(Categories.Length)];
                    var description = $"High-quality {adjective.ToLower()} {noun.ToLower()} by {brand}. Built for performance and reliability.";
                    var stock = rand.Next(1000);
                    var rating = Math.Round(rand.NextDouble() * 4.0 + 1.0, 1);

                    batch.Add(new ProductEntity
                    {
                        Id = Guid.NewGuid(),
                        Name = name,
                        Sku = sku,
                        Price = (decimal)price,
                        Category = category,
                        Brand = brand,
                        Description = description,
                        Stock = stock,
                        Rating = (decimal)rating,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                _context.Products.AddRange(batch);
                await _context.SaveChangesAsync();
                inserted += currentBatchSize;
            }

            return new { inserted };
        }

        public async Task<object> FindWithoutIndexAsync(string category)
        {
            var sw = new Stopwatch();
            sw.Start();

            List<ProductEntity> rows;
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                await _context.Database.ExecuteSqlRawAsync("SET enable_indexscan = OFF");
                await _context.Database.ExecuteSqlRawAsync("SET enable_bitmapscan = OFF");

                rows = await _context.Products
                    .FromSqlRaw("SELECT * FROM products WHERE category = {0} ORDER BY price ASC", category)
                    .ToListAsync();

                await _context.Database.ExecuteSqlRawAsync("SET enable_indexscan = ON");
                await _context.Database.ExecuteSqlRawAsync("SET enable_bitmapscan = ON");

                await transaction.CommitAsync();
            }

            sw.Stop();
            double executionTimeMs = sw.Elapsed.TotalMilliseconds;

            return new
            {
                rows,
                executionTimeMs = Math.Round(executionTimeMs, 3)
            };
        }

        public async Task<object> FindWithIndexAsync(string category, double minPrice)
        {
            var sw = new Stopwatch();
            sw.Start();

            var rows = await _context.Products
                .Where(p => p.Category == category && p.Price >= (decimal)minPrice)
                .OrderBy(p => p.Price)
                .ToListAsync();

            sw.Stop();
            double executionTimeMs = sw.Elapsed.TotalMilliseconds;

            return new
            {
                rows,
                executionTimeMs = Math.Round(executionTimeMs, 3)
            };
        }

        public async Task<object> ExplainQueryAsync(string sql) {
            var planLines = new List<string>();
            using (var conn = _context.Database.GetDbConnection())
            {
                if (conn.State != ConnectionState.Open) await conn.OpenAsync();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "EXPLAIN ANALYZE " + sql;
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            planLines.Add(reader.GetString(0));
                        }
                    }
                }
            }
            return new { plan = string.Join("\n", planLines) };
        }

        public async Task<object> CompareQueriesAsync()
        {
            var rand = new Random();
            var category = Categories[rand.Next(Categories.Length)];
            var minPrice = Math.Round(rand.NextDouble() * 200.0 + 50.0, 2);

            var sql = $"SELECT * FROM products WHERE category = '{category}' AND price >= {minPrice.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)} ORDER BY price ASC";

            string planWithout;
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                await _context.Database.ExecuteSqlRawAsync("SET enable_indexscan = OFF");
                await _context.Database.ExecuteSqlRawAsync("SET enable_bitmapscan = OFF");

                var planLines = new List<string>();
                using (var conn = _context.Database.GetDbConnection())
                {
                    if (conn.State != ConnectionState.Open) await conn.OpenAsync();
                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "EXPLAIN ANALYZE " + sql;
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                planLines.Add(reader.GetString(0));
                            }
                        }
                    }
                }
                planWithout = string.Join("\n", planLines);

                await _context.Database.ExecuteSqlRawAsync("SET enable_indexscan = ON");
                await _context.Database.ExecuteSqlRawAsync("SET enable_bitmapscan = ON");

                await transaction.CommitAsync();
            }

            var planLinesWith = new List<string>();
            using (var conn = _context.Database.GetDbConnection())
            {
                if (conn.State != ConnectionState.Open) await conn.OpenAsync();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "EXPLAIN ANALYZE " + sql;
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            planLinesWith.Add(reader.GetString(0));
                        }
                    }
                }
            }
            var planWith = string.Join("\n", planLinesWith);

            var timeWithout = ExtractExecutionTime(planWithout);
            var timeWith = ExtractExecutionTime(planWith);

            return new
            {
                withoutIndex = new { plan = planWithout, executionTimeMs = timeWithout },
                withIndex = new { plan = planWith, executionTimeMs = timeWith },
                summary = $"Query: SELECT * FROM products WHERE category='{category}' AND price >= {minPrice.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)} ORDER BY price ASC"
            };
        }

        private string ExtractExecutionTime(string plan)
        {
            var match = Regex.Match(plan, @"Execution Time:\s+([\d.]+)\s+ms");
            return match.Success ? $"{match.Groups[1].Value} ms" : "N/A";
        }

        public async Task<object> GetTableStatsAsync()
        {
            var tableStats = new Dictionary<string, object>();
            var indexStats = new List<object>();

            using (var conn = _context.Database.GetDbConnection())
            {
                if (conn.State != ConnectionState.Open) await conn.OpenAsync();

                // Table stats
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT relname AS table_name, seq_scan, idx_scan, n_live_tup AS live_rows FROM pg_stat_user_tables WHERE relname = 'products'";
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            tableStats["table_name"] = reader.GetString(0);
                            tableStats["seq_scan"] = reader.GetInt64(1);
                            tableStats["idx_scan"] = reader.GetInt64(2);
                            tableStats["live_rows"] = reader.GetInt64(3);
                        }
                    }
                }

                // Index stats
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT indexrelname AS index_name, idx_scan AS times_used, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size FROM pg_stat_user_indexes WHERE relname = 'products'";
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            indexStats.Add(new
                            {
                                index_name = reader.GetString(0),
                                times_used = reader.GetInt64(1),
                                index_size = reader.GetString(2)
                            });
                        }
                    }
                }
            }

            return new { tableStats, indexStats };
        }
    }
}
