import { readFile } from "node:fs/promises";

const identities = JSON.parse(
  await readFile(new URL("../data/identities.json", import.meta.url), "utf8"),
);

const nonEquippable = identities.filter((identity) =>
  /^(Cheery Chickies|Early Elephants|Perky Penguins) /.test(identity.name),
);
if (nonEquippable.length) {
  console.error(
    `Non-equippable event variants must not be included: ${nonEquippable
      .map((identity) => identity.name)
      .join(", ")}`,
  );
  process.exit(1);
}

const groups = new Map();

for (const identity of identities) {
  const key = [
    identity.sinner,
    identity.season,
    identity.affiliation,
    [...(identity.keywords || [])].sort().join(","),
    identity.skill3Sin,
    identity.skill3AttackType,
  ].join("|");
  const group = groups.get(key) || [];
  group.push(identity);
  groups.set(key, group);
}

const duplicates = [...groups.values()].filter((group) => group.length > 1);

if (!duplicates.length) {
  console.log(`No duplicate clue sets found across ${identities.length} identities.`);
  process.exit(0);
}

console.log(`Found ${duplicates.length} duplicate clue set(s):`);
for (const group of duplicates) {
  console.log(
    `- ${group
      .map((identity) => `${identity.name} (${identity.id})`)
      .join(", ")}`,
  );
}
