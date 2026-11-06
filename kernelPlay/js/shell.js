/* =========================================================
   KernelPlay — shell.js
   Um bash de mentira, com ESTADO, usado nos roteiros do Laboratório.
   Diferente do terminal das trilhas (que só confere um comando), aqui
   os comandos mudam o sistema: arquivos, i-nodes, links, permissões e
   processos continuam existindo de um comando para o outro.

   Uso:  const sh = new ShellSimulado();
         const r = sh.executar("ls -li");   // { saida, erro, limpar, ev }
   ev descreve o que foi executado (nome, args, opcoes, linha, ok, pipeline)
   e é o que os roteiros (js/laboratorio.js) usam para conferir cada passo.
   ========================================================= */

class ShellSimulado {
  constructor() {
    this.usuario = "pedro";
    this.home = "/home/pedro";
    this.cwd = this.home;
    this.inodes = new Map();
    this.proxIno = 2;
    this.raiz = this.novoNo("d", { dono: "root", modo: 0o755 });
    this.raiz.filhos.set(".", this.raiz.ino);
    this.raiz.filhos.set("..", this.raiz.ino);

    // Árvore inicial (bem pequena)
    const dir = (caminho, dono, modo) => this.criarEm(caminho, this.novoNo("d", { dono, modo: modo || 0o755 }));
    ["/bin", "/dev", "/etc", "/home", "/proc", "/tmp", "/usr", "/usr/bin", "/var", "/var/log"].forEach(c => dir(c, "root"));
    this.inodes.get(this.resolver("/tmp").ino).modo = 0o1777;
    this.proxIno = 1204100;
    dir("/home/pedro", "pedro");
    this.criarEm("/etc/hostname", this.novoNo("f", { dono: "root", modo: 0o644, dados: "kernelplay\n" }));
    this.criarEm("/etc/shadow", this.novoNo("f", { dono: "root", modo: 0o640, dados: "root:*:20000:0:99999:7:::\n" }));
    this.criarEm("/dev/null", this.novoNo("c", { dono: "root", modo: 0o666, dev: "1, 3" }));
    this.criarEm("/dev/tty", this.novoNo("c", { dono: "root", modo: 0o666, dev: "5, 0" }));
    ["ls", "cat", "bash", "ps", "sleep", "stat", "ln"].forEach(p =>
      this.criarEm("/usr/bin/" + p, this.novoNo("f", { dono: "root", modo: 0o755, dados: "\x7fELF…", tamanho: 138216 })));
    this.criarEm("/home/pedro/.bashrc", this.novoNo("f", { dono: "pedro", modo: 0o644, dados: "# ~/.bashrc\nalias ll='ls -l'\n" }));
    this.criarEm("/home/pedro/notas.txt", this.novoNo("f", { dono: "pedro", modo: 0o644, dados: "Prova de SO: estudar arquivos e processos.\n" }));
    this.proxIno = 1204270;

    // Processos
    this.procs = new Map();
    const p = (pid, ppid, nome, args, dono, estado, tty) =>
      this.procs.set(pid, { pid, ppid, nome, args: args || "", dono, estado, tty: tty || "?" });
    p(1, 0, "systemd", "/sbin/init", "root", "Ss");
    p(238, 1, "systemd-journal", "/usr/lib/systemd/systemd-journald", "root", "Ss");
    p(612, 1, "cron", "/usr/sbin/cron -f", "root", "Ss");
    p(701, 1, "sshd", "sshd: /usr/sbin/sshd -D", "root", "Ss");
    p(1190, 701, "sshd", "sshd: pedro@pts/0", "pedro", "S");
    p(1201, 1190, "bash", "-bash", "pedro", "Ss", "pts/0");
    this.pidShell = 1201;
    this.proxPid = 1305;
    this.jobs = []; // { n, pid, texto }
  }

  // ---------------------------------------------------------------- i-nodes
  novoNo(tipo, extra) {
    const agora = new Date();
    const no = Object.assign({ ino: this.proxIno++, tipo, modo: tipo === "d" ? 0o755 : 0o644, dono: this.usuario,
      links: tipo === "d" ? 2 : 1, dados: "", alvo: "", mtime: agora, ctime: agora, atime: agora, nasc: agora }, extra || {});
    if (tipo === "d") no.filhos = new Map();
    this.inodes.set(no.ino, no);
    return no;
  }

  tamanho(no) {
    if (no.tipo === "d") return 4096;
    if (no.tipo === "l") return no.alvo.length;
    if (no.tipo === "c") return 0;
    return no.tamanho !== undefined ? no.tamanho : new TextEncoder().encode(no.dados).length;
  }

