# title
<!-- @starci/seperator -->
CRUD Library với TypeORM + PostgreSQL (Author 1-n Book n-n Tag) và migration thật
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Bạn sẽ xây API quản lý thư viện bằng **NestJS**, **TypeORM** và **PostgreSQL** với ba entity **Author**, **Book**, **Tag** cùng các quan hệ 1-n và n-n. Mục tiêu là làm chủ flow CRUD, viết migration thật theo từng bước, và query dữ liệu theo điều kiện tag bằng QueryBuilder.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Dựng được project NestJS `library-typeorm-postgres` chạy với PostgreSQL thật qua Docker, thiết kế domain thư viện có quan hệ `Author 1-n Book` và `Book n-n Tag`.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Phải có `docker-compose.yml` chạy Postgres 16; 3 entity `Author/Book/Tag` đúng quan hệ; cấu hình TypeORM qua `ConfigService` + `src/database/data-source.ts` cho CLI migration; bắt buộc `synchronize: false`, `migrationsRun: false` ở mọi env.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Tạo `docker compose up -d` trước, rồi mới chạy app để dễ tách lỗi kết nối DB.
- Đặt tên bảng join rõ ràng `book_tags` để query/filter sau này dễ đọc.
- Giữ `publishedYear` để migration 2 xử lý, không thêm ngay từ migration init.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
6
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): Project NestJS scaffold đúng cấu trúc module và start được bằng `nest start --watch` mà không lỗi missing module.
- Tiêu chí B (2 điểm): 3 entity `Author/Book/Tag` khai báo đúng quan hệ 1-n và n-n với decorator TypeORM (`@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinTable`).
- Tiêu chí C (1 điểm): `docker-compose.yml` chạy Postgres 16 + container healthy, app kết nối thành công qua `ConfigService`.
- Tiêu chí D (1 điểm): `data-source.ts` export `DataSource` với `synchronize: false`, `migrations` trỏ đúng path, sẵn sàng cho CLI migration.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Thực hành quy trình migration đúng chuẩn production: tạo schema ban đầu, rồi bổ sung field mới sau khi hệ thống đã có dữ liệu.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Phải có đúng 2 migration trong `src/migrations/`: migration 1 tạo `authors/books/tags/book_tags` + FK + index `books.author_id`; migration 2 thêm cột `books.published_year int NULL`. Cả 2 migration đều có `up()` và `down()` đầy đủ và revert được.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Dùng script CLI chuẩn `migration:generate`, `migration:run`, `migration:revert` qua `typeorm-ts-node-commonjs`.
- Sau mỗi lần run/revert nên verify bằng `psql` (`\dt`, `\d books`) để chắc schema đúng như mong muốn.
- Migration 2 phải nullable để áp dụng được trên bảng đã có data.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): Migration 1 (`InitSchema`) tạo đủ 4 bảng + FK `books.author_id -> authors.id` + index trên FK; chạy thành công trên DB trống.
- Tiêu chí B (2 điểm): Migration 2 (`AddBookPublishedYear`) thêm cột `published_year int NULL` mà KHÔNG mất dữ liệu cũ; `up()` và `down()` đối xứng.
- Tiêu chí C (1 điểm): Cả hai migration revert được — `npm run migration:revert` drop sạch artefact của migration đó, không động vào artefact của migration khác.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Triển khai CRUD cốt lõi cho Author, Book, Tag và query theo tag để nắm cách làm việc với Repository + QueryBuilder trong TypeORM.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Bắt buộc có endpoint: `POST /authors`, `POST /tags`, `POST /books` (validate `authorId` + `tagIds`, sai trả 404), `GET /authors/:id/books` (load `relations: ['books']`), `GET /books?tag=<tagName>` (dùng QueryBuilder + join tags, trả `Book[]` kèm `tags`).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Check `tags.length !== dto.tagIds.length` để phát hiện tag ID sai sớm.
- Với endpoint filter tag, dùng `innerJoinAndSelect` để vừa lọc vừa trả tags trong cùng query.
- Validate global bằng `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
6
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): 3 endpoint POST tạo Author/Tag/Book đều trả HTTP 201 với JSON hợp lệ, validate fail trả 400 với message của `class-validator`.
- Tiêu chí B (2 điểm): `POST /books` xử lý đúng error cases — `authorId` không tồn tại trả 404 `author not found`; tag ID sai trả 404 `tag not found`.
- Tiêu chí C (1 điểm): `GET /authors/:id/books` load relation đúng qua `relations: ['books']` và trả mảng (có thể rỗng).
- Tiêu chí D (1 điểm): `GET /books?tag=<name>` dùng QueryBuilder `innerJoinAndSelect`, trả book có tag trùng hoặc mảng rỗng (KHÔNG 404 khi tag không có).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Hoàn thiện deliverable theo chuẩn nộp bài: README 6 section đầy đủ, smoke test paste output thật, và cấu hình env an toàn.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README phải có 6 section: Challenge description, How to run, Architecture/Stack (kèm Mermaid ERD), Smoke Test (paste output JSON + `psql \dt` text thật), Code Execution Trace (≥3 điểm chạm `file:line -> method()`), Design Decisions. Chỉ commit `.env.example`, tuyệt đối không commit `.env` thật.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Chụp log migration run thành công + output `psql \dt` để tăng độ tin cậy khi review.
- Code Execution Trace nên cover flow `POST /books` để show validate author + tag, save với cascade.
- Mermaid ERD đơn giản `AUTHORS ||--o{ BOOKS : writes` + `BOOKS }o--o{ TAGS : tagged_with` đủ trực quan.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Bật `synchronize: true` ở bất kỳ env / file nào -> **0 prompt migration**.
- Lazy relation (`Promise<Book[]>`) mà không `await` khiến response trả `Promise` string -> **0 whole challenge**.
- Commit file `.env` thật chứa credential ra public repo -> **0 whole challenge**.
- Khai báo sai optional/nullable cho entity so với đề bài (`Author.name`, `Book.title`, `Tag.name` bị để optional/nullable) -> **0 prompt entity requirements**.
- Fabricate output trong README mục Smoke Test (paste JSON giả thay vì run thật) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
3
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 3):

- Tiêu chí A (1 điểm): README đủ 6 section bắt buộc (Challenge description, How to run, Architecture, Smoke Test, Code Execution Trace, Design Decisions).
- Tiêu chí B (1 điểm): Smoke Test paste output JSON thật + `psql \dt` text thật + log migration run thật (không fabricate).
- Tiêu chí C (1 điểm): Code Execution Trace có ≥3 điểm chạm `file:line -> method()` cho flow chính (vd `POST /books`).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn triển khai được API CRUD thư viện bằng **NestJS** và **TypeORM** với quan hệ dữ liệu đúng giữa Author, Book, Tag.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn vận hành được quy trình migration 2 bước (init schema + mở rộng schema) theo chuẩn an toàn cho production.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn thực hiện được truy vấn theo tag bằng QueryBuilder và kiểm soát đúng các tình huống validate/lỗi phổ biến.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn giữ được cấu hình môi trường an toàn (không `synchronize: true`, không commit `.env` thật) và viết được README chuẩn 6 section.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành lesson `1-typeorm-and-postgresql` (nắm 1:1/1:N/N:N qua entity Cat/Toy/Owner).
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Biết cơ bản SQL (CREATE TABLE, JOIN, FK).
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Đã cài `docker` + `docker compose`.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Biết `@nestjs/config`, `ConfigService`.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Scaffold project và Postgres docker-compose
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo project + cài deps:
  ```bash
  nest new library-typeorm-postgres
  cd library-typeorm-postgres
  npm i @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer
  npm i -D @types/pg
  ```
- **Bước 2:** Tạo `docker-compose.yml` với service `postgres:16`, ports `5432:5432`, env `POSTGRES_DB/USER/PASSWORD=library`, volume `pgdata:/var/lib/postgresql/data`. Chạy `docker compose up -d`.
- **Bước 3:** Tạo `.env` + `.env.example` với `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=library`, `DB_PASSWORD=library`, `DB_NAME=library`. Thêm `.env` vào `.gitignore`.
- **Bước 4:** Sinh module khung `nest g module database/author/book/tag`.

### 2. Yêu cầu tối thiểu cần đạt
- `docker compose up -d` khởi động Postgres thành công; `docker ps` thấy container `postgres:16` healthy.
- `psql -h localhost -U library -d library` login được bằng password từ `.env`.
- `.env.example` commit được, `.env` thật nằm trong `.gitignore` (verify bằng `git status`).
- `nest start --watch` không bị lỗi missing module.

### 3. Nice to have
- Thêm `pgadmin` hoặc `adminer` service trong `docker-compose.yml` để browse DB bằng UI.
- Script `npm run db:up` alias cho `docker compose up -d`.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`@nestjs/typeorm`** + **`typeorm`** + **`pg`** — bộ tiêu chuẩn để NestJS nói chuyện với PostgreSQL qua TypeORM Repository pattern.

**Mapping API:**
- `TypeOrmModule.forRootAsync` -> bootstrap DataSource từ ConfigService.
- `TypeOrmModule.forFeature([Entity])` -> đăng ký repository per module.
- `@InjectRepository(Entity)` -> inject `Repository<Entity>` vào service.

**Khác biệt/gotcha:**
- `synchronize: true` rất tiện ở dev nhưng cấm tuyệt đối ở production — vì có thể drop column khi entity đổi.
- `autoLoadEntities: true` chỉ scan entity của module đã `forFeature` — quên đăng ký sẽ silently bỏ qua.
##### example
```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: "postgres",
        host: cfg.get("DB_HOST"),
        port: cfg.get<number>("DB_PORT"),
        username: cfg.get("DB_USER"),
        password: cfg.get("DB_PASSWORD"),
        database: cfg.get("DB_NAME"),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
})
export class AppModule {}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **EF Core 8** + `Npgsql.EntityFrameworkCore.PostgreSQL` — tương đương trực tiếp TypeORM.

