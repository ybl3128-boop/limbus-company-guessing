import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://limbuscompany.wiki.gg/api.php";
const OUTPUT = fileURLToPath(new URL("../data/identities.json", import.meta.url));
const KEYWORDS = new Map([
  ["Burn", "화상"],
  ["Bleed", "출혈"],
  ["Tremor", "진동"],
  ["Rupture", "파열"],
  ["Sinking", "침잠"],
  ["Poise", "호흡"],
  ["Charge", "충전"],
]);
const NON_EQUIPPABLE_PREFIXES = [
  "Cheery Chickies ",
  "Early Elephants ",
  "Perky Penguins ",
];
const TRAIT_TRANSLATIONS = new Map([
  ["Cheery Chickies", "치어리 치키스"],
  ["Early Elephants", "얼리 엘리펀츠"],
  ["Perky Penguins", "퍼키 펭귄스"],
  ["The Fingers", "손가락"],
  ["The House of Spiders", "거미집"],
  ["The Pinky", "소지"],
  ["Dihui Star", "디휘 스타"],
  ["Tiansha Star", "천살성"],
  ["The Ring", "약지"],
  ["The Ring Student", "약지 스튜던트"],
  ["The Ring Docent", "약지 도슨트"],
  ["School of Pointillism", "점묘파"],
  ["School of Fauvism", "야수파"],
  ["School of Corporism", "신체파"],
  ["The Middle", "중지"],
  ["The Thumb", "엄지"],
  ["The Index", "검지"],
  ["Great Sister", "큰누님"],
  ["Le Sette Famiglie", "7대 패밀리"],
  ["Sottocapo", "언더보스"],
  ["Smoke War", "연기 전쟁"],
  ["Bloodfiend", "혈귀"],
  ["Third Kindred", "제3권속"],
  ["Technology Liberation Alliance", "기술해방연합"],
  ["Limbus Company", "림버스 컴퍼니"],
  ["Limbus Kindergarten", "림버스 유치원"],
  ["Fixer", "해결사"],
  ["Syndicate", "조직"],
  ["Association", "협회"],
  ["N Corp.", "N사"],
  ["N Corp. Fanatic", "N사 광신도"],
  ["K Corp.", "K사"],
  ["H Corp.", "H사"],
  ["R Corp.", "R사"],
  ["R.B.", "료.고.파."],
  ["S Corp.", "S사"],
  ["T Corp.", "T사"],
  ["W Corp.", "W사"],
]);
const SINNERS = new Map([
  ["Yi Sang", "이상"],
  ["Faust", "파우스트"],
  ["Don Quixote", "돈키호테"],
  ["Ryōshū", "료슈"],
  ["Meursault", "뫼르소"],
  ["Hong Lu", "홍루"],
  ["Heathcliff", "히스클리프"],
  ["Ishmael", "이스마엘"],
  ["Rodya", "로쟈"],
  ["Rodion", "로쟈"],
  ["Sinclair", "싱클레어"],
  ["Outis", "오티스"],
  ["Gregor", "그레고르"],
]);
const SINS = new Map([
  ["Wrath", "분노"],
  ["Lust", "색욕"],
  ["Sloth", "나태"],
  ["Gluttony", "탐식"],
  ["Gloom", "우울"],
  ["Pride", "오만"],
  ["Envy", "질투"],
]);
const ATTACK_TYPES = new Map([
  ["Slash", "참격"],
  ["Pierce", "관통"],
  ["Blunt", "타격"],
]);
const AFFILIATIONS = new Map([
  ["Dawn Office", "새벽 사무소"],
  ["Blade Lineage", "검계"],
  ["Kurokumo Clan", "흑운회"],
  ["Seven Association", "세븐 협회"],
  ["Molar Office", "몰 오피스"],
  ["W Corp", "W사"],
  ["N Corp", "N사"],
  ["Zwei Association", "츠바이 협회"],
  ["Liu Association", "리우 협회"],
  ["Cinq Association", "섕크 협회"],
  ["Shi Association", "시 협회"],
  ["Dieci Association", "디에치 협회"],
  ["R Corp", "R사"],
  ["K Corp", "K사"],
]);
const NAME_REPLACEMENTS = [
  ["Cheery Chickies Class Captain", "치어리 치키스 클래스 캡틴"],
  ["Cheery Chickies Sinnerling", "치어리 치키스 수감자"],
  ["Early Elephants Class Captain", "얼리 엘리펀츠 클래스 캡틴"],
  ["Early Elephants Sinnerling", "얼리 엘리펀츠 수감자"],
  ["Perky Penguins Class Captain", "퍼키 펭귄스 클래스 캡틴"],
  ["Perky Penguins Sinnerling", "퍼키 펭귄스 수감자"],
  ["The Pinky", "소지"],
  ["The Index Proxy - Effloresced E.G.O::Procuration", "검지 대행자 - 개화 E.G.O::대행"],
  ["Lobotomy E.G.O::In the Name of Love and Hate", "로보토미 E.G.O::사랑과 증오의 이름으로"],
  ["Lobotomy E.G.O::Faint Aroma & Solitude", "로보토미 E.G.O::희미한 향기와 고독"],
  ["Lobotomy E.G.O::Hornet【Alteration】", "로보토미 E.G.O::호넷【변형】"],
  ["Lobotomy E.G.O::Red Eyes & Penitence", "로보토미 E.G.O::붉은 눈과 속죄"],
  ["Lobotomy E.G.O::The Sword Sharpened with Tears", "로보토미 E.G.O::눈물로 벼려낸 검"],
  ["N Corp. E.G.O::Contempt, Awe", "N사 E.G.O::경멸, 경외"],
  ["N Corp. E.G.O::Fell Bullet", "N사 E.G.O::흉탄"],
  ["LCE E.G.O::Ardor Blossom Star", "LCE E.G.O::홍염살"],
  ["LCE E.G.O::Dimension Shredder", "LCE E.G.O::차원찢개"],
  ["LCE E.G.O::Lantern", "LCE E.G.O::초롱"],
  ["LCE E.G.O::AEDD", "LCE E.G.O::AEDD"],
  ["Effloresced E.G.O::Spicebush", "개화 E.G.O::동백"],
  ["Lobotomy E.G.O::Red Sheet", "로보토미 E.G.O::홍적"],
  ["Lobotomy E.G.O::Sloshing", "로보토미 E.G.O::출렁임"],
  ["Lobotomy E.G.O::Sunshower", "로보토미 E.G.O::여우비"],
  ["LCB Sinner", "LCB 수감자"],
  ["Lobotomy E.G.O::Magic Bullet", "로보토미 E.G.O::마탄"],
  ["Lobotomy E.G.O::Regret", "로보토미 E.G.O::후회"],
  ["Lobotomy E.G.O::Solemn Lament", "로보토미 E.G.O::엄숙한 애도"],
  ["Lobotomy E.G.O::Lamp", "로보토미 E.G.O::램프"],
  ["Lobotomy E.G.O::Lantern", "로보토미 E.G.O::초롱"],
  ["Blade of the House of Spiders", "거미집의 검"],
  ["Blade Lineage Mentor", "검계 우두머리"],
  ["Blade Lineage Salsu", "검계 살수"],
  ["Cinq Assoc. East Section 3", "동부 섕크 협회 3과"],
  ["Cinq Assoc. West Section 3", "서부 섕크 협회 3과"],
  ["Cinq Assoc. South Section 4 Director", "남부 섕크 협회 4과 부장"],
  ["Cinq Assoc. South Section 4", "남부 섕크 협회 4과"],
  ["Cinq Assoc. South Section 5 Director", "남부 섕크 협회 5과 부장"],
  ["Dawn Office Fixer", "새벽 사무소 해결사"],
  ["Dawn Office Rep", "새벽 사무소 대표"],
  ["Dead Rabbits Boss", "데드래빗츠 보스"],
  ["Devyat' Assoc. North Section 3", "북부 제뱌찌 협회 3과"],
  ["Dieci Assoc. South Section 4 Director", "남부 디에치 협회 4과 부장"],
  ["Dieci Assoc. South Section 4", "남부 디에치 협회 4과"],
  ["District 20 Yurodivy", "20구 유로지비"],
  ["Drifting Blade of Hongyuan", "홍원 방랑무사"],
  ["Edgar Family Chief Butler", "에드가 가문 치프 버틀러"],
  ["Edgar Family Butler", "에드가 가문 버틀러"],
  ["Edgar Family Heir", "에드가 가문 승계자"],
  ["Family Hierarch Candidate", "가주 후보"],
  ["Fanghunt Office Fixer", "어금니 사무소 해결사"],
  ["Firefist Office Survivor", "불주먹 사무소 생존자"],
  ["Full-Stop Office Fixer", "마침표 사무소 해결사"],
  ["Full-Stop Office Rep", "마침표 사무소 대표"],
  ["Heishou Pack - Mao Branch Adept", "흑수 - 묘 필두"],
  ["Heishou Pack - Mao Branch", "흑수 - 묘"],
  ["Heishou Pack - Si Branch", "흑수 - 사"],
  ["Heishou Pack - Wei Branch", "흑수 - 위"],
  ["Heishou Pack - Wu Branch Adept", "흑수 - 오 필두"],
  ["Heishou Pack - You Branch Adept", "흑수 - 유 필두"],
  ["Heishou Pack - You Branch", "흑수 - 유"],
  ["G Corp. Head Manager", "G사 부장"],
  ["G Corp. Manager Corporal", "G사 일등대리"],
  ["K Corp. Class 3 Excision Staff", "K사 3등급 적출직 직원"],
  ["Hook Office Fixer", "갈고리 사무소 해결사"],
  ["Jeong's Office Rep", "정 사무소 대표"],
  ["Kurokumo Clan Captain", "흑운회 부조장"],
  ["Kurokumo Clan Wakashu", "흑운회 와카슈"],
  ["LCD OSIR Team", "LCD 현장추리팀"],
  ["Liu Assoc. South Section 4 Director", "남부 리우 협회 4과 부장"],
  ["Liu Assoc. South Section 4", "남부 리우 협회 4과"],
  ["Liu Assoc. South Section 3", "남부 리우 협회 3과"],
  ["Liu Assoc. South Section 5", "남부 리우 협회 5과"],
  ["Liu Assoc. South Section 6", "남부 리우 협회 6과"],
  ["LCA Udjat Vanguard Team 3 Leader", "LCA 우제트 선봉 3팀 팀장"],
  ["LCCB Assistant Manager", "LCCB 대리"],
  ["Lobotomy Corp. Remnant", "살아남은 로보토미 직원"],
  ["Los Mariachis Jefe", "마리아치 보스"],
  ["Molar Boatworks Fixer", "어금니 보트 센터 해결사"],
  ["Molar Office Fixer", "어금니 사무소 해결사"],
  ["N Corp. Großhammer", "N사 큰 망치"],
  ["N Corp. Kleinhammer", "N사 작은 망치"],
  ["N Corp. Mittelhammer", "N사 중간 망치"],
  ["R Corp. 4th Pack Rabbit", "R사 제 4무리 토끼팀"],
  ["R Corp. 4th Pack Rhino", "R사 제 4무리 코뿔소팀"],
  ["R.B. Chef de Cuisine", "료.고.파. 주방장"],
  ["R.B. Sous-chef", "료.고.파. 조수"],
  ["Rosespanner Workshop Fixer", "장미스패너 공방 해결사"],
  ["Rosespanner Workshop Rep", "장미스패너 공방 대표"],
  ["Seven Assoc. South Section 4", "남부 세븐 협회 4과"],
  ["Seven Assoc. South Section 6 Director", "남부 세븐 협회 6과 부장"],
  ["Seven Assoc. South Section 6", "남부 세븐 협회 6과"],
  ["Shi Assoc. South Section 5 Director", "남부 시 협회 5과 부장"],
  ["Shi Assoc. South Section 5", "남부 시 협회 5과"],
  ["The House of Spiders: The Middle Apprentice", "거미집 중지 제자"],
  ["The Index Proselyte:【Paper Slip】", "검지 수행자:【쪽지】"],
  ["The One Who Grips", "쥐는 자"],
  ["The One Who Shall Grip", "쥐어들 자"],
  ["Tingtang Gang Gangleader", "대호파 두목"],
  ["Twinhook Pirates First Mate", "쌍갈고리 해적단 부선장"],
  ["W Corp. L2 Cleanup Agent", "W사 2등급 정리 요원"],
  ["Zwei Assoc. South Section 4", "남부 츠바이 협회 4과"],
  ["Zwei Assoc. South Section 5", "남부 츠바이 협회 5과"],
  ["Zwei Assoc. South Section 6", "남부 츠바이 협회 6과"],
  ["MultiCrack Office Fixer", "멀티크랙 사무소 해결사"],
  ["MultiCrack Office Rep", "멀티크랙 사무소 대표"],
  ["Night Awls Capitano", "밤의 송곳 카피타노"],
  ["Öufi Assoc. South Section 3", "남부 외우피 협회 3과"],
  ["R Corp. 4th Pack Reindeer", "R사 제 4무리 순록팀"],
  ["S Corp. Ch'unokkun", "S사 춘오쿤"],
  ["Shi Assoc. East Section 3", "동부 시 협회 3과"],
  ["T Corp. Class 2 Collection Staff", "T사 2등급 징수직 직원"],
  ["T Corp. Class 3 Collection Staff", "T사 3등급 징수직 직원"],
  ["T Corp. Class 3 VDCU Staff", "T사 3등급 강력징수직 직원"],
  ["The Barber of La Manchaland", "라만차랜드 이발사"],
  ["The House of Spiders: The Index Nursefather", "거미집 검지 아비"],
  ["The House of Spiders: The Middle Nursefather", "거미집 중지 아비"],
  ["The House of Spiders: The Pinky Apprentice", "거미집 소지 제자"],
  ["The House of Spiders: The Ring Apprentice", "거미집 약지 제자"],
  ["The House of Spiders: The Ring Nursefather", "거미집 약지 아비"],
  ["The House of Spiders: The Thumb Apprentice", "거미집 엄지 제자"],
  ["The House of Spiders: The Thumb Nursefather", "거미집 엄지 아비"],
  ["The Lord of Hongyuan", "홍원 군주"],
  ["The Manager of La Manchaland", "라만차랜드 실장"],
  ["The Middle Big Brother", "중지 큰 형님"],
  ["The Middle Little Brother", "중지 작은 아우"],
  ["The Middle Little Sister", "중지 작은 아우"],
  ["The Pequod Captain", "피쿼드호 선장"],
  ["The Pequod First Mate", "피쿼드호 일등 항해사"],
  ["The Pequod Harpooneer", "피쿼드호 작살잡이"],
  ["The Priest of La Manchaland", "라만차랜드 신부"],
  ["The Prince of La Manchaland", "라만차랜드 왕자"],
  ["The Princess of La Manchaland", "라만차랜드 공주"],
  ["The Ring Fauvist Docent", "약지 야수파 도슨트"],
  ["The Ring Fauvist Student", "약지 야수파 스튜던트"],
  ["The Ring Pointillist Student", "약지 점묘파 스튜던트"],
  ["The Thumb East Capo IIII", "동부 엄지 카포 IIII"],
  ["The Thumb East Soldato II", "동부 엄지 솔다토 II"],
  ["W Corp. L4 Cleanup Agent - CCA", "W사 4등급 정리 요원 - CCA"],
  ["W Corp. L3 Cleanup Agent", "W사 3등급 정리 요원"],
  ["W Corp. L3 Cleanup Captain", "W사 3등급 정리 요원 팀장"],
  ["Wild Hunt", "와일드헌트"],
  ["Wuthering Heights Butler", "워더링하이츠 버틀러"],
  ["Wuthering Heights Chief Butler", "워더링하이츠 치프 버틀러"],
  ["Zwei Assoc. West Section 3", "서부 츠바이 협회 3과"],
];

