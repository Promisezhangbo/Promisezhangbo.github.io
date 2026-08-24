const LEVEL_CN = { ok: "正常", info: "提示", warn: "警告", crit: "严重" };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const runBtn = $("#runBtn");
const quickMode = $("#quickMode");
const progressCard = $("#progressCard");
const progressTitle = $("#progressTitle");
const progressMsg = $("#progressMsg");
const progressSteps = $("#progressSteps");
const resultEl = $("#result");
const historyList = $("#historyList");
const historyDetail = $("#historyDetail");
const metaLine = $("#metaLine");

let currentReport = null;
let selectedHistoryId = null;

$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach((b) => b.classList.toggle("is-active", b === btn));
    $$(".view").forEach((v) => v.classList.remove("is-active"));
    $(`#view-${btn.dataset.view}`).classList.add("is-active");
    if (btn.dataset.view === "history") loadHistory();
  });
});

async function loadMeta() {
  try {
    const res = await fetch("/api/meta");
    const data = await res.json();
    metaLine.textContent = `本机诊断 · v${data.version}`;
  } catch {
    /* ignore */
  }
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function badge(level, label) {
  const cn = label || LEVEL_CN[level] || level;
  return `<span class="badge ${escapeHtml(level)}">${escapeHtml(cn)}</span>`;
}

function renderReport(report, { showDelete = false } = {}) {
  if (!report) return `<div class="card"><p class="error">记录损坏或为空。</p></div>`;
  const sys = report.system || {};
  const overall = report.overall || {};
  const causes = report.causes || [];
  const findings = report.findings || [];
  const machine = [
    report.machine || sys.model_name || sys.model,
    sys.cpu_brand,
    sys.ncpu ? `${sys.ncpu} 核` : "",
    sys.macos_version,
  ]
    .filter(Boolean)
    .join(" · ");

  const causeHtml = causes.length
    ? `<ol class="causes">${causes
        .map(
          (c, i) =>
            `<li>${i + 1}. ${badge(c.level, LEVEL_CN[c.level])} <strong>${escapeHtml(
              c.category,
            )}</strong> — ${escapeHtml(c.title)}</li>`,
        )
        .join("")}</ol>`
    : `<p class="muted">没有突出的单一元凶。</p>`;

  const findingsHtml = findings
    .map((f) => {
      const details = (f.details || [])
        .map((d) => `<li>${escapeHtml(d)}</li>`)
        .join("");
      const sugg = (f.suggestions || [])
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("");
      return `<article class="card finding">
        <div class="finding-head">
          ${badge(f.level, LEVEL_CN[f.level])}
          <h3>${escapeHtml(f.category)} · ${escapeHtml(f.title)}</h3>
        </div>
        ${details ? `<ul>${details}</ul>` : ""}
        ${
          sugg
            ? `<div class="suggest"><strong>优化建议</strong><ul>${sugg}</ul></div>`
            : ""
        }
      </article>`;
    })
    .join("");

  const actions = showDelete
    ? `<div class="detail-actions">
        <button class="btn danger" type="button" data-del="${escapeHtml(report.id)}">删除这条记录</button>
      </div>`
    : "";

  return `${actions}
    <section class="card summary">
      ${badge(overall.level, overall.level_cn)}
      <div>
        <h2>总评 · 压力分 ${escapeHtml(overall.score ?? "-")}</h2>
        <p>${escapeHtml(overall.summary || "")}</p>
        <p class="machine">${escapeHtml(report.saved_at || "")} · ${escapeHtml(machine)}</p>
        <h3 style="margin:14px 0 6px;font-size:14px">最可能的卡顿原因</h3>
        ${causeHtml}
      </div>
    </section>
    ${findingsHtml}`;
}

function renderResult(report) {
  currentReport = report;
  resultEl.classList.remove("hidden");
  resultEl.innerHTML = renderReport(report);
}

runBtn.addEventListener("click", async () => {
  runBtn.disabled = true;
  progressCard.classList.remove("hidden");
  resultEl.classList.add("hidden");
  progressSteps.innerHTML = "";
  progressTitle.textContent = "正在自检…";
  progressMsg.textContent = "开始采集系统指标";

  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quick: quickMode.checked }),
    });
    if (!res.ok || !res.body) throw new Error("无法开始自检");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.type === "progress") {
          progressMsg.textContent = msg.message;
          const li = document.createElement("li");
          li.textContent = msg.message;
          li.className = "is-now";
          $$("#progressSteps li").forEach((n) => n.classList.remove("is-now"));
          progressSteps.appendChild(li);
          li.scrollIntoView({ block: "nearest" });
        } else if (msg.type === "done") {
          progressCard.classList.add("hidden");
          renderResult(msg.report);
        } else if (msg.type === "error") {
          throw new Error(msg.message || "自检失败");
        }
      }
    }
  } catch (err) {
    progressTitle.textContent = "自检失败";
    progressMsg.textContent = err.message || String(err);
  } finally {
    runBtn.disabled = false;
  }
});

async function loadHistory() {
  const res = await fetch("/api/history");
  const data = await res.json();
  const items = data.items || [];
  if (!items.length) {
    historyList.innerHTML = `<p class="muted">还没有记录。先做一次自检。</p>`;
    return;
  }
  historyList.innerHTML = items
    .map(
      (it) => `<button type="button" class="hist-item ${
        it.id === selectedHistoryId ? "is-active" : ""
      }" data-id="${escapeHtml(it.id)}">
        <div class="hist-row">
          <span class="when">${escapeHtml(it.saved_at || it.id)}</span>
          ${badge(it.level, it.level_cn)}
        </div>
        <div class="head">${escapeHtml(it.headline || it.summary || "")}</div>
      </button>`,
    )
    .join("");

  $$(".hist-item", historyList).forEach((btn) => {
    btn.addEventListener("click", () => openHistory(btn.dataset.id));
  });
}

async function openHistory(id) {
  selectedHistoryId = id;
  $$(".hist-item", historyList).forEach((b) =>
    b.classList.toggle("is-active", b.dataset.id === id),
  );
  const res = await fetch(`/api/history/${encodeURIComponent(id)}`);
  if (!res.ok) {
    historyDetail.innerHTML = `<div class="card"><p class="error">读不到这条记录。</p></div>`;
    return;
  }
  const report = await res.json();
  historyDetail.innerHTML = renderReport(report, { showDelete: true });
  const del = $("[data-del]", historyDetail);
  if (del) {
    del.addEventListener("click", async () => {
      if (!confirm("删除这条自检记录？")) return;
      await fetch(`/api/history/${encodeURIComponent(id)}`, { method: "DELETE" });
      selectedHistoryId = null;
      historyDetail.innerHTML = `<div class="empty card"><h2>已删除</h2><p class="muted">从左侧再选一条，或回去做新的自检。</p></div>`;
      loadHistory();
    });
  }
}

loadMeta();
