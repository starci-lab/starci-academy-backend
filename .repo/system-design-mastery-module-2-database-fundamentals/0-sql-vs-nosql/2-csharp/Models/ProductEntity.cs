using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SqlVsNosql.Models
{
    [Table("products")]
    public class ProductEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("name")]
        [MaxLength(255)]
        public string Name { get; set; } = null!;

        [Column("price", TypeName = "decimal(10,2)")]
        [JsonConverter(typeof(DecimalStringConverter))]
        public decimal Price { get; set; }

        [Column("category")]
        [MaxLength(100)]
        public string Category { get; set; } = null!;

        [Column("metadata", TypeName = "jsonb")]
        public JsonDocument? Metadata { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
