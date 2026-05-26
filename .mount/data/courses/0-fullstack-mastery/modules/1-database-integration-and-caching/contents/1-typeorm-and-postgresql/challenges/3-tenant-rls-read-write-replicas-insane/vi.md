# title
<!-- @starci/seperator -->
Multi-tenant RLS + read/write replicas cho hệ thống thư viện SaaS
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Phát triển từ bản HARD. Bạn cấu hình **TypeORM** với master + read replicas riêng biệt, áp đặt PostgreSQL **Row-Level Security** (RLS) động theo tenant qua `SET LOCAL app.current_tenant`, chứng minh isolation đa tenant ở mức database (không hardcode `WHERE tenant_id`), và benchmark read-write split với 1M+ rows phân bố đa tenant.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Cấu hình TypeORM `replication` với 1 master + ≥2 read replicas, định tuyến SELECT vào slave và mutation vào master.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`DataSource` với `replication: { master, slaves: [r1, r2] }`; verify routing bằng log SQL: SELECT trên slave host, INSERT/UPDATE/DELETE trên master host. Test failover một slave down → query vẫn route được sang slave còn lại.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- TypeORM round-robin slave mặc định; verify bằng log connection string mỗi query.
- Failover health-check qua `pg_is_in_recovery()` để biết slave còn alive.
- `docker-compose` setup primary + 2 standby qua `pg_basebackup` + `recovery.conf` (Postgres 16: `standby.signal`).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 20):

- Tiêu chí A (6 điểm): `docker-compose` chạy 1 primary + 2 standby thật với streaming replication (verify bằng `SELECT * FROM pg_stat_replication` trên primary cho 2 row).
- Tiêu chí B (6 điểm): TypeORM `DataSource` config có `replication.master` + `replication.slaves: [...]`; log connection string chứng minh SELECT đi slave, INSERT/UPDATE đi master.
- Tiêu chí C (4 điểm): Round-robin giữa 2 slaves verify được qua benchmark 1000 SELECT (xấp xỉ 500/500 phân bố).
- Tiêu chí D (4 điểm): Failover test — kill 1 slave container → app vẫn serve SELECT (route sang slave còn alive), không crash; paste log chứng minh.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Triển khai PostgreSQL Row-Level Security động theo tenant qua `SET LOCAL app.current_tenant` ở connection runner, KHÔNG hardcode `WHERE tenant_id` ở application code.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Bảng nghiệp vụ có `tenant_id uuid NOT NULL`; CREATE POLICY trên mỗi bảng dùng `current_setting('app.current_tenant')::uuid`; middleware/interceptor NestJS extract `X-Tenant-Id` header → `queryRunner.query('SET LOCAL app.current_tenant = $1', [tenantId])` trước mọi query trong request.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Dùng `RequestContext` hoặc AsyncLocalStorage để propagate tenantId xuyên service layer.
- Test cross-tenant: login tenant A, set tenant B trong session → query phải trả 0 row hoặc lỗi RLS.
- `FORCE ROW LEVEL SECURITY` để policy apply cả cho table owner.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
25
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 25):

