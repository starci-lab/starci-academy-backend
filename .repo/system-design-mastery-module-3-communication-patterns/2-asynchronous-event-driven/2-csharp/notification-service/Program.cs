using Confluent.Kafka;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<NotificationKafkaConsumer>();
var app = builder.Build();
app.Run();

public class NotificationKafkaConsumer : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Run(() =>
        {
            var config = new ConsumerConfig
            {
                BootstrapServers = "localhost:9092",
                GroupId = "notification-consumer",
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe("order-events");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);
                    var payload = JsonSerializer.Deserialize<JsonElement>(result.Message.Value);
                    var eventType = payload.GetProperty("eventType").GetString();

                    if (eventType == "ORDER_CREATED")
                    {
                        var orderId = payload.GetProperty("orderId").GetInt32();
                        var productName = payload.GetProperty("productName").GetString();
                        var quantity = payload.GetProperty("quantity").GetInt32();

                        Console.WriteLine($"notification-service | Received ORDER_CREATED: order {orderId} ({productName} x{quantity})");
                        Console.WriteLine($"notification-service | Sending notification for order {orderId}...");
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error processing message: {ex.Message}");
                }
            }
        }, stoppingToken);
    }
}
