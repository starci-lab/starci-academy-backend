# title
<!-- @starci/seperator -->
Hệ thống Bộ nhớ đệm Hai cấp với Đồng bộ Hủy bỏ bằng Pub/Sub
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Tạo hệ thống đồng bộ hóa dữ liệu đệm hai cấp mức độ cực khó. Duy trì bộ đệm trong bộ nhớ cục bộ (cấp 1) và bộ đệm Redis dùng chung (cấp 2). Đồng bộ hóa việc xóa cache chéo các node qua Redis Pub/Sub.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Xác nhận hoàn thành thử thách trước đó.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Bạn phải hoàn thành thử thách HARD của bài học này.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
Kiểm tra điều kiện tiên quyết.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Xây dựng đồng bộ dữ liệu cache hai cấp trong cluster.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Khi có lệnh ghi, xóa dữ liệu đệm local và cập nhật Redis cache. Đồng thời, publish một sự kiện xóa cache chứa thông tin khóa qua Redis Pub/Sub để xóa cache local của các instance khác.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
Subscribe vào kênh hủy bỏ cache khi khởi động; tránh vòng lặp vô hạn bằng cách chèn instance ID vào payload.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Cho phép tồn tại dữ liệu cũ trong bộ đệm local mà không phát sự kiện Pub/Sub hủy bỏ -> 0 điểm phần đồng bộ -> **0 synchronization**
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Khởi chạy hai node trên các cổng khác nhau. Thay đổi dữ liệu ở Node A lập tức kích hoạt sự kiện xóa cache ở Node B.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành thử thách HARD của bài học này.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Hiểu biết về Redis Pub/Sub và các mô hình bộ đệm cục bộ (Map/LRU).
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Viết Công cụ Đồng bộ Nhất quán
### body
Tạo lớp bọc bộ đệm trong bộ nhớ, các kênh pub/sub và trình xử lý xóa cache.
### codeImplementations
#### 0
##### lang
typescript
##### guide
Viết TwoTierCacheService lắng nghe các sự kiện hủy cache.
##### example
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TwoTierCacheService implements OnModuleInit {
  private memoryCache = new Map<string, any>();
  private redisPub = new Redis();
  private redisSub = new Redis();
  private instanceId = Math.random().toString();

  async onModuleInit() {
    await this.redisSub.subscribe('cache_invalidation');
    this.redisSub.on('message', (channel, message) => {
      const { key, sender } = JSON.parse(message);
      if (sender !== this.instanceId) {
        this.memoryCache.delete(key);
        console.log(`Evicted local key: ${key}`);
      }
    });
  }

  async set(key: string, value: any) {
    this.memoryCache.set(key, value);
    await this.redisPub.set(key, JSON.stringify(value));
    await this.redisPub.publish(
      'cache_invalidation',
      JSON.stringify({ key, sender: this.instanceId }),
    );
  }

  async get(key: string): Promise<any> {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    const redisVal = await this.redisPub.get(key);
    if (redisVal) {
      const parsed = JSON.parse(redisVal);
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    return null;
  }
}

#### 1
##### lang
csharp
##### guide
Triển khai StackExchange.Redis PubSub subscription và local memory cache.
##### example
using StackExchange.Redis;
using System;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.Tasks;

public class TwoTierCache {
    private readonly ConcurrentDictionary<string, object> _memCache = new();
    private readonly ConnectionMultiplexer _redis;
    private readonly string _instanceId = Guid.NewGuid().ToString();

    public TwoTierCache(ConnectionMultiplexer redis) {
        _redis = redis;
        var sub = _redis.GetSubscriber();
        sub.Subscribe("cache_invalidation", (channel, message) => {
            var data = JsonSerializer.Deserialize<CacheEvictMsg>(message);
            if (data.Sender != _instanceId) {
                _memCache.TryRemove(data.Key, out _);
            }
        });
    }

    public async Task SetAsync(string key, object value) {
        _memCache[key] = value;
        var db = _redis.GetDatabase();
        await db.StringSetAsync(key, JsonSerializer.Serialize(value));
        var sub = _redis.GetSubscriber();
        await sub.PublishAsync("cache_invalidation", JsonSerializer.Serialize(new CacheEvictMsg { Key = key, Sender = _instanceId }));
    }
}

public class CacheEvictMsg {
    public string Key { get; set; } = string.Empty;
    public string Sender { get; set; } = string.Empty;
}

#### 2
##### lang
go
##### guide
Triển khai kênh PubSub và xóa cache trên sync.Map của Go.
##### example
package cache

import (
	"context"
	"encoding/json"
	"github.com/go-redis/redis/v8"
	"sync"
)

type TwoTierCache struct {
	mem        sync.Map
	rdb        *redis.Client
	instanceID string
}

type EvictMsg struct {
	Key    string `json:"key"`
	Sender string `json:"sender"`
}

func (c *TwoTierCache) Listen(ctx context.Context) {
	pubsub := c.rdb.Subscribe(ctx, "cache_invalidation")
	go func() {
		for msg := range pubsub.Channel() {
			var m EvictMsg
			json.Unmarshal([]byte(msg.Payload), &m)
			if m.Sender != c.instanceID {
				c.mem.Delete(m.Key)
			}
		}
	}()
}

func (c *TwoTierCache) Set(ctx context.Context, key string, val string) {
	c.mem.Store(key, val)
	c.rdb.Set(ctx, key, val, 0)
	payload, _ := json.Marshal(EvictMsg{Key: key, Sender: c.instanceID})
	c.rdb.Publish(ctx, "cache_invalidation", payload)
}

#### 3
##### lang
java
##### guide
Sử dụng Spring Boot MessageListener và caffeine cache cục bộ để đồng bộ.
##### example
package com.example.cache;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import java.util.concurrent.ConcurrentHashMap;

public class TwoTierCache implements MessageListener {
    private final ConcurrentHashMap<String, String> localCache = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;
    private final String instanceId = java.util.UUID.randomUUID().toString();

    public TwoTierCache(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        // Parse message and evict local cache key if sender != instanceId
    }

    public void set(String key, String value) {
        localCache.put(key, value);
        redisTemplate.opsForValue().set(key, value);
        redisTemplate.convertAndSend("cache_invalidation", "{\"key\":\""+key+"\",\"sender\":\""+instanceId+"\"}");
    }
}
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
Redis Pub/Sub capabilities
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/manual/pubsub/
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
Two Tier Caching Architecture
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://medium.com/redis-with-springboot/two-tier-caching-with-redis-caffeine-cache
<!-- @starci/seperator -->

# submissions
## 0
### type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
Link Repository - Hệ thống Bộ nhớ đệm Hai cấp với Đồng bộ Hủy bỏ bằng Pub/Sub
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
80
### prompts
#### 0
##### title
Ánh xạ hoạt động cache hai cấp giữa memory và Redis
##### score
40
##### promptText
Tiêu chí chấm điểm (Tối đa 40 điểm):
- Điểm A (20 điểm): Trích xuất dữ liệu thành công từ local memory trước, nếu không có mới tìm trong Redis.
- Điểm B (20 điểm): Cập nhật thành công đồng thời cả local cache và Redis cache khi tiến hành ghi dữ liệu.

#### 1
##### title
Kết nối kênh Redis Pub/Sub và thực thi hủy bỏ cache cụm
##### score
40
##### promptText
Tiêu chí chấm điểm (Tối đa 40 điểm):
- Điểm A (20 điểm): Lắng nghe chuẩn xác sự kiện qua kênh Pub/Sub và xóa key cục bộ khi nhận được thông báo.
- Điểm B (20 điểm): Nhận diện đúng ID của instance gửi yêu cầu để tránh hiện tượng lặp vô hạn (infinite echo loops).
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Submit your solution via the link below.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
insane
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
80
<!-- @starci/seperator -->
