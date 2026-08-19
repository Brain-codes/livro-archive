-- Real opening inventory, plus the column it needs.
--
-- The supplied sheet has a wholesale and a retail figure per title. Retail is what the
-- customer pays (base_price). Wholesale is what the shop paid — that is cost of goods,
-- NOT a "was" price, so it deliberately does not go in compare_at_price: showing it
-- struck through would tell customers they could once have bought at cost. It gets its
-- own column so margin is reportable.

alter table public.products
  add column if not exists cost_price numeric(12,2) check (cost_price >= 0);

comment on column public.products.cost_price is
  'Wholesale / cost of goods. Never shown to customers — used for margin reporting.';

-- ─────────────────────────────────────────────────────────────────────────
-- Promote the new account to Super Admin and confirm its email so it can sign
-- in immediately.
-- ─────────────────────────────────────────────────────────────────────────
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'emmany4567@gmail.com';

update public.profiles
set role = 'admin',
    admin_role_id = (select id from public.admin_roles where slug = 'super-admin')
where email = 'emmany4567@gmail.com';

-- ─────────────────────────────────────────────────────────────────────────
-- Opening stock. Titles and author names are normalised from the sheet — the
-- corrections are listed in the handover notes, not applied silently.
--
-- stock_quantity is a PLACEHOLDER of 10 per title: the sheet carried no quantities.
-- Set real counts in the console under Inventory before going live.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  cat_nonfiction uuid;
begin
  select id into cat_nonfiction from public.categories where slug = 'non-fiction';

  insert into public.products
    (slug, title, author, product_type, category_id, cost_price, base_price,
     stock_quantity, status, is_featured, description)
  values
    ('eat-that-frog', 'Eat That Frog!', 'Brian Tracy', 'book', cat_nonfiction, 2000, 3500, 10, 'active', true,
     'Twenty-one ways to stop procrastinating and get more done in less time.'),
    ('deep-work', 'Deep Work', 'Cal Newport', 'book', cat_nonfiction, 4800, 6800, 10, 'active', true,
     'Rules for focused success in a distracted world.'),
    ('get-smart', 'Get Smart!', 'Brian Tracy', 'book', cat_nonfiction, 2400, 3900, 10, 'active', false,
     'How to think and act like the most successful and highest-paid people in every field.'),
    ('success-is-not-an-accident', 'Success Is Not an Accident', 'Tommy Newberry', 'book', cat_nonfiction, 3000, 4500, 10, 'active', false,
     'Change your choices, change your life.'),
    ('who-moved-my-cheese-for-teens', 'Who Moved My Cheese? for Teens', 'Spencer Johnson', 'book', cat_nonfiction, 1850, 3000, 10, 'active', false,
     'An amazing way to change and win, written for younger readers.'),
    ('the-richest-man-in-babylon', 'The Richest Man in Babylon', 'George S. Clason', 'book', cat_nonfiction, 2300, 3800, 10, 'active', true,
     'The success secrets of the ancients, told as parables set in old Babylon.'),
    ('think-and-grow-rich', 'Think and Grow Rich', 'Napoleon Hill', 'book', cat_nonfiction, 3000, 4500, 10, 'active', true,
     'The landmark study of what the most successful people have in common.'),
    ('ikigai', 'Ikigai: The Japanese Secret to a Long and Happy Life', 'Héctor García and Francesc Miralles', 'book', cat_nonfiction, 2500, 4000, 10, 'active', true,
     'The Japanese concept of finding the reason you get up in the morning.'),
    ('the-mountain-is-you', 'The Mountain Is You', 'Brianna Wiest', 'book', cat_nonfiction, 3300, 4800, 10, 'active', false,
     'Transforming self-sabotage into self-mastery.'),
    ('zero-to-one', 'Zero to One', 'Peter Thiel', 'book', cat_nonfiction, 3000, 4500, 10, 'active', true,
     'Notes on startups, or how to build the future.'),
    ('the-power-of-self-discipline', 'The Power of Self-Discipline', 'Brian Tracy', 'book', cat_nonfiction, 2500, 4000, 10, 'active', false,
     'No excuses — the power of self-discipline for success in your life.'),
    ('7-strategies-for-wealth-and-happiness', '7 Strategies for Wealth & Happiness', 'Jim Rohn', 'book', cat_nonfiction, 2000, 3500, 10, 'active', false,
     'Power ideas from America''s foremost business philosopher.'),
    ('built-to-last', 'Built to Last', 'Jim Collins', 'book', cat_nonfiction, 3500, 5000, 10, 'active', false,
     'Successful habits of visionary companies.'),
    ('making-it-big', 'Making It Big', 'Femi Otedola', 'book', cat_nonfiction, 13000, 15000, 10, 'active', true,
     'Lessons on life, business and resilience from one of Nigeria''s best-known entrepreneurs.'),
    ('steal-like-an-artist', 'Steal Like an Artist', 'Austin Kleon', 'book', cat_nonfiction, 2500, 4000, 10, 'active', false,
     'Ten things nobody told you about being creative.'),
    ('never-split-the-difference', 'Never Split the Difference', 'Chris Voss', 'book', cat_nonfiction, 2500, 4500, 10, 'active', true,
     'Negotiating as if your life depended on it, from a former FBI hostage negotiator.'),
    ('an-enemy-called-average', 'An Enemy Called Average', 'John L. Mason', 'book', cat_nonfiction, 2500, 4000, 10, 'active', false,
     'Practical nuggets of wisdom to help you break out of the ordinary.'),
    ('7-habits-of-highly-effective-people', 'The 7 Habits of Highly Effective People', 'Stephen R. Covey', 'book', cat_nonfiction, 5000, 6500, 10, 'active', true,
     'Powerful lessons in personal change.'),
    ('as-a-man-thinketh', 'As a Man Thinketh', 'James Allen', 'book', cat_nonfiction, 2500, 3900, 10, 'active', false,
     'A short, enduring meditation on how thought shapes character and circumstance.'),
    ('the-diary-of-a-ceo', 'The Diary of a CEO', 'Steven Bartlett', 'book', cat_nonfiction, 6000, 7800, 10, 'active', true,
     'The 33 laws of business and life.')
  on conflict (slug) do update
    set title = excluded.title,
        author = excluded.author,
        cost_price = excluded.cost_price,
        base_price = excluded.base_price,
        description = excluded.description;

  -- Cover art generated by scripts/generate-covers.mjs.
  insert into public.product_images (product_id, url, alt, sort_order)
  select p.id, '/covers/' || p.slug || '.svg', p.title, 0
  from public.products p
  where p.slug in (
    'eat-that-frog','deep-work','get-smart','success-is-not-an-accident',
    'who-moved-my-cheese-for-teens','the-richest-man-in-babylon','think-and-grow-rich',
    'ikigai','the-mountain-is-you','zero-to-one','the-power-of-self-discipline',
    '7-strategies-for-wealth-and-happiness','built-to-last','making-it-big',
    'steal-like-an-artist','never-split-the-difference','an-enemy-called-average',
    '7-habits-of-highly-effective-people','as-a-man-thinketh','the-diary-of-a-ceo'
  )
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Hide the placeholder catalogue now that real stock exists. Drafted, not deleted,
-- so nothing is lost — restore any time with:
--   update public.products set status = 'active' where slug in (...);
-- ─────────────────────────────────────────────────────────────────────────
update public.products
set status = 'draft'
where slug in (
  'the-midnight-library','a-thousand-splendid-suns','the-secret-history','normal-people',
  'circe','the-kite-runner','purple-hibiscus','half-of-a-yellow-sun','things-fall-apart',
  'the-alchemist','project-hail-mary','klara-and-the-sun','sapiens','atomic-habits',
  'educated','quiet','think-again','born-a-crime','the-body-keeps-the-score',
  'where-the-wild-things-are','charlottes-web','matilda','the-gruffalo','goodnight-moon',
  'essential-mathematics-sss1','new-general-english-3','intro-to-organic-chemistry',
  'principles-of-economics','calculus-early-transcendentals'
);