- Tiêu chí A (8 điểm): Migration `EnableRLS` có `CREATE POLICY tenant_isolation ON <table> USING (tenant_id = current_setting('app.current_tenant')::uuid)` cho TẤT CẢ bảng nghiệp vụ + `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.
- Tiêu chí B (8 điểm): NestJS Interceptor/Middleware extract `X-Tenant-Id` + gọi `SET LOCAL app.current_tenant = $1` đầu mỗi transaction; KHÔNG xuất hiện `WHERE tenant_id = ?` ở application code (verify bằng grep).
- Tiêu chí C (5 điểm): Cross-tenant isolation test — login tenant A query → chỉ thấy data của A; thử forge `X-Tenant-Id: <B>` → chỉ thấy data của B; KHÔNG cách nào leak data chéo.
- Tiêu chí D (4 điểm): Tenant không set (request thiếu header) → query trả 0 row hoặc 401, KHÔNG fall-through thành "see all".

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Sharding theo `tenant_id` ở mức logical (per-tenant schema HOẶC partition table) để chuẩn bị scale lên 1M+ user.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Chọn 1 trong 2 chiến lược: (a) PostgreSQL `PARTITION BY HASH (tenant_id)` chia bảng `loans` thành ≥16 partition; HOẶC (b) schema-per-tenant với `search_path` set theo tenant. Migration phải tạo partition/schema động.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Partition hash dễ vận hành hơn schema-per-tenant nhưng khó migrate khi tenant lớn lệch.
- Document trade-off (partition prune vs schema isolation) trong Design Decisions của README.
- Test `EXPLAIN` chứng minh partition pruning (chỉ scan 1 partition khi query bind tenant_id).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): Chọn 1 chiến lược (hash partition hoặc schema-per-tenant) và triển khai trong migration.
- Tiêu chí B (5 điểm): `EXPLAIN` query `SELECT FROM loans WHERE tenant_id = ?` chứng minh partition pruning (chỉ Index Scan trên 1 partition) hoặc `search_path` set đúng schema.
- Tiêu chí C (5 điểm): Design Decision trong README giải thích trade-off chọn chiến lược này: write-path complexity, cross-tenant analytics, migration cost khi tenant cực lớn.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Benchmark capacity với 1M+ rows phân bố đa tenant + chaos test khi 1 replica down.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Seed ≥1M rows phân bố cross 100 tenant (skew thực tế: 80/20 — 20 tenant chiếm 80% data); k6 benchmark p95/p99 read-only và mixed (50/50 read/write); chaos test kill 1 standby + 1 partition fail → measure recovery time.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Seed parallel bằng `INSERT ... SELECT generate_series` cho tốc độ; ANALYZE sau khi seed.
- k6 với 100 VU, 5-min run, capture full timeline.
- Chaos: docker `pause`/`kill` slave container, đo `time-to-route-failover`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Hardcode `WHERE tenant_id = ?` ở application code thay vì dùng RLS -> **0 prompt rls**.
- Tắt `synchronize` nhưng dùng `runMigrations: false` rồi truy vấn schema chưa migrate -> **0 prompt migration**.
- Benchmark dataset < 1M rows hoặc dataset không skew thực tế -> **0 prompt benchmark**.
- Chaos test fake (paste output giả không có timestamp matching docker log) -> **0 whole challenge**.
- Fabricate `EXPLAIN ANALYZE` plan hoặc k6 percentile -> **0 whole challenge**.
- Bypass RLS bằng cách dùng superuser role chạy query -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 20):

- Tiêu chí A (6 điểm): Seed ≥1M rows phân bố 100 tenant với skew 80/20; `SELECT COUNT(*)` từng tenant chứng minh phân bố không uniform.
- Tiêu chí B (6 điểm): k6 benchmark paste percentile thật cho 2 workload (read-only và mixed 50/50); p95 read < 50ms ở 100 VU.
- Tiêu chí C (4 điểm): Chaos test kill 1 standby trong khi k6 đang chạy → service không crash, p99 spike rồi recover; paste timeline log thật.
- Tiêu chí D (4 điểm): Code Execution Trace ≥5 hop cho 1 request đầy đủ (interceptor set tenant → routing master/slave → RLS check → partition prune → response).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn cấu hình được TypeORM `replication` với master + multiple read replicas và verify được routing master vs slave qua log.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn áp đặt được PostgreSQL Row-Level Security động theo tenant qua `SET LOCAL app.current_tenant`, KHÔNG hardcode filter ở application code.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn chọn được chiến lược sharding (hash partition hoặc schema-per-tenant) và document trade-off cho production scale.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn benchmark được capacity với 1M+ rows và chaos test failover replica trong khi traffic đang chạy — evidence paste output thật.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành HARD `2-loan-transaction-optimistic-lock-index-hard`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Kiến thức nâng cao về PostgreSQL streaming replication, `pg_basebackup`, `standby.signal`.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Biết cơ bản RLS, `CREATE POLICY`, `current_setting`, `FORCE ROW LEVEL SECURITY`.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Biết dùng `k6` hoặc `wrk` để benchmark HTTP API.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Setup primary + 2 standby PostgreSQL với streaming replication
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Viết `docker-compose.yml` với service `pg-primary` (Postgres 16) + `pg-standby-1` + `pg-standby-2`. Primary có `wal_level=replica`, `max_wal_senders=10`, `hot_standby=on`.
- **Bước 2:** Init standby bằng `pg_basebackup -h pg-primary -U replicator -D /var/lib/postgresql/data -X stream -P -R` (tạo `standby.signal` + `postgresql.auto.conf` với `primary_conninfo`).
- **Bước 3:** Verify trên primary: `SELECT * FROM pg_stat_replication` cho 2 row (sync state = streaming).
- **Bước 4:** Cấu hình TypeORM `DataSource` với `replication: { master: { host: 'pg-primary' }, slaves: [{ host: 'pg-standby-1' }, { host: 'pg-standby-2' }] }`.
- **Bước 5:** Test routing: INSERT 1 row → verify chỉ primary có ngay; SELECT vài lần → verify log connection chia luân phiên giữa 2 slave.

### 2. Yêu cầu tối thiểu cần đạt
- `docker compose up -d` lên đủ 3 container Postgres healthy.
- `pg_stat_replication` trên primary show 2 standby streaming.
- TypeORM log show INSERT route đến `pg-primary`, SELECT route đến `pg-standby-*`.
- Lag replica < 100ms trong điều kiện normal (verify qua `pg_last_wal_receive_lsn`).

### 3. Nice to have
- Thêm `pgpool-II` làm load balancer trước TypeORM.
- Setup `repmgr` để auto-promote standby khi primary down.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Triển khai RLS + Tenant Interceptor
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Migration `AddTenantIdColumns` thêm `tenant_id uuid NOT NULL` cho tất cả bảng nghiệp vụ + index `(tenant_id)`.
- **Bước 2:** Migration `EnableRLS` cho mỗi bảng: `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY; ALTER TABLE <t> FORCE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation ON <t> USING (tenant_id = current_setting('app.current_tenant')::uuid);`.
- **Bước 3:** NestJS Interceptor `TenantContextInterceptor` extract `X-Tenant-Id` từ header (hoặc JWT claim), validate UUID, store vào AsyncLocalStorage.
- **Bước 4:** TypeORM `Subscriber` hoặc QueryRunner wrapper gọi `SET LOCAL app.current_tenant = $1` đầu mỗi transaction.
- **Bước 5:** Test isolation: tạo tenant A có 5 loan + tenant B có 3 loan; login A → `GET /loans` trả 5 row; login B → trả 3 row; forge `X-Tenant-Id: <C>` (nonexistent) → trả `[]`.

### 2. Yêu cầu tối thiểu cần đạt
- Migration `EnableRLS` apply thành công + verify `\d+ <table>` show policy.
- Grep `WHERE tenant_id` trong `src/` trả về 0 hit (trừ migration files).
- Cross-tenant test PASS như mô tả ở Bước 5.
- Request không có `X-Tenant-Id` → 401 hoặc trả 0 row, KHÔNG fall-through.

### 3. Nice to have
- Thêm metric `tenant_query_count` per tenant qua Prometheus.
- Audit log mọi query không match tenant policy.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **NestJS Interceptor** + **AsyncLocalStorage** + TypeORM `QueryRunner` `SET LOCAL`.

**Mapping API:**
- HTTP middleware -> Interceptor extract tenantId từ `X-Tenant-Id` / JWT.
- AsyncLocalStorage -> propagate tenant context xuyên call chain.
- `SET LOCAL` -> RLS session variable, auto-revert ở end of transaction.

**Khác biệt/gotcha:**
- `SET LOCAL` chỉ valid trong `BEGIN`/`COMMIT` block — outside transaction sẽ silently no-op.
- Connection pool reuse: nếu không `SET LOCAL` mỗi connection check-out, có thể leak tenant context giữa request.
- TypeORM `Subscriber` chạy AFTER query — phải set tenant TRƯỚC qua `beforeQuery` hook hoặc wrapper.
##### example
```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly als: AsyncLocalStorage<{ tenantId: string }>) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest()
    const tenantId = req.headers["x-tenant-id"]
    if (!tenantId) throw new UnauthorizedException("missing tenant")
    return new Observable(subscriber => {
      this.als.run({ tenantId }, () => {
        next.handle().subscribe(subscriber)
      })
    })
  }
}

