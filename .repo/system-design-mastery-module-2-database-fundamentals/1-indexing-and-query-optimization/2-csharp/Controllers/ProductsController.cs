using Microsoft.AspNetCore.Mvc;
using IndexingOptimization.Services;
using System.Threading.Tasks;

namespace IndexingOptimization.Controllers
{
    [ApiController]
    [Route("api")]
    public class ProductsController : ControllerBase
    {
        private readonly ProductsService _productsService;

        public ProductsController(ProductsService productsService)
        {
            _productsService = productsService;
        }

        [HttpPost("seed/{count}")]
        public async Task<IActionResult> Seed([FromRoute] int count)
        {
            var result = await _productsService.SeedAsync(count);
            return StatusCode(201, result);
        }

        [HttpGet("query/no-index")]
        public async Task<IActionResult> FindWithoutIndex([FromQuery] string category)
        {
            var result = await _productsService.FindWithoutIndexAsync(category);
            return Ok(result);
        }

        [HttpGet("query/with-index")]
        public async Task<IActionResult> FindWithIndex([FromQuery] string category, [FromQuery] double minPrice)
        {
            var result = await _productsService.FindWithIndexAsync(category, minPrice);
            return Ok(result);
        }

        [HttpGet("explain")]
        public async Task<IActionResult> Explain([FromQuery] string sql)
        {
            var result = await _productsService.ExplainQueryAsync(sql);
            return Ok(result);
        }

        [HttpGet("compare")]
        public async Task<IActionResult> Compare()
        {
            var result = await _productsService.CompareQueriesAsync();
            return Ok(result);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var result = await _productsService.GetTableStatsAsync();
            return Ok(result);
        }
    }
}
