/* =========================================================
   KernelPlay — laboratorio.js
   Modo Laboratório: treino sem perder estabilidade.

   1) TREINO LIVRE: geradores que criam exercícios novos a cada rodada
      (os números mudam, então não dá para decorar a resposta).
      Cada gerador devolve um desafio dos tipos já existentes
      ("multipla" ou "substituicao"); o motor é o mesmo das trilhas.

   2) ROTEIROS: missões com vários passos num terminal com estado
      (js/shell.js). Cada passo tem { texto, dica, ok(sh, ev), nota }:
        ok   devolve true quando o passo foi cumprido
             sh = o shell simulado (arquivos e processos)
             ev = o último comando { nome, args, opcoes, linha, ok, pipeline }
        nota explicação mostrada no terminal quando o passo é cumprido
        precisa?/semPre? condição para o passo fazer sentido e o aviso se faltar
   ========================================================= */

const LABORATORIO = (function () {
  "use strict";

  // ---------------------------------------------------------------- utilitários
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  const embaralhar = (l) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const num = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const bytes = (n) => num(n) + " B";

  // Monta as opções de uma múltipla escolha: a certa + distratores únicos, embaralhados
  function opcoes(certa, distratores, reserva) {
    const lista = [certa];
    for (const d of distratores.concat(reserva || [])) {
      if (lista.length >= 4) break;
      if (d !== undefined && d !== null && !lista.includes(d)) lista.push(d);
    }
    const emb = embaralhar(lista);
    return { opcoes: emb, correta: emb.indexOf(certa) };
  }

  // ---------------------------------------------------------------- substituição de páginas
  function contarFaltas(alg, cadeia, q) {
    const mem = [];
    let f = 0;
    const prox = (p, t) => { for (let k = t + 1; k < cadeia.length; k++) if (cadeia[k] === p) return k; return Infinity; };
    cadeia.forEach((p, t) => {
      const i = mem.findIndex(x => x.p === p);
      if (i >= 0) { mem[i].u = t; return; }
      f++;
      if (mem.length < q) { mem.push({ p, e: t, u: t }); return; }
      let v = 0;
      mem.forEach((x, k) => {
        if (alg === "FIFO" && x.e < mem[v].e) v = k;
        if (alg === "LRU" && x.u < mem[v].u) v = k;
        if (alg === "OPT" && prox(x.p, t) > prox(mem[v].p, t)) v = k;
      });
      mem[v] = { p, e: t, u: t };
    });
    return f;
  }

  function gerarPaginas() {
    const quadros = sortear([3, 3, 4]);
    const maxPag = quadros === 3 ? 5 : 6;
    let cadeia;
    // Com alguma localidade (repete páginas recentes) e pelo menos algumas substituições
    do {
      cadeia = [];
      for (let k = 0; k < 12; k++) {
        cadeia.push(k > 1 && Math.random() < 0.35 ? cadeia[k - rnd(1, Math.min(3, k))] : rnd(0, maxPag));
      }
    } while (new Set(cadeia).size <= quadros + 1 || contarFaltas("FIFO", cadeia, quadros) < quadros + 3);
    const alg = sortear(["FIFO", "LRU", "OPT"]);
    const f = { FIFO: contarFaltas("FIFO", cadeia, quadros), LRU: contarFaltas("LRU", cadeia, quadros), OPT: contarFaltas("OPT", cadeia, quadros) };
    const nome = { FIFO: "FIFO", LRU: "LRU", OPT: "ótimo (OPT)" }[alg];
    return {
      tipo: "substituicao",
      pergunta: `Aplique o ${nome} com ${quadros} quadros.`,
      algoritmo: alg,
      cadeia,
      quadros,
      dica: { FIFO: "Olhe o \"entrou em t=\": sai quem entrou primeiro.", LRU: "Olhe o \"último uso\": sai quem foi usado há mais tempo.", OPT: "Olhe o \"próximo uso\": sai quem vai demorar mais (ou nunca mais será usado)." }[alg],
      explicacao: `Nesta cadeia, com ${quadros} quadros: FIFO ${f.FIFO} faltas · LRU ${f.LRU} · ótimo ${f.OPT}. O ótimo é o mínimo possível; ele serve de referência, porque exige conhecer o futuro.`
    };
  }

  // ---------------------------------------------------------------- tradução de endereços
  function gerarEnderecos() {
    const tam = sortear([1024, 2048, 4096]);
    const nPag = 6;
    const quadrosLivres = embaralhar(Array.from({ length: 16 }, (_, k) => k));
    // quadros diferentes do número da página, para o endereço físico nunca coincidir com o lógico
    const tabela = [];
    for (let k = 0; k < nPag; k++) {
      const q = quadrosLivres.find(x => x !== k && !tabela.some(t => t.quadro === x));
      tabela.push({ pag: k, quadro: q, valida: true });
    }
    tabela[rnd(0, nPag - 1)].valida = false;
    const ctx = `Páginas de ${num(tam)} bytes (${tam / 1024} KB)\n\nTabela de páginas do processo\npágina → quadro\n` +
      tabela.map(t => `  ${t.pag}    →  ${t.valida ? t.quadro : "—  (inválida: fora da memória)"}`).join("\n");

    const variante = Math.random() < 0.3 ? "decompor" : "traduzir";
    if (variante === "decompor") {
      const pag = rnd(1, nPag - 1), off = rnd(1, tam - 1), log = pag * tam + off;
      const certa = `página ${pag}, deslocamento ${off}`;
      const o = opcoes(certa, [
        `página ${pag + 1}, deslocamento ${off}`,
        `página ${pag}, deslocamento ${tam - off}`,
        pag > 0 ? `página ${pag - 1}, deslocamento ${off + tam}` : `página ${pag}, deslocamento ${log}`,
        `página ${Math.floor(log / 1000)}, deslocamento ${log % 1000}`,
        `página ${pag + 2}, deslocamento ${off}`,
        `página ${pag}, deslocamento ${log}`
      ]);
      return {
        tipo: "multipla",
        pergunta: `Com páginas de ${num(tam)} bytes, o endereço lógico <b>${log}</b> fica em qual página e em qual deslocamento?`,
        ...o,
        dica: "Página = endereço ÷ tamanho da página (parte inteira); deslocamento = o resto.",
        explicacao: `${log} ÷ ${tam} = ${pag}, com resto ${off}. Logo, página ${pag} e deslocamento ${off}.`
      };
    }

    // traduzir: às vezes cai numa página inválida (falta de página)
    const invalida = tabela.find(t => !t.valida);
    const ent = Math.random() < 0.25 ? invalida : sortear(tabela.filter(t => t.valida));
    const off = rnd(1, tam - 1);
    const log = ent.pag * tam + off;
    const FALTA = "Nenhum: a página está fora da memória, então ocorre uma falta de página";
    if (!ent.valida) {
      const o = opcoes(FALTA, embaralhar(tabela.filter(t => t.valida)).map(t => String(t.quadro * tam + off)).concat([String(log)]));
      return {
        tipo: "multipla",
        pergunta: `A qual endereço físico corresponde o endereço lógico <b>${log}</b>?`,
        contexto: ctx,
        ...o,
        dica: "Descubra primeiro a página do endereço e olhe a linha dela na tabela.",
        explicacao: `${log} ÷ ${tam} = página ${ent.pag}, deslocamento ${off}. A página ${ent.pag} está marcada como inválida: a MMU gera uma falta de página e o núcleo precisa trazê-la do disco antes.`
      };
    }
    const fis = ent.quadro * tam + off;
    const vizinha = tabela.find(t => t.pag === (ent.pag + 1) % nPag);
    const o = opcoes(String(fis), [
      String(ent.quadro * tam),
      String(log),
      vizinha.valida ? String(vizinha.quadro * tam + off) : null,
      String(ent.pag * tam + ent.quadro),
      FALTA,
      String(fis + tam),
      String(ent.quadro * tam + tam - off)
    ]);
    return {
      tipo: "multipla",
      pergunta: `A qual endereço físico corresponde o endereço lógico <b>${log}</b>?`,
      contexto: ctx,
      ...o,
      dica: "Físico = quadro × tamanho da página + deslocamento.",
      explicacao: `${log} ÷ ${tam} = página ${ent.pag}, deslocamento ${off}. A página ${ent.pag} está no quadro ${ent.quadro}: ${ent.quadro} × ${tam} + ${off} = ${fis}.`
    };
  }

  // ---------------------------------------------------------------- permissões
  const rwx = (d) => (d & 4 ? "r" : "-") + (d & 2 ? "w" : "-") + (d & 1 ? "x" : "-");
  const strModo = (m) => "-" + m.map(rwx).join("");
  const octal = (m) => m.join("");
  const ACESSO = { 7: "Ler, escrever e executar", 6: "Ler e escrever", 5: "Ler e executar", 4: "Só ler", 3: "Escrever e executar", 2: "Só escrever", 1: "Só executar", 0: "Nada" };

  function gerarPermissoes() {
    const modo = [sortear([7, 6, 7, 6, 5, 4]), sortear([7, 6, 5, 4, 0, 5]), sortear([5, 4, 0, 0, 4])];
    const mutar = () => {
      const m = modo.slice();
      const i = rnd(0, 2);
      m[i] = sortear([7, 6, 5, 4, 0].filter(x => x !== m[i]));
      return m;
    };
    const trocado = [modo[1], modo[0], modo[2]];
    const v = sortear(["oct", "str", "quem"]);
    if (v === "oct") {
      const o = opcoes(octal(modo), [octal(mutar()), octal(trocado), octal(mutar()), octal(mutar()), octal([modo[0], modo[2], modo[1]])], ["777", "644", "750", "600"]);
      return {
        tipo: "multipla",
        pergunta: `Qual é o modo octal de <code>${strModo(modo)}</code>?`,
        ...o,
        dica: "r = 4, w = 2, x = 1. Some cada grupo de três letras: dono, grupo, outros.",
        explicacao: `${modo.map(d => rwx(d)).join(" · ")} → ${modo.map(d => `${d & 4 ? 4 : 0}+${d & 2 ? 2 : 0}+${d & 1 ? 1 : 0}=${d}`).join(" · ")} → ${octal(modo)}.`
      };
    }
    if (v === "str") {
      const o = opcoes(strModo(modo), [strModo(mutar()), strModo(trocado), strModo(mutar()), strModo(mutar())], ["-rwxrwxrwx", "-rw-r--r--", "-rwxr-x---"]);
      return {
        tipo: "multipla",
        pergunta: `Depois de <code>chmod ${octal(modo)} relatorio.txt</code>, como ficam as permissões?`,
        ...o,
        dica: "Cada dígito vira três letras: 4 = r, 2 = w, 1 = x.",
        explicacao: `${modo.map(d => `${d} = ${rwx(d)}`).join(" · ")}. Dono, grupo e outros, nessa ordem: ${strModo(modo)}.`
      };
    }
    const classe = sortear([{ k: 0, nome: "o dono" }, { k: 1, nome: "um usuário do grupo" }, { k: 2, nome: "um usuário que não é dono nem do grupo" }]);
    const d = modo[classe.k];
    const o = opcoes(ACESSO[d], [ACESSO[modo[(classe.k + 1) % 3]], ACESSO[modo[(classe.k + 2) % 3]], ACESSO[d ^ 2], ACESSO[d ^ 1], ACESSO[d ^ 4]], ["Nada", "Só ler"]);
    return {
      tipo: "multipla",
      pergunta: `O arquivo <code>notas.c</code> tem as permissões <code>${strModo(modo)}</code>. O que ${classe.nome} pode fazer com ele?`,
      ...o,
      dica: "Separe em três blocos de três letras: dono · grupo · outros.",
      explicacao: `${rwx(modo[0])} (dono) · ${rwx(modo[1])} (grupo) · ${rwx(modo[2])} (outros). Para ${classe.nome}, vale ${rwx(d)}: ${ACESSO[d].toLowerCase()}.`
    };
  }

  // ---------------------------------------------------------------- blocos e i-nodes
  // Faixas exatas para i-nodes do Ext2/3 (12 diretos, 1 indireto, 1 duplo, 1 triplo; ponteiros de 4 B)
  const FAIXAS_INODE = {
    4096: { limites: "diretos: até 48 KB · + indireto: até 48 KB + 4 MB · + duplo: até ≈ 4 GB · + triplo: até ≈ 4 TB",
            ex: [["20 KB", "40 KB", "8 KB"], ["100 KB", "1 MB", "3 MB"], ["10 MB", "500 MB", "2 GB"], ["5 GB", "100 GB", "1 TB"]] },
    1024: { limites: "diretos: até 12 KB · + indireto: até 12 KB + 256 KB · + duplo: até ≈ 64 MB · + triplo: até ≈ 16 GB",
            ex: [["5 KB", "10 KB", "12 KB"], ["50 KB", "100 KB", "200 KB"], ["1 MB", "10 MB", "50 MB"], ["100 MB", "1 GB", "10 GB"]] }
  };
  const NIVEIS = ["Só os 12 diretos", "Diretos e o indireto simples", "Até o duplo indireto", "Até o triplo indireto"];

  function gerarBlocos() {
    if (Math.random() < 0.5) {
      const B = sortear([1024, 2048, 4096]);
      let t;
      do { t = rnd(100, 4 * B); } while (t % B === 0);
      const n = Math.ceil(t / B), d = n * B - t;
      const fmt = (blocos, desp) => `${blocos} bloco${blocos > 1 ? "s" : ""} · ${bytes(desp)} desperdiçados`;
      const o = opcoes(fmt(n, d), [fmt(n, t % B), fmt(n + 1, d + B), n > 1 ? fmt(n - 1, 0) : fmt(1, B - d), fmt(n, n * B)]);
      return {
        tipo: "multipla",
        pergunta: `Um arquivo de <b>${bytes(t)}</b> é gravado num sistema com blocos de <b>${bytes(B)}</b>. Quantos blocos ele ocupa e quanto espaço sobra sem uso no último bloco?`,
        ...o,
        dica: "O bloco é a unidade mínima de alocação: o último bloco é ocupado inteiro, mesmo pela metade.",
        explicacao: `${num(t)} ÷ ${num(B)} = ${num(t / B)} → ${n} bloco${n > 1 ? "s" : ""} (${bytes(n * B)}). Fragmentação interna: ${num(n * B)} − ${num(t)} = ${bytes(d)}.`
      };
    }
    const B = sortear([4096, 4096, 1024]);
    const nivel = rnd(0, 3);
    const tam = sortear(FAIXAS_INODE[B].ex[nivel]);
    return {
      tipo: "multipla",
      pergunta: `No Ext2/3, com blocos de <b>${B / 1024} KB</b>, um arquivo de <b>${tam}</b> precisa de quais ponteiros do i-node?`,
      opcoes: NIVEIS.slice(),
      correta: nivel,
      dica: `Ponteiros de 4 B: cada bloco de índice guarda ${B / 4} ponteiros.`,
      explicacao: `Com blocos de ${B / 1024} KB: ${FAIXAS_INODE[B].limites}. Um arquivo de ${tam} cai na faixa "${NIVEIS[nivel].toLowerCase()}".`
    };
  }

  // ---------------------------------------------------------------- caminhos
  const PASTAS = ["so", "aulas", "aula1", "aula2", "projetos", "lab", "src", "2026", "trabalhos", "docs", "fotos", "notas"];
  const ARQS = ["proj1.pdf", "main.c", "notas.txt", "lista.md", "fork.c", "relatorio.pdf"];

  function gerarCaminhos() {
    const usuario = sortear(["ana", "joao", "maria", "pedro", "lucas"]);
    const fundo = embaralhar(PASTAS).slice(0, rnd(2, 3));
    const cwd = ["home", usuario, ...fundo];
    const junta = (p) => "/" + p.join("/");

    if (Math.random() < 0.65) {
      const sobe = rnd(1, Math.min(3, cwd.length - 1));
      const desce = [sortear(PASTAS.filter(p => !cwd.includes(p))), sortear(ARQS)];
      const rel = "../".repeat(sobe) + desce.join("/");
      const certo = junta([...cwd.slice(0, cwd.length - sobe), ...desce]);
      const o = opcoes(certo, [
        junta([...cwd.slice(0, cwd.length - sobe + 1), ...desce]),
        sobe < cwd.length - 1 ? junta([...cwd.slice(0, cwd.length - sobe - 1), ...desce]) : null,
        junta([...cwd, ...desce]),
        "/" + desce.join("/")
      ]);
      return {
        tipo: "multipla",
        pergunta: `O diretório de trabalho é <code>${junta(cwd)}</code>. A qual caminho absoluto corresponde <code>${rel}</code>?`,
        ...o,
        dica: "Cada .. sobe um nível a partir do diretório de trabalho.",
        explicacao: `Saindo de ${junta(cwd)}, ${sobe} × .. sobe até ${junta(cwd.slice(0, cwd.length - sobe))}; depois entra em ${desce.join("/")}: ${certo}.`
      };
    }
    // caminho canônico
    const alvo = [...cwd, sortear(ARQS)];
    const extra = sortear(PASTAS.filter(p => !alvo.includes(p)));
    const pos = rnd(2, alvo.length - 1);
    const sujo = [...alvo.slice(0, pos), ".", extra, "..", ...alvo.slice(pos)];
    const certo = junta(alvo);
    const o = opcoes(certo, [
      junta([...alvo.slice(0, pos), extra, ...alvo.slice(pos)]),
      junta([...alvo.slice(0, pos - 1), ...alvo.slice(pos)]),
      junta(sujo.filter(x => x !== ".")),
      junta([...alvo.slice(0, pos), extra, ...alvo.slice(pos + 1)])
    ]);
    return {
      tipo: "multipla",
      pergunta: `Qual é o caminho canônico de <code>${junta(sujo)}</code>?`,
      ...o,
      dica: "O canônico é o absoluto mais curto: tire os . e cancele cada .. com o nome anterior.",
      explicacao: `O "." não muda nada, e "${extra}/.." entra e sai do mesmo diretório. Sobra ${certo}.`
    };
  }

  // ---------------------------------------------------------------- escalonamento
  function escalonar(alg, procs, q) {
    const n = procs.length;
    const rest = procs.map(p => p.b), fim = new Array(n);
    const gantt = [];
    const rodar = (i, ini, dur) => {
      const ult = gantt[gantt.length - 1];
      if (ult && ult.p === i && ult.f === ini) ult.f += dur; else gantt.push({ p: i, i: ini, f: ini + dur });
    };
    let t = 0;
    if (alg === "FCFS" || alg === "SJF") {
      const feitos = new Set();
      while (feitos.size < n) {
        const prontos = procs.map((p, i) => i).filter(i => !feitos.has(i) && procs[i].c <= t);
        if (!prontos.length) { t = Math.min(...procs.map((p, i) => feitos.has(i) ? Infinity : p.c)); continue; }
        const i = alg === "FCFS" ? prontos[0] : prontos.reduce((a, b) => (procs[b].b < procs[a].b ? b : a));
        rodar(i, t, procs[i].b);
        t += procs[i].b; fim[i] = t; feitos.add(i);
      }
    } else if (alg === "SRTF") {
      let feitos = 0;
      while (feitos < n) {
        const prontos = procs.map((p, i) => i).filter(i => rest[i] > 0 && procs[i].c <= t);
        if (!prontos.length) { t++; continue; }
        const i = prontos.reduce((a, b) => (rest[b] < rest[a] ? b : a));
        rodar(i, t, 1);
        rest[i]--; t++;
        if (rest[i] === 0) { fim[i] = t; feitos++; }
      }
    } else { // RR: quem chega durante o quantum entra na fila antes de quem foi preemptado
      const fila = [];
      let prox = 0;
      const chegam = (ate) => { while (prox < n && procs[prox].c <= ate) fila.push(prox++); };
      chegam(0);
      let feitos = 0;
      while (feitos < n) {
        if (!fila.length) { t = procs[prox].c; chegam(t); continue; }
        const i = fila.shift();
        const d = Math.min(q, rest[i]);
        rodar(i, t, d);
        t += d; rest[i] -= d;
        chegam(t);
        if (rest[i] > 0) fila.push(i); else { fim[i] = t; feitos++; }
      }
    }
    const esperas = procs.map((p, i) => fim[i] - p.c - p.b);
    return { media: esperas.reduce((s, x) => s + x, 0) / n, esperas, fim, gantt };
  }

  function gerarEscalonamento() {
    const n = 4;
    const q = sortear([2, 3]);
    const algs = ["FCFS", "SJF", "SRTF", "RR"];
    let procs, res;
    // Sorteia cargas até haver espera de verdade e diferença entre os algoritmos
    do {
      const chegadas = [0, ...Array.from({ length: n - 1 }, () => rnd(0, 6))].sort((a, b) => a - b);
      procs = chegadas.map((c, i) => ({ nome: "P" + (i + 1), c, b: rnd(1, 8) }));
      res = {};
      algs.forEach(a => (res[a] = escalonar(a, procs, q)));
    } while (res.FCFS.media < 2 || new Set(algs.map(a => res[a].media)).size < 3);
    const alg = sortear(algs);
    const r = res[alg];
    const nomeAlg = { FCFS: "FCFS", SJF: "SJF (cooperativo)", SRTF: "SRTF (SJF preemptivo)", RR: `Round-Robin com quantum ${q}` }[alg];
    const ctx = "Processo  Chegada  Duração\n" + procs.map(p => `${p.nome.padEnd(10)}${String(p.c).padEnd(9)}${p.b}`).join("\n");
    const outros = algs.filter(a => a !== alg).map(a => num(res[a].media));
    const o = opcoes(num(r.media), [...outros, num(r.media + 1), num(Math.max(0, r.media - 0.5)), num(r.media + 0.75), num(r.media + 2)]);
    const gantt = r.gantt.map(g => `${procs[g.p].nome}[${g.i}–${g.f}]`).join(" ");
    return {
      tipo: "multipla",
      pergunta: `Com o <b>${nomeAlg}</b>, qual é o tempo médio de espera?`,
      contexto: ctx,
      ...o,
      dica: alg === "RR"
        ? "Espera = término − chegada − duração. No RR, quem chega durante um quantum entra na fila antes de quem acabou de ser preemptado."
        : "Espera = término − chegada − duração. Desenhe o diagrama de Gantt antes.",
      explicacao: `Gantt: ${gantt}. Esperas: ${procs.map((p, i) => `${p.nome} = ${r.fim[i]} − ${p.c} − ${p.b} = ${r.esperas[i]}`).join(" · ")}. Média = ${num(r.media)}. (Nesta carga: FCFS ${num(res.FCFS.media)} · SJF ${num(res.SJF.media)} · SRTF ${num(res.SRTF.media)} · RR ${num(res.RR.media)}.)`
    };
  }

  // ---------------------------------------------------------------- lista de treinos
  const treinos = [
    { id: "paginas", titulo: "Substituição de páginas", descricao: "FIFO, LRU e ótimo com cadeias sorteadas", icone: "🔁", trilha: 3, quantidade: 3, gerar: gerarPaginas },
    { id: "enderecos", titulo: "Tradução de endereços", descricao: "Página, deslocamento, quadro e falta de página", icone: "🧭", trilha: 3, quantidade: 5, gerar: gerarEnderecos },
    { id: "escalonamento", titulo: "Escalonamento", descricao: "Tempo médio de espera no FCFS, SJF, SRTF e Round-Robin", icone: "⏱", trilha: 2, quantidade: 4, gerar: gerarEscalonamento },
    { id: "permissoes", titulo: "Permissões", descricao: "rwx, octal e quem pode o quê", icone: "🔐", trilha: 4, quantidade: 5, gerar: gerarPermissoes },
    { id: "blocos", titulo: "Blocos e i-nodes", descricao: "Fragmentação interna e ponteiros do i-node", icone: "🧱", trilha: 4, quantidade: 5, gerar: gerarBlocos },
    { id: "caminhos", titulo: "Caminhos", descricao: "Relativo, absoluto e canônico", icone: "🗂", trilha: 4, quantidade: 5, gerar: gerarCaminhos }
  ];
  treinos.push({
    id: "misto", titulo: "Misturado", descricao: "Um exercício de cada tipo, em ordem aleatória", icone: "🎲", trilha: null, quantidade: treinos.length,
    gerar: null, gerarTodos: () => embaralhar(treinos.filter(t => t.gerar).map(t => t.gerar()))
  });

  // ---------------------------------------------------------------- roteiros
  const SO = (n) => "/home/pedro/so/" + n;
  const temSleep = (sh) => sh.processos("sleep").length > 0;

  const roteiros = [
    {
      id: "arquivos",
      titulo: "Arquivos, links e permissões",
      descricao: "Crie arquivos, faça links físicos e simbólicos, apague o original e mexa nas permissões.",
      icone: "📁",
      trilha: 4,
      explicacao: "Você viu na prática que o nome fica no diretório e o arquivo é o i-node: o link físico é só outro nome para o mesmo i-node, o simbólico guarda um caminho, e as permissões são verificadas na hora de abrir.",
      passos: [
        { texto: "Veja em qual diretório você está.", dica: "pwd (print working directory)",
          ok: (sh, ev) => ev.nome === "pwd",
          nota: "Todo processo tem um diretório de trabalho; o seu shell começa no home: /home/pedro (o ~ do prompt)." },
        { texto: "Crie um diretório chamado <code>so</code>.", dica: "mkdir so",
          ok: (sh) => sh.tipo("/home/pedro/so") === "d",
          nota: "Um diretório é um arquivo especial que guarda uma tabela de nomes → i-nodes." },
        { texto: "Entre no diretório <code>so</code>.", dica: "cd so",
          ok: (sh) => sh.cwd === "/home/pedro/so",
          nota: "Repare no prompt: agora ele mostra ~/so." },
        { texto: "Crie o arquivo <code>hello.c</code> com algum texto dentro, usando <code>echo</code> e o redirecionamento <code>&gt;</code>.",
          dica: "echo \"int main(){}\" > hello.c",
          ok: (sh) => sh.tipo(SO("hello.c")) === "f" && sh.tamanho(sh.no(SO("hello.c"))) > 0,
          nota: "O > manda a saída do echo para o arquivo. Se ele não existe, o shell cria (open com O_CREAT)." },
        { texto: "Mostre os metadados de <code>hello.c</code>, incluindo o número do i-node.", dica: "stat hello.c",
          ok: (sh, ev) => ev.nome === "stat" && ev.ok && ev.args.some(a => sh.ino(a, false) === sh.ino(SO("hello.c"))),
          nota: "Guarde o número do Inode e o Links: 1. Eles vão mudar no próximo passo." },
        { texto: "Crie um link <b>físico</b> chamado <code>fisico.c</code> para <code>hello.c</code>.", dica: "ln hello.c fisico.c",
          ok: (sh) => sh.tipo(SO("fisico.c"), false) === "f" && sh.ino(SO("fisico.c")) === sh.ino(SO("hello.c")),
          nota: "O ln sem opção cria outra entrada de diretório para o MESMO i-node." },
        { texto: "Crie um link <b>simbólico</b> chamado <code>simbolico.c</code> para <code>hello.c</code>.", dica: "ln -s hello.c simbolico.c",
          ok: (sh) => sh.tipo(SO("simbolico.c"), false) === "l" && sh.ino(SO("simbolico.c")) === sh.ino(SO("hello.c")),
          nota: "O link simbólico é um arquivo novo (outro i-node) que só guarda o caminho \"hello.c\"." },
        { texto: "Liste o diretório mostrando os números dos i-nodes e a contagem de links.", dica: "ls -li",
          ok: (sh, ev) => ev.nome === "ls" && ev.opcoes.includes("i") && ev.opcoes.includes("l"),
          nota: "hello.c e fisico.c têm o mesmo i-node e Links 2; simbolico.c tem i-node próprio, tipo l e tamanho 7 (os 7 caracteres de \"hello.c\")." },
        { texto: "Apague <code>hello.c</code>.", dica: "rm hello.c",
          ok: (sh) => !sh.existe(SO("hello.c"), false) && sh.tipo(SO("fisico.c")) === "f",
          nota: "O rm só retirou um nome (unlink). O i-node continua, porque o contador de links caiu de 2 para 1." },
        { texto: "Tente ler <code>simbolico.c</code>.", dica: "cat simbolico.c",
          ok: (sh, ev) => ev.nome === "cat" && ev.args.includes("simbolico.c"),
          nota: "Link quebrado: ele aponta para o caminho \"hello.c\", que não existe mais." },
        { texto: "Agora leia <code>fisico.c</code>.", dica: "cat fisico.c",
          ok: (sh, ev) => ev.nome === "cat" && ev.ok && ev.args.includes("fisico.c"),
          nota: "O conteúdo continua lá: o link físico aponta direto para o i-node." },
        { texto: "Deixe <code>fisico.c</code> com as permissões <code>rwxr-x---</code>.", dica: "chmod 750 fisico.c",
          ok: (sh) => sh.modo(SO("fisico.c")) === 0o750,
          nota: "7 = rwx (dono), 5 = r-x (grupo), 0 = --- (outros)." },
        { texto: "Confira as permissões com a listagem longa.", dica: "ls -l",
          ok: (sh, ev) => ev.nome === "ls" && ev.opcoes.includes("l") && sh.modo(SO("fisico.c")) === 0o750,
          nota: "-rwxr-x--- : o primeiro caractere é o tipo (- arquivo comum, d diretório, l link)." },
        { texto: "Tire de você (o dono) a permissão de leitura de <code>fisico.c</code> e tente ler o arquivo.", dica: "chmod u-r fisico.c e depois cat fisico.c",
          ok: (sh, ev) => ev.nome === "cat" && ev.args.includes("fisico.c") && !ev.ok && (sh.modo(SO("fisico.c")) & 0o400) === 0,
          nota: "Permission denied: o open() verifica as permissões, inclusive as do próprio dono." },
        { texto: "Devolva a permissão de leitura ao dono.", dica: "chmod u+r fisico.c",
          ok: (sh) => sh.tipo(SO("fisico.c")) === "f" && (sh.modo(SO("fisico.c")) & 0o400) !== 0,
          nota: "Só o dono (ou o root) pode mudar as permissões de um arquivo." }
      ]
    },
    {
      id: "processos",
      titulo: "Processos e sinais",
      descricao: "Rode processos em segundo plano, encontre o PID, pause, continue e termine com sinais.",
      icone: "⚙",
      trilha: 2,
      explicacao: "Você controlou o ciclo de vida de processos de verdade: segundo plano com &, PID e PPID, a árvore de processos, os estados S, R e T e os sinais SIGSTOP, SIGCONT, SIGTERM e SIGKILL.",
      passos: [
        { texto: "Liste os processos do seu terminal.", dica: "ps",
          ok: (sh, ev) => ev.nome === "ps",
          nota: "Sem opções, o ps mostra só os processos deste terminal: o bash e o próprio ps." },
        { texto: "Mostre o PID do seu shell usando a variável especial do bash.", dica: "echo $$",
          ok: (sh, ev) => ev.nome === "echo" && ev.linha.includes("$$"),
          nota: "$$ é o PID do shell atual (1201). Ele será o pai dos processos que você criar." },
        { texto: "Rode <code>sleep 1000</code> em segundo plano.", dica: "sleep 1000 &",
          ok: (sh) => sh.processos("sleep").some(p => p.estado !== "T"),
          nota: "O & devolve o terminal na hora. [1] é o número do job e o outro número é o PID do sleep." },
        { texto: "Liste todos os processos do sistema com dono, uso de CPU e estado (coluna STAT).", dica: "ps aux",
          precisa: temSleep, semPre: "O sleep não existe mais. Rode outro: sleep 1000 &",
          ok: (sh, ev) => ev.nome === "ps" && /a/.test(ev.argsBrutos.join("")) && /u/.test(ev.argsBrutos.join("")) && /x/.test(ev.argsBrutos.join("")),
          nota: "STAT: S = dormindo (Bloqueado, esperando o tempo passar), R = executando ou pronto, s = líder de sessão, + = primeiro plano." },
        { texto: "Filtre a lista para mostrar só o <code>sleep</code>.", dica: "ps aux | grep sleep (ou pgrep sleep)",
          precisa: temSleep, semPre: "O sleep não existe mais. Rode outro: sleep 1000 &",
          ok: (sh, ev) => (ev.nome === "ps" && ev.pipeline.some(e => e.nome === "grep" && e.args.includes("sleep"))) || (ev.nome === "pgrep" && ev.args.includes("sleep")),
          nota: "O próprio grep aparece na lista, porque ele também é um processo com \"sleep\" na linha de comando." },
        { texto: "Veja a árvore de processos com os PIDs.", dica: "pstree -p",
          precisa: temSleep, semPre: "O sleep não existe mais. Rode outro: sleep 1000 &",
          ok: (sh, ev) => ev.nome === "pstree" && ev.opcoes.includes("p"),
          nota: "systemd(1) é o ancestral de todos; o sleep é filho do bash, que é filho do sshd." },
        { texto: "Pause (suspenda) o <code>sleep</code> com um sinal.", dica: "kill -STOP PID (ou kill -STOP %1)",
          precisa: temSleep, semPre: "O sleep não existe mais. Rode outro: sleep 1000 &",
          ok: (sh) => sh.processos("sleep").some(p => p.estado === "T"),
          nota: "O SIGSTOP não pode ser ignorado nem tratado: o processo para na hora." },
        { texto: "Confirme o estado <b>T</b> do sleep na lista de processos.", dica: "ps aux | grep sleep",
          precisa: temSleep, semPre: "O sleep não existe mais. Rode outro: sleep 1000 &",
          ok: (sh, ev) => ev.nome === "ps" && /[ul]/.test(ev.argsBrutos.join("")) && sh.processos("sleep").some(p => p.estado === "T"),
          nota: "T = parado (stopped). Ele não usa CPU e não volta sozinho." },
        { texto: "Faça o <code>sleep</code> continuar.", dica: "kill -CONT PID",
          precisa: temSleep, semPre: "O sleep não existe mais. Rode outro: sleep 1000 &",
          ok: (sh) => sh.processos("sleep").some(p => p.estado === "S"),
          nota: "Com o SIGCONT ele volta ao estado S, esperando o tempo do sleep acabar." },
        { texto: "Termine o <code>sleep</code> com o sinal padrão do kill (SIGTERM).", dica: "kill PID",
          ok: (sh) => !temSleep(sh) && sh.ultimoMorto && sh.ultimoMorto.nome === "sleep",
          nota: "Sem número, o kill manda o SIGTERM (15): um pedido educado, que o programa pode tratar para salvar o trabalho antes de sair." },
        { texto: "Rode um processo que gasta CPU sem parar: <code>yes</code> em segundo plano, jogando a saída fora.", dica: "yes > /dev/null &",
          ok: (sh) => sh.processos("yes").length > 0,
          nota: "O /dev/null é um arquivo especial que descarta tudo o que recebe." },
        { texto: "Veja o <code>yes</code> na lista completa: repare no estado e no %CPU.", dica: "ps aux",
          precisa: (sh) => sh.processos("yes").length > 0, semPre: "O yes não existe mais. Rode outro: yes > /dev/null &",
          ok: (sh, ev) => ev.nome === "ps" && /u/.test(ev.argsBrutos.join("")) && sh.processos("yes").length > 0,
          nota: "R e quase 100% de CPU: ele nunca bloqueia, só alterna entre Executando e Pronto." },
        { texto: "Mate o <code>yes</code> com o sinal que não pode ser ignorado.", dica: "kill -9 PID (SIGKILL)",
          ok: (sh) => !sh.processos("yes").length && sh.ultimoMorto && sh.ultimoMorto.nome === "yes" && sh.ultimoMorto.morreuCom === "KILL",
          nota: "O SIGKILL (9) é tratado pelo núcleo: o processo morre sem chance de reagir. Use só quando o SIGTERM não resolver." },
        { texto: "Confirme que só sobraram o bash e o ps no seu terminal.", dica: "ps",
          ok: (sh, ev) => ev.nome === "ps" && !temSleep(sh) && !sh.processos("yes").length,
          nota: "Pronto: nenhum processo seu ficou para trás." }
      ]
    }
  ];

  // Usado pelo motor para montar a "fase" de um treino ou roteiro
  function faseTreino(id) {
    const t = treinos.find(x => x.id === id);
    const desafios = t.gerarTodos ? t.gerarTodos() : Array.from({ length: t.quantidade }, () => t.gerar());
    return { id: "lab-" + t.id, titulo: t.titulo, descricao: t.descricao, etapa: "LAB", desafios };
  }

  function faseRoteiro(id) {
    const r = roteiros.find(x => x.id === id);
    return {
      id: "lab-rot-" + r.id, titulo: r.titulo, descricao: r.descricao, etapa: "LAB",
      desafios: [{ tipo: "roteiro", pergunta: r.titulo, passos: r.passos, explicacao: r.explicacao }]
    };
  }

  return { treinos, roteiros, faseTreino, faseRoteiro, _teste: { contarFaltas, escalonar } };
})();
