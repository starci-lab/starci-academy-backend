using Microsoft.EntityFrameworkCore;
using ReplicationPartitioning.Data;
using ReplicationPartitioning.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace ReplicationPartitioning.Services
{
    public class OrdersService
    {
        private static readonly string[] Regions = {"us-east", "us-west", "eu-west", "eu-east", "ap-southeast"};
        private static readonly string[] Products = {"Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse"};
        private static readonly OrderStatus[] Statuses = { OrderStatus.pending, OrderStatus.completed, OrderStatus.cancelled };

        private readonly WriteDbContext _writeContext;
        private readonly ReadDbContext _readContext;

        public OrdersService(WriteDbContext writeContext, ReadDbContext readContext)
        {
            _writeContext = writeContext;
            _readContext = readContext;
        }

        public async Task<OrderEntity> CreateAsync(OrderEntity order)
        {
            order.Id = Guid.NewGuid();
            if (order.CreatedAt == default)
            {
                order.CreatedAt = DateTime.UtcNow;
            }
            _writeContext.Orders.Add(order);
            await _writeContext.SaveChangesAsync();
            return order;
        }

        public async Task<List<OrderEntity>> FindAllAsync()
        {
            // Read from replica
            return await _readContext.Orders
                .OrderByDescending(o => o.CreatedAt)
                .Take(100)
                .ToListAsync();
        }

        public async Task<object> SeedAsync(int count)
        {
            var rand = new Random();
            var orders = new List<OrderEntity>(count);

            for (int i = 0; i < count; i++)
            {
                int month = (i % 12) + 1;
                int day = (i % 28) + 1;

                var amount = Math.Round(rand.NextDouble() * 2000.0 + 10.0, 2);
                var order = new OrderEntity
                {
                    Id = Guid.NewGuid(),
                    CustomerId = $"cust-{(i + 1):D4}",
                    Product = Products[i % Products.Length],
                    Amount = (decimal)amount,
                    Region = Regions[i % Regions.Length],
                    Status = Statuses[i % Statuses.Length],
                    CreatedAt = new DateTime(2024, month, day, 12, 0, 0, DateTimeKind.Utc)
                };
                orders.Add(order);
            }

            _writeContext.Orders.AddRange(orders);
            await _writeContext.SaveChangesAsync();

            return new { inserted = count };
        }

        public async Task<List<Dictionary<string, object>>> GetReplicationStatusAsync()
        {
            var result = new List<Dictionary<string, object>>();
            using (var conn = _writeContext.Database.GetDbConnection())
            {
                if (conn.State != ConnectionState.Open) await conn.OpenAsync();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT client_addr::text, state, sent_lsn::text, write_lsn::text, flush_lsn::text, replay_lsn::text, cast(pg_wal_lsn_diff(sent_lsn, replay_lsn) as text) AS replication_lag_bytes, sync_state FROM pg_stat_replication";
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object>
                            {
                                ["client_addr"] = reader.IsDBNull(0) ? "" : reader.GetString(0),
                                ["state"] = reader.IsDBNull(1) ? "" : reader.GetString(1),
                                ["sent_lsn"] = reader.IsDBNull(2) ? "" : reader.GetString(2),
                                ["replay_lsn"] = reader.IsDBNull(5) ? "" : reader.GetString(5),
                                ["replication_lag_bytes"] = reader.IsDBNull(6) ? "0" : reader.GetString(6),
                                ["sync_state"] = reader.IsDBNull(7) ? "" : reader.GetString(7)
                            };
                            result.Add(row);
                        }
                    }
                }
            }
            return result;
        }

        public async Task<List<Dictionary<string, object>>> GetPartitionInfoAsync()
        {
            var result = new List<Dictionary<string, object>>();
            using (var conn = _writeContext.Database.GetDbConnection())
            {
                if (conn.State != ConnectionState.Open) await conn.OpenAsync();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT parent.relname AS parent_table, child.relname AS partition_name, pg_get_expr(child.relpartbound, child.oid) AS partition_expression, pg_size_pretty(pg_relation_size(child.oid)) AS partition_size FROM pg_inherits JOIN pg_class parent ON pg_inherits.inhparent = parent.oid JOIN pg_class child ON pg_inherits.inhrelid = child.oid WHERE parent.relname = 'orders' ORDER BY child.relname";
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object>
                            {
                                ["parent_table"] = reader.GetString(0),
                                ["partition_name"] = reader.GetString(1),
                                ["partition_expression"] = reader.GetString(2),
                                ["partition_size"] = reader.GetString(3)
                            };
                            result.Add(row);
                        }
                    }
                }
            }
            return result;
        }
    }
}
