using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();
var app = builder.Build();

app.Map("{*path}", async (string? path, HttpContext context, IHttpClientFactory clientFactory) =>
{
    path = path ?? "";
    string targetUrl;
    if (path.StartsWith("users"))
    {
        targetUrl = $"http://localhost:3001/{path}";
    }
    else if (path.StartsWith("products"))
    {
        targetUrl = $"http://localhost:3002/{path}";
    }
    else if (path.StartsWith("orders"))
    {
        targetUrl = $"http://localhost:3003/{path}";
    }
    else
    {
        context.Response.StatusCode = 404;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = $"No route for /{path}" });
        return;
    }

    if (!string.IsNullOrEmpty(context.Request.QueryString.Value))
    {
        targetUrl += context.Request.QueryString.Value;
    }

    var client = clientFactory.CreateClient();
    var requestMsg = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUrl);

    if (HttpMethods.IsPost(context.Request.Method) || 
        HttpMethods.IsPut(context.Request.Method) || 
        HttpMethods.IsPatch(context.Request.Method))
    {
        var streamContent = new StreamContent(context.Request.Body);
        requestMsg.Content = streamContent;
        if (context.Request.ContentType != null)
        {
            requestMsg.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
        }
    }

    foreach (var header in context.Request.Headers)
    {
        if (header.Key.StartsWith("Content-")) continue;
        requestMsg.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
    }

    try
    {
        var responseMsg = await client.SendAsync(requestMsg, HttpCompletionOption.ResponseHeadersRead);
        context.Response.StatusCode = (int)responseMsg.StatusCode;

        foreach (var header in responseMsg.Headers)
        {
            context.Response.Headers[header.Key] = header.Value.ToArray();
        }
        foreach (var header in responseMsg.Content.Headers)
        {
            context.Response.Headers[header.Key] = header.Value.ToArray();
        }

        await responseMsg.Content.CopyToAsync(context.Response.Body);
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 502;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = $"Bad Gateway: {ex.Message}" });
    }
});

app.Run("http://0.0.0.0:8000");
