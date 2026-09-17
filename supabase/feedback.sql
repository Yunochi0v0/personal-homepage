-- ============================================================
-- 个人主页 · 访客反馈表（feedback）
-- 个人主页 V3 ·「步骤 2 建表」+「步骤 3 配置权限」
--
-- 用法：Supabase 控制台 → 左侧 SQL Editor → New query
--       把本文件整段粘贴进去 → Run
--
-- 安全说明：本脚本不含任何密钥，可安全提交到公开仓库。
--          密钥（publishable / secret）都在 Supabase 控制台里获取，
--          不要写进任何文件。
-- ============================================================


-- ---------- 1. 建表 ----------
-- 目标：把每条访客反馈变成表里的一行（课件 p12 的「行 / 列 / 主键」）
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,  -- 唯一编号，自动生成
  name        text,                                            -- 昵称，可选
  relation    text,                                            -- 与主页主人的关系
  device      text,                                            -- 本条反馈针对的设备
  message     text not null,                                   -- 反馈内容，必填
  version     text,                                            -- 网站版本，提交时自动附带
  created_at  timestamptz not null default now()                -- 提交时间，数据库自动记录
);

comment on table  public.feedback           is '访客反馈：访客只能新增，只有主页主人能在控制台查看';
comment on column public.feedback.name      is '昵称，可选填，不要求真实姓名';
comment on column public.feedback.relation  is '与主页主人的关系：同学 / 老师 / 家人 / 朋友 / 同事 / 其他 / 不便透露';
comment on column public.feedback.device    is '本条反馈针对的设备：电脑 / 手机 / 平板 / 其他';
comment on column public.feedback.message   is '反馈内容，必填';
comment on column public.feedback.version   is '提交时的网站版本，由前端自动附带，不要求访客填写';
comment on column public.feedback.created_at is '提交时间，默认取数据库当前时间';


-- ---------- 2. 字段容量上限 ----------
-- 既是数据质量约束，也是最低限度的防滥用（防止超长内容刷库）。
-- 如果以后想放宽，改这里的数字即可。
alter table public.feedback
  drop constraint if exists feedback_lengths;

alter table public.feedback
  add constraint feedback_lengths check (
    length(coalesce(name, ''))     <= 40                       and
    length(coalesce(relation, '')) <= 20                       and
    length(coalesce(device, ''))   <= 20                       and
    length(coalesce(version, ''))  <= 20                       and
    btrim(message) <> ''                                       and
    length(message)                <= 1000
  );


-- ---------- 3. 便于按时间浏览的索引 ----------
create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);


-- ---------- 4. 开启行级安全（RLS）----------
-- 开启后默认「全部拒绝」，必须显式写出策略（课件 p19）。
-- 红线：不要为了消除报错而关闭 RLS 或放开全部权限。
alter table public.feedback enable row level security;


-- ---------- 5. 策略：访客只能「新增」，不能读 / 改 / 删 ----------
-- 课件 p14 的权限目标：anon（公开访客）只允许 Create。
-- 关键：这里「故意不写 SELECT 策略」——没有 SELECT 策略 = 访客读不到任何一行，
--       所以任何访客都无法把别人的反馈拉走。
--       你自己查看反馈用的是 Supabase 控制台的 Table Editor（以主人身份登录，
--       不受 RLS 限制），因此完全不需要给 anon 开 SELECT。
--       ★ 千万不要为了「看起来方便」给 anon 加 SELECT 策略 —— 那等于把全部反馈公开。
drop policy if exists "visitor can submit feedback" on public.feedback;

create policy "visitor can submit feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);


-- ---------- 6. 授权 ----------
-- 显式授予「插入」权限；并明确收回读 / 改 / 删（与上面的 RLS 形成双重保险）。
grant  insert on table public.feedback to anon, authenticated;
revoke select, update, delete on table public.feedback from anon, authenticated;


-- ---------- 7. 自检：确认表与策略都已就位 ----------
-- 期望：rowsecurity = true，且只有 1 条 INSERT 策略，没有任何 SELECT 策略。
select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public' and tablename = 'feedback';

select policyname, cmd, roles
  from pg_policies
 where schemaname = 'public' and tablename = 'feedback';


-- ---------- 待办（本课不要求，长期公开使用再做，见课件 p29）----------
-- 1. 防刷：限流 / 验证码 / 服务端函数校验（现在只做了长度上限）。
-- 2. 内容审核：把反馈里的 HTML 当纯文本渲染，避免有人留言里塞脚本。
-- 3. 提交时前端可显式带上 id / created_at 之外的字段；当前策略 with check (true)
--    意味着访客理论上能自己伪造 name / version，这在本课场景下可以接受。
