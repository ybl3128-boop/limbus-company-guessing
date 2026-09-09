const MAX_GUESSES = 10;
const STORAGE_KEY = "limbus-idle-game";
const STATS_KEY = "limbus-idle-stats";
const TUTORIAL_KEY = "limbus-tutorial-seen";
const PUZZLE_NUMBER_START = 1085;

const state = {
  identities: [],
  target: null,
  dailyTarget: null,
  guesses: [],
  mode: "daily",
  previousPracticeTargetId: null,
  selectedSuggestion: null,
  suggestionIndex: -1,
  dateKey: getDateKey(),
  finished: false,
  stats: loadStats(),
};

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  streakLabel: document.querySelector("#streakLabel"),
  bestLabel: document.querySelector("#bestLabel"),
  remainingLabel: document.querySelector("#remainingLabel"),
  puzzleNumber: document.querySelector("#puzzleNumber"),
  gameStatus: document.querySelector("#gameStatus"),
  guessForm: document.querySelector("#guessForm"),
  guessInput: document.querySelector("#guessInput"),
  suggestions: document.querySelector("#suggestions"),
  formMessage: document.querySelector("#formMessage"),
  guessRows: document.querySelector("#guessRows"),
  resultCard: document.querySelector("#resultCard"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMessage: document.querySelector("#resultMessage"),
  answerMeta: document.querySelector("#answerMeta"),
  answerImage: document.querySelector("#answerImage"),
  portraitPlaceholder: document.querySelector("#portraitPlaceholder"),
  portraitInitial: document.querySelector("#portraitInitial"),
  shareButton: document.querySelector("#shareButton"),
  practiceButton: document.querySelector("#practiceButton"),
  practiceAgainButton: document.querySelector("#practiceAgainButton"),
  practiceRetryButton: document.querySelector("#practiceRetryButton"),
  countdown: document.querySelector("#countdown"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  closeHelpButton: document.querySelector("#closeHelpButton"),
  tutorialDialog: document.querySelector("#tutorialDialog"),
  startTutorialButton: document.querySelector("#startTutorialButton"),
  toast: document.querySelector("#toast"),
};

bootstrap();

async function bootstrap() {
  elements.todayLabel.textContent = formatDate(state.dateKey);
  elements.streakLabel.textContent = state.stats.streak;
  elements.bestLabel.textContent = state.stats.best;
  elements.puzzleNumber.textContent = `#${PUZZLE_NUMBER_START + daysSinceEpoch(state.dateKey)}`;

  try {
    const [identityResponse, aliasResponse, puzzleResponse] = await Promise.all([
      fetch("./data/identities.json"),
      fetch("./data/name-map.ko.json").catch(() => null),
      fetch("./data/puzzles.json").catch(() => null),
    ]);

    if (!identityResponse.ok) {
      throw new Error("인격 데이터 파일을 불러오지 못했습니다.");
    }

    const rawIdentities = await identityResponse.json();
    const aliases = aliasResponse?.ok ? await aliasResponse.json() : {};
    const puzzles = puzzleResponse?.ok ? await puzzleResponse.json() : {};

    state.identities = rawIdentities
      .map((identity) => applyAlias(identity, aliases))
      .filter(isPlayableIdentity)
      .sort((a, b) => displayName(a).localeCompare(displayName(b), "ko"));

    if (!state.identities.length) {
      throw new Error("플레이 가능한 인격 데이터가 없습니다.");
    }

    state.dailyTarget = chooseDailyTarget(puzzles);
    state.target = state.dailyTarget;
    restoreGame();
    render();
    bindEvents();
    showFirstVisitTutorial();
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  } catch (error) {
    showFatalError(error);
  }
}

function bindEvents() {
  elements.guessInput.addEventListener("input", handleSearchInput);
  elements.guessInput.addEventListener("keydown", handleSearchKeydown);
  elements.guessForm.addEventListener("submit", handleSubmit);
  elements.shareButton.addEventListener("click", shareResult);
  elements.practiceButton.addEventListener("click", handleModeButton);
  elements.practiceAgainButton.addEventListener("click", startPracticeMode);
  elements.practiceRetryButton.addEventListener("click", startPracticeMode);
  elements.helpButton.addEventListener("click", openTutorial);
  elements.closeHelpButton.addEventListener("click", () => elements.helpDialog.close());
  elements.startTutorialButton.addEventListener("click", closeTutorial);
  elements.helpDialog.addEventListener("click", (event) => {
    if (event.target === elements.helpDialog) {
      elements.helpDialog.close();
    }
  });
}

function showFirstVisitTutorial() {
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    window.setTimeout(openTutorial, 180);
  }
}

