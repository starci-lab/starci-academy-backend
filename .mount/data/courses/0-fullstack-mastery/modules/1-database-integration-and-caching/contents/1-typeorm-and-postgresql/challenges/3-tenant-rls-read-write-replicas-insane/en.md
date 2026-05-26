# title
<!-- @starci/seperator -->
Multi-tenant RLS + read/write replicas for a SaaS library platform
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Extended from the HARD version. You configure **TypeORM** with a master plus dedicated read replicas, enforce PostgreSQL **Row-Level Security** (RLS) dynamically per tenant via `SET LOCAL app.current_tenant`, prove multi-tenant isolation at the database level (no hardcoded `WHERE tenant_id`), and benchmark the read-write split against 1M+ rows spread across many tenants.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Configure TypeORM `replication` with 1 master + at least 2 read replicas, routing SELECT to slaves and mutations to master.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`DataSource` with `replication: { master, slaves: [r1, r2] }`; verify routing through SQL logs: SELECT on slave hosts, INSERT/UPDATE/DELETE on master. Failover test where one slave goes down -> queries still route to the remaining slave.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- TypeORM defaults to round-robin between slaves; verify by logging the connection string per query.
- Health-check failover via `pg_is_in_recovery()` to know whether a slave is alive.
- `docker-compose` setup primary + 2 standby using `pg_basebackup` + `recovery.conf` (Postgres 16 uses `standby.signal`).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 20):

- Criterion A (6 points): `docker-compose` runs 1 primary + 2 standby with real streaming replication (verify via `SELECT * FROM pg_stat_replication` on primary returning 2 rows).
- Criterion B (6 points): TypeORM `DataSource` config has `replication.master` + `replication.slaves: [...]`; connection-string logs prove SELECT hits slaves and INSERT/UPDATE hits master.
- Criterion C (4 points): Round-robin between the 2 slaves verified through a 1000-SELECT benchmark (~500/500 distribution).
- Criterion D (4 points): Failover test — kill 1 slave container -> app still serves SELECT (routes to the remaining alive slave), no crash; paste log evidence.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Enforce PostgreSQL Row-Level Security dynamically per tenant via `SET LOCAL app.current_tenant` at the connection runner, with NO hardcoded `WHERE tenant_id` in application code.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Business tables carry `tenant_id uuid NOT NULL`; CREATE POLICY on each table uses `current_setting('app.current_tenant')::uuid`; a NestJS middleware/interceptor extracts the `X-Tenant-Id` header -> `queryRunner.query('SET LOCAL app.current_tenant = $1', [tenantId])` before every query in the request.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use `RequestContext` or AsyncLocalStorage to propagate tenantId across the service layer.
- Cross-tenant test: log in as tenant A, set tenant B in the session -> queries must return 0 rows or hit an RLS error.
- `FORCE ROW LEVEL SECURITY` so the policy applies even to the table owner.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
25
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 25):

