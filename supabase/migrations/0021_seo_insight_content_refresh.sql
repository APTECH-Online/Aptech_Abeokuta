-- ============================================================================
-- APTECH Abeokuta — launch insight content & metadata refresh
-- Migration 0021
--
-- Why
--   The six launch guides seeded by migration 0004 are 130-250 words of
--   unstructured paragraphs: no headings, no links to the courses they talk
--   about, and no direct answer up front. This migration replaces each body
--   with a structured guide (direct-answer intro, H2 sections, practical
--   steps, links to the relevant courses and sibling guides, and reference
--   links) and refreshes the SEO title / description (and, for two guides,
--   the on-page title) so each matches its search intent.
--
-- Facts
--   Every statement about APTECH Abeokuta courses (durations, levels,
--   modules, tools, hours, certification mappings) is taken from the stored
--   course rows seeded by migration 0007. Nothing about outcomes, salaries,
--   employment, partners, statistics or instructors is claimed.
--
-- Safety
--   * Every field is replaced ONLY while it still holds the exact value that
--     migrations 0004/0019 wrote (body: matched by md5 of the stored HTML).
--     A guide that staff have edited in the CRM is left completely alone.
--   * Slugs / URLs are not changed.
--   * updated_at IS bumped by the table trigger. The article body genuinely
--     changed, so Article dateModified and sitemap <lastmod> should move.
--   * Idempotent: a row is matched only while at least one field still holds its
--     original seed value, so a re-run touches nothing and does not bump
--     updated_at again. Rollback: docs/rollback-0021-insight-content.sql.
--   * Does not touch any insight other than the six launch guides, in
--     particular not the one published insight that is flagged noindex.
-- ============================================================================

begin;

-- how-to-become-a-software-developer-in-nigeria
update insights set
  content = case when md5(content) = '09602be1dde9893d9dbc922a896506fd' then
$body$<p><strong>The short answer:</strong> you become a software developer by learning programming fundamentals in one language, choosing a direction (front-end, back-end or full-stack), building a few real projects you can explain, and then applying for roles or internships. A computer science degree can help, but it is not the only route. Many employers look closely at what you have built and how clearly you can talk about it.</p>

<h2>Step 1: Learn the fundamentals in one language</h2>
<p>Start with variables, control flow (conditions and loops), functions and basic data structures such as lists and dictionaries. Learn them properly in a single language before you sample others. Python and Java are common first languages; if you want to go straight into websites, start with HTML, CSS and JavaScript. At this stage the goal is not to memorise syntax. It is to get comfortable breaking a problem into small steps that you can express in code.</p>

<h2>Step 2: Choose a direction</h2>
<ul>
<li><strong>Front-end development</strong> covers what users see and click: HTML, CSS, JavaScript and, later, a framework such as React.</li>
<li><strong>Back-end development</strong> covers the logic and data behind an application: a language such as Java, C# or Python, plus databases and APIs.</li>
<li><strong>Full-stack development</strong> means working on both sides of an application.</li>
</ul>
<p>If you are unsure, build one small website and one small data-driven program, then notice which one you enjoyed more. That is usually a better guide than job-title hype.</p>

<h2>Step 3: Learn the tools professionals use every day</h2>
<p>Three skills appear in almost every development job and are quick to pick up alongside your first projects: version control with Git, basic comfort on the command line, and enough SQL to read and write data in a database. They also make you easier to work with, because teams share code through Git and rely on databases for almost everything. Our guide to <a href="/insights/it-skills-students-should-learn">IT skills students should learn before graduating</a> covers these in more detail.</p>

<h2>Step 4: Build a small portfolio you can explain</h2>
<p>Two or three finished, documented projects will do more for you than a long list of tutorials watched. Good beginner projects include:</p>
<ul>
<li>a simple website for a real person or small business, built so it works on a phone as well as a laptop;</li>
<li>a small database-backed application, such as a student-records or stock-tracking tool;</li>
<li>a short script that automates something tedious you actually do.</li>
</ul>
<p>Write a clear README for each one: what it does, how to run it, and what you would improve next. In an interview, being able to explain a bug you hit and how you fixed it is worth more than a polished screenshot.</p>

<h2>Step 5: Apply, and keep learning</h2>
<p>Apply for internships, junior roles and freelance work while your portfolio is still modest. Tools and frameworks change every few years, so the habit of learning independently matters more than any single technology. Strong fundamentals make each new tool easier to pick up.</p>

