/**
 * Verifies the "Missing custom metadata" fix end to end on a throw-away
 * in-memory Postgres (PGlite). It executes the project's REAL migration SQL —
 * the seed INSERTs from 0004/0007, all of 0018 and the new 0019 — and checks:
 *
 *   • the dashboard metric (computeSeoCoverage in lib/seo.ts) equals an
 *     independent SQL count, before and after the backfill;
 *   • the backfill fills only blank fields, deletes nothing, never overwrites
 *     existing SEO text and leaves updated_at untouched;
 *   • values generated in SQL equal the TypeScript generators (so the CRM save
 *     actions and the migration agree);
 *   • the migration is idempotent and restores the updated_at triggers.
 *
 * It needs no Supabase credentials and never touches a real database.
 *
 * This folder is excluded from tsconfig.json so the app build never compiles it
 * (it needs dev-only packages that are deliberately not in package.json).
 *
 * Run (dev-only deps, not added to package.json):
 *   npm i --no-save @electric-sql/pglite tsx
 *   npx tsx scripts/verify-seo-backfill.ts
 */
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  computeSeoCoverage,
  generateSeoDescription,
  generateSeoTitle,
  missingSeoFields,
  resolveSeoFields,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_RECOMMENDED,
  type SeoCoverageRow
} from '../lib/seo'

const MIGRATIONS = join(__dirname, '..', 'supabase', 'migrations')
const read = (f: string) => readFileSync(join(MIGRATIONS, f), 'utf8')

let failures = 0
function check(ok: boolean, label: string, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
}

/** Pull one full INSERT statement (through its "on conflict … do nothing;") out of a migration. */
function extractInsert(sql: string, startMarker: string): string {
  const start = sql.indexOf(startMarker)
  if (start < 0) throw new Error(`marker not found: ${startMarker}`)
  const endMarker = 'on conflict (slug) do nothing;'
  const end = sql.indexOf(endMarker, start)
  if (end < 0) throw new Error('end marker not found')
  return sql.slice(start, end + endMarker.length)
}

