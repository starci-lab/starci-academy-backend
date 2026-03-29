-- Dev / local: drop course graph so TypeORM synchronize can recreate columns (e.g. id varchar(36) -> 255).
-- TypeORM synchronize often fails altering PK varchar length ("id contains null values") because it
-- uses a multi-step change; dropping these tables avoids that.
--
-- Usage (example):
--   psql "$DATABASE_URL" -f scripts/postgresql/drop-course-content-tables.sql
--
-- Then restart the API. Re-seed runs on boot unless manualSeed is true.
-- enrollments / submissions keep their tables; FKs to courses/modules are removed with CASCADE on DROP.

DROP TABLE IF EXISTS premium_advanced_content_sections CASCADE;
DROP TABLE IF EXISTS general_content_sections CASCADE;
DROP TABLE IF EXISTS outcomes CASCADE;
DROP TABLE IF EXISTS exclusive_lesson_videos CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS premium_advanced_contents CASCADE;
DROP TABLE IF EXISTS general_contents CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS prerequisites CASCADE;
DROP TABLE IF EXISTS qnas CASCADE;
DROP TABLE IF EXISTS premium_contents CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