// Repository wrapper
async runWithTenant<T>(fn: (qr: QueryRunner) => Promise<T>): Promise<T> {
  const tenantId = this.als.getStore()!.tenantId
  const qr = this.ds.createQueryRunner()
  await qr.startTransaction()
  try {
    await qr.query("SET LOCAL app.current_tenant = $1", [tenantId])
    const result = await fn(qr)
    await qr.commitTransaction()
    return result
  } catch (e) {
    await qr.rollbackTransaction()
    throw e
  } finally {
    await qr.release()
  }
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **EF Core 8** `DbConnectionInterceptor` + `AsyncLocal<T>`.

**Mapping API:**
- ASP.NET middleware -> extract `X-Tenant-Id` header, set `AsyncLocal<string>.Value`.
- `DbConnectionInterceptor.ConnectionOpenedAsync` -> issue `SET LOCAL app.current_tenant`.

**Khác biệt/gotcha:**
- EF Core connection pooling tương tự — cần re-set tenant cho mỗi connection check-out.
- `IDbConnectionInterceptor` là chỗ đúng nhất để hook session vars.
##### example
```csharp
public class TenantInterceptor : DbConnectionInterceptor {
    private readonly ITenantContext _ctx;
    public TenantInterceptor(ITenantContext ctx) => _ctx = ctx;

    public override async Task ConnectionOpenedAsync(DbConnection conn, ConnectionEndEventData ed, CancellationToken ct = default) {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SET LOCAL app.current_tenant = @t";
        var p = cmd.CreateParameter(); p.ParameterName = "@t"; p.Value = _ctx.TenantId;
        cmd.Parameters.Add(p);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **GORM** + `context.Context` + `BeforeQuery` callback.

**Mapping API:**
- HTTP middleware -> `context.WithValue(ctx, "tenant", tenantId)`.
- GORM `Callbacks().Query().Before("gorm:query")` -> issue `SET LOCAL`.

**Khác biệt/gotcha:**
- Go convention: thread tenant qua `context.Context`, không global state.
- GORM session: `db.WithContext(ctx).Session(&gorm.Session{NewDB: true})` để isolate session vars.
##### example
```go
func TenantMiddleware(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        tid := c.GetHeader("X-Tenant-Id")
        if tid == "" { c.AbortWithStatus(401); return }
        ctx := context.WithValue(c.Request.Context(), "tenant", tid)
        tx := db.WithContext(ctx).Begin()
        tx.Exec("SET LOCAL app.current_tenant = ?", tid)
        c.Set("tx", tx)
        c.Next()
        if c.Errors.Last() != nil { tx.Rollback() } else { tx.Commit() }
    }
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **Spring Boot** `HandlerInterceptor` + Hibernate `Session#doWork`.

**Mapping API:**
- `WebMvcConfigurer` -> register interceptor extract `X-Tenant-Id` vào `ThreadLocal`.
- `EntityManager#unwrap(Session.class).doWork(conn -> ...)` -> issue `SET LOCAL` mỗi transaction.

**Khác biệt/gotcha:**
- Spring transaction proxy: phải `@Transactional` mới có connection để `SET LOCAL` áp dụng.
- `@Async` method dùng new thread → `ThreadLocal` tenant không propagate, cần `TaskDecorator`.
##### example
```java
@Component
public class TenantInterceptor implements HandlerInterceptor {
    private static final ThreadLocal<String> TENANT = new ThreadLocal<>();
    public static String get() { return TENANT.get(); }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String tid = req.getHeader("X-Tenant-Id");
        if (tid == null) { res.setStatus(401); return false; }
        TENANT.set(tid);
        return true;
    }
}

@Service
public class TenantAwareService {
    @PersistenceContext EntityManager em;

    @Transactional
    public List<Loan> findLoans() {
        em.unwrap(Session.class).doWork(conn -> {
            try (var st = conn.prepareStatement("SET LOCAL app.current_tenant = ?")) {
                st.setObject(1, UUID.fromString(TenantInterceptor.get()));
                st.execute();
            }
        });
        return em.createQuery("FROM Loan", Loan.class).getResultList();
    }
}
```
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Partition / Schema-per-tenant + Benchmark 1M rows + Chaos test
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Chọn chiến lược: (a) `PARTITION BY HASH (tenant_id)` 16 partition cho bảng `loans`, hoặc (b) `CREATE SCHEMA tenant_<id>` + `SET search_path`.
- **Bước 2:** Migration `PartitionLoans` (case a) hoặc `BootstrapTenantSchemas` (case b); test `EXPLAIN` chứng minh pruning.
- **Bước 3:** `scripts/seed-1m.ts` sinh 1M rows phân bố 100 tenant với skew 80/20 (20 tenant ~800k rows, 80 tenant ~200k).
- **Bước 4:** k6 benchmark: 100 VU, 5-min, 2 scenario: (i) read-only `GET /loans`, (ii) mixed 50/50 read/write.
- **Bước 5:** Chaos test: `docker pause pg-standby-1` ở giữa run k6 → quan sát p99 spike + recover; paste timeline.
- **Bước 6:** README mục Smoke Test paste: SQL log routing, RLS policy DDL, EXPLAIN partition prune, k6 percentile, chaos timeline, count per-tenant.

### 2. Yêu cầu tối thiểu cần đạt
- Seed completed với ≥1M rows + skew 80/20 chứng minh được.
- k6 p95 read < 50ms; p99 < 200ms ở 100 VU baseline.
- Chaos test: kill 1 standby → k6 không crash, p99 spike ≤ 500ms rồi về baseline trong < 30s.
- README có đủ 6 evidence paste raw output.

### 3. Nice to have
- Thêm Grafana dashboard cho `pg_stat_statements` + connection pool metrics.
- Auto-promote standby qua `repmgr` khi primary down (real failover, không chỉ slave failover).
- Compare hash partition vs schema-per-tenant trên cùng workload.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
PostgreSQL Row Level Security
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/ddl-rowsecurity.html
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
TypeORM Replication
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/data-source-options#postgres-connection-options
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
PostgreSQL Streaming Replication
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/warm-standby.html
<!-- @starci/seperator -->

## 3
### alias
<!-- @starci/seperator -->
PostgreSQL Table Partitioning
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/ddl-partitioning.html
<!-- @starci/seperator -->

## 4
### alias
<!-- @starci/seperator -->
k6 Load Testing
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://k6.io/docs/
<!-- @starci/seperator -->

# submissions
## 0
### type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
Link GitHub Repository
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Repo public chứa source `library-multi-tenant-rls-replicas` với `docker-compose.yml` primary + 2 standby (streaming replication), migration `AddTenantIdColumns` + `EnableRLS` + `PartitionLoans` (hoặc `BootstrapTenantSchemas`), NestJS `TenantContextInterceptor` + `QueryRunner` wrapper, `scripts/seed-1m.ts`, `scripts/k6-*.js`, và README 6 section với Smoke Test paste raw output: `pg_stat_replication`, RLS policy DDL, cross-tenant isolation log, `EXPLAIN` partition pruning, k6 p95/p99, chaos timeline kill-standby.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
80
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
insane
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
80
<!-- @starci/seperator -->
