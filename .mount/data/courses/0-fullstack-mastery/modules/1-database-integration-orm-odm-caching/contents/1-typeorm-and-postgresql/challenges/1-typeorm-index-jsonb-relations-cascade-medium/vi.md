# title
TypeORM nâng cao - index chiến lược, jsonb column, quan hệ 1-1/1-n/n-n với cascade và auto timestamp

# description
Đây là challenge thực hành TypeORM nâng cao, mở rộng từ bài EASY. Bạn sẽ bổ sung quan hệ dữ liệu đầy đủ, index quan trọng, jsonb, migration nhiều bước và cơ chế cascade đúng để API chạy ổn định hơn trong bối cảnh gần production.

# requirements
## 0
### purpose
Nâng project EASY lên phiên bản TypeORM nâng cao để luyện đầy đủ quan hệ 1-1/1-n/n-n, chiến lược cascade và vận hành migration theo hướng production.
### technicalConstraints
Fork sang `library-typeorm-advanced-features`; bổ sung `AuthorProfile` (shared PK với `Author`), `Review` (1-n với `Book`), cập nhật `Author`/`Book` đúng quan hệ yêu cầu và giữ `synchronize: false`.
### proTipsHints
- Làm chắc phần quan hệ entity trước rồi mới generate migration để tránh migration diff rác.
- Tách rõ `save cascade` và `onDelete cascade` vì hai cơ chế này giải quyết hai thời điểm khác nhau.

## 1
### purpose
Xây hệ thống index đúng mục tiêu truy vấn để thấy sự khác nhau giữa B-tree, composite, partial và GIN.
### technicalConstraints
Phải có đủ index bắt buộc: `Book.title`, `Book(authorId,publishedYear)`, unique partial `uniq_book_isbn` trên `metadata->>'isbn'`, GIN `idx_book_search_vector`, `Review.rating`, `Review(bookId,rating)`.
### proTipsHints
- Partial index `isbn` nên tạo trong migration raw SQL để kiểm soát điều kiện `IS NOT NULL`.
- GIN index chỉ hiệu quả khi truy vấn full-text bám đúng `search_vector @@ to_tsquery(...)`.

## 2
### purpose
Thiết lập migration nhiều bước để mở rộng schema an toàn trên DB đã có dữ liệu.
### technicalConstraints
Phải có 4 migration mới: `CreateAuthorProfile`, `CreateReview`, `AddBookMetadataJsonb`, `AddBookSearchVector`; mỗi migration có `up()`/`down()` đầy đủ, gồm trigger `books_search_trigger` + backfill `search_vector`.
### proTipsHints
- Luôn verify bằng `\d` và `\di` sau khi chạy migration.
- Với bảng đã có data, kiểm tra kỹ nullable/default trước khi apply migration để tránh fail ở môi trường thật.

## 3
### purpose
Triển khai endpoint nâng cao để chứng minh cascade, jsonb query và full-text search hoạt động đúng.
### technicalConstraints
Phải có endpoint: `POST /authors/:id/profile`, `GET /authors/:id?withProfile=true`, `POST /books/:id/reviews`, `GET /books/search`, `GET /books/by-isbn/:isbn`, `GET /books/by-language/:lang`, cùng hành vi delete cascade theo mô tả.
### proTipsHints
- Endpoint tạo profile/review bắt buộc đi qua `authorRepo.save(author)` hoặc `bookRepo.save(book)` để thể hiện cascade đúng bản chất.
- Giữ query jsonb/full-text trong service bằng QueryBuilder để dễ kiểm soát SQL sinh ra.

## 4
### purpose
Xác thực bằng chứng kỹ thuật để chứng minh thiết kế đúng (không chỉ chạy được API).
### technicalConstraints
Bắt buộc có verify: log SQL insert `author_profiles` từ cascade, lỗi `23505` khi trùng `isbn`, `EXPLAIN ANALYZE` hit `idx_book_search_vector`, `updated_at` đổi đúng sau update, delete author không vỡ FK.
### proTipsHints
- Lưu output verify sớm trong quá trình làm để tránh thiếu evidence ở cuối.
- Khi test cascade delete, so sánh count trước/sau để chứng minh bằng số liệu rõ ràng.

