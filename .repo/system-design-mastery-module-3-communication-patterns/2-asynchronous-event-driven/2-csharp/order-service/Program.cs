using Confluent.Kafka;
using System.Collections.Concurrent;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var config = new ProducerConfig
{
    BootstrapServers = "localhost:9092"
};
var producer = new ProducerBuilder<string, string>(config).Build();
builder.Services.AddSingleton(producer);

var app = builder.Build();

var orders = new ConcurrentDictionary<int, Order>();

app.MapGet("/orders", () => orders.Values);
app.MapPost("/orders", async (CreateOrderDto dto, IProducer<string, string> prod) =>
{
    var orderId = Random.Shared.Next(1, 100000);
    var order = new Order(orderId, dto.ProductName, dto.Quantity, "PENDING");
    orders.TryAdd(orderId, order);

    try
    {
        var ev = new
        {
            eventType = "ORDER_CREATED",
            orderId = orderId,
            productName = dto.ProductName,
            quantity = dto.Quantity,
            timestamp = DateTime.UtcNow.ToString("o")
        };
        var message = JsonSerializer.Serialize(ev);
        await prod.ProduceAsync("order-events", new Message<string, string> { Value = message });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error publishing event: {ex.Message}");
    }

    return Results.Json(order, statusCode: 201);
});

app.Run("http://0.0.0.0:3001");

public record CreateOrderDto(string ProductName, int Quantity);
public record Order(int Id, string ProductName, int Quantity, string Status);