const pages = await fetchIdentityPages();
const identities = [];
const batchSize = 40;

const identityPages = pages.filter(
  (page) =>
    page.title !== "Identities" &&
    !NON_EQUIPPABLE_PREFIXES.some((prefix) => page.title.startsWith(prefix)),
);

for (let start = 0; start < identityPages.length; start += batchSize) {
  const batch = identityPages.slice(start, start + batchSize);
  const sources = await fetchWikitextBatch(batch.map((page) => page.title));
  for (const page of batch) {
    const source = sources.get(page.title);
    const identity = source ? parseIdentity(page, source) : null;
    if (identity) {
      identities.push(identity);
    }
  }
  console.log(
    `Processed ${Math.min(start + batch.length, identityPages.length)}/${identityPages.length}`,
  );
}

identities.sort((a, b) => a.name.localeCompare(b.name));
await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(identities, null, 2)}\n`, "utf8");
console.log(`Wrote ${identities.length} identities to ${OUTPUT}`);

async function fetchIdentityPages() {
  const pages = [];
  let continuation = "";

  do {
    const query = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: "Category:Identities",
      cmnamespace: "0",
      cmlimit: "500",
      format: "json",
    });
    if (continuation) {
      query.set("cmcontinue", continuation);
    }

    const json = await fetchJson(`${API}?${query}`);
    pages.push(...json.query.categorymembers);
    continuation = json.continue?.cmcontinue || "";
  } while (continuation);

  return pages;
}

async function fetchWikitextBatch(titles) {
  const query = new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: titles.join("|"),
    rvprop: "content|ids",
    rvslots: "main",
    format: "json",
  });
  const json = await fetchJson(`${API}?${query}`);
  const sources = new Map();

  for (const page of Object.values(json.query.pages)) {
    const revision = page.revisions?.[0];
    const slot = revision?.slots?.main;
    sources.set(page.title, {
      revisionId: revision?.revid ?? null,
      text: slot?.content ?? slot?.["*"] ?? "",
    });
  }

  return sources;
}

function parseIdentity(page, source) {
  const text = source.text;
  if (
    NON_EQUIPPABLE_PREFIXES.some((prefix) => page.title.startsWith(prefix))
  ) {
    return null;
  }
  if (!text.includes("{{IDPage") && !text.includes("{{ENPage/Invidiae")) {
    return null;
  }

  const general = section(text, "<!--General Info-->", "<!--Status, Resistances & Stagger Treshholds-->");
  const skill1 = skillBlock(text, 1);
  const skill2 = skillBlock(text, 2);
  const skill3 = skillBlock(text, 3);
  const prefix = field(general, "prefix");
  const sinnerSource =
    cleanMarkup(field(general, "sinner")) || sinnerFromTitle(page.title);
  const sinner = mapLookup(SINNERS, sinnerSource) || sinnerSource;
  const rawSeason = cleanMarkup(field(general, "season"));
  const rawWorld = cleanMarkup(field(general, "world"));
  const rawFaction = cleanMarkup(field(general, "faction"));
  const normalizedSeason = normalizeSeason(rawSeason);
  const skill3Sin = cleanMarkup(field(skill3, "sin"));
  const skill3AttackType = cleanMarkup(field(skill3, "type"));

  if (!sinner || !skill3Sin || !skill3AttackType) {
    return null;
  }

  return {
    id: `wiki-${page.pageid}`,
    name: page.title,
    nameKo: toKoreanName(page.title),
    sinner,
    season: normalizedSeason.value,
    seasonOrder: normalizedSeason.order,
    affiliation: normalizeAffiliations(
      rawWorld || rawFaction,
      prefix,
      field(general, "keyword"),
      page.title,
    ),
    affiliationPrimary: primaryAffiliation(
      normalizeAffiliations(
        rawWorld || rawFaction,
        prefix,
        field(general, "keyword"),
        page.title,
      ),
    ),
    keywords: extractKeywords(
      [
        skill1,
        skill2,
        skill3,
      ].join("\n"),
    ),
    skill3Sin: mapLookup(SINS, skill3Sin) || skill3Sin,
    skill3AttackType:
      mapLookup(ATTACK_TYPES, skill3AttackType) || skill3AttackType,
    sourceUrl: `https://limbuscompany.wiki.gg/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
    sourceRevision: source.revisionId,
    imageUrl: profileImageUrl(page.title),
  };
}

