-- Dummy catalog data for development/demo purposes — real books/stationery with
-- placeholder cover art (picsum.photos, seeded per product for a consistent look).
-- Safe to delete later: everything here is tagged with a recognizable price/stock
-- pattern and normal slugs, nothing production-critical depends on these rows.

do $$
declare
  cat_fiction uuid;
  cat_nonfiction uuid;
  cat_childrens uuid;
  cat_textbooks uuid;
  cat_notebooks uuid;
  cat_writing uuid;
  cat_classroom uuid;

  p_id uuid;
  p2_id uuid;
  p3_id uuid;
  bundle_id uuid;
begin
  select id into cat_fiction from public.categories where slug = 'fiction';
  select id into cat_nonfiction from public.categories where slug = 'non-fiction';
  select id into cat_childrens from public.categories where slug = 'childrens-books';
  select id into cat_textbooks from public.categories where slug = 'textbooks';
  select id into cat_notebooks from public.categories where slug = 'notebooks-journals';
  select id into cat_writing from public.categories where slug = 'writing-drawing';
  select id into cat_classroom from public.categories where slug = 'classroom-supplies';

  -- ── Fiction ──────────────────────────────────────────────────────────────
  insert into public.products (slug, title, author, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description)
  values
    ('the-midnight-library', 'The Midnight Library', 'Matt Haig', 'book', cat_fiction, 8500, 9500, 34, 'active', true, 'Between life and death there is a library, and within that library, the shelves go on forever.'),
    ('a-thousand-splendid-suns', 'A Thousand Splendid Suns', 'Khaled Hosseini', 'book', cat_fiction, 7800, null, 22, 'active', true, 'A powerful story of two women in Afghanistan, bound together by war, loss and hope.'),
    ('the-secret-history', 'The Secret History', 'Donna Tartt', 'book', cat_fiction, 9200, null, 18, 'active', false, 'A group of classics students at a New England college fall under the spell of a charismatic professor.'),
    ('normal-people', 'Normal People', 'Sally Rooney', 'book', cat_fiction, 6900, 7900, 41, 'active', true, 'A story of mutual fascination, friendship and love between two Irish teenagers.'),
    ('circe', 'Circe', 'Madeline Miller', 'book', cat_fiction, 8200, null, 27, 'active', false, 'In the house of Helios, god of the sun, a daughter is born who is unlike any before her.'),
    ('the-kite-runner', 'The Kite Runner', 'Khaled Hosseini', 'book', cat_fiction, 7200, null, 30, 'active', false, 'An epic tale of fathers and sons, of friendship and betrayal, set against Afghanistan''s turbulent history.'),
    ('purple-hibiscus', 'Purple Hibiscus', 'Chimamanda Ngozi Adichie', 'book', cat_fiction, 6500, null, 25, 'active', true, 'A story of a young girl coming of age under the shadow of a repressive father in postcolonial Nigeria.'),
    ('half-of-a-yellow-sun', 'Half of a Yellow Sun', 'Chimamanda Ngozi Adichie', 'book', cat_fiction, 7500, null, 19, 'active', false, 'A masterly, haunting new novel about a passionate and gifted man, and the women who love him.'),
    ('things-fall-apart', 'Things Fall Apart', 'Chinua Achebe', 'book', cat_fiction, 5900, null, 50, 'active', false, 'The story of Okonkwo, a leader and local wrestling champion in his village, and the coming of colonialism.'),
    ('the-alchemist', 'The Alchemist', 'Paulo Coelho', 'book', cat_fiction, 5500, 6500, 60, 'active', true, 'A magical fable about following your dream, and listening to your heart.'),
    ('project-hail-mary', 'Project Hail Mary', 'Andy Weir', 'book', cat_fiction, 9900, null, 15, 'active', false, 'A lone astronaut must save the earth from disaster in this cinematic thriller.'),
    ('klara-and-the-sun', 'Klara and the Sun', 'Kazuo Ishiguro', 'book', cat_fiction, 8700, null, 12, 'active', false, 'The story of Klara, an Artificial Friend with outstanding observational qualities.');

  -- ── Non-Fiction ──────────────────────────────────────────────────────────
  insert into public.products (slug, title, author, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description) values
    ('sapiens', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'book', cat_nonfiction, 9800, 11000, 33, 'active', true, 'A sweeping history of the human species from the Stone Age to the present.'),
    ('atomic-habits', 'Atomic Habits', 'James Clear', 'book', cat_nonfiction, 8900, 9900, 55, 'active', true, 'An easy and proven way to build good habits and break bad ones.'),
    ('educated', 'Educated', 'Tara Westover', 'book', cat_nonfiction, 8300, null, 20, 'active', false, 'A memoir about a woman who leaves her survivalist family and eventually earns a PhD from Cambridge.'),
    ('quiet', 'Quiet: The Power of Introverts', 'Susan Cain', 'book', cat_nonfiction, 7600, null, 17, 'active', false, 'An examination of how introverts are misunderstood and undervalued in a world that can''t stop talking.'),
    ('think-again', 'Think Again', 'Adam Grant', 'book', cat_nonfiction, 8100, null, 24, 'active', false, 'The power of knowing what you don''t know.'),
    ('born-a-crime', 'Born a Crime', 'Trevor Noah', 'book', cat_nonfiction, 7400, null, 29, 'active', true, 'Stories from a South African childhood, sharp, funny and moving.'),
    ('the-body-keeps-the-score', 'The Body Keeps the Score', 'Bessel van der Kolk', 'book', cat_nonfiction, 9400, null, 14, 'active', false, 'Brain, mind and body in the healing of trauma.');

  -- ── Children's ───────────────────────────────────────────────────────────
  insert into public.products (slug, title, author, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description) values
    ('where-the-wild-things-are', 'Where the Wild Things Are', 'Maurice Sendak', 'book', cat_childrens, 4200, null, 40, 'active', true, 'A classic tale of Max and his wild rumpus with the Wild Things.'),
    ('charlottes-web', 'Charlotte''s Web', 'E.B. White', 'book', cat_childrens, 4500, null, 38, 'active', false, 'The story of a pig named Wilbur and his friendship with a barn spider named Charlotte.'),
    ('matilda', 'Matilda', 'Roald Dahl', 'book', cat_childrens, 4800, 5500, 45, 'active', true, 'A brilliant, book-loving girl with extraordinary powers.'),
    ('the-gruffalo', 'The Gruffalo', 'Julia Donaldson', 'book', cat_childrens, 3900, null, 60, 'active', false, 'A mouse takes a walk through the deep dark wood, and a fox, an owl and a snake all try to eat him.'),
    ('goodnight-moon', 'Goodnight Moon', 'Margaret Wise Brown', 'book', cat_childrens, 3500, null, 33, 'active', false, 'A gentle bedtime classic loved by generations.');

  -- ── Textbooks ────────────────────────────────────────────────────────────
  insert into public.products (slug, title, author, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description) values
    ('essential-mathematics-sss1', 'Essential Mathematics for Senior Secondary Schools 1', 'A.J.S. Oluwasanmi', 'book', cat_textbooks, 6500, null, 80, 'active', false, 'Comprehensive coverage of the SSS1 mathematics curriculum with worked examples.'),
    ('new-general-english-3', 'New General English for Senior Secondary Schools 3', 'L.A. Ward', 'book', cat_textbooks, 6200, null, 65, 'active', false, 'Grammar, comprehension and composition practice for senior secondary students.'),
    ('intro-to-organic-chemistry', 'Introduction to Organic Chemistry', 'William H. Brown', 'book', cat_textbooks, 15500, 17000, 12, 'active', false, 'A foundational text on organic chemistry for undergraduate students.'),
    ('principles-of-economics', 'Principles of Economics', 'N. Gregory Mankiw', 'book', cat_textbooks, 18900, null, 9, 'active', false, 'A clear, accessible introduction to micro- and macroeconomics.'),
    ('calculus-early-transcendentals', 'Calculus: Early Transcendentals', 'James Stewart', 'book', cat_textbooks, 21500, 24000, 6, 'active', false, 'The definitive calculus text used across universities worldwide.');

  -- ── Notebooks & Journals ─────────────────────────────────────────────────
  insert into public.products (slug, title, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description) values
    ('leather-bound-journal', 'Leather-Bound Journal — A5', 'stationery', cat_notebooks, 5200, null, 70, 'active', true, 'A refillable A5 journal with a soft leather cover and 200 dotted pages.')
    returning id into p_id;
  insert into public.product_variants (product_id, name, price_override, stock_quantity, sort_order) values
    (p_id, 'Tan', null, 25, 1),
    (p_id, 'Black', null, 30, 2),
    (p_id, 'Forest Green', 200, 15, 3);

  insert into public.products (slug, title, product_type, category_id, base_price, stock_quantity, status, is_featured, description) values
    ('kraft-composition-notebook', 'Kraft Composition Notebook', 'stationery', cat_notebooks, 1800, 120, 'active', false, '100-page ruled composition notebook with a recycled kraft cover.'),
    ('bullet-journal-dotted', 'Bullet Journal — Dotted, A5', 'stationery', cat_notebooks, 4500, 55, 'active', true, 'Premium dot-grid journal for planning, sketching and bullet journaling.'),
    ('pocket-notebook-3pack', 'Pocket Notebook — 3 Pack', 'stationery', cat_notebooks, 2200, 90, 'active', false, 'Three slim pocket notebooks, perfect for on-the-go notes.');

  -- ── Writing & Drawing ────────────────────────────────────────────────────
  insert into public.products (slug, title, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description) values
    ('gel-pen-set-12', 'Gel Pen Set — 12 Colours', 'stationery', cat_writing, 3200, 3800, 100, 'active', true, 'Smooth-writing gel pens in twelve vivid, non-bleed colours.')
    returning id into p_id;
  insert into public.products (slug, title, product_type, category_id, base_price, stock_quantity, status, is_featured, description) values
    ('fine-liner-set-8', 'Fine Liner Drawing Pens — 8 Pack', 'stationery', cat_writing, 4100, 60, 'active', false, 'Waterproof fine-liner pens in a range of nib sizes, ideal for sketching.'),
    ('watercolour-set-24', 'Watercolour Paint Set — 24 Colours', 'stationery', cat_writing, 6800, 30, 'active', true, 'A portable watercolour set with a built-in mixing palette and brush.'),
    ('mechanical-pencil-set', 'Mechanical Pencil Set', 'stationery', cat_writing, 2600, 75, 'active', false, 'A set of 3 mechanical pencils with a tube of spare 0.5mm leads.'),
    ('sketchbook-a4', 'Sketchbook — A4, 120gsm', 'stationery', cat_writing, 3900, 48, 'active', false, 'Heavyweight A4 sketchbook, suitable for pencil, ink and light wash.');

  -- Marker used later in a bundle
  insert into public.products (slug, title, product_type, category_id, base_price, stock_quantity, status, is_featured, description) values
    ('single-highlighter-marker', 'Highlighter Marker', 'stationery', cat_writing, 800, 200, 'active', false, 'A single chisel-tip highlighter marker.')
  returning id into p2_id;

  -- ── Classroom Supplies ───────────────────────────────────────────────────
  insert into public.products (slug, title, product_type, category_id, base_price, compare_at_price, stock_quantity, status, is_featured, description) values
    ('whiteboard-marker-4pack', 'Whiteboard Marker — 4 Pack', 'stationery', cat_classroom, 2400, null, 85, 'active', false, 'Low-odour dry-erase markers in black, blue, red and green.'),
    ('a4-ruled-refill-pad', 'A4 Ruled Refill Pad — 400 Sheets', 'stationery', cat_classroom, 2900, 3400, 66, 'active', false, 'A high-capacity refill pad for binders, ruled and hole-punched.'),
    ('classroom-stapler', 'Classroom Stapler', 'stationery', cat_classroom, 3300, null, 40, 'active', false, 'A compact, reliable stapler built for daily classroom use.'),
    ('geometry-set', 'Geometry Set — Compass, Protractor & Rulers', 'stationery', cat_classroom, 2100, null, 95, 'active', true, 'Everything needed for maths class in one tidy case.'),
    ('sticky-notes-multi', 'Sticky Notes — Multicolour Pack', 'stationery', cat_classroom, 1500, null, 150, 'active', false, 'Six pads of sticky notes in assorted colours and sizes.');

  -- ── A couple of variant-bearing books (paperback / hardcover) ────────────
  update public.products set stock_quantity = 34 where slug = 'the-midnight-library';
  select id into p_id from public.products where slug = 'the-midnight-library';
  insert into public.product_variants (product_id, name, price_override, stock_quantity, sort_order) values
    (p_id, 'Paperback', null, 24, 1),
    (p_id, 'Hardcover', 12500, 10, 2);

  select id into p_id from public.products where slug = 'sapiens';
  insert into public.product_variants (product_id, name, price_override, stock_quantity, sort_order) values
    (p_id, 'Paperback', null, 20, 1),
    (p_id, 'Hardcover', 13500, 13, 2);

  -- ── Bundles: "complete the set" upsells ───────────────────────────────────
  select id into p_id from public.products where slug = 'the-alchemist';
  select id into p2_id from public.products where slug = 'kraft-composition-notebook';
  select id into p3_id from public.products where slug = 'single-highlighter-marker';
  insert into public.bundles (primary_product_id, name, description, is_active)
  values (p_id, 'Reader''s Companion Set', 'A notebook and highlighter to go with your new read.', true)
  returning id into bundle_id;
  insert into public.bundle_items (bundle_id, product_id, quantity, price_override, sort_order) values
    (bundle_id, p2_id, 1, 900, 1),
    (bundle_id, p3_id, 1, 0, 2);

  select id into p_id from public.products where slug = 'essential-mathematics-sss1';
  select id into p2_id from public.products where slug = 'geometry-set';
  select id into p3_id from public.products where slug = 'mechanical-pencil-set';
  insert into public.bundles (primary_product_id, name, description, is_active)
  values (p_id, 'Maths Class Kit', 'Everything you need alongside the textbook — at a better price together.', true)
  returning id into bundle_id;
  insert into public.bundle_items (bundle_id, product_id, quantity, price_override, sort_order) values
    (bundle_id, p2_id, 1, 1800, 1),
    (bundle_id, p3_id, 1, 2200, 2);

  select id into p_id from public.products where slug = 'bullet-journal-dotted';
  select id into p2_id from public.products where slug = 'gel-pen-set-12';
  insert into public.bundles (primary_product_id, name, description, is_active)
  values (p_id, 'Journaling Starter Pack', 'A dotted journal and a full set of gel pens to start with.', true)
  returning id into bundle_id;
  insert into public.bundle_items (bundle_id, product_id, quantity, price_override, sort_order) values
    (bundle_id, p2_id, 1, 2800, 1);

  -- ── Placeholder cover art for every seeded product (picsum, seeded by slug) ─
  insert into public.product_images (product_id, url, alt, sort_order)
  select id, 'https://picsum.photos/seed/' || slug || '/640/854', title, 0
  from public.products
  where slug in (
    'the-midnight-library','a-thousand-splendid-suns','the-secret-history','normal-people','circe',
    'the-kite-runner','purple-hibiscus','half-of-a-yellow-sun','things-fall-apart','the-alchemist',
    'project-hail-mary','klara-and-the-sun','sapiens','atomic-habits','educated','quiet','think-again',
    'born-a-crime','the-body-keeps-the-score','where-the-wild-things-are','charlottes-web','matilda',
    'the-gruffalo','goodnight-moon','essential-mathematics-sss1','new-general-english-3',
    'intro-to-organic-chemistry','principles-of-economics','calculus-early-transcendentals',
    'leather-bound-journal','kraft-composition-notebook','bullet-journal-dotted','pocket-notebook-3pack',
    'gel-pen-set-12','fine-liner-set-8','watercolour-set-24','mechanical-pencil-set','sketchbook-a4',
    'single-highlighter-marker','whiteboard-marker-4pack','a4-ruled-refill-pad','classroom-stapler',
    'geometry-set','sticky-notes-multi'
  );
end $$;
