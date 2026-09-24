-- ============================================================
-- 个人主页 · 反馈墙（feedback wall）v1.43.0
-- 在原有「访客反馈表（feedback）」基础上新增：
--   1) feedback.listed 列：是否公开展示（默认 false，仅主人可见）
--   2) feedback_likes 表：点赞记录（feedback_id + 访客标识，防重复点赞）
--   3) feedback_comments 表：评论记录（关联已展示的反馈）
--   4) RLS 策略：
--      - 公开读：任何访客只能读到 listed = true 的行 / 行下评论
--      - 制作者下架：authenticated（Supabase Auth 登录，仅主人账号）
--        可把 listed 改为 false（软下架，数据保留在表里）
--
-- 用法：Supabase 控制台 → SQL Editor → New query → 粘贴整段 → Run
--       （脚本幂等，可重复执行）
--
-- 安全说明：
--   - anon 只能 SELECT listed=true 的行，未展示的反馈依旧只有主人能看到
--   - 点赞/评论的匿名身份由前端生成 user_key（RLS 无法验证真实性，
--     属于「诚实实现」，个人主页场景可接受；真要防刷需服务端校验）
--   - 下架走 Supabase Auth：需要在控制台 Authentication → Users
--     添加主人账号（邮箱+密码），登录后才能下架，密码不进入仓库
-- ============================================================


-- ---------- 1. feedback 表加列：是否公开展示 ----------
alter table public.feedback
  add column if not exists listed boolean not null default false;

comment on column public.feedback.listed
  is '是否公开展示到反馈墙：false=仅主人可见，true=公开（可被点赞/评论）';


-- ---------- 2. 点赞表 ----------
create table if not exists public.feedback_likes (
  id           bigint generated always as identity primary key,
  feedback_id  bigint not null references public.feedback(id) on delete cascade,
  user_key     text not null,          -- 访客匿名标识（前端 localStorage 生成）
  created_at   timestamptz not null default CURRENT_TIMESTAMP,  -- 点赞时间，数据库自动记录
  unique (feedback_id, user_key)        -- 同一访客对同一条只能点一个赞
);

comment on table public.feedback_likes
  is '反馈墙点赞记录：unique(feedback_id, user_key) 防重复点赞';

alter table public.feedback_likes enable row level security;


-- ---------- 3. 评论表 ----------
create table if not exists public.feedback_comments (
  id           bigint generated always as identity primary key,
  feedback_id  bigint not null references public.feedback(id) on delete cascade,
  name         text,                    -- 评论者昵称，可选
  message      text not null,
  created_at   timestamptz not null default CURRENT_TIMESTAMP  -- 评论时间，数据库自动记录
);

comment on table public.feedback_comments
  is '反馈墙评论：只允许评论已公开展示（listed=true）的反馈';

alter table public.feedback_comments enable row level security;

-- 评论长度上限（防刷）
alter table public.feedback_comments
  drop constraint if exists feedback_comments_length;
alter table public.feedback_comments
  add constraint feedback_comments_length check (
    length(coalesce(name, '')) <= 40  and
    btrim(message) <> ''              and
    length(message) <= 300
  );


-- ---------- 4. feedback 表 RLS 策略（幂等重建）----------
alter table public.feedback enable row level security;

-- 访客仍可提交反馈（保留原策略）
drop policy if exists "visitor can submit feedback" on public.feedback;
create policy "visitor can submit feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- 新增：访客（anon）只能读「已展示」的反馈（未展示的一行也读不到）
drop policy if exists "visitor can read listed feedback" on public.feedback;
create policy "visitor can read listed feedback"
  on public.feedback
  for select
  to anon
  using (listed = true);

-- 新增：主人（authenticated）可读全部反馈（含未展示的私密留言）。
-- 注意：PostgreSQL 要求 UPDATE 后的新行仍须满足该角色的 SELECT 策略，
--       若只给 authenticated `using (listed = true)`，软下架（true->false）
--       会被 RLS 拒绝（实测 42501 "new row violates row-level security policy"），
--       故主人必须用 `using (true)`。
drop policy if exists "owner can read all feedback" on public.feedback;
create policy "owner can read all feedback"
  on public.feedback
  for select
  to authenticated
  using (true);

-- 新增：制作者（authenticated，即主人登录态）软下架
-- 注意：列级策略（FOR UPDATE OF listed）需要 PostgreSQL 15+，部分 Supabase
--       项目数据库版本更早会报 "syntax error at or near \"of\""，
--       故改用普通 UPDATE 策略：RLS 层面 authenticated 可更新整行，
--       但应用层（feedback-wall.js）只发送 { listed: false } 一种更新，
--       authenticated 角色只有主人账号，风险可控。
drop policy if exists "owner can delist feedback" on public.feedback;
create policy "owner can delist feedback"
  on public.feedback
  for update
  to authenticated
  using (true)
  with check (true);


-- ---------- 5. 点赞表 RLS ----------
-- anon 可读所有点赞记录（用于算计数）、可点/可取消自己的赞
-- （user_key 前端自报，诚实实现；破坏性小，个人场景可接受）
drop policy if exists "visitor can read likes"      on public.feedback_likes;
drop policy if exists "visitor can like feedback"   on public.feedback_likes;
drop policy if exists "visitor can unlike feedback" on public.feedback_likes;

create policy "visitor can read likes"
  on public.feedback_likes
  for select
  to anon, authenticated
  using (true);

create policy "visitor can like feedback"
  on public.feedback_likes
  for insert
  to anon, authenticated
  with check (true);

create policy "visitor can unlike feedback"
  on public.feedback_likes
  for delete
  to anon, authenticated
  using (true);


-- ---------- 6. 评论表 RLS ----------
-- 只允许读取 / 评论「已展示」反馈下的评论
drop policy if exists "visitor can read comments"   on public.feedback_comments;
drop policy if exists "visitor can post comment"    on public.feedback_comments;

create policy "visitor can read comments"
  on public.feedback_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_id and f.listed
    )
  );

create policy "visitor can post comment"
  on public.feedback_comments
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_id and f.listed
    )
  );


-- ---------- 7. 授权（幂等；与 RLS 双重保险）----------
grant select                     on table public.feedback          to anon, authenticated;
grant insert                     on table public.feedback          to anon, authenticated;
grant update (listed)            on table public.feedback          to authenticated;
revoke delete                    on table public.feedback          from anon, authenticated;

grant select, insert, delete     on table public.feedback_likes    to anon, authenticated;

grant select, insert             on table public.feedback_comments to anon, authenticated;
revoke update, delete            on table public.feedback_comments from anon, authenticated;


-- ---------- 8. 自检 ----------
-- 期望：feedback 有 INSERT + SELECT + UPDATE 三条策略；
--       likes/comments 各有对应策略；rowsecurity 均为 true。
select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public'
   and tablename in ('feedback', 'feedback_likes', 'feedback_comments')
 order by tablename;

select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public'
   and tablename in ('feedback', 'feedback_likes', 'feedback_comments')
 order by tablename, policyname;
