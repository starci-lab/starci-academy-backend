# title
<!-- @starci/seperator -->
Two-Tier Caching System with Pub/Sub Invalidation Sync
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Create an insane-level cache coherence system. Maintain a local fast memory cache (tier-1) and a remote shared Redis cache (tier-2). Synchronize memory invalidations across cluster instances using Redis Pub/Sub channels.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Verify previous challenge completion.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
You must have completed the HARD challenge of this lesson.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
Prerequisite check.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Build two-tier caching coherence cluster sync.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
On write operations, evict local memory cache and update Redis cache. Simultaneously, publish an eviction event containing key details via Redis Pub/Sub to trigger memory evictions on other instances.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
Subscribe to invalidation channels during startup; avoid infinite loops by including local instance IDs in the broadcast payload.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Allowing stale local memory cached values without sending Pub/Sub eviction events -> 0 synchronization prompt -> **0 synchronization**
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Start two instances on separate ports. Modifying values on Instance A logs immediate local eviction events on Instance B.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed the HARD challenge of this lesson.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Understanding of Redis Pub/Sub channels and local caching models (Map/LRU).
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Write Coherence Sync Engine
### body
Create local memory wrappers, pub/sub bindings, and eviction handlers.
### codeImplementations
#### 0
##### lang
typescript
##### guide
Write the TwoTierCacheService subscribing to invalidation topics.
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
Implement StackExchange.Redis PubSub subscription and local memory cache.
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
Implement Go redis PubSub channels and local sync map invalidations.
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
Use Spring Boot MessageListener and local Caffeine cache sync.
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
Repository link - Two-Tier Caching System with Pub/Sub Invalidation Sync
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
80
### prompts
#### 0
##### title
Two-tier cache operations mapping memory and Redis
##### score
40
##### promptText
Tiêu chí chấm điểm (Tối đa 40 điểm):
- Điểm A (20 điểm): Trích xuất dữ liệu thành công từ local memory trước, nếu không có mới tìm trong Redis.
- Điểm B (20 điểm): Cập nhật thành công đồng thời cả local cache và Redis cache khi tiến hành ghi dữ liệu.

#### 1
##### title
Redis Pub/Sub channel connection and cluster eviction execution
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
