using Microsoft.AspNetCore.Mvc;
using SqlVsNosql.Models;
using SqlVsNosql.Services;
using System.Threading.Tasks;

namespace SqlVsNosql.Controllers
{
    [ApiController]
    [Route("api/sql")]
    public class SqlController : ControllerBase
    {
        private readonly SqlService _sqlService;

        public SqlController(SqlService sqlService)
        {
            _sqlService = sqlService;
        }

        [HttpPost("products")]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            var created = await _sqlService.CreateAsync(dto);
            return Created($"/api/sql/products/{created.Id}", created);
        }

        [HttpGet("products")]
        public async Task<IActionResult> FindAll()
        {
            var products = await _sqlService.FindAllAsync();
            return Ok(products);
        }

        [HttpGet("products/category/{cat}")]
        public async Task<IActionResult> FindByCategory([FromRoute(Name = "cat")] string category)
        {
            var products = await _sqlService.FindByCategoryAsync(category);
            return Ok(products);
        }
    }
}
