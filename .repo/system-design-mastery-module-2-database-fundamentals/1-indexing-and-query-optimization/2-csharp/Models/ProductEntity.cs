using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace IndexingOptimization.Models
{
    [Table("products")]
    public class ProductEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("sku")]
        public string Sku { get; set; } = null!;

        [Column("price", TypeName = "decimal(10,2)")]
        [JsonConverter(typeof(DecimalStringConverter))]
        public decimal Price { get; set; }

        [Column("category")]
        public string Category { get; set; } = null!;

        [Column("brand")]
        public string? Brand { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("stock")]
        public int Stock { get; set; }

        [Column("rating", TypeName = "decimal(3,1)")]
        public decimal Rating { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }

    public class DecimalStringConverter : JsonConverter<decimal>
    {
        public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                return decimal.Parse(reader.GetString()!);
            }
            return reader.GetDecimal();
        }

        public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture));
        }
    }
}
