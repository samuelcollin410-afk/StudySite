(() => {
  "use strict";

  /* =========================================================
     STORAGE
  ========================================================= */
  const LS_KEY = "studyspace_v2_db";
  const SETTINGS_KEY = "studyspace_v2_settings";
  const CAL_KEY = "studyspace_v2_calendar";
  const TODO_KEY = "studyspace_v2_todo";

  const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  let db = loadJSON(LS_KEY, { studies: [] });

  let settings = loadJSON(SETTINGS_KEY, {
    theme: "dark",
    accent: "#6aa6ff",
    colors: {
      globalText: "",
      globalMuted: "",
      gimkitText: "",
      testText: "",
      flashText: "",
      matchText: "",
      termsText: "",
      statsText: ""
    }
  });

  // Calendar: { events: { "YYYY-MM-DD": { items:[{id,text,createdAt,updatedAt}] } }, dismissed: {date:true} }
  let calendar = loadJSON(CAL_KEY, { events: {}, dismissed: {} });

  // To-do: { items:[{id,text,createdAt,done,deleting,deleteAt}] }
  let todos = loadJSON(TODO_KEY, { items: [] });

  function persistAll() {
    saveJSON(LS_KEY, db);
    saveJSON(SETTINGS_KEY, settings);
    saveJSON(CAL_KEY, calendar);
    saveJSON(TODO_KEY, todos);
  }

  /* =========================================================
     DOM
  ========================================================= */
  const $ = (s) => document.querySelector(s);

  const viewHome = $("#viewHome");
  const viewStudy = $("#viewStudy");

  const studiesList = $("#studiesList");
  const studySearch = $("#studySearch");
  const clearSearchBtn = $("#clearSearchBtn");

  const homeBtn = $("#homeBtn");
  const backToHomeLink = $("#backToHomeLink");

  const createStudyBtn = $("#createStudyBtn");
  const createStudyModal = $("#createStudyModal");
  const newStudyName = $("#newStudyName");
  const confirmCreateStudyBtn = $("#confirmCreateStudyBtn");
  const closeCreateStudyBtn = $("#closeCreateStudyBtn");
  const cancelCreateStudyBtn = $("#cancelCreateStudyBtn");

  const exportAllBtn = $("#exportAllBtn");
  const exportStudyBtn = $("#exportStudyBtn");
  const importBtn = $("#importBtn");

  const importModal = $("#importModal");
  const importText = $("#importText");
  const closeImportBtn = $("#closeImportBtn");
  const cancelImportBtn = $("#cancelImportBtn");
  const confirmImportBtn = $("#confirmImportBtn");

  const studyTitle = $("#studyTitle");
  const studyMeta = $("#studyMeta");
  const renameStudyBtn = $("#renameStudyBtn");
  const deleteStudyBtn = $("#deleteStudyBtn");
  const favoritesOnlyToggle = $("#favoritesOnlyToggle");

  const tabs = [...document.querySelectorAll(".tab")];
  const panels = {
    terms: $("#tab_terms"),
    flashcards: $("#tab_flashcards"),
    gimkit: $("#tab_gimkit"),
    match: $("#tab_match"),
    test: $("#tab_test"),
    stats: $("#tab_stats")
  };

  // Terms
  const termQ = $("#termQ");
  const termA = $("#termA");
  const saveTermBtn = $("#saveTermBtn");
  const cancelEditTermBtn = $("#cancelEditTermBtn");
  const termsList = $("#termsList");
  const termSearch = $("#termSearch");
  const clearTermSearchBtn = $("#clearTermSearchBtn");

  // Bulk
  const bulkInput = $("#bulkInput");
  const bulkImportBtn = $("#bulkImportBtn");
  const bulkClearBtn = $("#bulkClearBtn");

  // Flashcards
  const flashCard = $("#flashCard");
  const flashInner = $("#flashInner");
  const fcQ = $("#fcQ");
  const fcA = $("#fcA");
  const fcCounter = $("#fcCounter");
  const fcPrevBtn = $("#fcPrevBtn");
  const fcNextBtn = $("#fcNextBtn");
  const fcRestartBtn = $("#fcRestartBtn");

  // Gimkit
  const gkPrompt = $("#gkPrompt");
  const gkCounter = $("#gkCounter");
  const gkChoices = $("#gkChoices");
  const gkFeedback = $("#gkFeedback");
  const gkNextBtn = $("#gkNextBtn");
  const gkRestartBtn = $("#gkRestartBtn");

  // Match
  const matchQs = $("#matchQs");
  const matchAs = $("#matchAs");
  const matchStatus = $("#matchStatus");
  const matchRestartBtn = $("#matchRestartBtn");

  // Test
  const testCount = $("#testCount");
  const startTestBtn = $("#startTestBtn");
  const resetTestBtn = $("#resetTestBtn");
  const testArea = $("#testArea");
  const submitTestBtn = $("#submitTestBtn");
  const testResults = $("#testResults");
  const testHistory = $("#testHistory");

  // Stats
  const mostMissed = $("#mostMissed");
  const studyStatsSummary = $("#studyStatsSummary");

  // Settings
  const settingsModal = $("#settingsModal");
  const openSettingsBtn = $("#openSettingsBtn");
  const closeSettingsBtn = $("#closeSettingsBtn");
  const toggleThemeBtn = $("#toggleThemeBtn");
  const accentPicker = $("#accentPicker");

  const colorArea = $("#colorArea");
  const colorValue = $("#colorValue");
  const applyColorBtn = $("#applyColorBtn");
  const clearColorBtn = $("#clearColorBtn");

  // Calendar
  const calendarWrap = $("#calendarWrap");
  const dayModal = $("#dayModal");
  const dayModalTitle = $("#dayModalTitle");
  const closeDayModalBtn = $("#closeDayModalBtn");
  const closeDayModalBtn2 = $("#closeDayModalBtn2");
  const dayEventsList = $("#dayEventsList");
  const eventText = $("#eventText");
  const saveEventBtn = $("#saveEventBtn");
  const deleteEventBtn = $("#deleteEventBtn");

  const notifyModal = $("#notifyModal");
  const notifyText = $("#notifyText");
  const closeNotifyBtn = $("#closeNotifyBtn");
  const dismissNotifyBtn = $("#dismissNotifyBtn");
  const editNotifyBtn = $("#editNotifyBtn");

  // To-do
  const todoInput = $("#todoInput");
  const addTodoBtn = $("#addTodoBtn");
  const todoList = $("#todoList");

  // Home time
  const nowTime = $("#nowTime");
  const todayReminders = $("#todayReminders");

  /* =========================================================
     STATE
  ========================================================= */
  let currentStudyId = null;
  let currentTab = "terms";
  let editingTermId = null;
  let favoritesOnly = false;

  // Flashcards
  let fcOrder = [];
  let fcIndex = 0;

  // Gimkit
  let gkOrder = [];
  let gkIndex = 0;
  let gkLocked = false;
  let gkLastTermId = null;

  // Match
  let matchState = null;

  // Test
  let activeTest = null;

  // Calendar
  let calMonth = 0; // Jan 2026 = 0
  let selectedDayKey = null;
  let pendingNotifyKey = null;
  let editingEventId = null;

  /* =========================================================
     SETTINGS APPLY
  ========================================================= */
  function applySettings() {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.style.setProperty("--accent", settings.accent);

    const c = settings.colors || {};
    document.documentElement.style.setProperty("--user-text", c.globalText || "");
    document.documentElement.style.setProperty("--user-muted", c.globalMuted || "");
    document.documentElement.style.setProperty("--user-gk-text", c.gimkitText || "");
    document.documentElement.style.setProperty("--user-test-text", c.testText || "");
    document.documentElement.style.setProperty("--user-fc-text", c.flashText || "");
    document.documentElement.style.setProperty("--user-match-text", c.matchText || "");
    document.documentElement.style.setProperty("--user-terms-text", c.termsText || "");
    document.documentElement.style.setProperty("--user-stats-text", c.statsText || "");

    accentPicker.value = settings.accent;
    refreshColorPicker();
  }

  function refreshColorPicker() {
    const key = colorArea?.value;
    if (!key) return;
    const c = settings.colors || (settings.colors = {});
    colorValue.value = c[key] || "#ffffff";
  }

  /* =========================================================
     HELPERS
  ========================================================= */
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function nowISODate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function fmtDateTime(ts) {
    return new Date(ts).toLocaleString();
  }

  function escapeHTML(s) {
    return (s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function percent(n, d) {
    if (!d) return 0;
    return Math.round((n / d) * 100);
  }

  function getStudy(id) {
    return db.studies.find(s => s.id === id) || null;
  }

  function ensureTermStats(t) {
    if (!t.stats) t.stats = { seen: 0, wrong: 0 };
    if (typeof t.stats.seen !== "number") t.stats.seen = 0;
    if (typeof t.stats.wrong !== "number") t.stats.wrong = 0;
    return t;
  }

  function studyTerms(study) {
    const terms = (study?.terms || []).filter(t => (t.q || "").trim() && (t.a || "").trim()).map(ensureTermStats);
    if (!favoritesOnly) return terms;
    return terms.filter(t => !!t.fav);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Spaced repetition order: weighted BUT still covers all terms once before repeating
  function weightedOrderByMiss(terms) {
    const items = terms.map(t => {
      const seen = t.stats?.seen || 0;
      const wrong = t.stats?.wrong || 0;
      const missPct = seen ? (wrong / seen) * 100 : 0;
      const w = 1 + wrong * 2 + missPct / 10;
      return { id: t.id, w: Math.max(1, w) };
    });
    const keyed = items.map(x => ({ id: x.id, k: Math.pow(Math.random(), 1 / x.w) }));
    keyed.sort((a, b) => b.k - a.k);
    return keyed.map(x => x.id);
  }

  /* =========================================================
     HOME: CLOCK + TODAY
  ========================================================= */
  function renderNow() {
    const d = new Date();
    nowTime.textContent = d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });

    const key = nowISODate();
    const items = calendar.events[key]?.items || [];
    if (!items.length) {
      todayReminders.textContent = "No reminders today.";
    } else {
      todayReminders.textContent = items.map((x, i) => `${i + 1}. ${x.text}`).join("\n");
    }
  }

  /* =========================================================
     NAV / VIEWS
  ========================================================= */
  function showHome() {
    currentStudyId = null;
    viewStudy.classList.add("hidden");
    viewHome.classList.remove("hidden");
    renderStudies();
    renderCalendar();
    renderTodos();
    renderNow();
  }

  function openStudy(studyId) {
    const s = getStudy(studyId);
    if (!s) return;

    currentStudyId = studyId;
    viewHome.classList.add("hidden");
    viewStudy.classList.remove("hidden");

    favoritesOnlyToggle.checked = favoritesOnly;
    studyTitle.textContent = s.name;
    studyMeta.textContent = `${(s.terms?.length || 0)} terms • updated ${new Date(s.updatedAt || s.createdAt).toLocaleDateString()}`;

    switchTab(currentTab);
    renderTerms();
    prepareFlashcards(true);
    prepareGimkit(true);
    prepareMatch(true);
    renderTestHistory();
    renderStats();
  }

  function switchTab(tabName) {
    currentTab = tabName;
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
    Object.entries(panels).forEach(([k, el]) => el.classList.toggle("hidden", k !== tabName));

    if (tabName === "terms") renderTerms();
    if (tabName === "flashcards") prepareFlashcards(false);
    if (tabName === "gimkit") prepareGimkit(false);
    if (tabName === "match") prepareMatch(false);
    if (tabName === "test") renderTestHistory();
    if (tabName === "stats") renderStats();
  }

  /* =========================================================
     STUDIES LIST
  ========================================================= */
  function renderStudies() {
    const q = (studySearch.value || "").trim().toLowerCase();
    const items = db.studies
      .slice()
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
      .filter(s => !q || (s.name || "").toLowerCase().includes(q));

    studiesList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.innerHTML = `No studies yet. Click <b>Create</b> to make one.`;
      studiesList.appendChild(empty);
      return;
    }

    items.forEach(s => {
      const row = document.createElement("div");
      row.className = "studyItem";

      const left = document.createElement("div");
      left.style.flex = "1";

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = s.name;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${(s.terms || []).length} terms • ${(s.tests || []).length} tests • updated ${new Date(s.updatedAt || s.createdAt).toLocaleDateString()}`;

      left.appendChild(name);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "right";

      const openBtn = document.createElement("button");
      openBtn.className = "btn primary";
      openBtn.textContent = "Open";
      openBtn.onclick = () => openStudy(s.id);

      const delBtn = document.createElement("button");
      delBtn.className = "btn danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
        db.studies = db.studies.filter(x => x.id !== s.id);
        persistAll();
        renderStudies();
      };

      right.appendChild(openBtn);
      right.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(right);
      studiesList.appendChild(row);
    });
  }

  function createStudy(name) {
    const nm = (name || "").trim();
    if (!nm) return alert("Give your study a name.");

    const s = {
      id: uid(),
      name: nm,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      terms: [],
      tests: []
    };
    db.studies.push(s);
    persistAll();
    renderStudies();
    openStudy(s.id);
  }

  /* =========================================================
     TERMS CRUD + BULK IMPORT (Question/Answer)
  ========================================================= */
  function renderTerms() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const q = (termSearch.value || "").trim().toLowerCase();
    const terms = (s.terms || []).slice();

    const filtered = terms.filter(t => {
      if (!q) return true;
      return (t.q || "").toLowerCase().includes(q) || (t.a || "").toLowerCase().includes(q);
    });

    termsList.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "No terms found. Add one or use Bulk Import.";
      termsList.appendChild(empty);
      return;
    }

    filtered.forEach(t => {
      ensureTermStats(t);

      const wrap = document.createElement("div");
      wrap.className = "termRow";

      const top = document.createElement("div");
      top.className = "termTop";

      const qEl = document.createElement("div");
      qEl.className = "termQ";
      qEl.textContent = t.q;

      const actions = document.createElement("div");
      actions.className = "termActions";

      const favBtn = document.createElement("button");
      favBtn.className = "iconBtn";
      favBtn.title = t.fav ? "Unfavorite" : "Favorite";
      favBtn.textContent = t.fav ? "★" : "☆";
      favBtn.onclick = () => {
        t.fav = !t.fav;
        s.updatedAt = Date.now();
        persistAll();
        renderTerms();
      };

      const editBtn = document.createElement("button");
      editBtn.className = "iconBtn";
      editBtn.title = "Edit";
      editBtn.textContent = "✎";
      editBtn.onclick = () => {
        editingTermId = t.id;
        termQ.value = t.q;
        termA.value = t.a;
        saveTermBtn.textContent = "Save changes";
        cancelEditTermBtn.disabled = false;
        termQ.focus();
      };

      const delBtn = document.createElement("button");
      delBtn.className = "iconBtn";
      delBtn.title = "Delete";
      delBtn.textContent = "🗑";
      delBtn.onclick = () => {
        if (!confirm("Delete this term?")) return;
        s.terms = s.terms.filter(x => x.id !== t.id);
        s.updatedAt = Date.now();
        persistAll();
        renderTerms();
        prepareFlashcards(true);
        prepareGimkit(true);
        prepareMatch(true);
        renderStats();
      };

      actions.appendChild(favBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      top.appendChild(qEl);
      top.appendChild(actions);

      const aEl = document.createElement("div");
      aEl.className = "termA";
      aEl.textContent = t.a;

      const st = document.createElement("div");
      st.className = "muted";
      st.style.marginTop = "8px";
      const missPct = percent(t.stats.wrong, t.stats.seen);
      st.textContent = `Missed: ${t.stats.wrong}/${t.stats.seen} (${missPct}%)`;

      wrap.appendChild(top);
      wrap.appendChild(aEl);
      wrap.appendChild(st);

      termsList.appendChild(wrap);
    });

    studyMeta.textContent = `${(s.terms?.length || 0)} terms • updated ${new Date(s.updatedAt || s.createdAt).toLocaleDateString()}`;
  }

  function saveTerm() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const q = (termQ.value || "").trim();
    const a = (termA.value || "").trim();
    if (!q || !a) return alert("Please enter both question and answer.");

    if (editingTermId) {
      const t = s.terms.find(x => x.id === editingTermId);
      if (t) { t.q = q; t.a = a; }
      editingTermId = null;
    } else {
      s.terms.push({ id: uid(), q, a, fav: false, stats: { seen: 0, wrong: 0 } });
    }

    s.updatedAt = Date.now();
    persistAll();

    termQ.value = "";
    termA.value = "";
    saveTermBtn.textContent = "Add term";
    cancelEditTermBtn.disabled = true;

    renderTerms();
    prepareFlashcards(true);
    prepareGimkit(true);
    prepareMatch(true);
    renderStats();
  }

  function cancelEdit() {
    editingTermId = null;
    termQ.value = "";
    termA.value = "";
    saveTermBtn.textContent = "Add term";
    cancelEditTermBtn.disabled = true;
  }

  // Bulk parser: Question/Answer (first slash)
  function parseLineToQA(line) {
    const raw = line.trim();
    if (!raw) return null;

    const slashIndex = raw.indexOf("/");
    if (slashIndex > 0 && slashIndex < raw.length - 1) {
      const q = raw.slice(0, slashIndex).trim();
      const a = raw.slice(slashIndex + 1).trim();
      if (q && a) return { q, a };
    }
    return null;
  }

  function bulkImport() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const text = (bulkInput.value || "").trim();
    if (!text) return alert("Paste some lines first.");

    const lines = text.split("\n");
    let added = 0;
    let skipped = 0;

    lines.forEach(line => {
      const qa = parseLineToQA(line);
      if (!qa) { skipped++; return; }
      s.terms.push({ id: uid(), q: qa.q, a: qa.a, fav: false, stats: { seen: 0, wrong: 0 } });
      added++;
    });

    s.updatedAt = Date.now();
    persistAll();

    renderTerms();
    prepareFlashcards(true);
    prepareGimkit(true);
    prepareMatch(true);
    renderStats();

    alert(`Imported ${added} term(s). Skipped ${skipped} line(s).`);
  }

  /* =========================================================
     FLASHCARDS
  ========================================================= */
  function prepareFlashcards(forceRestart) {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const terms = studyTerms(s);
    if (!terms.length) {
      fcQ.textContent = "No terms yet.";
      fcA.textContent = "Add terms in the Terms tab.";
      fcCounter.textContent = "0 / 0";
      return;
    }

    if (forceRestart || !fcOrder.length) {
      fcOrder = weightedOrderByMiss(terms);
      fcIndex = 0;
      flashInner.classList.remove("flipped");
    } else {
      const newIds = terms.map(t => t.id);
      const stillValid = fcOrder.filter(id => newIds.includes(id));
      fcOrder = stillValid.length ? stillValid : weightedOrderByMiss(terms);
      fcIndex = clamp(fcIndex, 0, fcOrder.length - 1);
      flashInner.classList.remove("flipped");
    }

    renderFlashcard();
  }

  function renderFlashcard() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const id = fcOrder[fcIndex];
    const t = (s.terms || []).find(x => x.id === id);

    if (!t) return prepareFlashcards(true);

    fcQ.textContent = t.q;
    fcA.textContent = t.a;
    fcCounter.textContent = `${fcIndex + 1} / ${fcOrder.length}`;
  }

  /* =========================================================
     GIMKIT
  ========================================================= */
  function prepareGimkit(forceRestart) {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const terms = studyTerms(s);

    if (!terms.length) {
      gkPrompt.textContent = "No terms yet.";
      gkChoices.innerHTML = "";
      gkCounter.textContent = "0 / 0";
      gkFeedback.classList.add("hidden");
      gkNextBtn.classList.add("hidden");
      return;
    }

    if (forceRestart || !gkOrder.length) {
      gkOrder = weightedOrderByMiss(terms);
      gkIndex = 0;
    } else {
      const newIds = terms.map(t => t.id);
      const filtered = gkOrder.filter(id => newIds.includes(id));
      gkOrder = filtered.length ? filtered : weightedOrderByMiss(terms);
      gkIndex = clamp(gkIndex, 0, gkOrder.length - 1);
    }

    gkLocked = false;
    gkFeedback.classList.add("hidden");
    gkNextBtn.classList.add("hidden");
    renderGimkitQuestion();
  }

  function renderGimkitQuestion() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const terms = studyTerms(s);
    if (!terms.length) return;

    if (gkIndex >= gkOrder.length) {
      gkOrder = weightedOrderByMiss(terms);
      gkIndex = 0;
    }

    const termId = gkOrder[gkIndex];
    gkLastTermId = termId;

    const t = (s.terms || []).find(x => x.id === termId);
    if (!t) { gkIndex++; return renderGimkitQuestion(); }

    gkPrompt.textContent = t.q;
    gkCounter.textContent = `${gkIndex + 1} / ${gkOrder.length}`;

    const pool = terms.filter(x => x.id !== termId).map(x => x.a);
    const wrongs = shuffle([...new Set(pool)]).slice(0, 3);
    const choices = shuffle([t.a, ...wrongs]);

    while (choices.length < 4) choices.push("—");
    const finalChoices = choices.slice(0, 4);

    gkChoices.innerHTML = "";
    gkLocked = false;
    gkFeedback.classList.add("hidden");
    gkNextBtn.classList.add("hidden");

    finalChoices.forEach(choiceText => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.textContent = choiceText;
      btn.onclick = () => onGimkitPick(btn, choiceText);
      gkChoices.appendChild(btn);
    });
  }

  function onGimkitPick(btn, choiceText) {
    if (gkLocked) return;

    const s = getStudy(currentStudyId);
    if (!s) return;

    const term = (s.terms || []).find(t => t.id === gkLastTermId);
    if (!term) return;

    ensureTermStats(term);
    term.stats.seen += 1;

    const correct = term.a;
    const isCorrect = (choiceText === correct);
    if (!isCorrect) term.stats.wrong += 1;

    gkLocked = true;

    [...gkChoices.querySelectorAll(".choice")].forEach(b => {
      if (b.textContent === correct) b.classList.add("correct");
      if (b === btn && !isCorrect) b.classList.add("wrong");
      b.disabled = true;
    });

    gkFeedback.classList.remove("hidden");
    gkFeedback.textContent = isCorrect ? "Correct." : `Wrong. Correct answer: ${correct}`;
    gkNextBtn.classList.remove("hidden");

    s.updatedAt = Date.now();
    persistAll();
    renderStats();
  }

  function gimkitNext() {
    gkIndex += 1;
    gkLocked = false;
    renderGimkitQuestion();
  }

  /* =========================================================
     MATCH MODE
  ========================================================= */
  function prepareMatch(forceRestart) {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const terms = studyTerms(s);
    if (!terms.length) {
      matchQs.innerHTML = "";
      matchAs.innerHTML = "";
      matchStatus.textContent = "Add terms first.";
      return;
    }

    if (forceRestart || !matchState) {
      const round = shuffle(terms).slice(0, Math.min(10, terms.length));
      const answers = shuffle(round.map(t => ({ id: t.id, a: t.a })));
      matchState = { round, answers, solved: new Set(), attempts: 0 };
    }

    renderMatch();
  }

  function renderMatch() {
    const s = getStudy(currentStudyId);
    if (!s || !matchState) return;

    matchQs.innerHTML = "";
    matchAs.innerHTML = "";

    matchState.round.forEach(t => {
      const card = document.createElement("div");
      card.className = "matchCard";

      const q = document.createElement("div");
      q.style.fontWeight = "950";
      q.textContent = t.q;

      const drop = document.createElement("div");
      drop.className = "matchDrop";
      drop.dataset.termId = t.id;
      drop.textContent = matchState.solved.has(t.id) ? "✅ Matched" : "Drop answer here";

      drop.ondragover = (e) => e.preventDefault();
      drop.ondrop = (e) => {
        e.preventDefault();
        const ansId = e.dataTransfer.getData("text/termId");
        handleMatchDrop(t.id, ansId, drop);
      };

      card.appendChild(q);
      card.appendChild(drop);
      matchQs.appendChild(card);
    });

    matchState.answers.forEach(x => {
      if (matchState.solved.has(x.id)) return;

      const a = document.createElement("div");
      a.className = "matchCard dragAns";
      a.textContent = x.a;
      a.draggable = true;
      a.ondragstart = (e) => e.dataTransfer.setData("text/termId", x.id);
      matchAs.appendChild(a);
    });

    const total = matchState.round.length;
    const done = matchState.solved.size;
    matchStatus.textContent = `Matched ${done}/${total}. Attempts: ${matchState.attempts}`;
  }

  function handleMatchDrop(questionTermId, answerTermId, dropEl) {
    const s = getStudy(currentStudyId);
    if (!s || !matchState) return;

    matchState.attempts++;

    const correct = (questionTermId === answerTermId);

    const term = (s.terms || []).find(t => t.id === questionTermId);
    if (term) {
      ensureTermStats(term);
      term.stats.seen += 1;
      if (!correct) term.stats.wrong += 1;
    }

    if (correct) {
      matchState.solved.add(questionTermId);
      dropEl.classList.add("matchGood");
    } else {
      dropEl.classList.add("matchBad");
      setTimeout(() => dropEl.classList.remove("matchBad"), 450);
    }

    s.updatedAt = Date.now();
    persistAll();
    renderStats();

    if (matchState.solved.size === matchState.round.length) {
      matchStatus.textContent = `Round complete! Attempts: ${matchState.attempts}. Hit Restart for a new round.`;
      renderMatch();
    } else {
      renderMatch();
    }
  }

  /* =========================================================
     TEST MODE
  ========================================================= */
  function resetTestUI() {
    activeTest = null;
    testArea.classList.add("hidden");
    submitTestBtn.classList.add("hidden");
    testResults.classList.add("hidden");
    testResults.innerHTML = "";
    testArea.innerHTML = "";
  }

  function startTest() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const terms = studyTerms(s);
    if (!terms.length) return alert("No terms available. Add terms first.");

    let n = parseInt(testCount.value, 10);
    if (Number.isNaN(n)) n = 1;
    n = clamp(n, 1, terms.length);
    testCount.value = String(n);

    const ids = shuffle(terms.map(t => t.id)).slice(0, n);
    activeTest = { ids, answers: new Map() };

    testArea.innerHTML = "";
    ids.forEach((id, idx) => {
      const term = (s.terms || []).find(t => t.id === id);
      const wrap = document.createElement("div");
      wrap.className = "testQ";

      const qText = document.createElement("div");
      qText.className = "qText";
      qText.textContent = `${idx + 1}. ${term?.q ?? "?"}`;

      const input = document.createElement("input");
      input.className = "input";
      input.placeholder = "Type your answer...";
      input.oninput = () => activeTest.answers.set(id, input.value);

      wrap.appendChild(qText);
      wrap.appendChild(input);
      testArea.appendChild(wrap);
    });

    testArea.classList.remove("hidden");
    submitTestBtn.classList.remove("hidden");
    testResults.classList.add("hidden");
    testResults.innerHTML = "";
  }

  function submitTest() {
    const s = getStudy(currentStudyId);
    if (!s || !activeTest) return;

    const results = [];
    let correctCount = 0;

    activeTest.ids.forEach(id => {
      const term = (s.terms || []).find(t => t.id === id);
      if (!term) return;

      ensureTermStats(term);

      const your = (activeTest.answers.get(id) || "").trim();
      const corr = (term.a || "").trim();
      const ok = your.toLowerCase() === corr.toLowerCase();

      term.stats.seen += 1;
      if (!ok) term.stats.wrong += 1;

      if (ok) correctCount++;
      results.push({ termId: id, your, correct: corr, ok });
    });

    const total = results.length;
    const wrong = results.filter(r => !r.ok);

    s.tests = s.tests || [];
    s.tests.unshift({
      id: uid(),
      date: Date.now(),
      total,
      correct: correctCount,
      wrongIds: wrong.map(w => w.termId),
      results
    });

    s.updatedAt = Date.now();
    persistAll();

    testResults.classList.remove("hidden");
    submitTestBtn.classList.add("hidden");

    const scorePct = percent(correctCount, total);
    let html = `<div class="pill">Score: ${correctCount}/${total} (${scorePct}%)</div>`;

    if (!wrong.length) {
      html += `<div style="margin-top:10px; font-weight:950;">Perfect.</div>`;
    } else {
      html += `<div style="margin-top:10px; font-weight:950;">You missed:</div>`;
      html += `<div class="list" style="margin-top:10px;">`;
      wrong.forEach(w => {
        const term = (s.terms || []).find(t => t.id === w.termId);
        html += `
          <div class="studyItem">
            <div style="flex:1">
              <div class="name">${escapeHTML(term ? term.q : "?")}</div>
              <div class="meta">Your answer: <b>${escapeHTML(w.your || "—")}</b> • Correct: <b>${escapeHTML(w.correct)}</b></div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    testResults.innerHTML = html;
    renderTestHistory();
    renderStats();
  }

  function renderTestHistory() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const tests = (s.tests || []).slice(0, 20);
    testHistory.innerHTML = "";

    if (!tests.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "No tests yet. Start one to save results here.";
      testHistory.appendChild(empty);
      return;
    }

    tests.forEach(t => {
      const row = document.createElement("div");
      row.className = "studyItem";

      const left = document.createElement("div");
      left.style.flex = "1";

      const scorePct = percent(t.correct, t.total);

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = `${t.correct}/${t.total} (${scorePct}%)`;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `Taken: ${fmtDateTime(t.date)} • Missed: ${t.total - t.correct}`;

      left.appendChild(name);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "right";

      const viewBtn = document.createElement("button");
      viewBtn.className = "btn";
      viewBtn.textContent = "View";
      viewBtn.onclick = () => {
        testResults.classList.remove("hidden");
        submitTestBtn.classList.add("hidden");
        const wrong = (t.results || []).filter(r => !r.ok);
        let html = `<div class="pill">Score: ${t.correct}/${t.total} (${scorePct}%)</div>`;
        if (!wrong.length) {
          html += `<div style="margin-top:10px; font-weight:950;">Perfect.</div>`;
        } else {
          html += `<div style="margin-top:10px; font-weight:950;">Missed:</div>`;
          html += `<div class="list" style="margin-top:10px;">`;
          wrong.forEach(w => {
            const term = (s.terms || []).find(x => x.id === w.termId);
            html += `
              <div class="studyItem">
                <div style="flex:1">
                  <div class="name">${escapeHTML(term ? term.q : "?")}</div>
                  <div class="meta">Your answer: <b>${escapeHTML(w.your || "—")}</b> • Correct: <b>${escapeHTML(w.correct)}</b></div>
                </div>
              </div>
            `;
          });
          html += `</div>`;
        }
        testResults.innerHTML = html;
      };

      const delBtn = document.createElement("button");
      delBtn.className = "btn danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (!confirm("Delete this test record?")) return;
        s.tests = (s.tests || []).filter(x => x.id !== t.id);
        s.updatedAt = Date.now();
        persistAll();
        renderTestHistory();
      };

      right.appendChild(viewBtn);
      right.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(right);
      testHistory.appendChild(row);
    });
  }

  /* =========================================================
     STATS
  ========================================================= */
  function renderStats() {
    const s = getStudy(currentStudyId);
    if (!s) return;

    const terms = (s.terms || []).map(ensureTermStats);
    const sorted = terms
      .slice()
      .sort((a, b) => {
        const ap = percent(a.stats.wrong, a.stats.seen);
        const bp = percent(b.stats.wrong, b.stats.seen);
        if (bp !== ap) return bp - ap;
        return (b.stats.wrong - a.stats.wrong);
      })
      .slice(0, 12);

    mostMissed.innerHTML = "";
    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "No stats yet. Do Gimkit / Match / Tests to generate stats.";
      mostMissed.appendChild(empty);
    } else {
      sorted.forEach(t => {
        const row = document.createElement("div");
        row.className = "studyItem";

        const left = document.createElement("div");
        left.style.flex = "1";

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = t.q;

        const missPct = percent(t.stats.wrong, t.stats.seen);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `Missed: ${t.stats.wrong}/${t.stats.seen} (${missPct}%)`;

        left.appendChild(name);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.className = "right";
        const fav = document.createElement("div");
        fav.className = "pill";
        fav.textContent = t.fav ? "★ Favorite" : "☆ Not favorite";
        right.appendChild(fav);

        row.appendChild(left);
        row.appendChild(right);

        mostMissed.appendChild(row);
      });
    }

    const totalTerms = (s.terms || []).length;
    const favCount = (s.terms || []).filter(t => t.fav).length;
    const totalSeen = (s.terms || []).reduce((acc, t) => acc + (t.stats?.seen || 0), 0);
    const totalWrong = (s.terms || []).reduce((acc, t) => acc + (t.stats?.wrong || 0), 0);
    const missPctTotal = percent(totalWrong, totalSeen);

    const tests = s.tests || [];
    const lastTest = tests[0] || null;

    studyStatsSummary.innerHTML = "";
    const boxes = [
      { big: String(totalTerms), small: "Total terms" },
      { big: String(favCount), small: "Favorites" },
      { big: `${missPctTotal}%`, small: "Overall miss %" },
      { big: String(tests.length), small: "Tests taken" }
    ];
    boxes.forEach(b => {
      const box = document.createElement("div");
      box.className = "statBox";
      box.innerHTML = `<div class="big">${b.big}</div><div class="small">${b.small}</div>`;
      studyStatsSummary.appendChild(box);
    });

    if (lastTest) {
      const scorePct = percent(lastTest.correct, lastTest.total);
      const extra = document.createElement("div");
      extra.className = "statBox";
      extra.style.gridColumn = "1 / -1";
      extra.innerHTML = `<div class="big">Last test: ${scorePct}%</div><div class="small">${fmtDateTime(lastTest.date)}</div>`;
      studyStatsSummary.appendChild(extra);
    }
  }

  /* =========================================================
     STUDY ACTIONS
  ========================================================= */
  function renameStudy() {
    const s = getStudy(currentStudyId);
    if (!s) return;
    const nm = prompt("New study name:", s.name);
    if (nm == null) return;
    const name = nm.trim();
    if (!name) return;
    s.name = name;
    s.updatedAt = Date.now();
    persistAll();
    studyTitle.textContent = s.name;
    renderStudies();
  }

  function deleteCurrentStudy() {
    const s = getStudy(currentStudyId);
    if (!s) return;
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    db.studies = db.studies.filter(x => x.id !== s.id);
    persistAll();
    showHome();
  }

  /* =========================================================
     IMPORT / EXPORT JSON + SAME-NAME MERGE/REPLACE
  ========================================================= */
  function downloadJSON(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openImportModal() {
    importModal.classList.remove("hidden");
    importText.value = "";
    importText.focus();
  }
  function closeImportModal() {
    importModal.classList.add("hidden");
  }

  function normalizeName(s) { return (s || "").trim().toLowerCase(); }

  function dedupeKey(q, a) {
    return `${normalizeName(q)}||${normalizeName(a)}`;
  }

  function mergeStudyInto(existing, incoming) {
    existing.terms = existing.terms || [];
    existing.tests = existing.tests || [];

    // Term dedupe by (q,a)
    const have = new Set(existing.terms.map(t => dedupeKey(t.q, t.a)));
    (incoming.terms || []).forEach(t => {
      const k = dedupeKey(t.q, t.a);
      if (have.has(k)) return;
      existing.terms.push({
        id: uid(),
        q: (t.q || "").trim(),
        a: (t.a || "").trim(),
        fav: !!t.fav,
        stats: t.stats ? { seen: +t.stats.seen || 0, wrong: +t.stats.wrong || 0 } : { seen: 0, wrong: 0 }
      });
      have.add(k);
    });

    // Append tests (new IDs)
    (incoming.tests || []).forEach(t => {
      existing.tests.unshift({
        id: uid(),
        date: t.date || Date.now(),
        total: t.total || 0,
        correct: t.correct || 0,
        wrongIds: [],
        results: t.results || []
      });
    });

    existing.updatedAt = Date.now();
  }

  function cleanIncomingStudy(study) {
    // Keep structure but ensure safe
    return {
      id: uid(),
      name: (study.name || "Imported Study").trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      terms: (study.terms || []).map(t => ({
        id: uid(),
        q: (t.q || "").trim(),
        a: (t.a || "").trim(),
        fav: !!t.fav,
        stats: t.stats ? { seen: +t.stats.seen || 0, wrong: +t.stats.wrong || 0 } : { seen: 0, wrong: 0 }
      })),
      tests: (study.tests || []).map(t => ({
        id: uid(),
        date: t.date || Date.now(),
        total: t.total || 0,
        correct: t.correct || 0,
        wrongIds: [],
        results: t.results || []
      }))
    };
  }

  function importJSONPayload(payload) {
    const incomingStudies =
      payload?.db?.studies ? payload.db.studies :
      payload?.study ? [payload.study] :
      payload?.studies ? payload.studies :
      null;

    if (!incomingStudies || !Array.isArray(incomingStudies) || !incomingStudies.length) {
      alert("No studies found in that JSON.");
      return;
    }

    let imported = 0;

    incomingStudies.forEach(raw => {
      const incoming = cleanIncomingStudy(raw);
      const existing = db.studies.find(s => normalizeName(s.name) === normalizeName(incoming.name));

      if (!existing) {
        db.studies.push(incoming);
        imported++;
        return;
      }

      // Same name: ask merge or replace old
      const merge = confirm(
        `A study named "${existing.name}" already exists.\n\nOK = Merge into existing\nCancel = Replace (delete old)`
      );

      if (merge) {
        mergeStudyInto(existing, incoming);
        imported++;
      } else {
        const sure = confirm(`Replace will delete the old "${existing.name}" and import the new one. Continue?`);
        if (!sure) return;
        db.studies = db.studies.filter(s => s.id !== existing.id);
        db.studies.push(incoming);
        imported++;
      }
    });

    persistAll();
    renderStudies();
    alert(`Imported ${imported} study(s).`);
  }

  /* =========================================================
     CALENDAR (Jan 2026 -> Jan 2027)
  ========================================================= */
  const CAL_START = { y: 2026, m: 0 };
  const CAL_MONTHS = 13;

  function monthKeyFromIndex(idx) {
    const base = new Date(CAL_START.y, CAL_START.m, 1);
    base.setMonth(base.getMonth() + idx);
    return { y: base.getFullYear(), m: base.getMonth() };
  }

  function dateKey(y, m, d) {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  function ensureDay(key) {
    if (!calendar.events[key]) calendar.events[key] = { items: [] };
    if (!Array.isArray(calendar.events[key].items)) calendar.events[key].items = [];
    return calendar.events[key];
  }

  function renderCalendar() {
    calMonth = clamp(calMonth, 0, CAL_MONTHS - 1);
    const { y, m } = monthKeyFromIndex(calMonth);

    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startDow = first.getDay();
    const daysInMonth = last.getDate();

    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const wrap = document.createElement("div");
    wrap.className = "calendar";

    const head = document.createElement("div");
    head.className = "calHead";

    const title = document.createElement("div");
    title.className = "calTitle";
    title.textContent = `${first.toLocaleString(undefined, { month: "long" })} ${y}`;

    const nav = document.createElement("div");
    nav.className = "calNav";

    const prev = document.createElement("button");
    prev.className = "btn";
    prev.textContent = "←";
    prev.disabled = calMonth === 0;
    prev.onclick = () => { calMonth--; renderCalendar(); };

    const next = document.createElement("button");
    next.className = "btn";
    next.textContent = "→";
    next.disabled = calMonth === CAL_MONTHS - 1;
    next.onclick = () => { calMonth++; renderCalendar(); };

    nav.appendChild(prev);
    nav.appendChild(next);

    head.appendChild(title);
    head.appendChild(nav);

    const grid = document.createElement("div");
    grid.className = "calGrid";

    const dows = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    dows.forEach(d => {
      const el = document.createElement("div");
      el.className = "dow";
      el.textContent = d;
      grid.appendChild(el);
    });

    for (let i = 0; i < startDow; i++) {
      const blank = document.createElement("div");
      blank.style.opacity = "0";
      grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(y, m, d);
      const dayBtn = document.createElement("button");
      dayBtn.className = "day";
      if (key === todayKey) dayBtn.classList.add("today");

      const num = document.createElement("div");
      num.className = "num";
      num.textContent = d;
      dayBtn.appendChild(num);

      const items = calendar.events[key]?.items || [];
      if (items.length) {
        const dot = document.createElement("div");
        dot.className = "dot";
        dayBtn.appendChild(dot);
      }

      dayBtn.onclick = () => openDayModal(key);
      grid.appendChild(dayBtn);
    }

    wrap.appendChild(head);
    wrap.appendChild(grid);

    calendarWrap.innerHTML = "";
    calendarWrap.appendChild(wrap);
  }

  function openDayModal(key) {
    selectedDayKey = key;
    editingEventId = null;
    dayModalTitle.textContent = key;

    ensureDay(key);
    eventText.value = "";
    saveEventBtn.textContent = "Add";
    deleteEventBtn.disabled = true;

    renderDayEventsList();
    dayModal.classList.remove("hidden");
    eventText.focus();
  }

  function renderDayEventsList() {
    if (!selectedDayKey) return;
    const day = ensureDay(selectedDayKey);
    const items = day.items || [];

    dayEventsList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "No reminders for this day yet.";
      dayEventsList.appendChild(empty);
      return;
    }

    items
      .slice()
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
      .forEach(ev => {
        const row = document.createElement("div");
        row.className = "studyItem";

        const left = document.createElement("div");
        left.style.flex = "1";

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = ev.text;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `Updated: ${fmtDateTime(ev.updatedAt || ev.createdAt)}`;

        left.appendChild(name);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.className = "right";

        const editBtn = document.createElement("button");
        editBtn.className = "btn";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => {
          editingEventId = ev.id;
          eventText.value = ev.text;
          saveEventBtn.textContent = "Save";
          deleteEventBtn.disabled = false;
        };

        const delBtn = document.createElement("button");
        delBtn.className = "btn danger";
        delBtn.textContent = "Delete";
        delBtn.onclick = () => {
          if (!confirm("Delete this reminder?")) return;
          day.items = day.items.filter(x => x.id !== ev.id);
          if (!day.items.length) delete calendar.events[selectedDayKey];
          delete calendar.dismissed[selectedDayKey];
          persistAll();
          renderDayEventsList();
          renderCalendar();
          renderNow();
        };

        right.appendChild(editBtn);
        right.appendChild(delBtn);

        row.appendChild(left);
        row.appendChild(right);

        dayEventsList.appendChild(row);
      });
  }

  function closeDayModal() {
    dayModal.classList.add("hidden");
    selectedDayKey = null;
    editingEventId = null;
    saveEventBtn.textContent = "Add";
    eventText.value = "";
  }

  function saveEvent() {
    if (!selectedDayKey) return;
    const txt = (eventText.value || "").trim();
    if (!txt) return alert("Type a reminder first.");

    const day = ensureDay(selectedDayKey);

    if (editingEventId) {
      const ev = day.items.find(x => x.id === editingEventId);
      if (ev) {
        ev.text = txt;
        ev.updatedAt = Date.now();
      }
    } else {
      day.items.push({ id: uid(), text: txt, createdAt: Date.now(), updatedAt: Date.now() });
    }

    delete calendar.dismissed[selectedDayKey];
    persistAll();

    editingEventId = null;
    eventText.value = "";
    saveEventBtn.textContent = "Add";
    deleteEventBtn.disabled = true;

    renderDayEventsList();
    renderCalendar();
    renderNow();
  }

  function deleteEvent() {
    if (!selectedDayKey || !editingEventId) return;
    const day = ensureDay(selectedDayKey);
    const ev = day.items.find(x => x.id === editingEventId);
    if (!ev) return;

    if (!confirm("Delete this reminder?")) return;

    day.items = day.items.filter(x => x.id !== editingEventId);
    if (!day.items.length) delete calendar.events[selectedDayKey];
    delete calendar.dismissed[selectedDayKey];

    persistAll();
    editingEventId = null;
    eventText.value = "";
    saveEventBtn.textContent = "Add";
    deleteEventBtn.disabled = true;

    renderDayEventsList();
    renderCalendar();
    renderNow();
  }

  function checkTodayNotification() {
    const key = nowISODate();
    const items = calendar.events[key]?.items || [];
    const alreadyDismissed = !!calendar.dismissed[key];

    if (items.length && !alreadyDismissed) {
      pendingNotifyKey = key;
      notifyText.textContent = items.map((x, i) => `${i + 1}. ${x.text}`).join("\n");
      notifyModal.classList.remove("hidden");
    }
  }

  function dismissNotify() {
    if (pendingNotifyKey) {
      calendar.dismissed[pendingNotifyKey] = true;
      persistAll();
    }
    notifyModal.classList.add("hidden");
  }

  function editNotify() {
    if (!pendingNotifyKey) return;
    notifyModal.classList.add("hidden");
    openDayModal(pendingNotifyKey);
  }

  /* =========================================================
     TODO LIST (Countdown delete)
  ========================================================= */
  function countdownText(deleteAt) {
    const ms = deleteAt - Date.now();
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${s}s`;
  }

  function addTodo() {
    const txt = (todoInput.value || "").trim();
    if (!txt) return;
    todos.items.push({
      id: uid(),
      text: txt,
      createdAt: Date.now(),
      done: false,
      deleting: false,
      deleteAt: null
    });
    todoInput.value = "";
    persistAll();
    renderTodos();
  }

  function toggleTodo(id, done) {
    const item = todos.items.find(x => x.id === id);
    if (!item) return;
    item.done = done;

    if (done) {
      item.deleting = true;
      item.deleteAt = Date.now() + 12000;
    } else {
      item.deleting = false;
      item.deleteAt = null;
    }

    persistAll();
    renderTodos();
  }

  function startDeleteTodo(id) {
    const item = todos.items.find(x => x.id === id);
    if (!item) return;
    item.deleting = true;
    item.deleteAt = Date.now() + 6000;
    persistAll();
    renderTodos();
  }

  function renderTodos() {
    todoList.innerHTML = "";

    if (!todos.items.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "No to-dos yet.";
      todoList.appendChild(empty);
      return;
    }

    todos.items
      .slice()
      .sort((a, b) => (b.createdAt - a.createdAt))
      .forEach(item => {
        const row = document.createElement("div");
        row.className = "todoItem";

        const left = document.createElement("div");
        left.className = "todoLeft";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!item.done;
        cb.onchange = () => toggleTodo(item.id, cb.checked);

        const textWrap = document.createElement("div");

        const txt = document.createElement("div");
        txt.className = "todoText";
        txt.textContent = item.text;

        const meta = document.createElement("div");
        meta.className = "todoMeta";
        meta.textContent = item.deleting
          ? "Deleting soon..."
          : `Added: ${new Date(item.createdAt).toLocaleString()}`;

        textWrap.appendChild(txt);
        textWrap.appendChild(meta);

        left.appendChild(cb);
        left.appendChild(textWrap);

        const right = document.createElement("div");

        if (item.deleting && item.deleteAt) {
          const cd = document.createElement("div");
          cd.className = "todoCountdown";
          cd.textContent = countdownText(item.deleteAt);
          right.appendChild(cd);
        } else {
          const del = document.createElement("button");
          del.className = "btn danger";
          del.textContent = "Delete";
          del.onclick = () => startDeleteTodo(item.id);
          right.appendChild(del);
        }

        row.appendChild(left);
        row.appendChild(right);
        todoList.appendChild(row);
      });
  }

  function tickTodos() {
    const now = Date.now();
    let changed = false;

    todos.items.forEach(item => {
      if (item.deleting && item.deleteAt && now >= item.deleteAt) changed = true;
    });

    if (changed) {
      todos.items = todos.items.filter(item => !(item.deleting && item.deleteAt && now >= item.deleteAt));
      persistAll();
    }

    if (!viewHome.classList.contains("hidden")) renderTodos();
  }

  /* =========================================================
     EVENTS / UI WIRING
  ========================================================= */
  homeBtn.onclick = showHome;
  backToHomeLink.onclick = (e) => { e.preventDefault(); showHome(); };

  createStudyBtn.onclick = () => {
    createStudyModal.classList.remove("hidden");
    newStudyName.value = "";
    newStudyName.focus();
  };
  closeCreateStudyBtn.onclick = () => createStudyModal.classList.add("hidden");
  cancelCreateStudyBtn.onclick = () => createStudyModal.classList.add("hidden");
  confirmCreateStudyBtn.onclick = () => {
    createStudyModal.classList.add("hidden");
    createStudy(newStudyName.value);
  };
  newStudyName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmCreateStudyBtn.click();
  });

  studySearch.oninput = renderStudies;
  clearSearchBtn.onclick = () => { studySearch.value = ""; renderStudies(); };

  tabs.forEach(t => t.onclick = () => switchTab(t.dataset.tab));

  favoritesOnlyToggle.onchange = () => {
    favoritesOnly = favoritesOnlyToggle.checked;
    persistAll();
    prepareFlashcards(true);
    prepareGimkit(true);
    prepareMatch(true);
    resetTestUI();
    renderTerms();
    renderStats();
  };

  // Terms
  saveTermBtn.onclick = saveTerm;
  cancelEditTermBtn.onclick = cancelEdit;
  termSearch.oninput = renderTerms;
  clearTermSearchBtn.onclick = () => { termSearch.value = ""; renderTerms(); };

  // Bulk
  bulkImportBtn.onclick = bulkImport;
  bulkClearBtn.onclick = () => { bulkInput.value = ""; };

  // Flashcards
  flashCard.onclick = () => flashInner.classList.toggle("flipped");
  fcPrevBtn.onclick = () => {
    if (!fcOrder.length) return;
    fcIndex = (fcIndex - 1 + fcOrder.length) % fcOrder.length;
    flashInner.classList.remove("flipped");
    renderFlashcard();
  };
  fcNextBtn.onclick = () => {
    if (!fcOrder.length) return;
    fcIndex = (fcIndex + 1) % fcOrder.length;
    flashInner.classList.remove("flipped");
    renderFlashcard();
  };
  fcRestartBtn.onclick = () => prepareFlashcards(true);

  // Gimkit
  gkNextBtn.onclick = gimkitNext;
  gkRestartBtn.onclick = () => prepareGimkit(true);

  // Match
  matchRestartBtn.onclick = () => prepareMatch(true);

  // Test
  startTestBtn.onclick = startTest;
  resetTestBtn.onclick = resetTestUI;
  submitTestBtn.onclick = submitTest;

  testCount.addEventListener("input", () => {
    const s = getStudy(currentStudyId);
    if (!s) return;
    const max = studyTerms(s).length || 1;
    testCount.max = String(max);
    const n = clamp(parseInt(testCount.value || "1", 10) || 1, 1, max);
    testCount.value = String(n);
  });

  // Study actions
  renameStudyBtn.onclick = renameStudy;
  deleteStudyBtn.onclick = deleteCurrentStudy;

  // Settings
  openSettingsBtn.onclick = () => settingsModal.classList.remove("hidden");
  closeSettingsBtn.onclick = () => settingsModal.classList.add("hidden");
  toggleThemeBtn.onclick = () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    persistAll();
    applySettings();
  };
  accentPicker.oninput = () => {
    settings.accent = accentPicker.value;
    persistAll();
    applySettings();
  };

  colorArea.onchange = refreshColorPicker;

  applyColorBtn.onclick = () => {
    const key = colorArea.value;
    settings.colors = settings.colors || {};
    settings.colors[key] = colorValue.value;
    persistAll();
    applySettings();
  };

  clearColorBtn.onclick = () => {
    const key = colorArea.value;
    settings.colors = settings.colors || {};
    settings.colors[key] = "";
    persistAll();
    applySettings();
    refreshColorPicker();
  };

  // Modals click-outside
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.add("hidden");
  });
  createStudyModal.addEventListener("click", (e) => {
    if (e.target === createStudyModal) createStudyModal.classList.add("hidden");
  });
  importModal.addEventListener("click", (e) => {
    if (e.target === importModal) closeImportModal();
  });
  dayModal.addEventListener("click", (e) => {
    if (e.target === dayModal) closeDayModal();
  });
  notifyModal.addEventListener("click", (e) => {
    if (e.target === notifyModal) dismissNotify();
  });

  // Calendar modal
  closeDayModalBtn.onclick = closeDayModal;
  closeDayModalBtn2.onclick = closeDayModal;
  saveEventBtn.onclick = saveEvent;
  deleteEventBtn.onclick = deleteEvent;

  // Notify modal
  dismissNotifyBtn.onclick = dismissNotify;
  editNotifyBtn.onclick = editNotify;
  closeNotifyBtn.onclick = dismissNotify;

  // To-do
  addTodoBtn.onclick = addTodo;
  todoInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTodo(); });

  // Import/Export
  exportAllBtn.onclick = () => downloadJSON("studies-export.json", { version: 2, exportedAt: Date.now(), db });
  exportStudyBtn.onclick = () => {
    const s = getStudy(currentStudyId);
    if (!s) return;
    downloadJSON(`${s.name.replaceAll(" ", "_")}-export.json`, { version: 2, exportedAt: Date.now(), study: s });
  };

  importBtn.onclick = openImportModal;
  closeImportBtn.onclick = closeImportModal;
  cancelImportBtn.onclick = closeImportModal;

  confirmImportBtn.onclick = () => {
    let payload;
    try {
      payload = JSON.parse(importText.value);
    } catch {
      return alert("That JSON is invalid.");
    }
    importJSONPayload(payload);
    closeImportModal();
  };

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (viewStudy.classList.contains("hidden")) return;

    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (currentTab === "flashcards") {
      if (e.key === "ArrowLeft") { e.preventDefault(); fcPrevBtn.click(); }
      if (e.key === "ArrowRight") { e.preventDefault(); fcNextBtn.click(); }
      if (e.key === " ") { e.preventDefault(); flashCard.click(); }
    }

    if (currentTab === "gimkit") {
      const n = ["1","2","3","4"].indexOf(e.key);
      if (n !== -1) {
        e.preventDefault();
        const btns = [...gkChoices.querySelectorAll(".choice")];
        if (btns[n]) btns[n].click();
      }
      if (e.key === "Enter" && !gkNextBtn.classList.contains("hidden")) {
        e.preventDefault();
        gkNextBtn.click();
      }
    }
  });

  /* =========================================================
     INIT / MIGRATION
  ========================================================= */
  function init() {
    // Sanity checks
    if (!db || !Array.isArray(db.studies)) db = { studies: [] };
    db.studies.forEach(s => {
      if (!Array.isArray(s.terms)) s.terms = [];
      if (!Array.isArray(s.tests)) s.tests = [];
      s.terms.forEach(ensureTermStats);
      if (!s.createdAt) s.createdAt = Date.now();
      if (!s.updatedAt) s.updatedAt = s.createdAt;
    });

    if (!calendar || typeof calendar !== "object") calendar = { events: {}, dismissed: {} };
    if (!calendar.events) calendar.events = {};
    if (!calendar.dismissed) calendar.dismissed = {};

    // Ensure day shapes
    Object.keys(calendar.events).forEach(k => ensureDay(k));

    if (!todos || typeof todos !== "object") todos = { items: [] };
    if (!Array.isArray(todos.items)) todos.items = [];

    persistAll();
    applySettings();

    showHome();
    checkTodayNotification();

    setInterval(tickTodos, 500);
    setInterval(renderNow, 1000);
  }

  init();
})();
