using Microsoft.AspNetCore.Mvc;
using SqlVsNosql.Services;
using System.Threading.Tasks;

namespace SqlVsNosql.Controllers
{
    [ApiController]
    [Route("api")]
    public class CompareController : ControllerBase
    {
        private readonly CompareService _compareService;

        public CompareController(CompareService compareService)
        {
            _compareService = compareService;
        }

        [HttpPost("seed")]
        public async Task<IActionResult> Seed([FromQuery] int count = 1000)
        {
            var result = await _compareService.SeedAsync(count);
            return StatusCode(201, result);
        }

        [HttpGet("compare")]
        public async Task<IActionResult> Compare([FromQuery] string category = "Electronics")
        {
            var result = await _compareService.CompareAsync(category);
            return Ok(result);
        }
    }
}