function isEgoTitle(title) {
  return title.toLocaleLowerCase("en").includes("e.g.o");
}

function sinnerFromTitle(title) {
  const found = [...SINNERS.keys()]
    .filter((name) => title.endsWith(` ${name}`))
    .sort((a, b) => b.length - a.length)[0];
  return found || "";
}

function skillBlock(text, skillNumber) {
  const marker = new RegExp(`^\\|skill${skillNumber}=`, "m");
  const match = marker.exec(text);
  if (!match) {
    const oldEnd =
      skillNumber === 1
        ? "<!--Skill1-2-->"
        : skillNumber === 2
          ? "<!--Skill3-->"
          : "<!--Skill3-2-->";
    return section(
      text,
      `<!--Skill${skillNumber}-->`,
      oldEnd,
    );
  }

  const start = match.index;
  const endMarkers =
    skillNumber === 1
      ? ["|skill1-2=", "|skill2=", "<!--Skill2-->"]
      : skillNumber === 2
        ? ["|skill3=", "<!--Skill3-->"]
        : ["|skill3-2=", "|defense=", "<!--Defense-->"];
  const ends = endMarkers
    .map((endMarker) => text.indexOf(endMarker, start + match[0].length))
    .filter((index) => index >= 0);
  const end = ends.length ? Math.min(...ends) : text.length;
  return text.slice(start, end);
}

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) {
    return "";
  }
  const contentStart = start + startMarker.length;
  const end = text.indexOf(endMarker, contentStart);
  return text.slice(contentStart, end < 0 ? text.length : end);
}