### forbidden
- `synchronize: true` ở bất kỳ env/file nào -> **0 prompt migration**.
- Dùng `@Column({ type: 'json' })` thay vì `'jsonb'` -> **0 prompt jsonb**.
- Gọi `profileRepo.save()`/`reviewRepo.save()` trực tiếp ở flow bắt buộc cascade -> **0 prompt cascade**.
- Update `search_vector` ở application code thay vì trigger DB -> **0 prompt index GIN**.
- Dùng `new Date()` thủ công cho `createdAt`/`updatedAt` -> **0 prompt auto timestamp**.

# prerequisites
## 0
### text
Đã xong EASY `0-library-author-book-tag-crud-easy`.
## 1
### text
Biết cơ bản Postgres: jsonb operators (`->`, `->>`, `@>`), tsvector/tsquery, trigger PL/pgSQL.
## 2
### text
Hiểu cascade semantics (save cascade vs onDelete cascade - khác nhau).

# steps

## 0
### title
Fork project EASY, cài deps và tạo khung entity mới
### body
**Các bước thực hiện**
- **Bước 1:** Copy EASY sang `library-typeorm-advanced-features`, giữ 3 entity + 2 migration cũ.
- **Bước 2:** Cài thêm dependency (nếu chưa có):
  ```bash
  npm i class-validator class-transformer
  ```
- **Bước 3:** Sinh module + service + controller:
  ```bash
  nest g module review
  nest g controller review
  nest g service review
  nest g module profile
  nest g service profile
  ```
- **Bước 4:** Tạo file `src/author/entities/author-profile.entity.ts` và `src/review/entities/review.entity.ts` (chưa điền nội dung).

**Yêu cầu tối thiểu cần đạt**
- Folder project mới `library-typeorm-advanced-features` boot được bằng `nest start --watch`.
- `package.json` có `class-validator`, `class-transformer`.
- 2 module mới `ReviewModule`, `ProfileModule` tồn tại và đã import vào `AppModule`.
- Giữ nguyên 3 entity + 2 migration EASY, `synchronize: false` không đổi.

**Nice to have**
- Thêm Swagger module `@nestjs/swagger` + endpoint `/api` để verify schema sau mỗi bước.
- Thêm `tsconfig.json` `strictPropertyInitialization: false` nếu TypeScript phàn nàn về uninitialized property trên entity.

## 1
### title
Quan hệ 1-1 AuthorProfile với shared PK + cascade save
### body
**Các bước thực hiện**
- **Bước 1:** Hoàn thiện `src/author/entities/author-profile.entity.ts`:
  ```ts
  @Entity('author_profiles')
  export class AuthorProfile {
    @PrimaryColumn('uuid', { name: 'id' }) id: string;

    @OneToOne(() => Author, (a) => a.profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    author: Author;

    @Column() avatarUrl: string;

    @Column({ type: 'jsonb', default: {} })
    social: { twitter?: string; github?: string; website?: string };

    @Column({ type: 'jsonb', default: { totalBooks: 0, totalReviews: 0, avgRating: 0 } })
    stats: { totalBooks: number; totalReviews: number; avgRating: number };

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  ```
- **Bước 2:** Sửa `Author` entity thêm quan hệ ngược:
  ```ts
  @OneToOne(() => AuthorProfile, (p) => p.author, { cascade: true, eager: false })
  profile?: AuthorProfile;
  ```
  `cascade: true` -> khi `authorRepo.save(author)` có `author.profile`, TypeORM tự insert/update profile.
- **Bước 3:** Generate migration `CreateAuthorProfile`:
  ```bash
  npm run migration:generate -- src/migrations/CreateAuthorProfile
  npm run migration:run
  ```
  Verify `\d author_profiles`:
  ```
  Column  |  Type  | Nullable
  id      | uuid   | NOT NULL (PK, FK to authors(id) ON DELETE CASCADE)
  ...
  ```
- **Bước 4:** Trong `AuthorController` thêm endpoint `POST /authors/:id/profile`:
  ```ts
  async createProfile(@Param('id') id: string, @Body() dto: CreateProfileDto) {
    const author = await this.authorRepo.findOneBy({ id });
    if (!author) throw new NotFoundException();
    author.profile = this.profileRepo.create({ id, avatarUrl: dto.avatarUrl, social: dto.social });
    return this.authorRepo.save(author); // cascade insert profile
  }
  ```
  KHÔNG gọi `profileRepo.save(profile)` ở đây.