  // Caminho absoluto normalizado (resolve ~, . e .. no texto)
  abs(caminho) {
    let c = caminho === "~" ? this.home : caminho.replace(/^~\//, this.home + "/");
    if (!c.startsWith("/")) c = this.cwd + "/" + c;
    const partes = [];
    for (const s of c.split("/")) {
      if (!s || s === ".") continue;
      if (s === "..") partes.pop(); else partes.push(s);
    }
    return "/" + partes.join("/");
  }

  // Resolve um caminho até o i-node. seguir=false não segue o link simbólico do ÚLTIMO nome.
  resolver(caminho, seguir = true, prof = 0) {
    const partes = this.abs(caminho).split("/").filter(Boolean);
    let ino = this.raiz.ino, atual = "";
    for (let i = 0; i < partes.length; i++) {
      const no = this.inodes.get(ino);
      if (no.tipo !== "d") return { erro: "Not a directory" };
      if (!this.pode(no, 1)) return { erro: "Permission denied" };
      const f = no.filhos.get(partes[i]);
      if (f === undefined) return { erro: "No such file or directory" };
      const filho = this.inodes.get(f);
      const ultimo = i === partes.length - 1;
      if (filho.tipo === "l" && (!ultimo || seguir)) {
        if (prof > 8) return { erro: "Too many levels of symbolic links" };
        const alvo = filho.alvo.startsWith("/") ? filho.alvo : (atual || "") + "/" + filho.alvo;
        const r = this.resolver(alvo + (ultimo ? "" : ""), true, prof + 1);
        if (r.erro) return r;
        ino = r.ino; atual = r.caminho === "/" ? "" : r.caminho;
      } else {
        ino = f; atual += "/" + partes[i];
      }
    }
    return { ino, no: this.inodes.get(ino), caminho: atual || "/" };
  }

  // Diretório pai + nome final (para criar, apagar, renomear)
  pai(caminho) {
    const a = this.abs(caminho);
    const i = a.lastIndexOf("/");
    const nome = a.slice(i + 1);
    const r = this.resolver(a.slice(0, i) || "/");
    if (r.erro) return { erro: r.erro };
    if (r.no.tipo !== "d") return { erro: "Not a directory" };
    return { dir: r.no, nome };
  }

  criarEm(caminho, no) {
    const p = this.pai(caminho);
    p.dir.filhos.set(p.nome, no.ino);
    if (no.tipo === "d") { p.dir.links++; no.filhos.set(".", no.ino); no.filhos.set("..", p.dir.ino); }
    return no;
  }

  // bit: 4 = r, 2 = w, 1 = x. O usuário é dono dos seus arquivos; o resto usa "outros".
  pode(no, bit) {
    const desloc = no.dono === this.usuario ? 6 : 0;
    return ((no.modo >> desloc) & bit) !== 0;
  }

  // ---------------------------------------------------------------- ajudas para os roteiros
  existe(c, seguir = true) { return !this.resolver(c, seguir).erro; }
  tipo(c, seguir = true) { const r = this.resolver(c, seguir); return r.erro ? null : r.no.tipo; }
  ino(c, seguir = true) { const r = this.resolver(c, seguir); return r.erro ? null : r.ino; }
  no(c, seguir = true) { const r = this.resolver(c, seguir); return r.erro ? null : r.no; }
  modo(c) { const n = this.no(c, false); return n ? n.modo & 0o777 : null; }
  processos(nome) { return Array.from(this.procs.values()).filter(p => p.nome === nome); }

  // ---------------------------------------------------------------- formatação
  permStr(no) {
    const t = { d: "d", l: "l", c: "c", f: "-" }[no.tipo];
    let s = "";
    for (let k = 2; k >= 0; k--) {
      const b = (no.modo >> (k * 3)) & 7;
      s += (b & 4 ? "r" : "-") + (b & 2 ? "w" : "-") + (b & 1 ? "x" : "-");
    }
    if (no.modo & 0o1000) s = s.slice(0, 8) + (s[8] === "x" ? "t" : "T");
    return t + s;
  }

  dataLs(d) {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
    return `${m} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  dataStat(d) {
    const z = (n, k = 2) => String(n).padStart(k, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}.${z(d.getMilliseconds(), 3)}000000 -0300`;
  }

  // ---------------------------------------------------------------- entrada
  // Quebra a linha em palavras: respeita aspas, separa | > >> &, expande $$ e ~
  tokens(linha) {
    const out = [];
    let atual = "", tem = false, q = null;
    const fecha = () => { if (tem) out.push(atual); atual = ""; tem = false; };
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (q) {
        if (c === q) { q = null; continue; }
        if (c === "$" && q === '"' && linha[i + 1] === "$") { atual += this.pidShell; i++; continue; }
        atual += c; continue;
      }
      if (c === "'" || c === '"') { q = c; tem = true; continue; }
      if (c === " " || c === "\t") { fecha(); continue; }
      if (c === "|" || c === "&" || c === ";") { fecha(); out.push({ op: c }); continue; }
      if (c === ">") { fecha(); if (linha[i + 1] === ">") { out.push({ op: ">>" }); i++; } else out.push({ op: ">" }); continue; }
      if (c === "$" && linha[i + 1] === "$") { atual += this.pidShell; tem = true; i++; continue; }
      if (c === "~" && !tem && (i + 1 === linha.length || linha[i + 1] === "/" || linha[i + 1] === " ")) { atual += this.home; tem = true; continue; }
      atual += c; tem = true;
    }
    fecha();
    return out;
  }

