using Microsoft.EntityFrameworkCore;
using ReplicationPartitioning.Data;
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

builder.Services.AddDbContext<WriteDbContext>(options =>
    options.UseNpgsql(pgMasterConnString));

// Replica Connection
var pgReplicaHost = Environment.GetEnvironmentVariable("POSTGRES_REPLICA_HOST") ?? "localhost";
var pgReplicaPort = Environment.GetEnvironmentVariable("POSTGRES_REPLICA_PORT") ?? "5433";
var pgReplicaConnString = $"Host={pgReplicaHost};Port={pgReplicaPort};Database={pgDb};Username={pgUser};Password={pgPass};Include Error Detail=true";

builder.Services.AddDbContext<ReadDbContext>(options =>
    options.UseNpgsql(pgReplicaConnString));

// Services
builder.Services.AddScoped<OrdersService>();

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();
app.Run();