- **Bước 5:** Thêm endpoint `GET /authors/:id?withProfile=true`:
  ```ts
  async getOne(@Param('id') id: string, @Query('withProfile') wp?: string) {
    const relations = wp === 'true' ? ['profile'] : [];
    const author = await this.authorRepo.findOne({ where: { id }, relations });
    if (!author) throw new NotFoundException();
    return author;
  }
  ```

**Yêu cầu tối thiểu cần đạt**
- `\d author_profiles` có `id uuid NOT NULL` vừa là PK vừa là FK tới `authors(id) ON DELETE CASCADE`.
- `POST /authors/:id/profile` body hợp lệ -> 201, DB có 1 row `author_profiles` với `id` trùng `author.id`.
- Log SQL của endpoint trên có **INSERT INTO "author_profiles"** (cascade từ `authorRepo.save`), **KHÔNG** có call trực tiếp đến `profileRepo.save`.
- `GET /authors/:id` (không có query param) trả author **không** kèm `profile` (undefined hoặc bỏ field).
- `GET /authors/:id?withProfile=true` trả author có field `profile` đầy đủ.
- `DELETE /authors/:id` xóa cascade profile (`SELECT COUNT(*) FROM author_profiles WHERE id = :id` = 0 sau delete).

**Nice to have**
- Dùng `@JoinColumn({ name: 'id', referencedColumnName: 'id' })` verbose để rõ intent shared-PK.
- Viết unit test spy `profileRepo.save` để chứng minh KHÔNG được gọi trong endpoint tạo profile.

## 2
### title
Quan hệ 1-n Review với cascade insert từ Book và CHECK rating 1-5
### body
**Các bước thực hiện**
- **Bước 1:** `src/review/entities/review.entity.ts`:
  ```ts
  @Entity('reviews')
  @Index(['rating'])
  @Index(['bookId', 'rating'])
  export class Review {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => Book, (b) => b.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'book_id' })
    book: Book;
    @Column({ name: 'book_id' }) bookId: string;

    @Column() reviewerName: string;

    @Column({ type: 'smallint' })
    rating: number;

    @Column({ type: 'text', nullable: true }) comment: string | null;

    @CreateDateColumn() createdAt: Date;
  }
  ```
- **Bước 2:** Thêm quan hệ 1-n trong `Book`:
  ```ts
  @OneToMany(() => Review, (r) => r.book, { cascade: ['insert'] })
  reviews: Review[];
  ```
  `cascade: ['insert']` - chỉ insert cascade khi save book, không update/remove cascade.
- **Bước 3:** Generate migration `CreateReview`:
  ```bash
  npm run migration:generate -- src/migrations/CreateReview
  ```
  Mở migration, thêm thủ công CHECK constraint:
  ```ts
  await queryRunner.query(`ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5);`);
  ```
  `down()` drop constraint trước khi drop bảng. Chạy `npm run migration:run`.
- **Bước 4:** `POST /books/:id/reviews` (qua `ReviewController`):
  ```ts
  async create(@Param('id') bookId: string, @Body() dto: CreateReviewDto) {
    const book = await this.bookRepo.findOne({ where: { id: bookId }, relations: ['reviews'] });
    if (!book) throw new NotFoundException();
    book.reviews = [...(book.reviews ?? []), this.reviewRepo.create({ ...dto, bookId })];
    await this.bookRepo.save(book); // cascade insert review
    return book.reviews.at(-1);
  }
  ```
- **Bước 5:** DTO `CreateReviewDto` dùng `class-validator`:
  ```ts
  export class CreateReviewDto {
    @IsString() @IsNotEmpty() reviewerName: string;
    @IsInt() @Min(1) @Max(5) rating: number;
    @IsOptional() @IsString() comment?: string;
  }
  ```
- **Bước 6:** Sửa `POST /books` để chấp nhận `reviews?: CreateReviewDto[]` nested - khi có, cascade insert cả book lẫn reviews trong 1 call.