  executar(linhaBruta) {
    const linha = linhaBruta.trim();
    const ev = { linha, nome: "", args: [], opcoes: "", ok: true, pipeline: [] };
    if (!linha) return { saida: "", ev };
    const toks = this.tokens(linha);

    // segundo plano: termina com &
    let fundo = false;
    if (toks.length && toks[toks.length - 1].op === "&") { fundo = true; toks.pop(); }
    if (toks.some(t => t.op === ";" || t.op === "&")) return { saida: "# Use um comando por vez neste laboratório.", nota: true, ev };

    // redirecionamento de saída
    let redir = null;
    const ir = toks.findIndex(t => t.op === ">" || t.op === ">>");
    if (ir >= 0) {
      redir = { modo: toks[ir].op, arq: toks[ir + 1] };
      if (typeof redir.arq !== "string") return { saida: "bash: syntax error near unexpected token `newline'", erro: true, ev };
      toks.splice(ir, 2);
    }

    // pipeline
    const etapas = [[]];
    toks.forEach(t => (t.op === "|" ? etapas.push([]) : etapas[etapas.length - 1].push(t)));
    if (etapas.some(e => !e.length)) return { saida: "bash: syntax error near unexpected token `|'", erro: true, ev };

    const [nome, ...resto] = etapas[0];
    ev.nome = nome;
    ev.opcoes = resto.filter(a => /^-[A-Za-z]/.test(a)).map(a => a.slice(1)).join("");
    ev.args = resto.filter(a => !/^-[A-Za-z]/.test(a) || /^-\d+$/.test(a));
    ev.argsBrutos = resto;
    ev.pipeline = etapas.slice(1).map(e => ({ nome: e[0], args: e.slice(1) }));

    let r;
    if (fundo) r = this.emFundo(nome, resto);
    else if (this["cmd_" + nome]) r = this["cmd_" + nome](resto, ev);
    else if (nome === "./a.out" || nome.startsWith("./")) r = { err: `bash: ${nome}: No such file or directory` };
    else r = { err: `${nome}: command not found` };
    r = r || {};
    if (r.limpar) return { limpar: true, ev };

    let out = r.out || "";
    for (const e of ev.pipeline) {
      if (e.nome === "grep") {
        const op = e.args.filter(a => a.startsWith("-")).join("");
        const pad = e.args.find(a => !a.startsWith("-"));
        if (!pad) { r.err = (r.err ? r.err + "\n" : "") + "Usage: grep [OPTION]... PATTERNS [FILE]..."; out = ""; continue; }
        const re = new RegExp(pad.replace(/[.*+?^${}()[\]\\]/g, "\\$&"), op.includes("i") ? "i" : "");
        out = out.split("\n").filter(l => l && (op.includes("v") ? !re.test(l) : re.test(l))).join("\n");
        // o grep aparece no ps de verdade
        if (["ps"].includes(nome) && !op.includes("v") && re.test("grep " + pad)) {
          const pid = this.proxPid++;
          out += (out ? "\n" : "") + (ev.opcoes.includes("u") || resto.includes("aux")
            ? `pedro       ${pid}  0.0  0.0   6480  2288 pts/0    S+   ${this.hora()}   0:00 grep --color=auto ${pad}`
            : `   ${pid} pts/0    00:00:00 grep`);
        }
      } else if (e.nome === "wc" && e.args.includes("-l")) {
        out = String(out ? out.split("\n").length : 0);
      } else if (e.nome === "head" || e.nome === "less" || e.nome === "more" || e.nome === "sort") {
        // mostra como está
      } else {
        return { saida: `# O laboratório só entende os filtros grep e wc -l depois do |.`, nota: true, ev };
      }
    }

    if (redir) {
      const res = this.escrever(redir.arq, out ? out + "\n" : "", redir.modo === ">>");
      if (res) { ev.ok = false; return { saida: res, erro: true, ev }; }
      out = "";
    }
    ev.ok = !r.err;
    ev.resultado = r;
    const saida = [r.job, out, r.err].filter(Boolean).join("\n");
    return { saida, erro: !!r.err && !out, nota: r.nota, ev };
  }

  hora() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  escrever(caminho, texto, anexar) {
    let r = this.resolver(caminho);
    if (r.erro === "No such file or directory") {
      const p = this.pai(caminho);
      if (p.erro) return `bash: ${caminho}: ${p.erro}`;
      if (!this.pode(p.dir, 2)) return `bash: ${caminho}: Permission denied`;
      this.criarEm(caminho, this.novoNo("f", {}));
      r = this.resolver(caminho);
    } else if (r.erro) return `bash: ${caminho}: ${r.erro}`;
    const no = r.no;
    if (no.tipo === "d") return `bash: ${caminho}: Is a directory`;
    if (no.tipo === "c") return null; // /dev/null engole tudo
    if (!this.pode(no, 2)) return `bash: ${caminho}: Permission denied`;
    no.dados = anexar ? no.dados + texto : texto;
    delete no.tamanho;
    no.mtime = no.ctime = new Date();
    return null;
  }

  // ---------------------------------------------------------------- arquivos
  cmd_pwd() { return { out: this.cwd }; }
  cmd_clear() { return { limpar: true }; }
  cmd_whoami() { return { out: this.usuario }; }
  cmd_hostname() { return { out: "kernelplay" }; }
  cmd_id() { return { out: "uid=1000(pedro) gid=1000(pedro) groups=1000(pedro)" }; }
  cmd_date() { return { out: new Date().toString() }; }
  cmd_exit() { return { nota: true, out: "# Melhor não fechar o shell: o roteiro precisa dele." }; }
  cmd_history() { return { nota: true, out: "# Use as setas ↑ e ↓ para navegar no histórico." }; }

