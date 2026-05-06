# title
Loan feature với transaction, optimistic lock, index strategy và EXPLAIN ANALYZE trước/sau tối ưu

# description
Đây là challenge thực hành TypeORM hard, mở rộng từ bài medium với nghiệp vụ mượn/trả sách có cạnh tranh đồng thời cao. Bạn sẽ triển khai transaction, optimistic lock, chiến lược index và kiểm chứng hiệu năng bằng EXPLAIN ANALYZE trên dữ liệu lớn.

# requirements
## 0
### purpose
Mở rộng project medium thành `library-loan-optimistic-lock` với đầy đủ domain cho nghiệp vụ mượn/trả sách.
### technicalConstraints
Phải bổ sung `User`, `Loan`, và cột `Book.stock`, `Book.version` qua migration riêng; quan hệ `Loan -> User` là `onDelete: 'CASCADE'`, `Loan -> Book` là `onDelete: 'RESTRICT'`.
### proTipsHints
- Giữ migration tách nhỏ theo từng intent để dễ rollback.
- Dữ liệu seed ổn định sẽ giúp test concurrency lặp lại chính xác hơn.

## 1
### purpose
Đảm bảo luồng borrow/return đúng tính nhất quán dữ liệu dưới tải đồng thời.
### technicalConstraints
`POST /loans/borrow` và `POST /loans/:id/return` bắt buộc chạy trong `DataSource.transaction(...)`; borrow phải xử lý đủ `BOOK_NOT_FOUND`, `OUT_OF_STOCK`, `CONCURRENT_CONFLICT`; return phải idempotent với `ALREADY_RETURNED`.
### proTipsHints
- Viết helper retry optimistic lock riêng để tái sử dụng cho cả borrow và return.
- Theo dõi log SQL để xác nhận câu lệnh update có điều kiện version.

## 2
### purpose
Fix N+1 và tối ưu truy vấn danh sách loan theo user bằng index phù hợp.
### technicalConstraints
`GET /users/:id/loans?status=BORROWED` phải dùng QueryBuilder với join đủ `loan -> book -> author`, không được phát sinh mô hình 1 + N query.
### proTipsHints
- So sánh trước/sau bằng query count để chứng minh hiệu quả fix.
- Viết e2e assert query count để chống regressions.

## 3
### purpose
Đo hiệu năng thực tế bằng EXPLAIN ANALYZE trên dữ liệu lớn, không đánh giá cảm tính.
### technicalConstraints
Phải có `scripts/seed-big.ts` tạo tối thiểu 50k loans; migration `AddLoansIndex` thêm composite + partial index; README phải paste output EXPLAIN Before/After và chứng minh Execution Time giảm >= 5x.
### proTipsHints
- Chạy `VACUUM ANALYZE loans` trước khi đo lại để cập nhật statistics.
- Giữ query Before/After giống hệt nhau để so sánh công bằng.

## 4
### purpose
Chứng minh tính đúng của thiết kế bằng benchmark concurrent và bằng chứng đầu ra.
### technicalConstraints
`bench:concurrency` phải cho kết quả ổn định 5 lần liên tiếp với `ok=5, conflict=5, finalStock=0`; README bắt buộc paste raw output text cho smoke test, N+1 fix, concurrent test, EXPLAIN.
### proTipsHints
- Reset stock trước mỗi lần benchmark để tránh lệch kết quả.
- Ghi lại output terminal ngay sau mỗi run để tránh mất evidence.

### forbidden
- Dùng `findOne/save` ngoài transaction cho flow đổi stock -> **0 prompt transaction**.
- Bỏ `@VersionColumn` hoặc né optimistic lock -> **0 prompt optimistic lock**.
- Chạy EXPLAIN trên dataset < 50k rows hoặc không có seed lớn -> **0 prompt index**.
- Để tồn tại N+1 query ở endpoint list loans -> **0 prompt N+1**.

# prerequisites
## 0
### text
Đã xong MEDIUM `1-typeorm-advanced-config-multi-datasource-medium`.
## 1
### text
Hiểu cơ bản `ACID`, `READ COMMITTED` (default Postgres), race condition trên hàng.
## 2
### text
Biết đọc `EXPLAIN ANALYZE` (Seq Scan vs Index Scan, Execution Time, Buffers).
## 3
### text
Biết cơ bản optimistic vs pessimistic lock.