**Yêu cầu tối thiểu cần đạt**
- `\d reviews` có FK `book_id -> books(id) ON DELETE CASCADE` + CHECK `rating BETWEEN 1 AND 5` + 2 index `idx_reviews_rating` và `idx_reviews_book_id_rating` (tên do TypeORM sinh từ `@Index`).
- `POST /books/:id/reviews` với `rating=3` -> 201 có review row; với `rating=0` hoặc `rating=6` -> 400 hoặc 500 từ CHECK (validate 400 trước nhờ `class-validator`, nhưng nếu bypass validator thì Postgres vẫn chặn).
- `POST /books` với body chứa `reviews: [{...}, {...}]` nested -> tạo book + 2 review trong 1 request; log SQL có 1 INSERT book + 2 INSERT reviews, KHÔNG cần gọi `reviewRepo.save` riêng.
- `DELETE /books/:id` xóa cascade reviews của book đó; `SELECT COUNT(*) FROM reviews WHERE book_id = :id` = 0 sau delete. Các review của book khác KHÔNG bị ảnh hưởng.

**Nice to have**
- Endpoint `GET /books/:id/reviews?minRating=4&sort=recent` dùng `@Index(['bookId','rating'])` để filter + sort.
- Recompute `author.profile.stats.avgRating` sau mỗi review insert bằng transaction - cập nhật jsonb `stats` qua `UPDATE author_profiles SET stats = stats || :patch`.
- Test viết sẵn 1 case violation CHECK để chứng minh DB-side vẫn chặn khi client bypass validator.

## 3
### title
jsonb column Book.metadata + unique partial index trên metadata->>'isbn'
### body
**Các bước thực hiện**
- **Bước 1:** Sửa `Book` entity:
  ```ts
  export interface BookMetadata {
    isbn?: string;
    pages?: number;
    language?: string;
    coverUrl?: string;
  }

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  metadata: BookMetadata;
  ```
  **KHÔNG** dùng `'json'` - bắt buộc `'jsonb'` để Postgres lưu binary + index được.
- **Bước 2:** Generate migration `AddBookMetadataJsonb`:
  ```bash
  npm run migration:generate -- src/migrations/AddBookMetadataJsonb
  ```
  Mở migration, ngoài `ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb`, thêm thủ công:
  ```ts
  await queryRunner.query(
    `CREATE UNIQUE INDEX uniq_book_isbn ON books ((metadata->>'isbn')) WHERE metadata->>'isbn' IS NOT NULL;`
  );
  ```
  `down()` drop index trước khi drop column:
  ```ts
  await queryRunner.query(`DROP INDEX IF EXISTS uniq_book_isbn;`);
  await queryRunner.query(`ALTER TABLE books DROP COLUMN metadata;`);
  ```
- **Bước 3:** Chạy migration:
  ```bash
  npm run migration:run
  ```
  Verify:
  ```bash
  \d books
  \di uniq_book_isbn
  ```
  Phải thấy `partial, unique`.
- **Bước 4:** Sửa `POST /books` nhận nested `metadata` trong body:
  ```ts
  export class CreateBookDto {
    @IsString() title: string;
    @IsUUID() authorId: string;
    @IsArray() @IsUUID('4', { each: true }) tagIds: string[];
    @IsOptional() @IsObject() metadata?: BookMetadata;
  }
  ```
  Service lưu nguyên object vào column `metadata`.
- **Bước 5:** `GET /books/by-isbn/:isbn`:
  ```ts
  return this.bookRepo.createQueryBuilder('book')
    .where(`book.metadata->>'isbn' = :isbn`, { isbn })
    .getOne();
  ```
- **Bước 6:** `GET /books/by-language/:lang` dùng toán tử `@>`:
  ```ts
  return this.bookRepo.createQueryBuilder('book')
    .where(`book.metadata @> :patch`, { patch: JSON.stringify({ language: lang }) })
    .getMany();
  ```

**Yêu cầu tối thiểu cần đạt**
- `\d books` show cột `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`.
- `\di uniq_book_isbn`: `UNIQUE, partial` - verify là **partial** (có `WHERE metadata->>'isbn' IS NOT NULL`) chứ không phải unique full.
- `POST /books` với `metadata: { isbn: "978-1", pages: 300, language: "vi" }` -> 201.
- `POST /books` tạo book thứ 2 với cùng `metadata.isbn = "978-1"` -> 409 (controller catch `QueryFailedError code=23505` convert) hoặc 500 nếu chưa catch. Bắt buộc hiển thị rõ error code `23505`.
- `POST /books` tạo 2 book KHÔNG có `isbn` (metadata không có key `isbn` hoặc `{}`) -> cả 2 đều thành công (chứng minh partial index: null không bị unique check).
- `GET /books/by-isbn/978-1` trả đúng book; `EXPLAIN (ANALYZE) SELECT ... WHERE metadata->>'isbn' = '978-1';` show `Index Scan using uniq_book_isbn`.
- `GET /books/by-language/vi` trả mảng book có `metadata.language = 'vi'` (dùng jsonb `@>`).

