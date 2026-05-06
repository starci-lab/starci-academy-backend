# title
CRUD Library với TypeORM + PostgreSQL (Author 1-n Book n-n Tag) và migration thật

# description
Đây là challenge thực hành code. Bạn sẽ xây API quản lý thư viện bằng NestJS, TypeORM và PostgreSQL với ba entity Author, Book, Tag và các quan hệ chính giữa chúng. Mục tiêu là làm quen flow CRUD cơ bản, migration theo từng bước và cách query dữ liệu theo điều kiện tag.

# requirements
## 0
### purpose
Dựng được project NestJS `library-typeorm-postgres` chạy với PostgreSQL thật qua Docker, thiết kế domain thư viện có quan hệ `Author 1-n Book` và `Book n-n Tag`.
### technicalConstraints
Phải có `docker-compose.yml` chạy Postgres 16, 3 entity `Author/Book/Tag` đúng quan hệ, và cấu hình TypeORM qua `ConfigService` + `src/database/data-source.ts` cho CLI migration; bắt buộc `synchronize: false`, `migrationsRun: false` ở mọi env.
### proTipsHints
- Tạo `docker compose up -d` trước, rồi mới chạy app để dễ tách lỗi kết nối DB.
- Luôn định nghĩa rõ tên bảng join `book_tags` để query/filter sau này dễ đọc.
- Giữ `publishedYear` để migration 2 xử lý, không thêm ngay từ migration init.

## 1
### purpose
Thực hành quy trình migration đúng chuẩn production: tạo schema ban đầu, rồi bổ sung field mới sau khi hệ thống đã có dữ liệu.
### technicalConstraints
Phải có đúng 2 migration trong `src/migrations/`: migration 1 tạo `authors/books/tags/book_tags` + FK + index `books.author_id`; migration 2 thêm cột `books.published_year int NULL`; cả 2 migration đều có `up()` và `down()` đầy đủ.
### proTipsHints
- Dùng script CLI chuẩn:
  - `typeorm`: `typeorm-ts-node-commonjs`
  - `migration:generate`: `npm run typeorm -- migration:generate -d src/database/data-source.ts`
  - `migration:run`: `npm run typeorm -- migration:run -d src/database/data-source.ts`
  - `migration:revert`: `npm run typeorm -- migration:revert -d src/database/data-source.ts`
- Sau mỗi lần run/revert nên verify bằng `psql` (`\dt`, `\d books`) để chắc schema đúng như mong muốn.

## 2
### purpose
Triển khai CRUD cốt lõi cho Author, Book, Tag và query theo tag để nắm cách làm việc với Repository + QueryBuilder trong TypeORM.
### technicalConstraints
Bắt buộc có endpoint: `POST /authors`, `POST /tags`, `POST /books` (validate `authorId` + `tagIds`, sai trả 404), `GET /authors/:id/books` (load `relations: ['books']`), `GET /books?tag=<tagName>` (dùng QueryBuilder + join tags, trả `Book[]` kèm `tags`).
### proTipsHints
- Check đủ số lượng `tagIds` tìm được để phát hiện ID sai sớm.
- Với endpoint filter tag, dùng `innerJoinAndSelect` để vừa lọc vừa trả tags trong cùng query.
- Tránh lazy relation chưa `await` vì có thể leak `Promise` ra response.

## 3
### purpose
Hoàn thiện deliverable theo chuẩn nộp bài, đảm bảo cấu hình và phạm vi commit an toàn.
### technicalConstraints
Chỉ commit `.env.example`, tuyệt đối không commit `.env` thật.
### proTipsHints
- Chụp output migration run thành công để tăng độ tin cậy khi review.
- Giữ cấu trúc commit sạch, tập trung vào code + docs cần thiết cho challenge.

### forbidden
- `synchronize: true` ở bất kỳ env / file nào -> **0 prompt migration**.
- Lazy relation (`Promise<Book[]>`) mà không `await` -> response trả `Promise` string -> **0 toàn challenge**.
- Commit file `.env` thật; chỉ commit `.env.example`.
- Khai báo sai optional/nullable cho entity so với đề bài (ví dụ `Author.name`, `Book.title`, `Tag.name` bị để optional/nullable) -> **0 prompt entity requirements**.

# prerequisites
## 0
### text
Đã xong challenge EASY `0-sql-nosql-landscape-survey-easy` (nắm khi nào chọn SQL).
## 1
### text
Biết cơ bản SQL (CREATE TABLE, JOIN, FK).
## 2
### text
Đã cài `docker` + `docker compose`.
## 3
### text
Biết `@nestjs/config`, `ConfigService`.