# steps

## 0
### title
Thêm User entity, Book.stock, Book.version, Loan entity + 4 migration
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `User` entity:
  ```ts
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ unique: true }) email: string;
    @Column() name: string;
    @CreateDateColumn() createdAt: Date;
  }
  ```
- **Bước 2:** Cập nhật `Book` entity:
  ```ts
  @Column({ type: 'int', default: 0 }) stock: number;
  @VersionColumn() version: number;
  ```
- **Bước 3:** Tạo enum + entity `Loan`:
  ```ts
  export enum LoanStatus { BORROWED = 'BORROWED', RETURNED = 'RETURNED' }

  @Entity('loans')
  export class Loan {
    @PrimaryGeneratedColumn('uuid') id: string;
    @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user: User;
    @Column({ name: 'user_id' }) userId: string;
    @ManyToOne(() => Book, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'book_id' }) book: Book;
    @Column({ name: 'book_id' }) bookId: string;
    @CreateDateColumn({ name: 'borrowed_at' }) borrowedAt: Date;
    @Column({ name: 'returned_at', type: 'timestamp', nullable: true }) returnedAt: Date | null;
    @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.BORROWED }) status: LoanStatus;
  }
  ```
- **Bước 4:** Sinh 4 migration riêng biệt (KHÔNG gộp):
  ```bash
  npm run migration:generate -- src/migrations/CreateUsers
  npm run migration:generate -- src/migrations/AddBookStock
  npm run migration:generate -- src/migrations/AddBookVersion
  npm run migration:generate -- src/migrations/CreateLoans
  npm run migration:run
  ```
  Trong migration `CreateLoans`, manually thêm 2 index:
  ```ts
  await queryRunner.query(`CREATE INDEX idx_loans_book_id ON loans(book_id)`);
  await queryRunner.query(`CREATE INDEX idx_loans_borrowed_at ON loans USING BRIN(borrowed_at)`);
  ```
  (Chưa thêm composite index ở bước này - để migration `AddLoansIndex` ở Bước 4 thể hiện rõ lợi ích EXPLAIN ANALYZE.)

**Yêu cầu tối thiểu cần đạt**
- `\dt` show thêm bảng `users` và `loans`.
- `\d books` có cột `stock int NOT NULL DEFAULT 0` và `version int NOT NULL DEFAULT 1`.
- `\d loans` có FK `user_id -> users(id)`, `book_id -> books(id)` và 2 index `idx_loans_book_id`, `idx_loans_borrowed_at` (BRIN).
- `\d loans` show cột `status` là enum type `loan_status_enum` hoặc `text` với CHECK - không phải `varchar` tự do.
- Tổng 4 file migration mới nằm `src/migrations/` với timestamp tăng dần.

**Nice to have**
- Thêm CHECK constraint `stock >= 0` ở DB level để defense-in-depth nếu app quên.
- Seed 3 user + 10 book với stock random bằng `npm run db:seed`.

## 1
### title
Implement POST /loans/borrow với transaction + optimistic lock + retry handler
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `LoanService.borrow(userId, bookId)` dùng `DataSource.transaction`:
  ```ts
  await this.dataSource.transaction(async (em) => {
    const book = await em.findOneBy(Book, { id: bookId });
    if (!book) throw new NotFoundException({ code: 'BOOK_NOT_FOUND' });
    if (book.stock <= 0) throw new ConflictException({ code: 'OUT_OF_STOCK' });
    book.stock -= 1;
    await em.save(book);
    const loan = em.create(Loan, { userId, bookId, status: LoanStatus.BORROWED });
    await em.save(loan);
    return loan;
  });
  ```
  Inject `@InjectDataSource('primary') private readonly dataSource: DataSource;`.
- **Bước 2:** Viết helper `retryOnOptimisticLock<T>(fn, attempts = 3, baseMs = 100)`:
  ```ts
  export async function retryOnOptimisticLock<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try { return await fn(); }
      catch (err) {
        const isVersion = err instanceof OptimisticLockVersionMismatchError
          || err?.message?.includes('optimistic lock');
        if (!isVersion || i === attempts - 1) throw err;
        await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
      }
    }
    throw new Error('unreachable');
  }
  ```
