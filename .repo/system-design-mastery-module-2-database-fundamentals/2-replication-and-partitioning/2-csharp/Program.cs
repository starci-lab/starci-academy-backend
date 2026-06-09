using Microsoft.EntityFrameworkCore;
using Npgsql;
using ReplicationPartitioning.Data;
using ReplicationPartitioning.Models;
using ReplicationPartitioning.Services;
using System;

var builder = WebApplication.CreateBuilder(args);

// Configure port
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "3002";
builder.WebHost.UseUrls($"http://localhost:{port}");
}

// Master / Primary Connection
var pgMasterHost = Environment.GetEnvironmentVariable("POSTGRES_MASTER_HOST") ?? "localhost";
var pgMasterPort = Environment.GetEnvironmentVariable("POSTGRES_MASTER_PORT") ?? "5432";
var pgDb = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "orders_db";
var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "Cuong123_A";
var pgMasterConnString = $"Host={pgMasterHost};Port={pgMasterPort};Database={pgDb};Username={pgUser};Password={pgPass};Include Error Detail=true";

// Build a data source that maps the PostgreSQL enum so EF sends OrderStatus as orders_status_enum.
var masterDsBuilder = new NpgsqlDataSourceBuilder(pgMasterConnString);
masterDsBuilder.MapEnum<OrderStatus>("orders_status_enum");
var masterDataSource = masterDsBuilder.Build();

builder.Services.AddDbContext<WriteDbContext>(options =>
    options.UseNpgsql(masterDataSource));

// Replica Connection
var pgReplicaHost = Environment.GetEnvironmentVariable("POSTGRES_REPLICA_HOST") ?? "localhost";
var pgReplicaPort = Environment.GetEnvironmentVariable("POSTGRES_REPLICA_PORT") ?? "5433";
var pgReplicaConnString = $"Host={pgReplicaHost};Port={pgReplicaPort};Database={pgDb};Username={pgUser};Password={pgPass};Include Error Detail=true";

var replicaDsBuilder = new NpgsqlDataSourceBuilder(pgReplicaConnString);
replicaDsBuilder.MapEnum<OrderStatus>("orders_status_enum");
var replicaDataSource = replicaDsBuilder.Build();

builder.Services.AddDbContext<ReadDbContext>(options =>
    options.UseNpgsql(replicaDataSource));

// Services
builder.Services.AddScoped<OrdersService>();

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();
app.Run();
