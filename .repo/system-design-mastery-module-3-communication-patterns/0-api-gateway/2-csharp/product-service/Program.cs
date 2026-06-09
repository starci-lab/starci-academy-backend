var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var products = new List<Product>();
var gate = new object();
long counter = 0;

app.MapGet("/products", () =>
{
    lock (gate) { return products.ToList(); }
});
app.MapPost("/products", (Product input) =>
{
    lock (gate)
    {
        var created = new Product(++counter, input.Name, input.Price, input.Stock);
        products.Add(created);
        return Results.Created($"/products/{created.Id}", created);
    }
});

app.Run("http://0.0.0.0:3002");

public record Product(long Id, string Name, double Price, int Stock);