- **Bước 3:** Bọc transaction bằng helper:
  ```ts
  async borrow(dto: BorrowDto) {
    return retryOnOptimisticLock(() => this.dataSource.transaction(async (em) => {...}));
  }
  ```
  Nếu hết 3 retry vẫn `OptimisticLockVersionMismatchError` -> convert sang `ConflictException({ code: 'CONCURRENT_CONFLICT' })` bằng `try/catch` ngoài helper.
- **Bước 4:** `LoanController`:
  - `POST /loans/borrow` body `{userId, bookId}` -> 201 trả `loan`.
  - Swagger / OpenAPI tùy chọn.
- **Bước 5:** Enable logging SQL ở `development` để verify TypeORM tự inject `WHERE version = $X` trong UPDATE của book. Grep log SQL khi gọi borrow, paste raw dòng `UPDATE "books" SET ... "version" = "version" + 1 WHERE "id" = $N AND "version" = $M`.

**Yêu cầu tối thiểu cần đạt**
- `POST /loans/borrow` trên book có `stock = 3` -> trả 201, DB `stock = 2`, có 1 row loan mới `status='BORROWED'`, `book.version` tăng 1.
- `POST /loans/borrow` trên book có `stock = 0` -> 409 body chứa `"code":"OUT_OF_STOCK"`.
- `POST /loans/borrow` với `bookId` không tồn tại -> 404 body chứa `"code":"BOOK_NOT_FOUND"`.
- Log SQL khi borrow có dòng `UPDATE "books" ... WHERE "id" = $N AND "version" = $M` (chứng minh TypeORM đang dùng optimistic lock thật, không phải dummy).
- Toàn repo: mọi thao tác `stock -= 1` đều nằm trong `dataSource.transaction(...)`; grep không thấy `bookRepo.save(book)` ngoài transaction cho trường hợp giảm stock.

**Nice to have**
- Emit event `loan.borrowed` qua `@nestjs/event-emitter` để decouple cho feature sau (notification).
- Metric Prometheus counter `loans_borrowed_total`, `loans_conflicts_total`.

## 2
### title
Endpoint return + concurrent test script 10 user cùng mượn stock=5
### body
**Các bước thực hiện**
- **Bước 1:** `LoanService.return(loanId)`:
  ```ts
  return this.dataSource.transaction(async (em) => {
    const loan = await em.findOne(Loan, { where: { id: loanId }, relations: ['book'] });
    if (!loan) throw new NotFoundException({ code: 'LOAN_NOT_FOUND' });
    if (loan.status === LoanStatus.RETURNED) throw new ConflictException({ code: 'ALREADY_RETURNED' });
    loan.status = LoanStatus.RETURNED;
    loan.returnedAt = new Date();
    loan.book.stock += 1;
    await em.save(loan.book);
    await em.save(loan);
    return loan;
  });
  ```
  Cũng bọc `retryOnOptimisticLock`.
