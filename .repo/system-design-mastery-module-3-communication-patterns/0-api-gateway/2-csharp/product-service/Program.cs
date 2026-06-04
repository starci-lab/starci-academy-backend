using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var products = new ConcurrentDictionary<long, Product>();
long counter = 0;

products.TryAdd(Interlocked.Increment(ref counter), new Product(1, "Laptop", 1500.0, 10));

app.MapGet("/products", () => products.Values);
app.MapPost("/products", (Product input) =>
{
    var id = Interlocked.Increment(ref counter);
    var created = new Product(id, input.Name, input.Price, input.Stock);
    products.TryAdd(id, created);
    return Results.Created($"/products/{id}", created);
});

app.Run("http://0.0.0.0:3002");

public record Product(long Id, string Name, double Price, int Stock);