function field(text, name) {
  const match = text.match(new RegExp(`^\\|${escapeRegExp(name)}=(.*)$`, "m"));
  return match?.[1]?.trim() || "";
}

function normalizeSeason(value) {
  if (!value || value === "0") {
    return { value: "통상", order: null };
  }
  if (/walpurgisnacht|walpurgis night/i.test(value)) {
    return { value: "발푸르기스의 밤", order: null };
  }
  const seasonMatch = value.match(
    /(?:season|시즌)?\s*(\d+(?:\.\d+)?)(?:e\b|$|[\s-])/i,
  );
  if (seasonMatch) {
    return { value: `시즌 ${seasonMatch[1]}`, order: Number(seasonMatch[1]) };
  }
  return { value: "통상", order: null };
}

function normalizeAffiliations(world, prefix, keywordField, title = "") {
  const keywordValues = [...keywordField.matchAll(/\{\{Keyword\|([^}]+)\}\}/g)].map(
    (match) => match[1].split("|")[0].trim(),
  );
  const normalizedKeywords = unique(
    keywordValues.map((value) => traitName(value)).filter(Boolean),
  );
  if (title.toLocaleLowerCase("en").includes("e.g.o")) {
    normalizedKeywords.push("E.G.O 장비");
  }
  if (normalizedKeywords.length) {
    return unique(normalizedKeywords);
  }

  const worldPart = world
    .replace(/^World of (?:the )?/i, "")
    .replace(/\s+Identities?$/i, "")
    .replace(/\s+World$/i, "")
    .replace(/\|.*$/, "")
    .trim();
  if (worldPart && worldPart.toLowerCase() !== "none") {
    return [normalizeAffiliationName(worldPart)];
  }
  const words = prefix.split(/\s+/);
  return [
    normalizeAffiliationName(
      words.slice(0, Math.max(1, words.length - 2)).join(" ") || "미분류",
    ),
  ];
}

