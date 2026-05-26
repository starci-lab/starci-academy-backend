# title
<!-- @starci/seperator -->
Bộ Giới hạn Tốc độ Cửa sổ Trượt sử dụng Kịch bản Lua trên Redis
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Triển khai một bộ giới hạn tốc độ cuộc gọi (rate limiter) dạng cửa sổ trượt (sliding window log) hiệu quả cao. Sử dụng kịch bản Lua trên Redis để đảm bảo tính nguyên tử.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Xác nhận hoàn thành thử thách trước đó.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Bạn phải hoàn thành thử thách MEDIUM của bài học này.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
Kiểm tra điều kiện tiên quyết.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Viết kịch bản Lua cho bộ giới hạn tốc độ cửa sổ trượt.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Thực thi các hoạt động Redis ZSET trong kịch bản Lua; xóa các khóa cũ hơn cửa sổ hiện tại, đếm các khóa đang hoạt động, thêm timestamp request hiện tại và đặt expire.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
Đảm bảo inject Redis key động và truyền đúng tham số cho lệnh thực thi script.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Xử lý các tính toán trạng thái giới hạn tốc độ trong bộ nhớ ứng dụng NestJS -> 0 điểm phần trạng thái -> **0 state**
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
API trả về HTTP 429 Too Many Requests khi số request vượt ngưỡng, đồng thời ghi thông tin header về giới hạn còn lại.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành thử thách MEDIUM của bài học này.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Quyền kết nối Redis server và làm quen với lệnh thực thi Lua script.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Viết Lua Script và Rate Limiting Guard
### body
Triển khai thực thi script Redis và đính kèm thông tin rate limit vào response header.
### codeImplementations
#### 0
##### lang
typescript
##### guide
Viết mã gọi Redis Lua script bên trong interceptor hoặc guard của NestJS.
##### example
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import Redis from 'ioredis';

const LUA_LIMITER_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  
  redis.call('zremrangebyscore', key, 0, now - window)
  local current = redis.call('zcard', key)
  if current < limit then
    redis.call('zadd', key, now, now)
    redis.call('expire', key, math.ceil(window / 1000))
    return 1
  else
    return 0
  end
`;

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private redis = new Redis();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const now = Date.now();
    
    const allowed = await this.redis.eval(
      LUA_LIMITER_SCRIPT,
      1,
      `limit:${ip}`,
      now.toString(),
      '60000', // 1 minute window
      '10',    // Limit 10 requests
    );
    
    return allowed === 1;
  }
}

#### 1
##### lang
csharp
##### guide
Thực thi Lua script sử dụng StackExchange.Redis client library trong C#.
##### example
using StackExchange.Redis;
using System;
using System.Threading.Tasks;

public class RedisRateLimiter {
    private readonly ConnectionMultiplexer _redis;
    public RedisRateLimiter(ConnectionMultiplexer redis) { _redis = redis; }

    public async Task<bool> IsAllowedAsync(string ip) {
        var db = _redis.GetDatabase();
        var script = @"
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local limit = tonumber(ARGV[3])
            redis.call('zremrangebyscore', key, 0, now - window)
            local current = redis.call('zcard', key)
            if current < limit then
                redis.call('zadd', key, now, now)
                return 1
            else
                return 0
            end";
        var res = await db.ScriptEvaluateAsync(script, new RedisKey[] { $"limit:{ip}" }, new RedisValue[] { DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), 60000, 10 });
        return (int)res == 1;
    }
}

#### 2
##### lang
go
##### guide
Chạy Redis rate limiting Lua script sử dụng thư viện go-redis.
##### example
package limit

import (
	"context"
	"github.com/go-redis/redis/v8"
	"time"
)

var luaScript = redis.NewScript(`
	local key = KEYS[1]
	local now = tonumber(ARGV[1])
	local window = tonumber(ARGV[2])
	local limit = tonumber(ARGV[3])
	redis.call('zremrangebyscore', key, 0, now - window)
	if redis.call('zcard', key) < limit then
		redis.call('zadd', key, now, now)
		return 1
	else
		return 0
	end
`)

func CheckLimit(ctx context.Context, rdb *redis.Client, ip string) (bool, error) {
	now := time.Now().UnixNano() / int64(time.Millisecond)
	res, err := luaScript.Run(ctx, rdb, []string{"limit:" + ip}, now, 60000, 10).Int()
	return res == 1, err
}

#### 3
##### lang
java
##### guide
Sử dụng RedisTemplate của Spring Boot để thực thi Lua script trong Java.
##### example
package com.example.limiter;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import java.util.Collections;

public class RedisSlidingLimiter {
    private final StringRedisTemplate redisTemplate;
    
    public RedisSlidingLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean isAllowed(String ip) {
        String script = "redis.call('zremrangebyscore', KEYS[1], 0, ARGV[1] - ARGV[2]); " +
                        "if redis.call('zcard', KEYS[1]) < tonumber(ARGV[3]) then " +
                        "redis.call('zadd', KEYS[1], ARGV[1], ARGV[1]); return 1; " +
                        "else return 0; end;";
        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(script, Long.class);
        Long result = redisTemplate.execute(redisScript, Collections.singletonList("limit:" + ip),
                String.valueOf(System.currentTimeMillis()), "60000", "10");
        return result != null && result == 1;
    }
}
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
Redis Lua scripting manual
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/manual/programmability/eval-intro/
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
Sliding Window Log Rate Limiting
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://konghq.com/blog/engineering/how-to-design-a-scalable-rate-limiting-algorithm
<!-- @starci/seperator -->

# submissions
## 0
### type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
Link Repository - Bộ Giới hạn Tốc độ Cửa sổ Trượt sử dụng Kịch bản Lua trên Redis
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
60
### prompts
#### 0
##### title
Viết kịch bản Lua cửa sổ trượt nguyên tử
##### score
30
##### promptText
Tiêu chí chấm điểm (Tối đa 30 điểm):
- Điểm A (15 điểm): Định nghĩa chính xác Lua script thực hiện xóa bản ghi cũ bằng zremrangebyscore.
- Điểm B (15 điểm): Đảm bảo tính nguyên tử (atomic) hoàn toàn của luồng ghi mà không xảy ra tranh chấp dữ liệu (race conditions).

#### 1
##### title
Tích hợp Guard với HTTP Rate Limiting header
##### score
30
##### promptText
Tiêu chí chấm điểm (Tối đa 30 điểm):
- Điểm A (15 điểm): Triển khai đúng Guard chặn đứng yêu cầu và trả về lỗi 429 khi người dùng gọi API quá giới hạn.
- Điểm B (15 điểm): Trả về đầy đủ thông tin số lượt gọi còn lại và thời gian reset trong HTTP header phản hồi.
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Submit your solution via the link below.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
hard
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