<h2>Where structured training fits</h2>
<p>You can learn all of this on your own, but a structured programme gives you an order to learn things in, feedback from an instructor and classmates to learn alongside. At APTECH Abeokuta, these courses map onto the steps above:</p>
<ul>
<li><a href="/courses/advanced-diploma-software-engineering">Advanced Diploma in Software Engineering</a>: a two-year, four-term programme. Year 1 covers programming, web development, databases and Linux; Year 2 moves into Java or .NET application development and a specialisation, with term-end projects.</li>
<li><a href="/courses/responsive-web-development">Responsive Web Development</a>: a four-month course in HTML5, CSS3 and JavaScript for building mobile-friendly websites.</li>
<li><a href="/courses/python-django">Python (Django)</a>: a three-month course in Python and the Django framework for building database-backed web applications.</li>
<li><a href="/courses/java-i-ii">Java I &amp; II</a>: a two-month course in core Java and object-oriented programming.</li>
</ul>
<p>Unsure whether a short course or a longer diploma suits you? Read <a href="/insights/choosing-between-short-course-and-diploma">Short Course or Diploma? How to Choose the Right Programme Length</a>, and see <a href="/insights/study-tips-for-learning-to-code">study tips for learning to code</a> to make the learning curve easier. The admissions team can also <a href="/contact">talk through your situation</a>.</p>

<h2>Further reading</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Learn_web_development" target="_blank" rel="noopener noreferrer">MDN Web Docs: Learn web development</a> (free, beginner-friendly web fundamentals)</li>
<li><a href="https://git-scm.com/book/en/v2" target="_blank" rel="noopener noreferrer">Pro Git</a> (the free official Git book)</li>
</ul>$body$ else content end,
  seo_title = case when seo_title = 'How to Become a Software Developer in Nigeria | APTECH Abeokuta' then 'How to Become a Software Developer in Nigeria: Step-by-Step' else seo_title end,
  seo_description = case when seo_description = 'A practical look at the skills, learning path and portfolio work that matter for landing a software development role in Nigeria today.' then 'A step-by-step path to becoming a software developer in Nigeria: learn one language, pick a specialisation, master Git and SQL, and build a portfolio.' else seo_description end
where slug = 'how-to-become-a-software-developer-in-nigeria' and content_type = 'news' and category = 'Career Guides'
  and (md5(content) = '09602be1dde9893d9dbc922a896506fd'
    or seo_title = 'How to Become a Software Developer in Nigeria | APTECH Abeokuta'
    or seo_description = 'A practical look at the skills, learning path and portfolio work that matter for landing a software development role in Nigeria today.');

-- it-skills-students-should-learn
update insights set
  content = case when md5(content) = 'ce2561949da876632a72ccdf302fa9d8' then
$body$<p><strong>The short answer:</strong> before you graduate, focus on a small set of durable skills rather than whatever is trending: version control, comfort with the command line and your operating system, SQL and databases, networking basics, spreadsheet and office fluency, reading other people's work, and clear written communication. They apply across software development, data, IT support and infrastructure roles.</p>

<h2>1. Version control with Git</h2>
<p>Almost every professional software team uses Git daily, yet many self-taught learners skip it. Learn to commit, branch, merge and read a history. Put your own projects on a code-hosting site so there is a visible record of your work.</p>

<h2>2. The command line and your operating system</h2>
<p>Being able to move around files, check running processes and edit permissions from a terminal saves time in every technical role. Understand how the operating system you work on actually functions, not just where the buttons are. A short, focused <a href="/courses/linux">Linux course</a> (one month at APTECH Abeokuta, covering the command line, file systems, permissions and basic shell scripting) is a practical way to get there.</p>

<h2>3. SQL and how databases are structured</h2>
<p>Even a working knowledge of SQL helps whether you end up in software development, data analysis or IT support. Learn how tables relate to each other and how to write SELECT queries with joins and aggregate functions. The four-month <a href="/courses/data-mgt-sql-server-2016">Data Management with SQL Server 2016</a> course covers database design, queries, stored procedures and basic administration.</p>

<h2>4. Networking basics</h2>
<p>Knowing what an IP address is, how DNS works and why a connection fails makes you useful in support, infrastructure and security work, and helps developers debug web applications too. If this interests you, see <a href="/insights/what-is-cybersecurity-and-why-it-matters">What Is Cybersecurity?</a> for how networking leads into security careers.</p>