# steps

## 0
### title
Scaffold project và Postgres docker-compose
### body
**Các bước thực hiện**
- **Bước 1:** Tạo project + cài deps:
  ```bash
  nest new library-typeorm-postgres
  cd library-typeorm-postgres
  npm i @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer
  npm i -D @types/pg
  ```
- **Bước 2:** Tạo `docker-compose.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:16
      ports: ["5432:5432"]
      environment:
        POSTGRES_DB: library
        POSTGRES_USER: library
        POSTGRES_PASSWORD: library
      volumes: ["pgdata:/var/lib/postgresql/data"]
  volumes:
    pgdata:
  ```
  Chạy:
  ```bash
  docker compose up -d
  ```
- **Bước 3:** Tạo `.env` + `.env.example` với `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=library`, `DB_PASSWORD=library`, `DB_NAME=library`. Thêm `.env` vào `.gitignore`.
- **Bước 4:** Sinh module khung:
  ```bash
  nest g module database
  nest g module author
  nest g module book
  nest g module tag
  ```

**Yêu cầu tối thiểu cần đạt**
- `docker compose up -d` khởi động Postgres thành công; `docker ps` thấy container `postgres:16`.
- `psql -h localhost -U library -d library` login được bằng password từ `.env`.
- `.env.example` commit được, `.env` thật nằm trong `.gitignore`.
- `nest start --watch` không bị lỗi missing module.

**Nice to have**
- Thêm `pgadmin` hoặc `adminer` service trong `docker-compose.yml` để browse DB bằng UI.
- Script `npm run db:up` alias cho `docker compose up -d`.

## 1
### title
Định nghĩa 3 entity với đúng quan hệ 1-n và n-n
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `src/author/entities/author.entity.ts`:
  ```ts
  @Entity('authors')
  export class Author {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() name: string;
    @Column({ type: 'text', nullable: true }) bio: string | null;
    @OneToMany(() => Book, (b) => b.author) books: Book[];
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  ```
- **Bước 2:** Tạo `src/book/entities/book.entity.ts`:
  ```ts
  @Entity('books')
  export class Book {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() title: string;
    @ManyToOne(() => Author, (a) => a.books, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' }) author: Author;
    @Column({ name: 'author_id' }) authorId: string;
    @ManyToMany(() => Tag, (t) => t.books, { cascade: true })
    @JoinTable({ name: 'book_tags' })
    tags: Tag[];
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  ```
  (Cột `publishedYear` sẽ thêm ở migration 2 - **CHƯA** khai báo ngay.)
- **Bước 3:** Tạo `src/tag/entities/tag.entity.ts`:
  ```ts
  @Entity('tags')
  export class Tag {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ unique: true }) name: string;
    @ManyToMany(() => Book, (b) => b.tags) books: Book[];
  }
  ```
- **Bước 4:** Tạo `src/database/data-source.ts`:
  ```ts
  import { DataSource } from 'typeorm';
  import { config } from 'dotenv';
  config();
  export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: ['error', 'warn', 'migration'],
  });
  ```
- **Bước 5:** Trong `AppModule` import `TypeOrmModule.forRootAsync({ useFactory, inject: [ConfigService] })` trả về config với `autoLoadEntities: true`, `synchronize: false`, `migrationsRun: false`.

**Yêu cầu tối thiểu cần đạt**
- 3 file entity tồn tại với đúng decorator và quan hệ như mô tả.
- `Book.publishedYear` **CHƯA** xuất hiện trong code ở bước này (giữ cho migration 2).
- `src/database/data-source.ts` export default 1 `DataSource` có `synchronize: false`, `migrations` trỏ đúng path.
- Grep toàn repo: **KHÔNG** có `synchronize: true` ở bất cứ đâu.

**Nice to have**
- Thêm `@Index(['name'])` trên `Author.name` để sẵn sàng search sau này.
- Tách interface `IRepository<T>` chung nếu muốn luyện thêm abstraction.

## 2
### title
Viết và chạy migration 1 (init schema) bằng CLI
### body
**Các bước thực hiện**
- **Bước 1:** Thêm scripts vào `package.json`:
  ```json
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/database/data-source.ts",
    "migration:run":      "npm run typeorm -- migration:run -d src/database/data-source.ts",
    "migration:revert":   "npm run typeorm -- migration:revert -d src/database/data-source.ts"
  }
  ```