**Mapping API:**
- `TypeOrmModule.forRoot` -> `services.AddDbContext<LibraryDbContext>(opt => opt.UseNpgsql(connStr))`.
- `@InjectRepository` -> constructor inject `LibraryDbContext` rồi `ctx.Authors`.
- `migration:generate` -> `dotnet ef migrations add InitSchema`.

**Khác biệt/gotcha:**
- EF Core không có `synchronize: true` — luôn dùng migration có version control.
- Connection string đọc từ `appsettings.json` qua `IConfiguration`.
##### example
```csharp
public class LibraryDbContext : DbContext {
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Tag> Tags => Set<Tag>();
    public LibraryDbContext(DbContextOptions<LibraryDbContext> opt) : base(opt) {}
}
builder.Services.AddDbContext<LibraryDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Library")));
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`gorm.io/gorm`** + `gorm.io/driver/postgres` — Go ORM idiomatic với struct tag.

**Mapping API:**
- `TypeOrmModule.forRoot` -> `gorm.Open(postgres.Open(dsn), &gorm.Config{})`.
- `Repository<T>` -> `*gorm.DB` truyền vào service struct.
- `migration:generate` -> tool `golang-migrate` riêng (GORM không có CLI builtin).

**Khác biệt/gotcha:**
- `AutoMigrate` chỉ an toàn cho dev — production phải dùng `golang-migrate` với file SQL có version.
- GORM convention: field `CreatedAt`/`UpdatedAt`/`DeletedAt` tự được handle nếu có `gorm.Model` embed.
##### example
```go
dsn := "host=localhost user=library password=library dbname=library port=5432 sslmode=disable"
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
if err != nil { log.Fatal(err) }
// production: dùng golang-migrate, KHÔNG AutoMigrate
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **Spring Boot Data JPA** (Hibernate) + `org.postgresql:postgresql` driver.