<h2>5. Spreadsheet and office fluency</h2>
<p>Excel and the wider Office suite remain the everyday tools of reporting, budgeting and administration. A beginner can cover Word, Excel, PowerPoint and Outlook in the one-month <a href="/courses/ms-office-2019-office-automation">MS Office 2019 course</a>; someone who already uses Excel can move on to the one-month <a href="/courses/advanced-excel-2019">Advanced Excel 2019 course</a> for lookup and logical formulas, PivotTables and dashboards.</p>

<h2>6. Reading code and documentation</h2>
<p>You will spend more time reading other people's code and documentation than writing your own from scratch. Practise by reading open-source projects and the official docs for tools you use, and by explaining what a piece of code does in plain words.</p>

<h2>7. Debugging and problem-solving</h2>
<p>Employers value people who can calmly isolate a problem: reproduce it, narrow it down, form a hypothesis and test it. This is learned by doing, which is why project work matters more than lecture notes.</p>

<h2>8. Communication</h2>
<p>Explaining a bug, writing a clear commit message or describing a problem to a non-technical colleague is the most overlooked technical skill. Instructor-led programmes build it through project work and presentations.</p>

<h2>How to start</h2>
<p>Pick two skills from the list that match the role you want, and practise them on one real project rather than in isolation. If you want a software career specifically, our guide on <a href="/insights/how-to-become-a-software-developer-in-nigeria">how to become a software developer in Nigeria</a> shows how these fit together, and the <a href="/insights/data-analytics-vs-data-science">difference between data analytics and data science</a> can help if you lean toward data.</p>$body$ else content end,
  seo_title = case when seo_title = 'IT Skills Students Should Learn | APTECH Abeokuta' then 'IT Skills Students Should Learn Before Graduating' else seo_title end,
  seo_description = case when seo_description = 'The practical, employer-relevant IT skills that separate job-ready graduates from those who struggle to find their first tech role.' then 'Eight durable IT skills worth learning before you graduate, from Git and SQL to networking basics, plus how to build each one with hands-on practice.' else seo_description end
where slug = 'it-skills-students-should-learn' and content_type = 'news' and category = 'Career Guides'
  and (md5(content) = 'ce2561949da876632a72ccdf302fa9d8'
    or seo_title = 'IT Skills Students Should Learn | APTECH Abeokuta'
    or seo_description = 'The practical, employer-relevant IT skills that separate job-ready graduates from those who struggle to find their first tech role.');

-- what-is-cybersecurity-and-why-it-matters
update insights set
  title = case when title = 'What Is Cybersecurity, and Why Does It Matter Right Now?' then 'What Is Cybersecurity? A Plain-Language Guide for Beginners' else title end,
  short_description = case when short_description = 'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.' then 'A plain-language introduction to what cybersecurity is, the main areas of the field, and the skills and learning path that lead into it.' else short_description end,
  content = case when md5(content) = 'd0b2992c0838ec760b43accabebef405' then
$body$<p><strong>Cybersecurity is the practice of protecting computer systems, networks and data from unauthorised access, damage or theft.</strong> As more of daily life, business and government moves online, there is more to protect and more ways to attack it, which is why organisations need people who understand both how systems work and how they fail.</p>

<h2>What cybersecurity professionals actually do</h2>
<p>The field is broad. Common areas include:</p>
<ul>
<li><strong>Network security</strong>: designing and monitoring networks so that only the right traffic gets through.</li>
<li><strong>Systems and cloud security</strong>: hardening servers and cloud environments, and managing who can access what.</li>
<li><strong>Security operations</strong>: watching for suspicious activity, investigating incidents and responding to them.</li>
<li><strong>Ethical hacking and penetration testing</strong>: with permission, attacking a system to find weaknesses before real attackers do.</li>
<li><strong>Application security</strong>: finding and fixing vulnerabilities in software.</li>
</ul>

<h2>The foundations come first</h2>
<p>You cannot defend what you do not understand. Most people entering the field build up in this order:</p>
<ol>
<li><strong>Computer hardware and operating systems</strong>: how Windows and Linux machines are set up and managed.</li>
<li><strong>Networking</strong>: IP addressing, routing, switching and common protocols.</li>
<li><strong>System administration</strong>: users, permissions, services and logging.</li>
<li><strong>Security concepts and hands-on labs</strong>: threats, defences and testing in a safe lab environment rather than only from theory.</li>
</ol>
<p>Some people arrive from software instead, learning how vulnerabilities appear in code and how to test for them. Either way, understand how systems normally work before learning how they can be broken.</p>

