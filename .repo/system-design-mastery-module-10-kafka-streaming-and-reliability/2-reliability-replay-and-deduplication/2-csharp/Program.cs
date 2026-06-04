using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Text.Json.Nodes;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Configure port
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://*:{port}");

// Bind options
builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection("Kafka"));

// Register EF Core DbContext
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(connectionString))
{
    var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? builder.Configuration["ConnectionStrings:DefaultConnection"]?.Split(';')[0].Split('=')[1] ?? "localhost";
    var pgPort = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
    var user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
    var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";
    var db = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "reliability_lab";
    connectionString = $"Host={host};Port={pgPort};Database={db};Username={user};Password={password}";
}
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

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

// Auto migrate DB on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.MapPost("/events", async (PublishEventRequest request, IProducer<string, string> producer, IOptions<KafkaOptions> options) =>
{
    if (string.IsNullOrWhiteSpace(request.ClientMessageId))
    {
        return Results.Json(new { statusCode = 400, message = new[] { "clientMessageId must be a string" }, error = "Bad Request" }, statusCode: 400);
    }
    if (string.IsNullOrWhiteSpace(request.Type))
    {
        return Results.Json(new { statusCode = 400, message = new[] { "type must be a string" }, error = "Bad Request" }, statusCode: 400);
    }

    var topic = Environment.GetEnvironmentVariable("KAFKA_TOPIC") ?? options.Value.Topic;
    var key = request.ClientMessageId;

    var envelope = new Envelope
    {
        ClientMessageId = request.ClientMessageId,
        Type = request.Type,
        Payload = request.Payload,
        SimulateFailure = request.SimulateFailure,
        Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    };

    var valueString = System.Text.Json.JsonSerializer.Serialize(envelope, new System.Text.Json.JsonSerializerOptions 
    { 
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase 
    });

    var message = new Message<string, string>
    {
        Key = key,
        Value = valueString
    };

    await producer.ProduceAsync(topic, message);
    Console.WriteLine($"Produced to {topic} key={key}");

    return Results.Json(new
    {
        status = "queued",
        topic = topic,
        key = key
    }, statusCode: 201);
});

app.Run();

public class KafkaOptions
{
    public string Brokers { get; set; } = "localhost:9092";
    public string Topic { get; set; } = "reliability-events";
    public string GroupId { get; set; } = "broker-lesson2-group";
    public string ClientId { get; set; } = "reliability-consumer";
    public string DlqTopic { get; set; } = "reliability-events-dlq";
}

public class PublishEventRequest
{
    public string ClientMessageId { get; set; } = null!;
    public string Type { get; set; } = null!;
    public JsonNode? Payload { get; set; }
    public bool? SimulateFailure { get; set; }
}

public class Envelope
{
    public string ClientMessageId { get; set; } = null!;
    public string Type { get; set; } = null!;
    public JsonNode? Payload { get; set; }
    public bool? SimulateFailure { get; set; }
    public string Timestamp { get; set; } = null!;
}

public class ProcessedEvent
{
    public int Id { get; set; }
    public string ClientMessageId { get; set; } = null!;
    public string EventType { get; set; } = null!;
    public long Sequence { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<ProcessedEvent> ProcessedEvents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProcessedEvent>()
            .HasIndex(e => e.ClientMessageId)
            .IsUnique();
    }
}

