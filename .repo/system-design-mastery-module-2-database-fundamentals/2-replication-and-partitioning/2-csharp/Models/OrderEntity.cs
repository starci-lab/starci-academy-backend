using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReplicationPartitioning.Models
{
    [Table("orders")]
    public class OrderEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("customer_id")]
        [JsonPropertyName("customerId")]
        public string CustomerId { get; set; } = null!;

        [Column("product")]
        public string Product { get; set; } = null!;

        [Column("amount", TypeName = "decimal(10,2)")]
        [JsonConverter(typeof(DecimalStringConverter))]
        public decimal Amount { get; set; }

        [Column("region")]
        public string Region { get; set; } = null!;

        [Column("status")]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public OrderStatus Status { get; set; } = OrderStatus.pending;

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // Order status enum mapped to the PostgreSQL orders_status_enum type.
    public enum OrderStatus
    {
        pending,
        completed,
        cancelled
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
