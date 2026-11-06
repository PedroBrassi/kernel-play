/* =========================================================
   KernelPlay — jogo.js
   Motor do jogo: abertura, trilha de boot, lições, estabilidade,
   ciclos (XP), uptime (sequência), mascote, cartões xv6/Linux.
   Não conhece o conteúdo: lê a lista TRILHAS (js/trilhas.js e js/trilhas/*.js).
   Progresso salvo só durante a sessão (sessionStorage).
   ========================================================= */
(function () {
  "use strict";

  // ---------- Regras do jogo ----------
  const ESTABILIDADE_MAX = 5;     // 5 segmentos = 100%; cada erro tira 20%
  const CICLOS_ACERTO = 10;
  const CICLOS_BONUS_UPTIME = 5;  // a partir de 3 acertos seguidos
  const PENALIDADE_DICA = 5;
  // Modo apresentação: abra o jogo com ?apresentacao no fim do endereço.
  // Libera todas as etapas, permite pular para qualquer desafio e não deixa a
  // estabilidade zerar sozinha. Usa um progresso separado do modo normal.
  const APRESENTACAO = /[?&#]apresentacao\b/i.test(location.search + location.hash);
  const CHAVE = APRESENTACAO ? "kernelplay-v2-apresentacao" : "kernelplay-v2";
  const ELOGIOS = ["Correto!", "Mandou bem!", "Isso aí!", "Exato!", "Perfeito!"];
  const POSES = ["boas-vindas", "acerto", "erro", "dica", "panico", "vitoria"];

  // ---------- Estado global (persistido na sessão) ----------
  const ESTADO_INICIAL = { ciclos: 0, estabilidade: ESTABILIDADE_MAX, uptime: 0, melhorUptime: 0, concluidas: [] };
  let estado = Object.assign({}, ESTADO_INICIAL, { concluidas: [] }, carregar());

  // ---------- Trilhas ----------
  // Cada arquivo em js/trilhas/ faz TRILHAS.push({...}); aqui elas são ordenadas pelo número.
  TRILHAS.sort((a, b) => a.numero - b.numero);
  let trilhaIdx = Math.min(Math.max(0, Number(estado.trilha) || 0), TRILHAS.length - 1);
  const trilha = () => TRILHAS[trilhaIdx];
  const fasesAtuais = () => trilha().fases;

  // ---------- Estado da lição em andamento ----------
  let licao = null;

  const app = document.getElementById("app");
  const topo = () => window.scrollTo(0, 0);

  // Pré-carrega as poses do mascote para não piscar na troca
  POSES.forEach(p => { const img = new Image(); img.src = `assets/mascote/${p}.webp`; });

  // =========================================================
  // Persistência
  // =========================================================
  function carregar() {
    try {
      const salvo = sessionStorage.getItem(CHAVE);
      return salvo ? JSON.parse(salvo) : {};
    } catch (e) {
      return {};
    }
  }

  function salvar() {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) { /* sem armazenamento: o jogo continua só em memória */ }
  }

  // =========================================================
  // Utilitários
  // =========================================================
  const $ = (sel) => document.querySelector(sel);

  // Escapa texto puro (código e saídas de terminal)
  function esc(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function mascote(pose, classe) {
    return `<img class="mascote ${classe || ""}" src="assets/mascote/${pose}.webp" alt="" aria-hidden="true">`;
  }

  function embaralhar(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

  function statusFase(i) {
    const fases = fasesAtuais();
    const fase = fases[i];
    if (estado.concluidas.includes(fase.id)) return "concluida";
    if (APRESENTACAO) return "liberada";
    if (i === 0 || estado.concluidas.includes(fases[i - 1].id)) return "liberada";
    return "bloqueada";
  }

  // ---------- Estabilidade (substitui as vidas) ----------
  function estabilidadeHTML() {
    const pct = Math.round((estado.estabilidade / ESTABILIDADE_MAX) * 100);
    const nivel = pct >= 60 ? "alto" : pct >= 40 ? "medio" : "baixo";
    let segs = "";
    for (let i = 0; i < ESTABILIDADE_MAX; i++) segs += `<i class="${i < estado.estabilidade ? "on" : ""}"></i>`;
    return `<span class="estab ${nivel}" title="Estabilidade do sistema: ${pct}%">
              <span class="estab-rot">SYS</span><span class="segs">${segs}</span><b>${pct}%</b>
            </span>`;
  }

  function atualizarEstabilidade() {
    document.querySelectorAll(".estab-box").forEach(el => (el.innerHTML = estabilidadeHTML()));
  }

  function perderEstabilidade() {
    // No Laboratório o erro não custa estabilidade: só zera o uptime e treme a tela
    if (licao && licao.lab) {
      estado.uptime = 0;
      salvar();
      const t = $(".licao");
      if (t) { t.classList.remove("tremer"); void t.offsetWidth; t.classList.add("tremer"); }
      return;
    }
    // Na apresentação a estabilidade não zera sozinha (o kernel panic tem botão próprio na trilha)
    estado.estabilidade = Math.max(APRESENTACAO ? 1 : 0, estado.estabilidade - 1);
    estado.uptime = 0;
    salvar();
    atualizarEstabilidade();
    const tela = $(".licao");
    if (tela) {
      tela.classList.remove("tremer");
      void tela.offsetWidth; // reinicia a animação
      tela.classList.add("tremer");
    }
  }

  function hud() {
    return `
      <header class="hud">
        <div class="hud-esq">
          <button class="marca" id="ir-abertura" title="Tela inicial">Kernel<span>Play</span></button>
          <button class="hud-man" id="abrir-man" title="Manual: conceitos e comandos já vistos">man</button>
          ${APRESENTACAO ? '<span class="modo-apr" title="Todas as etapas liberadas">APRESENTAÇÃO</span>' : ""}
        </div>
        <div class="stats">
          <span class="stat" title="Ciclos de CPU (experiência)">⚡ ${estado.ciclos}<small> ciclos</small></span>
          <span class="stat" title="Uptime: acertos seguidos">⏱ ${estado.uptime}<small> uptime</small></span>
          <span class="estab-box">${estabilidadeHTML()}</span>
        </div>
      </header>`;
  }

  function ligarHud() {
    const b = $("#ir-abertura");
    if (b) b.addEventListener("click", renderAbertura);
    const m = $("#abrir-man");
    if (m) m.addEventListener("click", renderMan);
  }

  // =========================================================
  // Tela 0 — Abertura
  // =========================================================
  function renderAbertura() {
    licao = null;
    topo();
    const linhas = [
      "[    0.000000] KernelPlay: inicializando...",
      `[    0.104512] carregando ${TRILHAS.length} trilha${TRILHAS.length > 1 ? "s" : ""}: ${TRILHAS.map(t => t.titulo.toLowerCase()).join(", ")}`,
      `[    0.231877] montando ${TRILHAS.reduce((n, t) => n + t.fases.length, 0)} etapas de boot`,
      "[    0.318004] mascote: online",
      "[  OK  ] Sistema pronto. Bons estudos!"
    ];
    app.innerHTML = `
      <main class="abertura">
        <section class="ab-texto">
          <pre class="bootlog" id="bootlog" aria-hidden="true"></pre>
          <h1 class="logo">Kernel<span>Play</span></h1>
          <p class="slogan">Aprenda Sistemas Operacionais jogando.<br>Do hardware ao shell, em trilhas curtas.</p>
          <button class="btn grande" id="iniciar">Iniciar sistema ▸</button>
          <p class="ab-tema">Sistemas Operacionais · ${TRILHAS.length} trilha${TRILHAS.length > 1 ? "s" : ""} disponíve${TRILHAS.length > 1 ? "is" : "l"}</p>
        </section>
        ${mascote("boas-vindas", "ab-mascote")}
      </main>`;

    const log = $("#bootlog");
    const reduzir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) {
      log.textContent = linhas.join("\n");
    } else {
      linhas.forEach((l, i) => setTimeout(() => {
        if (!document.body.contains(log)) return;
        log.textContent += (i ? "\n" : "") + l;
      }, 250 + i * 320));
    }
    $("#iniciar").addEventListener("click", renderGrub);
    $("#iniciar").focus();
  }

  // =========================================================
  // Tela 0.5 — Escolha da trilha (no estilo do menu do GRUB)
  // =========================================================
  function progressoTrilha(t) {
    return t.fases.filter(f => estado.concluidas.includes(f.id)).length;
  }

  function renderGrub() {
    licao = null;
    topo();
    const reais = TRILHAS.map((t, i) => ({ t, i }));
    const previstas = (typeof TRILHAS_PREVISTAS !== "undefined" ? TRILHAS_PREVISTAS : [])
      .filter(p => !TRILHAS.some(t => t.numero === p.numero));
    const itens = reais.map(({ t, i }) => ({ numero: t.numero, html: `
        <li><button class="grub-item ${i === trilhaIdx ? "sel" : ""}" data-trilha="${i}">
          <span class="grub-nome">Trilha ${t.numero} · ${t.titulo}</span>
          <span class="grub-info">${progressoTrilha(t)}/${t.fases.length} ${t.fases.length > 1 ? "etapas" : "etapa"}</span>
        </button></li>` }))
      .concat(previstas.map(p => ({ numero: p.numero, html: `
        <li><button class="grub-item breve" disabled>
          <span class="grub-nome">Trilha ${p.numero} · ${p.titulo}</span>
          <span class="grub-info">[em breve]</span>
        </button></li>` })))
      .sort((a, b) => a.numero - b.numero)
      .map(x => x.html).join("") + (typeof LABORATORIO !== "undefined" ? `
        <li class="grub-sep" aria-hidden="true"></li>
        <li><button class="grub-item lab" data-lab>
          <span class="grub-nome">🧪 Laboratório · treino livre e roteiros</span>
          <span class="grub-info">sem perder estabilidade</span>
        </button></li>` : "");

    app.innerHTML = `
      ${hud()}
      <main class="grub">
        <p class="grub-titulo">KernelPlay boot loader — escolha a trilha</p>
        <div class="grub-caixa"><ul id="grub-lista">${itens}</ul></div>
        <p class="grub-ajuda">Use as setas <kbd>↑</kbd> e <kbd>↓</kbd> para escolher e <kbd>Enter</kbd> para iniciar.<br>
          Ou clique na trilha. As trilhas seguem as unidades da disciplina.</p>
      </main>`;
    ligarHud();

    const botoes = Array.from(app.querySelectorAll(".grub-item:not(.breve)"));
    const abrir = (i) => { trilhaIdx = i; estado.trilha = i; salvar(); renderMapa(); };
    botoes.forEach(b => {
      b.addEventListener("click", () => (b.dataset.lab !== undefined ? renderLab() : abrir(Number(b.dataset.trilha))));
      b.addEventListener("focus", () => { botoes.forEach(x => x.classList.remove("sel")); b.classList.add("sel"); });
    });
    const atual = botoes.find(b => Number(b.dataset.trilha) === trilhaIdx) || botoes[0];
    if (atual) atual.focus();
    $("#grub-lista").addEventListener("keydown", (e) => {
      const k = botoes.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && k < botoes.length - 1) { e.preventDefault(); botoes[k + 1].focus(); }
      if (e.key === "ArrowUp" && k > 0) { e.preventDefault(); botoes[k - 1].focus(); }
    });
  }

  // =========================================================
  // Tela 1 — Trilha (sequência de boot)
  // =========================================================
  function renderMapa() {
    licao = null;
    topo();
    const STATUS = { concluida: "[  OK  ]", liberada: "[ .... ]", bloqueada: "[ LOCK ]" };

    const t = trilha();
    const etapas = t.fases.map((fase, i) => {
      const st = statusFase(i);
      const icone = st === "bloqueada" ? "🔒" : st === "concluida" ? "✓" : fase.icone;
      return `
        <li class="etapa ${st} ${fase.chefe ? "chefe" : ""}">
          <span class="no" aria-hidden="true">${icone}</span>
          <button class="cartao" data-fase="${i}" ${st === "bloqueada" ? "disabled" : ""}
                  aria-label="Etapa ${i + 1}: ${fase.titulo} (${st})">
            <span class="linha-status"><span class="status">${STATUS[st]}</span><span class="etq">${fase.etapa || "ETAPA " + (i + 1)}</span></span>
            <b>${i + 1}. ${fase.titulo}</b>
            <small>${fase.descricao}</small>
            ${st === "liberada" ? '<span class="cta">Iniciar ▸</span>' : ""}
            ${st === "concluida" ? '<span class="cta sec">Rever ↺</span>' : ""}
          </button>
        </li>`;
    }).join("");

    app.innerHTML = `
      ${hud()}
      <main class="mapa">
        <section class="unidade">
          <div>
            <button class="trocar" id="trocar-trilha">◂ trilhas</button>
            <small>$ boot --trilha-${t.numero}</small>
            <h1>${t.titulo}</h1>
            <p>${t.subtitulo || ""}</p>
          </div>
          ${mascote("boas-vindas", "un-mascote")}
        </section>
        <ol class="boot">${etapas}</ol>
        <button class="link" id="reiniciar">Reiniciar progresso</button>
        ${APRESENTACAO ? '<button class="link" id="ver-panico">Mostrar a tela de kernel panic</button>' : ""}
      </main>`;

    ligarHud();
    app.querySelectorAll("[data-fase]").forEach(btn =>
      btn.addEventListener("click", () => iniciarFase(Number(btn.dataset.fase)))
    );
    if (APRESENTACAO) $("#ver-panico").addEventListener("click", renderPanico);
    $("#trocar-trilha").addEventListener("click", renderGrub);
    $("#reiniciar").addEventListener("click", () => {
      if (confirm("Apagar ciclos, estabilidade e etapas concluídas desta sessão?")) {
        estado = Object.assign({}, ESTADO_INICIAL, { concluidas: [] });
        salvar();
        renderMapa();
      }
    });
  }

  // =========================================================
  // Tela 2 — Lição
  // =========================================================
  function iniciarFase(indice) {
    if (estado.estabilidade <= 0) return renderPanico();
    const fase = fasesAtuais()[indice];
    licao = {
      indice,
      fase,
      fila: fase.desafios.map((_, k) => k), // erros voltam para o fim da fila
      total: fase.desafios.length,
      feitos: 0,
      acertos: 0,
      erros: 0,
      ciclos: 0,
      maiorUptime: 0,
      semErros: true,
      atual: null
    };
    renderDesafio();
  }

  function moldeLicao(pct) {
    topo();
    app.innerHTML = `
      <div class="licao">
        <header class="topo-licao">
          <button class="fechar" id="sair" aria-label="Sair da lição">✕</button>
          <div class="barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
          <span class="estab-box">${estabilidadeHTML()}</span>
        </header>
        ${APRESENTACAO ? navApresentacao() : ""}
        <main class="desafio" id="desafio"></main>
        <footer class="rodape" id="rodape"></footer>
      </div>`;
    $("#sair").addEventListener("click", () => (licao && licao.lab ? renderLab() : renderMapa()));
    if (APRESENTACAO) ligarNavApresentacao();
  }

  // ---------- Atalhos do modo apresentação ----------
  const SIGLA_TIPO = { conceito: "C", multipla: "Q", ordenar: "O", simulacao: "S", terminal: "T", associar: "A", substituicao: "S", roteiro: "R" };

  function navApresentacao() {
    const atual = licao.atual && licao.fila[0];
    const botoes = licao.fase.desafios.map((d, k) =>
      `<button class="${k === atual && !licao.naPonte ? "atual" : ""}" data-ir="${k}" title="${d.tipo}">${k + 1}<small>${SIGLA_TIPO[d.tipo] || ""}</small></button>`
    ).join("");
    const ponte = [licao.fase.xv6 ? '<button data-ponte="xv6">xv6</button>' : "", licao.fase.linux ? '<button data-ponte="linux">Linux</button>' : ""].join("");
    return `<nav class="pular" aria-label="Pular para um desafio"><span>Ir para:</span>${botoes}${ponte}</nav>`;
  }

  function ligarNavApresentacao() {
    app.querySelectorAll(".pular [data-ir]").forEach(b => b.addEventListener("click", () => {
      const k = Number(b.dataset.ir);
      licao.fila = [k].concat(licao.fila.filter(x => x !== k));
      licao.naPonte = false;
      renderDesafio();
    }));
    app.querySelectorAll(".pular [data-ponte]").forEach(b => b.addEventListener("click", () => {
      const temXv6 = !!licao.fase.xv6;
      renderPonte(b.dataset.ponte === "linux" && temXv6 ? 1 : 0);
    }));
  }

  function renderDesafio() {
    const d = licao.fase.desafios[licao.fila[0]];
    licao.atual = { d, usouDica: false, erros: 0, respondido: false };
    licao.naPonte = false;
    moldeLicao(progresso());
    const montar = { conceito: montarConceito, multipla: montarMultipla, ordenar: montarOrdenar, simulacao: montarSimulacao, terminal: montarTerminal, associar: montarAssociar, substituicao: montarSubstituicao, roteiro: montarRoteiro };
    montar[d.tipo](d);
  }

  // No modo apresentação dá para repetir desafios; a barra nunca passa de 100%
  function progresso() {
    return Math.min(100, Math.round((licao.feitos / licao.total) * 100));
  }

  function cabecalho(rotulo) {
    const d = licao.atual && licao.atual.d;
    const lab = d && d.lab ? `<span class="tag-lab" title="Atividade das aulas de laboratório">🧪 ${d.lab}</span>` : "";
    return `<p class="tag">${lab}${rotulo} · ${Math.min(licao.feitos + 1, licao.total)}/${licao.total}</p>`;
  }

  function rodapePadrao(comVerificar) {
    $("#rodape").className = "rodape";
    $("#rodape").innerHTML = `
      <button class="btn sec" id="btn-dica">💡 Dica</button>
      ${comVerificar ? '<button class="btn" id="btn-verificar" disabled>Verificar</button>' : ""}`;
    $("#btn-dica").addEventListener("click", mostrarDica);
  }

  function mostrarDica() {
    const a = licao.atual;
    if (a.usouDica || !a.d.dica) return;
    a.usouDica = true;
    $("#btn-dica").disabled = true;
    const caixa = document.createElement("div");
    caixa.className = "dica";
    caixa.innerHTML = `${mascote("dica", "mini")}<p>${a.d.dica} <small>(−${PENALIDADE_DICA} ciclos neste desafio)</small></p>`;
    $("#desafio").appendChild(caixa);
  }

  // ---------- Conceito ----------
  function montarConceito(d) {
    $("#desafio").innerHTML = `
      ${cabecalho("CONCEITO")}
      <h2>${d.titulo}</h2>
      <div class="texto">${d.texto}</div>`;
    $("#rodape").className = "rodape";
    $("#rodape").innerHTML = `<span></span><button class="btn" id="continuar">Entendi</button>`;
    $("#continuar").addEventListener("click", () => {
      licao.fila.shift();
      licao.feitos++;
      proximo();
    });
  }

  // ---------- Múltipla escolha ----------
  function montarMultipla(d) {
    let escolhida = null;
    $("#desafio").innerHTML = `
      ${cabecalho("DESAFIO")}
      ${d.contexto ? `<pre class="terminal contexto ${d.contexto.includes("\n") ? "codigo-ctx" : ""}">${esc(d.contexto)}</pre>` : ""}
      <h2>${d.pergunta}</h2>
      <div class="opcoes">
        ${d.opcoes.map((op, i) => `
          <button class="opcao" data-i="${i}"><kbd>${i + 1}</kbd><span>${op}</span></button>`).join("")}
      </div>`;
    rodapePadrao(true);

    const botoes = app.querySelectorAll(".opcao");
    botoes.forEach(b => b.addEventListener("click", () => {
      if (licao.atual.respondido) return;
      botoes.forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      escolhida = Number(b.dataset.i);
      $("#btn-verificar").disabled = false;
    }));

    $("#btn-verificar").addEventListener("click", () => {
      if (escolhida === null) return;
      const certo = escolhida === d.correta;
      botoes.forEach(b => (b.disabled = true));
      botoes[d.correta].classList.add("certa");
      if (!certo) botoes[escolhida].classList.add("errada");
      avaliar(certo, { respostaCerta: d.opcoes[d.correta] });
    });
  }

  // ---------- Ordenar ----------
  function montarOrdenar(d) {
    // Embaralha garantindo que não comece já na ordem certa
    let pecas = embaralhar(d.itens);
    for (let t = 0; t < 10 && pecas.join("|") === d.itens.join("|"); t++) pecas = embaralhar(d.itens);
    const resposta = []; // índices de "pecas" na ordem escolhida

    $("#desafio").innerHTML = `
      ${cabecalho("ORDENE")}
      <h2>${d.pergunta}</h2>
      <div class="zona-resposta" id="zona"></div>
      <div class="banco" id="banco"></div>`;
    rodapePadrao(true);

    function desenhar() {
      $("#zona").innerHTML = resposta.length
        ? resposta.map((k, pos) => `${pos ? '<span class="seta">→</span>' : ""}<button class="chip" data-r="${pos}">${pecas[k]}</button>`).join("")
        : '<span class="vazio">Toque nas peças abaixo na ordem certa</span>';
      $("#banco").innerHTML = pecas.map((p, k) =>
        `<button class="chip" data-k="${k}" ${resposta.includes(k) ? "disabled" : ""}>${p}</button>`).join("");

      app.querySelectorAll("#banco .chip").forEach(b => b.addEventListener("click", () => {
        if (licao.atual.respondido) return;
        resposta.push(Number(b.dataset.k));
        desenhar();
      }));
      app.querySelectorAll("#zona .chip").forEach(b => b.addEventListener("click", () => {
        if (licao.atual.respondido) return;
        resposta.splice(Number(b.dataset.r), 1);
        desenhar();
      }));
      $("#btn-verificar").disabled = resposta.length !== pecas.length;
    }
    desenhar();

    $("#btn-verificar").addEventListener("click", () => {
      const certo = resposta.map(k => pecas[k]).join("|") === d.itens.join("|");
      app.querySelectorAll(".chip").forEach(c => (c.disabled = true));
      $("#zona").classList.add(certo ? "certa" : "errada");
      avaliar(certo, { respostaCerta: d.itens.join(" → ") });
    });
  }

  // ---------- Substituição de páginas (simulação) ----------
  // { tipo: "substituicao", pergunta, algoritmo: "FIFO" | "LRU" | "OPT", cadeia: [páginas], quadros: N, dica, explicacao }
  // O jogo avança sozinho nos acertos (hits) e nas faltas com quadro livre.
  // Quando a memória está cheia, o jogador escolhe a vítima segundo o algoritmo.
  const REGRA_ALG = {
    FIFO: "remove a página que está há mais tempo na memória",
    LRU: "remove a página usada há mais tempo (menos recentemente)",
    OPT: "remove a página que vai demorar mais para ser usada de novo"
  };

  function montarSubstituicao(d) {
    const N = d.quadros;
    let t = 0;                 // posição atual na cadeia
    let quadros = [];          // { pag, entrou, uso }
    let faltas = 0;
    const marcas = [];         // "H" (acerto) ou "F" (falta) por posição
    let esperando = false;     // aguardando o jogador escolher a vítima

    const proxUso = (pag, desde) => {
      for (let k = desde + 1; k < d.cadeia.length; k++) if (d.cadeia[k] === pag) return k;
      return Infinity;
    };

    // Índices dos quadros que o algoritmo aceita como vítima (o OPT pode ter empate)
    function vitimasValidas() {
      let chave;
      if (d.algoritmo === "FIFO") chave = q => -q.entrou;
      else if (d.algoritmo === "LRU") chave = q => -q.uso;
      else chave = q => proxUso(q.pag, t);
      const valores = quadros.map(chave);
      const melhor = Math.max(...valores);
      return valores.map((v, i) => (v === melhor ? i : -1)).filter(i => i >= 0);
    }

    $("#desafio").innerHTML = `
      ${cabecalho("SIMULAÇÃO")}
      <h2>${d.pergunta}</h2>
      <div class="objetivo">🧠 Algoritmo <b class="alg">${d.algoritmo === "OPT" ? "Ótimo (OPT)" : d.algoritmo}</b>: ${REGRA_ALG[d.algoritmo]}.</div>
      <div class="cadeia" id="cadeia"></div>
      <div class="quadros-cab"><span>Memória: ${N} quadros</span><span id="cont-faltas">Faltas: 0</span></div>
      <div class="quadros" id="quadros"></div>
      <p class="instrucao" id="instrucao"></p>
      <div class="terminal log" id="log"><div class="linha sis">$ referências: ${d.cadeia.join(", ")}</div></div>`;
    rodapePadrao(false);

    function registrar(texto, tipo) {
      const linha = document.createElement("div");
      linha.className = "linha " + tipo;
      linha.textContent = texto;
      $("#log").appendChild(linha);
      $("#log").scrollTop = $("#log").scrollHeight;
    }

    function info(q) {
      if (d.algoritmo === "FIFO") return `entrou em t=${q.entrou}`;
      if (d.algoritmo === "LRU") return `último uso t=${q.uso}`;
      const p = proxUso(q.pag, t);
      return p === Infinity ? "não será mais usada" : `próximo uso t=${p}`;
    }

    function desenhar() {
      $("#cadeia").innerHTML = d.cadeia.map((p, k) =>
        `<span class="ref ${k === t && t < d.cadeia.length ? "atual" : ""} ${k < t ? "feita" : ""}">
           <small>t=${k}</small><b>${p}</b><i class="${marcas[k] === "F" ? "f" : "h"}">${marcas[k] === "F" ? "falta" : marcas[k] === "H" ? "ok" : ""}</i>
         </span>`).join("");
      let html = "";
      for (let i = 0; i < N; i++) {
        const q = quadros[i];
        html += q
          ? `<button class="quadro ${esperando ? "escolher" : ""}" data-q="${i}" ${esperando ? "" : "disabled"}>
               <small>quadro ${i}</small><b>${q.pag}</b><em>${info(q)}</em></button>`
          : `<div class="quadro vazio"><small>quadro ${i}</small><b>—</b><em>livre</em></div>`;
      }
      $("#quadros").innerHTML = html;
      $("#cont-faltas").textContent = `Faltas: ${faltas}`;
      app.querySelectorAll(".quadro.escolher").forEach(b => b.addEventListener("click", () => escolher(Number(b.dataset.q))));
    }

    // Avança sozinho até precisar do jogador (ou até o fim da cadeia)
    function avancar() {
      while (t < d.cadeia.length) {
        const p = d.cadeia[t];
        const q = quadros.find(x => x.pag === p);
        if (q) {
          q.uso = t;
          marcas[t] = "H";
          registrar(`t=${t}: página ${p} já está na memória (acerto)`, "sis");
          t++;
          continue;
        }
        faltas++;
        marcas[t] = "F";
        if (quadros.length < N) {
          quadros.push({ pag: p, entrou: t, uso: t });
          registrar(`t=${t}: falta de página ${p} → carregada no quadro livre ${quadros.length - 1}`, "ok");
          t++;
          continue;
        }
        esperando = true;
        $("#instrucao").innerHTML = `⚠ <b>Falta de página ${p}</b> e a memória está cheia. Clique no quadro da <b>vítima</b>.`;
        desenhar();
        return;
      }
      // fim da cadeia
      esperando = false;
      $("#instrucao").textContent = `Fim da cadeia: ${faltas} faltas de página com ${N} quadros.`;
      desenhar();
      registrar(`$ total: ${faltas} faltas de página`, "sis");
      avaliar(licao.atual.erros === 0, { jaPenalizado: true, concluido: true });
    }

    function escolher(i) {
      if (licao.atual.respondido || !esperando) return;
      const validas = vitimasValidas();
      const p = d.cadeia[t];
      if (!validas.includes(i)) {
        const certa = validas.map(k => quadros[k].pag).join(" ou ");
        registrar(`✗ O ${d.algoritmo} não removeria a página ${quadros[i].pag}: a vítima é ${certa} (${REGRA_ALG[d.algoritmo]}).`, "erro");
        licao.atual.erros++;
        perderEstabilidade();
        if (estado.estabilidade <= 0) {
          licao.atual.respondido = true;
          mostrarFeedback({ certo: false, explicacao: "A estabilidade chegou a 0% no meio da simulação.", titulo: "Kernel panic!" });
        }
        return;
      }
      const sai = quadros[i].pag;
      quadros[i] = { pag: p, entrou: t, uso: t };
      registrar(`t=${t}: falta de página ${p} → sai a ${sai} (quadro ${i})`, "ok");
      t++;
      esperando = false;
      $("#instrucao").textContent = "";
      avancar();
    }

    avancar();
  }

  // ---------- Associar (ligar pares) ----------
  // pares: [[esquerda, direita], ...] na combinação CERTA; a coluna da direita é embaralhada.
  function montarAssociar(d) {
    const n = d.pares.length;
    let ordem = embaralhar(d.pares.map((_, k) => k));
    for (let t = 0; t < 10 && ordem.every((v, k) => v === k); t++) ordem = embaralhar(ordem);
    const ligacao = {};      // índice da esquerda -> índice (original) da direita
    let escolhida = null;    // item da esquerda selecionado

    $("#desafio").innerHTML = `
      ${cabecalho("ASSOCIE")}
      <h2>${d.pergunta}</h2>
      <p class="assoc-ajuda">Toque num item da esquerda e depois no par dele à direita. Para desfazer, toque num item já ligado.</p>
      <div class="assoc">
        <div class="assoc-col" id="assoc-esq"></div>
        <div class="assoc-col" id="assoc-dir"></div>
      </div>`;
    rodapePadrao(true);

    const corDe = (k) => "c" + (k % 6);
    const ligadoA = (dir) => Object.keys(ligacao).find(e => ligacao[e] === dir);

    function desenhar() {
      $("#assoc-esq").innerHTML = d.pares.map((p, k) => {
        const lig = ligacao[k] !== undefined;
        return `<button class="assoc-item ${lig ? "lig " + corDe(k) : ""} ${escolhida === k ? "sel" : ""}" data-e="${k}">
                  ${lig ? `<i>${k + 1}</i>` : ""}<span>${p[0]}</span></button>`;
      }).join("");
      $("#assoc-dir").innerHTML = ordem.map(k => {
        const e = ligadoA(k);
        return `<button class="assoc-item ${e !== undefined ? "lig " + corDe(Number(e)) : ""}" data-d="${k}">
                  ${e !== undefined ? `<i>${Number(e) + 1}</i>` : ""}<span>${d.pares[k][1]}</span></button>`;
      }).join("");

      app.querySelectorAll("[data-e]").forEach(b => b.addEventListener("click", () => {
        if (licao.atual.respondido) return;
        const k = Number(b.dataset.e);
        // clicar num item sempre o seleciona; se ele já tinha par, o par é desfeito
        if (ligacao[k] !== undefined) delete ligacao[k];
        escolhida = k;
        desenhar();
      }));
      app.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => {
        if (licao.atual.respondido) return;
        const k = Number(b.dataset.d);
        const anterior = ligadoA(k);
        if (escolhida === null) {
          if (anterior !== undefined) delete ligacao[anterior];
        } else {
          if (anterior !== undefined) delete ligacao[anterior];
          ligacao[escolhida] = k;
          // próxima da esquerda ainda sem par, para agilizar
          const livre = d.pares.findIndex((_, i) => ligacao[i] === undefined);
          escolhida = livre === -1 ? null : livre;
        }
        desenhar();
      }));
      $("#btn-verificar").disabled = Object.keys(ligacao).length !== n;
    }
    escolhida = 0;
    desenhar();

    $("#btn-verificar").addEventListener("click", () => {
      const certo = d.pares.every((_, k) => ligacao[k] === k);
      app.querySelectorAll("[data-e]").forEach(b => {
        const k = Number(b.dataset.e);
        b.classList.add(ligacao[k] === k ? "certa" : "errada");
        b.disabled = true;
      });
      app.querySelectorAll("[data-d]").forEach(b => (b.disabled = true));
      avaliar(certo, { respostaCerta: d.pares.map(p => `${p[0]} → ${p[1]}`).join("; ") });
    });
  }

  // ---------- Terminal ----------
  // O jogador digita o comando e aperta Enter.
  //  - aceitar: expressões regulares do(s) comando(s) certo(s)  → mostra "saida" e conclui
  //  - neutros: comandos que mostram algo, mas não resolvem      → sem custo
  //  - erradas: comandos que fazem besteira                      → custam estabilidade
  //  - qualquer outro comando                                    → aviso, sem custo
  const LINUX_CONHECIDOS = ["ps", "kill", "pkill", "killall", "top", "htop", "pstree", "ls", "cat", "echo", "sleep", "jobs", "wait", "nice", "chrt"];

  function normalizarComando(texto) {
    return texto.trim().replace(/\s+/g, " ");
  }

  function casa(lista, cmd) {
    return (lista || []).some(re => new RegExp("^(?:" + re + ")$", "i").test(cmd));
  }

  function montarTerminal(d) {
    const xv6 = d.ambiente === "xv6";
    const prompt = xv6 ? "$" : "pedro@kernelplay:~$";
    const historico = [];
    let posHist = 0;

    $("#desafio").innerHTML = `
      ${cabecalho("TERMINAL")}
      <h2>${d.pergunta}</h2>
      <div class="term">
        <div class="janela-topo"><i></i><i></i><i></i><span>${xv6 ? "xv6 — QEMU" : "bash — Linux"}</span></div>
        <div class="term-corpo" id="tcorpo">
          <pre class="term-saida" id="tsaida"></pre>
          <label class="term-linha">
            <span class="term-prompt">${prompt}</span>
            <input id="tin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                   aria-label="Digite o comando e aperte Enter">
          </label>
        </div>
      </div>
      <p class="term-ajuda">Digite o comando e aperte <kbd>Enter</kbd>.${xv6 ? " Atalhos de teclado também valem (no celular, use o botão abaixo)." : ""}</p>
      ${xv6 ? '<button class="btn sec" id="btn-ctrlp">Ctrl-P</button>' : ""}`;
    rodapePadrao(false);

    const saida = $("#tsaida");
    const entrada = $("#tin");

    function imprimir(texto, classe) {
      const bloco = document.createElement("span");
      if (classe) bloco.className = classe;
      bloco.textContent = texto + "\n";
      saida.appendChild(bloco);
      $("#tcorpo").scrollTop = $("#tcorpo").scrollHeight;
    }

    if (d.inicial) imprimir(d.inicial);

    function executar(bruto) {
      if (licao.atual.respondido) return;
      const cmd = normalizarComando(bruto);
      imprimir(`${prompt} ${cmd}`, "term-eco");
      if (!cmd) return;
      historico.push(cmd);
      posHist = historico.length;

      if (cmd === "clear") { saida.textContent = ""; return; }
      if (cmd === "help") {
        imprimir("Digite o comando que resolve o desafio. Se travar, use o botão Dica.", "term-nota");
        return;
      }

      if (casa(d.aceitar, cmd)) {
        imprimir(d.saida);
        entrada.disabled = true;
        const ctrlp = $("#btn-ctrlp");
        if (ctrlp) ctrlp.disabled = true;
        avaliar(licao.atual.erros === 0, { jaPenalizado: true, concluido: true });
        return;
      }

      const neutro = (d.neutros || []).find(n => casa([n.re], cmd));
      if (neutro) {
        if (neutro.saida) imprimir(neutro.saida);
        if (neutro.nota) imprimir("# " + neutro.nota, "term-nota");
        return;
      }

      const errado = (d.erradas || []).find(n => casa([n.re], cmd));
      if (errado) {
        if (errado.saida) imprimir(errado.saida);
        imprimir("# " + errado.nota, "term-erro");
        licao.atual.erros++;
        perderEstabilidade();
        if (estado.estabilidade <= 0) {
          licao.atual.respondido = true;
          entrada.disabled = true;
          mostrarFeedback({ certo: false, explicacao: "A estabilidade chegou a 0% no terminal.", titulo: "Kernel panic!" });
        }
        return;
      }

      // Comando que o simulador não conhece: avisa, sem custo
      const nome = cmd.split(" ")[0];
      if (xv6) imprimir(`exec ${nome} failed`);
      else if (!LINUX_CONHECIDOS.includes(nome)) imprimir(`bash: ${nome}: comando não encontrado`);
      else imprimir(`# Este simulador não reconhece "${cmd}" aqui. Tente outro comando (sem custo).`, "term-nota");
    }

    entrada.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        executar(entrada.value);
        entrada.value = "";
      } else if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault(); // evita abrir a janela de impressão do navegador
        if (xv6) { executar("^P"); entrada.value = ""; }
      } else if (e.key === "ArrowUp" && historico.length) {
        e.preventDefault();
        posHist = Math.max(0, posHist - 1);
        entrada.value = historico[posHist];
      } else if (e.key === "ArrowDown" && historico.length) {
        e.preventDefault();
        posHist = Math.min(historico.length, posHist + 1);
        entrada.value = historico[posHist] || "";
      }
    });
    if (xv6) $("#btn-ctrlp").addEventListener("click", () => { executar("^P"); entrada.focus(); });
    $("#tcorpo").addEventListener("click", () => entrada.focus());
    entrada.focus();
  }

  // ---------- Diagrama de estados (SVG ao vivo) ----------
  const DIAG_NOS = {
    READY: [160, 50], RUNNING: [380, 50], SLEEPING: [270, 170], ZOMBIE: [545, 50], UNUSED: [545, 170]
  };
  const DIAG_ARESTAS = [
    { id: "NEW>READY",        d: "M 52 50 L 104 50",           rot: "fork()",          x: 78,  y: 40,  a: "middle" },
    { id: "READY>RUNNING",    d: "M 190 32 Q 270 -4 350 32",   rot: "escalonar",       x: 270, y: 8,   a: "middle" },
    { id: "RUNNING>READY",    d: "M 350 68 Q 270 104 190 68",  rot: "yield()",         x: 270, y: 104, a: "middle" },
    { id: "RUNNING>SLEEPING", d: "M 372 68 L 300 150",         rot: "I/O · wait()",    x: 346, y: 118, a: "start" },
    { id: "SLEEPING>READY",   d: "M 240 150 L 168 68",         rot: "fim E/S · wakeup",x: 194, y: 118, a: "end" },
    { id: "RUNNING>ZOMBIE",   d: "M 430 50 L 491 50",          rot: "exit()",          x: 460, y: 40,  a: "middle" },
    { id: "ZOMBIE>UNUSED",    d: "M 545 68 L 545 150",         rot: "wait() do pai",   x: 552, y: 114, a: "start" }
  ];

  function diagramaSVG(estadoAtivo, transicoes) {
    const arestas = DIAG_ARESTAS.map(e => `
      <path class="ar ${transicoes.includes(e.id) ? "pulso" : ""}" d="${e.d}"/>
      <text class="ar-rot ${transicoes.includes(e.id) ? "pulso" : ""}" x="${e.x}" y="${e.y}" text-anchor="${e.a}">${e.rot}</text>`).join("");
    const nos = Object.entries(DIAG_NOS).map(([nome, [x, y]]) => `
      <g class="dn ${nome.toLowerCase()} ${nome === estadoAtivo ? "ativo" : ""}">
        <rect x="${x - 54}" y="${y - 20}" width="108" height="40" rx="9"/>
        <text x="${x}" y="${y + 1}" text-anchor="middle">${ROTULO_ESTADO[nome]}</text>
        <text class="xv6" x="${x}" y="${y + 14}" text-anchor="middle">${XV6_ESTADO[nome]}</text>
      </g>`).join("");
    return `
      <svg class="diagrama" viewBox="0 -8 668 208" role="img" aria-label="Diagrama de estados de processo (nomes da aula e, embaixo, do xv6)">
        <defs>
          <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" class="seta-normal"/>
          </marker>
          <marker id="seta-ativa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" class="seta-ativa"/>
          </marker>
        </defs>
        <circle class="novo" cx="40" cy="50" r="7"/><text class="ar-rot" x="40" y="72" text-anchor="middle">Novo</text>
        ${arestas}
        ${nos}
      </svg>`;
  }

  // ---------- Simulação ----------
  function montarSimulacao(d) {
    let sim = new Simulador(d.processos);
    let selecionado = null;
    let mudaram = [];
    let transicoes = [];
    let legenda = "Selecione um processo para ver o estado dele no diagrama.";

    const textoObjetivo = d.objetivo.map(o =>
      `<span class="obj"><b>${o.processo}</b> → <span class="badge ${o.estado.toLowerCase()}">${ROTULO_ESTADO[o.estado]}</span></span>`
    ).join("");

    $("#desafio").innerHTML = `
      ${cabecalho("SIMULAÇÃO")}
      <h2>${d.pergunta}</h2>
      <div class="objetivo">🎯 Objetivo: ${textoObjetivo}</div>
      <div class="sim-grade">
        <div>
          <div class="procs" id="procs"></div>
          <p class="instrucao" id="instrucao"></p>
          <div class="acoes" id="acoes">
            ${d.acoes.map(a => `
              <button class="acao" data-acao="${a}">
                <b>${ACOES[a].rotulo}</b><small>${ACOES[a].desc}</small>
              </button>`).join("")}
          </div>
        </div>
        <figure class="diag-box">
          <div id="diagrama"></div>
          <figcaption id="legenda"></figcaption>
        </figure>
      </div>
      <div class="terminal log" id="log"><div class="linha sis">$ simulação iniciada</div></div>`;

    rodapePadrao(false);
    const reiniciar = document.createElement("button");
    reiniciar.className = "btn sec";
    reiniciar.textContent = "↺ Reiniciar";
    reiniciar.addEventListener("click", () => {
      sim = new Simulador(d.processos);
      selecionado = null;
      mudaram = [];
      transicoes = [];
      legenda = "Simulação reiniciada.";
      $("#log").innerHTML = '<div class="linha sis">$ simulação reiniciada</div>';
      desenhar();
    });
    $("#rodape").appendChild(reiniciar);

    function desenhar() {
      const vivos = sim.vivos();
      if (!selecionado || sim.estadoDe(selecionado) === "UNUSED") {
        selecionado = vivos.length === 1 ? vivos[0].nome : null;
      }
      $("#procs").innerHTML = sim.procs.map(p => {
        const espera = p.estado === "SLEEPING" ? (p.motivo === "wait" ? "espera filho" : "espera E/S") : "";
        const info = [p.pai ? `pai: ${p.pai}` : "", espera].filter(Boolean).join(" · ");
        return `
          <button class="proc ${p.estado.toLowerCase()} ${p.nome === selecionado ? "sel" : ""} ${mudaram.includes(p.nome) ? "mudou" : ""}"
                  data-proc="${p.nome}" ${p.estado === "UNUSED" ? "disabled" : ""}>
            <span class="pnome">${p.nome}</span>
            <span class="badge ${p.estado.toLowerCase()}" title="No xv6: ${XV6_ESTADO[p.estado]}">${ROTULO_ESTADO[p.estado]}<em>${XV6_ESTADO[p.estado]}</em></span>
            <small>${info || "&nbsp;"}</small>
          </button>`;
      }).join("");
      $("#instrucao").textContent = selecionado
        ? `Selecionado: ${selecionado}. Escolha uma ação.`
        : "Clique em um processo para selecioná-lo.";
      $("#diagrama").innerHTML = diagramaSVG(selecionado ? sim.estadoDe(selecionado) : null, transicoes);
      $("#legenda").textContent = legenda;

      app.querySelectorAll(".proc").forEach(b => b.addEventListener("click", () => {
        if (licao.atual.respondido) return;
        selecionado = b.dataset.proc;
        mudaram = [];
        transicoes = [];
        legenda = `${selecionado} está ${ROTULO_ESTADO[sim.estadoDe(selecionado)]} (${XV6_ESTADO[sim.estadoDe(selecionado)]} no xv6).`;
        desenhar();
      }));
    }

    function registrar(texto, tipo) {
      const linha = document.createElement("div");
      linha.className = "linha " + tipo;
      linha.textContent = (tipo === "erro" ? "✗ " : "✓ ") + texto;
      $("#log").appendChild(linha);
      $("#log").scrollTop = $("#log").scrollHeight;
    }

    app.querySelectorAll(".acao").forEach(b => b.addEventListener("click", () => {
      if (licao.atual.respondido) return;
      const antes = {};
      sim.procs.forEach(p => (antes[p.nome] = p.estado));
      const r = sim.aplicar(b.dataset.acao, selecionado);

      if (!r.ok) {
        registrar(r.msg, "erro");
        if (selecionado) {           // sem seleção é só aviso, não custa estabilidade
          licao.atual.erros++;
          perderEstabilidade();
          if (estado.estabilidade <= 0) {
            licao.atual.respondido = true;
            mostrarFeedback({ certo: false, explicacao: "A estabilidade chegou a 0% no meio da simulação.", titulo: "Kernel panic!" });
          }
        }
        return;
      }

      registrar(r.msg, "ok");
      // Descobre quais transições aconteceram (pode haver mais de uma: exit acorda o pai, etc.)
      mudaram = [];
      transicoes = [];
      const textos = [];
      sim.procs.forEach(p => {
        const de = antes[p.nome] || "NEW";
        if (de !== p.estado) {
          mudaram.push(p.nome);
          transicoes.push(`${de}>${p.estado}`);
          textos.push(`${p.nome}: ${de === "NEW" ? "Novo" : ROTULO_ESTADO[de]} → ${ROTULO_ESTADO[p.estado]}`);
        }
      });
      legenda = textos.length ? textos.join(" · ") : "Nenhum estado mudou.";
      desenhar();

      if (sim.objetivoCumprido(d.objetivo)) {
        app.querySelectorAll(".acao").forEach(x => (x.disabled = true));
        reiniciar.disabled = true;
        avaliar(licao.atual.erros === 0, { jaPenalizado: true, concluido: true });
      }
    }));

    desenhar();
  }

  // =========================================================
  // Avaliação, feedback e fluxo
  // =========================================================
  function avaliar(certo, opcoes) {
    const op = opcoes || {};
    const a = licao.atual;
    a.respondido = true;
    let ganho = 0;
    let bonus = false;

    if (certo) {
      licao.acertos++;
      estado.uptime++;
      estado.melhorUptime = Math.max(estado.melhorUptime, estado.uptime);
      licao.maiorUptime = Math.max(licao.maiorUptime, estado.uptime);
      ganho = CICLOS_ACERTO - (a.usouDica ? PENALIDADE_DICA : 0);
      if (estado.uptime >= 3) { ganho += CICLOS_BONUS_UPTIME; bonus = true; }
      estado.ciclos += ganho;
      licao.ciclos += ganho;
    } else {
      licao.erros++;
      licao.semErros = false;
      if (!op.jaPenalizado) perderEstabilidade();
      estado.uptime = 0;
    }

    const id = licao.fila.shift();
    if (certo || op.concluido) licao.feitos++;
    else licao.fila.push(id); // revisão: a questão volta no fim da lição

    salvar();
    const barra = $(".barra > div");
    if (barra) barra.style.width = progresso() + "%";

    const titulo = certo
      ? `${sortear(ELOGIOS)} +${ganho} ciclos${bonus ? ` · ⏱ uptime ${estado.uptime}` : ""}`
      : op.concluido ? `Objetivo cumprido, mas com ${a.erros} erro(s)` : "Não foi dessa vez";
    mostrarFeedback({
      certo,
      concluido: op.concluido,
      respostaCerta: certo ? null : op.respostaCerta,
      explicacao: a.d.explicacao,
      titulo
    });
  }

  function mostrarFeedback(f) {
    const rodape = $("#rodape");
    const pose = f.certo ? "acerto" : estado.estabilidade <= 0 ? "panico" : "erro";
    rodape.className = "rodape " + (f.certo ? "certo" : "errado");
    rodape.innerHTML = `
      <div class="fb">
        ${mascote(pose, "fb-mascote")}
        <div>
          <h3>${f.titulo}</h3>
          ${f.respostaCerta ? `<p><b>Resposta correta:</b> ${f.respostaCerta}</p>` : ""}
          <p>${f.explicacao}</p>
        </div>
      </div>
      <button class="btn ${f.certo ? "" : "vermelho"}" id="continuar">Continuar</button>`;
    $("#continuar").addEventListener("click", proximo);
    $("#continuar").focus();
  }

  function proximo() {
    if (estado.estabilidade <= 0 && !licao.lab) return renderPanico();
    if (licao.fila.length === 0) return licao.lab ? concluirLab() : renderPonte(0);
    renderDesafio();
  }

  // =========================================================
  // Cartões "Veja no xv6" e "E no Linux?" (fim de cada fase)
  // =========================================================
  function renderPonte(passo) {
    const fase = licao.fase;
    const cartoes = [];
    if (fase.xv6) cartoes.push({ tipo: "xv6", ...fase.xv6 });
    if (fase.linux) cartoes.push({ tipo: "linux", ...fase.linux });
    if (passo >= cartoes.length) return concluirFase();

    const c = cartoes[passo];
    licao.naPonte = true;
    moldeLicao(100);
    const ehXv6 = c.tipo === "xv6";
    $("#desafio").innerHTML = `
      <p class="tag ${ehXv6 ? "tag-xv6" : "tag-linux"}">${ehXv6 ? "VEJA NO XV6" : "E NO LINUX?"} · ${passo + 1}/${cartoes.length}</p>
      <h2>${c.titulo}</h2>
      <div class="ponte">
        <div class="janela">
          <div class="janela-topo"><i></i><i></i><i></i><span>${ehXv6 ? esc(c.arquivo) : "bash"}</span></div>
          <pre class="codigo">${ehXv6 ? esc(c.codigo) : `<span class="prompt">$</span> ${esc(c.comando)}\n${esc(c.saida)}`}</pre>
        </div>
        <p class="ponte-texto">${c.texto}</p>
      </div>`;
    $("#rodape").className = "rodape";
    $("#rodape").innerHTML = `<span class="ponte-dica">${ehXv6 ? "Trechos resumidos do xv6-labs-2024, a versão usada no laboratório." : "Mesmo conceito, num SO usado no dia a dia."}</span>
      <button class="btn" id="continuar">${passo + 1 < cartoes.length ? "Próximo" : "Concluir etapa"}</button>`;
    $("#continuar").addEventListener("click", () => renderPonte(passo + 1));
    $("#continuar").focus();
  }

  // =========================================================
  // Tela 3 — Resultado
  // =========================================================
  function concluirFase() {
    topo();
    const fase = licao.fase;
    const primeiraVez = !estado.concluidas.includes(fase.id);
    if (primeiraVez) estado.concluidas.push(fase.id);
    const paginasNovas = primeiraVez && !APRESENTACAO && fase.man ? fase.man.length : 0;
    let recuperou = false;
    if (licao.semErros && estado.estabilidade < ESTABILIDADE_MAX) { estado.estabilidade++; recuperou = true; }
    salvar();

    const respondidas = licao.acertos + licao.erros;
    const precisao = respondidas ? Math.round((licao.acertos / respondidas) * 100) : 100;
    const ultima = licao.indice === fasesAtuais().length - 1;

    app.innerHTML = `
      ${hud()}
      <main class="resultado">
        ${mascote(ultima || fase.chefe ? "vitoria" : "acerto", "res-mascote")}
        <p class="res-log">[  OK  ] ${fase.etapa || "etapa"} carregada</p>
        <h1>${ultima ? "Trilha concluída!" : "Etapa concluída!"}</h1>
        <p>${fase.titulo} — ${fase.descricao}</p>
        <div class="cards">
          <div class="card ciclos"><small>CICLOS</small><b>+${licao.ciclos}</b></div>
          <div class="card prec"><small>PRECISÃO</small><b>${precisao}%</b></div>
          <div class="card up"><small>MAIOR UPTIME</small><b>⏱ ${licao.maiorUptime}</b></div>
        </div>
        ${recuperou ? '<p class="extra">Etapa sem erros: estabilidade +20%</p>' : ""}
        ${paginasNovas ? `<p class="man-novas">📖 ${paginasNovas} página${paginasNovas > 1 ? "s" : ""} nova${paginasNovas > 1 ? "s" : ""} no manual <button class="link-inline" id="ver-man">abrir o man</button></p>` : ""}
        <button class="btn" id="voltar">Voltar à trilha</button>
      </main>`;
    ligarHud();
    if (paginasNovas) $("#ver-man").addEventListener("click", renderMan);
    $("#voltar").addEventListener("click", renderMapa);
    $("#voltar").focus();
  }

  // =========================================================
  // Laboratório — treino livre (exercícios gerados) e roteiros
  // O conteúdo fica em js/laboratorio.js; erros aqui não custam estabilidade
  // e não liberam etapas.
  // =========================================================
  function registroLab() {
    if (!estado.lab) estado.lab = { treinos: {}, roteiros: [] };
    return estado.lab;
  }

  function renderLab() {
    licao = null;
    topo();
    const reg = registroLab();
    const cartaoTreino = (t) => {
      const melhor = reg.treinos[t.id];
      return `
        <button class="lab-cartao" data-treino="${t.id}">
          <span class="lab-ico" aria-hidden="true">${t.icone}</span>
          <span class="lab-txt">
            <b>${t.titulo}</b>
            <small>${t.descricao}</small>
            <span class="lab-meta">${t.trilha ? "Trilha " + t.trilha + " · " : ""}${t.quantidade} exercícios${melhor !== undefined ? ` · melhor: ${melhor}%` : ""}</span>
          </span>
        </button>`;
    };
    const cartaoRoteiro = (r) => {
      const feito = reg.roteiros.includes(r.id);
      return `
        <button class="lab-cartao roteiro ${feito ? "feito" : ""}" data-roteiro="${r.id}">
          <span class="lab-ico" aria-hidden="true">${feito ? "✓" : r.icone}</span>
          <span class="lab-txt">
            <b>${r.titulo}</b>
            <small>${r.descricao}</small>
            <span class="lab-meta">Trilha ${r.trilha} · ${r.passos.length} passos no terminal${feito ? " · concluído" : ""}</span>
          </span>
        </button>`;
    };

    app.innerHTML = `
      ${hud()}
      <main class="lab-tela">
        <section class="unidade">
          <div>
            <button class="trocar" id="trocar-trilha">◂ trilhas</button>
            <small>$ boot --laboratorio</small>
            <h1>Laboratório</h1>
            <p>Treine à vontade: aqui os erros não custam estabilidade nem travam etapas.</p>
          </div>
          ${mascote("dica", "un-mascote")}
        </section>
        <h2 class="lab-sec">🎲 Treino livre <small>os números mudam a cada rodada</small></h2>
        <div class="lab-grade">${LABORATORIO.treinos.map(cartaoTreino).join("")}</div>
        <h2 class="lab-sec">🧪 Roteiros <small>missões em passos, num terminal que lembra o que você fez</small></h2>
        <div class="lab-grade">${LABORATORIO.roteiros.map(cartaoRoteiro).join("")}</div>
      </main>`;
    ligarHud();
    $("#trocar-trilha").addEventListener("click", renderGrub);
    app.querySelectorAll("[data-treino]").forEach(b => b.addEventListener("click", () => iniciarLab({ treino: b.dataset.treino })));
    app.querySelectorAll("[data-roteiro]").forEach(b => b.addEventListener("click", () => iniciarLab({ roteiro: b.dataset.roteiro })));
  }

  function iniciarLab(origem) {
    const fase = origem.treino ? LABORATORIO.faseTreino(origem.treino) : LABORATORIO.faseRoteiro(origem.roteiro);
    licao = {
      lab: origem,
      indice: -1,
      fase,
      fila: fase.desafios.map((_, k) => k),
      total: fase.desafios.length,
      feitos: 0, acertos: 0, erros: 0, ciclos: 0, maiorUptime: 0,
      semErros: true,
      atual: null
    };
    renderDesafio();
  }

  function concluirLab() {
    topo();
    const origem = licao.lab;
    const reg = registroLab();
    const respondidas = licao.acertos + licao.erros;
    const precisao = respondidas ? Math.round((licao.acertos / respondidas) * 100) : 100;
    if (origem.treino) reg.treinos[origem.treino] = Math.max(reg.treinos[origem.treino] || 0, precisao);
    if (origem.roteiro && !reg.roteiros.includes(origem.roteiro)) reg.roteiros.push(origem.roteiro);
    salvar();

    app.innerHTML = `
      ${hud()}
      <main class="resultado">
        ${mascote(precisao === 100 ? "vitoria" : "acerto", "res-mascote")}
        <p class="res-log">[  OK  ] laboratório: ${esc(licao.fase.titulo.toLowerCase())}</p>
        <h1>${origem.roteiro ? "Roteiro concluído!" : "Treino concluído!"}</h1>
        <p>${licao.fase.descricao}</p>
        <div class="cards">
          <div class="card ciclos"><small>CICLOS</small><b>+${licao.ciclos}</b></div>
          <div class="card prec"><small>PRECISÃO</small><b>${precisao}%</b></div>
          <div class="card up"><small>MAIOR UPTIME</small><b>⏱ ${licao.maiorUptime}</b></div>
        </div>
        <div class="res-botoes">
          <button class="btn sec" id="de-novo">${origem.roteiro ? "Refazer o roteiro" : "Treinar de novo (números novos)"}</button>
          <button class="btn" id="voltar">Voltar ao laboratório</button>
        </div>
      </main>`;
    ligarHud();
    $("#de-novo").addEventListener("click", () => iniciarLab(origem));
    $("#voltar").addEventListener("click", renderLab);
    $("#voltar").focus();
  }

  // ---------- Roteiro: passos num terminal com estado (js/shell.js) ----------
  function montarRoteiro(d) {
    const sh = new ShellSimulado();
    let passo = 0;
    const historico = [];
    let posHist = 0;

    $("#desafio").innerHTML = `
      ${cabecalho("ROTEIRO")}
      <h2>${d.pergunta}</h2>
      <div class="rot-grade">
        <div class="rot-esq">
          <div class="missao" id="missao"></div>
          <div class="term">
            <div class="janela-topo"><i></i><i></i><i></i><span>bash — Linux (laboratório)</span></div>
            <div class="term-corpo" id="tcorpo">
              <pre class="term-saida" id="tsaida"></pre>
              <label class="term-linha">
                <span class="term-prompt" id="tprompt"></span>
                <input id="tin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                       aria-label="Digite o comando e aperte Enter">
              </label>
            </div>
          </div>
          <p class="term-ajuda">Os comandos mudam o sistema de verdade (só aqui dentro). Digite <code>help</code> para ver o que dá para usar.</p>
        </div>
        <aside class="rot-lista"><h4>Roteiro</h4><ol id="rot-passos"></ol></aside>
      </div>`;
    $("#rodape").className = "rodape";
    $("#rodape").innerHTML = `<button class="btn sec" id="btn-dica-passo">💡 Dica do passo</button><span class="rot-cont" id="rot-cont"></span>`;

    const saida = $("#tsaida");
    const entrada = $("#tin");
    const imprimir = (texto, classe) => {
      const bloco = document.createElement("span");
      if (classe) bloco.className = classe;
      bloco.textContent = texto + "\n";
      saida.appendChild(bloco);
      $("#tcorpo").scrollTop = $("#tcorpo").scrollHeight;
    };

    function desenhar() {
      const total = d.passos.length;
      $("#tprompt").textContent = sh.prompt();
      $("#rot-passos").innerHTML = d.passos.map((p, k) =>
        `<li class="${k < passo ? "feito" : k === passo ? "atual" : ""}">${p.texto}</li>`).join("");
      $("#rot-cont").textContent = `${Math.min(passo, total)}/${total} passos`;
      $("#missao").innerHTML = passo < total
        ? `<small>PASSO ${passo + 1} DE ${total}</small><p>${d.passos[passo].texto}</p>`
        : `<small>ROTEIRO COMPLETO</small><p>Todos os passos cumpridos. 🎉</p>`;
      const atual = $("#rot-passos .atual");
      if (atual && window.innerWidth > 860) atual.scrollIntoView({ block: "nearest" });
    }

    function executar(bruto) {
      if (licao.atual.respondido) return;
      const linha = bruto.trim().replace(/\s+/g, " ");
      imprimir(`${sh.prompt()} ${linha}`, "term-eco");
      if (!linha) return;
      historico.push(linha);
      posHist = historico.length;
      const r = sh.executar(linha);
      if (r.limpar) saida.textContent = "";
      else if (r.saida) imprimir(r.saida, r.nota ? "term-nota" : r.erro ? "term-erro" : "");

      const p = d.passos[passo];
      if (p.ok(sh, r.ev)) {
        imprimir(`# ✓ Passo ${passo + 1}: ${p.nota}`, "term-ok");
        passo++;
        if (passo >= d.passos.length) {
          desenhar();
          entrada.disabled = true;
          avaliar(true, { concluido: true });
          return;
        }
      } else if (p.precisa && !p.precisa(sh)) {
        imprimir("# " + p.semPre, "term-nota");
      }
      desenhar();
    }

    $("#btn-dica-passo").addEventListener("click", () => {
      if (passo < d.passos.length) imprimir(`# Dica: ${d.passos[passo].dica}`, "term-nota");
      entrada.focus();
    });
    entrada.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        executar(entrada.value);
        entrada.value = "";
      } else if (e.key === "ArrowUp" && historico.length) {
        e.preventDefault();
        posHist = Math.max(0, posHist - 1);
        entrada.value = historico[posHist];
      } else if (e.key === "ArrowDown" && historico.length) {
        e.preventDefault();
        posHist = Math.min(historico.length, posHist + 1);
        entrada.value = historico[posHist] || "";
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        saida.textContent = "";
      }
    });
    $("#tcorpo").addEventListener("click", () => entrada.focus());
    imprimir("# Laboratório pronto. Siga os passos; a dica não custa nada.", "term-nota");
    desenhar();
    entrada.focus();
  }

  function renderPanico() {
    licao = null;
    topo();
    app.innerHTML = `
      <main class="panico">
        ${mascote("panico", "pan-mascote")}
        <pre class="pan-log">Kernel panic - not syncing: estabilidade do sistema em 0%
CPU: 0 PID: 1 Comm: kernelplay
Call Trace:
  responder_sem_ler_a_dica+0x2a/0x40
  chutar_estado_do_processo+0x13/0x1f
---[ end Kernel panic ]---</pre>
        <h1>Kernel panic!</h1>
        <p>Calma, acontece até com o Linux. Revise as explicações e reinicie o sistema.</p>
        <button class="btn" id="reboot">Reiniciar sistema (reboot)</button>
      </main>`;
    $("#reboot").addEventListener("click", () => {
      estado.estabilidade = ESTABILIDADE_MAX;
      estado.uptime = 0;
      salvar();
      renderMapa();
    });
    $("#reboot").focus();
  }

  // =========================================================
  // Tela "man" — manual com os conceitos e comandos já vistos
  // As páginas de cada etapa (campo "man" em fases.js) são liberadas
  // quando a etapa é concluída (no modo apresentação, todas).
  // =========================================================
  const semAcento = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const nomePagina = (m) => `${m.termo}(${m.secao})`;
  const idPagina = (nome) => "man-" + semAcento(nome).replace(/[^a-z0-9]+/g, "-");
  const manLiberada = (fase) => APRESENTACAO || estado.concluidas.includes(fase.id);

  function paginaMan(m, vistos) {
    // O mesmo termo pode aparecer em mais de uma trilha: só a primeira página recebe o id
    const id = idPagina(nomePagina(m));
    const idAttr = vistos.has(id) ? "" : `id="${id}"`;
    vistos.add(id);
    const busca = semAcento([m.termo, m.secao, m.resumo, m.detalhe || "", m.exemplo || ""].join(" "));
    return `
      <article class="man-pag" ${idAttr} data-busca="${esc(busca)}">
        <h3>${esc(m.termo)}<span>(${esc(m.secao)})</span></h3>
        <p class="man-resumo"><b>${esc(m.termo)}</b> — ${esc(m.resumo)}</p>
        ${m.detalhe ? `<p class="man-det">${esc(m.detalhe)}</p>` : ""}
        ${m.exemplo ? `<pre class="man-ex">${esc(m.exemplo)}</pre>` : ""}
        ${m.veja && m.veja.length ? `<p class="man-veja">VEJA TAMBÉM: ${m.veja.map(v => `<a href="#" data-veja="${esc(v)}">${esc(v)}</a>`).join(", ")}</p>` : ""}
      </article>`;
  }

  function renderMan() {
    licao = null;
    topo();
    let total = 0, abertas = 0;
    const vistos = new Set();
    const comMan = TRILHAS.map((t, ti) => ({ t, ti })).filter(x => x.t.fases.some(f => f.man && f.man.length));
    // Abre na aba da trilha atual (ou na primeira que tiver páginas)
    const abaInicial = comMan.some(x => x.ti === trilhaIdx) ? trilhaIdx : (comMan[0] ? comMan[0].ti : 0);

    const paineis = comMan.map(({ t, ti }) => {
      let abertasT = 0, totalT = 0;
      const liberadas = t.fases.filter(f => f.man && f.man.length && manLiberada(f));
      // Etapa que já vem aberta: a primeira na apresentação; senão, a última liberada
      const abrirId = liberadas.length ? (APRESENTACAO ? liberadas[0].id : liberadas[liberadas.length - 1].id) : null;
      const blocos = t.fases.map((f, i) => {
        if (!f.man || !f.man.length) return "";
        const n = f.man.length;
        totalT += n;
        const rotulo = `<span>${f.etapa || "ETAPA " + (i + 1)}</span> ${f.titulo}`;
        const qtd = `${n} página${n > 1 ? "s" : ""}`;
        if (!manLiberada(f)) {
          return `<section class="man-grupo bloq"><h2>${rotulo} <small>🔒 ${qtd}</small></h2>
            <p class="man-bloq">Conclua a etapa ${f.etapa || i + 1} da Trilha ${t.numero} para liberar.</p></section>`;
        }
        abertasT += n;
        const indice = f.man.map(m => `<a href="#" data-veja="${esc(nomePagina(m))}">${esc(nomePagina(m))}</a>`).join(" · ");
        return `<details class="man-grupo" ${f.id === abrirId ? "open" : ""}>
            <summary><h2>${rotulo} <small>${qtd}</small></h2></summary>
            <p class="man-indice">${indice}</p>
            ${f.man.map(m => paginaMan(m, vistos)).join("")}
          </details>`;
      }).join("");
      total += totalT; abertas += abertasT;
      return { ti, t, abertasT, totalT,
        html: `<div class="man-trilha" data-t="${ti}" role="tabpanel" ${ti === abaInicial ? "" : "hidden"}>
          <h1 class="man-trilha-tit">TRILHA ${t.numero} — ${t.titulo.toUpperCase()}</h1>${blocos}</div>` };
    });

    const abas = paineis.map(p => `
      <button class="man-aba ${p.ti === abaInicial ? "ativa" : ""}" role="tab" data-aba="${p.ti}" aria-selected="${p.ti === abaInicial}">
        Trilha ${p.t.numero}<small>${p.abertasT}/${p.totalT}</small>
      </button>`).join("");

    app.innerHTML = `
      ${hud()}
      <main class="man">
        <div class="man-cab"><span>KERNELPLAY(7)</span><span>Manual do KernelPlay</span><span>KERNELPLAY(7)</span></div>
        <h1>NOME</h1>
        <p class="man-recuo">kernelplay — conceitos e comandos que você já desbloqueou na trilha</p>
        <h1>SINOPSE</h1>
        <label class="man-busca man-recuo">
          <span>$ man -k</span>
          <input id="man-busca" type="search" placeholder="palavra-chave em todas as trilhas (ex.: zumbi, fork, i-node)" autocomplete="off" spellcheck="false">
        </label>
        <p class="man-recuo man-cont">${abertas} de ${total} páginas liberadas ·
          seções: <b>(1)</b> comandos · <b>(2)</b> chamadas de sistema · <b>(3)</b> biblioteca · <b>(7)</b> conceitos ·
          <b>(8)</b> administração · <b>(kernel)</b> funções do kernel do xv6 · <b>(xv6)</b> recursos do xv6</p>
        <nav class="man-abas" role="tablist" aria-label="Trilhas do manual">${abas}</nav>
        <div id="man-grupos">${paineis.map(p => p.html).join("")}</div>
        <p class="man-vazio man-recuo" id="man-vazio" hidden>Nenhuma página encontrada para essa palavra.</p>
        <div class="man-rodape">
          <span>Manual page kernelplay(7) · aperte <kbd>q</kbd> para sair</span>
          <button class="btn" id="man-sair">Voltar à trilha</button>
        </div>
      </main>`;
    ligarHud();

    let aba = abaInicial;
    const mostrarAba = (ti) => {
      aba = ti;
      app.querySelectorAll(".man-aba").forEach(b => {
        const sel = Number(b.dataset.aba) === ti;
        b.classList.toggle("ativa", sel);
        b.setAttribute("aria-selected", sel);
      });
      app.querySelectorAll(".man-trilha").forEach(p => (p.hidden = Number(p.dataset.t) !== ti));
    };
    app.querySelectorAll(".man-aba").forEach(b => b.addEventListener("click", () => {
      if (busca.value) { busca.value = ""; aplicarBusca(); }
      mostrarAba(Number(b.dataset.aba));
    }));

    // Busca: procura em todas as trilhas; os grupos com resultado abrem e, ao limpar, voltam como estavam
    const busca = $("#man-busca");
    const aplicarBusca = () => {
      const q = semAcento(busca.value.trim());
      const main = $(".man");
      const entrando = !!q && !main.classList.contains("buscando");
      const saindo = !q && main.classList.contains("buscando");
      main.classList.toggle("buscando", !!q);
      let achou = 0;
      app.querySelectorAll(".man-grupo").forEach(g => {
        if (entrando && g.tagName === "DETAILS") g.dataset.estava = g.open ? "1" : "";
        if (g.classList.contains("bloq")) { g.hidden = !!q; return; }
        let noGrupo = 0;
        g.querySelectorAll(".man-pag").forEach(p => {
          const ok = !q || p.dataset.busca.includes(q);
          p.hidden = !ok;
          if (ok) noGrupo++;
        });
        g.hidden = noGrupo === 0;
        if (q) g.open = noGrupo > 0;
        if (saindo) g.open = g.dataset.estava === "1";
        achou += noGrupo;
      });
      app.querySelectorAll(".man-trilha").forEach(tr => {
        tr.hidden = q
          ? !Array.from(tr.querySelectorAll(".man-grupo")).some(g => !g.hidden)
          : Number(tr.dataset.t) !== aba;
      });
      $("#man-vazio").hidden = !q || achou > 0;
    };
    busca.addEventListener("input", aplicarBusca);
    busca.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { busca.value = ""; aplicarBusca(); busca.blur(); }
    });

    // "Veja também" e o índice: troca de aba, abre a etapa e rola até a página
    app.querySelectorAll("[data-veja]").forEach(a => a.addEventListener("click", (e) => {
      e.preventDefault();
      const alvo = document.getElementById(idPagina(a.dataset.veja));
      if (!alvo) {
        a.classList.add("bloqueada");
        a.title = "Página ainda bloqueada: conclua a etapa correspondente.";
        return;
      }
      if (busca.value) { busca.value = ""; aplicarBusca(); }
      mostrarAba(Number(alvo.closest(".man-trilha").dataset.t));
      alvo.closest("details").open = true;
      alvo.scrollIntoView({ behavior: "smooth", block: "center" });
      alvo.classList.remove("piscar");
      void alvo.offsetWidth;
      alvo.classList.add("piscar");
    }));

    $("#man-sair").addEventListener("click", renderMapa);
  }

  // "q" sai do manual (como no man de verdade), exceto enquanto digita na busca
  document.addEventListener("keydown", (e) => {
    if (!$(".man") || e.target.id === "man-busca") return;
    if (e.key === "q" || e.key === "Q") renderMapa();
  });

  // =========================================================
  // Teclado: Enter confirma/continua, 1–9 escolhem a opção
  // =========================================================
  document.addEventListener("keydown", (e) => {
    if (!licao) return;
    if (e.key === "Enter") {
      const alvo = $("#continuar") || $("#btn-verificar");
      if (alvo && !alvo.disabled && document.activeElement !== alvo) { e.preventDefault(); alvo.click(); }
    } else if (/^[1-9]$/.test(e.key)) {
      const op = app.querySelectorAll(".opcao")[Number(e.key) - 1];
      if (op && !op.disabled) op.click();
    }
  });

  renderAbertura();
})();
