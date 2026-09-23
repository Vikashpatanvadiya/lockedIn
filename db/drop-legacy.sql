-- Optional cleanup: the book/chapter/journal tables are no longer used.
-- This deletes their contents permanently. Run only if you don't want that data.
drop table if exists goals;
drop table if exists chapters;
drop table if exists days;
drop table if exists books;
alter table users drop column if exists letter;
alter table users drop column if exists bio;
alter table users drop column if exists avatar;
alter table users drop column if exists onboarded;
