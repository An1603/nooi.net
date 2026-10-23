-- Duyệt nội dung eKid: mỗi CÂU được duyệt riêng, mỗi BÀI có trạng thái tổng hợp.
-- Lý do tách khỏi `active`: `active` là "có hiện cho bé hay không", còn `review_status`
-- là "người duyệt đã đọc và đồng ý nội dung hay chưa". Một câu có thể đang tắt nhưng
-- vẫn đã duyệt, và ngược lại.

alter table public.ekid_items
  add column if not exists review_status text not null default 'cho_duyet',
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

alter table public.ekid_lessons
  add column if not exists review_status text not null default 'cho_duyet',
  add column if not exists review_notes text;

-- Giá trị hợp lệ: cho_duyet | dat | can_sua
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ekid_items_review_status_chk'
  ) then
    alter table public.ekid_items
      add constraint ekid_items_review_status_chk
      check (review_status in ('cho_duyet', 'dat', 'can_sua'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'ekid_lessons_review_status_chk'
  ) then
    alter table public.ekid_lessons
      add constraint ekid_lessons_review_status_chk
      check (review_status in ('cho_duyet', 'dat', 'can_sua'));
  end if;
end $$;

create index if not exists ekid_items_review_idx
  on public.ekid_items (lesson_id, review_status);

create index if not exists ekid_lessons_review_idx
  on public.ekid_lessons (subject, review_status);

comment on column public.ekid_items.review_status is
  'cho_duyet: chưa ai đọc | dat: người duyệt đã đồng ý | can_sua: cần sửa (xem review_note)';