  cmd_help() {
    return { nota: true, out: `# Comandos deste laboratório:
#  arquivos:  pwd  cd  ls [-l -i -a]  mkdir  touch  echo ... > arq  cat  cp  mv  rm  rmdir
#             ln [-s]  stat  chmod  file
#  processos: ps [aux | -l | -ef]  pstree [-p]  sleep N &  yes > /dev/null &  jobs  kill [-SINAL] PID  pgrep
#  filtros:   comando | grep texto     comando | wc -l
#  outros:    clear  whoami  id  echo $$` };
  }

  cmd_echo(a) { return { out: a.filter(x => x !== "-e" && x !== "-n").join(" ") }; }

  cmd_cd(a) {
    const destino = a[0] === undefined ? this.home : a[0];
    if (destino === "-") return { err: "# cd - não está disponível aqui; use um caminho." };
    const r = this.resolver(destino);
    if (r.erro) return { err: `bash: cd: ${destino}: ${r.erro}` };
    if (r.no.tipo !== "d") return { err: `bash: cd: ${destino}: Not a directory` };
    if (!this.pode(r.no, 1)) return { err: `bash: cd: ${destino}: Permission denied` };
    this.cwd = this.abs(destino);
    return {};
  }

  cmd_ls(args, ev) {
    const op = args.filter(a => a.startsWith("-")).join("");
    const longo = op.includes("l"), comIno = op.includes("i"), todos = op.includes("a");
    const alvos = args.filter(a => !a.startsWith("-"));
    if (!alvos.length) alvos.push(".");
    const saidas = [], erros = [];

    const linhaDe = (nome, no, alvoLink) => {
      const ino = comIno ? `${no.ino} ` : "";
      if (!longo) return ino + nome;
      const tam = no.tipo === "c" ? no.dev : String(this.tamanho(no));
      return `${ino}${this.permStr(no)} ${no.links} ${no.dono} ${no.dono} ${tam.padStart(5)} ${this.dataLs(no.mtime)} ${nome}${no.tipo === "l" ? " -> " + no.alvo : ""}`;
    };

    for (const alvo of alvos) {
      const r = this.resolver(alvo, false);
      if (r.erro) { erros.push(`ls: cannot access '${alvo}': ${r.erro}`); continue; }
      let no = r.no;
      if (no.tipo === "l" && !longo) { const s = this.resolver(alvo); if (!s.erro && s.no.tipo === "d") no = s.no; }
      if (no.tipo !== "d") { saidas.push(linhaDe(alvo, no)); continue; }
      if (!this.pode(no, 4)) { erros.push(`ls: cannot open directory '${alvo}': Permission denied`); continue; }
      const nomes = Array.from(no.filhos.keys()).filter(n => todos || !n.startsWith(".")).sort((x, y) => x.replace(/^\./, "").localeCompare(y.replace(/^\./, "")));
      if (todos) { nomes.splice(nomes.indexOf("."), 1); nomes.splice(nomes.indexOf(".."), 1); nomes.unshift(".", ".."); }
      const linhas = nomes.map(n => linhaDe(n, this.inodes.get(no.filhos.get(n))));
      if (alvos.length > 1) saidas.push(`${alvo}:`);
      if (longo) {
        const blocos = nomes.reduce((s, n) => { const x = this.inodes.get(no.filhos.get(n)); return s + (x.tipo === "f" || x.tipo === "d" ? Math.ceil(this.tamanho(x) / 4096) * 4 : 0); }, 0);
        saidas.push(`total ${blocos}`);
        saidas.push(...linhas);
      } else if (linhas.length) saidas.push(linhas.join(ev && ev.pipeline.length ? "\n" : "  "));
    }
    return { out: saidas.join("\n"), err: erros.join("\n") };
  }

  cmd_mkdir(args) {
    const p = args.includes("-p");
    const erros = [];
    for (const c of args.filter(a => !a.startsWith("-"))) {
      if (this.existe(c, false)) { if (!p) erros.push(`mkdir: cannot create directory '${c}': File exists`); continue; }
      if (p) {
        let acc = "";
        for (const s of this.abs(c).split("/").filter(Boolean)) {
          acc = acc + "/" + s;
          if (!this.existe(acc)) this.criarEm(acc, this.novoNo("d", {}));
        }
        continue;
      }
      const pai = this.pai(c);
      if (pai.erro) { erros.push(`mkdir: cannot create directory '${c}': ${pai.erro}`); continue; }
      if (!this.pode(pai.dir, 2)) { erros.push(`mkdir: cannot create directory '${c}': Permission denied`); continue; }
      this.criarEm(c, this.novoNo("d", {}));
    }
    if (!args.filter(a => !a.startsWith("-")).length) erros.push("mkdir: missing operand");
    return { err: erros.join("\n") };
  }

  cmd_touch(args) {
    const erros = [];
    for (const c of args.filter(a => !a.startsWith("-"))) {
      const r = this.resolver(c);
      if (!r.erro) { r.no.mtime = r.no.atime = r.no.ctime = new Date(); continue; }
      const res = this.escrever(c, "", true);
      if (res) erros.push(res.replace("bash:", "touch: cannot touch"));
    }
    return { err: erros.join("\n") };
  }