- **Bước 2:** Sinh migration init từ entity:
  ```bash
  npm run migration:generate -- src/migrations/InitSchema
  ```
  Mở file `src/migrations/<timestamp>-InitSchema.ts`, verify có 4 `CREATE TABLE` (`authors`, `books`, `tags`, `book_tags`) + FK + unique index `tags.name`.
- **Bước 3:** Chạy migration:
  ```bash
  npm run migration:run
  ```
- **Bước 4:** Verify bằng psql:
  ```bash
  docker exec -it <container> psql -U library -d library -c "\dt"
  ```
  Phải thấy 4 bảng + bảng `migrations` của TypeORM.
- **Bước 5:** Test revert:
  ```bash
  npm run migration:revert
  ```
  Kiểm tra `\dt` chỉ còn bảng `migrations`; sau đó `migration:run` lại để khôi phục.

**Yêu cầu tối thiểu cần đạt**
- Chạy `npm run migration:run` thành công trên DB trống, log in `Migration "InitSchema<timestamp>" has been executed successfully`.
- `psql \dt` in ra **đúng 5 bảng**: `authors`, `books`, `tags`, `book_tags`, `migrations`.
- FK `books.author_id -> authors.id` tồn tại (verify bằng `\d books`).
- `npm run migration:revert` drop hết 4 bảng nghiệp vụ; chạy lại `migration:run` thì khôi phục đủ.

**Nice to have**
- Thêm index `idx_books_author_id` explicit trong migration 1 (thay vì để TypeORM tự sinh).
- Viết 1 script `db:seed` để seed 2 author + 5 book + 3 tag mẫu cho smoke test.

## 3
### title
Viết CRUD + QueryBuilder filter theo tag
### body
**Các bước thực hiện**
- **Bước 1:** Trong mỗi module (`author`, `book`, `tag`) import `TypeOrmModule.forFeature([<Entity>])` và inject `@InjectRepository(<Entity>)` trong service.
- **Bước 2:** `AuthorService`: `create(dto)`, `findById(id, { relations: ['books'] })`.
- **Bước 3:** `TagService`: `create(dto)` throw `ConflictException` nếu duplicate name.
- **Bước 4:** `BookService.create(dto)`:
  ```ts
  async create(dto: CreateBookDto) {
    const author = await this.authorRepo.findOneBy({ id: dto.authorId });
    if (!author) throw new NotFoundException('author not found');
    const tags = await this.tagRepo.findBy({ id: In(dto.tagIds) });
    if (tags.length !== dto.tagIds.length) throw new NotFoundException('tag not found');
    const book = this.bookRepo.create({ title: dto.title, author, tags });
    return this.bookRepo.save(book);
  }
  ```
- **Bước 5:** `BookService.findByTag(tagName)` dùng `QueryBuilder`:
  ```ts
  return this.bookRepo.createQueryBuilder('book')
    .innerJoinAndSelect('book.tags', 'tag')
    .where('tag.name = :n', { n: tagName })
    .getMany();
  ```
- **Bước 6:** Controller tương ứng, map DTO + validation pipe global `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` ở `main.ts`.
- **Bước 7:** Endpoint `AuthorController.getBooks(@Param('id') id)` gọi `authorRepo.findOne({ where: { id }, relations: ['books'] })`; nếu null -> `NotFoundException`.

**Yêu cầu tối thiểu cần đạt**
- `POST /authors`, `POST /tags`, `POST /books` đều trả 201 với JSON hợp lệ; validate fail -> 400 với message của `class-validator`.
- `POST /books` với `authorId` không tồn tại -> 404 `author not found`; 1 `tagId` sai -> 404 `tag not found`.
- `GET /authors/:id/books` trả JSON có `id`, `name`, `books: [...]` (mảng, có thể rỗng nếu chưa book).
- `GET /books?tag=<name>` chỉ trả các book có tag trùng; không có tag đó -> mảng rỗng `[]` (KHÔNG 404).
- Không có `Promise` string trong response (no lazy relation leak).

**Nice to have**
- Thêm pagination (`?page`, `?size`) cho `GET /books`.
- Thêm `GET /books` mặc định trả 20 item mới nhất order theo `createdAt desc`.
- Tách DTO + interface response riêng để không leak column nội bộ.

## 4
### title
Migration 2 - thêm cột Book.publishedYear và áp dụng lên DB đã có data
### body
**Các bước thực hiện**
- **Bước 1:** Seed ít nhất 2 author + 3 book + 2 tag bằng curl để "giả lập" DB prod đã có data.
 - **Bước 1:** Seed ít nhất 2 author + 3 book + 2 tag bằng curl để "giả lập" DB prod đã có data.
