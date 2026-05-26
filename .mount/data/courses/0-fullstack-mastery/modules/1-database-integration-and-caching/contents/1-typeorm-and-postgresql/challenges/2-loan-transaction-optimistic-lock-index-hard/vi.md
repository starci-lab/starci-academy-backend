# title
<!-- @starci/seperator -->
Loan feature với transaction, optimistic lock, index strategy và EXPLAIN ANALYZE trước/sau tối ưu
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Phát triển từ bản MEDIUM. Nghiệp vụ mượn/trả sách với cạnh tranh đồng thời cao: bạn triển khai `transaction`, optimistic lock qua `@VersionColumn`, chiến lược index composite + partial, và kiểm chứng hiệu năng bằng `EXPLAIN ANALYZE` trên dataset 50k+ rows.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Mở rộng project medium thành `library-loan-optimistic-lock` với đầy đủ domain cho nghiệp vụ mượn/trả sách.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Phải bổ sung `User`, `Loan`, và cột `Book.stock`, `Book.version` qua migration riêng; quan hệ `Loan -> User` là `onDelete: 'CASCADE'`, `Loan -> Book` là `onDelete: 'RESTRICT'`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Giữ migration tách nhỏ theo từng intent để dễ rollback.
- Dữ liệu seed ổn định sẽ giúp test concurrency lặp lại chính xác hơn.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): Entity `User`, `Loan` khai báo đúng với `@VersionColumn` trên `Book` để hỗ trợ optimistic lock.
- Tiêu chí B (3 điểm): `Loan -> User` `onDelete: 'CASCADE'` và `Loan -> Book` `onDelete: 'RESTRICT'` đúng nghiệp vụ (xóa user xóa loan, không cho xóa book khi còn loan active).
- Tiêu chí C (2 điểm): Migration tách rõ `AddBookStockVersion`, `CreateUserLoan`, `AddLoansIndex` — mỗi migration một intent.
- Tiêu chí D (2 điểm): Seed script idempotent + reproducible cho concurrency test (cùng seed → cùng kết quả benchmark).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Đảm bảo luồng borrow/return đúng tính nhất quán dữ liệu dưới tải đồng thời.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`POST /loans/borrow` và `POST /loans/:id/return` bắt buộc chạy trong `DataSource.transaction(...)`; borrow phải xử lý đủ `BOOK_NOT_FOUND`, `OUT_OF_STOCK`, `CONCURRENT_CONFLICT`; return phải idempotent với `ALREADY_RETURNED`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Viết helper retry optimistic lock riêng để tái sử dụng cho cả borrow và return.
- Theo dõi log SQL để xác nhận câu lệnh update có điều kiện version.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): `POST /loans/borrow` chạy trong `DataSource.transaction(...)`, decrement stock + insert loan + version check trong cùng một transaction; conflict → `OptimisticLockVersionMismatchError`.
- Tiêu chí B (4 điểm): Error mapping đúng — `BOOK_NOT_FOUND` 404, `OUT_OF_STOCK` 409, `CONCURRENT_CONFLICT` 409 sau khi retry hết quota.
- Tiêu chí C (3 điểm): `POST /loans/:id/return` idempotent — gọi 2 lần trên cùng loan → lần 2 trả `ALREADY_RETURNED` (HTTP 409), không double-restore stock.
- Tiêu chí D (3 điểm): Helper retry optimistic lock (≥3 lần) tái sử dụng cho cả borrow và return, có jitter/backoff giữa các retry.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Fix N+1 và tối ưu truy vấn danh sách loan theo user bằng index phù hợp.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /users/:id/loans?status=BORROWED` phải dùng QueryBuilder với join đủ `loan -> book -> author`, không được phát sinh mô hình 1 + N query.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- So sánh trước/sau bằng query count để chứng minh hiệu quả fix.
- Viết e2e assert query count để chống regressions.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (4 điểm): `GET /users/:id/loans?status=BORROWED` dùng QueryBuilder với `leftJoinAndSelect('loan.book', 'book').leftJoinAndSelect('book.author', 'author')` — single query.
- Tiêu chí B (3 điểm): Trước fix có ≥`1 + N` query (log SQL), sau fix có chính xác 1 query — paste log thật vào README.
- Tiêu chí C (3 điểm): E2e test assert query count (ví dụ `expect(querySpy).toHaveBeenCalledTimes(1)`) để chống regression.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Đo hiệu năng thực tế bằng EXPLAIN ANALYZE trên dữ liệu lớn, không đánh giá cảm tính.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Phải có `scripts/seed-big.ts` tạo tối thiểu 50k loans; migration `AddLoansIndex` thêm composite + partial index; README phải paste output EXPLAIN Before/After và chứng minh Execution Time giảm >= 5x.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Chạy `VACUUM ANALYZE loans` trước khi đo lại để cập nhật statistics.
- Giữ query Before/After giống hệt nhau để so sánh công bằng.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (4 điểm): `scripts/seed-big.ts` sinh ≥50k row loans với phân bố user/book/status thực tế (không skew toàn bộ vào 1 user).
- Tiêu chí B (5 điểm): Migration `AddLoansIndex` thêm composite `(userId, status)` + partial index `WHERE status = 'BORROWED'` đúng query pattern.
- Tiêu chí C (4 điểm): README paste `EXPLAIN ANALYZE` Before/After cùng câu query, cùng dataset — Execution Time After ≥ 5x nhanh hơn Before, paste plan với Index Scan thay cho Seq Scan.
- Tiêu chí D (2 điểm): `VACUUM ANALYZE loans` chạy giữa Before và After để fair-compare statistics.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Chứng minh tính đúng của thiết kế bằng benchmark concurrent và bằng chứng đầu ra.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`bench:concurrency` phải cho kết quả ổn định 5 lần liên tiếp với `ok=5, conflict=5, finalStock=0`; README bắt buộc paste raw output text cho smoke test, N+1 fix, concurrent test, EXPLAIN.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Reset stock trước mỗi lần benchmark để tránh lệch kết quả.
- Ghi lại output terminal ngay sau mỗi run để tránh mất evidence.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (4 điểm): `bench:concurrency` chạy 10 concurrent borrow trên book stock=5 → 5 lần liên tiếp đều cho `ok=5, conflict=5, finalStock=0` (deterministic, không flaky).
- Tiêu chí B (3 điểm): README paste raw output text cho cả 4 evidence: smoke test, N+1 fix Before/After log, concurrent benchmark, `EXPLAIN ANALYZE`.
- Tiêu chí C (3 điểm): Code Execution Trace ≥3 hop cho flow `POST /loans/borrow` show transaction boundary + version check + retry.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Dùng `findOne/save` ngoài transaction cho flow đổi stock -> **0 prompt transaction**.
- Bỏ `@VersionColumn` hoặc né optimistic lock -> **0 prompt optimistic lock**.
- Chạy EXPLAIN trên dataset < 50k rows hoặc không có seed lớn -> **0 prompt index**.
- Để tồn tại N+1 query ở endpoint list loans -> **0 prompt N+1**.
- Fabricate output benchmark / `EXPLAIN ANALYZE` trong README evidence -> **0 whole challenge**.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành MEDIUM `1-typeorm-index-jsonb-relations-cascade-medium`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Hiểu cơ bản `ACID`, `READ COMMITTED` (default Postgres), race condition trên hàng.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Biết đọc `EXPLAIN ANALYZE` (Seq Scan vs Index Scan, Execution Time, Buffers).
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Biết cơ bản optimistic vs pessimistic lock.
<!-- @starci/seperator -->
# steps

## 0
### title
<!-- @starci/seperator -->
Thêm User entity, Book.stock, Book.version, Loan entity + 4 migration
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
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

### 2. Yêu cầu tối thiểu cần đạt
- `\dt` show thêm bảng `users` và `loans`.
- `\d books` có cột `stock int NOT NULL DEFAULT 0` và `version int NOT NULL DEFAULT 1`.
- `\d loans` có FK `user_id -> users(id)`, `book_id -> books(id)` và 2 index `idx_loans_book_id`, `idx_loans_borrowed_at` (BRIN).
- `\d loans` show cột `status` là enum type `loan_status_enum` hoặc `text` với CHECK - không phải `varchar` tự do.
- Tổng 4 file migration mới nằm `src/migrations/` với timestamp tăng dần.

### 3. Nice to have
- Thêm CHECK constraint `stock >= 0` ở DB level để defense-in-depth nếu app quên.
- Seed 3 user + 10 book với stock random bằng `npm run db:seed`.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Implement POST /loans/borrow với transaction + optimistic lock + retry handler
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
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

### 2. Yêu cầu tối thiểu cần đạt
- `POST /loans/borrow` trên book có `stock = 3` -> trả 201, DB `stock = 2`, có 1 row loan mới `status='BORROWED'`, `book.version` tăng 1.
- `POST /loans/borrow` trên book có `stock = 0` -> 409 body chứa `"code":"OUT_OF_STOCK"`.
- `POST /loans/borrow` với `bookId` không tồn tại -> 404 body chứa `"code":"BOOK_NOT_FOUND"`.
- Log SQL khi borrow có dòng `UPDATE "books" ... WHERE "id" = $N AND "version" = $M` (chứng minh TypeORM đang dùng optimistic lock thật, không phải dummy).
- Toàn repo: mọi thao tác `stock -= 1` đều nằm trong `dataSource.transaction(...)`; grep không thấy `bookRepo.save(book)` ngoài transaction cho trường hợp giảm stock.

### 3. Nice to have
- Emit event `loan.borrowed` qua `@nestjs/event-emitter` để decouple cho feature sau (notification).
- Metric Prometheus counter `loans_borrowed_total`, `loans_conflicts_total`.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Endpoint return + concurrent test script 10 user cùng mượn stock=5
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
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

### 2. Yêu cầu tối thiểu cần đạt
- Script chạy ít nhất 5 lần liên tiếp (reset `stock=5` trước mỗi lần): **mỗi lần** log ra `{ ok: 5, conflict: 5, finalStock: 0 }` (không được `ok: 4` hay `ok: 6`).
- Không có trường hợp 2 loan cùng giảm stock xuống quá `0` (grep DB: `SELECT MIN(stock) FROM books;` không bao giờ < 0).
- `POST /loans/:id/return` đưa stock tăng +1 đúng 1 lần; gọi lại lần 2 -> 409 `ALREADY_RETURNED`, stock KHÔNG tăng thêm.
- Trong log SQL của 10 request concurrent, có ít nhất vài dòng raise `OptimisticLockVersionMismatchError` được retry (duration `100ms/200ms/400ms`) - chứng minh retry handler hoạt động, KHÔNG phải luôn pass ngay lần đầu.

### 3. Nice to have
- Test với `Promise.all` 50 user stock=10 -> `{ ok: 10, conflict: 40 }` ổn định.
- Tích hợp `autocannon` đo throughput `/loans/borrow` với stock cao để xem p99.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Fix N+1 trên GET /users/:id/loans và verify bằng query count
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
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

### 2. Yêu cầu tối thiểu cần đạt
- `GET /users/:id/loans` với 20 loan sinh **duy nhất 1 query SELECT** có `LEFT JOIN` (verify bằng log TypeORM, grep `SELECT "loan"` chỉ ra 1 match).
- Test e2e `loans.e2e-spec.ts` có case assert `queryCount <= 2` cho endpoint trên.
- Response có đủ field `loan.book.title` và `loan.book.author.name` (nested 2 cấp) được populate đúng, không phải `undefined`.
- README mục **N+1 Fix** có raw log trước/sau.

### 3. Nice to have
- Dùng `dataloader` pattern cho trường hợp không muốn JOIN rộng (batch load authors riêng).
- Benchmark: gọi endpoint 100 lần với `autocannon`, so sánh latency before/after paste README.
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Seed 50k loans + EXPLAIN ANALYZE trước/sau thêm composite index + partial index
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
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

### 2. Yêu cầu tối thiểu cần đạt
- `scripts/seed-big.ts` insert **≥ 50k loans** (verify bằng `SELECT COUNT(*) FROM loans;` ≥ 50000).
- 2 file output EXPLAIN ANALYZE (Before + After) được paste **nguyên bản** (bao gồm `cost=...`, `Execution Time: ...ms`) vào README.
- Plan `Before`: bắt được `Seq Scan on loans` hoặc không hit index mới; Plan `After`: bắt được `Index Scan using idx_loans_user_id_status` (hoặc partial index `idx_loans_borrowed_partial`).
- `Execution Time` After / Before ≤ 0.2 (tức giảm ≥ 5x). Nếu không đạt -> phải ghi rõ trong README lý do kèm phân tích `BUFFERS` và coi như chưa pass prompt này.
- Migration `AddLoansIndex` có `up()` tạo 2 index và `down()` drop đúng 2 index. `npm run migration:revert` drop được cả 2.

### 3. Nice to have
- Thêm index `idx_loans_book_id_borrowed_at` phục vụ query "ai đã mượn book X".
- Dùng `pg_stat_user_indexes` kiểm tra `idx_scan` > 0 sau smoke test để chứng minh index thực sự được dùng.
- Tối ưu thêm bằng **covering index** `CREATE INDEX ... INCLUDE (returned_at)` để index-only scan, đo lại Execution Time.
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Smoke test 3 kịch bản bằng curl + paste vào README
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
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

### 2. Yêu cầu tối thiểu cần đạt
- Response happy borrow có `version` trên object `Book` trả về đã tăng so với trước khi mượn.
- Response out-of-stock 409 JSON chứa `"code":"OUT_OF_STOCK"`.
- Log SQL của `GET /users/:id/loans?status=BORROWED` **đúng 1 dòng** SELECT.
- Script concurrent chạy 5 lần đều ra `ok=5, conflict=5, finalStock=0`.
- README có đủ 5 bằng chứng dạng text (response happy, response out-of-stock, log 1 query, output 5x concurrent, block EXPLAIN ANALYZE Before/After).
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Thiết kế và triển khai được luồng mượn/trả sách an toàn dưới concurrent load bằng transaction + optimistic lock.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Xây được benchmark và kiểm chứng chống double-spend bằng kết quả chạy lặp ổn định.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Fix được N+1 query bằng QueryBuilder join đúng tầng dữ liệu và có test/evidence đi kèm.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Đo và giải thích được hiệu quả index bằng EXPLAIN ANALYZE trên dataset lớn thay vì suy đoán.
<!-- @starci/seperator -->
## 4
### text
<!-- @starci/seperator -->
Trình bày đầy đủ bằng chứng kỹ thuật qua raw output text để reviewer kiểm tra lại trực tiếp.

### 3. Nice to have
- Thêm benchmark `autocannon -c 50 -d 30 http://localhost:3000/users/<id>/loans?status=BORROWED` paste p99 vào README.
- Thêm 1 scenario return + immediate borrow cùng book bởi user khác để test flow return mở lại stock.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
TypeORM - Transactions
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/transactions
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
TypeORM - Concurrency / Optimistic lock (@VersionColumn)
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/entities#version
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
PostgreSQL - EXPLAIN
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/using-explain.html
<!-- @starci/seperator -->

## 3
### alias
<!-- @starci/seperator -->
PostgreSQL - Partial indexes
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/indexes-partial.html
<!-- @starci/seperator -->

## 4
### alias
<!-- @starci/seperator -->
NestJS - Database transactions
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://docs.nestjs.com/techniques/database#transactions
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
Repo public chứa source `library-loan-optimistic-lock` với entity (User/Loan/Book mở rộng), migration tách intent (AddBookStockVersion, CreateUserLoan, AddLoansIndex), service borrow/return có `DataSource.transaction` + optimistic lock retry helper, `scripts/seed-big.ts` ≥50k loans, `scripts/bench-concurrency.ts`, và README 6 section với Smoke Test paste raw output: SQL log transaction, benchmark concurrency 5-run, N+1 fix Before/After, `EXPLAIN ANALYZE` Before/After (≥5x improvement).
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
