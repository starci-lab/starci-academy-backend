var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var users = new List<User>();
var gate = new object();
long counter = 0;

app.MapGet("/users", () =>
{
    lock (gate) { return users.ToList(); }
});
app.MapPost("/users", (User input) =>
{
    lock (gate)
    {
        var created = new User(++counter, input.Name, input.Email);
        users.Add(created);
        return Results.Created($"/users/{created.Id}", created);
    }
});

app.Run("http://0.0.0.0:3001");

public record User(long Id, string Name, string Email);
