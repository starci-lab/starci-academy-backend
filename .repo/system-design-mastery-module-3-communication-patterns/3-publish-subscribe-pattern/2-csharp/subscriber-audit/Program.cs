using NATS.Client.Core;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<NatsSubscriberWorker>();
var app = builder.Build();
app.Run();

public class NatsSubscriberWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var natsOpts = NatsOpts.Default with { Url = "nats://localhost:4222" };
        await using var natsConnection = new NatsConnection(natsOpts);

        await foreach (var msg in natsConnection.SubscribeAsync<string>("app.events").WithCancellation(stoppingToken))
        {
            try
            {
                var payloadStr = msg.Data;
                if (string.IsNullOrEmpty(payloadStr)) continue;

                using var doc = JsonDocument.Parse(payloadStr);
                var root = doc.RootElement;
                var type = root.GetProperty("type").GetString();
                var payloadVal = root.GetProperty("payload");

                // Print standard log
                Console.WriteLine($"audit: {payloadStr}");

                // Print expected JSON format with required spacing
                Console.WriteLine($"{{ \"service\": \"audit\",        \"received\": {{ \"type\": \"{type}\", \"payload\": {payloadVal} }} }}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing message: {ex.Message}");
            }
        }
    }
}