function traitName(value) {
  const translated = mapLookup(TRAIT_TRANSLATIONS, value) || normalizeAffiliationName(value);
  const branchMatch = translated.match(/^흑수\s*-\s*(묘|사|오|위|유)\s*지부$/);
  if (branchMatch) {
    return `흑수 - ${branchMatch[1]}`;
  }
  return translated;
}

function normalizeAffiliationName(value) {
  const normalized = value
    .replace(/\|name=.*$/i, "")
    .replace(/\|strike$/i, "")
    .trim();
  const replacements = new Map([
    ["E.G.O Gear", "E.G.O 장비"],
    ["G Corp.", "G사"],
    ["La Manchaland", "라만차랜드"],
    ["Devyat' Association", "제뱌찌 협회"],
    ["Dihui Star", "디휘 스타"],
    ["The Pinky", "핑키"],
    ["The Backstreets", "뒷골목"],
    ["Cheery Chickies", "치어리 치키스"],
    ["Early Elephants", "얼리 엘리펀츠"],
    ["Perky Penguins", "퍼키 펭귄스"],
  ["Heishou Pack", "흑수"],
  ["Heishou Pack Adept", "흑수 필두"],
  ["Heishou Pack - Mao Branch", "흑수 - 묘 지부"],
  ["Heishou Pack - Si Branch", "흑수 - 사 지부"],
  ["Heishou Pack - Wei Branch", "흑수 - 위 지부"],
  ["Heishou Pack - Wu Branch", "흑수 - 오 지부"],
  ["Heishou Pack - You Branch", "흑수 - 유 지부"],
    ["Heishou Pack - Mao Branch", "흑수 - 묘 지부"],
    ["Heishou Pack - Si Branch", "흑수 - 사 지부"],
    ["Heishou Pack - Wei Branch", "흑수 - 위 지부"],
    ["Heishou Pack - Wu Branch", "흑수 - 오 지부"],
    ["Heishou Pack - You Branch", "흑수 - 유 지부"],
    ["Family Hierarch Candidate", "가주 후보"],
    ["The Ring Docent", "약지 도슨트"],
    ["School of Pointillism", "점묘파"],
    ["School of Fauvism", "야수파"],
    ["School of Corporism", "신체파"],
    ["Great Sister", "큰누님"],
    ["Le Sette Famiglie", "7대 패밀리"],
    ["Sottocapo", "언더보스"],
    ["Smoke War", "연기 전쟁"],
    ["Associate Office - Öufi", "외우피 사무소"],
    ["Bloodfiend", "혈귀"],
    ["Third Kindred", "제3권속"],
    ["Capo", "카포"],
    ["Soldato", "솔다토"],
    ["MultiCrack Office", "멀티크랙 사무소"],
    ["Maestro", "마에스트로"],
    ["Lobotomy Corp. Headquarters", "로보토미 본사"],
    ["Technology Liberation Alliance", "기술해방연합"],
    ["Edgar Family", "에드가 가문"],
    ["Fanghunt Office", "어금니 사무소"],
    ["Fixer", "해결사"],
    ["Syndicate", "조직"],
    ["Association", "협회"],
    ["Limbus Company", "림버스 컴퍼니"],
    ["LCD", "LCD"],
    ["LCB", "LCB"],
    ["Full-Stop Office", "마침표 사무소"],
    ["H Corp.", "H사"],
    ["Hook Office", "갈고리 사무소"],
    ["Jeong's Office", "정 사무소"],
    ["Jia Family", "가씨 가문"],
    ["K Corp.", "K사"],
    ["LCA", "LCA"],
    ["LCC", "LCCB"],
    ["LCE", "LCE"],
    ["Limbus Kindergarten", "림버스 유치원"],
    ["Lobotomy Corp. Branch", "로보토미 지부"],
    ["Los Mariachis", "마리아치"],
    ["Molar Office", "어금니 사무소"],
    ["Mechanical Amalgam", "기계 융합 생명체"],
    ["Night Awls", "밤의 송곳"],
    ["N Corp. Fanatic", "N사 광신도"],
    ["N Corp.", "N사"],
    ["Öufi Association", "외우피 협회"],
    ["R Corp.", "R사"],
    ["Rosespanner Workshop", "장미스패너 공방"],
    ["S Corp.", "S사"],
    ["Seven Association", "세븐 협회"],
    ["Second Kindred", "혈귀"],
    ["T Corp.", "T사"],
    ["The Dead Rabbits", "데드래빗츠"],
    ["The Fingers", "손가락"],
    ["Technology Liberation Alliance", "기술해방연합"],
    ["The House of Spiders", "거미집"],
    ["The Ring", "약지"],
    ["The Ring Student", "약지 스튜던트"],
    ["School of Pointillism", "점묘파"],
    ["The Middle", "중지"],
    ["The Thumb", "엄지"],
    ["The Index", "검지"],
    ["The Oracle's Proxy", "신탁의 대행자"],
    ["The Pequod", "피쿼드호"],
    ["The Wild Hunt", "와일드헌트"],
    ["Tiansha Star", "천살성"],
    ["Shi Association", "시 협회"],
    ["Tingtang Gang", "대호파"],
    ["Twinhook Pirates", "쌍갈고리 해적단"],
    ["War Hero", "전쟁 영웅"],
    ["W Corp.", "W사"],
    ["Wuthering Heights", "워더링하이츠"],
    ["Yurodiviye", "유로지비"],
    ["Zwei Association", "츠바이 협회"],
  ]);
  return (
    mapLookup(replacements, normalized) ||
    mapLookup(AFFILIATIONS, normalized) ||
    normalized
  );
}

