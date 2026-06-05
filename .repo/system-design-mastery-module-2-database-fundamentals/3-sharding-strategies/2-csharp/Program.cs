using MongoDB.Driver;
using ShardingStrategies.Services;
using System;

var builder = WebApplication.CreateBuilder(args);

// Configure port
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "3003";
builder.WebHost.UseUrls($"http://localhost:{port}");
}

// MongoDB Connection
var mongoUri = Environment.GetEnvironmentVariable("MONGO_URI") ?? "mongodb://localhost:27017/app";
builder.Services.AddSingleton<IMongoClient>(sp => new MongoClient(mongoUri));

// Services
builder.Services.AddScoped<UsersService>();

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();
app.Run();
