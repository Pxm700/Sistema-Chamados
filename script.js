const STATUS = [
  "Chamado pendente",
  "Em atendimento",
  "Aguardando usuário",
  "Chamado agendado",
  "Retorno tecnologia",
  "Chamado concluído"
];
const LOJAS = [
  "01 - Itaquera", "02 - Oratório", "03 - Guaianases", "04 - São Miguel",
  "05 - Itaim", "06 - Suzano", "07 - Mogi", "08 - São Bernardo",
  "09 - Taboão", "10 - Itaquaquecetuba", "11 - Penha", "12 - Guarulhos",
  "13 - Cidade Dutra", "14 - Osasco"
];
const EQUIPES = ["Wellitel", "Contec", "CSS Tech", "Ouzze", "Scanprint"];
const SEM_EQUIPE = "Sem equipe";
const CONCLUIDO = "Chamado concluído";
const CHAVE = "chamados_v2"; // mesma chave de antes: os chamados já cadastrados continuam aparecendo

function carregar() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE)) || [];
    // chamados antigos não têm equipe
    lista.forEach(c => { if (!c.equipe) c.equipe = SEM_EQUIPE; });
    return lista;
  } catch (e) { return []; }
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
  if (dias > 30) return "critico";
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

// ---------- listas ----------
// Lojas antigas digitadas à mão (de antes das listas) continuam filtráveis
function lojasDoFiltro() {
  const antigas = [...new Set(chamados.map(c => c.loja))].filter(l => !LOJAS.includes(l)).sort();
  return LOJAS.concat(antigas);
}
function montarFiltros() {
  const guarda = ["filtro-status", "filtro-equipe", "filtro-loja"].map(id => $(id).value);
  opcoes($("filtro-status"), STATUS.slice(0, 5), "Todos os status");
  opcoes($("filtro-equipe"), EQUIPES.concat(SEM_EQUIPE), "Todas as equipes");
  opcoes($("filtro-loja"), lojasDoFiltro(), "Todas as lojas");
  ["filtro-status", "filtro-equipe", "filtro-loja"].forEach((id, i) => { $(id).value = guarda[i]; });
}
opcoes($("loja"), LOJAS, "Selecione a loja");
opcoes($("equipe"), EQUIPES, "Selecione a equipe");
opcoes($("status"), STATUS);
$("data").value = hojeISO();
montarFiltros();

// ---------- abas ----------
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tela").forEach(t => t.classList.remove("active"));
  b.classList.add("active");
  $("tela-" + b.dataset.tela).classList.add("active");
  if (b.dataset.tela === "gestao") { montarFiltros(); renderizar(); }
}));

// ---------- confirmação dentro da página ----------
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

// ---------- adicionar ----------
$("btn-salvar").addEventListener("click", () => {
  const numero = $("numero").value.trim();
  const loja = $("loja").value;
  const equipe = $("equipe").value;
  if (!numero) { $("msg").textContent = "Preencha o número do chamado."; return; }
  if (!loja) { $("msg").textContent = "Selecione a loja."; return; }
  if (!equipe) { $("msg").textContent = "Selecione a equipe."; return; }
  if (chamados.some(c => c.numero.toLowerCase() === numero.toLowerCase())) {
    $("msg").textContent = "Já existe um chamado com esse número."; return;
  }
  const status = $("status").value;
  if (status === CONCLUIDO) { $("msg").textContent = "Chamado concluído não entra na lista."; return; }
  chamados.push({ id: Date.now(), numero, loja, equipe, status, data: $("data").value || hojeISO() });
  salvar();
  $("numero").value = ""; $("loja").value = ""; $("equipe").value = "";
  $("status").selectedIndex = 0; $("data").value = hojeISO();
  $("msg").textContent = "Chamado adicionado!";
  setTimeout(() => { $("msg").textContent = ""; }, 2500);
});

// ---------- gestão ----------
function renderizar() {
  const fn = $("filtro-numero").value.trim().toLowerCase();
  const fs = $("filtro-status").value;
  const fe = $("filtro-equipe").value;
  const fl = $("filtro-loja").value;
  const filtrando = fn || fs || fe || fl;

  const lista = chamados
    .filter(c => (!fn || c.numero.toLowerCase().includes(fn)) &&
                 (!fs || c.status === fs) &&
                 (!fe || c.equipe === fe) &&
                 (!fl || c.loja === fl))
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);

  if (!lista.length) {
    $("lista").innerHTML = `<div class="vazio">${filtrando ? "Nenhum chamado encontrado com esses filtros." : "Nenhum chamado em aberto."}</div>`;
    return;
  }

  $("lista").innerHTML = lista.map(c => {
    const dias = diasDesde(c.data);
    return `<div class="card ${cor(dias)}">
      <div class="topo"><span>#${esc(c.numero)}</span><span class="loja">${esc(c.loja)}</span></div>
      <div class="info">Equipe: ${esc(c.equipe)} · Incluído em ${fmtData(c.data)} · ${dias} dia(s) em aberto</div>
      <div class="acoes">
        <select class="troca" data-id="${c.id}" title="Status">
          ${STATUS.map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <select class="troca-equipe" data-id="${c.id}" title="Equipe">
          ${EQUIPES.concat(SEM_EQUIPE).map(s => `<option ${s === c.equipe ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="btn-x" data-id="${c.id}">Excluir</button>
      </div>
    </div>`;
  }).join("");
}

$("lista").addEventListener("change", e => {
  const alvo = e.target;
  const c = chamados.find(x => x.id == alvo.dataset.id);
  if (!c) return;
  if (alvo.classList.contains("troca-equipe")) {
    c.equipe = alvo.value; salvar(); renderizar(); return;
  }
  if (!alvo.classList.contains("troca")) return;
  const novo = alvo.value;
  if (novo === CONCLUIDO) {
    confirmar("Marcar o chamado #" + c.numero + " como concluído? Ele sai da lista.",
      () => { chamados = chamados.filter(x => x.id !== c.id); salvar(); montarFiltros(); renderizar(); },
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
    () => { chamados = chamados.filter(x => x.id !== c.id); salvar(); montarFiltros(); renderizar(); },
    () => {});
});
$("filtro-numero").addEventListener("input", renderizar);
["filtro-status", "filtro-equipe", "filtro-loja"].forEach(id => $(id).addEventListener("change", renderizar));