function mapLookup(map, value) {
  if (!value) {
    return "";
  }
  if (map.has(value)) {
    return map.get(value);
  }
  const lowered = value.toLocaleLowerCase("en");
  return (
    [...map.entries()].find(
      ([key]) => key.toLocaleLowerCase("en") === lowered,
    )?.[1] || ""
  );
}

function unique(values = []) {
  return [...new Set(values)];
}

function primaryAffiliation(values = []) {
  const priority = [
    "E.G.O 장비",
    "LCB",
    "LCCB",
    "LCD",
    "LCE",
    "LCA",
    "새벽 사무소",
    "리우 협회",
    "디에치 협회",
    "세븐 협회",
    "섕크 협회",
    "시 협회",
    "츠바이 협회",
    "어금니 사무소",
    "마침표 사무소",
    "약지",
    "거미집",
    "검지",
    "중지",
    "엄지",
    "검계",
    "흑운회",
    "흑수",
    "라만차랜드",
    "피쿼드호",
    "워더링하이츠",
    "N사 광신도",
    "N사",
    "W사",
    "R사",
    "K사",
    "H사",
    "T사",
    "G사",
    "S사",
  ];
  return priority.find((candidate) => values.includes(candidate)) ||
    values.find((value) => !["림버스 컴퍼니", "해결사", "조직", "손가락", "뒷골목"].includes(value)) ||
    values.at(-1) ||
    "미분류";
}

