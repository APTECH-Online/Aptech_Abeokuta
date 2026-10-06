# SEO optimisation report: 18 indexable pages (12 courses, 6 insights)

Scope and honesty note. Course and insight text lives in Supabase, which I could not access, and I could not
reach the live site. "Current" values below were reconstructed by running your real migrations (0004, 0007,
0018-0021) in an in-memory Postgres and serving that data to a production build of the app. Anything staff edited in the
CRM since is not reflected. Nothing here predicts rankings.

## 1. Executive summary
Earlier rounds had already given every page unique, accurate metadata. The remaining weakness was structural:
`lib/topics.ts` (a topic map of courses and guides) was imported nowhere, so linking between courses and guides was
generic and course H1s were bare CMS titles. This round wires that layer in, fixes schema typing for the guides, and
removes a needless auth call on four public pages. Biggest remaining opportunities: richer short-course content
(needs verified facts from staff), a design guide, and live Search Console checks.

## 2. Page inventory: 18 pages, all verified 200, self-canonical, no noindex, one H1, in sitemap
Verified against a production build + migrated data. 18/18 unique titles, descriptions and H1s; titles 49-64 chars.
Every image has alt text. JSON-LD valid on all pages (Course or Article, BreadcrumbList, site-wide Organization).

## 3. Technical SEO
| Issue | Status |
|---|---|
| `topics.ts` orphaned, topical linking dead | Fixed (wired into course, insight, hub pages) |
| Guides typed `NewsArticle` and badged NEWS though evergreen | Fixed (`Article`, "Guide" label) |
| Reserved slugs (`/insights/news` etc.) ran a Supabase auth lookup on every request | Fixed (proxy fast path) |
| `/courses` hub is static; new guides section could go stale | Fixed (hourly revalidate + revalidate on insight changes and cron) |
| robots.txt, sitemap.xml, canonicals, 301 legacy map, real 404s | Checked, correct, unchanged |
| Course schema had no duration | Added `timeRequired`, only for simple stored durations |
| Core Web Vitals, live headers, redirect chains on the live host | NOT checked (no live access) |
| Unused ~3.9 MB in `public/images/adse` with space/duplicate filenames | Reported, not deleted (may be CMS cover paths) |

## 4. Course SEO (all 12)
H1s now descriptive (e.g. "Linux Course in Abeokuta"). Added: mobile hero facts and Apply/Ask CTAs, a
duration/level/format block, a "Guides related to..." section, topical related courses, descriptive card anchors.
Titles and descriptions were not rewritten: the existing ones are already unique, accurate and well-sized.
Not added, because it is not in the data: prerequisites, certification, instructors, audience detail. The page now
says plainly that requirements and fees are confirmed by admissions.

## 5. Insight SEO (all 6)
Visible "By APTECH Abeokuta, Published, Updated" line, related-courses box, topical "Keep reading" links, h2/h3
hierarchy fixed, Article schema corrected. Bodies from migration 0021 already open with a direct answer; they applied
cleanly (md5 guards matched) and are 3.8-5.0k characters.

## 6. The non-indexable 7th Insight
Not identifiable from the repo: it is a staff-created database row. The only explicit non-index mechanism is the CRM
"Hide from search engines (noindex)" checkbox, which defaults to off, and migration 0021 refers to "the one published
insight that is flagged noindex". That strongly suggests deliberate. No action taken. Confirm with
`docs/diagnose-noindex-insight.sql`, which states the exact reason per row (noindex, scheduled, expired, reserved slug).

## 7. Internal linking (measured on the rendered pages)
Every one of the 18 pages receives 3-16 links from the other 17; none orphaned; no broken links. Lowest is Graphics
Design (3), because no guide covers design. Course to guide, guide to course, course to course, and the hub to
all guides links now exist where none did before.

## 8. Structured data
Site-wide EducationalOrganization + LocalBusiness + WebSite; Course (+ `timeRequired`); Article for guides;
BreadcrumbList everywhere. No ratings, prices or reviews are emitted because none are stored.

## 9. Content gaps (only where genuine)
1. A graphic design guide or "learn graphic design in Abeokuta" explainer linking to Graphics Design.
2. Verified prerequisites, certification and instructor facts per course (CRM fields, rendered only if filled).
3. A networking-careers explainer to complement the cybersecurity guide, linking ACNS.

## 10. Roadmap
Do now: deploy; run `docs/diagnose-noindex-insight.sql`; submit sitemap; inspect all 18 URLs in Search Console.
Next: add verified course facts; design guide; decide whether evergreen guides should move out of `news`.
Later: tidy unused ADSE image files; improve the "choosing" guide's generated title.