  cmd_cat(args) {
    const out = [], erros = [];
    const alvos = args.filter(a => !a.startsWith("-"));
    if (!alvos.length) return { nota: true, out: "# Sem arquivo, o cat ficaria esperando o teclado. Informe um arquivo." };
    for (const c of alvos) {
      const r = this.resolver(c);
      if (r.erro) { erros.push(`cat: ${c}: ${r.erro}`); continue; }
      if (r.no.tipo === "d") { erros.push(`cat: ${c}: Is a directory`); continue; }
      if (r.no.tipo === "c") continue;
      if (!this.pode(r.no, 4)) { erros.push(`cat: ${c}: Permission denied`); continue; }
      r.no.atime = new Date();
      out.push(r.no.dados.replace(/\n$/, ""));
    }
    return { out: out.join("\n"), err: erros.join("\n") };
  }

  cmd_rm(args) {
    const op = args.filter(a => a.startsWith("-")).join("");
    const rec = /r/i.test(op), forca = op.includes("f");
    const erros = [];
    const alvos = args.filter(a => !a.startsWith("-"));
    if (!alvos.length) return { err: "rm: missing operand" };
    for (const c of alvos) {
      const r = this.resolver(c, false);
      if (r.erro) { if (!forca) erros.push(`rm: cannot remove '${c}': ${r.erro}`); continue; }
      if (r.no.tipo === "d" && !rec) { erros.push(`rm: cannot remove '${c}': Is a directory`); continue; }
      if (r.no.tipo === "d" && this.cwd.startsWith(this.abs(c))) { erros.push(`rm: cannot remove '${c}': Device or resource busy`); continue; }
      const p = this.pai(c);
      if (!this.pode(p.dir, 2)) { erros.push(`rm: cannot remove '${c}': Permission denied`); continue; }
      this.desligar(p.dir, p.nome);
    }
    return { err: erros.join("\n") };
  }

  // Remove uma entrada de diretório (unlink); o i-node só some com links = 0
  desligar(dir, nome) {
    const no = this.inodes.get(dir.filhos.get(nome));
    dir.filhos.delete(nome);
    if (no.tipo === "d") {
      dir.links--;
      for (const [n, i] of Array.from(no.filhos)) if (n !== "." && n !== "..") this.desligar(no, n);
      this.inodes.delete(no.ino);
      return;
    }
    no.links--;
    no.ctime = new Date();
    if (no.links <= 0) this.inodes.delete(no.ino);
  }

  cmd_rmdir(args) {
    const erros = [];
    for (const c of args) {
      const r = this.resolver(c, false);
      if (r.erro) { erros.push(`rmdir: failed to remove '${c}': ${r.erro}`); continue; }
      if (r.no.tipo !== "d") { erros.push(`rmdir: failed to remove '${c}': Not a directory`); continue; }
      if (r.no.filhos.size > 2) { erros.push(`rmdir: failed to remove '${c}': Directory not empty`); continue; }
      const p = this.pai(c);
      this.desligar(p.dir, p.nome);
    }
    return { err: erros.join("\n") };
  }

  cmd_ln(args) {
    const simb = args.some(a => a === "-s" || a === "--symbolic" || /^-\w*s/.test(a));
    const [alvo, nome] = args.filter(a => !a.startsWith("-"));
    if (!alvo || !nome) return { err: "ln: missing file operand" };
    if (this.existe(nome, false)) return { err: `ln: failed to create ${simb ? "symbolic" : "hard"} link '${nome}': File exists` };
    const p = this.pai(nome);
    if (p.erro) return { err: `ln: failed to create link '${nome}': ${p.erro}` };
    if (simb) {
      this.criarEm(nome, this.novoNo("l", { alvo, modo: 0o777 }));
      return {};
    }
    const r = this.resolver(alvo, false);
    if (r.erro) return { err: `ln: failed to access '${alvo}': ${r.erro}` };
    if (r.no.tipo === "d") return { err: `ln: ${alvo}: hard link not allowed for directory` };
    p.dir.filhos.set(p.nome, r.ino);
    r.no.links++;
    r.no.ctime = new Date();
    return {};
  }

  cmd_cp(args) {
    const [de, para] = args.filter(a => !a.startsWith("-"));
    if (!de || !para) return { err: "cp: missing file operand" };
    const r = this.resolver(de);
    if (r.erro) return { err: `cp: cannot stat '${de}': ${r.erro}` };
    if (r.no.tipo === "d") return { err: `cp: -r not specified; omitting directory '${de}'` };
    if (!this.pode(r.no, 4)) return { err: `cp: cannot open '${de}' for reading: Permission denied` };
    let destino = para;
    if (this.tipo(para) === "d") destino = para + "/" + this.abs(de).split("/").pop();
    const e = this.escrever(destino, r.no.dados, false);
    return e ? { err: e.replace("bash:", "cp:") } : {};
  }

  cmd_mv(args) {
    const [de, para] = args.filter(a => !a.startsWith("-"));
    if (!de || !para) return { err: "mv: missing file operand" };
    const r = this.resolver(de, false);
    if (r.erro) return { err: `mv: cannot stat '${de}': ${r.erro}` };
    let destino = para;
    if (this.tipo(para) === "d") destino = para + "/" + this.abs(de).split("/").pop();
    const pd = this.pai(destino);
    if (pd.erro) return { err: `mv: cannot move '${de}' to '${para}': ${pd.erro}` };
    const po = this.pai(de);
    if (pd.dir.filhos.has(pd.nome)) this.desligar(pd.dir, pd.nome);
    po.dir.filhos.delete(po.nome);
    pd.dir.filhos.set(pd.nome, r.ino);
    if (r.no.tipo === "d") { r.no.filhos.set("..", pd.dir.ino); po.dir.links--; pd.dir.links++; }
    r.no.ctime = new Date();
    return {};
  }

