using Microsoft.EntityFrameworkCore;
using ReplicationPartitioning.Models;

namespace ReplicationPartitioning.Data
{
    public class WriteDbContext : DbContext
    {
        public WriteDbContext(DbContextOptions<WriteDbContext> options) : base(options) {}
        public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    }

    public class ReadDbContext : DbContext
    {
        public ReadDbContext(DbContextOptions<ReadDbContext> options) : base(options) {}
        public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    }
}