**Mapping API:**
- `TypeOrmModule.forRoot` -> `application.yml` `spring.datasource.url` + JPA auto-config.
- `Repository<T>` -> `interface AuthorRepo extends JpaRepository<Author, UUID>`.
- `migration:generate` -> Flyway/Liquibase script SQL độc lập.

**Khác biệt/gotcha:**
- `spring.jpa.hibernate.ddl-auto=none` ở production (tương đương `synchronize: false`).
- Flyway tự run migration ở startup nếu `spring.flyway.enabled=true`.
##### example
```java
@SpringBootApplication
public class LibraryApp {
    public static void main(String[] args) { SpringApplication.run(LibraryApp.class, args); }
}
// application.yml: spring.datasource.url, spring.jpa.hibernate.ddl-auto: none
```
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Định nghĩa 3 entity với đúng quan hệ 1-n và n-n
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo `src/author/entities/author.entity.ts` với `@PrimaryGeneratedColumn('uuid')`, `name`, `bio` (nullable text), `@OneToMany(() => Book, b => b.author) books`, `@CreateDateColumn`/`@UpdateDateColumn`.
- **Bước 2:** Tạo `src/book/entities/book.entity.ts` với `id` (uuid), `title`, `@ManyToOne(() => Author, a => a.books, { onDelete: 'CASCADE' })` + `@JoinColumn({ name: 'author_id' })`, `authorId` column, `@ManyToMany(() => Tag, t => t.books, { cascade: true })` + `@JoinTable({ name: 'book_tags' })`. CHƯA thêm `publishedYear`.
- **Bước 3:** Tạo `src/tag/entities/tag.entity.ts` với `id` (uuid), `name` (unique), `@ManyToMany(() => Book, b => b.tags) books`.
- **Bước 4:** Tạo `src/database/data-source.ts` export `new DataSource({ type: 'postgres', ..., synchronize: false, logging: ['error', 'warn', 'migration'] })`.
- **Bước 5:** Trong `AppModule` import `TypeOrmModule.forRootAsync({ useFactory, inject: [ConfigService] })` với `autoLoadEntities: true`, `synchronize: false`, `migrationsRun: false`.