<h2>Certifications you will see mentioned</h2>
<p>Employers and training providers often refer to vendor certifications as a way to validate specific skills. Common names for people starting out include CompTIA A+ and Network+ for hardware and networking, Cisco CCNA for networking (with the CyberOps Associate track for security operations), and EC-Council's CEH for ethical hacking. A certification is evidence of knowledge in one area, not a substitute for hands-on practice.</p>

<h2>Learning paths at APTECH Abeokuta</h2>
<p>The closest route in APTECH Abeokuta's current course catalogue is a hardware and networking programme that includes security content, rather than a dedicated cybersecurity course:</p>
<ul>
<li>The <a href="/courses/aptech-certified-network-specialist">Aptech Certified Network Specialist (ACNS)</a> is a four-term, 692-hour programme. It starts with IT hardware and networking fundamentals (mapped to CompTIA A+ and Network+), covers Red Hat system administration plus Cisco networking and cybersecurity operations (CCNA, CyberOps Associate) in Term 2, and finishes in Term 4 with enterprise routing and switching and ethical hacking (CCNP Enterprise, CEH v11).</li>
<li>If you want to start smaller, the one-month <a href="/courses/linux">Linux course</a> and the one-month <a href="/courses/windows-server-admin">Windows Server Admin course</a> cover the operating-system administration that security work builds on.</li>
</ul>
<p>Not sure whether to start with a short course or a full programme? See <a href="/insights/choosing-between-short-course-and-diploma">how to choose the right programme length</a>, or <a href="/contact">ask admissions</a>.</p>

<h2>Protect yourself while you learn</h2>
<p>You do not need a career in security to benefit from the basics: use strong, unique passwords with a password manager, turn on two-step verification, keep devices updated and be sceptical of unexpected links and attachments.</p>

<h2>Further reading</h2>
<ul>
<li><a href="https://www.nist.gov/cyberframework" target="_blank" rel="noopener noreferrer">NIST Cybersecurity Framework</a> (a widely used way to organise security work)</li>
<li><a href="https://www.cisa.gov/secure-our-world" target="_blank" rel="noopener noreferrer">CISA: Secure Our World</a> (plain-language everyday security habits)</li>
</ul>$body$ else content end,
  seo_title = case when seo_title = 'What Is Cybersecurity and Why It Matters | APTECH Abeokuta' then 'What Is Cybersecurity? A Beginner''s Guide | APTECH Abeokuta' else seo_title end,
  seo_description = case when seo_description = 'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.' then 'What cybersecurity is, the main areas of the field, and the networking, systems and ethical-hacking skills that lead into a cybersecurity career.' else seo_description end
where slug = 'what-is-cybersecurity-and-why-it-matters' and content_type = 'news' and category = 'Technology'
  and (title = 'What Is Cybersecurity, and Why Does It Matter Right Now?'
    or short_description = 'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.'
    or md5(content) = 'd0b2992c0838ec760b43accabebef405'
    or seo_title = 'What Is Cybersecurity and Why It Matters | APTECH Abeokuta'
    or seo_description = 'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.');

-- data-analytics-vs-data-science
update insights set
  content = case when md5(content) = 'b5cffed9e72f895ddb3cab5c9b6a8b18' then
$body$<p><strong>The short answer:</strong> data analytics examines existing data to answer specific business questions about what has already happened, while data science builds predictive models, using statistics, programming and machine learning, to forecast what is likely to happen or to automate decisions. The two overlap heavily, and most beginners start with analytics.</p>

<h2>Side by side</h2>
<ul>
<li><strong>Main question.</strong> Analytics asks "what happened, and why?" Data science asks "what is likely to happen next, and what should we do?"</li>
<li><strong>Typical work.</strong> Analytics: cleaning data, building reports and dashboards, spotting trends. Data science: building and testing predictive models, working with larger or messier datasets, automating decisions.</li>
<li><strong>Common tools.</strong> Analytics: Excel, SQL and visualisation tools such as Power BI or Tableau. Data science: Python or R, statistics libraries, machine-learning frameworks and big-data tools.</li>
<li><strong>Maths and programming.</strong> Analytics needs solid spreadsheet and SQL skills and basic statistics. Data science needs stronger statistics and real programming ability.</li>
<li><strong>Typical output.</strong> Analytics: a report, dashboard or recommendation for a decision-maker. Data science: a model or system that produces predictions.</li>
</ul>

