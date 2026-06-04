using System.Text.Json.Nodes;

namespace SqlVsNosql.Models
{
    public class CreateProductDto
    {
        public string Name { get; set; } = null!;
        public double Price { get; set; }
        public string Category { get; set; } = null!;
        public JsonObject? Metadata { get; set; }
    }
}
