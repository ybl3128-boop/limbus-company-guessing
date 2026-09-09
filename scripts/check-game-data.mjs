import { readFile } from "node:fs/promises";

const identities = JSON.parse(
  await readFile(new URL("../data/identities.json", import.meta.url), "utf8"),
);
const puzzles = JSON.parse(
  await readFile(new URL("../data/puzzles.json", import.meta.url), "utf8"),
);

const ids = new Set(identities.map((identity) => identity.id));
const errors = [];

if (!identities.length) {
  errors.push("No identities found.");
}

for (const identity of identities) {
  if (!Array.isArray(identity.affiliation) || !identity.affiliation.length) {
    errors.push(`${identity.id}: affiliation must be a non-empty array.`);
  }
  if (!Array.isArray(identity.keywords)) {
    errors.push(`${identity.id}: keywords must be an array.`);
  }
  if (!identity.sinner || !identity.season || !identity.skill3Sin || !identity.skill3AttackType) {
    errors.push(`${identity.id}: missing required clue field.`);
  }
  if (/^(Cheery Chickies|Early Elephants|Perky Penguins) /.test(identity.name)) {
    errors.push(`${identity.id}: non-equippable event variant included.`);
  }
}

const dates = Object.keys(puzzles).sort();
for (const [date, identityId] of Object.entries(puzzles)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push(`Invalid puzzle date: ${date}`);
  }
  if (!ids.has(identityId)) {
    errors.push(`${date}: unknown identity ${identityId}.`);
  }
}

for (let index = 0; index < dates.length; index += 1) {
  const recent = new Set(
    dates
      .slice(Math.max(0, index - 30), index)
      .map((date) => puzzles[date]),
  );
  if (recent.has(puzzles[dates[index]])) {
    errors.push(`${dates[index]}: identity repeated within 30 days.`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Game data OK: ${identities.length} identities, ${dates.length} scheduled UTC puzzles.`,
);
