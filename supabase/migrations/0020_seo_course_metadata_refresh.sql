-- ============================================================================
-- APTECH Abeokuta — course SEO metadata refresh
-- Migration 0020
--
-- Why
--   Migration 0018 seeded course titles that follow one template on 8 of 12
--   pages ("<Name> Course in Abeokuta | APTECH Abeokuta") and descriptions
--   that did not use the duration/level/tool facts already stored on each
--   course. This migration gives each course a title that matches how people
--   actually search for it (e.g. "graphic design", "web development", "SQL
--   Server") and a description built only from facts stored on that same
--   course row (duration, level, tools, modules, outcomes).
--
-- Safety
--   * Each field is replaced ONLY when it still holds the exact text seeded by
--     migration 0018. Anything staff edited in the CRM is left untouched.
--   * No schema change, no deletes. Idempotent: rows are only matched while at
--     least one field still holds its 0018 seed text, so a re-run touches no rows
--     (and does not bump updated_at / sitemap lastmod again).
--   * updated_at IS bumped by the table trigger: these pages' H1, body layout
--     and metadata really did change in this release, so sitemap <lastmod>
--     should move.
--   * Limits respected: titles <= 65 chars, descriptions <= 160 (table CHECKs
--     allow 70 / 160).
--
-- Rollback: re-run the 'update courses' statements of migration 0018 after
-- setting seo_title / seo_description back to NULL for the affected slugs.
-- ============================================================================

begin;

update courses set
  seo_description = case when seo_description = 'Two-year Advanced Diploma in Software Engineering at APTECH Abeokuta: programming, web, Java and .NET, mobile apps, plus Data Science, AI or IoT tracks.' then
    'Two-year, four-term Advanced Diploma in Software Engineering at APTECH Abeokuta: C, web, Java, .NET and mobile apps, then Data Science, AI or IoT tracks.' else seo_description end
where slug = 'advanced-diploma-software-engineering'
  and (seo_description = 'Two-year Advanced Diploma in Software Engineering at APTECH Abeokuta: programming, web, Java and .NET, mobile apps, plus Data Science, AI or IoT tracks.');

update courses set
  seo_description = case when seo_description = 'Smart Pro (ACNPRO) at APTECH Abeokuta: a shared foundation in Excel, Python and R, then specialise in Data Science, AI & Machine Learning or Software Testing.' then
    'Smart Pro (ACNPRO) at APTECH Abeokuta: a 146-hour foundation in Excel, Python and R, then a 200-hour Data Science, AI/ML or Software Testing track.' else seo_description end
where slug = 'smart-pro'
  and (seo_description = 'Smart Pro (ACNPRO) at APTECH Abeokuta: a shared foundation in Excel, Python and R, then specialise in Data Science, AI & Machine Learning or Software Testing.');

update courses set
  seo_title = case when seo_title = 'Aptech Certified Network Specialist (ACNS) | APTECH Abeokuta' then
    'Networking & Cybersecurity Training: ACNS | APTECH Abeokuta' else seo_title end,
  seo_description = case when seo_description = 'Aptech Certified Network Specialist at APTECH Abeokuta: hardware, networking, Red Hat, Azure and ethical hacking, mapped to CompTIA, CCNA, CCNP and CEH.' then
    'Four-term Aptech Certified Network Specialist (692 hours): hardware, networking, Azure and ethical hacking, mapped to CompTIA, CCNA, CCNP and CEH exams.' else seo_description end
where slug = 'aptech-certified-network-specialist'
  and (seo_title = 'Aptech Certified Network Specialist (ACNS) | APTECH Abeokuta'
    or seo_description = 'Aptech Certified Network Specialist at APTECH Abeokuta: hardware, networking, Red Hat, Azure and ethical hacking, mapped to CompTIA, CCNA, CCNP and CEH.');

update courses set
  seo_title = case when seo_title = 'MS Office 2019 Course in Abeokuta | APTECH Abeokuta' then
    'MS Office 2019 Training in Abeokuta | Word, Excel & PowerPoint' else seo_title end,
  seo_description = case when seo_description = 'One-month MS Office 2019 course at APTECH Abeokuta covering Word, Excel, PowerPoint and Outlook for everyday office productivity and document automation.' then
    'One-month beginner MS Office 2019 course at APTECH Abeokuta: Word, Excel, PowerPoint and Outlook for everyday office work. Apply or ask admissions.' else seo_description end
where slug = 'ms-office-2019-office-automation'
  and (seo_title = 'MS Office 2019 Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'One-month MS Office 2019 course at APTECH Abeokuta covering Word, Excel, PowerPoint and Outlook for everyday office productivity and document automation.');

update courses set
  seo_title = case when seo_title = 'Web Development Training in Abeokuta | APTECH Abeokuta' then
    'Web Development Course in Abeokuta: HTML5, CSS3 & JavaScript' else seo_title end,
  seo_description = case when seo_description = 'Four-month Responsive Web Development course at APTECH Abeokuta: HTML5, CSS3 and JavaScript for building responsive, mobile-friendly websites.' then
    'Four-month Responsive Web Development course at APTECH Abeokuta: HTML5, CSS3 and JavaScript for building mobile-friendly websites. Beginner to intermediate.' else seo_description end
where slug = 'responsive-web-development'
  and (seo_title = 'Web Development Training in Abeokuta | APTECH Abeokuta'
    or seo_description = 'Four-month Responsive Web Development course at APTECH Abeokuta: HTML5, CSS3 and JavaScript for building responsive, mobile-friendly websites.');

update courses set
  seo_title = case when seo_title = 'Advanced Excel 2019 Course in Abeokuta | APTECH Abeokuta' then
    'Advanced Excel Course in Abeokuta: PivotTables & Formulas' else seo_title end,
  seo_description = case when seo_description = 'One-month Advanced Excel 2019 course at APTECH Abeokuta: advanced formulas, PivotTables, data analysis and dashboards for reporting and data-driven roles.' then
    'One-month intermediate Advanced Excel 2019 course at APTECH Abeokuta: lookup and logical formulas, PivotTables, data validation and dashboards.' else seo_description end
where slug = 'advanced-excel-2019'
  and (seo_title = 'Advanced Excel 2019 Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'One-month Advanced Excel 2019 course at APTECH Abeokuta: advanced formulas, PivotTables, data analysis and dashboards for reporting and data-driven roles.');

update courses set
  seo_title = case when seo_title = 'Graphics Design Course in Abeokuta | APTECH Abeokuta' then
    'Graphic Design Course in Abeokuta | Photoshop, Illustrator' else seo_title end,
  seo_description = case when seo_description = 'Two-month Graphics Design course at APTECH Abeokuta: design principles plus hands-on practice with Adobe Photoshop, Illustrator and CorelDRAW.' then
    'Two-month Graphics Design course at APTECH Abeokuta: colour, typography and layout, plus Photoshop, Illustrator and CorelDRAW for print and digital work.' else seo_description end
where slug = 'graphics-design'
  and (seo_title = 'Graphics Design Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'Two-month Graphics Design course at APTECH Abeokuta: design principles plus hands-on practice with Adobe Photoshop, Illustrator and CorelDRAW.');

update courses set
  seo_title = case when seo_title = 'Linux Course in Abeokuta | APTECH Abeokuta' then
    'Linux Course in Abeokuta: Command Line & System Admin Basics' else seo_title end,
  seo_description = case when seo_description = 'One-month Linux course at APTECH Abeokuta: the command line, file systems, permissions and basic system administration for servers, networking and DevOps.' then
    'One-month Linux course at APTECH Abeokuta: installation, the command line, file systems, permissions, package management and basic shell scripting.' else seo_description end
where slug = 'linux'
  and (seo_title = 'Linux Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'One-month Linux course at APTECH Abeokuta: the command line, file systems, permissions and basic system administration for servers, networking and DevOps.');

update courses set
  seo_title = case when seo_title = 'Python & Django Course in Abeokuta | APTECH Abeokuta' then
    'Python Django Course in Abeokuta | Build Web Applications' else seo_title end,
  seo_description = case when seo_description = 'Three-month Python (Django) course at APTECH Abeokuta: core Python programming, then building database-backed web applications with Django.' then
    'Three-month intermediate Python (Django) course at APTECH Abeokuta: core Python, then models, views and templates for database-backed web applications.' else seo_description end
where slug = 'python-django'
  and (seo_title = 'Python & Django Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'Three-month Python (Django) course at APTECH Abeokuta: core Python programming, then building database-backed web applications with Django.');

update courses set
  seo_title = case when seo_title = 'Java Programming Course in Abeokuta | APTECH Abeokuta' then
    'Java Programming Course in Abeokuta: Java I & II | APTECH' else seo_title end,
  seo_description = case when seo_description = 'Two-month Java I & II course at APTECH Abeokuta: core Java syntax, control structures and object-oriented programming for further application development.' then
    'Two-month Java I & II course at APTECH Abeokuta: syntax, control structures, object-oriented programming, exceptions and collections. Beginner to intermediate.' else seo_description end
where slug = 'java-i-ii'
  and (seo_title = 'Java Programming Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'Two-month Java I & II course at APTECH Abeokuta: core Java syntax, control structures and object-oriented programming for further application development.');

update courses set
  seo_title = case when seo_title = 'Windows Server Admin Course in Abeokuta | APTECH Abeokuta' then
    'Windows Server Administration Course in Abeokuta | APTECH' else seo_title end,
  seo_description = case when seo_description = 'One-month Windows Server Admin course at APTECH Abeokuta: installation, Active Directory, users and groups, and core server administration for IT support roles.' then
    'One-month intermediate Windows Server Admin course at APTECH Abeokuta: installation, Active Directory, users and groups, file sharing and routine server tasks.' else seo_description end
where slug = 'windows-server-admin'
  and (seo_title = 'Windows Server Admin Course in Abeokuta | APTECH Abeokuta'
    or seo_description = 'One-month Windows Server Admin course at APTECH Abeokuta: installation, Active Directory, users and groups, and core server administration for IT support roles.');

update courses set
  seo_title = case when seo_title = 'SQL Server 2016 Data Management Course | APTECH Abeokuta' then
    'SQL Server 2016 Course in Abeokuta: Database Design & SQL' else seo_title end,
  seo_description = case when seo_description = 'Four-month Data Management course at APTECH Abeokuta: relational database design, SQL queries, stored procedures and basic administration on SQL Server 2016.' then
    'Four-month intermediate SQL Server 2016 course at APTECH Abeokuta: relational design, SQL queries, stored procedures, views and basic administration.' else seo_description end
where slug = 'data-mgt-sql-server-2016'
  and (seo_title = 'SQL Server 2016 Data Management Course | APTECH Abeokuta'
    or seo_description = 'Four-month Data Management course at APTECH Abeokuta: relational database design, SQL queries, stored procedures and basic administration on SQL Server 2016.');

commit;
