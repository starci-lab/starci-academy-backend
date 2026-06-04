using Microsoft.AspNetCore.Mvc;
using SqlVsNosql.Models;
using SqlVsNosql.Services;
using System.Threading.Tasks;

namespace SqlVsNosql.Controllers
{
    [ApiController]
    [Route("api/nosql")]
    public class NosqlController : ControllerBase
    {
        private readonly NosqlService _nosqlService;

        public NosqlController(NosqlService nosqlService)
        {
            _nosqlService = nosqlService;
        }

        [HttpPost("products")]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            var created = await _nosqlService.CreateAsync(dto);
            return Created($"/api/nosql/products/{created.Id}", created);
        }

        [HttpGet("products")]
        public async Task<IActionResult> FindAll()
        {
            var products = await _nosqlService.FindAllAsync();
            return Ok(products);
        }

        [HttpGet("products/category/{cat}")]
        public async Task<IActionResult> FindByCategory([FromRoute(Name = "cat")] string category)
        {
            var products = await _nosqlService.FindByCategoryAsync(category);
            return Ok(products);
        }
    }
}