- **Bước 2:** Controller `POST /loans/:id/return` -> 200 trả `loan` đã update.
- **Bước 3:** Viết `scripts/benchmark-concurrency.ts`:
  ```ts
  import axios from 'axios';
  // seed: 1 book có stock=5, 10 user
  const bookId = process.env.BOOK_ID!;
  const userIds = JSON.parse(process.env.USER_IDS!); // array 10 uuid
  const results = await Promise.allSettled(
    userIds.map((userId) => axios.post('http://localhost:3000/loans/borrow', { userId, bookId }))
  );
  const ok = results.filter(r => r.status === 'fulfilled').length;
  const conflict = results.filter(r => r.status === 'rejected' && r.reason.response?.status === 409).length;
  const finalStock = (await axios.get(`http://localhost:3000/books/${bookId}`)).data.stock;
  console.log({ ok, conflict, finalStock });
  ```
  Script phải assert `ok + conflict === 10`, `finalStock === 0`.
- **Bước 4:** Thêm script `"bench:concurrency": "ts-node scripts/benchmark-concurrency.ts"`. Chạy:
  ```bash
  npm run bench:concurrency
  ```

**Yêu cầu tối thiểu cần đạt**
- Script chạy ít nhất 5 lần liên tiếp (reset `stock=5` trước mỗi lần): **mỗi lần** log ra `{ ok: 5, conflict: 5, finalStock: 0 }` (không được `ok: 4` hay `ok: 6`).
- Không có trường hợp 2 loan cùng giảm stock xuống quá `0` (grep DB: `SELECT MIN(stock) FROM books;` không bao giờ < 0).
- `POST /loans/:id/return` đưa stock tăng +1 đúng 1 lần; gọi lại lần 2 -> 409 `ALREADY_RETURNED`, stock KHÔNG tăng thêm.
- Trong log SQL của 10 request concurrent, có ít nhất vài dòng raise `OptimisticLockVersionMismatchError` được retry (duration `100ms/200ms/400ms`) - chứng minh retry handler hoạt động, KHÔNG phải luôn pass ngay lần đầu.

**Nice to have**
- Test với `Promise.all` 50 user stock=10 -> `{ ok: 10, conflict: 40 }` ổn định.
- Tích hợp `autocannon` đo throughput `/loans/borrow` với stock cao để xem p99.

## 3
### title
Fix N+1 trên GET /users/:id/loans và verify bằng query count
### body
**Các bước thực hiện**
- **Bước 1:** Tạm viết naive version **SAI** (để so sánh) trong branch `bad-n-plus-1`:
  ```ts
  const loans = await this.loanRepo.find({ where: { userId } });
  for (const l of loans) {
    l.book = await this.bookRepo.findOneBy({ id: l.bookId });
    l.book.author = await this.authorRepo.findOneBy({ id: l.book.authorId });
  }
  ```
  Chạy `GET /users/:id/loans` với 20 loan -> xem log SQL: phải có **41 query** (1 loans + 20 books + 20 authors).
- **Bước 2:** Merge về `main` với fix đúng dùng `QueryBuilder`:
  ```ts
  return this.dataSource.getRepository(Loan)
    .createQueryBuilder('loan')
    .leftJoinAndSelect('loan.book', 'book')
    .leftJoinAndSelect('book.author', 'author')
    .where('loan.userId = :userId', { userId })
    .andWhere(status ? 'loan.status = :status' : '1=1', { status })
    .orderBy('loan.borrowedAt', 'DESC')
    .getMany();
  ```
- **Bước 3:** Verify bằng log SQL: `GET /users/:id/loans` sinh **đúng 1 SELECT** có `LEFT JOIN books`, `LEFT JOIN authors`.
- **Bước 4:** Viết 1 test e2e (`supertest` + spy vào `WinstonQueryLogger.logQuery`) assert query count ≤ 2 (để cho phép 1 query warmup + 1 query thật).
- **Bước 5:** Trong README mục **N+1 Fix**, paste:
  - Raw log SQL khi chạy version SAI (đếm query).
  - Raw log SQL khi chạy version ĐÚNG (1 query).
  - Code diff rút ngắn.

**Yêu cầu tối thiểu cần đạt**
- `GET /users/:id/loans` với 20 loan sinh **duy nhất 1 query SELECT** có `LEFT JOIN` (verify bằng log TypeORM, grep `SELECT "loan"` chỉ ra 1 match).
- Test e2e `loans.e2e-spec.ts` có case assert `queryCount <= 2` cho endpoint trên.
- Response có đủ field `loan.book.title` và `loan.book.author.name` (nested 2 cấp) được populate đúng, không phải `undefined`.
- README mục **N+1 Fix** có raw log trước/sau.

**Nice to have**
- Dùng `dataloader` pattern cho trường hợp không muốn JOIN rộng (batch load authors riêng).
- Benchmark: gọi endpoint 100 lần với `autocannon`, so sánh latency before/after paste README.

## 4
### title
Seed 50k loans + EXPLAIN ANALYZE trước/sau thêm composite index + partial index
### body
**Các bước thực hiện**
- **Bước 1:** Viết `scripts/seed-big.ts` insert **≥ 50k loans**, 100 user, 500 book (random `user_id`, `book_id`, `status` 70% BORROWED / 30% RETURNED). Dùng `queryRunner.manager.createQueryBuilder().insert()` batch 1000 row/lần, đặt `synchronize:false` vẫn giữ.
  ```bash
  npm run db:seed:big
  ```
- **Bước 2:** Trước khi thêm composite index, chạy `EXPLAIN ANALYZE`:
  ```bash
  docker exec -it <pg> psql -U library -d library -c \
    "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM loans WHERE user_id = '<user>' AND status = 'BORROWED';"
  ```
  Copy output vào README mục **EXPLAIN ANALYZE - Before**. Kỳ vọng `Seq Scan on loans` hoặc `Bitmap Index Scan` chậm với `Execution Time` > 30ms.
- **Bước 3:** Tạo migration mới `AddLoansIndex`:
  ```ts
  await queryRunner.query(`CREATE INDEX idx_loans_user_id_status ON loans(user_id, status);`);
  await queryRunner.query(`CREATE INDEX idx_loans_borrowed_partial ON loans(user_id, borrowed_at) WHERE status='BORROWED';`);
  ```
  `down()` drop đúng 2 index.
  ```bash
  npm run migration:run
  ```
- **Bước 4:** Chạy `VACUUM ANALYZE loans;` để refresh statistics:
  ```bash
  docker exec -it <pg> psql -U library -d library -c "VACUUM ANALYZE loans;"
  ```
- **Bước 5:** Chạy lại `EXPLAIN ANALYZE` giống Bước 2. Copy output vào README mục **EXPLAIN ANALYZE - After**. Kỳ vọng `Index Scan using idx_loans_user_id_status` với `Execution Time` giảm ≥ 5x.
- **Bước 6:** README thêm bảng so sánh:
  ```
  | Query            | Plan       | Execution Time | Shared Buffers |
  | Before index     | Seq Scan   | 45.2 ms        | 1234           |
  | After composite  | Index Scan | 0.8 ms         | 12             |
  ```

**Yêu cầu tối thiểu cần đạt**
- `scripts/seed-big.ts` insert **≥ 50k loans** (verify bằng `SELECT COUNT(*) FROM loans;` ≥ 50000).
- 2 file output EXPLAIN ANALYZE (Before + After) được paste **nguyên bản** (bao gồm `cost=...`, `Execution Time: ...ms`) vào README.
- Plan `Before`: bắt được `Seq Scan on loans` hoặc không hit index mới; Plan `After`: bắt được `Index Scan using idx_loans_user_id_status` (hoặc partial index `idx_loans_borrowed_partial`).
- `Execution Time` After / Before ≤ 0.2 (tức giảm ≥ 5x). Nếu không đạt -> phải ghi rõ trong README lý do kèm phân tích `BUFFERS` và coi như chưa pass prompt này.
- Migration `AddLoansIndex` có `up()` tạo 2 index và `down()` drop đúng 2 index. `npm run migration:revert` drop được cả 2.

**Nice to have**
- Thêm index `idx_loans_book_id_borrowed_at` phục vụ query "ai đã mượn book X".
- Dùng `pg_stat_user_indexes` kiểm tra `idx_scan` > 0 sau smoke test để chứng minh index thực sự được dùng.
- Tối ưu thêm bằng **covering index** `CREATE INDEX ... INCLUDE (returned_at)` để index-only scan, đo lại Execution Time.

## 5
### title
Smoke test 3 kịch bản bằng curl + paste vào README
### body
**Các bước thực hiện**
- **Bước 1:** Chạy `docker compose up -d`, `npm run migration:run`, `npm run db:seed`, `nest start --watch`.
- **Bước 2:** Test happy borrow:
  ```bash
  curl -X POST http://localhost:3000/loans/borrow \
    -H "Content-Type: application/json" \
    -d '{"userId":"<userId>","bookId":"<bookId-stock-3>"}' -i
  ```
- **Bước 3:** Test out-of-stock:
  ```bash
  curl -X POST http://localhost:3000/loans/borrow \
    -H "Content-Type: application/json" \
    -d '{"userId":"<userId>","bookId":"<bookId-stock-0>"}' -i
  ```
  Expect 409 body chứa `"code":"OUT_OF_STOCK"`.
- **Bước 4:** Test fixed-N+1 query:
  ```bash
  curl "http://localhost:3000/users/<userId>/loans?status=BORROWED" -i
  ```
  Paste raw log SQL chứng minh chỉ có **1 SELECT** duy nhất.
- **Bước 5:** Chạy concurrent script:
  ```bash
  npm run bench:concurrency
  ```
  Verify output `{ ok: 5, conflict: 5, finalStock: 0 }`. Chạy 5 lần liên tiếp (reset `stock=5` giữa các lần bằng seed).
- **Bước 6:** README mục **Smoke Test** paste:
  - Response happy borrow (có `version: 2` trên book).
  - Response out-of-stock 409.
  - Raw log SQL của `GET /users/:id/loans?status=BORROWED` (1 query).
  - Output terminal 5 lần chạy concurrent script (5x `{ok:5, conflict:5, finalStock:0}`).
  - Block EXPLAIN ANALYZE Before/After (đã paste ở Bước 4 Step 4).

**Yêu cầu tối thiểu cần đạt**
- Response happy borrow có `version` trên object `Book` trả về đã tăng so với trước khi mượn.
- Response out-of-stock 409 JSON chứa `"code":"OUT_OF_STOCK"`.
- Log SQL của `GET /users/:id/loans?status=BORROWED` **đúng 1 dòng** SELECT.
- Script concurrent chạy 5 lần đều ra `ok=5, conflict=5, finalStock=0`.
- README có đủ 5 bằng chứng dạng text (response happy, response out-of-stock, log 1 query, output 5x concurrent, block EXPLAIN ANALYZE Before/After).

# outputs
## 0
### text
Thiết kế và triển khai được luồng mượn/trả sách an toàn dưới concurrent load bằng transaction + optimistic lock.
## 1
### text
Xây được benchmark và kiểm chứng chống double-spend bằng kết quả chạy lặp ổn định.
## 2
### text
Fix được N+1 query bằng QueryBuilder join đúng tầng dữ liệu và có test/evidence đi kèm.
## 3
### text
Đo và giải thích được hiệu quả index bằng EXPLAIN ANALYZE trên dataset lớn thay vì suy đoán.
## 4
### text
Trình bày đầy đủ bằng chứng kỹ thuật qua raw output text để reviewer kiểm tra lại trực tiếp.

**Nice to have**
- Thêm benchmark `autocannon -c 50 -d 30 http://localhost:3000/users/<id>/loans?status=BORROWED` paste p99 vào README.
- Thêm 1 scenario return + immediate borrow cùng book bởi user khác để test flow return mở lại stock.

