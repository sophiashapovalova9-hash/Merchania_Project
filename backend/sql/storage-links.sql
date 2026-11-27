-- Ссылки на картинки из Storage. Сами файлы в таблицу не кладём.
-- Supabase → SQL Editor → New query → вставь ВЕСЬ файл → Run.
-- Таблицы не удаляет. Товары не трогает.

begin;

update storage.buckets
set public = true
where id = 'assets';

update productmedia m
set imageurl = 'https://iilaerefisikimzcvism.supabase.co/storage/v1/object/public/assets/products/' || m.productid::text || '.png',
    imagedata = null,
    mimetype = 'image/png',
    ismain = true
where m.productid between 1 and 9;

insert into productmedia (productid, imageurl, ismain, mimetype)
select p.productid,
       'https://iilaerefisikimzcvism.supabase.co/storage/v1/object/public/assets/products/' || p.productid::text || '.png',
       true,
       'image/png'
from product p
where p.productid between 1 and 9
  and not exists (
    select 1 from productmedia m where m.productid = p.productid
  );

commit;

select productid, imageurl, imagedata is null as файла_в_базе_нет
from productmedia
order by productid;
