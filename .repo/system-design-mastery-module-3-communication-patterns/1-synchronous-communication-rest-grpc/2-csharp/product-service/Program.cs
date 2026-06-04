using Microsoft.AspNetCore.Server.Kestrel.Core;
using Grpc.Core;
using Product;
using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5002, listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http2;
    });
});

builder.Services.AddGrpc();
var app = builder.Build();

app.MapGrpcService<ProductGrpcImpl>();

app.Run();

public class ProductGrpcImpl : ProductService.ProductServiceBase
{
    private static readonly ConcurrentDictionary<int, Product.Product> _products = new();

    static ProductGrpcImpl()
    {
        _products.TryAdd(1, new Product.Product { Id = 1, Name = "Laptop", Price = 999.99, Stock = 42 });
    }

    public override Task<Product.Product> FindOne(ProductById request, ServerCallContext context)
    {
        if (_products.TryGetValue(request.Id, out var product))
        {
            return Task.FromResult(product);
        }
        return Task.FromResult(new Product.Product { Id = 0, Name = "Not Found", Price = 0.0, Stock = 0 });
    }
}