# references
## 0
### alias
TypeORM - Transactions
### url
https://typeorm.io/transactions
## 1
### alias
TypeORM - Concurrency / Optimistic lock (@VersionColumn)
### url
https://typeorm.io/entities#version
## 2
### alias
PostgreSQL - EXPLAIN
### url
https://www.postgresql.org/docs/16/using-explain.html
## 3
### alias
PostgreSQL - Partial indexes
### url
https://www.postgresql.org/docs/16/indexes-partial.html
## 4
### alias
NestJS - Database transactions
### url
https://docs.nestjs.com/techniques/database#transactions

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repo chứa source code đầy đủ + migration (users, book.stock, book.version, loans, loans index) + scripts (`seed-big`, `bench:concurrency`) + README có các mục bắt buộc: **Smoke Test**, **Concurrent Test** (5x), **N+1 Fix** (before/after), **EXPLAIN ANALYZE** (before/after + bảng so sánh). Commit `.env.example`, KHÔNG commit `.env`.
### score
50
### prompts
#### 0
##### title
Transaction ACID cho borrow + return, rollback đúng khi out-of-stock hoặc version mismatch
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (3 điểm): `borrow` và `return` đều chạy trong transaction, không có thay đổi stock ngoài transaction.
- Tiêu chí 2 (3 điểm): Borrow xử lý đúng `BOOK_NOT_FOUND` và `OUT_OF_STOCK`, rollback dữ liệu đúng.
- Tiêu chí 3 (2 điểm): Return idempotent: gọi lần 2 trả `ALREADY_RETURNED`, stock không tăng thêm.
- Tiêu chí 4 (2 điểm): Có evidence text chứng minh state DB trước/sau đúng với từng case.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Optimistic lock với @VersionColumn + retry handler exponential backoff 3 lần
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (3 điểm): `Book` dùng `@VersionColumn` đúng và SQL log có `WHERE ... version = ...`.
- Tiêu chí 2 (3 điểm): Retry optimistic lock hoạt động đúng với backoff `100/200/400ms` và lỗi cuối `CONCURRENT_CONFLICT`.
- Tiêu chí 3 (2 điểm): Concurrent test 10 user stock=5 cho kết quả chuẩn `ok=5, conflict=5, finalStock=0`.
- Tiêu chí 4 (2 điểm): Có ít nhất 1 lần retry được ghi nhận trong log/evidence.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
Index strategy + seed 50k rows + EXPLAIN ANALYZE trước/sau giảm Execution Time ≥ 5x
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (3 điểm): Seed script tạo tối thiểu 50k loans và có evidence count.
- Tiêu chí 2 (3 điểm): Migration `AddLoansIndex` tạo/drop đúng composite + partial index.
- Tiêu chí 3 (2 điểm): README paste raw EXPLAIN Before/After đúng query.
- Tiêu chí 4 (2 điểm): Execution Time giảm >= 5x và nêu rõ tỷ lệ so sánh.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 3
##### title
Fix N+1 trên GET /users/:id/loans về đúng 1 query JOIN
##### score
8
##### promptText
Chấm theo Rubric (tối đa 8 điểm):

