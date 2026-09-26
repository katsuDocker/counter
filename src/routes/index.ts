import { Hono } from "hono";

import { readFile } from "../modules/read_file";
import apiRoutes from "./api";

const routes = new Hono();

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);
const formatDateTime = (value: string | number | Date) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const renderHistoryPage = async (data: {
  head_target?: number;
  current?: number;
  day_end?: number;
  update?: Array<{ id: string; current: number }>;
}) => {
  const updates = Array.isArray(data.update) ? data.update : [];
  const sorted = [...updates]
    .map((update) => ({ ...update, timestamp: new Date(update.id).getTime() }))
    .filter((update) => Number.isFinite(update.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const target = Number(data.head_target) || 0;
  const current = Number(data.current) || 0;
  const deadline = Number(data.day_end) || 0;
  const earliest = sorted[0];
  const initialValue = earliest ? Number(earliest.current) || 0 : current;

  const rows = sorted.length
    ? sorted
        .map((update, index, items) => {
          const previous = items[index - 1];
          const delta = previous
            ? Number(update.current) - Number(previous.current)
            : 0;
          const deltaText = previous
            ? `${delta >= 0 ? "+" : "−"}${formatNumber(Math.abs(delta))}`
            : "—";
          const deltaClass = previous
            ? delta > 0
              ? "positive"
              : delta < 0
                ? "negative"
                : "neutral"
            : "neutral";
          return `
          <li class="history-item">
            <div>
              <div class="history-date">${formatDateTime(update.id)}</div>
            </div>
            <div class="history-value">${formatNumber(Number(update.current) || 0)}</div>
            <span class="history-diff ${deltaClass}">${deltaText}</span>
          </li>`;
        })
        .join("")
    : `<li class="empty-state">No saved updates yet.</li>`;

  const deadlineValue = deadline
    ? new Date(deadline * 1000).toISOString().slice(0, 16)
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>History & Goal Settings — Counter</title>
    <style>
      :root { --ctp-base: #eff1f5; --ctp-mantle: #e6e9ef; --ctp-surface: #ffffff; --ctp-surface-alt: #f5f6f8; --ctp-text: #4c4f69; --ctp-subtext: #6c6f85; --ctp-border: #dce0e8; --ctp-accent: #209fb5; --ctp-accent-strong: #1a7d9a; --ctp-success: #40a02b; --ctp-danger: #d20f39; --ctp-shadow: rgba(76, 79, 105, 0.08); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ctp-text); background: var(--ctp-base); }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(ellipse at 80% 0%, rgba(125, 196, 228, 0.2), transparent 38rem), var(--ctp-base); color: var(--ctp-text); }
      html[data-theme="dark"] { color-scheme: dark; --ctp-base: #1e1e2e; --ctp-mantle: #181825; --ctp-surface: #24273a; --ctp-surface-alt: #1b1d2a; --ctp-text: #cad3f5; --ctp-subtext: #a5adcb; --ctp-border: #313244; --ctp-accent: #7dc4e4; --ctp-accent-strong: #74c7ec; --ctp-success: #a6e3a1; --ctp-danger: #f38ba8; --ctp-shadow: rgba(0, 0, 0, 0.28); }
      html[data-theme="dark"] body { background: radial-gradient(ellipse at 80% 0%, rgba(125, 196, 228, 0.18), transparent 38rem), var(--ctp-base); }
      a { color: inherit; text-decoration: none; }
      .shell { width: min(100% - 32px, 960px); margin: 0 auto; padding: 48px 0 72px; }
      .topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; }
      .brand { font-size: 24px; font-weight: 800; letter-spacing: -.04em; }
      .nav { display: flex; gap: 10px; }
      .nav a { padding: 10px 14px; border-radius: 999px; background: rgba(125, 196, 228, 0.12); color: var(--ctp-text); font-size: 12px; font-weight: 700; }
      .theme-toggle { min-height: 38px; padding: 0 12px; border: 1px solid var(--ctp-border); border-radius: 999px; background: var(--ctp-surface); color: var(--ctp-text); font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; }
      .panel { background: var(--ctp-surface); border: 1px solid var(--ctp-border); border-radius: 22px; padding: 24px; box-shadow: 0 12px 40px var(--ctp-shadow); }
      .kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 26px; }
      .kpi { padding: 16px; border-radius: 16px; background: var(--ctp-surface-alt); }
      .kpi-label { color: var(--ctp-subtext); font-size: 12px; }
      .kpi-value { margin-top: 8px; font-size: clamp(20px, 3vw, 28px); font-weight: 800; letter-spacing: -.04em; }
      .layout { display: grid; grid-template-columns: 1.2fr .8fr; gap: 20px; }
      .history-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0; }
      .history-item { display: grid; grid-template-columns: 1.4fr 1fr auto; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid var(--ctp-border); }
      .history-date { color: var(--ctp-subtext); font-size: 12px; }
      .history-value { font-size: 14px; font-weight: 700; }
      .history-diff { min-width: 62px; text-align: right; font-size: 12px; font-weight: 700; }
      .history-diff.positive { color: var(--ctp-success); }
      .history-diff.negative { color: var(--ctp-danger); }
      .history-diff.neutral { color: var(--ctp-subtext); }
      .empty-state { padding: 18px 0; color: var(--ctp-subtext); }
      .form-grid { display: grid; gap: 14px; }
      label { display: block; font-size: 13px; font-weight: 700; color: var(--ctp-text); margin-bottom: 8px; }
      input { width: 100%; height: 46px; padding: 0 12px; border: 1px solid var(--ctp-border); border-radius: 10px; background: var(--ctp-surface-alt); color: var(--ctp-text); font: inherit; }
      button { width: 100%; min-height: 46px; border: 0; border-radius: 10px; background: var(--ctp-accent); color: #111827; font: inherit; font-weight: 700; cursor: pointer; }
      .message { min-height: 18px; margin-top: 8px; font-size: 12px; }
      .message.error { color: var(--ctp-danger); }
      .message.success { color: var(--ctp-success); }
      .theme-toggle:hover { border-color: var(--ctp-accent); background: var(--ctp-mantle); }
      @media (max-width: 760px) { .layout, .kpis { grid-template-columns: 1fr; } .topbar { flex-direction: column; align-items: flex-start; } }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="topbar">
        <div class="brand">Counter</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <nav class="nav" aria-label="Main navigation">
            <a href="/">Dashboard</a>
            <a href="/history">History</a>
          </nav>
          <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false"><span id="theme-icon" aria-hidden="true">☾</span><span id="theme-label">Dark mode</span></button>
        </div>
      </div>

      <section class="kpis">
        <div class="kpi"><div class="kpi-label">Current total</div><div class="kpi-value">${formatNumber(current)}</div></div>
        <div class="kpi"><div class="kpi-label">Target</div><div class="kpi-value">${formatNumber(target)}</div></div>
        <div class="kpi"><div class="kpi-label">Starting amount</div><div class="kpi-value">${formatNumber(initialValue)}</div></div>
      </section>

      <div class="layout">
        <section class="panel">
          <h2>Recent history</h2>
          <ul class="history-list">${rows}</ul>
        </section>

        <aside class="panel">
          <h2>Set a new goal</h2>
          <form id="goal-form" class="form-grid">
            <div>
              <label for="goal-target">Target amount</label>
              <input id="goal-target" name="head_target" type="number" min="0" step="1" value="${target}" required />
            </div>
            <div>
              <label for="goal-deadline">Deadline</label>
              <input id="goal-deadline" name="day_end" type="datetime-local" value="${deadlineValue}" required />
            </div>
            <button type="submit">Save goal</button>
            <div id="goal-message" class="message" aria-live="polite"></div>
          </form>
        </aside>
      </div>
    </main>

    <script>
      try {
        const savedTheme = localStorage.getItem('counter-theme');
        document.documentElement.dataset.theme = savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } catch {
        document.documentElement.dataset.theme = 'light';
      }

      const themeToggle = document.querySelector('#theme-toggle');
      const themeLabel = document.querySelector('#theme-label');
      const themeIcon = document.querySelector('#theme-icon');
      function updateThemeButton() {
        const isDark = document.documentElement.dataset.theme === 'dark';
        themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
        themeIcon.textContent = isDark ? '☀' : '☾';
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.setAttribute('aria-pressed', String(isDark));
      }
      themeToggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = nextTheme;
        try { localStorage.setItem('counter-theme', nextTheme); } catch {}
        updateThemeButton();
      });
      updateThemeButton();

      const form = document.querySelector('#goal-form');
      const message = document.querySelector('#goal-message');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const head_target = Number(formData.get('head_target'));
        const day_end = formData.get('day_end');

        if (!Number.isFinite(head_target) || head_target < 0) {
          message.textContent = 'Target must be a non-negative number.';
          message.className = 'message error';
          return;
        }

        if (!day_end) {
          message.textContent = 'Please choose a deadline.';
          message.className = 'message error';
          return;
        }

        const payload = {
          head_target,
          day_end: Math.floor(new Date(day_end).getTime() / 1000)
        };

        try {
          const response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Could not save goal.');
          message.textContent = 'Goal saved.';
          message.className = 'message success';
          window.location.href = '/';
        } catch (error) {
          message.textContent = error.message || 'Could not save goal.';
          message.className = 'message error';
        }
      });
    </script>
  </body>