### 2. Yêu cầu tối thiểu cần đạt
- 3 file entity tồn tại với đúng decorator và quan hệ như mô tả.
- `Book.publishedYear` CHƯA xuất hiện trong code ở bước này (giữ cho migration 2).
- `src/database/data-source.ts` export `DataSource` có `synchronize: false`, `migrations` trỏ đúng path.
- Grep toàn repo: KHÔNG có `synchronize: true` ở bất cứ đâu.

### 3. Nice to have
- Thêm `@Index(['name'])` trên `Author.name` để sẵn sàng search sau này.
- Tách interface `IRepository<T>` chung nếu muốn luyện thêm abstraction.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Viết và chạy migration 1 (init schema) bằng CLI
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Thêm scripts vào `package.json`: `typeorm`, `migration:generate`, `migration:run`, `migration:revert` dùng `typeorm-ts-node-commonjs`.
- **Bước 2:** Sinh migration init: `npm run migration:generate -- src/migrations/InitSchema`. Verify file có 4 `CREATE TABLE` + FK + unique index.
- **Bước 3:** Chạy `npm run migration:run`.
- **Bước 4:** Verify bằng `docker exec -it <container> psql -U library -d library -c "\dt"` — phải thấy 4 bảng + bảng `migrations`.
- **Bước 5:** Test revert: `npm run migration:revert` → `\dt` chỉ còn `migrations` → `migration:run` lại để khôi phục.

