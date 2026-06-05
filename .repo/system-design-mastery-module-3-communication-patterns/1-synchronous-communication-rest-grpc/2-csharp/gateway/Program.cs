using Grpc.Net.Client;
using User;
using Product;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var userChannel = GrpcChannel.ForAddress("http://localhost:5001");
var userClient = new UserService.UserServiceClient(userChannel);

var productChannel = GrpcChannel.ForAddress("http://localhost:5002");
var productClient = new ProductService.ProductServiceClient(productChannel);

app.MapGet("/users", async () =>
{
    var response = await userClient.FindAllAsync(new User.Empty());
    var users = response.Users.Select(u => new { id = u.Id, name = u.Name, email = u.Email });
    return Results.Ok(new { users });
});

app.MapPost("/users", async (CreateUserInputDto input) =>
{
    var response = await userClient.CreateAsync(new CreateUserInput { Name = input.Name, Email = input.Email });
    var created = new { id = response.Id, name = response.Name, email = response.Email };
    return Results.Json(created, statusCode: 201);
});

app.MapGet("/products/{id:int}", async (int id) =>
{
    var response = await productClient.FindOneAsync(new ProductById { Id = id });
    var product = new { id = response.Id, name = response.Name, price = response.Price, stock = response.Stock };
    return Results.Ok(product);
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Run($"http://localhost:{port}");

public record CreateUserInputDto(string Name, string Email);
