using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var orders = new ConcurrentDictionary<long, Order>();
long counter = 0;

app.MapGet("/orders", () => orders.Values);
app.MapPost("/orders", (OrderInput input) =>
{
    var id = Interlocked.Increment(ref counter);
    var created = new Order(id, input.ProductId, input.Quantity, "PENDING");
    orders.TryAdd(id, created);
    return Results.Created($"/orders/{id}", created);
});

app.Run("http://0.0.0.0:3003");

public record OrderInput(long ProductId, int Quantity);
public record Order(long Id, long ProductId, int Quantity, string Status);