### 2. Yêu cầu tối thiểu cần đạt
- `npm run migration:run` thành công log `Migration "InitSchema<timestamp>" has been executed successfully`.
- `psql \dt` in ra đúng 5 bảng: `authors`, `books`, `tags`, `book_tags`, `migrations`.
- FK `books.author_id -> authors.id` tồn tại (verify bằng `\d books`).
- `npm run migration:revert` drop hết 4 bảng nghiệp vụ; chạy lại `migration:run` thì khôi phục đủ.

### 3. Nice to have
- Thêm index `idx_books_author_id` explicit trong migration 1 (thay vì để TypeORM tự sinh).
- Viết script `db:seed` để seed 2 author + 5 book + 3 tag mẫu cho smoke test.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Viết CRUD + QueryBuilder filter theo tag
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Trong mỗi module (`author`, `book`, `tag`) import `TypeOrmModule.forFeature([<Entity>])` và inject `@InjectRepository(<Entity>)` trong service.
- **Bước 2:** `AuthorService`: `create(dto)`, `findById(id, { relations: ['books'] })`.
- **Bước 3:** `TagService`: `create(dto)` throw `ConflictException` nếu duplicate name.
- **Bước 4:** `BookService.create(dto)` — validate `authorRepo.findOneBy({ id: authorId })`, validate `tagRepo.findBy({ id: In(tagIds) })` (check `tags.length !== tagIds.length`), rồi `bookRepo.create({ title, author, tags })` + `save`.
- **Bước 5:** `BookService.findByTag(tagName)` dùng `createQueryBuilder('book').innerJoinAndSelect('book.tags', 'tag').where('tag.name = :n', { n: tagName }).getMany()`.
- **Bước 6:** Bật `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` global trong `main.ts`.
- **Bước 7:** `AuthorController.getBooks(@Param('id'))` gọi `authorRepo.findOne({ where: { id }, relations: ['books'] })`, null -> `NotFoundException`.

### 2. Yêu cầu tối thiểu cần đạt
- `POST /authors`, `POST /tags`, `POST /books` đều trả 201 với JSON hợp lệ; validate fail -> 400.
- `POST /books` với `authorId` không tồn tại -> 404 `author not found`; tagId sai -> 404 `tag not found`.
- `GET /authors/:id/books` trả JSON có `id`, `name`, `books: [...]`.
- `GET /books?tag=<name>` chỉ trả book có tag trùng; không có tag đó -> mảng rỗng `[]` (KHÔNG 404).

### 3. Nice to have
- Thêm pagination (`?page`, `?size`) cho `GET /books`.
- Tách DTO + interface response riêng để không leak column nội bộ.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **TypeORM `Repository` + `QueryBuilder`** — pattern chính để CRUD và filter trong NestJS.

**Mapping API:**
- `findOneBy({ id })` -> single-row lookup theo PK.
- `findBy({ id: In(ids) })` -> multi-row lookup.
- `createQueryBuilder('alias').innerJoinAndSelect(...)` -> JOIN trả về cả relation.

