using Microsoft.AspNetCore.Mvc;
using ShardingStrategies.Models;
using ShardingStrategies.Services;
using System.Threading.Tasks;

namespace ShardingStrategies.Controllers
{
    [ApiController]
    [Route("api")]
    public class UsersController : ControllerBase
    {
        private readonly UsersService _usersService;

        public UsersController(UsersService usersService)
        {
            _usersService = usersService;
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] UserEntity user)
        {
            var created = await _usersService.CreateAsync(user);
            return StatusCode(201, created);
        }

        [HttpGet("users/{userId}")]
        public async Task<IActionResult> FindByUserId([FromRoute] string userId)
        {
            var user = await _usersService.FindByUserIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpGet("users/country/{country}")]
        public async Task<IActionResult> FindByCountry([FromRoute] string country)
        {
            var users = await _usersService.FindByCountryAsync(country);
            return Ok(users);
        }

        [HttpGet("users/tier/{tier}")]
        public async Task<IActionResult> FindByTier([FromRoute] string tier)
        {
            var users = await _usersService.FindByTierAsync(tier);
            return Ok(users);
        }

        [HttpPost("seed/{count}")]
        public async Task<IActionResult> Seed([FromRoute] int count)
        {
            var result = await _usersService.SeedAsync(count);
            return StatusCode(201, result);
        }

        [HttpGet("shards/distribution")]
        public async Task<IActionResult> GetShardDistribution()
        {
            var result = await _usersService.GetShardDistributionAsync();
            return Ok(result);
        }

        [HttpGet("shards/status")]
        public async Task<IActionResult> GetShardStatus()
        {
            var result = await _usersService.GetShardStatusAsync();
            return Ok(result);
        }

        [HttpGet("shards/explain")]
        public async Task<IActionResult> ExplainQuery([FromQuery] string field, [FromQuery] string value)
        {
            var result = await _usersService.ExplainQueryAsync(field, value);
            return Ok(result);
        }
    }
}
