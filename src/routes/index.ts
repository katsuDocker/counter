import { Hono } from "hono";

import apiRoutes from "./api";

const routes = new Hono();

routes.get("/", (c) => {
  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#f4f6f2" />
    <title>Progress — Counter</title>
    <style>
      :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #18251f; background: #f4f6f2; font-synthesis: none; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(ellipse at 80% 0%, #e4eee3 0, transparent 38rem), #f4f6f2; }
      html { color-scheme: light; }
      html[data-theme="dark"] { color-scheme: dark; color: #e7eee9; background: #111a15; }
      html[data-theme="dark"] body { background: radial-gradient(ellipse at 80% 0%, #20352a 0, transparent 38rem), #111a15; }
      .shell { width: min(100% - 40px, 1040px); margin: 0 auto; padding: 54px 0 72px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 42px; }
      .header-actions { display: flex; align-items: center; gap: 20px; }
      .brand { display: flex; align-items: center; gap: 12px; font-weight: 750; letter-spacing: -.03em; }
      .brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; color: #f7fbf5; background: #245c41; font-size: 20px; }
      .live { display: flex; align-items: center; gap: 8px; color: #617067; font-size: 13px; }
      .live::before { width: 8px; height: 8px; border-radius: 50%; background: #43a36b; content: ""; box-shadow: 0 0 0 4px #43a36b20; }
      .theme-toggle { display: flex; align-items: center; gap: 8px; min-height: 38px; margin: 0; padding: 0 12px; border: 1px solid #dce4dc; border-radius: 999px; background: #fff; color: #405449; font-size: 12px; font-weight: 650; }
      .theme-toggle:hover { border-color: #a8bcad; background: #f6f8f5; transform: none; }
      .theme-icon { font-size: 15px; line-height: 1; }
      .eyebrow { margin: 0 0 10px; color: #698071; font-size: 12px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(34px, 5vw, 52px); letter-spacing: -.055em; line-height: 1.05; }
      .intro { margin: 12px 0 30px; color: #718078; font-size: 16px; }
      .layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr); gap: 20px; align-items: start; }
      .card { border: 1px solid #e6ebe5; border-radius: 22px; background: #fff; box-shadow: 0 12px 40px #20382908; }
      .overview { padding: clamp(24px, 4vw, 38px); }
      .section-heading { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
      .section-heading h2, .updates h2 { margin: 0; font-size: 18px; letter-spacing: -.025em; }
      .target-pill { padding: 7px 11px; border-radius: 999px; color: #40634e; background: #edf5ee; font-size: 12px; font-weight: 700; white-space: nowrap; }
      .numbers { display: flex; align-items: baseline; gap: 10px; margin: 38px 0 9px; }
      .current { font-size: clamp(42px, 8vw, 72px); font-weight: 740; letter-spacing: -.065em; line-height: 1; font-variant-numeric: tabular-nums; }
      .of-target { color: #93a097; font-size: 15px; }
      .bar { height: 12px; margin: 26px 0 13px; overflow: hidden; border-radius: 99px; background: #edf1ed; }
      .bar-fill { width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #41845b, #8bc17d); transition: width .45s ease; }
      .progress-meta { display: flex; justify-content: space-between; gap: 16px; color: #77847c; font-size: 13px; }
      .progress-meta strong { color: #315e42; font-size: 14px; }
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 30px; }
      .stat { padding: 16px; border-radius: 15px; background: #f6f8f5; }
      .stat-label { display: block; margin-bottom: 7px; color: #829087; font-size: 12px; }
      .stat-value { font-size: 20px; font-weight: 720; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
      .stat-note { display: block; margin-top: 5px; color: #829087; font-size: 11px; line-height: 1.4; }
      .side { display: grid; gap: 20px; }
      .form-card { padding: 25px; }
      .form-card h2 { margin: 0 0 7px; font-size: 18px; letter-spacing: -.025em; }
      .form-copy { margin: 0 0 22px; color: #829087; font-size: 13px; line-height: 1.5; }
      label { display: block; margin: 0 0 8px; color: #47564d; font-size: 13px; font-weight: 650; }
      input { width: 100%; height: 48px; padding: 0 13px; border: 1px solid #dce4dc; border-radius: 11px; outline: none; background: #fbfcfb; color: #18251f; font: inherit; font-size: 15px; }
      input:focus { border-color: #57936b; box-shadow: 0 0 0 3px #57936b20; }
      button { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 48px; margin-top: 15px; border: 0; border-radius: 11px; background: #245c41; color: white; cursor: pointer; font: inherit; font-weight: 700; transition: background .2s, transform .2s; }
      button:hover { background: #194a33; transform: translateY(-1px); }
      button:disabled { cursor: wait; opacity: .65; transform: none; }
      .message { min-height: 18px; margin: 12px 0 0; color: #477b56; font-size: 12px; }
      .message.error { color: #b44141; }
      .updates { padding: 24px; }
      .updates-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .count { color: #8b978f; font-size: 12px; }
      .update-list { display: grid; gap: 2px; }
      .update-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid #eef1ee; }
      .update-date { overflow: hidden; color: #7c8981; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
      .update-value { flex: none; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .empty { padding: 18px 0 4px; color: #87938b; font-size: 13px; }
      .error-banner { margin: 15px 0 0; color: #b44141; font-size: 13px; }
      html[data-theme="dark"] .card { border-color: #2a3930; background: #1a251e; box-shadow: 0 12px 40px #00000020; }
      html[data-theme="dark"] .brand-mark { background: #38704d; }
      html[data-theme="dark"] .live { color: #a4b3a9; }
      html[data-theme="dark"] .eyebrow { color: #9ab9a2; }
      html[data-theme="dark"] .intro, html[data-theme="dark"] .form-copy { color: #a0aea5; }
      html[data-theme="dark"] .target-pill { color: #c3e2ca; background: #263b2d; }
      html[data-theme="dark"] .of-target { color: #a2b0a7; }
      html[data-theme="dark"] .bar { background: #2b3930; }
      html[data-theme="dark"] .progress-meta { color: #a0aea5; }
      html[data-theme="dark"] .progress-meta strong { color: #b5dfbf; }
      html[data-theme="dark"] .stat { background: #202d25; }
      html[data-theme="dark"] .stat-label, html[data-theme="dark"] .stat-note { color: #9aa99f; }
      html[data-theme="dark"] label { color: #c7d2ca; }
      html[data-theme="dark"] input { border-color: #39493e; background: #151e19; color: #e7eee9; }
      html[data-theme="dark"] input:focus { border-color: #78b18a; box-shadow: 0 0 0 3px #78b18a30; }
      html[data-theme="dark"] button:not(.theme-toggle) { background: #38704d; }
      html[data-theme="dark"] button:not(.theme-toggle):hover { background: #44845b; }
      html[data-theme="dark"] .message { color: #a5d8b1; }
      html[data-theme="dark"] .message.error, html[data-theme="dark"] .error-banner { color: #ffaaaa; }
      html[data-theme="dark"] .count, html[data-theme="dark"] .update-date, html[data-theme="dark"] .empty { color: #9aa99f; }
      html[data-theme="dark"] .update-row { border-color: #2b3930; }
      html[data-theme="dark"] .theme-toggle { border-color: #3b4a40; background: #202d25; color: #d6e4da; }
      html[data-theme="dark"] .theme-toggle:hover { border-color: #617b69; background: #29392f; }
      @media (max-width: 760px) { .shell { padding-top: 30px; } header { margin-bottom: 34px; } .layout { grid-template-columns: 1fr; } .side { grid-row: auto; } }
      @media (max-width: 420px) { .shell { width: min(100% - 28px, 1040px); } .stats { gap: 8px; } .stat { padding: 13px; } .live { font-size: 11px; } .header-actions { gap: 10px; } .theme-toggle { gap: 5px; padding: 0 9px; } }
    </style>
    <script>
      try {
        const savedTheme = localStorage.getItem("counter-theme");
        const initialTheme = savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        document.documentElement.dataset.theme = initialTheme;
        document.querySelector('meta[name="theme-color"]').content = initialTheme === "dark" ? "#111a15" : "#f4f6f2";
      } catch {
        document.documentElement.dataset.theme = "light";
      }
    </script>
  </head>
  <body>
    <main class="shell">
      <header>
        <div class="brand"><span class="brand-mark">↗</span><span>Counter</span></div>
        <div class="header-actions">
          <div class="live">Live progress</div>
          <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false"><span class="theme-icon" aria-hidden="true">☾</span><span id="theme-label">Dark mode</span></button>
        </div>
      </header>
      <p class="eyebrow">Your momentum, at a glance</p>
      <h1>Progress dashboard</h1>
      <p class="intro">Track the latest total and keep moving toward your goal.</p>
      <div class="layout">
        <section class="card overview" aria-labelledby="overview-title">
          <div class="section-heading">
            <div><p class="eyebrow">Overall progress</p><h2 id="overview-title">Current total</h2></div>
            <span class="target-pill" id="target-pill">Goal —</span>
          </div>
          <div class="numbers"><span class="current" id="current">—</span><span class="of-target">of <span id="target">—</span></span></div>
          <div class="bar" role="progressbar" aria-label="Goal completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="bar-fill" id="bar-fill"></div></div>
          <div class="progress-meta"><span id="remaining">Loading progress…</span><strong id="percent">—</strong></div>
          <div class="stats">
            <div class="stat"><span class="stat-label">Days left</span><span class="stat-value" id="days-left">—</span><span class="stat-note">Until your deadline</span></div>
            <div class="stat"><span class="stat-label">Daily goal</span><span class="stat-value" id="daily-goal">—</span><span class="stat-note">Needed each day to reach your target</span></div>
            <div class="stat"><span class="stat-label">Today's progress</span><span class="stat-value" id="today-progress">—</span><span class="stat-note" id="today-progress-note">Based on saved daily updates</span></div>
            <div class="stat"><span class="stat-label">Goal deadline</span><span class="stat-value" id="deadline">—</span></div>
          </div>
          <p class="error-banner" id="load-error" role="alert" hidden></p>
        </section>
        <aside class="side">
          <section class="card form-card" aria-labelledby="form-title">
            <p class="eyebrow">Log an update</p>
            <h2 id="form-title">Update your total</h2>
            <p class="form-copy">Enter your new overall total. This replaces the current value and saves an update to the history.</p>
            <form id="update-form">
              <label for="current-input">New current total</label>
              <input id="current-input" name="current" type="number" min="0" step="1" placeholder="e.g. 150000" required />
              <button id="submit-button" type="submit">Save progress update</button>
              <p class="message" id="form-message" role="status" aria-live="polite"></p>
            </form>
          </section>
          <section class="card updates" aria-labelledby="updates-title">
            <div class="updates-head"><h2 id="updates-title">Recent updates</h2><span class="count" id="recent-count">0 entries</span></div>
            <div class="update-list" id="update-list"><p class="empty">Loading update history…</p></div>
          </section>
        </aside>
      </div>
    </main>
    <script>
      const numberFormat = new Intl.NumberFormat();
      const formatNumber = (value) => numberFormat.format(value);
      const formatDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      };

      function render(data) {
        const current = Number(data.current) || 0;
        const target = Number(data.head_target) || 0;
        const updates = Array.isArray(data.update) ? data.update : [];
        const percent = target > 0 ? (current / target) * 100 : 0;
        const boundedPercent = Math.max(0, Math.min(100, percent));
        const remaining = Math.max(0, target - current);
        const deadline = Number(data.day_end) * 1000;
        const millisecondsLeft = deadline - Date.now();
        const daysLeft = Number.isFinite(deadline) && deadline > 0 && millisecondsLeft > 0
          ? Math.ceil(millisecondsLeft / 86_400_000)
          : 0;
        const dailyGoal = remaining === 0 ? 0 : daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null;
        document.querySelector("#current").textContent = formatNumber(current);
        document.querySelector("#target").textContent = formatNumber(target);
        document.querySelector("#target-pill").textContent = "Goal " + formatNumber(target);
        document.querySelector("#remaining").textContent = current >= target ? "Goal reached — great work!" : formatNumber(remaining) + " to go";
        document.querySelector("#percent").textContent = percent.toFixed(1) + "%";
        document.querySelector("#bar-fill").style.width = boundedPercent + "%";
        document.querySelector("[role='progressbar']").setAttribute("aria-valuenow", String(boundedPercent));
        document.querySelector("#days-left").textContent = !data.day_end
          ? "Not set"
          : daysLeft === 0 && millisecondsLeft <= 0
            ? "Deadline passed"
            : daysLeft + (daysLeft === 1 ? " day" : " days");
        document.querySelector("#daily-goal").textContent = dailyGoal === null ? "—" : formatNumber(dailyGoal);
        document.querySelector("#deadline").textContent = data.day_end ? formatDate(deadline) : "Not set";
        document.querySelector("#recent-count").textContent = updates.length + (updates.length === 1 ? " entry" : " entries");

        const todayKey = new Date().toDateString();
        const yesterdayKey = new Date(Date.now() - 86_400_000).toDateString();
        const datedUpdates = updates
          .map((update) => ({ ...update, timestamp: new Date(update.id).getTime() }))
          .filter((update) => Number.isFinite(update.timestamp))
          .sort((a, b) => a.timestamp - b.timestamp);
        const todayUpdates = datedUpdates.filter((update) => new Date(update.timestamp).toDateString() === todayKey);
        const yesterdayUpdates = datedUpdates.filter((update) => new Date(update.timestamp).toDateString() === yesterdayKey);
        let todayProgress = null;
        let todayProgressNote = "Add daily updates to track your change";
        if (todayUpdates.length > 0 && yesterdayUpdates.length > 0) {
          todayProgress = Number(todayUpdates[todayUpdates.length - 1].current) - Number(yesterdayUpdates[yesterdayUpdates.length - 1].current);
          todayProgressNote = "Compared with yesterday's last update";
        } else if (todayUpdates.length > 1) {
          todayProgress = Number(todayUpdates[todayUpdates.length - 1].current) - Number(todayUpdates[0].current);
          todayProgressNote = "Change since first update today";
        } else if (todayUpdates.length === 1) {
          todayProgressNote = "Add another update today to show change";
        }
        document.querySelector("#today-progress").textContent = todayProgress === null
          ? "—"
          : (todayProgress > 0 ? "+" : "") + formatNumber(todayProgress);
        document.querySelector("#today-progress-note").textContent = todayProgressNote;

        const list = document.querySelector("#update-list");
        list.replaceChildren();
        if (!updates.length) {
          const empty = document.createElement("p");
          empty.className = "empty";
          empty.textContent = "No updates yet. Your saved entries will appear here.";
          list.append(empty);
          return;
        }
        updates.slice().reverse().slice(0, 5).forEach((update) => {
          const row = document.createElement("div");
          row.className = "update-row";
          const date = document.createElement("span");
          date.className = "update-date";
          date.textContent = formatDate(update.id);
          const value = document.createElement("span");
          value.className = "update-value";
          value.textContent = formatNumber(Number(update.current) || 0);
          row.append(date, value);
          list.append(row);
        });
      }

      async function loadProgress() {
        try {
          const response = await fetch("/api/daily");
          if (!response.ok) throw new Error("Could not load progress.");
          render(await response.json());
          document.querySelector("#load-error").hidden = true;
        } catch (error) {
          document.querySelector("#load-error").textContent = error.message || "Could not load progress.";
          document.querySelector("#load-error").hidden = false;
          document.querySelector("#remaining").textContent = "Please refresh to try again.";
          document.querySelector("#update-list").replaceChildren(Object.assign(document.createElement("p"), { className: "empty", textContent: "History is unavailable." }));
        }
      }

      document.querySelector("#update-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = form.elements.current;
        const button = document.querySelector("#submit-button");
        const message = document.querySelector("#form-message");
        const current = Number(input.value);
        message.className = "message";
        message.textContent = "";
        if (!Number.isSafeInteger(current) || current < 0) {
          message.classList.add("error");
          message.textContent = "Enter a valid non-negative whole number.";
          return;
        }
        button.disabled = true;
        button.textContent = "Saving…";
        try {
          const response = await fetch("/api/updates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: new Date().toISOString(), current })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Could not save update.");
          render(result);
          input.value = "";
          message.textContent = "Progress saved successfully.";
        } catch (error) {
          message.classList.add("error");
          message.textContent = error.message || "Could not save update.";
        } finally {
          button.disabled = false;
          button.textContent = "Save progress update";
        }
      });

      loadProgress();
    </script>
    <script>
      const themeToggle = document.querySelector("#theme-toggle");
      const themeLabel = document.querySelector("#theme-label");
      const themeIcon = themeToggle.querySelector(".theme-icon");

      function updateThemeButton() {
        const isDark = document.documentElement.dataset.theme === "dark";
        themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
        themeIcon.textContent = isDark ? "☀" : "☾";
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        themeToggle.setAttribute("aria-pressed", String(isDark));
        document.querySelector('meta[name="theme-color"]').content = isDark ? "#111a15" : "#f4f6f2";
      }

      themeToggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = nextTheme;
        try {
          localStorage.setItem("counter-theme", nextTheme);
        } catch {
          // Theme still applies for this page view if storage is unavailable.
        }
        updateThemeButton();
      });
      updateThemeButton();
    </script>
  </body>
</html>`);
});

routes.route("/api", apiRoutes);

export default routes;