<h2>A simple example</h2>
<p>Imagine a shop with a year of sales records. An analyst would summarise which products sold best each month and present the pattern in a chart. A data scientist might build a model that predicts next month's demand per product so the shop can plan stock. The first uses the data to explain the past; the second uses it to anticipate the future.</p>

<h2>Which should you learn first?</h2>
<p>Most people benefit from learning analytics fundamentals before the programming and machine learning that data science needs:</p>
<ol>
<li><strong>Spreadsheets.</strong> Get strong at formulas, lookups, PivotTables and charts.</li>
<li><strong>SQL.</strong> Learn to pull and combine data from databases.</li>
<li><strong>Basic statistics.</strong> Averages, spread, correlation and what a sample can and cannot tell you.</li>
<li><strong>A visualisation tool.</strong> Turn results into something a decision-maker can read in seconds.</li>
<li><strong>Programming and machine learning.</strong> Add Python or R once the earlier steps feel natural.</li>
</ol>

<h2>Courses that follow this path at APTECH Abeokuta</h2>
<ul>
<li><a href="/courses/advanced-excel-2019">Advanced Excel 2019</a>: one month, intermediate level, covering lookup and logical formulas, PivotTables, data validation, conditional formatting and dashboards.</li>
<li><a href="/courses/data-mgt-sql-server-2016">Data Management with SQL Server 2016</a>: four months, covering database design, SELECT queries with joins and aggregates, stored procedures and basic administration.</li>
<li><a href="/courses/smart-pro">Smart Pro (ACNPRO)</a>: a 146-hour shared foundation in financial data analysis with Excel, Python and R programming and large data management, followed by a 200-hour specialisation in Data Science, AI &amp; Machine Learning, or Software Testing. The Data Science track includes big-data systems, Hadoop, Hive, Pig Latin and Tableau.</li>
</ul>
<p>If you are still deciding how long a programme to commit to, read <a href="/insights/choosing-between-short-course-and-diploma">Short Course or Diploma?</a>. For the broader skills that help in any of these roles, see <a href="/insights/it-skills-students-should-learn">IT skills students should learn before graduating</a>.</p>

<h2>Further reading</h2>
<ul>
<li><a href="https://learn.microsoft.com/en-us/power-bi/" target="_blank" rel="noopener noreferrer">Microsoft Learn: Power BI documentation</a></li>
<li><a href="https://docs.python.org/3/tutorial/" target="_blank" rel="noopener noreferrer">The Python Tutorial</a> (official documentation)</li>
</ul>$body$ else content end,
  seo_title = case when seo_title = 'Data Analytics vs Data Science | APTECH Abeokuta' then 'Data Analytics vs Data Science: Differences Explained' else seo_title end,
  seo_description = case when seo_description = 'Data analytics and data science are closely related but differ in day-to-day work, tools and starting points for beginners.' then 'Data analytics explains what happened; data science builds models to predict what comes next. Compare the work, tools and best starting point for beginners.' else seo_description end
where slug = 'data-analytics-vs-data-science' and content_type = 'news' and category = 'Technology'
  and (md5(content) = 'b5cffed9e72f895ddb3cab5c9b6a8b18'
    or seo_title = 'Data Analytics vs Data Science | APTECH Abeokuta'
    or seo_description = 'Data analytics and data science are closely related but differ in day-to-day work, tools and starting points for beginners.');

-- study-tips-for-learning-to-code
update insights set
  title = case when title = 'Study Tips for Learning to Code (That Actually Work)' then 'Study Tips for Learning to Code: Habits That Help Beginners' else title end,
  short_description = case when short_description = 'Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.' then 'Common mistakes new programming students make, and practical habits that make the learning curve less painful.' else short_description end,
  content = case when md5(content) = 'f859777c8390b4dc20c17fc31fee4d26' then
$body$<p><strong>The short answer:</strong> you learn to code by writing code, not by watching or reading about it. The habits that help most are typing every example yourself, reading error messages carefully, building small projects early, asking well-formed questions and studying alongside other people.</p>

<h2>1. Type the code yourself</h2>
<p>The biggest mistake new students make is passively watching or reading. Programming is built through repetition and mistakes. Type out every example yourself, even ones that look simple, then change something and predict what will happen before you run it.</p>

