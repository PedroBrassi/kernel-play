/* =========================================================
   KernelPlay — simulador.js
   Máquina de estados dos processos (inspirada no xv6).
   Internamente usa os estados do xv6 (RUNNING, READY = RUNNABLE,
   SLEEPING, ZOMBIE, UNUSED); na tela aparecem os nomes usados em aula
   (Executando, Pronto, Bloqueado, Zumbi), com o nome do xv6 ao lado.
   Cada ação devolve { ok, msg } — ok=false significa ação inválida.
   ========================================================= */

// Nome usado em aula (Maziero / slides)
const ROTULO_ESTADO = {
  RUNNING: "Executando",
  READY: "Pronto",
  SLEEPING: "Bloqueado",
  ZOMBIE: "Zumbi",
  UNUSED: "Finalizado"
};

// Nome do mesmo estado no código do xv6 (kernel/proc.h)
const XV6_ESTADO = {
  RUNNING: "RUNNING",
  READY: "RUNNABLE",
  SLEEPING: "SLEEPING",
  ZOMBIE: "ZOMBIE",
  UNUSED: "UNUSED"
};

const ACOES = {
  io:        { rotulo: "I/O",          desc: "pedir leitura do disco" },
  yield:     { rotulo: "yield()",      desc: "devolver a CPU" },
  exit:      { rotulo: "exit()",       desc: "terminar o processo" },
  fork:      { rotulo: "fork()",       desc: "criar um filho" },
  escalonar: { rotulo: "Escalonar",    desc: "dar a CPU ao processo" },
  fimIO:     { rotulo: "Fim da E/S",   desc: "o disco terminou" },
  wait:      { rotulo: "wait()",       desc: "esperar/coletar um filho" }
};

// Nomes das transições nas mensagens: "Executando → Bloqueado"
const nomeEstado = (e) => ROTULO_ESTADO[e] || e;
const transicao = (de, para) => `${nomeEstado(de)} → ${nomeEstado(para)}`;

class Simulador {
  constructor(processos) {
    // Cópia para não alterar os dados originais da fase
    this.procs = processos.map(p => ({
      nome: p.nome,
      estado: p.estado,
      pai: p.pai || null,
      motivo: p.estado === "SLEEPING" ? (p.motivo || "io") : null
    }));
    const numeros = this.procs.map(p => parseInt(p.nome.replace(/\D/g, ""), 10) || 0);
    this.proximoId = Math.max(0, ...numeros) + 1;
  }

  get(nome) {
    return this.procs.find(p => p.nome === nome);
  }

  vivos() {
    return this.procs.filter(p => p.estado !== "UNUSED");
  }

  executando() {
    return this.procs.find(p => p.estado === "RUNNING");
  }

  estadoDe(nome) {
    const p = this.get(nome);
    return p ? p.estado : "UNUSED";
  }

  objetivoCumprido(objetivo) {
    return objetivo.every(o => this.estadoDe(o.processo) === o.estado);
  }

  // Erro padrão quando a ação exige um estado específico
  exigir(p, estado, acao) {
    if (p.estado === estado) return null;
    return {
      ok: false,
      msg: `${p.nome} está ${nomeEstado(p.estado)}: ${ACOES[acao].rotulo} só vale para um processo ${nomeEstado(estado)}.`
    };
  }

