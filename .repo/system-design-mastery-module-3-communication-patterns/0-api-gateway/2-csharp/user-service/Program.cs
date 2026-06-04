using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var users = new ConcurrentDictionary<long, User>();
long counter = 0;

users.TryAdd(Interlocked.Increment(ref counter), new User(1, "Alice", "alice@starci.com"));
users.TryAdd(Interlocked.Increment(ref counter), new User(2, "Bob", "bob@starci.com"));

app.MapGet("/users", () => users.Values);
app.MapPost("/users", (User input) =>
{
    var id = Interlocked.Increment(ref counter);
    var created = new User(id, input.Name, input.Email);
    users.TryAdd(id, created);
    return Results.Created($"/users/{id}", created);
});

app.Run("http://0.0.0.0:3001");

public record User(long Id, string Name, string Email);