- **Bước 2:** Mở `book.entity.ts` thêm:
  ```ts
  @Column({ name: 'published_year', type: 'int', nullable: true })
  publishedYear: number | null;
  ```
- **Bước 3:** Sinh migration diff:
  ```bash
  npm run migration:generate -- src/migrations/AddBookPublishedYear
  ```
- **Bước 4:** Mở migration mới, verify `up()` có `ADD COLUMN "published_year"` (nullable) và `down()` có `DROP COLUMN "published_year"`. Nếu TypeORM gen nhầm (thêm NOT NULL không default trên bảng có data sẽ fail) -> sửa thủ công thành `nullable: true`.
- **Bước 5:** Chạy:
  ```bash
  npm run migration:run
  ```
  Verify log success + data cũ vẫn còn (`SELECT COUNT(*) FROM books` không đổi).
- **Bước 6:** Test revert:
  ```bash
  npm run migration:revert
  ```
  Verify cột bị xóa (`\d books` không còn `published_year`); rồi `migration:run` lại.
- **Bước 7:** Cập nhật DTO `CreateBookDto` + `UpdateBookDto` để optional nhận `publishedYear`; verify `POST /books` với `{title, authorId, tagIds, publishedYear: 2024}` lưu đúng giá trị.

**Yêu cầu tối thiểu cần đạt**
- `src/migrations/` có **đúng 2 file migration** (InitSchema + AddBookPublishedYear) với timestamp tăng dần.
- Sau khi chạy migration 2, `\d books` show cột `published_year int NULL`; `SELECT COUNT(*) FROM books` giữ nguyên số row trước đó (không mất data).
- `npm run migration:revert` drop đúng cột `published_year`, không động vào cột khác.
- `POST /books` với body có `publishedYear: 2024` -> record mới có `publishedYear=2024`; không gửi -> lưu `NULL`.

**Nice to have**
- Viết migration idempotent bằng `hasColumn` check trước khi add/drop.
- Thêm CHECK constraint `published_year BETWEEN 1000 AND 2100` trong migration.

## 5
### title
Smoke test 3 kịch bản bằng curl và paste output vào README
### body
**Các bước thực hiện**
- **Bước 1:** Chạy `docker compose up -d` + `npm run migration:run` + `nest start --watch`.
- **Bước 2:** Tạo author:
  ```bash
  curl -X POST http://localhost:3000/authors \
    -H "Content-Type: application/json" \
    -d '{"name":"George Orwell","bio":"English novelist"}'
  ```