<h2>2. Expect to be stuck, and learn to read errors</h2>
<p>Getting an error message and spending twenty minutes on a bug that turns out to be a missing comma is completely normal. It is not a sign that you are bad at this. When something breaks:</p>
<ol>
<li>Read the whole error message, starting with the last line and the line number it points to.</li>
<li>Reproduce the problem with the smallest piece of code you can.</li>
<li>Change one thing at a time and re-run, so you know what fixed it.</li>
<li>Explain the problem aloud, step by step, to a friend or even to an object on your desk. Hearing yourself explain it often reveals the mistake.</li>
</ol>

<h2>3. Study in short, regular sessions</h2>
<p>Forty-five focused minutes most days usually beats one long weekend session, because you revisit ideas before you forget them. Finish a session by writing down what you will do next, so it is easy to restart.</p>

<h2>4. Build something you care about as soon as you can</h2>
<p>Once the fundamentals are in place, a small project of your own choosing will teach you more, and keep you more motivated, than the tenth generic tutorial exercise. Examples: a page for a friend's business, a small tool that tracks expenses, or a quiz game. Keep it small enough to finish.</p>

<h2>5. Ask good questions</h2>
<p>When you ask a classmate, instructor or online community for help, include what you were trying to do, what you expected, what actually happened (with the exact error text) and what you have already tried. Questions asked this way get answered faster, and writing one often solves the problem before you send it. The Stack Overflow guide to <a href="https://stackoverflow.com/help/how-to-ask" target="_blank" rel="noopener noreferrer">asking a good question</a> is a useful template.</p>

<h2>6. Don't learn alone</h2>
<p>Studying alongside classmates, asking questions out loud, explaining a concept to someone else and comparing approaches consistently produces better results than working in isolation. This is one of the main practical advantages of an instructor-led programme over going it alone.</p>

<h2>7. Take notes in your own words</h2>
<p>Keep a short personal reference of patterns you have learned and mistakes you have made. Writing a concept in your own words shows quickly whether you really understand it.</p>

<h2>Where to practise with an instructor</h2>
<p>If you would rather learn with an instructor and a cohort, APTECH Abeokuta offers instructor-led options at different depths:</p>
<ul>
<li><a href="/courses/java-i-ii">Java I &amp; II</a>: two months of core Java, from syntax and control structures to object-oriented programming.</li>
<li><a href="/courses/python-django">Python (Django)</a>: three months of Python and the Django framework, including building and testing a Django project.</li>
<li><a href="/courses/responsive-web-development">Responsive Web Development</a>: four months of HTML5, CSS3 and JavaScript, building and deploying a responsive website project.</li>
</ul>
<p>For the bigger picture of where these habits lead, read <a href="/insights/how-to-become-a-software-developer-in-nigeria">how to become a software developer in Nigeria</a>, and see <a href="/insights/choosing-between-short-course-and-diploma">how to choose between a short course and a diploma</a> if you are weighing options.</p>$body$ else content end,
  seo_title = case when seo_title = 'Study Tips for Learning to Code | APTECH Abeokuta' then 'Study Tips for Learning to Code: Habits for Beginners' else seo_title end,
  seo_description = case when seo_description = 'Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.' then 'Practical study habits for beginner programmers: type the code yourself, read error messages, build small projects, ask good questions and learn with others.' else seo_description end
where slug = 'study-tips-for-learning-to-code' and content_type = 'news' and category = 'Student Guides'
  and (title = 'Study Tips for Learning to Code (That Actually Work)'
    or short_description = 'Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.'
    or md5(content) = 'f859777c8390b4dc20c17fc31fee4d26'
    or seo_title = 'Study Tips for Learning to Code | APTECH Abeokuta'
    or seo_description = 'Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.');

-- choosing-between-short-course-and-diploma
update insights set
  content = case when md5(content) = 'f93a9f5d21a722672e4a007933865cfe' then
$body$<p><strong>The short answer:</strong> choose a short course when you already have a direction and need one concrete, immediately usable skill; choose a longer diploma-style programme when you are starting from little background and want a structured path that builds fundamentals first and then specialises. Your starting point and your goal matter more than the length itself.</p>