async function main() {
  const db = new PGlite()

  // ---- Minimal schema: same columns/constraint names the migrations rely on ----
  await db.exec(`
    create function set_updated_at() returns trigger as $$
    begin new.updated_at = now(); return new; end; $$ language plpgsql;
    create function is_active_staff() returns boolean as $$ select true $$ language sql;

    create table courses (
      id uuid primary key default gen_random_uuid(),
      title text not null, slug text not null unique, category text, duration text, level text,
      mode text, summary text, description text, highlights text[], tools text[], outcomes text[],
      status text not null default 'published', display_order int default 0,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    );
    create trigger trg_courses_updated_at before update on courses
      for each row execute function set_updated_at();

    create table insights (
      id uuid primary key default gen_random_uuid(),
      title text not null, slug text not null unique, short_description text,
      content text not null default '', category text, content_type text not null default 'news',
      status text not null default 'draft', publish_at timestamptz, is_featured boolean not null default false,
      seo_title text, seo_description text,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    );
    create trigger trg_insights_updated_at before update on insights
      for each row execute function set_updated_at();
  `)

  // ---- Real seed data + real 0018 ----
  await db.exec(extractInsert(read('0007_courses.sql'), 'insert into courses (title, slug'))
  await db.exec(extractInsert(read('0004_insights.sql'), 'insert into insights (title, slug'))
  await db.exec(read('0018_seo_fields.sql'))

  const fetchRows = async (): Promise<(SeoCoverageRow & { status: string })[]> => {
    const c = await db.query<any>(`select title, slug, status, seo_title, seo_description from courses`)
    const i = await db.query<any>(`select title, slug, status, seo_title, seo_description from insights`)
    return [
      ...c.rows.map((r) => ({ ...r, kind: 'course' as const })),
      ...i.rows.map((r) => ({ ...r, kind: 'insight' as const }))
    ]
  }
  // What getSeoMetrics() does: only published rows go into the coverage calculation.
  const dashboardMissing = async () => {
    const rows = (await fetchRows()).filter((r) => r.status === 'published')
    return computeSeoCoverage(rows)
  }
  // Independent SQL count, written separately from the TS rule.
  const sqlMissing = async () => {
    const r = await db.query<{ n: number }>(`
      select (
        (select count(*) from courses  where status='published' and (coalesce(seo_title,'') ~ '^\\s*$' or coalesce(seo_description,'') ~ '^\\s*$'))
      + (select count(*) from insights where status='published' and (coalesce(seo_title,'') ~ '^\\s*$' or coalesce(seo_description,'') ~ '^\\s*$'))
      )::int as n`)
    return r.rows[0].n
  }

  // ===== Scenario 1: seeds + 0018 exactly as shipped =====
  console.log('\n== Scenario 1: repository seeds + migration 0018 (no extra data) ==')
  const s1 = await dashboardMissing()
  const s1slugs = s1.records.map((r) => r.path).sort()
  check(s1.missing === (await sqlMissing()), 'dashboard logic == independent SQL count', `${s1.missing}`)
  check(s1.missing === 6 && s1.records.every((r) => r.kind === 'insight'), 'seeds alone leave exactly 6 incomplete records, all insights', s1slugs.join(', '))
  check(!s1.records.some((r) => r.kind === 'course'), 'all 12 seeded courses are complete after 0018')

  // ===== Scenario 2: realistic live data =====
  // The 7th record is not knowable from the repository, so model the plausible sources:
  //   A) a published insight created through the old form with blank SEO  (the most likely 7th)
  //   B) a published course with only ONE field set (0018 skipped it)
  //   C) a draft course/insight with blank SEO (must be backfilled too, never counted while a draft)
  //   D) a whitespace-only field
  //   E) an untouched hand-written value that must survive the backfill
  console.log('\n== Scenario 2: seeds + 0018 + representative live records ==')
  await db.exec(`
    insert into insights (title, slug, short_description, content, category, content_type, status, publish_at)
    values
      ('Open Day at APTECH Abeokuta: Meet the Instructors and Tour the Labs This Saturday Morning',
       'open-day-meet-instructors', 'Join us for an open day to meet instructors, tour the labs and ask about admissions, programmes, fees and start dates for the next intake.',
       '<p>Body text</p>', 'APTECH Abeokuta', 'event', 'published', now()),
      ('No Summary Post', 'no-summary-post', null,
       '<h2>Heading</h2><p>First <strong>paragraph</strong> &amp; more text for the description.</p><script>alert(1)</script>',
       'APTECH Abeokuta', 'news', 'published', now()),
      ('Draft Insight With No SEO', 'draft-insight-no-seo', 'A draft summary.', '<p>x</p>', 'APTECH Abeokuta', 'news', 'draft', null),
      ('Whitespace SEO Insight', 'whitespace-seo-insight', 'Short summary here.', '<p>x</p>', 'APTECH Abeokuta', 'news', 'published', now());
    update insights set seo_title = '   ', seo_description = E'\\n\\t ' where slug = 'whitespace-seo-insight';

    insert into courses (title, slug, category, duration, level, mode, summary, description, highlights, tools, outcomes, status)
    values
      ('Half Filled Course', 'half-filled-course', 'short_term', '1 Month', 'Beginner', 'Instructor-led',
       'A one-month course whose description was never written by the editor.', 'd', '{}', '{}', '{}', 'published'),
      ('Draft Course No SEO', 'draft-course-no-seo', 'short_term', '1 Month', 'Beginner', 'Instructor-led',
       'Draft course summary.', 'd', '{}', '{}', '{}', 'draft'),
      ('Introduction to Cloud Infrastructure and Modern DevOps Engineering Practices', 'cloud-devops-long-title', 'short_term', '3 Months', 'Intermediate', 'Instructor-led',
       'A long summary. ' || repeat('It covers servers, containers, pipelines and monitoring in depth. ', 6), 'd', '{}', '{}', '{}', 'published');
    update courses set seo_title = 'Hand Written Title | APTECH Abeokuta', seo_description = null where slug = 'half-filled-course';
    update insights set seo_title = 'Custom Hand-Written Insight Title', seo_description = 'Custom hand-written description that must never be overwritten.'
      where slug = 'open-day-meet-instructors';
  `)
  // Make 'open-day' deliberately blank-description so it is one of the incomplete records while keeping a custom title.
  await db.exec(`update insights set seo_description = null where slug = 'open-day-meet-instructors'`)

  // Snapshot for safety comparisons.
  const before = await db.query<any>(`
    select 'course' t, id, slug, title, seo_title, seo_description, updated_at from courses
    union all select 'insight', id, slug, title, seo_title, seo_description, updated_at from insights`)
  const beforeCounts = await db.query<any>(`select (select count(*) from courses)::int c, (select count(*) from insights)::int i`)
  const beforeMissing = await dashboardMissing()
  check(beforeMissing.missing === (await sqlMissing()), 'BEFORE backfill: dashboard logic == independent SQL count', `${beforeMissing.missing} incomplete`)
  check(
    !beforeMissing.records.some((r) => r.path.includes('draft-')),
    'drafts are not counted (metric is over published content only)'
  )
  console.log('       incomplete records before:')
  for (const r of beforeMissing.records) console.log(`         - ${r.kind.padEnd(7)} ${r.path}  [missing ${r.missing.join(' + ')}]`)

  // ===== Apply 0019 =====
  console.log('\n== Applying 0019_seo_metadata_backfill.sql ==')
  const migration = read('0019_seo_metadata_backfill.sql')
  await db.exec(migration)
  check(true, '0019 executes without error on Postgres')

  const afterCounts = await db.query<any>(`select (select count(*) from courses)::int c, (select count(*) from insights)::int i`)
  check(JSON.stringify(beforeCounts.rows) === JSON.stringify(afterCounts.rows), 'no rows deleted or added', JSON.stringify(afterCounts.rows[0]))

  const after = await dashboardMissing()
  check(after.missing === 0 && (await sqlMissing()) === 0, 'AFTER backfill: metric is 0 and matches independent SQL count (computed, not hard-coded)')

  const afterRows = await db.query<any>(`
    select 'course' t, id, slug, title, seo_title, seo_description, updated_at from courses
    union all select 'insight', id, slug, title, seo_title, seo_description, updated_at from insights`)
  const byId = new Map(before.rows.map((r: any) => [r.id, r]))
  let overwritten = 0, tsChanged = 0, tooLongTitle = 0, tooLongDesc = 0, nonBlank = 0
  for (const r of afterRows.rows as any[]) {
    const b: any = byId.get(r.id)
    if (b.seo_title && b.seo_title.trim() && r.seo_title !== b.seo_title) overwritten++
    if (b.seo_description && b.seo_description.trim() && r.seo_description !== b.seo_description) overwritten++
    if (new Date(b.updated_at).getTime() !== new Date(r.updated_at).getTime()) tsChanged++
    if (r.seo_title.length > SEO_TITLE_RECOMMENDED) tooLongTitle++
    if (r.seo_description.length > SEO_DESCRIPTION_MAX) tooLongDesc++
    if (r.seo_title.trim() && r.seo_description.trim()) nonBlank++
  }
  check(overwritten === 0, 'no existing SEO text was overwritten')
  check(tsChanged === 0, 'updated_at preserved on every row (staleness + sitemap lastmod unaffected)')
  check(tooLongTitle === 0 && tooLongDesc === 0, `all titles ≤ ${SEO_TITLE_RECOMMENDED} and descriptions ≤ ${SEO_DESCRIPTION_MAX} characters`)
  check(nonBlank === afterRows.rows.length, 'every course and insight (including drafts) now has both fields', `${nonBlank}/${afterRows.rows.length}`)

  const trg = await db.query<any>(`select tgname, tgenabled from pg_trigger where tgname in ('trg_courses_updated_at','trg_insights_updated_at') order by 1`)
  check(trg.rows.length === 2 && trg.rows.every((t: any) => t.tgenabled === 'O'), 'updated_at triggers are re-enabled', trg.rows.map((t: any) => `${t.tgname}=${t.tgenabled}`).join(', '))

  // Hand-written copy for the six seeded insights landed as written.
  const six = await db.query<any>(`select slug, seo_title, seo_description from insights where slug in (
    'how-to-become-a-software-developer-in-nigeria','it-skills-students-should-learn','what-is-cybersecurity-and-why-it-matters',
    'data-analytics-vs-data-science','study-tips-for-learning-to-code','choosing-between-short-course-and-diploma')`)
  check(six.rows.length === 6 && six.rows.every((r: any) => r.seo_title.endsWith('| APTECH Abeokuta') && r.seo_description.length > 60),
    'six seeded insights received their hand-written SEO copy')

  // Customised values survived, partial rows were completed field-by-field.
  const get = async (table: string, slug: string) => (await db.query<any>(`select seo_title, seo_description from ${table} where slug=$1`, [slug])).rows[0]
  const half = await get('courses', 'half-filled-course')
  check(half.seo_title === 'Hand Written Title | APTECH Abeokuta' && half.seo_description.length > 0, 'half-filled course keeps its title and only the blank description was generated')
  const open = await get('insights', 'open-day-meet-instructors')
  check(open.seo_title === 'Custom Hand-Written Insight Title' && open.seo_description.length > 0, 'custom insight title preserved; blank description generated')

  // ===== SQL generators == TypeScript generators =====
  console.log('\n== SQL-generated values match the TypeScript generators used by the CRM save actions ==')
  const cases: { table: 'courses' | 'insights'; slug: string }[] = [
    { table: 'courses', slug: 'half-filled-course' },
    { table: 'courses', slug: 'draft-course-no-seo' },
    { table: 'courses', slug: 'cloud-devops-long-title' },
    { table: 'insights', slug: 'open-day-meet-instructors' },
    { table: 'insights', slug: 'no-summary-post' },
    { table: 'insights', slug: 'draft-insight-no-seo' },
    { table: 'insights', slug: 'whitespace-seo-insight' }
  ]
  for (const c of cases) {
    const src = (await db.query<any>(
      c.table === 'courses'
        ? `select title, summary as summ, null::text as body from courses where slug=$1`
        : `select title, short_description as summ, content as body from insights where slug=$1`,
      [c.slug]
    )).rows[0]
    const kind = c.table === 'courses' ? 'course' : 'insight'
    const row = await get(c.table, c.slug)
    const tsDesc = generateSeoDescription({ title: src.title, summary: src.summ, contentHtml: src.body })
    const tsTitle = generateSeoTitle(kind, src.title)
    // Title is only generated when it was blank before; compare where that was the case.
    const b: any = [...before.rows].find((r: any) => r.slug === c.slug)
    const titleWasBlank = !b.seo_title || !b.seo_title.trim()
    const descWasBlank = !b.seo_description || !b.seo_description.trim()
    if (titleWasBlank) check(row.seo_title === tsTitle, `title  ${c.slug}`, row.seo_title)
    if (descWasBlank) check(row.seo_description === tsDesc, `desc   ${c.slug}`, `${row.seo_description.length} chars`)
  }

  // ===== Idempotency =====
  console.log('\n== Idempotency ==')
  const snap1 = JSON.stringify((await db.query<any>(`select slug, seo_title, seo_description, updated_at from courses union all select slug, seo_title, seo_description, updated_at from insights order by 1`)).rows)
  await db.exec(migration)
  const snap2 = JSON.stringify((await db.query<any>(`select slug, seo_title, seo_description, updated_at from courses union all select slug, seo_title, seo_description, updated_at from insights order by 1`)).rows)
  check(snap1 === snap2, 're-running 0019 changes nothing')

  // ===== Future records: the save-action path =====
  console.log('\n== Future records (resolveSeoFields, as used by createCourse/updateCourse/createInsight/updateInsight) ==')
  const blank = resolveSeoFields('course', { title: 'Brand New Course', summary: 'A new course summary.' }, { seoTitle: '', seoDescription: '   ' })
  check(missingSeoFields({ seo_title: blank.seo_title, seo_description: blank.seo_description }).length === 0 && blank.autoFilled.length === 2,
    'blank form input is auto-filled, so a saved record is never incomplete')
  const typed = resolveSeoFields('insight', { title: 'T', summary: 'S' }, { seoTitle: '  My Title  ', seoDescription: 'My description' })
  check(typed.seo_title === 'My Title' && typed.seo_description === 'My description' && typed.autoFilled.length === 0,
    'values typed by staff are kept exactly (trimmed) and not replaced')
  const longTitle = resolveSeoFields('course', { title: 'X'.repeat(150), summary: 'y'.repeat(400) }, {})
  check(longTitle.seo_title.length <= SEO_TITLE_RECOMMENDED && longTitle.seo_description.length <= SEO_DESCRIPTION_MAX,
    'generated values always respect the length limits, even for very long inputs')

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