function openTutorial() {
  if (!elements.tutorialDialog || elements.tutorialDialog.open) {
    return;
  }
  elements.tutorialDialog.showModal();
}

function closeTutorial() {
  localStorage.setItem(TUTORIAL_KEY, "1");
  if (elements.tutorialDialog?.open) {
    elements.tutorialDialog.close();
  }
}

function handleSearchInput() {
  state.selectedSuggestion = null;
  state.suggestionIndex = -1;
  renderSuggestions(elements.guessInput.value);
}

function handleSearchKeydown(event) {
  const items = [...elements.suggestions.querySelectorAll(".suggestion")];
  if (!items.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.suggestionIndex = (state.suggestionIndex + 1) % items.length;
    updateSuggestionFocus(items);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    state.suggestionIndex =
      (state.suggestionIndex - 1 + items.length) % items.length;
    updateSuggestionFocus(items);
  } else if (event.key === "Enter" && state.suggestionIndex >= 0) {
    event.preventDefault();
    items[state.suggestionIndex].click();
  } else if (event.key === "Escape") {
    hideSuggestions();
  }
}

function renderSuggestions(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || state.finished) {
    hideSuggestions();
    return;
  }

  const guessedIds = new Set(state.guesses.map((guess) => guess.id));
  const matches = state.identities
    .filter((identity) => !guessedIds.has(identity.id))
    .filter((identity) => searchableText(identity).includes(normalizedQuery))
    .slice(0, 8);

  elements.suggestions.innerHTML = "";
  const header = document.createElement("li");
  header.className = "suggestion-header";
  header.innerHTML = `
    <span>인격</span>
    <span>수감자</span>
    <span>시즌</span>
    <span>소속</span>
    <span>사용 키워드</span>
    <span>죄악 속성<br><small>스킬 3</small></span>
    <span>공격 유형<br><small>스킬 3</small></span>
  `;
  elements.suggestions.append(header);

  matches.forEach((identity) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "suggestion";
    button.type = "button";
    button.innerHTML = `
      <span class="suggestion-name">${escapeHtml(identityPrefix(identity))}</span>
      <span class="suggestion-sinner">${escapeHtml(identity.sinner || "—")}</span>
      <span class="suggestion-season">${escapeHtml(identity.season || "통상")}</span>
      <span class="suggestion-affiliation">${escapeHtml(formatPreviewList(identity.affiliation))}</span>
      <span class="suggestion-keywords">${escapeHtml(formatPreviewList(identity.keywords))}</span>
      <span class="suggestion-sin">${escapeHtml(identity.skill3Sin || "—")}</span>
      <span class="suggestion-attack">${escapeHtml(identity.skill3AttackType || "—")}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedSuggestion = identity;
      elements.guessInput.value = displayName(identity);
      hideSuggestions();
      elements.formMessage.textContent = "";
    });
    item.append(button);
    elements.suggestions.append(item);
  });

  elements.suggestions.classList.toggle("visible", matches.length > 0);
}

function updateSuggestionFocus(items) {
  items.forEach((item, index) => {
    item.classList.toggle("active", index === state.suggestionIndex);
  });
}

function hideSuggestions() {
  elements.suggestions.classList.remove("visible");
  state.suggestionIndex = -1;
}

function handleSubmit(event) {
  event.preventDefault();
  if (state.finished) {
    return;
  }

  const identity =
    state.selectedSuggestion ||
    findIdentityByQuery(elements.guessInput.value, state.identities);

  if (!identity) {
    elements.formMessage.textContent = "검색 결과에서 인격을 하나 선택해주세요.";
    renderSuggestions(elements.guessInput.value);
    return;
  }

  if (state.guesses.some((guess) => guess.id === identity.id)) {
    elements.formMessage.textContent = "이미 추측한 인격입니다.";
    return;
  }

  state.guesses.push(identity);
  state.selectedSuggestion = null;
  elements.guessInput.value = "";
  elements.formMessage.textContent = "";
  hideSuggestions();

  if (identity.id === state.target.id || state.guesses.length >= MAX_GUESSES) {
    state.finished = true;
    completeGame(identity.id === state.target.id);
  }

  saveGame();
  render();
}

function render() {
  elements.remainingLabel.textContent = Math.max(
    0,
    MAX_GUESSES - state.guesses.length,
  );
  elements.guessRows.innerHTML = "";

  if (!state.guesses.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    row.innerHTML =
      '<td colspan="7">첫 번째 인격을 선택하면 판정 기록이 남습니다.</td>';
    elements.guessRows.append(row);
  } else {
    state.guesses.forEach((guess) => {
      elements.guessRows.append(createGuessRow(guess));
    });
  }

  elements.gameStatus.textContent = state.mode === "practice"
    ? state.finished ? "연습 종료" : "연습 중"
    : state.finished ? "기록 완료" : "수사 중";
  elements.gameStatus.classList.toggle("closed", state.finished);
  elements.guessInput.disabled = state.finished;
  elements.guessInput.placeholder = state.finished
    ? "오늘의 기록이 완료되었습니다"
    : "인격 이름을 검색하세요";
  document.querySelector(".submit-button").disabled = state.finished;
  elements.practiceButton.textContent =
    state.mode === "practice" ? "일일 모드" : "연습 모드";

  if (state.finished) {
    renderResult();
  }
}

function createGuessRow(guess) {
  const row = document.createElement("tr");
  const result = compareIdentity(guess, state.target);
  row.innerHTML = `
    <td>
      <div class="identity-name">
        <span class="identity-prefix">${escapeHtml(identityPrefix(guess))}</span>
        <span class="identity-sinner">${escapeHtml(guess.sinner || "수감자 정보 없음")}</span>
      </div>
    </td>
    ${result.sinner.html}
    ${result.season.html}
    ${result.affiliation.html}
    ${result.keywords.html}
    ${result.skill3Sin.html}
    ${result.skill3AttackType.html}
  `;
  return row;
}

function compareIdentity(guess, target) {
  return {
    sinner: scalarCell(guess.sinner, target.sinner),
    season: seasonCell(guess, target),
    affiliation: listCell(guess.affiliation, target.affiliation, "affiliation"),
    keywords: listCell(guess.keywords, target.keywords, "keywords"),
    skill3Sin: scalarCell(guess.skill3Sin, target.skill3Sin),
    skill3AttackType: scalarCell(
      guess.skill3AttackType,
      target.skill3AttackType,
    ),
  };
}

function scalarCell(value, targetValue) {
  const same = normalizeText(value) === normalizeText(targetValue);
  return {
    status: same ? "exact" : "wrong",
    html: `<td class="result-cell ${same ? "exact" : "wrong"}">${escapeHtml(
      value || "—",
    )}</td>`,
  };
}

function seasonCell(guess, target) {
  const value = guess.season || "통상";
  const targetValue = target.season || "통상";
  const same = normalizeText(value) === normalizeText(targetValue);
  let arrow = "";

  if (!same && Number.isFinite(guess.seasonOrder) && Number.isFinite(target.seasonOrder)) {
    arrow = guess.seasonOrder < target.seasonOrder ? "↑" : "↓";
  }

  return {
    status: same ? "exact" : "wrong",
    html: `<td class="result-cell ${same ? "exact" : "wrong"}">${escapeHtml(
      value,
    )}${arrow ? `<span class="arrow">${arrow}</span>` : ""}</td>`,
  };
}

function listCell(values = [], targetValues = [], kind = "keywords") {
  const current = unique(values);
  const target = unique(targetValues);
  const overlap = current.filter((value) =>
    target.some((targetValue) => normalizeText(targetValue) === normalizeText(value)),
  );
  const exact =
    current.length === target.length && overlap.length === current.length;
  const status = exact ? "exact" : overlap.length ? "partial" : "wrong";
  const tags = current.length
    ? current.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("")
    : '<span class="tag empty-tag">없음</span>';

  return {
    status,
    html: `<td class="result-cell ${kind}-cell ${status}"><div class="tag-list">${tags}</div></td>`,
  };
}

function renderResult() {
  const won = state.guesses.at(-1)?.id === state.target.id;
  elements.resultCard.classList.remove("hidden");
  elements.resultTitle.textContent = displayName(state.target);
  elements.resultMessage.textContent = state.mode === "practice"
    ? won
      ? `${state.guesses.length}번째 추측에 정답을 찾았습니다. 연습 기록은 저장되지 않습니다.`
      : "연습 문제가 종료되었습니다. 다시 하기를 누르면 새로운 정답으로 시작합니다."
    : won
      ? `${state.guesses.length}번째 추측에 정답을 찾았습니다.`
      : "오늘의 기록이 종료되었습니다. 다음 문제에서 다시 도전하세요.";
  elements.answerMeta.innerHTML = [
    state.target.sinner,
    state.target.season,
    ...(state.target.affiliation || []),
    ...(state.target.keywords || []).map((keyword) => `#${keyword}`),
  ]
    .filter(Boolean)
    .map((value) => `<span>${escapeHtml(value)}</span>`)
    .join("");
  elements.portraitInitial.textContent = (displayName(state.target) || "?").slice(0, 1);

  if (state.target.imageUrl) {
    elements.answerImage.alt = `${displayName(state.target)} 이미지`;
    elements.answerImage.src = state.target.imageUrl;
    elements.answerImage.onload = () => elements.answerImage.classList.add("loaded");
    elements.answerImage.onerror = () => elements.answerImage.classList.remove("loaded");
  }
  elements.shareButton.classList.toggle("hidden", state.mode === "practice");
  elements.practiceAgainButton.classList.toggle("hidden", state.mode === "practice");
  elements.practiceRetryButton.classList.toggle("hidden", state.mode !== "practice");
  elements.countdown.classList.toggle("hidden", state.mode === "practice");
}