**Khác biệt/gotcha:**
- `findOneBy` không load relation — phải dùng `findOne({ where, relations })` nếu cần.
- `In([])` rỗng sẽ generate `IN ()` SQL sai cú pháp ở Postgres — phải early-return nếu mảng rỗng.
##### example
```typescript
async create(dto: CreateBookDto) {
  const author = await this.authorRepo.findOneBy({ id: dto.authorId })
  if (!author) throw new NotFoundException("author not found")
  const tags = await this.tagRepo.findBy({ id: In(dto.tagIds) })
  if (tags.length !== dto.tagIds.length) throw new NotFoundException("tag not found")
  const book = this.bookRepo.create({ title: dto.title, author, tags })
  return this.bookRepo.save(book)
}

findByTag(name: string) {
  return this.bookRepo.createQueryBuilder("book")
    .innerJoinAndSelect("book.tags", "tag")
    .where("tag.name = :n", { n: name })
    .getMany()
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **EF Core 8** `DbContext` + LINQ.

**Mapping API:**
- `findOneBy` -> `ctx.Authors.FirstOrDefaultAsync(a => a.Id == id)`.
- `findBy({ id: In(ids) })` -> `ctx.Tags.Where(t => ids.Contains(t.Id)).ToListAsync()`.
- `createQueryBuilder().innerJoinAndSelect` -> `ctx.Books.Include(b => b.Tags).Where(b => b.Tags.Any(t => t.Name == name))`.

**Khác biệt/gotcha:**
- LINQ `Contains` translate thành `IN (...)` ở Postgres — rỗng list cũng thành `IN (NULL)` an toàn.
- `Include` luôn eager, không có lazy default — opposite của TypeORM.
##### example
```csharp
public async Task<Book> CreateAsync(CreateBookDto dto) {
    var author = await _ctx.Authors.FirstOrDefaultAsync(a => a.Id == dto.AuthorId)
        ?? throw new NotFoundException("author not found");
    var tags = await _ctx.Tags.Where(t => dto.TagIds.Contains(t.Id)).ToListAsync();
    if (tags.Count != dto.TagIds.Count) throw new NotFoundException("tag not found");
    var book = new Book { Title = dto.Title, Author = author, Tags = tags };
    _ctx.Books.Add(book);
    await _ctx.SaveChangesAsync();
    return book;
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **GORM** với preload + manual association.

**Mapping API:**
- `findOneBy` -> `db.First(&author, "id = ?", id)`.
- `findBy In` -> `db.Where("id IN ?", ids).Find(&tags)`.
- `innerJoinAndSelect` -> `db.Joins("INNER JOIN book_tags ON ...").Preload("Tags")`.

**Khác biệt/gotcha:**
- GORM trả `gorm.ErrRecordNotFound` thay vì nil — phải `errors.Is(err, gorm.ErrRecordNotFound)`.
- `db.Model(&book).Association("Tags").Replace(tags)` mới đúng cách set N:N.
##### example
```go
func (s *BookService) Create(dto CreateBookDto) (*Book, error) {
    var author Author
    if err := s.db.First(&author, "id = ?", dto.AuthorID).Error; err != nil {
        return nil, errors.New("author not found")
    }
    var tags []Tag
    s.db.Where("id IN ?", dto.TagIDs).Find(&tags)
    if len(tags) != len(dto.TagIDs) { return nil, errors.New("tag not found") }
    book := &Book{Title: dto.Title, AuthorID: author.ID, Tags: tags}
    return book, s.db.Create(book).Error
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **Spring Data JPA** với derived query + `@Query` JPQL.

**Mapping API:**
- `findOneBy` -> `authorRepo.findById(id)` (Optional).
- `findBy In` -> `tagRepo.findAllById(ids)`.
- `innerJoinAndSelect` -> `@Query("SELECT b FROM Book b JOIN b.tags t WHERE t.name = :name")`.

**Khác biệt/gotcha:**
- `findAllById` trả List có thể ít hơn input — check size để detect missing.
- `@Transactional` boundary quyết định khi flush, đặt ở service method để rollback đúng.
##### example
```java
@Transactional
public Book create(CreateBookDto dto) {
    Author author = authorRepo.findById(dto.getAuthorId())
        .orElseThrow(() -> new NotFoundException("author not found"));
    List<Tag> tags = tagRepo.findAllById(dto.getTagIds());
    if (tags.size() != dto.getTagIds().size()) throw new NotFoundException("tag not found");
    Book book = new Book(dto.getTitle(), author, tags);
    return bookRepo.save(book);
}
```
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Migration 2 - thêm cột Book.publishedYear và áp dụng lên DB đã có data
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Seed ít nhất 2 author + 3 book + 2 tag bằng curl để giả lập DB prod đã có data.
- **Bước 2:** Mở `book.entity.ts` thêm `@Column({ name: 'published_year', type: 'int', nullable: true }) publishedYear: number | null`.
- **Bước 3:** Sinh migration diff: `npm run migration:generate -- src/migrations/AddBookPublishedYear`.
- **Bước 4:** Verify migration mới: `up()` có `ADD COLUMN "published_year"` (nullable) và `down()` có `DROP COLUMN`. Sửa thủ công nếu TypeORM gen thiếu nullable.
- **Bước 5:** Chạy `npm run migration:run` — verify log success + `SELECT COUNT(*) FROM books` không đổi.
- **Bước 6:** Test revert: `npm run migration:revert` → `\d books` không còn `published_year` → `migration:run` lại.
- **Bước 7:** Update DTO `CreateBookDto`/`UpdateBookDto` để optional nhận `publishedYear`; verify `POST /books` lưu đúng.

### 2. Yêu cầu tối thiểu cần đạt
- `src/migrations/` có đúng 2 file migration với timestamp tăng dần.
- Sau khi chạy migration 2, `\d books` show cột `published_year int NULL`; `SELECT COUNT(*) FROM books` giữ nguyên.
- `npm run migration:revert` drop đúng cột `published_year`, không động cột khác.
- `POST /books` body có `publishedYear: 2024` -> record mới có `publishedYear=2024`; không gửi -> lưu `NULL`.

### 3. Nice to have
- Viết migration idempotent bằng `hasColumn` check trước khi add/drop.
- Thêm CHECK constraint `published_year BETWEEN 1000 AND 2100` trong migration.
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Smoke test bằng curl và paste output thật vào README
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Chạy `docker compose up -d` + `npm run migration:run` + `nest start --watch`.
- **Bước 2:** Tạo author `POST /authors` với George Orwell + bio.
- **Bước 3:** Tạo 2 tag `dystopia` + `classic`, lưu lại id.
- **Bước 4:** Tạo book `1984` gắn 2 tag + `publishedYear: 1949`.
- **Bước 5:** Verify eager load: `GET /authors/<id>/books`.
- **Bước 6:** Verify QueryBuilder filter: `GET /books?tag=dystopia` + `GET /books?tag=khong-co`.
- **Bước 7:** Trong `README.md` section **Smoke Test**, paste 4 block JSON response thật + output text `psql \dt` + log `npm run migration:run` thành công.
- **Bước 8:** Vẽ ERD Mermaid: `AUTHORS ||--o{ BOOKS : writes` + `BOOKS }o--o{ TAGS : tagged_with`.

### 2. Yêu cầu tối thiểu cần đạt
- 4 kịch bản trên đều trả HTTP 201/200 hợp lệ; `GET /authors/:id/books` có `books: [...]` chứa book vừa tạo.
- `GET /books?tag=dystopia` trả mảng chứa book `1984`; `GET /books?tag=khong-co` trả `[]`.
- README có Mermaid ERD render được, có section **Smoke Test** paste 4 JSON response thật + `psql \dt` text + migration log.
- README đủ 6 section bắt buộc.

### 3. Nice to have
- Thêm endpoint `DELETE /authors/:id` để test cascade FK.
- Export curl script `docs/smoke-test.sh`.
- Thêm GIF demo chạy migration -> create -> query vào README.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
NestJS - Database TypeORM
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://docs.nestjs.com/techniques/database
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
TypeORM - Migrations
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/migrations
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
TypeORM - Many-to-many relations
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/many-to-many-relations
<!-- @starci/seperator -->

## 3
### alias
<!-- @starci/seperator -->
PostgreSQL - ALTER TABLE
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/sql-altertable.html
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
Repo public chứa source `library-typeorm-postgres` với `src/` + `src/migrations/` (đúng 2 file), `docker-compose.yml`, `.env.example`, và `README.md` 6 section (Challenge description, How to run, Architecture với Mermaid ERD, Smoke Test paste output JSON + `psql \dt` text + log migration thật, Code Execution Trace ≥3 điểm chạm `file:line -> method()`, Design Decisions).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
easy
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