- Criterion A (8 points): `EnableRLS` migration contains `CREATE POLICY tenant_isolation ON <table> USING (tenant_id = current_setting('app.current_tenant')::uuid)` on ALL business tables + `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.
- Criterion B (8 points): NestJS Interceptor/Middleware extracts `X-Tenant-Id` + calls `SET LOCAL app.current_tenant = $1` at the start of every transaction; NO `WHERE tenant_id = ?` appears in application code (verified by grep).
- Criterion C (5 points): Cross-tenant isolation test — login as tenant A returns only A's data; forging `X-Tenant-Id: <B>` returns only B's data; data NEVER leaks across tenants.
- Criterion D (4 points): Missing tenant (request without the header) -> query returns 0 rows or 401, NEVER falls through to "see all".

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Shard by `tenant_id` at the logical level (per-tenant schema OR partitioned table) to prepare for scaling to 1M+ users.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Pick one of two strategies: (a) PostgreSQL `PARTITION BY HASH (tenant_id)` splitting `loans` into >=16 partitions; OR (b) schema-per-tenant with `search_path` set per tenant. Migration must create partitions/schemas dynamically.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Hash partitioning is easier to operate than schema-per-tenant but harder to migrate when one tenant grows disproportionately.
- Document the trade-off (partition pruning vs schema isolation) in the README Design Decisions section.
- Test `EXPLAIN` to prove partition pruning (only one partition scanned when the query binds tenant_id).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): Pick one strategy (hash partition or schema-per-tenant) and implement it in a migration.
- Criterion B (5 points): `EXPLAIN` of `SELECT FROM loans WHERE tenant_id = ?` proves partition pruning (Index Scan on a single partition) or `search_path` is set to the right schema.
- Criterion C (5 points): README Design Decision explains the trade-off chosen: write-path complexity, cross-tenant analytics, migration cost when a tenant becomes very large.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Benchmark capacity at 1M+ rows spread across tenants and run a chaos test when 1 replica goes down.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Seed >=1M rows distributed across 100 tenants with realistic skew (80/20 — 20 tenants hold 80% of the data); k6 benchmarks p95/p99 for read-only and mixed (50/50 read/write); chaos test kills 1 standby + 1 partition fail -> measure recovery time.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Seed in parallel with `INSERT ... SELECT generate_series` for speed; run ANALYZE after seeding.
- k6 with 100 VU, 5-minute run, capture the full timeline.
- Chaos: docker `pause`/`kill` the slave container, measure `time-to-route-failover`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Hardcoding `WHERE tenant_id = ?` in application code instead of using RLS -> **0 prompt rls**.
- Disabling `synchronize` but using `runMigrations: false` then querying an unmigrated schema -> **0 prompt migration**.
- Benchmarking a dataset < 1M rows or without realistic skew -> **0 prompt benchmark**.
- Fake chaos test (pasting fabricated output with no timestamps matching docker logs) -> **0 whole challenge**.
- Fabricating `EXPLAIN ANALYZE` plans or k6 percentiles -> **0 whole challenge**.
- Bypassing RLS by running queries as a superuser role -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 20):

- Criterion A (6 points): Seed >=1M rows across 100 tenants with 80/20 skew; per-tenant `SELECT COUNT(*)` proves the distribution is not uniform.
- Criterion B (6 points): k6 benchmark pastes real percentiles for 2 workloads (read-only and 50/50 mixed); p95 read < 50ms at 100 VU.
- Criterion C (4 points): Chaos test kills 1 standby while k6 is running -> service does not crash, p99 spikes then recovers; paste the real timeline log.
- Criterion D (4 points): Code Execution Trace >=5 hops for one full request (interceptor sets tenant -> master/slave routing -> RLS check -> partition prune -> response).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
You configure TypeORM `replication` with a master plus multiple read replicas and verify master-vs-slave routing through logs.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
You enforce PostgreSQL Row-Level Security dynamically per tenant via `SET LOCAL app.current_tenant`, with NO hardcoded filters in application code.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
You pick a sharding strategy (hash partitioning or schema-per-tenant) and document the trade-offs for production scale.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
You benchmark capacity at 1M+ rows and run a chaos test failing a replica while traffic is live — evidence is real pasted output.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed HARD `2-loan-transaction-optimistic-lock-index-hard`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Advanced knowledge of PostgreSQL streaming replication, `pg_basebackup`, `standby.signal`.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Basic familiarity with RLS, `CREATE POLICY`, `current_setting`, `FORCE ROW LEVEL SECURITY`.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Familiarity with `k6` or `wrk` for benchmarking an HTTP API.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Set up primary + 2 standby PostgreSQL with streaming replication
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Write `docker-compose.yml` with services `pg-primary` (Postgres 16) + `pg-standby-1` + `pg-standby-2`. Primary has `wal_level=replica`, `max_wal_senders=10`, `hot_standby=on`.
- **Step 2:** Init each standby with `pg_basebackup -h pg-primary -U replicator -D /var/lib/postgresql/data -X stream -P -R` (creates `standby.signal` + `postgresql.auto.conf` with `primary_conninfo`).
- **Step 3:** Verify on primary: `SELECT * FROM pg_stat_replication` returns 2 rows (sync state = streaming).
- **Step 4:** Configure TypeORM `DataSource` with `replication: { master: { host: 'pg-primary' }, slaves: [{ host: 'pg-standby-1' }, { host: 'pg-standby-2' }] }`.
- **Step 5:** Test routing: INSERT 1 row -> verify only primary has it immediately; SELECT a few times -> verify the connection log alternates between the 2 slaves.

### 2. Minimum acceptance criteria
- `docker compose up -d` brings up all 3 Postgres containers healthy.
- `pg_stat_replication` on primary shows 2 standbys streaming.
- TypeORM logs show INSERT routed to `pg-primary`, SELECT routed to `pg-standby-*`.
- Replica lag < 100ms under normal conditions (verify via `pg_last_wal_receive_lsn`).

### 3. Nice to have
- Add `pgpool-II` as a load balancer in front of TypeORM.
- Set up `repmgr` for automatic standby promotion when the primary dies.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Implement RLS + Tenant Interceptor
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Migration `AddTenantIdColumns` adds `tenant_id uuid NOT NULL` to every business table + an index on `(tenant_id)`.
- **Step 2:** Migration `EnableRLS` per table: `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY; ALTER TABLE <t> FORCE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation ON <t> USING (tenant_id = current_setting('app.current_tenant')::uuid);`.
- **Step 3:** NestJS Interceptor `TenantContextInterceptor` extracts `X-Tenant-Id` from headers (or a JWT claim), validates it as UUID, stores it in AsyncLocalStorage.
- **Step 4:** TypeORM `Subscriber` or QueryRunner wrapper calls `SET LOCAL app.current_tenant = $1` at the start of every transaction.
- **Step 5:** Isolation test: create tenant A with 5 loans + tenant B with 3 loans; login as A -> `GET /loans` returns 5 rows; login as B -> returns 3 rows; forging `X-Tenant-Id: <C>` (nonexistent) -> returns `[]`.

### 2. Minimum acceptance criteria
- `EnableRLS` migration applies successfully + verify `\d+ <table>` shows the policy.
- Grep for `WHERE tenant_id` in `src/` returns 0 hits (except migration files).
- Cross-tenant test passes as described in Step 5.
- Request without `X-Tenant-Id` -> 401 or 0 rows, NEVER falls through.

### 3. Nice to have
- Add a per-tenant `tenant_query_count` metric via Prometheus.
- Audit log every query that doesn't match the tenant policy.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **NestJS Interceptor** + **AsyncLocalStorage** + TypeORM `QueryRunner` `SET LOCAL`.

**API mapping:**
- HTTP middleware -> Interceptor extracts tenantId from `X-Tenant-Id` / JWT.
- AsyncLocalStorage -> propagates tenant context across the call chain.
- `SET LOCAL` -> RLS session variable, auto-reverts at end of transaction.

**Differences / gotchas:**
- `SET LOCAL` is only valid inside a `BEGIN`/`COMMIT` block — outside a transaction it silently no-ops.
- Connection pool reuse: failing to `SET LOCAL` per connection check-out can leak tenant context between requests.
- TypeORM `Subscriber` runs AFTER the query — set the tenant BEFORE via a `beforeQuery` hook or a wrapper.
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
**Main library:** **EF Core 8** `DbConnectionInterceptor` + `AsyncLocal<T>`.

**API mapping:**
- ASP.NET middleware -> extracts `X-Tenant-Id` header, sets `AsyncLocal<string>.Value`.
- `DbConnectionInterceptor.ConnectionOpenedAsync` -> issues `SET LOCAL app.current_tenant`.

**Differences / gotchas:**
- EF Core connection pooling behaves similarly — re-set tenant on every connection check-out.
- `IDbConnectionInterceptor` is the right hook for session variables.
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
**Main library:** **GORM** + `context.Context` + `BeforeQuery` callback.

**API mapping:**
- HTTP middleware -> `context.WithValue(ctx, "tenant", tenantId)`.
- GORM `Callbacks().Query().Before("gorm:query")` -> issues `SET LOCAL`.

**Differences / gotchas:**
- Go convention: thread tenant via `context.Context`, not global state.
- GORM session: `db.WithContext(ctx).Session(&gorm.Session{NewDB: true})` to isolate session vars.
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
**Main library:** **Spring Boot** `HandlerInterceptor` + Hibernate `Session#doWork`.

