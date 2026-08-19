// Generates placeholder cover artwork for the seeded catalogue.
//
// Random stock photos made the storefront look like a travel blog. These are flat,
// on-brand SVG jackets that read as books and stationery, so the layout can be judged
// on its own terms. Replace them with real photography before launch — the products
// table only stores a URL, so swapping is a data change, not a code change.
//
//   node scripts/generate-covers.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "covers");

const PALETTES = [
  { bg: "#2F4F3E", ink: "#F7F3EA", rule: "#7E9E8E" },
  { bg: "#7A2230", ink: "#F7F3EA", rule: "#C96F4A" },
  { bg: "#1F3347", ink: "#EFF2F5", rule: "#7F9DB5" },
  { bg: "#C96F4A", ink: "#2A1A12", rule: "#7A3B22" },
  { bg: "#E8DCC6", ink: "#2A2620", rule: "#B08238" },
  { bg: "#3A3630", ink: "#F2EDE2", rule: "#B08238" },
  { bg: "#7E9E8E", ink: "#17251E", rule: "#2F4F3E" },
  { bg: "#B08238", ink: "#241B0C", rule: "#6B4E1D" },
  { bg: "#4A3B5C", ink: "#F1ECF5", rule: "#A08CB8" },
];

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Greedy wrap so long titles break across lines instead of overflowing. */
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

