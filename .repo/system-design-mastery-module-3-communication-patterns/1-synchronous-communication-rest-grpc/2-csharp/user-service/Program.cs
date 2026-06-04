using Microsoft.AspNetCore.Server.Kestrel.Core;
using Grpc.Core;
using User;
using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5001, listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http2;
    });
});

builder.Services.AddGrpc();
var app = builder.Build();

app.MapGrpcService<UserGrpcImpl>();

app.Run();

public class UserGrpcImpl : UserService.UserServiceBase
{
    private static readonly ConcurrentDictionary<int, User.User> _users = new();
    private static int _counter = 0;

    static UserGrpcImpl()
    {
        var id1 = Interlocked.Increment(ref _counter);
        _users.TryAdd(id1, new User.User { Id = id1, Name = "Alice", Email = "alice@starci.com" });
        var id2 = Interlocked.Increment(ref _counter);
        _users.TryAdd(id2, new User.User { Id = id2, Name = "Bob", Email = "bob@starci.com" });
    }

    public override Task<UserList> FindAll(User.Empty request, ServerCallContext context)
    {
        var list = new UserList();
        list.Users.AddRange(_users.Values);
        return Task.FromResult(list);
    }

    public override Task<User.User> FindOne(UserById request, ServerCallContext context)
    {
        if (_users.TryGetValue(request.Id, out var user))
        {
            return Task.FromResult(user);
        }
        return Task.FromResult(new User.User { Id = 0, Name = "Not Found", Email = "" });
    }

    public override Task<User.User> Create(CreateUserInput request, ServerCallContext context)
    {
        var id = Interlocked.Increment(ref _counter);
        var created = new User.User { Id = id, Name = request.Name, Email = request.Email };
        _users.TryAdd(id, created);
        return Task.FromResult(created);
    }
}
