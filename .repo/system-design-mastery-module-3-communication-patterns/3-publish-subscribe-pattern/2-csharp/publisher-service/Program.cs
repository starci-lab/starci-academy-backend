using NATS.Client.Core;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var natsOpts = NatsOpts.Default with { Url = "nats://localhost:4222" };
var natsConnection = new NatsConnection(natsOpts);

app.MapPost("/events", async (HttpContext context) =>
{
    try
    {
        using var doc = await JsonDocument.ParseAsync(context.Request.Body);
        var root = doc.RootElement;
        var type = root.GetProperty("type").GetString();
        var payload = root.GetProperty("payload").Clone();

        var ev = new
        {
            type = type,
            payload = payload,
            timestamp = DateTime.UtcNow.ToString("o")
        };

        var messageJson = JsonSerializer.Serialize(ev);
        await natsConnection.PublishAsync("app.events", messageJson);

        var response = new
        {
            status = "published",
            subject = "app.events",
            @event = ev
        };

        return Results.Json(response, statusCode: 201);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message, statusCode: 500);
    }
});

app.Run("http://0.0.0.0:3001");