function hashOf(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function bookCover({ title, author, palette }) {
  const lines = wrap(title, 15);
  const fontSize = lines.length > 3 ? 40 : lines.length > 2 ? 46 : 54;
  const startY = 300 - ((lines.length - 1) * fontSize * 1.12) / 2;

  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="80" y="${startY + i * fontSize * 1.12}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="${palette.ink}">${escape(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="854" viewBox="0 0 640 854" role="img" aria-label="${escape(title)}">
  <rect width="640" height="854" fill="${palette.bg}"/>
  <rect x="34" y="0" width="3" height="854" fill="${palette.rule}" opacity="0.5"/>
  <rect x="80" y="120" width="120" height="4" fill="${palette.rule}"/>
  ${titleLines}
  ${author ? `<text x="80" y="740" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="1.5" fill="${palette.ink}" opacity="0.75">${escape(author.toUpperCase())}</text>` : ""}
  <text x="80" y="790" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="3" fill="${palette.ink}" opacity="0.5">LIVRO ARCHIVE</text>
</svg>`;
}

function stationeryCover({ title, palette }) {
  const lines = wrap(title, 18);
  const startY = 470 - ((lines.length - 1) * 30) / 2;
  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="320" y="${startY + i * 34}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="${palette.ink}">${escape(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="854" viewBox="0 0 640 854" role="img" aria-label="${escape(title)}">
  <rect width="640" height="854" fill="${palette.bg}"/>
  <rect x="210" y="150" width="220" height="270" rx="10" fill="${palette.ink}" opacity="0.92"/>
  <rect x="210" y="150" width="34" height="270" rx="10" fill="${palette.rule}"/>
  <rect x="272" y="212" width="120" height="5" rx="2.5" fill="${palette.bg}" opacity="0.35"/>
  <rect x="272" y="240" width="120" height="5" rx="2.5" fill="${palette.bg}" opacity="0.35"/>
  <rect x="272" y="268" width="86" height="5" rx="2.5" fill="${palette.bg}" opacity="0.35"/>
  ${titleLines}
  <text x="320" y="790" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="3" fill="${palette.ink}" opacity="0.5">LIVRO ARCHIVE</text>
</svg>`;
}

const PRODUCTS = [
  ["the-midnight-library", "The Midnight Library", "Matt Haig", "book"],
  ["a-thousand-splendid-suns", "A Thousand Splendid Suns", "Khaled Hosseini", "book"],
  ["the-secret-history", "The Secret History", "Donna Tartt", "book"],
  ["normal-people", "Normal People", "Sally Rooney", "book"],
  ["circe", "Circe", "Madeline Miller", "book"],
  ["the-kite-runner", "The Kite Runner", "Khaled Hosseini", "book"],
  ["purple-hibiscus", "Purple Hibiscus", "Chimamanda Ngozi Adichie", "book"],
  ["half-of-a-yellow-sun", "Half of a Yellow Sun", "Chimamanda Ngozi Adichie", "book"],
  ["things-fall-apart", "Things Fall Apart", "Chinua Achebe", "book"],
  ["the-alchemist", "The Alchemist", "Paulo Coelho", "book"],
  ["project-hail-mary", "Project Hail Mary", "Andy Weir", "book"],
  ["klara-and-the-sun", "Klara and the Sun", "Kazuo Ishiguro", "book"],
  ["sapiens", "Sapiens", "Yuval Noah Harari", "book"],
  ["atomic-habits", "Atomic Habits", "James Clear", "book"],
  ["educated", "Educated", "Tara Westover", "book"],
  ["quiet", "Quiet", "Susan Cain", "book"],
  ["think-again", "Think Again", "Adam Grant", "book"],
  ["born-a-crime", "Born a Crime", "Trevor Noah", "book"],
  ["the-body-keeps-the-score", "The Body Keeps the Score", "Bessel van der Kolk", "book"],
  ["where-the-wild-things-are", "Where the Wild Things Are", "Maurice Sendak", "book"],
  ["charlottes-web", "Charlotte's Web", "E.B. White", "book"],
  ["matilda", "Matilda", "Roald Dahl", "book"],
  ["the-gruffalo", "The Gruffalo", "Julia Donaldson", "book"],
  ["goodnight-moon", "Goodnight Moon", "Margaret Wise Brown", "book"],
  ["essential-mathematics-sss1", "Essential Mathematics SSS1", "A.J.S. Oluwasanmi", "book"],
  ["new-general-english-3", "New General English 3", "L.A. Ward", "book"],
  ["intro-to-organic-chemistry", "Introduction to Organic Chemistry", "William H. Brown", "book"],
  ["principles-of-economics", "Principles of Economics", "N. Gregory Mankiw", "book"],
  ["calculus-early-transcendentals", "Calculus: Early Transcendentals", "James Stewart", "book"],
  ["leather-bound-journal", "Leather-Bound Journal A5", null, "stationery"],
  ["kraft-composition-notebook", "Kraft Composition Notebook", null, "stationery"],
  ["bullet-journal-dotted", "Bullet Journal Dotted A5", null, "stationery"],
  ["pocket-notebook-3pack", "Pocket Notebook 3 Pack", null, "stationery"],
  ["gel-pen-set-12", "Gel Pen Set 12 Colours", null, "stationery"],
  ["fine-liner-set-8", "Fine Liner Pens 8 Pack", null, "stationery"],
  ["watercolour-set-24", "Watercolour Set 24 Colours", null, "stationery"],
  ["mechanical-pencil-set", "Mechanical Pencil Set", null, "stationery"],
  ["sketchbook-a4", "Sketchbook A4 120gsm", null, "stationery"],
  ["single-highlighter-marker", "Highlighter Marker", null, "stationery"],
  ["whiteboard-marker-4pack", "Whiteboard Marker 4 Pack", null, "stationery"],
  ["a4-ruled-refill-pad", "A4 Ruled Refill Pad", null, "stationery"],
  ["classroom-stapler", "Classroom Stapler", null, "stationery"],
  ["geometry-set", "Geometry Set", null, "stationery"],
  ["sticky-notes-multi", "Sticky Notes Multicolour", null, "stationery"],
];

await mkdir(OUT, { recursive: true });

for (const [slug, title, author, type] of PRODUCTS) {
  const palette = PALETTES[hashOf(slug) % PALETTES.length];
  const svg =
    type === "book"
      ? bookCover({ title, author, palette })
      : stationeryCover({ title, palette });
  await writeFile(join(OUT, `${slug}.svg`), svg, "utf8");
}

console.log(`Wrote ${PRODUCTS.length} covers to public/covers/`);