**Nice to have**
- Thêm index GIN trên `metadata` cho query rộng hơn: `CREATE INDEX idx_books_metadata_gin ON books USING GIN (metadata);` - demo `metadata @> '{"pages": 300}'` dùng được index.
- Tạo DTO type `BookMetadataDto` với nested validate (`@IsString @Matches(/^[\d-]+$/)` cho isbn).
- Viết 1 test e2e verify partial index qua 2 insert null isbn cùng lúc đều pass.

## 4
### title
tsvector search_vector + trigger DB-side + GIN index cho full-text search
### body
**Các bước thực hiện**
- **Bước 1:** Sửa `Book` entity thêm:
  ```ts
  @Column({ type: 'tsvector', nullable: true, select: false })
  searchVector: unknown; // không populate từ app, do trigger DB xử lý
  ```
  `select: false` -> mặc định `find()` không kéo cột này (vì blob tsvector lớn và không cần cho response).
- **Bước 2:** Generate migration `AddBookSearchVector`. Điền thủ công:
  ```ts
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE books ADD COLUMN search_vector tsvector;`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION books_search_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', coalesce(NEW.title, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER books_search_update BEFORE INSERT OR UPDATE OF title
      ON books FOR EACH ROW EXECUTE FUNCTION books_search_trigger();
    `);
    await queryRunner.query(`CREATE INDEX idx_book_search_vector ON books USING GIN(search_vector);`);
    // backfill tsvector cho row cũ
    await queryRunner.query(`UPDATE books SET search_vector = to_tsvector('english', coalesce(title,''));`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_book_search_vector;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS books_search_update ON books;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS books_search_trigger();`);
    await queryRunner.query(`ALTER TABLE books DROP COLUMN IF EXISTS search_vector;`);
  }
  ```
- **Bước 3:** Chạy migration:
  ```bash
  npm run migration:run
  ```
  Verify `\d books` có cột `search_vector tsvector`; `\di idx_book_search_vector` là GIN.
- **Bước 4:** Endpoint `GET /books/search?q=<keyword>`:
  ```ts
  async search(@Query('q') q: string) {
    const tsq = q.split(/\s+/).filter(Boolean).join(' & ');
    return this.bookRepo.createQueryBuilder('book')
      .where(`book.search_vector @@ to_tsquery('english', :q)`, { q: tsq })
      .orderBy(`ts_rank(book.search_vector, to_tsquery('english', :q))`, 'DESC')
      .limit(20)
      .getMany();
  }
  ```
- **Bước 5:** Trigger test: `POST /books` title `"Advanced NestJS Patterns"`; sau đó `GET /books/search?q=nestjs` phải trả book đó. Sau đó `PATCH /books/:id` đổi title `"Advanced Spring Patterns"`; `GET /books/search?q=nestjs` không còn trả book; `GET /books/search?q=spring` trả book (chứng minh trigger update tsvector khi title change).
- **Bước 6:** `EXPLAIN (ANALYZE) SELECT ... FROM books WHERE search_vector @@ to_tsquery('english','nestjs');` verify `Bitmap Index Scan on idx_book_search_vector`.

**Yêu cầu tối thiểu cần đạt**
- Migration chạy xong: cột `search_vector` có giá trị cho mọi row cũ (backfill), trigger `books_search_update` tồn tại (`\df books_search_trigger`; `SELECT tgname FROM pg_trigger WHERE tgrelid='books'::regclass;`).
- `POST /books` title mới -> `SELECT search_vector FROM books WHERE id=:id;` ra tsvector không rỗng.
- `GET /books/search?q=nestjs` hit `Bitmap Index Scan on idx_book_search_vector` khi `EXPLAIN ANALYZE`.
- `PATCH /books/:id` đổi title -> `search_vector` auto cập nhật (verify bằng query DB trước/sau).
- KHÔNG có code TypeScript nào assign `book.searchVector = ...`; grep repo chỉ thấy cột trong entity khai báo, không có set value từ service.

**Nice to have**
- Support tiếng Việt: thêm config `CREATE TEXT SEARCH CONFIGURATION vietnamese (...)` và cho query chọn config theo `Accept-Language`.
- Thêm highlight bằng `ts_headline` trong response.
- Benchmark search trên 10k book với `autocannon`.

## 5
### title
Auto timestamp + @BeforeInsert / @BeforeUpdate hook và smoke test 5 kịch bản
### body
**Các bước thực hiện**
- **Bước 1:** Verify auto timestamp đã có từ EASY: `@CreateDateColumn() createdAt: Date;` và `@UpdateDateColumn() updatedAt: Date;` trên `Author`, `Book` (và `Review` chỉ có createdAt, `AuthorProfile` có cả 2). Đảm bảo **KHÔNG** có `new Date()` thủ công nào trong service gán cho 2 field này - grep toàn repo.
- **Bước 2:** Thêm hook `@BeforeUpdate` trên `Book` để demo thêm side-effect (ví dụ normalize `title.trim()`):
  ```ts
  @BeforeInsert() @BeforeUpdate()
  trimTitle() {
    if (this.title) this.title = this.title.trim();
  }
  ```
  (Hook này chỉ chạy khi dùng `repo.save(entity)`, KHÔNG chạy cho `repo.update(id, partial)` - ghi chú rõ trong README.)
- **Bước 3:** Chạy smoke test. Chạy `docker compose up -d`, `npm run migration:run`, `nest start --watch`.
- **Bước 4:** Test cascade save profile:
  ```bash
  curl -X POST http://localhost:3000/authors/<authorId>/profile \
    -H "Content-Type: application/json" \
    -d '{"avatarUrl":"https://cdn/a.png","social":{"github":"orwell"}}' -i
  ```
- **Bước 5:** Test nested create book + reviews + metadata:
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Advanced NestJS","authorId":"<a>","tagIds":["<t>"],"metadata":{"isbn":"978-1","pages":300,"language":"vi"},"reviews":[{"reviewerName":"Alice","rating":5,"comment":"Tuyệt"},{"reviewerName":"Bob","rating":4}]}' -i
  ```