function completeGame(won) {
  if (state.mode === "practice") {
    return;
  }
  const completedKey = `limbus-completed-${state.dateKey}`;
  if (localStorage.getItem(completedKey)) {
    return;
  }

  state.stats.played += 1;
  if (won) {
    state.stats.wins += 1;
    state.stats.streak += 1;
    state.stats.best = Math.max(state.stats.best, state.stats.streak);
  } else {
    state.stats.streak = 0;
  }
  localStorage.setItem(completedKey, "1");
  localStorage.setItem(STATS_KEY, JSON.stringify(state.stats));
}

async function shareResult() {
  if (state.mode === "practice") {
    return;
  }
  const won = state.guesses.at(-1)?.id === state.target.id;
  const blocks = state.guesses
    .map((guess) => {
      const result = compareIdentity(guess, state.target);
      return [
        result.sinner.status,
        result.season.status,
        result.affiliation.status,
        result.keywords.status,
        result.skill3Sin.status,
        result.skill3AttackType.status,
      ]
        .map((status) => (status === "exact" ? "🟩" : status === "partial" ? "🟨" : "🟥"))
        .join("");
    })
    .join("\n");
  const text = `림버스컴퍼니맞추기 ${won ? "✅" : "❌"}\n${blocks}\n${state.dateKey}`;

  try {
    await navigator.clipboard.writeText(text);
    showToast("결과를 클립보드에 복사했습니다.");
  } catch {
    showToast(text);
  }
}

