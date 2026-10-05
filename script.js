const STATUS = [
  "Chamado pendente",
  "Em atendimento",
  "Aguardando usuário",
  "Chamado agendado",
  "Retorno tecnologia",
  "Chamado concluído"
];
const CONCLUIDO = "Chamado concluído";
const CHAVE = "chamados_v2";

function carregar() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; }
  catch (e) { return []; }
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(chamados)); } catch (e) {}
}
let chamados = carregar();

const $ = id => document.getElementById(id);
function hojeISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function diasDesde(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((hoje - new Date(a, m - 1, d)) / 86400000);
}
function cor(dias) {
  if (dias > 10) return "vermelho";
  if (dias > 7) return "laranja";
  if (dias > 3) return "amarelo";
  return "";
}
const fmtData = iso => iso.split("-").reverse().join("/");
function esc(t) { const s = document.createElement("div"); s.textContent = t; return s.innerHTML; }
function opcoes(sel, lista, primeiro) {
  sel.innerHTML = (primeiro ? `<option value="">${primeiro}</option>` : "") +
    lista.map(x => `<option>${esc(x)}</option>`).join("");
}

opcoes($("status"), STATUS);
opcoes($("filtro-status"), STATUS.slice(0, 5), "Todos os status");
$("data").value = hojeISO();

document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tela").forEach(t => t.classList.remove("active"));
  b.classList.add("active");
  $("tela-" + b.dataset.tela).classList.add("active");
  if (b.dataset.tela === "gestao") renderizar();
}));

let aoConfirmar = null;
function confirmar(texto, sim, nao) {
  $("modal-txt").textContent = texto;
  aoConfirmar = { sim, nao };
  $("modal").hidden = false;
}
function fecharModal(ok) {
  const a = aoConfirmar; aoConfirmar = null;
  $("modal").hidden = true;
  if (a) (ok ? a.sim : a.nao)();
}
$("modal-sim").addEventListener("click", () => fecharModal(true));
$("modal-nao").addEventListener("click", () => fecharModal(false));

$("btn-salvar").addEventListener("click", () => {
  const numero = $("numero").value.trim();
  const loja = $("loja").value.trim();
  if (!numero || !loja) { $("msg").textContent = "Preencha o número do chamado e a loja."; return; }
  if (chamados.some(c => c.numero.toLowerCase() === numero.toLowerCase())) {
    $("msg").textContent = "Já existe um chamado com esse número."; return;
  }
  const status = $("status").value;
  if (status === CONCLUIDO) { $("msg").textContent = "Chamado concluído não entra na lista."; return; }
  chamados.push({ id: Date.now(), numero, loja, status, data: $("data").value || hojeISO() });
  salvar();
  $("numero").value = ""; $("loja").value = "";
  $("status").selectedIndex = 0; $("data").value = hojeISO();
  $("msg").textContent = "Chamado adicionado!";
  setTimeout(() => { $("msg").textContent = ""; }, 2500);
});

function renderizar() {
  const fs = $("filtro-status").value;
  const fl = $("filtro-loja").value.trim().toLowerCase();
  const lista = chamados
    .filter(c => (!fs || c.status === fs) && (!fl || c.loja.toLowerCase().includes(fl)))
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);

  if (!lista.length) { $("lista").innerHTML = '<div class="vazio">Nenhum chamado em aberto.</div>'; return; }

  $("lista").innerHTML = lista.map(c => {
    const dias = diasDesde(c.data);
    return `<div class="card ${cor(dias)}">
      <div class="topo"><span>#${esc(c.numero)}</span><span class="loja">${esc(c.loja)}</span></div>
      <div class="info">Incluído em ${fmtData(c.data)} · ${dias} dia(s) em aberto</div>
      <div class="acoes">
        <select class="troca" data-id="${c.id}">
          ${STATUS.map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="btn-x" data-id="${c.id}">Excluir</button>
      </div>
    </div>`;
  }).join("");
}

$("lista").addEventListener("change", e => {
  if (!e.target.classList.contains("troca")) return;
  const c = chamados.find(x => x.id == e.target.dataset.id);
  if (!c) return;
  const novo = e.target.value;
  if (novo === CONCLUIDO) {
    confirmar("Marcar o chamado #" + c.numero + " como concluído? Ele sai da lista.",
      () => { chamados = chamados.filter(x => x.id !== c.id); salvar(); renderizar(); },
      () => renderizar());
  } else {
    c.status = novo; salvar(); renderizar();
  }
});
$("lista").addEventListener("click", e => {
  const btn = e.target.closest(".btn-x");
  if (!btn) return;
  const c = chamados.find(x => x.id == btn.dataset.id);
  if (!c) return;
  confirmar("Excluir o chamado #" + c.numero + "?",
    () => { chamados = chamados.filter(x => x.id !== c.id); salvar(); renderizar(); },
    () => {});
});
$("filtro-status").addEventListener("change", renderizar);
$("filtro-loja").addEventListener("input", renderizar);