**API mapping:**
- `WebMvcConfigurer` -> register an interceptor that extracts `X-Tenant-Id` into a `ThreadLocal`.
- `EntityManager#unwrap(Session.class).doWork(conn -> ...)` -> issues `SET LOCAL` per transaction.

**Differences / gotchas:**
- Spring transaction proxy: you need `@Transactional` so a connection exists for `SET LOCAL` to apply.
- `@Async` runs on a new thread -> `ThreadLocal` tenant doesn't propagate, use a `TaskDecorator`.
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
Partition / Schema-per-tenant + 1M-row benchmark + chaos test
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Pick a strategy: (a) `PARTITION BY HASH (tenant_id)` 16 partitions for the `loans` table, or (b) `CREATE SCHEMA tenant_<id>` + `SET search_path`.
- **Step 2:** Migration `PartitionLoans` (case a) or `BootstrapTenantSchemas` (case b); test `EXPLAIN` to prove pruning.
- **Step 3:** `scripts/seed-1m.ts` generates 1M rows distributed across 100 tenants with 80/20 skew (20 tenants ~800k rows, 80 tenants ~200k).
- **Step 4:** k6 benchmark: 100 VU, 5-minute run, 2 scenarios: (i) read-only `GET /loans`, (ii) mixed 50/50 read/write.
- **Step 5:** Chaos test: `docker pause pg-standby-1` in the middle of the k6 run -> observe the p99 spike + recovery; paste the timeline.
- **Step 6:** README Smoke Test section pastes: SQL routing log, RLS policy DDL, EXPLAIN partition prune, k6 percentiles, chaos timeline, per-tenant counts.

### 2. Minimum acceptance criteria
- Seed completed with >=1M rows + 80/20 skew demonstrable.
- k6 p95 read < 50ms; p99 < 200ms at 100 VU baseline.
- Chaos test: killing 1 standby -> k6 does not crash, p99 spike <= 500ms then back to baseline within < 30s.
- README has all 6 evidence blocks with raw output.

### 3. Nice to have
- Add a Grafana dashboard for `pg_stat_statements` + connection pool metrics.
- Auto-promote a standby via `repmgr` when primary dies (real failover, not only slave failover).
- Compare hash partitioning vs schema-per-tenant on the same workload.
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
GitHub Repository link
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Public repo `library-multi-tenant-rls-replicas` containing `docker-compose.yml` with primary + 2 standby (streaming replication), migrations `AddTenantIdColumns` + `EnableRLS` + `PartitionLoans` (or `BootstrapTenantSchemas`), NestJS `TenantContextInterceptor` + `QueryRunner` wrapper, `scripts/seed-1m.ts`, `scripts/k6-*.js`, and a README with 6 sections including a Smoke Test that pastes raw output: `pg_stat_replication`, RLS policy DDL, cross-tenant isolation log, `EXPLAIN` partition pruning, k6 p95/p99, kill-standby chaos timeline.
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