  cmd_stat(args) {
    const alvos = args.filter(a => !a.startsWith("-"));
    if (!alvos.length) return { err: "stat: missing operand" };
    const out = [], erros = [];
    for (const c of alvos) {
      const r = this.resolver(c, false);
      if (r.erro) { erros.push(`stat: cannot statx '${c}': ${r.erro}`); continue; }
      const no = r.no;
      const tam = this.tamanho(no);
      const tipo = { d: "directory", l: "symbolic link", c: "character special file", f: tam ? "regular file" : "regular empty file" }[no.tipo];
      const blocos = no.tipo === "f" || no.tipo === "d" ? Math.ceil(tam / 4096) * 8 : 0;
      const uid = no.dono === "root" ? "    0/    root" : " 1000/   pedro";
      out.push(`  File: ${c}${no.tipo === "l" ? " -> " + no.alvo : ""}
  Size: ${String(tam).padEnd(10)}\tBlocks: ${String(blocos).padEnd(10)} IO Block: 4096   ${tipo}
Device: 8,2\tInode: ${String(no.ino).padEnd(11)} Links: ${no.links}
Access: (${(no.modo & 0o7777).toString(8).padStart(4, "0")}/${this.permStr(no)})  Uid: (${uid})   Gid: (${uid})
Access: ${this.dataStat(no.atime)}
Modify: ${this.dataStat(no.mtime)}
Change: ${this.dataStat(no.ctime)}
 Birth: ${this.dataStat(no.nasc)}`);
    }
    return { out: out.join("\n"), err: erros.join("\n") };
  }

  cmd_chmod(args) {
    const [modo, ...arqs] = args;
    if (!modo || !arqs.length) return { err: "chmod: missing operand" };
    const erros = [];
    for (const c of arqs) {
      const r = this.resolver(c);
      if (r.erro) { erros.push(`chmod: cannot access '${c}': ${r.erro}`); continue; }
      const no = r.no;
      if (no.dono !== this.usuario) { erros.push(`chmod: changing permissions of '${c}': Operation not permitted`); continue; }
      if (/^[0-7]{3,4}$/.test(modo)) { no.modo = parseInt(modo, 8); no.ctime = new Date(); continue; }
      let ok = true;
      for (const parte of modo.split(",")) {
        const m = parte.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
        if (!m) { ok = false; break; }
        const quem = (m[1] || "a").replace("a", "ugo");
        let bits = 0;
        if (m[3].includes("r")) bits |= 4;
        if (m[3].includes("w")) bits |= 2;
        if (m[3].includes("x")) bits |= 1;
        for (const q of quem) {
          const d = { u: 6, g: 3, o: 0 }[q];
          if (m[2] === "+") no.modo |= bits << d;
          else if (m[2] === "-") no.modo &= ~(bits << d);
          else no.modo = (no.modo & ~(7 << d)) | (bits << d);
        }
      }
      if (!ok) { erros.push(`chmod: invalid mode: '${modo}'`); break; }
      no.ctime = new Date();
    }
    return { err: erros.join("\n") };
  }