- **Bước 3:** Tạo 2 tag (`POST /tags` với `{"name":"dystopia"}` và `{"name":"classic"}`) rồi lưu lại id.
- **Bước 4:** Tạo book gắn 2 tag và có `publishedYear`:
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"1984","authorId":"<authorId>","tagIds":["<tagId1>","<tagId2>"],"publishedYear":1949}'
  ```
- **Bước 5:** Verify eager load:
  ```bash
  curl http://localhost:3000/authors/<authorId>/books
  ```
- **Bước 6:** Verify QueryBuilder filter:
  ```bash
  curl "http://localhost:3000/books?tag=dystopia"
  ```
- **Bước 7:** Trong `README.md` mục **Smoke Test**, paste 4 block JSON response thật (create author, create book, get author with books, filter by tag) + paste nguyên văn output text của `psql \dt` (show 5 bảng) + paste log text `npm run migration:run` thành công.
- **Bước 8:** Vẽ ERD trong README dạng Mermaid:
  ```
  erDiagram
    AUTHORS ||--o{ BOOKS : writes
    BOOKS }o--o{ TAGS : tagged_with
  ```

**Yêu cầu tối thiểu cần đạt**
- 4 kịch bản trên đều trả HTTP 201/200 hợp lệ; response `GET /authors/:id/books` có field `books: [...]` chứa book vừa tạo.
- `GET /books?tag=dystopia` trả mảng chứa book `"1984"`; `GET /books?tag=khong-co-tag-nay` trả `[]` (không 404, không 500).
- README có Mermaid ERD render được, có mục **Smoke Test** paste 4 JSON response thật + output text `psql \dt` + output text migration log.
- Khi xóa `author` (`DELETE /authors/:id` nếu có) thì `book` của author đó cascade xóa (verify bằng `SELECT COUNT` trước/sau), do FK `onDelete: 'CASCADE'`.

**Nice to have**
- Thêm endpoint `DELETE /authors/:id` để test cascade.
- Export curl script `docs/smoke-test.sh`.
- Thêm GIF demo chạy migration -> create -> query vào README.

# outputs
## 0
### text
Triển khai được API CRUD thư viện bằng NestJS và TypeORM với quan hệ dữ liệu đúng giữa Author, Book, Tag.
## 1
### text
Vận hành được quy trình migration 2 bước (khởi tạo schema và mở rộng schema) theo chuẩn an toàn.
## 2
### text
Thực hiện được truy vấn theo tag bằng QueryBuilder và kiểm soát đúng các tình huống validate/lỗi phổ biến.
## 3
### text
Giữ được cấu hình môi trường an toàn trong quá trình làm bài (không dùng `synchronize: true`, không commit `.env` thật).

# references
## 0
### alias
NestJS - Database TypeORM
### url
https://docs.nestjs.com/techniques/database
## 1
### alias
TypeORM - Migrations
### url
https://typeorm.io/migrations
## 2
### alias
TypeORM - Many-to-many relations
### url
https://typeorm.io/many-to-many-relations
## 3
### alias
PostgreSQL - ALTER TABLE
### url
https://www.postgresql.org/docs/16/sql-altertable.html

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repo chứa source code + `docker-compose.yml` Postgres + 2 file migration + README có ERD Mermaid và mục **Smoke Test** paste 4 JSON response thật + output text `psql \dt` + output text migration log. Commit `.env.example`, KHÔNG commit `.env` thật.
### score
20
### prompts
#### 0
##### title
docker-compose Postgres + 3 entity với đúng quan hệ 1-n và n-n
##### score
5
##### promptText
Chấm theo Rubric (tối đa 5 điểm):

- Tiêu chí 1 (2 điểm): `docker-compose.yml` chạy Postgres 16 và `docker compose up -d` khởi động thành công.
- Tiêu chí 2 (2 điểm): 3 entity `Author`, `Book`, `Tag` đúng quan hệ/decorator (`Author @OneToMany Book`, `Book @ManyToOne Author onDelete CASCADE`, `Book @ManyToMany Tag` với `@JoinTable({ name: 'book_tags' })`, `Tag.name` UNIQUE).
- Tiêu chí 3 (1 điểm): `AppModule` dùng `TypeOrmModule.forRootAsync` đọc config từ `ConfigService`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
2 migration chạy được up/down, schema đúng, synchronize luôn false
##### score
6
##### promptText
Chấm theo Rubric (tối đa 6 điểm):

- Tiêu chí 1 (2 điểm): `src/migrations/` có đúng 2 file (InitSchema + AddBookPublishedYear) với timestamp tăng dần.
- Tiêu chí 2 (2 điểm): `npm run migration:run` trên DB trống tạo đủ bảng `authors`, `books`, `tags`, `book_tags` và FK `books.author_id`.
- Tiêu chí 3 (1 điểm): Migration 2 `ADD COLUMN published_year int NULL` không làm mất dữ liệu cũ; `npm run migration:revert` drop đúng cột.
- Tiêu chí 4 (1 điểm): Toàn repo không có `synchronize: true`; config giữ `synchronize: false` và `migrationsRun: false`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
CRUD Repository + QueryBuilder filter theo tag hoạt động đúng
##### score
5
##### promptText
Chấm theo Rubric (tối đa 5 điểm):

- Tiêu chí 1 (2 điểm): `POST /authors`, `POST /tags`, `POST /books` trả 201 đúng JSON; validate `authorId`/`tagIds` sai trả 404 đúng lỗi.
- Tiêu chí 2 (2 điểm): `GET /authors/:id/books` eager load trả `books: [...]` chứa dữ liệu book thật.
- Tiêu chí 3 (1 điểm): `GET /books?tag=<name>` dùng `QueryBuilder` filter đúng; tag không tồn tại trả `[]`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 3
##### title
Tuân thủ forbidden rules và quy tắc commit an toàn
##### score
4
##### promptText
Chấm theo Rubric (tối đa 4 điểm):

- Tiêu chí 1 (1 điểm): Không có `synchronize: true` ở bất kỳ env/file nào.
- Tiêu chí 2 (1 điểm): Không leak lazy relation `Promise<Book[]>` ra response.
- Tiêu chí 3 (1 điểm): Không commit `.env` thật; chỉ commit `.env.example`.
- Tiêu chí 4 (1 điểm): Không khai báo optional/nullable sai với field bắt buộc của entity theo đề bài.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