  aplicar(acao, nome) {
    const p = this.get(nome);
    if (!p || p.estado === "UNUSED") {
      return { ok: false, msg: "Selecione um processo antes de escolher a ação." };
    }
    let r;

    switch (acao) {
      case "io":
        if ((r = this.exigir(p, "RUNNING", acao))) return r;
        p.estado = "SLEEPING";
        p.motivo = "io";
        return { ok: true, msg: `${p.nome}: ${transicao("RUNNING", "SLEEPING")}. Pediu E/S ao disco e deixou de disputar a CPU.` };

      case "yield":
        if ((r = this.exigir(p, "RUNNING", acao))) return r;
        p.estado = "READY";
        return { ok: true, msg: `${p.nome}: ${transicao("RUNNING", "READY")}. Devolveu a CPU, mas continua pronto para executar.` };

      case "exit": {
        if ((r = this.exigir(p, "RUNNING", acao))) return r;
        p.estado = "ZOMBIE";
        // Filhos órfãos passam para o init (como no xv6)
        this.procs.forEach(f => { if (f.pai === p.nome) f.pai = "init"; });
        let msg = `${p.nome}: ${transicao("RUNNING", "ZOMBIE")}. Terminou, mas guarda o status de saída até o pai chamar wait().`;
        const pai = this.get(p.pai);
        if (pai && pai.estado === "SLEEPING" && pai.motivo === "wait") {
          pai.estado = "READY";
          pai.motivo = "coletar";
          msg += ` ${pai.nome}, que estava bloqueado em wait(), foi acordado: ${transicao("SLEEPING", "READY")}.`;
        }
        return { ok: true, msg };
      }

      case "fork": {
        if ((r = this.exigir(p, "RUNNING", acao))) return r;
        if (this.vivos().length >= 6) {
          return { ok: false, msg: "A tabela de processos desta simulação está cheia (máx. 6)." };
        }
        const filho = { nome: "P" + this.proximoId++, estado: "READY", pai: p.nome, motivo: null };
        this.procs.push(filho);
        return { ok: true, msg: `fork(): ${p.nome} criou ${filho.nome}, que entra como Pronto. O pai continua Executando.` };
      }

      case "escalonar": {
        if ((r = this.exigir(p, "READY", acao))) return r;
        const atual = this.executando();
        if (atual) {
          return {
            ok: false,
            msg: `Só existe uma CPU e ${atual.nome} está Executando. Ele precisa sair da CPU antes (yield, I/O ou exit).`
          };
        }
        p.estado = "RUNNING";
        let msg = `Escalonador (despacho): ${p.nome} ${transicao("READY", "RUNNING")}.`;
        if (p.motivo === "coletar") {
          // Volta de dentro do wait(): coleta o filho zumbi
          const zumbi = this.procs.find(f => f.pai === p.nome && f.estado === "ZOMBIE");
          if (zumbi) {
            zumbi.estado = "UNUSED";
            msg += ` O wait() retorna e coleta ${zumbi.nome}, que é removido da tabela de processos.`;
          }
        }
        p.motivo = null;
        return { ok: true, msg };
      }

      case "fimIO":
        if ((r = this.exigir(p, "SLEEPING", acao))) return r;
        if (p.motivo !== "io") {
          return { ok: false, msg: `${p.nome} não espera E/S: está bloqueado em wait(), esperando um filho terminar.` };
        }
        p.estado = "READY";
        p.motivo = null;
        return { ok: true, msg: `${p.nome}: ${transicao("SLEEPING", "READY")}. A E/S terminou; agora espera o escalonador.` };

      case "wait": {
        if ((r = this.exigir(p, "RUNNING", acao))) return r;
        const filhos = this.procs.filter(f => f.pai === p.nome && f.estado !== "UNUSED");
        if (filhos.length === 0) {
          return { ok: false, msg: `${p.nome} não tem filhos: wait() retorna -1 imediatamente.` };
        }
        const zumbi = filhos.find(f => f.estado === "ZOMBIE");
        if (zumbi) {
          zumbi.estado = "UNUSED";
          return { ok: true, msg: `wait(): ${p.nome} coletou o filho zumbi ${zumbi.nome}, que é removido da tabela de processos.` };
        }
        p.estado = "SLEEPING";
        p.motivo = "wait";
        return { ok: true, msg: `${p.nome}: ${transicao("RUNNING", "SLEEPING")}. Nenhum filho terminou ainda; fica bloqueado em wait() até um filho chamar exit().` };
      }

      default:
        return { ok: false, msg: "Ação desconhecida." };
    }
  }
}
