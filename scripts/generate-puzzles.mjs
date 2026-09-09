import { readFile, writeFile } from "node:fs/promises";

const IDENTITY_FILE = new URL("../data/identities.json", import.meta.url);
const PUZZLE_FILE = new URL("../data/puzzles.json", import.meta.url);
const DAYS_TO_GENERATE = Number(process.env.PUZZLE_DAYS || 365);
const START_DATE = process.env.PUZZLE_START || utcDateKey(new Date());

const identities = JSON.parse(await readFile(IDENTITY_FILE, "utf8"));
const currentPuzzles = JSON.parse(await readFile(PUZZLE_FILE, "utf8"));
const validIds = new Set(identities.map((identity) => identity.id));
const puzzles = Object.fromEntries(
  Object.entries(currentPuzzles).filter(([, id]) => validIds.has(id)),
);
const recentIds = [];

for (let index = 0; index < DAYS_TO_GENERATE; index += 1) {
  const dateKey = addDays(START_DATE, index);
  if (puzzles[dateKey]) {
    recentIds.push(puzzles[dateKey]);
    continue;
  }

  const recentSet = new Set(recentIds.slice(-Math.min(30, identities.length - 1)));
  const candidates = identities
    .filter((identity) => !recentSet.has(identity.id))
    .sort((left, right) => {
      const leftScore = hash(`${dateKey}:${left.id}`);
      const rightScore = hash(`${dateKey}:${right.id}`);
      return leftScore - rightScore;
    });
  const selected = candidates[0] || identities[index % identities.length];
  puzzles[dateKey] = selected.id;
  recentIds.push(selected.id);
}

await writeFile(PUZZLE_FILE, `${JSON.stringify(puzzles, null, 2)}\n`, "utf8");
console.log(
  `Generated ${DAYS_TO_GENERATE} UTC puzzle dates from ${START_DATE}. Total scheduled: ${Object.keys(puzzles).length}.`,
);

function utcDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateKey(date);
}

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