<h2>Three questions to ask yourself</h2>
<ol>
<li><strong>What is my starting point?</strong> If you already use a tool or work in a field and want to add one skill, a short course fits. If you are starting from scratch in a new field, a longer programme gives you fundamentals in a sensible order.</li>
<li><strong>What outcome do I want?</strong> A specific task ("build reports in Excel", "set up a Windows server") points to a short course. A career change ("become a software engineer") points to a longer pathway.</li>
<li><strong>How much time and money can I commit?</strong> Be realistic about hours per week and the total duration. Fees and intake dates differ by programme, so ask <a href="/admissions">admissions</a> for current details.</li>
</ol>

<h2>When a short course makes sense</h2>
<p>At APTECH Abeokuta, short courses run from one to four months and focus on a single tool or skill:</p>
<ul>
<li><a href="/courses/advanced-excel-2019">Advanced Excel 2019</a> (1 month): add PivotTables, advanced formulas and dashboards to existing spreadsheet skills.</li>
<li><a href="/courses/linux">Linux</a> (1 month) and <a href="/courses/windows-server-admin">Windows Server Admin</a> (1 month): practical system administration.</li>
<li><a href="/courses/java-i-ii">Java I &amp; II</a> (2 months), <a href="/courses/python-django">Python (Django)</a> (3 months) and <a href="/courses/responsive-web-development">Responsive Web Development</a> (4 months): learn a specific programming language or web skill.</li>
<li><a href="/courses/graphics-design">Graphics Design</a> (2 months) and <a href="/courses/ms-office-2019-office-automation">MS Office 2019</a> (1 month): design or everyday office skills.</li>
</ul>
<p>Short courses work best when you can apply the skill straight away at work or on a project.</p>

<h2>When a diploma-style programme makes sense</h2>
<p>A longer programme suits you when you want breadth, structure and progression:</p>
<ul>
<li>The <a href="/courses/advanced-diploma-software-engineering">Advanced Diploma in Software Engineering</a> runs for two years across four terms: Year 1 builds programming, web, database and Linux foundations; Year 2 specialises in Java or .NET application development, then one of several Term 4 pathways.</li>
<li>The <a href="/courses/aptech-certified-network-specialist">Aptech Certified Network Specialist (ACNS)</a> has four terms and 692 instructional hours, moving from hardware and networking fundamentals to Azure administration, enterprise routing and ethical hacking.</li>
<li><a href="/courses/smart-pro">Smart Pro (ACNPRO)</a> combines a 146-hour foundation with a 200-hour specialisation in Data Science, AI &amp; Machine Learning, or Software Testing.</li>
</ul>

<h2>Common situations</h2>
<ul>
<li><strong>"I use Excel at work and want better reports."</strong> A short course such as Advanced Excel 2019.</li>
<li><strong>"I want to build websites."</strong> Start with Responsive Web Development; consider the diploma if you want a broader software career.</li>
<li><strong>"I am starting from zero and want to become a software engineer."</strong> A structured programme like the Advanced Diploma in Software Engineering; see <a href="/insights/how-to-become-a-software-developer-in-nigeria">how to become a software developer in Nigeria</a>.</li>
<li><strong>"I'm drawn to networking or security."</strong> Start with a short Linux or Windows Server course or go straight to ACNS; see <a href="/insights/what-is-cybersecurity-and-why-it-matters">What Is Cybersecurity?</a></li>
<li><strong>"I am interested in data."</strong> Begin with Excel and SQL, then consider Smart Pro; see <a href="/insights/data-analytics-vs-data-science">Data Analytics vs Data Science</a>.</li>
</ul>

<h2>Not sure? Take a first step</h2>
<p>You do not have to decide perfectly. The Program Finder on the <a href="/">homepage</a> gives a quick starting recommendation based on your interests and how much time you can commit, you can browse the <a href="/courses">full course catalogue</a>, and the admissions team can <a href="/contact">talk through your situation</a>. If you plan to study something technical, our <a href="/insights/study-tips-for-learning-to-code">study tips for learning to code</a> will help you get started on the right foot.</p>$body$ else content end,
  seo_description = case when seo_description = 'A short, focused course and a longer diploma programme solve different problems. How to work out which one fits your situation.' then 'Short course or diploma? Compare scope, time commitment and starting point, with real examples from APTECH Abeokuta''s course lengths and programmes.' else seo_description end
where slug = 'choosing-between-short-course-and-diploma' and content_type = 'news' and category = 'Student Guides'
  and (md5(content) = 'f93a9f5d21a722672e4a007933865cfe'
    or seo_description = 'A short, focused course and a longer diploma programme solve different problems. How to work out which one fits your situation.');

commit;
