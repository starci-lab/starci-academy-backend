var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var orders = new List<Order>();
var gate = new object();
long counter = 0;

app.MapGet("/orders", () =>
{
    lock (gate) { return orders.ToList(); }
});
app.MapPost("/orders", (OrderInput input) =>
{
    lock (gate)
    {
        var created = new Order(++counter, input.ProductId, input.Quantity, "PENDING");
        orders.Add(created);
        return Results.Created($"/orders/{created.Id}", created);
    }
});

app.Run("http://0.0.0.0:3003");

public record OrderInput(long ProductId, int Quantity);
public record Order(long Id, long ProductId, int Quantity, string Status);