function extractKeywords(text) {
  return [...KEYWORDS.entries()]
    .filter(([english]) => new RegExp(`\\b${escapeRegExp(english)}\\b`, "i").test(text))
    .map(([, korean]) => korean);
}

function profileImageUrl(title) {
  const fileName = `${title.replaceAll(" ", "_")}_Profile.png`;
  return `https://limbuscompany.wiki.gg/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;
}

function toKoreanName(title) {
  let translated = title;
  for (const [source, target] of NAME_REPLACEMENTS.sort(
    ([left], [right]) => right.length - left.length,
  )) {
    translated = translated.replace(source, target);
  }
  for (const [english, korean] of SINNERS) {
    translated = translated.replace(english, korean);
  }
  return translated
    .replaceAll("Assoc.", "협회")
    .replaceAll("Association", "협회")
    .replaceAll("South", "남부")
    .replaceAll("North", "북부")
    .replaceAll("East", "동부")
    .replaceAll("West", "서부")
    .replaceAll("Section", "과")
    .replaceAll("Captain", "대장")
    .replaceAll("Adept", "숙련자")
    .replaceAll("Fixer", "해결사")
    .replaceAll("Rep", "대표")
    .replaceAll("Director", "부장")
    .replaceAll("Agent", "요원")
    .replaceAll("Captain", "대장")
    .replaceAll("Butler", "집사")
    .replaceAll("Chief", "수석")
    .replaceAll("Staff", "직원")
    .replaceAll("Student", "학생")
    .replaceAll("Apprentice", "견습생")
    .replaceAll("Nursefather", "간부")
    .replaceAll("Mao", "묘")
    .replaceAll("Wei", "위")
    .replaceAll("Wu", "오")
    .replaceAll("You", "유")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMarkup(value) {
  return value
    .replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, "$2$1")
    .replace(/\{\{[^{}]*\|([^{}]*)\}\}/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/''+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LimbusCompanyGuessingGame/0.1 (local development)",
    },
  });

  if (response.ok) {
    return response.json();
  }

  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    const delay = 1500 * 2 ** attempt;
    console.warn(`Wiki API returned ${response.status}; retrying in ${delay}ms`);
    await sleep(delay);
    return fetchJson(url, attempt + 1);
  }

  throw new Error(`Wiki API request failed: ${response.status}`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
