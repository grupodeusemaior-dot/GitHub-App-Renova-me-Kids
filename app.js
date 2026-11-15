const MODULES = {
  vida: { file: "dados/a_vida_e_assim.json", cover: "imagens/capa-a-vida-e-assim.png", tint: "#fff2d8", accent: "#c97820", description: "Histórias e aprendizados para o dia a dia.", label: "HISTÓRIAS E APRENDIZADOS", tagline: "Descobertas para a vida" },
  biblia: { file: "dados/historias_da_biblia.json", cover: "imagens/capa-historias-da-biblia.png", tint: "#f1e9ff", accent: "#7650bd", description: "Grandes histórias de Deus para pequenos leitores.", label: "GRANDES HISTÓRIAS DA BÍBLIA", tagline: "A Palavra contada aos pequenos" },
  confiar: { file: "dados/e_sobre_confiar.json", cover: "imagens/capa-e-sobre-confiar.png", tint: "#e6f4ff", accent: "#277eb8", description: "Histórias que fortalecem a fé e a confiança em Deus.", label: "FÉ E CONFIANÇA EM DEUS", tagline: "Aprendendo a confiar" }
};
// O primeiro texto é exibido em 15/11/2026. A cada data local seguinte,
// cada livro avança independentemente para o próximo texto.
const DAILY_START = new Date(2026, 10, 15);
const $ = id => document.getElementById(id);
const collections = {};
let currentKey = null, records = [], index = 0, followingToday = true, fontSize = 24, midnightTimer = null;
function dayNumber(date) { return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000); }
function getDailyIndex(total, date = new Date()) { if (!total) return 0; const days = dayNumber(date) - dayNumber(DAILY_START); return ((days % total) + total) % total; }
function formatDate(date = new Date()) { return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(date); }
function renderParagraphs(text) {
  const target = $("content"); target.replaceChildren();
  const chunks = String(text || "").split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!chunks.length && String(text || "").trim()) chunks.push(String(text).trim());
  chunks.forEach(chunk => { const p = document.createElement("p"); p.textContent = chunk.replace(/\r?\n/g, " "); target.appendChild(p); });
}
function updateHomeCards() {
  $("homeDate").textContent = formatDate();
  document.querySelectorAll("[data-daily-title]").forEach(el => { const key = el.dataset.dailyTitle; const list = collections[key]?.textos || []; el.textContent = list[getDailyIndex(list.length)]?.titulo || "Leitura do dia"; });
  document.querySelectorAll("[data-daily-count]").forEach(el => { const key = el.dataset.dailyCount; el.textContent = `${collections[key]?.textos?.length || 0} leituras`; });
}
function buildCards() {
  const grid = $("moduleGrid"); grid.replaceChildren();
  const order = [["vida", "01", "A Vida é Assim"], ["biblia", "02", "Histórias da Bíblia"], ["confiar", "03", "É sobre Confiar"]];
  order.forEach(([key, number, title]) => {
    const mod = MODULES[key], item = collections[key].textos[getDailyIndex(collections[key].textos.length)];
    const card = document.createElement("button"); card.type = "button"; card.className = `module-card module-${key}`;
    card.innerHTML = `<span class="cover-wrap"><img class="module-cover" src="./${mod.cover}" alt="Capa do livro ${title}" loading="lazy"></span><span class="module-info"><span class="module-number">LIVRO ${number}</span><h3>${title}</h3><p class="module-description">${mod.description}</p><span class="daily-preview"><small>LEITURA DE HOJE</small><strong data-daily-title="${key}">${item?.titulo || "Leitura do dia"}</strong><small class="total-count" data-daily-count="${key}">${collections[key].textos.length} leituras</small></span><span class="open-module">Abrir livro <b>→</b></span></span>`;
    card.addEventListener("click", () => openModule(key)); grid.appendChild(card);
  });
  updateHomeCards();
}
function renderReader() {
  const item = records[index]; if (!item) return;
  $("storyTitle").textContent = item.titulo || `Leitura ${index + 1}`; renderParagraphs(item.texto || "");
  $("count").textContent = `Texto ${index + 1} de ${records.length}`;
  $("prevBtn").disabled = index === 0; $("nextBtn").textContent = index === records.length - 1 ? "Recomeçar ↻" : "Próxima →";
  $("dateLabel").textContent = followingToday ? `LEITURA DO DIA · ${formatDate()}` : "VOCÊ ESTÁ EXPLORANDO OUTRO TEXTO";
  $("todayBtn").hidden = followingToday;
}
function openModule(key) {
  const data = collections[key]; if (!data?.textos?.length) return;
  currentKey = key; records = data.textos; index = getDailyIndex(records.length); followingToday = true;
  const mod = MODULES[key]; $("readerCover").src = `./${mod.cover}`; $("readerCover").alt = `Capa de ${data.titulo}`;
  $("readerModuleLabel").textContent = mod.label; $("bookTitle").textContent = data.titulo || key;
  $("home").hidden = true; $("reader").hidden = false; renderReader(); window.scrollTo({ top: 0, behavior: "smooth" });
}
function goTo(next) { index = (next + records.length) % records.length; followingToday = index === getDailyIndex(records.length); renderReader(); window.scrollTo({ top: 0, behavior: "smooth" }); }
function refreshForNewDay() { updateHomeCards(); if (currentKey && followingToday) { index = getDailyIndex(records.length); renderReader(); } scheduleMidnightRefresh(); }
function scheduleMidnightRefresh() { clearTimeout(midnightTimer); const now = new Date(); const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2); midnightTimer = setTimeout(refreshForNewDay, Math.max(1000, next - now)); }
async function loadCollections() {
  await Promise.all(Object.entries(MODULES).map(async ([key, mod]) => { const response = await fetch(`./${mod.file}`, { cache: "no-cache" }); if (!response.ok) throw new Error(`Não foi possível carregar ${mod.file} (${response.status}).`); const data = await response.json(); if (!Array.isArray(data.textos) || !data.textos.length) throw new Error(`O livro ${data.titulo || key} não contém textos.`); collections[key] = data; }));
  buildCards(); scheduleMidnightRefresh();
}
$("backBtn").addEventListener("click", () => { $("reader").hidden = true; $("home").hidden = false; currentKey = null; window.scrollTo({ top: 0, behavior: "smooth" }); });
$("prevBtn").addEventListener("click", () => { if (index > 0) goTo(index - 1); });
$("nextBtn").addEventListener("click", () => goTo(index === records.length - 1 ? 0 : index + 1));
$("todayBtn").addEventListener("click", () => { index = getDailyIndex(records.length); followingToday = true; renderReader(); });
$("larger").addEventListener("click", () => { fontSize = Math.min(40, fontSize + 2); document.documentElement.style.setProperty("--reading-size", `${fontSize}px`); });
$("smaller").addEventListener("click", () => { fontSize = Math.max(18, fontSize - 2); document.documentElement.style.setProperty("--reading-size", `${fontSize}px`); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshForNewDay(); });
loadCollections().catch(error => { const box = $("moduleGrid"); box.innerHTML = `<div class="loading error">Não conseguimos abrir os livros agora.<br><small>${error.message}</small><br>Confira se a pasta <strong>dados</strong> está junto dos arquivos do aplicativo.</div>`; });
if ("serviceWorker" in navigator && location.protocol !== "file:") window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(console.warn));
let installPrompt = null;
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; $("installBtn").hidden = false; });
$("installBtn").addEventListener("click", async () => { if (!installPrompt) { alert("No iPhone: abra este site no Safari, toque em Compartilhar e escolha ‘Adicionar à Tela de Início’. No Android, use o menu do navegador e escolha Instalar aplicativo."); return; } installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("installBtn").hidden = true; });
window.addEventListener("appinstalled", () => { $("installBtn").hidden = true; installPrompt = null; });