public class KafkaConsumerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IOptions<KafkaOptions> _options;
    private readonly IConfiguration _configuration;

    public KafkaConsumerService(IServiceProvider serviceProvider, IOptions<KafkaOptions> options, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _options = options;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var brokers = Environment.GetEnvironmentVariable("KAFKA_BROKERS") ?? _options.Value.Brokers;
        var topic = Environment.GetEnvironmentVariable("KAFKA_TOPIC") ?? _options.Value.Topic;
        var dlqTopic = Environment.GetEnvironmentVariable("KAFKA_DLQ_TOPIC") ?? _options.Value.DlqTopic;
        var groupId = Environment.GetEnvironmentVariable("KAFKA_GROUP_ID") ?? _options.Value.GroupId;
        var clientId = Environment.GetEnvironmentVariable("KAFKA_CLIENT_ID") ?? _options.Value.ClientId;

        var redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? _configuration["Redis:Host"] ?? "localhost";
        var redisPort = Environment.GetEnvironmentVariable("REDIS_PORT") ?? _configuration["Redis:Port"] ?? "6379";

        // Setup Redis
        ConnectionMultiplexer redis;
        try
        {
            redis = await ConnectionMultiplexer.ConnectAsync($"{redisHost}:{redisPort}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Redis connection failed: {ex.Message}");
            return;
        }
        var dbRedis = redis.GetDatabase();

        // Setup Kafka Consumer config
        var config = new ConsumerConfig
        {
            BootstrapServers = brokers,
            GroupId = groupId,
            ClientId = clientId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        // Setup Kafka DLQ producer
        var producerConfig = new ProducerConfig { BootstrapServers = brokers };
        using var dlqProducer = new ProducerBuilder<string, string>(producerConfig).Build();

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe(topic);

        await Task.Yield();

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                ConsumeResult<string, string>? result = null;
                try
                {
                    result = consumer.Consume(stoppingToken);
                    if (result == null) continue;

                    var rawValue = result.Message.Value;
                    var envelope = System.Text.Json.JsonSerializer.Deserialize<Envelope>(rawValue, new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                    });

                    var clientMessageId = envelope?.ClientMessageId ?? "<unknown>";

                    // 1. Redis SETNX
                    var dedupKey = $"dedup:event:{clientMessageId}";
                    var isNew = await dbRedis.StringSetAsync(dedupKey, "1", TimeSpan.FromSeconds(3600), When.NotExists);
                    if (!isNew)
                    {
                        Console.WriteLine($"Duplicate skipped clientMessageId={clientMessageId}");
                        consumer.Commit(result);
                        continue;
                    }

                    // 2. Simulate Failure
                    if (envelope != null && envelope.SimulateFailure == true)
                    {
                        throw new Exception("Simulated processing failure for DLQ demo");
                    }

                    // 3. Redis INCR sequence
                    var seq = await dbRedis.StringIncrementAsync("reliability:sequence");

                    // 4. Postgres persistence
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var dbPostgres = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var row = new ProcessedEvent
                        {
                            ClientMessageId = clientMessageId,
                            EventType = envelope?.Type ?? "?",
                            Sequence = seq,
                            CreatedAt = DateTime.UtcNow
                        };
                        dbPostgres.ProcessedEvents.Add(row);
                        await dbPostgres.SaveChangesAsync(stoppingToken);
                    }

                    Console.WriteLine($"Processed {clientMessageId} seq={seq} topic={topic}");
                    consumer.Commit(result);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (result != null)
                    {
                        var rawValue = result.Message.Value;
                        var envelope = System.Text.Json.JsonSerializer.Deserialize<Envelope>(rawValue, new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                        });
                        var clientMessageId = envelope?.ClientMessageId ?? "<unknown>";

                        // Check if duplicate index violation
                        var isDuplicate = false;
                        var inner = ex.InnerException;
                        while (inner != null)
                        {
                            if (inner is PostgresException pex && pex.SqlState == "23505")
                            {
                                isDuplicate = true;
                                break;
                            }
                            inner = inner.InnerException;
                        }

                        if (isDuplicate)
                        {
                            Console.WriteLine($"Duplicate skipped clientMessageId={clientMessageId}");
                            consumer.Commit(result);
                        }
                        else
                        {
                            var message = ex.Message;
                            Console.WriteLine($"Failed: {message} — will retry / DLQ via Kafka");

                            // Publish to DLQ
                            await dlqProducer.ProduceAsync(dlqTopic, new Message<string, string>
                            {
                                Key = result.Message.Key,
                                Value = result.Message.Value
                            }, stoppingToken);

                            consumer.Commit(result);
                        }
                    }
                }
            }
        }
        finally
        {
            consumer.Close();
        }
    }
}
