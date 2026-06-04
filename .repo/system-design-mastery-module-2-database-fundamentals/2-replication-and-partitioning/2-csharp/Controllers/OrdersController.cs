using Microsoft.AspNetCore.Mvc;
using ReplicationPartitioning.Models;
using ReplicationPartitioning.Services;
using System.Threading.Tasks;

namespace ReplicationPartitioning.Controllers
{
    [ApiController]
    [Route("api")]
    public class OrdersController : ControllerBase
    {
        private readonly OrdersService _ordersService;

        public OrdersController(OrdersService ordersService)
        {
            _ordersService = ordersService;
        }

        [HttpPost("seed/{count}")]
        public async Task<IActionResult> Seed([FromRoute] int count)
        {
            var result = await _ordersService.SeedAsync(count);
            return StatusCode(201, result);
        }

        [HttpPost("orders")]
        public async Task<IActionResult> Create([FromBody] OrderEntity order)
        {
            var created = await _ordersService.CreateAsync(order);
            return Created($"/api/orders/{created.Id}", created);
        }

        [HttpGet("orders")]
        public async Task<IActionResult> FindAll()
        {
            var orders = await _ordersService.FindAllAsync();
            return Ok(orders);
        }

        [HttpGet("replication/status")]
        public async Task<IActionResult> GetReplicationStatus()
        {
            var status = await _ordersService.GetReplicationStatusAsync();
            return Ok(status);
        }

        [HttpGet("partitions")]
        public async Task<IActionResult> GetPartitionInfo()
        {
            var partitions = await _ordersService.GetPartitionInfoAsync();
            return Ok(partitions);
        }
    }
}