function chooseDailyTarget(puzzles) {
  const scheduledId = puzzles[state.dateKey];
  const scheduled = state.identities.find((identity) => identity.id === scheduledId);
  if (scheduled) {
    return scheduled;
  }

  const index = Math.abs(hashString(state.dateKey)) % state.identities.length;
  return state.identities[index];
}

function startPracticeMode() {
  if (!state.identities.length) {
    return;
  }

  state.mode = "practice";
  state.previousPracticeTargetId = state.target?.id || state.previousPracticeTargetId;
  state.target = choosePracticeTarget();
  state.guesses = [];
  state.finished = false;
  state.selectedSuggestion = null;
  elements.guessInput.value = "";
  elements.formMessage.textContent = "";
  hideSuggestions();
  elements.resultCard.classList.add("hidden");
  elements.puzzleNumber.textContent = "연습";
  render();
  window.scrollTo({ top: document.querySelector(".game-card").offsetTop - 24, behavior: "smooth" });
}

function handleModeButton() {
  if (state.mode === "practice") {
    startDailyMode();
  } else {
    startPracticeMode();
  }
}

function startDailyMode() {
  state.mode = "daily";
  state.target = state.dailyTarget;
  state.guesses = [];
  state.finished = false;
  state.selectedSuggestion = null;
  elements.guessInput.value = "";
  elements.formMessage.textContent = "";
  hideSuggestions();
  elements.resultCard.classList.add("hidden");
  elements.puzzleNumber.textContent = `#${PUZZLE_NUMBER_START + daysSinceEpoch(state.dateKey)}`;
  restoreGame();
  render();
  window.scrollTo({ top: document.querySelector(".game-card").offsetTop - 24, behavior: "smooth" });
}