## 11. Before / after
H1 changes (titles and descriptions unchanged, listed in section 2). Guide H1s unchanged.
| Page | Previous H1 | New H1 |
|---|---|---|
| ADSE | Advanced Diploma in Software Engineering | Advanced Diploma in Software Engineering in Abeokuta |
| Smart Pro | Smart Pro | Smart Pro Programme: Data Science, AI & Software Testing |
| ACNS | Aptech Certified Network Specialist | Aptech Certified Network Specialist (ACNS): Networking & Cybersecurity Programme |
| MS Office 2019 | MS Office 2019 Office Automation | MS Office 2019 Training in Abeokuta |
| Responsive Web Dev | Responsive Web Development | Responsive Web Development Course in Abeokuta |
| Advanced Excel | Advanced Excel 2019 | Advanced Excel 2019 Course in Abeokuta |
| Graphics Design | Graphics Design | Graphics Design Course in Abeokuta |
| Linux | Linux | Linux Course in Abeokuta |
| Python (Django) | Python (Django) | Python (Django) Course in Abeokuta |
| Java I & II | Java I & II | Java I & II Course in Abeokuta |
| Windows Server Admin | Windows Server Admin | Windows Server Admin Course in Abeokuta |
| SQL Server 2016 | Data Management — SQL Server 2016 | SQL Server 2016 Data Management Course in Abeokuta |

## Not verified
Live HTTP behaviour, Core Web Vitals, Google's rich-result validator (JSON-LD parsed and structurally checked only),
real mobile rendering (responsive classes only), and the real Google Fonts build (fonts were stubbed in my scratch build
only; your layout is unchanged).

## Addendum: optional course detail fields (migration 0022)
The nine short courses (and the three programmes) had no place for audience, entry requirements or certification, so
pages could not answer those questions. Added three optional, staff-written fields, editable in the CRM under
"Course details". Each renders as its own section only when filled in, and entry requirements also feed `coursePrerequisites`
in the Course schema. Nothing is shown or guessed when blank.
- Apply `supabase/migrations/0022_course_detail_fields.sql`. If the code is deployed first, the site still works (verified:
  all 12 courses load; the new sections just do not appear), and CRM saves only touch the new columns when used.
- Fill in `docs/course-fact-sheet.csv`, then enter the values in the CRM per course.
- Tested against migrated data in both orders (migration before code, code before migration). The CRM save path is
  type-checked but was not exercised against a real database.

## Addendum 2: courses controlled from the CRM (migration 0023)
Everything per-course that was fixed in code is now a CRM field. Applying `0023_course_crm_controls.sql` changes
nothing visible (defaults and seeds reproduce the previous pages); staff then control, per course:
| CRM field | Controls |
|---|---|
| Admission status (open / opening soon / closed) | The status line, the sidebar and mobile call-to-action, and a badge on course cards when not open |
| Intake note | One optional line under the status (enter only confirmed dates) |
| Page heading (H1) | The descriptive H1; blank falls back to the title |
| Related courses / Related guides | The "Related courses" and "Guides related to..." blocks; a guide also lists the courses that link to it (up to 5) |
| Curriculum | Optional modules/terms, plain-text format validated on save with line-numbered errors |
| Show on homepage | The homepage career-paths row (first three flagged) |
Also: renaming a course or guide in the CRM updates the slugs inside other courses' related lists; `ProgramFinder`
now always returns a published course instead of a dead end when a mapped course is unpublished.
Still in code (by design): the detailed ADSE / Smart Pro / ACNS curricula (`data/adse.ts`, `smartpro.ts`,
`acns.ts`) and the homepage finder's goal-to-course mapping. Leave Curriculum empty for the three programmes.
Verified with migrated data in three states: migration applied unchanged, CRM edits (closed course, curriculum, a new
course created with no code change, empty related list falling back to automatic), and migration not yet applied.
Not exercised: the CRM form in a browser (admin requires sign-in); its save logic is type-checked and the database
constraints were tested directly.

## Addendum 3: CRM mobile responsiveness
Measured and screenshotted in headless Chromium against the real admin pages (sample data, fake sign-in in a scratch copy
only) at 375px, 820px and 1280px.
- Tables: 9 of 10 admin tables become labelled cards below 768px (identifying cell as header, label in a left gutter,
  actions full width). Cells carry `data-label` in the markup, so there is no JavaScript dependency or layout flash.
  Staff keeps its existing card layout. New tables opt in with `is-stackable`, `data-label` on each `<td>` and
  `data-primary` on the title cell.
- Forms: 16px controls (stops iOS focus zoom), 44px minimum control and tap-target height, larger checkboxes, consistent
  `admin-fieldset` groups, thumb-sized rich-text toolbar.
- Layout fixes: dashboard KPIs two-up on phones; filter bars no longer create an implicit second column; Filter/Reset fill
  the row; pagination wraps; long emails wrap instead of clipping.
- Tablet/desktop: tables unchanged apart from keeping Edit/Archive side by side, a minimum width for the title column
  and word-boundary wrapping.
Measured at 375px: small form inputs 23 to 0 on the course form; undersized table buttons 13 to 0; no sideways page scroll
on any of the 11 admin pages tested.
Not covered: real iOS/Android devices, a production build (tested in dev mode), and the Gallery, Testimonials,
Programmes, Reports and Settings pages beyond those listed. Observed separately: a university saved without a logo
renders an `<img>` with an empty `src`.
