/**
 * init-shard.js — Bật sharding trên database "app" và tạo hashed shard key trên userId.
 * Chạy trên mongos sau khi cluster đã sẵn sàng.
 * (EN: init-shard.js — Enable sharding on "app" database and create hashed shard key on userId.
 * Run on mongos after the cluster is ready.)
 */

// Bật sharding cho database "app".
// (EN: Enable sharding for "app" database.)
sh.enableSharding("app");

// Hashed shard key trên userId — phân phối đều data giữa các shard.
// Point query trên userId sẽ targeted tới đúng 1 shard.
// (EN: Hashed shard key on userId — ensures even distribution across shards.
// Point queries on userId are targeted to a single shard.)
sh.shardCollection("app.users", { userId: "hashed" });

print("Sharding enabled on app.users with hashed key on userId");