- **Bước 6:** Test duplicate isbn fail:
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Duplicate","authorId":"<a>","tagIds":["<t>"],"metadata":{"isbn":"978-1"}}' -i
  ```
  Expect HTTP 409 hoặc 500, response có `23505` hoặc `uniq_book_isbn`.
- **Bước 7:** Test full-text search:
  ```bash
  curl "http://localhost:3000/books/search?q=nestjs" -i
  ```
- **Bước 8:** Test auto updatedAt:
  ```bash
  curl -X PATCH http://localhost:3000/books/<bookId> \
    -H "Content-Type: application/json" \
    -d '{"title":"Advanced NestJS v2"}' -i
  ```
  Sau đó query DB trực tiếp so sánh `createdAt` (không đổi) và `updatedAt` (đã đổi), đồng thời `SELECT search_vector FROM books` xem đã reindex theo title mới.
- **Bước 9:** Trong `README.md` mục **Smoke Test**, paste:
  - Response 5 kịch bản (cascade profile, create book nested, duplicate isbn, search, patch).
  - Output `\di` show 6 index (2 single, 2 composite, 1 unique partial, 1 GIN).
  - Output `\d author_profiles`, `\d reviews`, `\d books` show cột + FK + CHECK đầy đủ.
  - Output `EXPLAIN ANALYZE` của `GET /books/search?q=nestjs` show `Bitmap Index Scan on idx_book_search_vector`.

**Yêu cầu tối thiểu cần đạt**
- 5 kịch bản smoke test đều chạy đúng expected result ở bước trên; response/error được paste thật vào README.
- Grep toàn repo: KHÔNG có `new Date()` gán cho `createdAt` hoặc `updatedAt` ở bất kỳ service nào.
- Migration run/revert 2 chiều sạch sẽ cho cả 4 migration mới (profile, review, metadata+isbn, search_vector+trigger); `npm run migration:revert` 4 lần đưa DB về trạng thái EASY.
- `EXPLAIN ANALYZE` của search endpoint được paste vào README với plan `Bitmap Index Scan on idx_book_search_vector`.
- `\di` output trong README cho thấy **ít nhất 6 index** trên bảng `books` và `reviews` (title, author_id_published_year, uniq_book_isbn, idx_book_search_vector, rating, book_id_rating).

**Nice to have**
- Viết file `docs/TIMELINE.md` ghi lại thứ tự migration + feature thêm mỗi migration để người mới vào repo đọc dễ.
- Benchmark mini với `autocannon` cho 3 endpoint search/by-isbn/by-language so sánh với/không index.
- Export curl script (`docs/smoke-test.sh`) cho 5 kịch bản smoke test.

# outputs
## 0
### text
Triển khai đúng mô hình quan hệ nâng cao trong TypeORM (1-1 shared PK, 1-n, n-n) và dùng cascade đúng ngữ cảnh.
## 1
### text
Thiết kế và vận hành migration nhiều bước an toàn trên PostgreSQL, bao gồm rollback rõ ràng.
## 2
### text
Ứng dụng `jsonb`, partial index và GIN full-text search vào API thực tế, có bằng chứng bằng `EXPLAIN ANALYZE`.
## 3
### text
Kiểm soát chuẩn timestamp và side-effect dữ liệu khi update/delete, tránh anti-pattern thường gặp trong production.
## 4
### text
Trình bày được bằng chứng kỹ thuật (SQL log, index plan, smoke test) để tự đánh giá chất lượng triển khai.

# references
## 0
### alias
TypeORM - Indices (@Index)
### url
https://typeorm.io/indices
## 1
### alias
TypeORM - Entity listeners & subscribers
### url
https://typeorm.io/listeners-and-subscribers
## 2
### alias
TypeORM - One-to-one relations
### url
https://typeorm.io/one-to-one-relations
## 3
### alias
TypeORM - Cascade options
### url
https://typeorm.io/relations#cascades
## 4
### alias
PostgreSQL - JSONB type & operators
### url
https://www.postgresql.org/docs/16/datatype-json.html
## 5
### alias
PostgreSQL - Full text search (tsvector, GIN)
### url
https://www.postgresql.org/docs/16/textsearch.html

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repo chứa source code + 4 migration mới (profile, review, metadata+isbn, search_vector+trigger) + README có mục **Smoke Test** paste 5 kịch bản thật + output `\di` (≥ 6 index) + `EXPLAIN ANALYZE` của search endpoint. Commit `.env.example`, KHÔNG commit `.env`.
### score
30
### prompts
#### 0
##### title
Quan hệ 1-1 AuthorProfile shared PK với cascade save từ Author
##### score
6
##### promptText
Chấm theo Rubric (tối đa 6 điểm):

- Tiêu chí 1 (2 điểm): `AuthorProfile` dùng shared PK đúng chuẩn (`@PrimaryColumn('uuid', { name: 'id' })` + `@OneToOne` + `@JoinColumn({ name: 'id' })`) và `Author` có `profile` với `cascade: true`.
- Tiêu chí 2 (2 điểm): `POST /authors/:id/profile` tạo profile qua `authorRepo.save(author)`; log SQL có `INSERT INTO author_profiles`; không gọi trực tiếp `profileRepo.save`.
- Tiêu chí 3 (1 điểm): `GET /authors/:id?withProfile=true` load được profile, còn mặc định không load profile.
- Tiêu chí 4 (1 điểm): `DELETE /authors/:id` xóa cascade profile đúng.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Quan hệ 1-n Review với cascade insert + CHECK rating + 2 index (rating, composite)
##### score
6
##### promptText
Chấm theo Rubric (tối đa 6 điểm):

- Tiêu chí 1 (2 điểm): `Review` có quan hệ/constraint đúng (`@ManyToOne ... onDelete: 'CASCADE'`, CHECK `rating BETWEEN 1 AND 5`, index `rating` và composite `bookId+rating`).
- Tiêu chí 2 (2 điểm): `POST /books` với `reviews[]` nested tạo được book + reviews bằng cascade insert trong một flow.
- Tiêu chí 3 (1 điểm): `DELETE /books/:id` xóa cascade reviews của đúng book, không ảnh hưởng book khác.
- Tiêu chí 4 (1 điểm): `rating` ngoài khoảng 1..5 (ví dụ 0, 6) bị reject đúng.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
jsonb column Book.metadata với unique partial index trên isbn hoạt động đúng
##### score
6
##### promptText
Chấm theo Rubric (tối đa 6 điểm):

- Tiêu chí 1 (2 điểm): `Book.metadata` dùng đúng type `'jsonb'` với default `'{}'::jsonb` (không dùng `'json'`).
- Tiêu chí 2 (2 điểm): Migration tạo unique partial index `uniq_book_isbn` đúng điều kiện `WHERE metadata->>'isbn' IS NOT NULL`.
- Tiêu chí 3 (1 điểm): Insert trùng `isbn` bị lỗi `23505`; insert không có `isbn` vẫn pass đồng thời nhiều bản ghi.
- Tiêu chí 4 (1 điểm): `GET /books/by-isbn/:isbn` query đúng và `EXPLAIN ANALYZE` hit `Index Scan using uniq_book_isbn`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 3
##### title
tsvector search_vector + trigger DB-side + GIN index full-text search
##### score
7
##### promptText
Chấm theo Rubric (tối đa 7 điểm):

- Tiêu chí 1 (2 điểm): Migration thêm `search_vector`, function trigger, trigger update theo `title`, GIN index `idx_book_search_vector`, và backfill cho dữ liệu cũ.
- Tiêu chí 2 (2 điểm): Không có code TypeScript tự assign `book.searchVector` (DB-side trigger chịu trách nhiệm cập nhật).
- Tiêu chí 3 (2 điểm): `GET /books/search?q=<kw>` dùng điều kiện `search_vector @@ to_tsquery(...)` và `EXPLAIN ANALYZE` hit `Bitmap Index Scan on idx_book_search_vector`.
- Tiêu chí 4 (1 điểm): `PATCH /books/:id` đổi title làm `search_vector` tự cập nhật (verify trước/sau bằng query/search).

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 4
##### title
Auto timestamp + 6 index + migration up/down sạch + smoke test paste README
##### score
5
##### promptText
Chấm theo Rubric (tối đa 5 điểm):

- Tiêu chí 1 (2 điểm): `@CreateDateColumn` + `@UpdateDateColumn` được dùng đúng; không có `new Date()` gán thủ công cho các field timestamp này.
- Tiêu chí 2 (1 điểm): `\di` thể hiện tối thiểu 6 index đúng nhóm yêu cầu.
- Tiêu chí 3 (1 điểm): 4 migration mới chạy `run/revert` hai chiều sạch, đưa DB về trạng thái EASY.
- Tiêu chí 4 (1 điểm): README mục **Smoke Test** có đủ bằng chứng chính: 5 kịch bản thật + `EXPLAIN ANALYZE` search + output `\di`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
## 1
### type
googleDocsUrl
### title
Design Note - chọn cascade type nào cho use case nào, jsonb vs column thường, GIN vs B-tree
### description
Google Docs (`Anyone with link: Viewer`) tối thiểu 500 từ giải thích: (a) phân biệt `cascade: ['insert']` / `cascade: ['update']` / `cascade: true` / `onDelete: 'CASCADE'` - bảng so sánh 4 trường hợp với ví dụ; (b) khi nào nên dùng `jsonb` column thay vì tạo entity riêng, trade-off query + index cost; (c) so sánh GIN (tsvector) vs B-tree (`metadata->>'isbn'`) vs partial index - mỗi loại mạnh ở đâu; (d) 1 sơ đồ Mermaid `erDiagram` show đủ 5 entity + 4 quan hệ + ghi chú cascade.
### score
10
### prompts
#### 0
##### title
Giải thích đủ 4 ý a/b/c/d với bảng so sánh và sơ đồ Mermaid
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (3 điểm): Docs dài tối thiểu 500 từ, có đủ 4 mục đánh số a/b/c/d.
- Tiêu chí 2 (3 điểm): Mục (a) có bảng so sánh đủ 4 loại cascade với các cột bắt buộc và ví dụ cụ thể từ project.
- Tiêu chí 3 (2 điểm): Mục (b) và (c) phân tích đúng: jsonb (lý do dùng/không dùng) và so sánh GIN vs B-tree vs partial index.
- Tiêu chí 4 (2 điểm): Có Mermaid `erDiagram` render được, đúng 5 entity và 4 quan hệ kèm chú thích cascade.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
medium

# score
40
