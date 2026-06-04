using Confluent.Kafka;
using Microsoft.Extensions.Options;
using System.Text.Json.Nodes;

var builder = WebApplication.CreateBuilder(args);

// Configure port
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://*:{port}");

// Bind options
builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection("Kafka"));

// Register Producer
builder.Services.AddSingleton<IProducer<string, string>>(sp =>
{
    var options = sp.GetRequiredService<IOptions<KafkaOptions>>().Value;
    var brokers = Environment.GetEnvironmentVariable("KAFKA_BROKERS") ?? options.Brokers;
    var producerConfig = new ProducerConfig
    {
        BootstrapServers = brokers
    };
    return new ProducerBuilder<string, string>(producerConfig).Build();
});

// Conditionally register consumer
var runConsumer = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("KAFKA_GROUP_ID")) 
                  || string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT"));
if (runConsumer)
{
    builder.Services.AddHostedService<KafkaConsumerService>();
}

var app = builder.Build();

app.MapPost("/events", async (PublishEventRequest request, IProducer<string, string> producer, IOptions<KafkaOptions> options) =>
{
    if (string.IsNullOrWhiteSpace(request.Type))
    {
        return Results.BadRequest(new { statusCode = 400, message = new[] { "type must be a string" }, error = "Bad Request" });
    }
    if (request.Payload == null)
    {
        return Results.BadRequest(new { statusCode = 400, message = new[] { "payload must be an object" }, error = "Bad Request" });
    }

    var topic = Environment.GetEnvironmentVariable("KAFKA_TOPIC") ?? options.Value.Topic;
    var partitionKey = request.PartitionKey ?? "default";

    var envelope = new Envelope
    {
        Type = request.Type,
        Payload = request.Payload,
        PartitionKey = partitionKey,
        Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    };

    var valueString = System.Text.Json.JsonSerializer.Serialize(envelope, new System.Text.Json.JsonSerializerOptions 
    { 
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase 
    });

    var message = new Message<string, string>
    {
        Key = partitionKey,
        Value = valueString
    };

    await producer.ProduceAsync(topic, message);
    Console.WriteLine($"Produced to {topic} key={partitionKey}");

    return Results.Json(new
    {
        status = "queued",
        topic = topic,
        key = partitionKey
    }, statusCode: 201);
});

app.Run();

public class KafkaOptions
{
    public string Brokers { get; set; } = "localhost:9092";
    public string Topic { get; set; } = "platform-events";
    public string GroupId { get; set; } = "broker-demo-group";
    public string ClientId { get; set; } = "broker-client";
    public int ConsumerDelayMs { get; set; } = 0;
}

public class PublishEventRequest
{
    public string? PartitionKey { get; set; }
    public string Type { get; set; } = null!;
    public JsonNode Payload { get; set; } = null!;
}

public class Envelope
{
    public string Type { get; set; } = null!;
    public JsonNode Payload { get; set; } = null!;
    public string PartitionKey { get; set; } = null!;
    public string Timestamp { get; set; } = null!;
}

public class KafkaConsumerService : BackgroundService
{
    private readonly IOptions<KafkaOptions> _options;

    public KafkaConsumerService(IOptions<KafkaOptions> options)
    {
        _options = options;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var brokers = Environment.GetEnvironmentVariable("KAFKA_BROKERS") ?? _options.Value.Brokers;
        var topic = Environment.GetEnvironmentVariable("KAFKA_TOPIC") ?? _options.Value.Topic;
        var groupId = Environment.GetEnvironmentVariable("KAFKA_GROUP_ID") ?? _options.Value.GroupId;
        var clientId = Environment.GetEnvironmentVariable("KAFKA_CLIENT_ID") ?? _options.Value.ClientId;
        var consumerDelayMs = int.TryParse(Environment.GetEnvironmentVariable("CONSUMER_DELAY_MS"), out var delay) ? delay : _options.Value.ConsumerDelayMs;

        var config = new ConsumerConfig
        {
            BootstrapServers = brokers,
            GroupId = groupId,
            ClientId = clientId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true
        };

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe(topic);

        var processed = 0;

        await Task.Yield();

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);
                    if (result != null)
                    {
                        if (consumerDelayMs > 0)
                        {
                            await Task.Delay(consumerDelayMs, stoppingToken);
                        }

                        processed++;
                        var envelope = System.Text.Json.JsonSerializer.Deserialize<Envelope>(result.Message.Value, new System.Text.Json.JsonSerializerOptions 
                        { 
                            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase 
                        });
                        var pKey = envelope?.PartitionKey ?? "?";
                        var type = envelope?.Type ?? "?";

                        Console.WriteLine($"[{clientId}] #{processed} partitionKey={pKey} type={type}");
                    }
                }
                catch (ConsumeException ex)
                {
                    Console.WriteLine($"Consume error: {ex.Error.Reason}");
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
        }
        finally
        {
            consumer.Close();
        }
    }
}