function choosePracticeTarget() {
  const candidates = state.identities.filter(
    (identity) => identity.id !== state.previousPracticeTargetId,
  );
  const pool = candidates.length ? candidates : state.identities;
  const randomIndex = window.crypto?.getRandomValues
    ? window.crypto.getRandomValues(new Uint32Array(1))[0] % pool.length
    : Math.floor(Math.random() * pool.length);
  const target = pool[randomIndex];
  state.previousPracticeTargetId = target.id;
  return target;
}

function restoreGame() {
  const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}-${state.dateKey}`) || "null");
  if (!saved || saved.targetId !== state.target.id) {
    return;
  }
  state.guesses = saved.guessIds
    .map((id) => state.identities.find((identity) => identity.id === id))
    .filter(Boolean);
  state.finished = Boolean(saved.finished);
}

function saveGame() {
  if (state.mode !== "daily") {
    return;
  }
  localStorage.setItem(
    `${STORAGE_KEY}-${state.dateKey}`,
    JSON.stringify({
      targetId: state.target.id,
      guessIds: state.guesses.map((guess) => guess.id),
      finished: state.finished,
    }),
  );
}

function loadStats() {
  return {
    played: 0,
    wins: 0,
    streak: 0,
    best: 0,
    ...JSON.parse(localStorage.getItem(STATS_KEY) || "{}"),
  };
}

function applyAlias(identity, aliases) {
  const alias = aliases[identity.id] || aliases[identity.name] || {};
  return {
    ...identity,
    ...alias,
    aliases: unique([...(identity.aliases || []), ...(alias.aliases || [])]),
  };
}

function isPlayableIdentity(identity) {
  return Boolean(
    identity &&
      identity.id &&
      identity.sinner &&
      identity.season &&
      identity.affiliation &&
      identity.skill3Sin &&
      identity.skill3AttackType,
  );
}

function findIdentityByQuery(query, identities) {
  const normalizedQuery = normalizeText(query);
  return identities.find(
    (identity) =>
      normalizeText(displayName(identity)) === normalizedQuery ||
      normalizeText(identity.name) === normalizedQuery,
  );
}

function searchableText(identity) {
  return normalizeText(
    [displayName(identity), identity.name, identity.sinner, ...(identity.aliases || [])].join(" "),
  );
}

function displayName(identity) {
  return identity.nameKo || identity.name;
}

function identityPrefix(identity) {
  const fullName = displayName(identity);
  const sinner = identity.sinner || "";
  if (!sinner) {
    return fullName;
  }
  const suffix = new RegExp(`\\s+${escapeRegExp(sinner)}$`);
  return fullName.replace(suffix, "").trim() || fullName;
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function daysSinceEpoch(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(2026, 0, 1)) / 86400000);
}

function updateCountdown() {
  const now = new Date();
  const next = new Date(`${state.dateKey}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const seconds = Math.max(0, Math.floor((next - now) / 1000));
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  elements.countdown.textContent = `다음 문제까지 ${hours}:${minutes}:${remainingSeconds}`;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function formatPreviewList(values = []) {
  return unique(Array.isArray(values) ? values : [values]).join(" · ") || "없음";
}

function normalizeText(value = "") {
  return String(value).trim().toLocaleLowerCase("ko-KR");
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(
    () => elements.toast.classList.remove("show"),
    2800,
  );
}

function showFatalError(error) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  document.querySelector(".game-card").innerHTML = `
    <div class="fatal-error">
      <p class="section-kicker">ARCHIVE ERROR</p>
      <h2>인격 데이터를 불러오지 못했습니다.</h2>
      <p>${escapeHtml(message)}</p>
      <p>로컬 서버로 이 폴더를 열었는지 확인해주세요.</p>
    </div>
  `;
}
