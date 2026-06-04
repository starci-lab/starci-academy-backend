using Microsoft.EntityFrameworkCore;
using IndexingOptimization.Data;
using IndexingOptimization.Services;
using System;

var builder = WebApplication.CreateBuilder(args);

// Configure port
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    builder.WebHost.UseUrls("http://*:3001");
}

// Build PostgreSQL connection string
var pgHost = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
var pgPort = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
var pgDb = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "indexing_db";
var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";
var pgConnString = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass};Include Error Detail=true";

builder.Services.AddDbContext<SqlDbContext>(options =>
    options.UseNpgsql(pgConnString));

// Services
builder.Services.AddScoped<ProductsService>();

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();
app.Run();
