/**
 * init-zones.js — Cấu hình zone-based sharding theo quốc gia.
 * AMERICAS zone (shard1) cho US, CA, BR, MX.
 * APAC_EMEA zone (shard2) cho các quốc gia còn lại.
 * (EN: init-zones.js — Configure zone-based sharding by country.
 * AMERICAS zone (shard1) for US, CA, BR, MX.
 * APAC_EMEA zone (shard2) for remaining countries.)
 */

// ──────────────────────────────────────────────
// Gán zone tag cho mỗi shard.
// (EN: Assign zone tags to each shard.)
// ──────────────────────────────────────────────
sh.addShardTag("shard1ReplSet", "AMERICAS");
sh.addShardTag("shard2ReplSet", "APAC_EMEA");

// ──────────────────────────────────────────────
// AMERICAS zone — US, CA, BR, MX → shard1.
// (EN: AMERICAS zone — US, CA, BR, MX → shard1.)
// ──────────────────────────────────────────────

// Brazil
// (EN: Brazil)
sh.addTagRange(
    "app.users",
    { country: "BR" },
    { country: "BR￿" },
    "AMERICAS"
);

// Canada
// (EN: Canada)
sh.addTagRange(
    "app.users",
    { country: "CA" },
    { country: "CA￿" },
    "AMERICAS"
);

// Mexico
// (EN: Mexico)
sh.addTagRange(
    "app.users",
    { country: "MX" },
    { country: "MX￿" },
    "AMERICAS"
);

// Hoa Kỳ
// (EN: United States)
sh.addTagRange(
    "app.users",
    { country: "US" },
    { country: "US￿" },
    "AMERICAS"
);

// ──────────────────────────────────────────────
// APAC_EMEA zone — các quốc gia còn lại → shard2.
// (EN: APAC_EMEA zone — remaining countries → shard2.)
// ──────────────────────────────────────────────

// Úc
// (EN: Australia)
sh.addTagRange(
    "app.users",
    { country: "AU" },
    { country: "AU￿" },
    "APAC_EMEA"
);

// Đức
// (EN: Germany)
sh.addTagRange(
    "app.users",
    { country: "DE" },
    { country: "DE￿" },
    "APAC_EMEA"
);

// Pháp
// (EN: France)
sh.addTagRange(
    "app.users",
    { country: "FR" },
    { country: "FR￿" },
    "APAC_EMEA"
);

// Ấn Độ
// (EN: India)
sh.addTagRange(
    "app.users",
    { country: "IN" },
    { country: "IN￿" },
    "APAC_EMEA"
);

// Nhật Bản
// (EN: Japan)
sh.addTagRange(
    "app.users",
    { country: "JP" },
    { country: "JP￿" },
    "APAC_EMEA"
);

// Hàn Quốc
// (EN: South Korea)
sh.addTagRange(
    "app.users",
    { country: "KR" },
    { country: "KR￿" },
    "APAC_EMEA"
);

// Singapore
// (EN: Singapore)
sh.addTagRange(
    "app.users",
    { country: "SG" },
    { country: "SG￿" },
    "APAC_EMEA"
);

// Anh
// (EN: United Kingdom)
sh.addTagRange(
    "app.users",
    { country: "UK" },
    { country: "UK￿" },
    "APAC_EMEA"
);

// Việt Nam
// (EN: Vietnam)
sh.addTagRange(
    "app.users",
    { country: "VN" },
    { country: "VN￿" },
    "APAC_EMEA"
);

print("Zone-based sharding configured: AMERICAS on shard1, APAC_EMEA on shard2");