  cmd_file(args) {
    const out = [];
    for (const c of args.filter(a => !a.startsWith("-"))) {
      const r = this.resolver(c, false);
      if (r.erro) { out.push(`${c}: cannot open \`${c}' (${r.erro})`); continue; }
      const no = r.no;
      let d = "ASCII text";
      if (no.tipo === "d") d = "directory";
      else if (no.tipo === "l") d = `symbolic link to ${no.alvo}`;
      else if (no.tipo === "c") d = `character special (${no.dev.replace(" ", "")})`;
      else if (no.dados.startsWith("\x7fELF")) d = "ELF 64-bit LSB pie executable, x86-64";
      else if (!no.dados) d = "empty";
      else if (/#include|int main/.test(no.dados)) d = "C source, ASCII text";
      out.push(`${c}: ${d}`);
    }
    return { out: out.join("\n") };
  }

  // ---------------------------------------------------------------- processos
  emFundo(nome, args) {
    if (nome === "sleep" && /^\d+$/.test(args[0] || "")) return this.novoJob("sleep", "sleep " + args[0], "S");
    if (nome === "yes") return this.novoJob("yes", "yes", "R");
    if (nome === "sleep") return { err: "sleep: missing operand" };
    return { nota: true, out: `# Em segundo plano, este laboratório roda só "sleep N &" e "yes > /dev/null &".` };
  }

  novoJob(nome, texto, estado) {
    const pid = this.proxPid++;
    const n = this.jobs.length ? Math.max(...this.jobs.map(j => j.n)) + 1 : 1;
    this.procs.set(pid, { pid, ppid: this.pidShell, nome, args: texto, dono: this.usuario, estado, tty: "pts/0", job: n });
    this.jobs.push({ n, pid, texto });
    return { job: `[${n}] ${pid}` };
  }

  cmd_sleep(a) {
    if (!a[0]) return { err: "sleep: missing operand" };
    return { nota: true, out: `# Sem o &, o terminal ficaria travado por ${a[0]} segundos. Use "sleep ${a[0]} &" para rodar em segundo plano.` };
  }

  cmd_yes() { return { nota: true, out: "# O yes imprime \"y\" sem parar. Rode em segundo plano jogando a saída fora: yes > /dev/null &" }; }

  cmd_jobs() {
    const nomeEstado = (p) => p.estado.startsWith("T") ? "Stopped" : "Running";
    return { out: this.jobs.map((j, k) => {
      const p = this.procs.get(j.pid);
      const marca = k === this.jobs.length - 1 ? "+" : k === this.jobs.length - 2 ? "-" : " ";
      return `[${j.n}]${marca}  ${nomeEstado(p).padEnd(23)} ${j.texto}${p.estado.startsWith("T") ? "" : " &"}`;
    }).join("\n") };
  }

  cmd_fg() { return { nota: true, out: "# Trazer o job para o primeiro plano travaria o terminal do laboratório. Use kill para mandar sinais." }; }
  cmd_bg() { return this.cmd_fg(); }
  cmd_top() { return { nota: true, out: "# O top é interativo e não roda aqui. Use ps aux para ver CPU e estado." }; }
  cmd_htop() { return this.cmd_top(); }

  // Lista ordenada por PID, incluindo o próprio ps
  listaProcs(comMim, nomeMim, argsMim) {
    const l = Array.from(this.procs.values());
    if (comMim) l.push({ pid: this.proxPid++, ppid: this.pidShell, nome: nomeMim, args: argsMim || nomeMim, dono: this.usuario, estado: "R+", tty: "pts/0", efemero: true });
    return l.sort((a, b) => a.pid - b.pid);
  }

  cmd_ps(args, ev) {
    const op = args.join(" ").replace(/-/g, "");
    const todos = /a/.test(op) && /x/.test(op) || /e/.test(op) || /A/.test(op);
    const linhaCmd = "ps" + (args.length ? " " + args.join(" ") : "");
    let lista = this.listaProcs(true, "ps", linhaCmd);
    if (!todos) lista = lista.filter(p => p.tty === "pts/0");
    const cpu = (p) => p.nome === "yes" ? "99.6" : "0.0";
    const tempo = (p) => p.nome === "yes" ? "0:42" : "0:00";

    if (/u/.test(op)) {
      const cab = "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND";
      return { out: [cab, ...lista.map(p =>
        `${p.dono.padEnd(8)} ${String(p.pid).padStart(7)} ${cpu(p).padStart(4)}  0.1  ${p.nome === "systemd" ? "22168" : " 8384"} ${p.nome === "systemd" ? "13140" : " 4120"} ${p.tty.padEnd(8)} ${(p.estado === "S" && p.tty === "pts/0" ? "S" : p.estado).padEnd(4)} 21:00   ${tempo(p)} ${p.args}`)].join("\n") };
    }
    if (/l/.test(op)) {
      const cab = "F S   UID     PID    PPID  C PRI  NI ADDR SZ WCHAN  TTY          TIME CMD";
      const wchan = (p) => p.estado[0] === "S" ? (p.nome === "bash" ? "do_wai" : "hrtime") : p.estado[0] === "T" ? "do_sig" : "-     ";
      return { out: [cab, ...lista.map(p =>
        `0 ${p.estado[0]}  ${p.dono === "root" ? "   0" : "1000"} ${String(p.pid).padStart(7)} ${String(p.ppid).padStart(7)}  ${p.nome === "yes" ? "99" : " 0"}  80   0 -  2050 ${wchan(p)} ${p.tty.padEnd(8)} ${p.nome === "yes" ? "00:00:42" : "00:00:00"} ${p.nome}`)].join("\n") };
    }
    if (/f/.test(op)) {
      const cab = "UID          PID    PPID  C STIME TTY          TIME CMD";
      return { out: [cab, ...lista.map(p =>
        `${p.dono.padEnd(8)} ${String(p.pid).padStart(7)} ${String(p.ppid).padStart(7)}  0 21:00 ${p.tty.padEnd(8)} 00:00:00 ${p.args}`)].join("\n") };
    }
    return { out: ["    PID TTY          TIME CMD", ...lista.map(p =>
      `${String(p.pid).padStart(7)} ${p.tty.padEnd(8)} ${p.nome === "yes" ? "00:00:42" : "00:00:00"} ${p.nome}`)].join("\n") };
  }

  cmd_pgrep(args) {
    const nome = args.find(a => !a.startsWith("-"));
    if (!nome) return { err: "pgrep: no matching criteria specified" };
    const l = Array.from(this.procs.values()).filter(p => p.nome.includes(nome));
    return { out: l.map(p => args.includes("-l") ? `${p.pid} ${p.nome}` : String(p.pid)).join("\n") };
  }

  cmd_pstree(args) {
    const comPid = args.some(a => /^-\w*p/.test(a));
    const lista = this.listaProcs(true, "pstree", "pstree");
    const filhos = (pid) => lista.filter(p => p.ppid === pid);
    const rot = (p) => p.nome + (comPid ? `(${p.pid})` : "");
    const desenhar = (p) => {
      const r = rot(p);
      const fs = filhos(p.pid);
      if (!fs.length) return [r];
      const pad = " ".repeat(r.length);
      if (fs.length === 1) {
        const sub = desenhar(fs[0]);
        return [r + "───" + sub[0], ...sub.slice(1).map(l => pad + "   " + l)];
      }
      const out = [];
      fs.forEach((f, k) => {
        const sub = desenhar(f);
        const prim = k === 0 ? "─┬─" : k === fs.length - 1 ? " └─" : " ├─";
        const cont = k === fs.length - 1 ? "   " : " │ ";
        out.push((k === 0 ? r : pad) + prim + sub[0]);
        sub.slice(1).forEach(l => out.push(pad + cont + l));
      });
      return out;
    };
    return { out: desenhar(lista.find(p => p.pid === 1)).join("\n") };
  }

  cmd_kill(args) {
    if (args[0] === "-l") return { out: " 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 9) SIGKILL\n15) SIGTERM\t17) SIGCHLD\t18) SIGCONT\t19) SIGSTOP\t20) SIGTSTP" };
    let sinal = "TERM";
    const alvos = [];
    for (const a of args) {
      if (/^-/.test(a)) {
        const s = a.slice(1).toUpperCase().replace(/^SIG/, "");
        const mapa = { "9": "KILL", "15": "TERM", "19": "STOP", "18": "CONT", "20": "TSTP", "2": "INT", "1": "HUP", KILL: "KILL", TERM: "TERM", STOP: "STOP", CONT: "CONT", TSTP: "TSTP", INT: "INT", HUP: "HUP" };
        const sn = a.startsWith("-s") ? null : mapa[s];
        if (!sn) return { err: `bash: kill: ${a.slice(1)}: invalid signal specification` };
        sinal = sn;
      } else alvos.push(a);
    }
    if (!alvos.length) return { err: "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]" };
    const out = [], erros = [];
    for (const a of alvos) {
      let pid;
      if (a.startsWith("%")) {
        const j = this.jobs.find(x => String(x.n) === a.slice(1));
        if (!j) { erros.push(`bash: kill: ${a}: no such job`); continue; }
        pid = j.pid;
      } else if (/^\d+$/.test(a)) pid = Number(a);
      else { erros.push(`bash: kill: ${a}: arguments must be process or job IDs`); continue; }
      const p = this.procs.get(pid);
      if (!p) { erros.push(`bash: kill: (${pid}) - No such process`); continue; }
      if (p.dono !== this.usuario) { erros.push(`bash: kill: (${pid}) - Operation not permitted`); continue; }
      if (pid === this.pidShell) {
        if (sinal === "KILL") out.push("# ⚠ kill -9 no próprio shell fecharia o terminal! O laboratório ignorou o sinal para você não perder o roteiro.");
        else out.push("# O bash ignora o SIGTERM vindo do próprio terminal; para matá-lo seria preciso SIGKILL (não faça isso).");
        continue;
      }
      const j = this.jobs.find(x => x.pid === pid);
      const rotulo = j ? `[${j.n}]+  ` : "";
      const texto = j ? j.texto : p.args;
      if (sinal === "STOP" || sinal === "TSTP") { p.estado = "T"; out.push(`${rotulo}Stopped                 ${texto}`); }
      else if (sinal === "CONT") { p.estado = p.nome === "yes" ? "R" : "S"; }
      else {
        if (p.estado === "T" && sinal === "TERM") {
          // parado, o processo só trata o TERM quando continuar
          p.pendente = "TERM";
          out.push(`# O processo ${pid} está parado (T): o SIGTERM fica pendente até ele receber SIGCONT. O SIGKILL não espera.`);
          continue;
        }
        this.procs.delete(pid);
        this.jobs = this.jobs.filter(x => x.pid !== pid);
        p.morreuCom = sinal;
        this.ultimoMorto = p;
        out.push(`${rotulo}${{ KILL: "Killed", INT: "Interrupt", HUP: "Hangup" }[sinal] || "Terminated"}${" ".repeat(sinal === "KILL" ? 18 : 14)}${texto}`);
      }
      // SIGCONT entrega um TERM que estava pendente
      if (sinal === "CONT" && p.pendente) {
        delete p.pendente;
        this.procs.delete(pid);
        this.jobs = this.jobs.filter(x => x.pid !== pid);
        p.morreuCom = "TERM";
        this.ultimoMorto = p;
        out.push(`${rotulo}Terminated              ${texto}`);
      }
    }
    return { out: out.join("\n"), err: erros.join("\n") };
  }

  cmd_pkill(args) {
    const nome = args.find(a => !a.startsWith("-"));
    const sin = args.find(a => a.startsWith("-"));
    const l = Array.from(this.procs.values()).filter(p => p.nome === nome && p.dono === this.usuario && p.pid !== this.pidShell);
    if (!l.length) return {};
    return this.cmd_kill([...(sin ? [sin] : []), ...l.map(p => String(p.pid))]);
  }
  cmd_killall(args) { return this.cmd_pkill(args); }

  // Prompt no estilo do Ubuntu: pedro@kernelplay:~/so$
  prompt() {
    const c = this.cwd === this.home ? "~" : this.cwd.startsWith(this.home + "/") ? "~" + this.cwd.slice(this.home.length) : this.cwd;
    return `pedro@kernelplay:${c}$`;
  }
}
