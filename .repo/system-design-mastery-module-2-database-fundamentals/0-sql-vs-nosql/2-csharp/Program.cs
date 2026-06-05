using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using SqlVsNosql.Data;
using SqlVsNosql.Services;
using System;

var builder = WebApplication.CreateBuilder(args);

// Configure port
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://localhost:{port}");
}

// Build PostgreSQL connection string
var pgHost = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
var pgPort = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
var pgDb = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "sql_nosql_db";
var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "Cuong123_A";
var pgConnString = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass};Include Error Detail=true";

builder.Services.AddDbContext<SqlDbContext>(options =>
    options.UseNpgsql(pgConnString));

// Build MongoDB client
var mongoUri = Environment.GetEnvironmentVariable("MONGO_URI") ?? "mongodb://localhost:27017/sql_nosql_db";
builder.Services.AddSingleton<IMongoClient>(new MongoClient(mongoUri));

// Services
builder.Services.AddScoped<SqlService>();
builder.Services.AddScoped<NosqlService>();
builder.Services.AddScoped<CompareService>();

builder.Services.AddControllers();

var app = builder.Build();

// Ensure SQL DB and table exists
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SqlDbContext>();
    context.Database.EnsureCreated();
}

app.MapControllers();
app.Run();