- Tiêu chí 1 (3 điểm): Endpoint dùng QueryBuilder join đúng (`loan -> book -> author`) và trả nested data đầy đủ.
- Tiêu chí 2 (3 điểm): Log SQL chứng minh chỉ còn 1 SELECT cho endpoint list loans.
- Tiêu chí 3 (2 điểm): Có e2e test assert `queryCount <= 2` và evidence before/after bằng raw text.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 4
##### title
Concurrent test script xác nhận 0 double-spend, 5 lần chạy đều đúng
##### score
12
##### promptText
Chấm theo Rubric (tối đa 12 điểm):

- Tiêu chí 1 (4 điểm): Script concurrent chạy đúng và in `{ok, conflict, finalStock}`.
- Tiêu chí 2 (4 điểm): Chạy 5 lần liên tiếp đều cho `ok=5, conflict=5, finalStock=0`.
- Tiêu chí 3 (2 điểm): Có evidence `MIN(stock) >= 0`, không double-spend.
- Tiêu chí 4 (2 điểm): README paste đủ raw output của 5 lần chạy.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
## 1
### type
googleDocsUrl
### title
Design Note - Optimistic vs Pessimistic lock và chiến lược index (B-tree composite vs Partial)
### description
Google Docs (`Anyone with link: Viewer`) tối thiểu 600 từ giải thích: (a) vì sao chọn optimistic lock thay vì `SELECT ... FOR UPDATE` (pessimistic) cho flow borrow - trade-off throughput vs complexity; (b) khi nào optimistic **không phù hợp** (ví dụ write-heavy trên cùng row); (c) khác biệt giữa composite index `(user_id, status)` vs partial index `WHERE status='BORROWED'` - ưu điểm mỗi loại, khi nào dùng loại nào; (d) tại sao BRIN tốt cho `borrowed_at` (time-ordered, append-only); (e) 1 sơ đồ Mermaid sequence: client -> borrow transaction -> version check -> commit/retry/409.
### score
10
### prompts
#### 0
##### title
Giải thích đủ 5 ý a/b/c/d/e với số liệu + sơ đồ Mermaid
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (3 điểm): Docs dài tối thiểu 600 từ và có đủ 5 mục a/b/c/d/e.
- Tiêu chí 2 (3 điểm): Phân tích đúng optimistic vs pessimistic, có số liệu/citation hợp lệ và ví dụ hot-row cụ thể.
- Tiêu chí 3 (2 điểm): Giải thích rõ composite vs partial index và lý do BRIN phù hợp cho `borrowed_at`.
- Tiêu chí 4 (2 điểm): Có Mermaid sequence thể hiện đủ flow success/retry/409.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
hard

# score
60