</html>`;
};

routes.get("/history", async (c) => {
  const data = await readFile();
  return c.html(await renderHistoryPage(data));
});

routes.get("/goals", async (c) => {
  const data = await readFile();
  return c.html(await renderHistoryPage(data));
});

routes.get("/", (c) => {
  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#f4f6f2" />
    <title>Progress — Counter</title>
    <style>
      :root {
        --ctp-base: #eff1f5;
        --ctp-mantle: #e6e9ef;
        --ctp-crust: #dce0e8;
        --ctp-surface: #ffffff;
        --ctp-surface-alt: #f5f6f8;
        --ctp-text: #4c4f69;
        --ctp-subtext: #6c6f85;
        --ctp-border: #dce0e8;
        --ctp-accent: #209fb5;
        --ctp-accent-strong: #1a7d9a;
        --ctp-success: #40a02b;
        --ctp-danger: #d20f39;
        --ctp-shadow: rgba(76, 79, 105, 0.08);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ctp-text); background: var(--ctp-base); font-synthesis: none; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(ellipse at 80% 0%, rgba(125, 196, 228, 0.2), transparent 38rem), var(--ctp-base); color: var(--ctp-text); }
      html { color-scheme: light; }
      html[data-theme="dark"] {
        color-scheme: dark;
        --ctp-base: #1e1e2e;
        --ctp-mantle: #181825;
        --ctp-crust: #11111b;
        --ctp-surface: #24273a;
        --ctp-surface-alt: #1b1d2a;
        --ctp-text: #cad3f5;
        --ctp-subtext: #a5adcb;
        --ctp-border: #313244;
        --ctp-accent: #7dc4e4;
        --ctp-accent-strong: #74c7ec;
        --ctp-success: #a6e3a1;
        --ctp-danger: #f38ba8;
        --ctp-shadow: rgba(0, 0, 0, 0.28);
        color: var(--ctp-text); background: var(--ctp-base); }
      html[data-theme="dark"] body { background: radial-gradient(ellipse at 80% 0%, rgba(125, 196, 228, 0.18), transparent 38rem), var(--ctp-base); }
      .shell { width: min(100% - 40px, 1040px); margin: 0 auto; padding: 54px 0 72px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 42px; }
      .header-actions { display: flex; align-items: center; gap: 10px; }
      .nav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .nav a { padding: 9px 12px; border-radius: 999px; background: rgba(125, 196, 228, 0.12); color: var(--ctp-text); text-decoration: none; font-size: 12px; font-weight: 700; }
      .brand { font-size: 24px; font-weight: 800; letter-spacing: -.04em; }
      .brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; color: #111827; background: var(--ctp-accent); font-size: 20px; }
      .live { display: flex; align-items: center; gap: 8px; color: var(--ctp-subtext); font-size: 13px; }
      .live::before { width: 8px; height: 8px; border-radius: 50%; background: var(--ctp-success); content: ""; box-shadow: 0 0 0 4px rgba(64, 160, 43, 0.16); }
      .theme-toggle { display: flex; align-items: center; gap: 10px; min-height: 38px; margin: 0; padding: 0 12px; border: 1px solid var(--ctp-border); border-radius: 999px; background: var(--ctp-surface); color: var(--ctp-text); font-size: 12px; font-weight: 650; }
      .theme-toggle:hover { border-color: var(--ctp-accent); background: var(--ctp-mantle); transform: none; }
      .theme-icon { font-size: 15px; line-height: 1; }
      .eyebrow { margin: 0 0 10px; color: var(--ctp-subtext); font-size: 12px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(34px, 5vw, 52px); letter-spacing: -.055em; line-height: 1.05; }
      .intro { margin: 12px 0 30px; color: var(--ctp-subtext); font-size: 16px; }
      .layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr); gap: 20px; align-items: start; }
      .card { border: 1px solid var(--ctp-border); border-radius: 22px; background: var(--ctp-surface); box-shadow: 0 12px 40px var(--ctp-shadow); }
      .overview { padding: clamp(24px, 4vw, 38px); }
      .section-heading { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
      .section-heading h2, .updates h2 { margin: 0; font-size: 18px; letter-spacing: -.025em; }
      .target-pill { padding: 7px 11px; border-radius: 999px; color: var(--ctp-accent-strong); background: rgba(125, 196, 228, 0.14); font-size: 12px; font-weight: 700; white-space: nowrap; }
      .numbers { display: flex; align-items: baseline; gap: 10px; margin: 38px 0 9px; }
      .current { font-size: clamp(42px, 8vw, 72px); font-weight: 740; letter-spacing: -.065em; line-height: 1; font-variant-numeric: tabular-nums; }
      .of-target { color: #93a097; font-size: 15px; }
      .bar { height: 12px; margin: 26px 0 13px; overflow: hidden; border-radius: 99px; background: #edf1ed; }
      .bar-fill { width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--ctp-accent), var(--ctp-success)); transition: width .45s ease; }
      .progress-meta { display: flex; justify-content: space-between; gap: 16px; color: var(--ctp-subtext); font-size: 13px; }
      .progress-meta strong { color: var(--ctp-accent-strong); font-size: 14px; }
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 30px; }
      .stat { padding: 16px; border-radius: 15px; background: var(--ctp-surface-alt); }
      .stat-label { display: block; margin-bottom: 7px; color: var(--ctp-subtext); font-size: 12px; }
      .stat-value { font-size: 20px; font-weight: 720; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
      .stat-note { display: block; margin-top: 5px; color: var(--ctp-subtext); font-size: 11px; line-height: 1.4; }
      .side { display: grid; gap: 20px; }
      .form-card { padding: 25px; }
      .form-card h2 { margin: 0 0 7px; font-size: 18px; letter-spacing: -.025em; }
      .form-copy { margin: 0 0 22px; color: #829087; font-size: 13px; line-height: 1.5; }
      label { display: block; margin: 0 0 8px; color: var(--ctp-text); font-size: 13px; font-weight: 650; }
      input { width: 100%; height: 48px; padding: 0 13px; border: 1px solid var(--ctp-border); border-radius: 11px; outline: none; background: var(--ctp-surface-alt); color: var(--ctp-text); font: inherit; font-size: 15px; }
      input:focus { border-color: var(--ctp-accent); box-shadow: 0 0 0 3px rgba(125, 196, 228, 0.2); }
      button { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 48px; margin-top: 15px; border: 0; border-radius: 11px; background: var(--ctp-accent); color: #111827; cursor: pointer; font: inherit; font-weight: 700; transition: background .2s, transform .2s; }
      button:hover { background: var(--ctp-accent-strong); transform: translateY(-1px); }
      button:disabled { cursor: wait; opacity: .65; transform: none; }
      .message { min-height: 18px; margin: 12px 0 0; color: var(--ctp-success); font-size: 12px; }
      .message.error { color: var(--ctp-danger); }
      .updates { padding: 24px; }
      .updates-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .count { color: var(--ctp-subtext); font-size: 12px; }
      .update-list { display: grid; gap: 2px; }
      .update-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid var(--ctp-border); }
      .update-date { overflow: hidden; color: var(--ctp-subtext); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
      .update-meta { display: flex; align-items: center; gap: 9px; }
      .update-value { flex: none; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .update-diff { min-width: 52px; text-align: right; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .update-diff.positive { color: var(--ctp-success); }
      .update-diff.negative { color: var(--ctp-danger); }
      .update-diff.neutral { color: var(--ctp-subtext); }
      .empty { padding: 18px 0 4px; color: var(--ctp-subtext); font-size: 13px; }
      .error-banner { margin: 15px 0 0; color: var(--ctp-danger); font-size: 13px; }
      html[data-theme="dark"] .brand-mark { background: var(--ctp-accent); color: #111827; }
      html[data-theme="dark"] .live { color: var(--ctp-subtext); }
      html[data-theme="dark"] .eyebrow { color: var(--ctp-subtext); }
      html[data-theme="dark"] .intro, html[data-theme="dark"] .form-copy { color: var(--ctp-subtext); }
      html[data-theme="dark"] .target-pill { color: var(--ctp-accent-strong); background: rgba(125, 196, 228, 0.16); }
      html[data-theme="dark"] .of-target { color: var(--ctp-subtext); }
      html[data-theme="dark"] .bar { background: var(--ctp-mantle); }
      html[data-theme="dark"] .progress-meta { color: var(--ctp-subtext); }
      html[data-theme="dark"] .progress-meta strong { color: var(--ctp-accent); }
      html[data-theme="dark"] .stat { background: var(--ctp-surface-alt); }
      html[data-theme="dark"] .stat-label, html[data-theme="dark"] .stat-note { color: var(--ctp-subtext); }
      html[data-theme="dark"] label { color: var(--ctp-text); }
      html[data-theme="dark"] input { border-color: var(--ctp-border); background: var(--ctp-surface-alt); color: var(--ctp-text); }
      html[data-theme="dark"] input:focus { border-color: var(--ctp-accent); box-shadow: 0 0 0 3px rgba(125, 196, 228, 0.2); }
      html[data-theme="dark"] button:not(.theme-toggle) { background: var(--ctp-accent); color: #111827; }
      html[data-theme="dark"] button:not(.theme-toggle):hover { background: var(--ctp-accent-strong); }
      html[data-theme="dark"] .message { color: var(--ctp-success); }
      html[data-theme="dark"] .message.error, html[data-theme="dark"] .error-banner { color: var(--ctp-danger); }
      html[data-theme="dark"] .count, html[data-theme="dark"] .update-date, html[data-theme="dark"] .empty { color: var(--ctp-subtext); }
      html[data-theme="dark"] .update-row { border-color: var(--ctp-border); }
      html[data-theme="dark"] .update-diff.positive { color: var(--ctp-success); }
      html[data-theme="dark"] .update-diff.negative { color: var(--ctp-danger); }
      html[data-theme="dark"] .update-diff.neutral { color: var(--ctp-subtext); }
      html[data-theme="dark"] .theme-toggle { border-color: var(--ctp-border); background: var(--ctp-surface); color: var(--ctp-text); }
      html[data-theme="dark"] .theme-toggle:hover { border-color: var(--ctp-accent); background: var(--ctp-mantle); }
      @media (max-width: 760px) { .shell { padding-top: 30px; } header { margin-bottom: 34px; } .layout { grid-template-columns: 1fr; } .side { grid-row: auto; } }
      @media (max-width: 420px) { .shell { width: min(100% - 28px, 1040px); } .stats { gap: 8px; } .stat { padding: 13px; } .header-actions { gap: 8px; } .theme-toggle { gap: 8px; padding: 0 9px; } }
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
        <div class="brand">Counter</div>
        <div class="header-actions">
          <nav class="nav" aria-label="Main navigation">
            <a href="/">Dashboard</a>
            <a href="/history">History</a>
          </nav>
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

        const todayKey = new Date().toDateString();
        const yesterdayKey = new Date(Date.now() - 86_400_000).toDateString();
        const datedUpdates = updates
          .map((update) => ({ ...update, timestamp: new Date(update.id).getTime() }))
          .filter((update) => Number.isFinite(update.timestamp))
          .sort((a, b) => a.timestamp - b.timestamp);

        const startUpdate = datedUpdates[0];
        const startAmount = startUpdate ? Number(startUpdate.current) || 0 : current;
        const startDate = startUpdate ? new Date(startUpdate.id).getTime() : Date.now();
        const startToDeadlineMs = deadline > startDate ? deadline - startDate : 0;
        const daysFromStart = Number.isFinite(startToDeadlineMs) && startToDeadlineMs > 0
          ? Math.max(1, Math.ceil(startToDeadlineMs / 86_400_000))
          : 1;
        const remainingFromStart = Math.max(0, target - startAmount);
        const dailyGoal = remainingFromStart === 0 ? 0 : daysFromStart > 0 ? Math.ceil(remainingFromStart / daysFromStart) : null;
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
        const recentHistory = datedUpdates.slice().reverse().slice(0, 5);
        recentHistory.forEach((update, index, items) => {
          const row = document.createElement("div");
          row.className = "update-row";

          const date = document.createElement("span");
          date.className = "update-date";
          date.textContent = formatDate(update.id);

          const meta = document.createElement("div");
          meta.className = "update-meta";

          const value = document.createElement("span");
          value.className = "update-value";
          value.textContent = formatNumber(Number(update.current) || 0);

          const diff = document.createElement("span");
          diff.className = "update-diff neutral";
          const previous = items[index + 1];
          if (previous) {
            const delta = Number(update.current) - Number(previous.current);
            diff.textContent = (delta > 0 ? "+" : delta < 0 ? "−" : "") + formatNumber(Math.abs(delta));
            diff.classList.toggle("positive", delta > 0);
            diff.classList.toggle("negative", delta < 0);
            diff.classList.toggle("neutral", delta === 0);
            diff.title = "Change from previous update";
          } else {
            diff.textContent = "—";
            diff.title = "No previous update";
          }

          meta.append(value, diff);
          row.append(date, meta);
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
