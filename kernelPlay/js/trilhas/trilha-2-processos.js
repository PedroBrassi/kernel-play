/* =========================================================
   KernelPlay — Trilha 2: Gerenciamento de Processos
   Fonte: Trilhas/Trilha_2_Gerenciamento_de_Processos.md (Aulas 4 a 11;
   MAZIERO, Partes II e III) + aulas de laboratório (Labs 01 a 04).
   Desafios com o campo "lab" vêm das aulas de laboratório.
   Trechos do xv6: xv6-labs-2024 (versão usada no laboratório).
   O formato das fases e dos desafios está documentado em js/trilhas.js.
   ========================================================= */

TRILHAS.push({
  id: "processos",
  numero: 2,
  titulo: "Gerenciamento de Processos",
  subtitulo: "Processos, threads, comunicação, sincronização, escalonamento e deadlocks.",
  fases: [
    // ================================================== FASE 2.1A — Processo, contexto e PCB
    {
      id: "p21a",
      etapa: "2.1 A",
      titulo: "Processos",
      descricao: "Programa × processo, contexto e PCB",
      icone: "📘",
      xv6: {
        titulo: "O PCB do xv6",
        arquivo: "kernel/proc.h",
        codigo: `enum procstate { UNUSED, USED, SLEEPING, RUNNABLE, RUNNING, ZOMBIE };

struct proc {
  struct spinlock lock;
  enum procstate state;        // estado do processo
  void *chan;                  // se != 0, dormindo neste "canal"
  int killed;
  int xstate;                  // status de saída para o wait() do pai
  int pid;                     // identificador
  struct proc *parent;         // processo pai
  // ... memória (pagetable), contexto (registradores salvos), arquivos abertos
};`,
        texto: "Cada processo do xv6 é uma <code>struct proc</code> numa tabela fixa (<code>proc[NPROC]</code>): é o PCB. O contexto salvo na troca fica em <code>p->context</code>."
      },
      linux: {
        titulo: "Os processos do Linux",
        comando: "ps -o pid,ppid,stat,comm",
        saida: `    PID    PPID STAT COMMAND
   2817    2790 Ss   bash
   3104    2817 R+   ps`,
        texto: "No Linux o PCB é a <code>struct task_struct</code>. O <code>ps</code> mostra o PID, o PID do pai (PPID) e o estado (STAT) de cada processo."
      },
      man: [
        { termo: "processo", secao: "7", resumo: "um programa em execução: a unidade básica de execução controlada pelo SO",
          detalhe: "Inclui código, dados (variáveis globais), pilha, heap, registradores e o contador de programa. O programa é passivo (no disco); o processo é ativo (na memória). Um mesmo programa pode originar vários processos.",
          veja: ["PCB(7)", "PID(7)", "estados(7)"] },
        { termo: "PCB", secao: "7", resumo: "Process Control Block: a ficha de cada processo na tabela de processos",
          detalhe: "Guarda PID, estado, contador de programa, registradores, prioridade, informações de memória, arquivos abertos e tempo de CPU. Permite pausar um processo e retomá-lo do mesmo ponto. No xv6 é a struct proc; no Linux, a struct task_struct.",
          veja: ["processo(7)", "troca de contexto(7)"] },
        { termo: "PID", secao: "7", resumo: "Process ID: o número que identifica um processo",
          detalhe: "O PPID é o PID do processo pai. O primeiro processo do sistema (init ou systemd) tem PID 1.",
          exemplo: "ps -o pid,ppid,comm",
          veja: ["ps(1)", "kill(1)"] },
        { termo: "troca de contexto", secao: "7", resumo: "salvar o contexto de um processo e carregar o de outro",
          detalhe: "O SO interrompe A, salva seu contexto (registradores, PC, SP) no PCB, carrega o contexto de B e B continua. Durante a troca a CPU não faz trabalho útil: a eficiência é E = tq / (tq + ttc), em que tq é o quantum e ttc o tempo de troca. No xv6, a troca é feita pela função swtch().",
          veja: ["PCB(7)", "quantum(7)"] },
        { termo: "pseudoparalelismo", secao: "7", resumo: "a ilusão de execução simultânea numa única CPU",
          detalhe: "A CPU alterna rapidamente entre processos; cada um executa um pouco por vez. Paralelismo real exige várias CPUs ou núcleos.",
          veja: ["troca de contexto(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Programa × processo",
          texto: `<p class="destaque">"Se a CPU executa uma instrução por vez, como o sistema consegue rodar vários programas ao mesmo tempo?"</p>
            <p>Um <b>processo</b> é um <b>programa em execução</b>: a unidade básica de execução controlada pelo SO.</p>
            <ul>
              <li>💾 <b>Programa</b>: entidade <b>passiva</b>, guardada no disco.</li>
              <li>▶ <b>Processo</b>: entidade <b>ativa</b>, em execução na memória.</li>
              <li>🔁 Um mesmo programa pode gerar <b>vários processos</b> ao mesmo tempo.</li>
            </ul>
            <p>Um processo tem código, dados, <b>pilha</b>, heap, registradores e o <b>contador de programa</b> (a próxima instrução).</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual é a entidade ativa: o programa ou o processo?",
          opcoes: [
            "O programa, porque contém as instruções",
            "O processo, porque é o programa em execução, com estado próprio",
            "Os dois são ativos",
            "Nenhum dos dois: quem é ativo é o SO"
          ],
          correta: 1,
          dica: "Pense no arquivo /bin/ls parado no disco e no ls rodando agora.",
          explicacao: "O programa é passivo (um arquivo no disco). O processo é ativo: tem registradores, memória e um estado que muda com o tempo."
        },
        {
          tipo: "conceito",
          titulo: "Contexto, PCB e troca de contexto",
          texto: `<p>O <b>contexto</b> é tudo o que é preciso para continuar a execução: registradores, <b>PC</b> (contador de programa),
            <b>SP</b> (ponteiro de pilha) e informações do SO. Ele fica guardado no <b>PCB</b> (<i>Process Control Block</i>),
            uma entrada da <b>tabela de processos</b> com PID, estado, prioridade, memória, arquivos abertos e tempo de CPU.</p>
            <p><b>Troca de contexto:</b> o SO interrompe A → salva o contexto de A → carrega o contexto de B → B continua.</p>
            <p>⚠ Durante a troca a CPU não faz trabalho útil: trocas demais reduzem o desempenho, e o <b>quantum</b>
            (fatia de tempo) influencia diretamente esse custo. Eficiência: <code>E = tq / (tq + ttc)</code>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Onde o SO guarda o contexto de um processo?",
          opcoes: ["Na pilha do usuário", "No PCB", "No disco", "No cache L1"],
          correta: 1,
          dica: "É a ficha que o SO mantém para cada processo ativo.",
          explicacao: "O contexto (registradores, PC, SP…) é salvo no PCB, a entrada do processo na tabela de processos. No xv6, a struct proc."
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene os passos de uma troca de contexto de A para B.",
          itens: [
            "O SO interrompe o processo A",
            "O contexto de A é salvo no PCB de A",
            "O contexto de B é carregado do PCB de B",
            "B retoma a execução de onde parou"
          ],
          dica: "Só dá para carregar B depois de guardar A.",
          explicacao: "Interromper → salvar A → carregar B → B continua. A troca rápida dá a impressão de execução simultânea."
        },
        {
          tipo: "multipla",
          pergunta: "O quantum é 4 ms e cada troca de contexto custa 1 ms. Qual é a eficiência E = tq / (tq + ttc)?",
          opcoes: ["20%", "75%", "80%", "100%"],
          correta: 2,
          dica: "4 / (4 + 1).",
          explicacao: "E = 4 / 5 = 80%. Um quantum menor deixa o sistema mais interativo, mas aumenta a fração de tempo gasta em trocas."
        },
        {
          tipo: "conceito",
          titulo: "Multiprogramação e pseudoparalelismo",
          texto: `<ul>
              <li>🔂 <b>Monoprogramação</b>: um programa executa até terminar; a CPU fica ociosa durante a E/S.</li>
              <li>🔀 <b>Multiprogramação</b>: os processos alternam o uso da CPU; enquanto um espera E/S, outro executa.</li>
              <li>👁 <b>Pseudoparalelismo</b>: uma CPU executa um processo por vez, mas a troca rápida cria a ilusão de simultaneidade.</li>
              <li>⚡ <b>Paralelismo real</b>: várias CPUs ou núcleos executando ao mesmo tempo (multicore, GPUs).</li>
            </ul>
            <p>Com vários processos disputando a CPU, alguém precisa decidir quem executa e quando: é o <b>escalonador</b> (fase 2.5).</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Pseudoparalelismo é o mesmo que paralelismo real?",
          opcoes: [
            "Sim, são sinônimos",
            "Não: é a alternância rápida entre processos em uma CPU",
            "Não: pseudoparalelismo exige várias CPUs",
            "Sim, desde que haja multiprogramação"
          ],
          correta: 1,
          dica: "Quantos processos uma única CPU executa num instante?",
          explicacao: "No pseudoparalelismo a CPU alterna entre processos tão rápido que parecem simultâneos. Paralelismo real exige vários núcleos."
        }
      ]
    },

    // ================================================== FASE 2.1B — Estados
    {
      id: "p21b",
      etapa: "2.1 B",
      titulo: "Estados de um processo",
      descricao: "Pronto, executando, bloqueado e transições",
      icone: "🔎",
      xv6: {
        titulo: "Os estados no xv6",
        arquivo: "kernel/proc.h e kernel/proc.c",
        codigo: `enum procstate { UNUSED, USED, SLEEPING, RUNNABLE, RUNNING, ZOMBIE };
//   aula:     livre   novo  bloqueado  pronto  executando  zumbi

// sleep(): o processo bloqueia esperando um evento ("canal")
p->chan = chan;
p->state = SLEEPING;
sched();                         // entrega a CPU

// wakeup(): quando o evento acontece
if(p->state == SLEEPING && p->chan == chan)
  p->state = RUNNABLE;           // volta para a fila de prontos`,
        texto: "No xv6, o estado Pronto se chama <code>RUNNABLE</code> e o Bloqueado se chama <code>SLEEPING</code>. A E/S do jogo é exatamente isto: o driver chama <code>sleep()</code> e, quando o disco termina, a interrupção chama <code>wakeup()</code>."
      },
      linux: {
        titulo: "Os estados no Linux",
        comando: "ps -eo pid,stat,comm",
        saida: `    PID STAT COMMAND
      1 Ss   systemd
   2817 Ss   bash
   3120 R+   ps
   3001 D    dd
   3050 Z    sleep <defunct>`,
        texto: "Letras do STAT: <b>R</b> executando <i>ou</i> pronto (o Linux não separa os dois), <b>S</b> bloqueado, <b>D</b> bloqueado sem poder ser interrompido (geralmente E/S de disco), <b>Z</b> zumbi."
      },
      man: [
        { termo: "estados", secao: "7", resumo: "o ciclo de vida de um processo",
          detalhe: "Novo (sendo criado) → Pronto (na fila, esperando a CPU; RUNNABLE no xv6) → Executando (usando a CPU; RUNNING) → Bloqueado (esperando um evento, como E/S; SLEEPING) → Finalizado. No UNIX, quem termina fica Zumbi (ZOMBIE) até o pai chamar wait().",
          veja: ["STAT(7)", "zumbi(7)", "escalonador(7)"] },
        { termo: "STAT", secao: "7", resumo: "a coluna de estado do ps no Linux",
          detalhe: "R: executando ou pronto. S: bloqueado (dormindo). D: bloqueado sem poder ser interrompido (geralmente E/S de disco). Z: zumbi. T: parado. Letras extras: s = líder de sessão, l = tem várias threads, + = em primeiro plano.",
          exemplo: "ps -eo pid,stat,comm",
          veja: ["ps(1)", "estados(7)"] },
        { termo: "E/S bloqueante", secao: "7", resumo: "esperar o disco, a rede ou o teclado sem usar a CPU",
          detalhe: "O processo passa a Bloqueado (no xv6, sleep() no kernel). Quando o dispositivo termina, a interrupção chama wakeup() e o processo volta para Pronto.",
          veja: ["sleep-wakeup(kernel)", "estados(7)"] },
        { termo: "sleep-wakeup", secao: "kernel", resumo: "sleep() e wakeup() do kernel do xv6",
          detalhe: "sleep(chan, lk) marca o processo como SLEEPING esperando o canal chan e entrega a CPU. wakeup(chan) passa para RUNNABLE todos os processos dormindo naquele canal.",
          veja: ["E/S bloqueante(7)", "variável de condição(7)"] },
        { termo: "yield", secao: "kernel", resumo: "devolve a CPU e volta para a fila de prontos",
          detalhe: "Muda o estado de RUNNING para RUNNABLE e chama sched(). O processo não espera nenhum evento: só cede a vez. No xv6, a interrupção do timer chama yield() (preempção).",
          veja: ["preempção(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Os estados",
          texto: `<ul class="estados-lista">
            <li><span class="badge unused">Novo</span> sendo criado.</li>
            <li><span class="badge ready">Pronto</span> pode executar, mas espera a CPU na <b>fila de prontos</b> (xv6: <code>RUNNABLE</code>).</li>
            <li><span class="badge running">Executando</span> usando a CPU: só <b>um processo por CPU</b> (xv6: <code>RUNNING</code>).</li>
            <li><span class="badge sleeping">Bloqueado</span> espera um evento que não depende da CPU, como disco, teclado ou rede (xv6: <code>SLEEPING</code>).</li>
            <li><span class="badge zombie">Zumbi</span> terminou, mas o pai ainda não chamou <code>wait()</code> (xv6: <code>ZOMBIE</code>).</li>
          </ul>
          <p>Transições: Novo→Pronto (admissão) · Pronto→Executando (<b>despacho</b>) · Executando→Pronto (<b>fim do quantum</b>, preempção) ·
          Executando→Bloqueado (pede E/S) · Bloqueado→Pronto (o evento ocorreu) · Executando→Finalizado (término).</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O que acontece com ele?",
          contexto: "Processo P3 está executando e precisa aguardar uma leitura de disco.",
          opcoes: ["Continua Executando", "Vai para Bloqueado", "Vira Zumbi", "É destruído"],
          correta: 1,
          dica: "Ele consegue usar a CPU enquanto o disco não responde?",
          explicacao: "Um processo que espera E/S não deve ocupar a CPU: ele fica Bloqueado até o evento terminar."
        },
        {
          tipo: "multipla",
          pergunta: "A transição Executando → Pronto acontece quando…",
          opcoes: [
            "o processo pede uma leitura de disco",
            "o quantum termina e o processo é preemptado",
            "o processo chama exit()",
            "o disco termina a leitura"
          ],
          correta: 1,
          dica: "O processo ainda poderia continuar, mas perdeu a vez.",
          explicacao: "No fim do quantum (interrupção do timer), o escalonador tira a CPU do processo, que volta para a fila de prontos."
        },
        {
          tipo: "multipla",
          pergunta: "Para qual estado P3 vai?",
          contexto: "O disco terminou a leitura que P3 tinha pedido.",
          opcoes: ["Direto para Executando", "Pronto", "Zumbi", "Continua Bloqueado"],
          correta: 1,
          dica: "Acordar não é a mesma coisa que ganhar a CPU.",
          explicacao: "O evento acorda o processo (wakeup), mas ele volta para a fila de prontos: ainda precisa ser escolhido pelo escalonador."
        },
        {
          tipo: "conceito",
          titulo: "Agora é com você",
          texto: `<p>Nas simulações, <b>clique em um processo</b> para selecioná-lo e depois escolha uma <b>ação</b>.
            Cada ação provoca uma transição de estado, que pisca no diagrama ao lado.</p>
            <p>Ações inválidas custam <b>estabilidade</b>, mas sempre vêm com a explicação do porquê.</p>`
        },
        {
          tipo: "simulacao",
          pergunta: "P1 precisa ler um arquivo do disco.",
          processos: [{ nome: "P1", estado: "RUNNING" }],
          acoes: ["io", "yield", "exit", "fork"],
          objetivo: [{ processo: "P1", estado: "SLEEPING" }],
          dica: "Qual ação representa pedir algo ao disco?",
          explicacao: "Ao pedir E/S, o processo fica Bloqueado e libera a CPU para outro."
        },
        {
          tipo: "simulacao",
          pergunta: "P1 está bloqueado esperando o disco. Faça P1 voltar a executar.",
          processos: [{ nome: "P1", estado: "SLEEPING", motivo: "io" }],
          acoes: ["fimIO", "escalonar", "yield"],
          objetivo: [{ processo: "P1", estado: "RUNNING" }],
          dica: "São dois passos: primeiro o evento, depois o escalonador.",
          explicacao: "Bloqueado → Pronto quando a E/S termina; Pronto → Executando quando o escalonador faz o despacho."
        },
        {
          tipo: "simulacao",
          pergunta: "P1 está executando e P2 espera na fila. Dê a CPU para P2.",
          processos: [
            { nome: "P1", estado: "RUNNING" },
            { nome: "P2", estado: "READY" }
          ],
          acoes: ["yield", "escalonar", "io", "exit"],
          objetivo: [{ processo: "P2", estado: "RUNNING" }],
          dica: "Só existe uma CPU. Quem está nela precisa sair primeiro.",
          explicacao: "P1 devolve a CPU com yield() e o escalonador coloca P2 em execução. No xv6, o timer força esse yield() (preempção)."
        },
        {
          tipo: "ordenar",
          pergunta: "Monte o ciclo de um processo que pede E/S e depois volta para a fila.",
          itens: ["Pronto", "Executando", "Bloqueado", "Pronto"],
          dica: "Comece pelo processo esperando a CPU.",
          explicacao: "Pronto → Executando (despacho) → Bloqueado (pediu E/S) → Pronto (a E/S terminou)."
        },
        {
          tipo: "simulacao",
          pergunta: "Coloque P1 para esperar o disco e faça P2 executar.",
          processos: [
            { nome: "P1", estado: "RUNNING" },
            { nome: "P2", estado: "READY" }
          ],
          acoes: ["io", "yield", "escalonar", "exit"],
          objetivo: [
            { processo: "P1", estado: "SLEEPING" },
            { processo: "P2", estado: "RUNNING" }
          ],
          dica: "Quando P1 bloqueia, a CPU fica livre.",
          explicacao: "Quando P1 bloqueia em E/S, a CPU fica livre e o escalonador a entrega a P2: é a multiprogramação aproveitando a CPU durante a E/S."
        }
      ]
    },

    // ================================================== FASE 2.1C — Criação e término
    {
      id: "p21c",
      etapa: "2.1 C",
      titulo: "Criação e término",
      descricao: "fork, exec, wait, exit e zumbis",
      icone: "🧬",
      xv6: {
        titulo: "exit(), wait() e Ctrl-P",
        arquivo: "kernel/proc.c",
        codigo: `// exit(): o filho termina
wakeup(p->parent);       // o pai pode estar dormindo em wait()
p->xstate = status;
p->state = ZOMBIE;

// wait(): o pai procura um filho zumbi
if(pp->state == ZOMBIE){
  pid = pp->pid;         // lê o status de saída...
  freeproc(pp);          // ...e libera a entrada (UNUSED)
}

$ Ctrl-P   (procdump)
1 sleep  init
2 sleep  sh
3 sleep  zumbi
4 zombie zumbi`,
        texto: "O <code>exit()</code> deixa o processo como <b>zumbi</b> até o pai chamar <code>wait()</code>, que libera a entrada com <code>freeproc()</code>. No console do xv6, o Ctrl-P lista os processos e mostra o zumbi."
      },
      linux: {
        titulo: "Um zumbi de verdade",
        comando: "(sleep 1 & exec sleep 60) & sleep 2; ps -o pid,ppid,stat,cmd",
        saida: `    PID    PPID STAT CMD
   2817    2790 Ss   bash
   3301    2817 S    sleep 60
   3302    3301 Z    [sleep] <defunct>`,
        texto: "O <code>sleep 1</code> termina, mas o pai (agora <code>sleep 60</code>) nunca chama <code>wait()</code>: o filho fica em <b>Z</b> (<i>defunct</i>). Quando o pai morre, o órfão é adotado pelo PID 1, que o coleta."
      },
      man: [
        { termo: "fork", secao: "2", resumo: "cria um processo filho, cópia do pai",
          detalhe: "Retorna 0 no filho, o PID do filho no pai e um valor negativo em caso de erro. A memória do filho é uma cópia da do pai (copy-on-write). O filho começa como Pronto.",
          exemplo: "pid = fork();\nif(pid == 0){ /* filho */ } else if(pid > 0){ /* pai */ }",
          veja: ["exec(2)", "wait(2)", "exit(2)"] },
        { termo: "exec", secao: "2", resumo: "substitui o programa do processo por outro",
          detalhe: "O processo continua com o mesmo PID, mas passa a executar outro binário (execve no Linux). Se der certo, o exec não retorna: o código depois dele só roda em caso de erro.",
          exemplo: "execve(\"/bin/date\", argv, envp);",
          veja: ["fork(2)", "CreateProcess(win)"] },
        { termo: "CreateProcess", secao: "win", resumo: "cria um processo no Windows, já com o novo programa",
          detalhe: "Não há separação entre fork e exec: o processo é criado do zero, com espaço de endereçamento próprio, recebendo programa, argumentos e atributos de segurança. Termina com ExitProcess() ou é encerrado à força com TerminateProcess().",
          veja: ["fork(2)", "exec(2)"] },
        { termo: "exit", secao: "2", resumo: "termina o processo atual com um status",
          detalhe: "O processo vira zumbi e guarda o status até o pai chamar wait(). Se o pai estiver bloqueado em wait(), é acordado.",
          exemplo: "exit(0);",
          veja: ["wait(2)", "zumbi(7)"] },
        { termo: "wait", secao: "2", resumo: "espera um filho terminar e coleta o status dele",
          detalhe: "Se já há um filho zumbi, coleta na hora e libera a entrada. Se os filhos ainda estão vivos, o pai fica bloqueado até um deles chamar exit(). Sem filhos, retorna -1.",
          exemplo: "int status;\nint pid = wait(&status);",
          veja: ["exit(2)", "zumbi(7)"] },
        { termo: "zumbi", secao: "7", resumo: "processo que já terminou, mas ainda não foi coletado pelo pai",
          detalhe: "Não usa CPU nem a memória do programa, mas ocupa uma entrada na tabela de processos até o pai chamar wait(). No ps aparece como Z (<defunct>).",
          veja: ["wait(2)", "órfão(7)", "Ctrl-P(xv6)"] },
        { termo: "órfão", secao: "7", resumo: "processo cujo pai terminou antes dele",
          detalhe: "É adotado pelo init (PID 1), ou por um processo marcado como subreaper, que chama wait() por ele. No Windows não há hierarquia rígida: o pai recebe um handle do filho.",
          veja: ["init(7)", "zumbi(7)"] },
        { termo: "init", secao: "7", resumo: "o primeiro processo do sistema (PID 1)",
          detalhe: "Raiz da árvore de processos. No Linux moderno, geralmente é o systemd. No xv6, o init abre o console, inicia o shell e fica em laço chamando wait().",
          veja: ["órfão(7)", "pstree(1)"] },
        { termo: "ps", secao: "1", resumo: "lista processos e seus estados",
          detalhe: "Sem opções, mostra só os processos do terminal atual. ps -l mostra também o PPID; ps aux mostra todos os processos; ps -eLf mostra as threads (coluna LWP).",
          exemplo: "ps -l\nps aux\nps -eLf",
          veja: ["STAT(7)", "pstree(1)", "thread(7)"] },
        { termo: "pstree", secao: "1", resumo: "mostra os processos em forma de árvore (pai → filhos)",
          exemplo: "pstree -p",
          veja: ["ps(1)", "init(7)"] },
        { termo: "kill", secao: "1", resumo: "envia um sinal a um processo",
          detalhe: "Sem opção, envia SIGTERM (15), que pede para o processo terminar. kill -9 envia SIGKILL, que não pode ser ignorado. Também existe a chamada de sistema kill().",
          exemplo: "kill 3210\nkill -9 3210",
          veja: ["sinal(7)", "PID(7)"] },
        { termo: "sinal", secao: "7", resumo: "um aviso que o kernel entrega a um processo",
          detalhe: "Exemplos: SIGTERM (pedido de término), SIGKILL (término forçado), SIGINT (Ctrl-C), SIGCHLD (um filho terminou: o pai deve chamar wait()).",
          veja: ["kill(1)", "wait(2)"] },
        { termo: "Ctrl-P", secao: "xv6", resumo: "lista os processos no console do xv6",
          detalhe: "O kernel chama procdump(), que imprime PID, estado e nome de cada processo. O xv6 não tem o comando ps.",
          exemplo: "1 sleep  init\n2 sleep  sh\n4 zombie zumbi",
          veja: ["estados(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Criando processos: fork, exec e wait",
          texto: `<p>Processos são criados na inicialização do sistema, por chamada de sistema de outro processo, por pedido do usuário ou em tarefas em lote.</p>
            <p>No <b>UNIX</b> (POSIX):</p>
            <ul>
              <li><code>fork()</code> cria um <b>filho</b>, cópia do pai: retorna <b>0 no filho</b> e o <b>PID do filho no pai</b>.</li>
              <li><code>exec()</code> <b>substitui</b> o programa do processo por outro.</li>
              <li><code>wait()</code> faz o pai esperar o filho terminar; o filho termina com <code>exit()</code>.</li>
            </ul>
            <p>No <b>Windows</b>, <code>CreateProcess()</code> cria o processo do zero, já com o novo programa: não há separação entre fork e exec.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O que fork() retorna ao processo filho?",
          opcoes: ["O PID do pai", "O PID do filho", "0", "-1"],
          correta: 2,
          dica: "É assim que o código descobre se está no pai ou no filho.",
          explicacao: "fork() retorna 0 no filho, o PID do filho no pai e um valor negativo se falhar."
        },
        {
          tipo: "multipla",
          pergunta: "Quem imprime \"Tchau !\"?",
          contexto: `pid = fork();
if (pid > 0) wait(0);                 // pai
else execve("/bin/date", argv, envp); // filho
printf("Tchau !\\n");`,
          opcoes: [
            "Só o pai",
            "Só o filho",
            "Os dois",
            "Ninguém"
          ],
          correta: 0,
          dica: "O que sobra do código do filho depois de um execve que deu certo?",
          explicacao: "O execve substitui a imagem do filho pelo /bin/date, que nunca chega ao printf. Só o pai imprime \"Tchau !\" (o filho imprimiria só se o execve falhasse)."
        },
        {
          tipo: "multipla",
          lab: "LAB 01",
          pergunta: "Quantos processos existem ao final, contando o original?",
          contexto: `fork();
fork();
fork();`,
          opcoes: ["3", "4", "6", "8"],
          correta: 3,
          dica: "Cada fork() é executado por todos os processos que já existem naquele ponto.",
          explicacao: "Cada fork() dobra o número de processos: 1 → 2 → 4 → 8. Como no desafio do Lab 01, vale desenhar a árvore no papel."
        },
        {
          tipo: "multipla",
          pergunta: "Qual a diferença entre CreateProcess() e fork() + exec()?",
          opcoes: [
            "Não há diferença, são o mesmo mecanismo",
            "CreateProcess cria o processo já com o novo programa e espaço próprio; no UNIX cria-se uma cópia e depois troca-se o programa",
            "fork() só existe no Windows",
            "CreateProcess copia a memória do pai, como o fork()"
          ],
          correta: 1,
          dica: "Quantas etapas cada sistema usa?",
          explicacao: "No Windows o processo nasce do zero, com o programa indicado. No UNIX, fork() clona o pai e exec() troca o programa; entre os dois dá para, por exemplo, redirecionar a entrada e a saída."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          lab: "LAB 01",
          pergunta: "Liste os processos deste terminal mostrando o PID do pai (PPID) de cada um.",
          aceitar: ["ps -l", "ps -[a-zA-Z]*l[a-zA-Z]*", "ps -o \\S*ppid\\S*( \\S+)*", "ps (-e|-A|-f|-ef|-eF) ?(-o \\S*ppid\\S*)?"],
          saida: `F S   UID     PID    PPID  C PRI  NI ADDR SZ WCHAN  TTY          TIME CMD
0 S  1000    2817    2790  0  80   0 -  2520 do_wai pts/0    00:00:00 bash
0 R  1000    3330    2817  0  80   0 -  2850 -      pts/0    00:00:00 ps`,
          neutros: [
            { re: "ps", saida: "    PID TTY          TIME CMD\n   2817 pts/0    00:00:00 bash\n   3330 pts/0    00:00:00 ps",
              nota: "Sem opções, o ps não mostra o PPID. Use o formato longo (uma letra) ou escolha as colunas." }
          ],
          dica: "O formato longo do ps é a opção -l (de long).",
          explicacao: "O PPID do ps (3330) é 2817: o próprio bash. Todo processo tem um pai, e o shell é o pai dos comandos que você digita."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          lab: "LAB 01",
          pergunta: "Mostre a árvore de processos para ver quem é filho de quem.",
          inicial: "pedro@kernelplay:~$ sleep 100 &\n[1] 3210",
          aceitar: ["pstree( -[a-zA-Z]+)*( \\S+)?"],
          saida: "systemd───login───bash─┬─pstree\n                       └─sleep",
          neutros: [
            { re: "ps( .*)?", saida: "    PID TTY          TIME CMD\n   2817 pts/0    00:00:00 bash\n   3210 pts/0    00:00:00 sleep",
              nota: "O ps lista os processos, mas não desenha a relação entre pai e filho. Existe um comando que mostra a árvore." }
          ],
          dica: "O nome do comando junta ps com a palavra árvore em inglês (tree).",
          explicacao: "O systemd (PID 1) é a raiz da árvore; o bash é o pai, e o sleep e o pstree são filhos dele. Se o pai termina, o filho órfão é adotado pelo init."
        },
        {
          tipo: "simulacao",
          pergunta: "Crie um processo filho de P1.",
          processos: [{ nome: "P1", estado: "RUNNING" }],
          acoes: ["fork", "exit", "yield"],
          objetivo: [{ processo: "P2", estado: "READY" }],
          dica: "Uma chamada de sistema cria uma cópia do processo.",
          explicacao: "fork() cria o filho P2 como Pronto. O pai continua executando normalmente."
        },
        {
          tipo: "conceito",
          titulo: "Término e processos zumbis",
          texto: `<p>Um processo termina por <b>saída normal</b>, <b>saída por erro</b>, <b>erro fatal</b> (como divisão por zero ou acesso inválido à memória)
            ou <b>cancelamento externo</b> (<code>kill()</code> no UNIX, <code>TerminateProcess()</code> no Windows). Depois, o SO libera os recursos.</p>
            <p>No UNIX, o filho que terminou fica na tabela de processos até o pai chamar <code>wait()</code>: nesse intervalo ele é um
            <span class="badge zombie">Zumbi</span>. Se o pai termina sem chamar <code>wait()</code>, o filho é <b>adotado pelo init</b>, que o coleta.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O que é um processo zumbi?",
          opcoes: [
            "Um processo travado que consome 100% da CPU",
            "Um filho que já terminou, mas cuja entrada continua na tabela até o pai chamar wait()",
            "Um processo sem pai",
            "Um processo bloqueado esperando E/S"
          ],
          correta: 1,
          dica: "Ele já morreu, mas ainda não foi \"enterrado\".",
          explicacao: "O zumbi guarda o status de saída para o pai. A entrada só é liberada quando o pai chama wait(). (Processo sem pai é um órfão.)"
        },
        {
          tipo: "terminal",
          ambiente: "xv6",
          lab: "LAB 04 · xv6",
          pergunta: "O filho terminou, mas o pai ainda não chamou wait(). Liste os processos do xv6 e encontre o zumbi.",
          inicial: "$ zumbi\nfilho 4 terminou com exit(), mas o pai ainda nao chamou wait().",
          aceitar: ["\\^P", "ctrl[-+ ]?p"],
          saida: "\n1 sleep  init\n2 sleep  sh\n3 sleep  zumbi\n4 zombie zumbi",
          neutros: [
            { re: "ps( .*)?", saida: "exec ps failed", nota: "O xv6 não tem o comando ps! A lista de processos sai por um atalho de teclado no console." }
          ],
          dica: "No xv6, a lista de processos sai com uma combinação de teclas: Ctrl + uma letra.",
          explicacao: "Ctrl-P faz o kernel chamar procdump(), que imprime PID, estado e nome de cada processo. O PID 4 aparece como zombie: já terminou, mas o pai ainda não o coletou."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "O processo sleep (PID 3210) não é mais necessário. Encerre-o pelo terminal.",
          inicial: "pedro@kernelplay:~$ ps -o pid,stat,comm\n    PID STAT COMMAND\n   2817 Ss   bash\n   3210 S    sleep\n   3211 R+   ps",
          aceitar: ["kill 3210", "kill -(15|TERM|SIGTERM|9|KILL|SIGKILL) 3210", "kill -s (TERM|SIGTERM|KILL|SIGKILL) 3210",
                    "pkill sleep", "killall sleep"],
          saida: "[1]+  Terminated              sleep 100",
          neutros: [
            { re: "ps( .*)?", saida: "    PID STAT COMMAND\n   2817 Ss   bash\n   3210 S    sleep\n   3230 R+   ps",
              nota: "O sleep continua lá, com PID 3210." }
          ],
          erradas: [
            { re: "kill( -\\S+)* 2817", nota: "2817 é o próprio bash! Encerrar o shell fecharia o seu terminal." },
            { re: "kill( -\\S+)* 3211", saida: "bash: kill: (3211) - No such process", nota: "3211 era o próprio ps, que já terminou." }
          ],
          dica: "O comando que envia um sinal a um processo é o kill, seguido do PID.",
          explicacao: "kill envia um sinal ao processo (por padrão SIGTERM, que pede para ele terminar). O bash, que é o pai, coleta o filho com wait(), então não sobra zumbi."
        },
        {
          tipo: "simulacao",
          pergunta: "P1 executa sozinho. Crie um filho, faça-o executar e terminar, e garanta que P1 o colete. No fim, P1 deve estar executando de novo.",
          processos: [{ nome: "P1", estado: "RUNNING" }],
          acoes: ["fork", "yield", "escalonar", "io", "fimIO", "exit", "wait"],
          objetivo: [
            { processo: "P2", estado: "UNUSED" },
            { processo: "P1", estado: "RUNNING" }
          ],
          dica: "fork() → o pai sai da CPU (yield ou wait) → o filho executa e chama exit() → o pai volta e coleta.",
          explicacao: "Você percorreu o ciclo completo: criação (fork), execução, término (exit → Zumbi) e coleta (wait → removido da tabela)."
        }
      ]
    },

    // ================================================== FASE 2.2 — Threads
    {
      id: "p22",
      etapa: "2.2",
      titulo: "Threads",
      descricao: "Linhas de execução dentro do processo",
      icone: "🧵",
      linux: {
        titulo: "Threads no ps",
        comando: "ps -o pid,lwp,nlwp,stat,comm -L -p 268",
        saida: `  PID   LWP NLWP STAT COMMAND
  268   268    4 Sl   placar
  268   270    4 Sl   placar
  268   271    4 Sl   placar
  268   272    4 Sl   placar`,
        texto: "Um programa com 4 threads (a principal e mais 3): todas têm o <b>mesmo PID</b>, mas cada uma tem o seu <b>LWP</b> (o identificador da thread no kernel). O <b>l</b> no STAT indica um processo com várias threads. No Linux, cada thread é escalonada pelo núcleo (modelo 1:1)."
      },
      man: [
        { termo: "thread", secao: "7", resumo: "linha de execução dentro de um processo",
          detalhe: "Cada thread tem seu contador de programa, registradores, pilha e estado; compartilha com as outras o código, os dados globais, o heap e os arquivos abertos. Criar e trocar threads é mais barato que processos, mas o compartilhamento exige sincronização.",
          veja: ["modelos de threads(7)", "pthread_create(3)", "condição de disputa(7)"] },
        { termo: "modelos de threads", secao: "7", resumo: "como threads de usuário são mapeadas em threads de núcleo",
          detalhe: "N:1: várias threads de usuário numa só de núcleo (leve, mas uma E/S bloqueia todas e não há paralelismo). 1:1: cada thread de usuário tem a sua de núcleo (Linux e Windows). N:M: N threads de usuário sobre M de núcleo (Solaris, FreeBSD KSE; escalável e paralelo, porém complexo).",
          veja: ["thread(7)"] },
        { termo: "pthread_create", secao: "3", resumo: "cria uma nova thread (POSIX Threads)",
          detalhe: "Faz parte do padrão IEEE POSIX 1003.1c (1995). Compile com -lpthread (ou -pthread). Outras chamadas: pthread_exit (encerra a thread), pthread_yield (cede a CPU).",
          exemplo: "pthread_create(&t, NULL, funcao, arg);",
          veja: ["pthread_join(3)", "thread(7)"] },
        { termo: "pthread_join", secao: "3", resumo: "espera outra thread terminar",
          detalhe: "É o equivalente do wait() para threads. Chamar join logo depois de cada create deixa a execução sequencial.",
          exemplo: "pthread_join(t, NULL);",
          veja: ["pthread_create(3)"] },
        { termo: "LWP", secao: "7", resumo: "Light-Weight Process: o identificador de uma thread no Linux",
          detalhe: "No ps -eLf ou ps -L, as threads de um programa aparecem com o mesmo PID e LWPs diferentes.",
          exemplo: "ps -eLf",
          veja: ["thread(7)", "ps(1)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "O que é uma thread",
          texto: `<p class="destaque">"Se um processo já pode executar um programa inteiro, por que dividi-lo em várias linhas de execução?"</p>
            <p>O isolamento entre processos é bom para segurança, mas dificulta compartilhar dados e criar atividades simultâneas na mesma aplicação.
            Uma <b>thread</b> é uma <b>linha de execução dentro de um processo</b>: leve, compartilha os recursos do processo e tem fluxo próprio.</p>
            <ul>
              <li><b>De cada thread:</b> contador de programa, registradores, <b>pilha</b> e estado.</li>
              <li><b>Compartilhado:</b> código, dados globais, heap e arquivos abertos. ⚠ Compartilhar exige <b>sincronização</b>.</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "O que cada thread tem de próprio?",
          opcoes: ["O código", "O heap", "A pilha e os registradores", "Os arquivos abertos"],
          correta: 2,
          dica: "Cada thread chama funções diferentes ao mesmo tempo. Onde ficam as variáveis locais?",
          explicacao: "Cada thread tem sua pilha, seus registradores e seu contador de programa. Código, heap, dados globais e arquivos são do processo e ficam compartilhados."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada motivo para usar threads ao exemplo dele.",
          pares: [
            ["Responsividade", "O editor continua aceitando digitação enquanto salva"],
            ["Compartilhamento", "Revisor ortográfico e tela usam o mesmo documento"],
            ["Economia", "Criar uma thread custa menos que criar um processo"],
            ["Escalabilidade", "Cada região de uma imagem processada num núcleo"]
          ],
          dica: "Escalabilidade tem a ver com vários núcleos.",
          explicacao: "Threads mantêm a aplicação responsiva, compartilham dados sem IPC, custam menos para criar e trocar e, em multicore, executam em paralelo real."
        },
        {
          tipo: "conceito",
          titulo: "Threads de usuário, de núcleo e modelos",
          texto: `<p>Threads de <b>usuário</b> são criadas por bibliotecas e o SO <b>não as vê</b>; threads de <b>núcleo</b> são gerenciadas e escalonadas pelo SO.</p>
            <ul>
              <li><b>N:1</b>: várias de usuário sobre uma de núcleo. Leve, mas se uma thread faz E/S bloqueante, <b>todas bloqueiam</b>, e não há paralelismo.</li>
              <li><b>1:1</b>: cada thread de usuário tem a sua de núcleo. Não bloqueante e paralelo; é o modelo do <b>Linux e do Windows</b>. Pesa com muitas threads.</li>
              <li><b>N:M</b>: N de usuário sobre M de núcleo. Une escalabilidade e paralelismo, mas é <b>complexo</b> (Solaris, FreeBSD KSE).</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "No modelo N:1, o que acontece se uma thread faz uma leitura bloqueante do teclado?",
          opcoes: [
            "Só essa thread bloqueia",
            "Todo o processo bloqueia, porque a única thread de núcleo é suspensa",
            "O SO cria outra thread de núcleo",
            "Nada: threads de usuário nunca bloqueiam"
          ],
          correta: 1,
          dica: "Quantas threads de núcleo o SO enxerga nesse processo?",
          explicacao: "O núcleo só vê uma thread. Quando ela é suspensa pela E/S, todas as threads de usuário do processo param junto."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada modelo de threads à sua característica.",
          pares: [
            ["N:1", "Uma E/S bloqueante para todas as threads"],
            ["1:1", "Modelo do Linux e do Windows"],
            ["N:M", "Escalável e paralelo, mas complexo de implementar"]
          ],
          dica: "O modelo mais usado nos SOs atuais é o mais simples de explicar.",
          explicacao: "N:1 é leve, mas bloqueante e sem paralelismo; 1:1 é o padrão do Linux e do Windows; N:M tenta unir as vantagens dos dois, ao custo de complexidade."
        },
        {
          tipo: "multipla",
          pergunta: "Qual thread imprime \"Hello World\" primeiro?",
          contexto: `for (long i = 0; i < 5; i++)
  pthread_create(&thread[i], NULL, print_hello, (void *) i);`,
          opcoes: ["A thread 0", "A thread 4", "Não é possível saber: depende do escalonador", "A thread main"],
          correta: 2,
          dica: "Quem decide qual thread executa primeiro?",
          explicacao: "A ordem depende do escalonador e pode mudar a cada execução. Não se pode supor ordem entre threads concorrentes."
        },
        {
          tipo: "multipla",
          pergunta: "O que acontece neste laço?",
          contexto: `for (i = 0; i < 5; i++) {
  pthread_create(&thread[i], NULL, print_hello, (void *) i);
  pthread_join(thread[i], NULL);
}`,
          opcoes: [
            "As 5 threads executam ao mesmo tempo",
            "As threads executam uma de cada vez (0, depois 1, depois 2…)",
            "Nenhuma thread executa",
            "Só a última thread executa"
          ],
          correta: 1,
          dica: "pthread_join espera a thread terminar antes de voltar ao laço.",
          explicacao: "Como o join vem logo depois de cada create, a próxima thread só é criada quando a anterior termina: execução sequencial. Para ficar concorrente, crie todas e depois faça os joins."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          lab: "LAB 01",
          pergunta: "O programa placar (PID 268) criou 3 threads. Liste as threads dos processos do sistema.",
          aceitar: ["ps -eLf", "ps -eLF", "ps -Lf?( -p 268)?", "ps -L -p 268", "ps -eL", "ps -[a-zA-Z]*L[a-zA-Z]*( .*)?", "ps .*-L.*"],
          saida: `UID          PID    PPID     LWP  C NLWP STIME TTY          TIME CMD
pedro      2817    2790    2817  0    1 09:12 pts/0    00:00:00 bash
pedro       268    2817     268  0    4 09:30 pts/0    00:00:00 ./placar
pedro       268    2817     270  0    4 09:30 pts/0    00:00:00 ./placar
pedro       268    2817     271  0    4 09:30 pts/0    00:00:00 ./placar
pedro       268    2817     272  0    4 09:30 pts/0    00:00:00 ./placar`,
          neutros: [
            { re: "ps( (aux|-e|-ef|-A|-l))?", nota: "Assim cada processo aparece uma vez só. Falta a opção que mostra uma linha por thread (Light-weight process)." }
          ],
          dica: "A opção do ps que mostra as threads é a letra L (de light-weight process).",
          explicacao: "As 4 linhas do placar têm o mesmo PID (268) e LWPs diferentes: são threads do mesmo processo. Processos criados por fork() teriam PIDs diferentes."
        },
        {
          tipo: "multipla",
          lab: "LAB 01",
          pergunta: "O Chrome teria os mesmos benefícios se abrisse cada site numa thread em vez de num processo?",
          opcoes: [
            "Sim, e ainda seria mais rápido",
            "Não: threads compartilham a memória, então o travamento ou uma falha explorada num site afetaria o navegador inteiro",
            "Sim, porque threads também têm memória isolada",
            "Não, porque threads não podem acessar a rede"
          ],
          correta: 1,
          dica: "Lembre do experimento de fechar uma aba e ver o processo sumir.",
          explicacao: "Processos isolam memória e permissões: se uma aba trava, as outras sobrevivem (robustez e segurança). Dentro de cada processo, o navegador usa threads para tarefas que compartilham dados."
        }
      ]
    },

    // ================================================== FASE 2.3 — IPC e condição de disputa
    {
      id: "p23",
      etapa: "2.3",
      titulo: "Comunicação e disputa",
      descricao: "IPC, condição de disputa e exclusão mútua",
      icone: "🔀",
      xv6: {
        titulo: "Um spinlock de verdade",
        arquivo: "kernel/spinlock.c",
        codigo: `void
acquire(struct spinlock *lk)
{
  push_off(); // desliga interrupções para evitar deadlock
  if(holding(lk))
    panic("acquire");

  // No RISC-V vira uma troca atômica (amoswap):
  // testa e marca o lock numa única instrução
  while(__sync_lock_test_and_set(&lk->locked, 1) != 0)
    ;       // espera ocupada

  __sync_synchronize();   // barreira de memória
  lk->cpu = mycpu();
}`,
        texto: "O kernel do xv6 resolve a exclusão mútua com uma <b>operação atômica</b> (test-and-set): o teste e a escrita de <code>locked</code> acontecem numa única instrução, o que corrige a falha da solução trivial com <code>busy</code>. Ainda é espera ocupada, por isso só é usado em trechos curtos."
      },
      linux: {
        titulo: "Um pipe no shell",
        comando: "ps aux | grep sleep",
        saida: `pedro       3210  0.0  0.0   8392  1024 pts/0    S    09:40   0:00 sleep 100
pedro       3411  0.0  0.0   9212  2304 pts/0    S+   09:41   0:00 grep sleep`,
        texto: "O <code>|</code> cria um <b>pipe</b>: a saída do <code>ps</code> vira a entrada do <code>grep</code>. É um canal unidirecional, 1:1, orientado a fluxo e confiável, com capacidade finita (64 KB no Linux)."
      },
      man: [
        { termo: "IPC", secao: "7", resumo: "Inter-Process Communication: mecanismos de comunicação entre processos",
          detalhe: "Processos distintos não compartilham variáveis, então se comunicam via núcleo: pipes, filas de mensagens, sockets e memória compartilhada. Aspectos: direta/indireta, síncrona/assíncrona/semissíncrona, mensagens/fluxo, capacidade, confiabilidade e número de participantes.",
          veja: ["pipe(7)", "memória compartilhada(7)"] },
        { termo: "pipe", secao: "7", resumo: "canal unidirecional que liga a saída de um processo à entrada de outro",
          detalhe: "Local, 1:1, síncrono, orientado a fluxo, confiável e de capacidade finita (64 KB no Linux). Pipes nomeados (FIFOs) são criados com mkfifo. No xv6, o pingpong do laboratório usa dois pipes.",
          exemplo: "who | grep marcos | sort",
          veja: ["IPC(7)", "produtor-consumidor(7)"] },
        { termo: "memória compartilhada", secao: "7", resumo: "área de memória acessada diretamente por vários processos",
          detalhe: "O núcleo só cria e mapeia a área; o acesso ao conteúdo não passa por ele, por isso é o mecanismo mais rápido. Em compensação, o acesso simultâneo pode gerar condições de disputa. POSIX: shm_open, mmap.",
          veja: ["condição de disputa(7)"] },
        { termo: "condição de disputa", secao: "7", resumo: "race condition: o resultado depende da ordem de execução",
          detalhe: "Ocorre quando dois ou mais processos ou threads acessam o mesmo dado, pelo menos um o modifica e o resultado depende do entrelaçamento. São erros dinâmicos: não aparecem no código e são difíceis de reproduzir. Leituras concorrentes nunca geram disputa (condições de Bernstein).",
          veja: ["região crítica(7)", "exclusão mútua(7)"] },
        { termo: "região crítica", secao: "7", resumo: "trecho do programa que acessa dados ou recursos compartilhados",
          detalhe: "Deve ser a menor possível: protege-se só a operação que precisa ser indivisível, não o programa inteiro.",
          veja: ["exclusão mútua(7)"] },
        { termo: "exclusão mútua", secao: "7", resumo: "garantir que só um processo por vez esteja na região crítica",
          detalhe: "Quatro requisitos: nunca dois na região crítica ao mesmo tempo; nada se supõe sobre velocidades ou número de CPUs; quem está fora não bloqueia os outros; ninguém espera para sempre.",
          veja: ["Peterson(7)", "mutex(7)", "semáforo(7)"] },
        { termo: "espera ocupada", secao: "7", resumo: "busy waiting: testar uma condição num laço, gastando CPU",
          detalhe: "Usada pelas soluções de alternância de turno, Peterson e spinlocks. Desperdiça processamento e pode causar inversão de prioridade.",
          veja: ["Peterson(7)", "spinlock(kernel)"] },
        { termo: "Peterson", secao: "7", resumo: "solução de exclusão mútua para duas tarefas (1981)",
          detalhe: "Usa a intenção de entrar (wants[]), a vez (turn) e uma espera condicional: só espera se o outro também quer entrar e é a vez dele. Garante exclusão mútua e espera limitada, mas usa espera ocupada.",
          veja: ["espera ocupada(7)"] },
        { termo: "spinlock", secao: "kernel", resumo: "trava com espera ocupada baseada numa operação atômica",
          detalhe: "No xv6, acquire() usa test-and-set (amoswap no RISC-V) e desliga as interrupções da CPU enquanto segura o lock.",
          veja: ["espera ocupada(7)", "exclusão mútua(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Comunicação entre processos (IPC)",
          texto: `<p class="destaque">"Você copia um texto no navegador e cola em outro programa… como acontece essa comunicação?"</p>
            <p>Threads do mesmo processo se comunicam por variáveis. <b>Processos distintos</b> não compartilham memória e se comunicam
            <b>via núcleo</b>, com chamadas de sistema: são os mecanismos de <b>IPC</b>.</p>
            <ul>
              <li><b>Direta</b> (emissor e receptor se conhecem) × <b>indireta</b> (via um canal do SO).</li>
              <li><b>Síncrona</b> (bloqueia) × <b>assíncrona</b> (retorna na hora) × <b>semissíncrona</b> (bloqueia até um prazo).</li>
              <li><b>Mensagens</b> (pacotes inteiros, como UDP) × <b>fluxo</b> (bytes contínuos, como pipes e TCP).</li>
            </ul>
            <p>Mecanismos: <b>pipes</b>, <b>sockets</b>, <b>filas de mensagens</b> e <b>memória compartilhada</b> (a mais rápida,
            porque o acesso não passa pelo núcleo; mas aí surgem as disputas).</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Um pipe UNIX é…",
          opcoes: [
            "unidirecional, 1:1 e orientado a fluxo",
            "bidirecional e orientado a mensagens",
            "M:N, com várias leituras e escritas independentes",
            "não confiável, como o UDP"
          ],
          correta: 0,
          dica: "No comando who | grep, os dados só andam num sentido.",
          explicacao: "O pipe liga a saída de um processo à entrada de outro, num só sentido, como um fluxo de bytes confiável e de capacidade finita."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada mecanismo de IPC à sua característica.",
          pares: [
            ["Pipe", "Canal unidirecional de bytes entre dois processos"],
            ["Fila de mensagens", "Mailbox: cada mensagem vai para um receptor"],
            ["Memória compartilhada", "Acesso direto, sem passar pelo núcleo"],
            ["Socket", "Endereço IP + porta, inclusive entre máquinas"]
          ],
          dica: "Só um deles funciona entre computadores diferentes.",
          explicacao: "Pipes são fluxos 1:1; filas de mensagens são mailboxes; a memória compartilhada é a mais rápida; sockets permitem comunicação pela rede."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No pingpong do laboratório, por que foram criados dois pipes entre pai e filho?",
          contexto: `pipe(pai_filho);   // pai escreve, filho lê
pipe(filho_pai);   // filho escreve, pai lê`,
          opcoes: [
            "Porque cada pipe só suporta um byte",
            "Porque o pipe é unidirecional: um canal para cada sentido",
            "Porque o xv6 exige dois pipes por fork()",
            "Por desempenho: dois pipes são mais rápidos que um"
          ],
          correta: 1,
          dica: "O ping vai do pai para o filho; o pong volta do filho para o pai.",
          explicacao: "Cada pipe leva dados num só sentido. Para o ping (pai → filho) e o pong (filho → pai), são necessários dois."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Use um pipe para mostrar só as linhas da lista de processos que contêm a palavra sleep.",
          inicial: "pedro@kernelplay:~$ sleep 100 &\n[1] 3210",
          aceitar: ["ps( -?\\S+)* ?\\| ?grep (\"|')?sleep(\"|')?"],
          saida: "pedro       3210  0.0  0.0   8392  1024 pts/0    S    09:40   0:00 sleep 100\npedro       3411  0.0  0.0   9212  2304 pts/0    S+   09:41   0:00 grep sleep",
          neutros: [
            { re: "ps( .*)?", nota: "Isso lista tudo. Ligue a saída do ps à entrada de um filtro com o símbolo de pipe." },
            { re: "grep( .*)?", nota: "O grep sozinho fica esperando dados no teclado. Ele precisa receber a saída do ps pelo pipe." }
          ],
          dica: "Comando que lista processos, o símbolo |, e o filtro grep sleep.",
          explicacao: "O shell cria um pipe e dois processos: a saída do ps vira a entrada do grep, que filtra as linhas. Repare que o próprio grep aparece na lista."
        },
        {
          tipo: "conceito",
          titulo: "Condição de disputa",
          texto: `<p>Duas tarefas depositam R$ 50 e R$ 1000 numa conta com R$ 0 usando <code>(*saldo) += valor;</code>,
            que vira <b>ler → somar → escrever</b>. Se as duas leem 0 antes de alguma escrever, um depósito se perde:
            o saldo final fica R$ 50 ou R$ 1000, em vez de R$ 1050.</p>
            <p>Há <b>condição de disputa</b> quando: (1) duas ou mais tarefas acessam o <b>mesmo dado</b>, (2) <b>pelo menos uma escreve</b> e
            (3) o <b>resultado depende da ordem</b>. São <b>erros dinâmicos</b>: não aparecem no código e só surgem em certos entrelaçamentos.</p>
            <p>O trecho que acessa o dado compartilhado é a <b>região crítica</b>, e deve ser o menor possível.</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene o entrelaçamento que faz um depósito se perder (saldo inicial R$ 0).",
          itens: [
            "Tarefa A lê saldo = 0",
            "Tarefa B lê saldo = 0",
            "Tarefa A escreve saldo = 50",
            "Tarefa B escreve saldo = 1000"
          ],
          dica: "As duas precisam ler antes de qualquer uma escrever.",
          explicacao: "As duas leram 0; a última escrita vence. O depósito de A se perdeu e o saldo final é 1000, não 1050."
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "Por que o corrida_dados.c às vezes não chega a 2.000.000?",
          contexto: `// duas threads, cada uma faz 1.000.000 de vezes:
contador++;

Esperado: 2000000
Obtido: 1406574`,
          opcoes: [
            "Porque a CPU perde instruções quando esquenta",
            "Porque contador++ é ler-somar-escrever: as threads se entrelaçam e incrementos se perdem",
            "Porque o long não comporta 2.000.000",
            "Porque pthread_join encerra as threads antes do fim"
          ],
          correta: 1,
          dica: "contador++ parece uma instrução só, mas não é.",
          explicacao: "É uma condição de disputa: as duas threads leem o mesmo valor e escrevem por cima. Em algumas execuções nada se perde, por isso o erro é difícil de reproduzir."
        },
        {
          tipo: "multipla",
          pergunta: "Duas tarefas apenas leem a mesma variável. Há condição de disputa?",
          opcoes: ["Sim, sempre", "Não: leituras concorrentes não modificam o dado", "Só em multiprocessadores", "Só se forem threads"],
          correta: 1,
          dica: "Lembre dos três ingredientes da disputa.",
          explicacao: "Pelas condições de Bernstein, só há disputa se pelo menos uma das tarefas escreve. Leituras em paralelo são seguras."
        },
        {
          tipo: "conceito",
          titulo: "Exclusão mútua: soluções",
          texto: `<p><b>Quatro requisitos:</b> nunca dois na região crítica; nada se supõe sobre velocidades ou número de CPUs;
            quem está fora não bloqueia os outros; ninguém espera para sempre.</p>
            <ul>
              <li><b>Inibir interrupções</b>: perigoso e inútil em multiprocessadores (só dentro do núcleo).</li>
              <li><b>Variável <code>busy</code></b>: <b>não funciona</b>, porque o teste e a atribuição não são atômicos.</li>
              <li><b>Alternância de turno</b>: garante a exclusão, mas obriga a alternar: se A não quer entrar, B fica impedido.</li>
              <li><b>Peterson</b> (1981): intenção de entrar + vez + espera condicional. Funciona para duas tarefas, mas usa <b>espera ocupada</b>.</li>
              <li><b>Operações atômicas</b> (TSL, XCHG): testam e alteram numa instrução só; base dos <i>spinlocks</i>.</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "Por que a solução com a variável busy falha?",
          contexto: `void enter() { while (busy) {}; busy = 1; }`,
          opcoes: [
            "Porque busy deveria começar em 1",
            "Porque o teste e a atribuição não são atômicos: uma troca de contexto entre eles deixa duas tarefas entrarem",
            "Porque while não funciona com inteiros",
            "Porque leave() nunca é chamado"
          ],
          correta: 1,
          dica: "O que acontece se a CPU trocar de tarefa logo depois do while?",
          explicacao: "As duas tarefas podem ver busy = 0 antes de alguma escrever 1. O teste e a marcação precisam ser uma operação só (atômica)."
        },
        {
          tipo: "multipla",
          pergunta: "Qual requisito a alternância de turno viola?",
          opcoes: [
            "Nunca dois na região crítica",
            "Um processo fora da região crítica não pode bloquear outro",
            "Nada se supõe sobre a velocidade dos processos",
            "Nenhum: a alternância de turno é perfeita"
          ],
          correta: 1,
          dica: "Se A não quiser entrar na sua vez, o que acontece com B?",
          explicacao: "Com turn = 0, B não entra mesmo que A nem queira usar a região crítica: quem está fora bloqueia o outro."
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "No laboratório, o peterson.c e o mutex_contador.c sempre chegam a 2.000.000. Qual é a desvantagem do Peterson em relação ao mutex?",
          opcoes: [
            "O Peterson às vezes erra a conta",
            "O Peterson usa espera ocupada: a thread que espera fica girando no while, gastando CPU",
            "O Peterson funciona para qualquer número de threads, o mutex não",
            "Não há diferença nenhuma"
          ],
          correta: 1,
          dica: "Olhe o while (interesse[outro] && vez == outro) { }.",
          explicacao: "Os dois garantem a exclusão mútua, mas no Peterson quem espera fica testando em laço (busy waiting). Um mutex do pthread pode suspender a thread até o lock ficar livre."
        }
      ]
    },

    // ================================================== FASE 2.4 — Semáforos e monitores
    {
      id: "p24",
      etapa: "2.4",
      titulo: "Semáforos e monitores",
      descricao: "Mecanismos de coordenação",
      icone: "🚦",
      xv6: {
        titulo: "sleep() precisa de um lock",
        arquivo: "kernel/proc.c",
        codigo: `void
sleep(void *chan, struct spinlock *lk)
{
  struct proc *p = myproc();

  acquire(&p->lock);   // pega o lock do processo...
  release(lk);         // ...e só então solta o lock da condição

  p->chan = chan;      // dorme esperando o "canal"
  p->state = SLEEPING;
  sched();

  p->chan = 0;         // acordou
  release(&p->lock);
  acquire(lk);         // volta segurando o lock da condição
}`,
        texto: "O <code>sleep(chan, lk)</code> do xv6 funciona como o <code>pthread_cond_wait(&cond, &mutex)</code>: solta o lock enquanto dorme e o readquire ao acordar, sem perder um <code>wakeup</code> no meio do caminho."
      },
      linux: {
        titulo: "8 alunos, 3 computadores",
        comando: "gcc semaforo.c -o semaforo -pthread && ./semaforo",
        saida: `Aluno 1 chegou.
Aluno 3 chegou.
Aluno 3 CONSEGUIU um computador.
Aluno 1 CONSEGUIU um computador.
Aluno 4 chegou.
Aluno 4 CONSEGUIU um computador.
Aluno 5 chegou.
Aluno 6 chegou.
Aluno 7 chegou.
Aluno 8 chegou.
Aluno 2 chegou.
Aluno 3 LIBEROU o computador.
Aluno 1 LIBEROU o computador.
Aluno 4 LIBEROU o computador.
Aluno 6 CONSEGUIU um computador.
...`,
        texto: "O programa do Lab 02 com <code>sem_init(&computadores, 0, 3)</code>: só 3 alunos usam computador ao mesmo tempo; os outros ficam bloqueados no <code>sem_wait</code> até alguém fazer <code>sem_post</code>. A ordem muda a cada execução."
      },
      man: [
        { termo: "semáforo", secao: "7", resumo: "contador + fila de tarefas, acessado só por down e up atômicos (Dijkstra, 1965)",
          detalhe: "down(s) (P, wait) decrementa e, se ficar negativo, suspende a tarefa na fila, sem espera ocupada. up(s) (V, signal) incrementa e acorda uma tarefa. Iniciado em 1, faz exclusão mútua; iniciado em N, controla N recursos. POSIX: sem_init, sem_wait, sem_post.",
          exemplo: "sem_wait(&computadores);\n/* usa o recurso */\nsem_post(&computadores);",
          veja: ["mutex(7)", "monitor(7)", "produtor-consumidor(7)"] },
        { termo: "mutex", secao: "7", resumo: "semáforo binário simplificado: lock e unlock",
          exemplo: "pthread_mutex_lock(&mutex);\ncontador++;\npthread_mutex_unlock(&mutex);",
          veja: ["semáforo(7)", "exclusão mútua(7)"] },
        { termo: "variável de condição", secao: "7", resumo: "permite esperar uma condição dentro de uma região protegida",
          detalhe: "wait(c, m) solta o mutex e dorme; signal/notify acorda uma tarefa; broadcast acorda todas. A condição deve ser testada num while, porque pode ter mudado até a tarefa voltar a executar.",
          exemplo: "while (!item_disponivel)\n  pthread_cond_wait(&cond, &mutex);",
          veja: ["monitor(7)", "sleep-wakeup(kernel)"] },
        { termo: "monitor", secao: "7", resumo: "módulo que encapsula dados compartilhados e garante exclusão mútua automática",
          detalhe: "Proposto por Hoare (1974) e formalizado por Brinch Hansen (1975). Só um processo por vez fica ativo dentro do monitor, e quem garante isso é a linguagem ou o compilador. Em Java, todo objeto tem um monitor (synchronized, wait, notify, notifyAll). Não elimina deadlocks.",
          veja: ["synchronized(java)", "semáforo(7)"] },
        { termo: "synchronized", secao: "java", resumo: "usa o monitor de um objeto em Java",
          detalhe: "Num método, só uma thread por vez o executa no mesmo objeto. Num bloco (synchronized(obj) { ... }), protege só o trecho necessário, reduzindo o tempo bloqueado.",
          exemplo: "public synchronized void inserir(int v) { ... }",
          veja: ["monitor(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Semáforos, mutexes e variáveis de condição",
          texto: `<p>Um <b>semáforo</b> (Dijkstra, 1965) é um contador com uma fila, usado só por duas operações <b>atômicas</b>:</p>
            <ul>
              <li><code>down(s)</code> (P, <i>wait</i>): decrementa; se ficar negativo, a tarefa é <b>suspensa</b> na fila, sem espera ocupada.</li>
              <li><code>up(s)</code> (V, <i>signal</i>): incrementa; se há tarefas esperando, <b>acorda</b> uma.</li>
            </ul>
            <p>Iniciado em <b>1</b>, dá exclusão mútua; iniciado em <b>N</b>, controla N recursos. O <b>mutex</b> é um semáforo binário simplificado
            (<code>lock</code>/<code>unlock</code>). A <b>variável de condição</b> deixa uma tarefa esperar uma condição sem gastar CPU.</p>`
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "No semaforo.c do laboratório, quantos alunos usam computador ao mesmo tempo, no máximo?",
          contexto: `#define ALUNOS 8
sem_init(&computadores, 0, 3);`,
          opcoes: ["1", "3", "8", "Depende do escalonador"],
          correta: 1,
          dica: "O último argumento do sem_init é o valor inicial do contador.",
          explicacao: "O semáforo começa em 3: os três primeiros sem_wait passam e o quarto aluno fica bloqueado até alguém chamar sem_post."
        },
        {
          tipo: "multipla",
          pergunta: "O que acontece se o programador inverter as operações?",
          contexto: `up(mutex);
/* região crítica */
down(mutex);`,
          opcoes: [
            "Nada: a ordem não importa",
            "Todos os processos podem entrar na região crítica ao mesmo tempo",
            "O programa não compila",
            "Só o primeiro processo entra"
          ],
          correta: 1,
          dica: "up() incrementa o contador logo de cara.",
          explicacao: "Com o up antes, ninguém é barrado na entrada: a exclusão mútua deixa de existir. Esse tipo de erro sutil é a motivação dos monitores."
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "No condicao.c, o consumidor chama pthread_cond_wait. O que ele faz enquanto o item não fica pronto?",
          contexto: `pthread_mutex_lock(&mutex);
while (!item_disponivel)
    pthread_cond_wait(&cond, &mutex);`,
          opcoes: [
            "Fica testando item_disponivel sem parar, gastando CPU",
            "Solta o mutex e dorme sem gastar CPU, até o produtor chamar pthread_cond_signal",
            "Encerra a thread",
            "Segura o mutex, impedindo o produtor de trabalhar"
          ],
          correta: 1,
          dica: "Se ele segurasse o mutex dormindo, o produtor nunca conseguiria produzir.",
          explicacao: "pthread_cond_wait solta o mutex e suspende a thread; quando o produtor sinaliza, ela acorda já com o mutex de volta e testa a condição de novo."
        },
        {
          tipo: "conceito",
          titulo: "Monitores",
          texto: `<p>Semáforos funcionam, mas um <code>down</code>/<code>up</code> fora do lugar quebra tudo e é difícil de testar.
            O <b>monitor</b> (Hoare, 1974; Brinch Hansen, 1975) agrupa <b>dados compartilhados</b> e as <b>operações</b> sobre eles,
            como um tipo abstrato de dados.</p>
            <ul>
              <li>Só <b>um processo por vez</b> fica ativo dentro do monitor.</li>
              <li>Quem garante isso é a <b>linguagem ou o compilador</b>, e não o programador.</li>
              <li>Em <b>Java</b>, todo objeto tem um monitor: <code>synchronized</code> em métodos ou em blocos, com <code>wait()</code>, <code>notify()</code> e <code>notifyAll()</code>.</li>
            </ul>
            <p>Limites: as condições de espera ainda são do programador, e a ordem das chamadas ainda pode gerar bloqueios.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Quem garante a exclusão mútua num monitor?",
          opcoes: ["O programador, com down e up", "A linguagem ou o compilador", "O hardware", "O usuário"],
          correta: 1,
          dica: "A ideia do monitor é tirar essa responsabilidade do programador.",
          explicacao: "Ao chamar um procedimento do monitor, a linguagem verifica se há outro processo ativo e bloqueia se houver. O programador não insere down/up."
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "No MonitorExemplo.java, por que o teste usa while e não if?",
          contexto: `public synchronized void inserir(int valor) throws InterruptedException {
    while (cheio) {
        wait();
    }
    item = valor;
    cheio = true;
    notifyAll();
}`,
          opcoes: [
            "Por estilo: if funcionaria igual",
            "Porque, ao acordar, a condição pode ter mudado de novo (outra thread pode ter agido antes); é preciso testar outra vez",
            "Porque wait() só funciona dentro de laços",
            "Para a thread gastar menos memória"
          ],
          correta: 1,
          dica: "O notifyAll() acorda todas as threads que esperavam.",
          explicacao: "Entre ser acordada e voltar a executar, outra thread pode ter mudado o estado (e o Java permite despertares espúrios). Com while, a thread só segue se a condição continuar verdadeira."
        },
        {
          tipo: "multipla",
          pergunta: "Verdadeiro ou falso: monitores eliminam totalmente a possibilidade de deadlock.",
          opcoes: ["Verdadeiro", "Falso"],
          correta: 1,
          dica: "Pense em duas threads chamando dois monitores em ordens diferentes.",
          explicacao: "Falso. Monitores evitam erros de down/up, mas a ordem das chamadas entre monitores ainda pode causar bloqueios."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada mecanismo à sua característica.",
          pares: [
            ["Semáforo", "Contador com down e up controlados pelo programador"],
            ["Mutex", "Semáforo binário: lock e unlock"],
            ["Variável de condição", "Esperar uma condição sem gastar CPU"],
            ["Monitor", "Exclusão mútua automática garantida pela linguagem"]
          ],
          dica: "Do mais básico (contador) ao mais alto nível (linguagem).",
          explicacao: "Semáforos são o mecanismo básico; mutexes são o caso binário; variáveis de condição esperam eventos; monitores encapsulam tudo isso na linguagem."
        }
      ]
    },

    // ================================================== FASE 2.5 — Escalonamento
    {
      id: "p25",
      etapa: "2.5",
      titulo: "Escalonamento",
      descricao: "Quem usa a CPU, e quando",
      icone: "⏱",
      xv6: {
        titulo: "O escalonador do xv6",
        arquivo: "kernel/proc.c",
        codigo: `// scheduler(): laço infinito de cada CPU
for(p = proc; p < &proc[NPROC]; p++) {
  acquire(&p->lock);
  if(p->state == RUNNABLE) {
    p->state = RUNNING;       // despacho: Pronto -> Executando
    c->proc = p;
    swtch(&c->context, &p->context);   // troca de contexto
    c->proc = 0;
  }
  release(&p->lock);
}`,
        texto: "O xv6 usa <b>Round-Robin</b> simples: percorre a tabela e executa o próximo processo RUNNABLE. A interrupção do timer chama <code>yield()</code>, que tira a CPU de quem está executando (preempção)."
      },
      linux: {
        titulo: "Classes de escalonamento do Linux",
        comando: "chrt -p $$",
        saida: `pid 2817's current scheduling policy: SCHED_OTHER
pid 2817's current scheduling priority: 0`,
        texto: "O bash usa <code>SCHED_OTHER</code> (= NORMAL), a classe padrão das tarefas interativas. Há também <code>SCHED_DEADLINE</code> (EDF), <code>SCHED_FIFO</code>, <code>SCHED_RR</code>, <code>SCHED_BATCH</code> e <code>SCHED_IDLE</code>. As classes normais usaram o CFS até o kernel 6.5; a partir do 6.6, usam o EEVDF."
      },
      man: [
        { termo: "escalonador", secao: "7", resumo: "decide qual processo da fila de prontos usa a CPU, e quando trocar",
          detalhe: "Atua quando um processo termina, bloqueia, volta à fila ou o quantum acaba. Objetivos variam: tempo real (cumprir prazos), interativos (tempo de resposta), lote (vazão).",
          veja: ["FCFS(7)", "Round-Robin(7)", "SJF(7)", "prioridades(7)"] },
        { termo: "quantum", secao: "7", resumo: "fatia de tempo de CPU dada a cada processo antes da preempção",
          detalhe: "Curto: mais interatividade, mas muitas trocas de contexto e baixa eficiência. Longo: mais vazão, menos interatividade.",
          veja: ["Round-Robin(7)", "troca de contexto(7)"] },
        { termo: "preempção", secao: "7", resumo: "tirar a CPU de um processo que não a liberou",
          detalhe: "Escalonadores preemptivos (Linux, Windows NT) interrompem o processo no fim do quantum ou quando chega uma tarefa mais prioritária. Os cooperativos (lote, Windows 3.x) esperam o processo terminar ou bloquear.",
          veja: ["yield(kernel)", "quantum(7)"] },
        { termo: "FCFS", secao: "7", resumo: "First Come, First Served: atende na ordem de chegada",
          detalhe: "Simples e não preemptivo. Sofre o efeito comboio: tarefas curtas esperam atrás de uma longa.",
          veja: ["escalonador(7)"] },
        { termo: "Round-Robin", secao: "7", resumo: "FCFS com preempção por quantum, em fila circular",
          detalhe: "Justo e bom para sistemas interativos, mas faz mais trocas de contexto. É o algoritmo do escalonador do xv6.",
          veja: ["quantum(7)", "FCFS(7)"] },
        { termo: "SJF", secao: "7", resumo: "Shortest Job First: a tarefa mais curta primeiro (SRTF é a versão preemptiva)",
          detalhe: "Dá os menores tempos médios de espera (o SRTF é o ótimo), mas exige estimar a duração e pode causar inanição das tarefas longas.",
          veja: ["inanição(7)"] },
        { termo: "prioridades", secao: "7", resumo: "escalonamento pela prioridade de cada tarefa",
          detalhe: "Pode ser cooperativo (PRIOc) ou preemptivo (PRIOp). Fatores externos (usuário, importância) e internos (idade, duração, interatividade). Sem cuidado, causa inanição; a solução é o envelhecimento (aging).",
          veja: ["inanição(7)"] },
        { termo: "inanição", secao: "7", resumo: "starvation: uma tarefa nunca consegue o recurso",
          detalhe: "Acontece com prioridades, SJF e SRTF. O envelhecimento (aging) aumenta a prioridade de quem espera. Caso famoso: ao desligar o IBM 7094 do MIT em 1973, achou-se uma tarefa de 1967 que nunca tinha executado.",
          veja: ["prioridades(7)", "SJF(7)"] },
        { termo: "loteria", secao: "7", resumo: "sorteio de bilhetes para decidir quem usa a CPU",
          detalhe: "A chance de cada processo é bilhetes dele / total de bilhetes. Pouco previsível; inanição é possível, mas improvável.",
          veja: ["prioridades(7)"] },
        { termo: "afinidade", secao: "7", resumo: "manter um processo na mesma CPU para aproveitar o cache",
          detalhe: "Em multiprocessadores, o balanceamento de carga move processos entre CPUs (push e pull migration), mas a afinidade evita mudanças desnecessárias.",
          veja: ["escalonador(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Escalonamento",
          texto: `<p class="destaque">"Se vários processos estão prontos para executar… como o SO decide quem usa a CPU primeiro?"</p>
            <p>Os processos prontos esperam na <b>fila de prontos</b>, e o <b>escalonador</b> escolhe quem executa. Ele atua quando um processo
            termina, bloqueia, volta para a fila ou quando o <b>quantum</b> acaba (interrupção do relógio).</p>
            <ul>
              <li><b>Tempo de execução</b> (<i>turnaround</i>, Tt): da criação ao fim.</li>
              <li><b>Tempo de espera</b> (Tw): tempo na <b>fila de prontos</b>, sem contar a espera por E/S.</li>
              <li><b>Tempo de resposta</b>: do evento (uma tecla) ao resultado (o caractere na tela).</li>
            </ul>
            <p><b>Preemptivo</b> (interrompe pelo quantum; interativos) × <b>cooperativo</b> (só troca quando o processo termina ou bloqueia; lote).</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O tempo de espera inclui o tempo bloqueado em E/S?",
          opcoes: ["Sim", "Não: só o tempo na fila de prontos", "Só em sistemas interativos", "Só no Round-Robin"],
          correta: 1,
          dica: "O escalonador só controla a fila de prontos.",
          explicacao: "Tw mede quanto tempo o processo esteve pronto, mas sem CPU. A espera por E/S não depende do escalonador."
        },
        {
          tipo: "multipla",
          pergunta: "Um quantum muito pequeno causa…",
          opcoes: [
            "efeito comboio",
            "muitas trocas de contexto e baixa eficiência",
            "inanição dos processos curtos",
            "deadlock"
          ],
          correta: 1,
          dica: "Lembre de E = tq / (tq + ttc).",
          explicacao: "Com quantum curto, a troca de contexto ocupa uma fração grande do tempo: o sistema fica responsivo, mas faz pouco trabalho útil."
        },
        {
          tipo: "conceito",
          titulo: "Algoritmos",
          texto: `<ul>
              <li><b>FCFS</b>: ordem de chegada; simples, mas sofre o <b>efeito comboio</b>.</li>
              <li><b>Round-Robin</b>: FCFS com <b>quantum</b>; justo e bom para interativos, com mais trocas.</li>
              <li><b>SJF</b>: o mais curto primeiro; <b>SRTF</b> é a versão preemptiva (menor tempo restante). Menores tempos médios, mas exigem estimar a duração e podem causar <b>inanição</b>.</li>
              <li><b>Prioridades</b> (cooperativo ou preemptivo): risco de inanição, resolvido pelo <b>envelhecimento</b> (<i>aging</i>).</li>
              <li><b>Loteria</b>: chance = bilhetes do processo / total de bilhetes.</li>
            </ul>
            <p>No exemplo do Maziero, os tempos médios de espera foram: FCFS 5,2 · RR 5,6 · SJF 3,0 · <b>SRTF 2,6</b> · PRIOc 3,8 · PRIOp 2,8.</p>`
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "Pelo fcfs.c do laboratório, qual é o tempo de espera de P4?",
          contexto: `chegada = {0, 1, 2, 3}
burst   = {8, 2, 1, 3}

P  Chegada  Burst  Inicio  Fim
P1       0      8       0    8
P2       1      2       8   10
P3       2      1      10   11
P4       3      3      11   14`,
          opcoes: ["3", "8", "11", "14"],
          correta: 1,
          dica: "Espera = início − chegada.",
          explicacao: "P4 chegou em 3 e só começou em 11: esperou 8. A espera média do FCFS nesse caso é (0 + 7 + 8 + 8) / 4 = 5,75."
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "No fcfs_comboio.c, P1 tem burst 15. O que aconteceu com a espera média?",
          contexto: `burst = {15, 2, 1, 2}

P  Espera
P1      0
P2     14
P3     15
P4     15`,
          opcoes: [
            "Caiu, porque P1 terminou primeiro",
            "Subiu para 11: os processos curtos ficaram presos atrás do longo (efeito comboio)",
            "Ficou igual ao caso anterior",
            "Zerou, porque o FCFS é ótimo"
          ],
          correta: 1,
          dica: "(0 + 14 + 15 + 15) / 4.",
          explicacao: "A espera média foi a 11. É o efeito comboio: no FCFS, um processo longo na frente atrasa todos os curtos que chegam depois."
        },
        {
          tipo: "ordenar",
          lab: "LAB 02",
          pergunta: "O rr.c (quantum = 2) roda P1(8), P2(2), P3(1) e P4(3). Ordene as primeiras fatias de CPU.",
          itens: [
            "t=0: P1 por 2",
            "t=2: P2 por 2",
            "t=4: P3 por 1",
            "t=5: P4 por 2",
            "t=7: P1 por 2"
          ],
          dica: "Cada processo recebe no máximo 2 unidades e volta para o fim da fila.",
          explicacao: "P1 usa o quantum e cede; P2 termina em 4; P3 termina em 5; P4 usa 2; P1 volta. A espera média cai para 3,25, contra 5,75 do FCFS com os mesmos dados."
        },
        {
          tipo: "multipla",
          lab: "LAB 02",
          pergunta: "No prioridade.c (menor número = maior prioridade), qual processo executa primeiro?",
          contexto: `burst      = {6, 3, 2, 4}
prioridade = {3, 1, 0, 2}   // P1, P2, P3, P4`,
          opcoes: ["P1", "P2", "P3", "P4"],
          correta: 2,
          dica: "Procure a prioridade de menor número.",
          explicacao: "A ordem foi P3 (0), P2 (1), P4 (2) e P1 (3). Se sempre chegassem processos de prioridade alta, P1 poderia esperar para sempre: inanição."
        },
        {
          tipo: "multipla",
          pergunta: "Qual algoritmo tem o menor tempo médio de espera no exemplo do Maziero?",
          opcoes: ["FCFS", "Round-Robin", "SRTF", "PRIOc"],
          correta: 2,
          dica: "É a versão preemptiva do \"mais curto primeiro\".",
          explicacao: "O SRTF executa sempre quem tem menos tempo restante: Tw = 2,6, o menor possível. O custo é estimar durações e o risco de inanição."
        },
        {
          tipo: "multipla",
          pergunta: "Como evitar a inanição no escalonamento por prioridades?",
          opcoes: ["Aumentando o quantum", "Envelhecimento (aging): quem espera ganha prioridade", "Usando FCFS dentro de cada prioridade", "Desligando a preempção"],
          correta: 1,
          dica: "Quem não é escolhido \"envelhece\".",
          explicacao: "No aging, a cada turno as tarefas não escolhidas ganham prioridade; uma hora elas executam."
        },
        {
          tipo: "multipla",
          pergunta: "Na loteria, um processo tem 3 dos 10 bilhetes. Qual é a chance de ele ganhar a CPU num sorteio?",
          opcoes: ["3%", "10%", "30%", "33%"],
          correta: 2,
          dica: "Bilhetes do processo / total de bilhetes.",
          explicacao: "P = 3 / 10 = 30%."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada classe de escalonamento do Linux à sua descrição.",
          pares: [
            ["SCHED_DEADLINE", "Tempo real com prazos (EDF)"],
            ["SCHED_FIFO", "Tempo real, prioridade fixa, sem quantum"],
            ["SCHED_RR", "Tempo real com Round-Robin"],
            ["SCHED_OTHER", "Padrão das tarefas interativas"]
          ],
          dica: "EDF = Earliest Deadline First.",
          explicacao: "DEADLINE > FIFO > RR são as classes de tempo real; OTHER (NORMAL), BATCH e IDLE são as classes comuns."
        },
        {
          tipo: "multipla",
          pergunta: "A afinidade de processador serve para…",
          opcoes: [
            "equilibrar a carga entre as CPUs",
            "aproveitar os dados que ainda estão no cache da CPU",
            "dar mais prioridade a um processo",
            "evitar deadlocks"
          ],
          correta: 1,
          dica: "Trocar de CPU significa começar com o cache \"frio\".",
          explicacao: "Mantendo o processo na mesma CPU, ele reaproveita o cache. O balanceamento de carga (push e pull migration) é o objetivo oposto, e os dois precisam ser equilibrados."
        }
      ]
    },

    // ================================================== FASE 2.6 — Problemas clássicos
    {
      id: "p26",
      etapa: "2.6",
      titulo: "Problemas clássicos",
      descricao: "Produtores, leitores, selvagens e filósofos",
      icone: "🍝",
      xv6: {
        titulo: "O pipe do xv6 é um produtor-consumidor",
        arquivo: "kernel/pipe.c",
        codigo: `// pipewrite(): o produtor
acquire(&pi->lock);
while(i < n){
  if(pi->nwrite == pi->nread + PIPESIZE){  // buffer cheio
    wakeup(&pi->nread);                    // acorda quem lê
    sleep(&pi->nwrite, &pi->lock);         // e dorme
  } else {
    pi->data[pi->nwrite++ % PIPESIZE] = ch;
    i++;
  }
}
wakeup(&pi->nread);
release(&pi->lock);

// piperead(): o consumidor
while(pi->nread == pi->nwrite && pi->writeopen)  // buffer vazio
  sleep(&pi->nread, &pi->lock);`,
        texto: "O pipe tem um <b>buffer limitado</b> (<code>PIPESIZE</code> bytes): o lock garante a exclusão mútua, quem escreve dorme com o buffer cheio e quem lê dorme com o buffer vazio. São os três aspectos do produtor-consumidor."
      },
      linux: {
        titulo: "Filósofos sem controle",
        comando: "java -Dstdout.encoding=UTF-8 FilosofosSemControle",
        saida: `Filosofo-3 pegou o garfo 3 (esquerda)
Filosofo-0 pegou o garfo 0 (esquerda)
Filosofo-4 pegou o garfo 4 (esquerda)
Filosofo-1 pegou o garfo 1 (esquerda)
Filosofo-2 pegou o garfo 2 (esquerda)

*** POSSÍVEL DEADLOCK DETECTADO: nenhum filósofo come há 5017 ms ***`,
        texto: "Saída do Lab 03: os cinco filósofos pegaram o garfo da esquerda e ficaram esperando o da direita para sempre. Com o <b>saleiro</b> (<code>FilosofosComSaleiro</code>), o impasse some."
      },
      man: [
        { termo: "produtor-consumidor", secao: "7", resumo: "tarefas que depositam e retiram itens de um buffer de capacidade N",
          detalhe: "Três aspectos: exclusão mútua no buffer, produtor espera com o buffer cheio e consumidor espera com o buffer vazio. Solução clássica com três semáforos: mutex = 1, item = 0, vaga = N. A ordem dos down importa.",
          exemplo: "produtor:   down(vaga); down(mutex); depositar(); up(mutex); up(item);\nconsumidor: down(item); down(mutex); retirar();   up(mutex); up(vaga);",
          veja: ["semáforo(7)", "pipe(7)"] },
        { termo: "leitores-escritores", secao: "7", resumo: "leituras podem ser paralelas; escritas precisam de acesso exclusivo",
          detalhe: "Um mutex único funciona, mas limita os leitores. Dando prioridade aos leitores (o primeiro bloqueia os escritores e o último libera), a leitura fica paralela, mas os escritores podem sofrer inanição. Em Java: ReentrantReadWriteLock.",
          veja: ["condição de disputa(7)", "inanição(7)"] },
        { termo: "jantar dos filósofos", secao: "7", resumo: "cinco filósofos, cinco garfos: cada um precisa dos dois vizinhos para comer",
          detalhe: "Se todos pegam o garfo da esquerda ao mesmo tempo, ocorre deadlock. Soluções: o saleiro (só um pega garfos por vez, mas reduz o paralelismo), inverter a ordem de um filósofo (quebra a espera circular) ou limitar a 4 filósofos à mesa.",
          veja: ["deadlock(7)", "Coffman(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Produtores e consumidores",
          texto: `<p>Os problemas clássicos representam situações reais e servem para testar mecanismos de sincronização.</p>
            <p>No <b>produtor-consumidor</b>, tarefas usam um <b>buffer de capacidade N</b>. Três aspectos:</p>
            <ol>
              <li><b>Exclusão mútua</b> no acesso ao buffer;</li>
              <li><b>buffer cheio</b>: produtores esperam até haver vaga;</li>
              <li><b>buffer vazio</b>: consumidores esperam até haver item.</li>
            </ol>
            <p>Solução com três semáforos: <code>mutex = 1</code>, <code>item = 0</code> e <code>vaga = N</code>.</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene as operações do produtor na solução com semáforos.",
          itens: ["down(vaga)", "down(mutex)", "depositar(item)", "up(mutex)", "up(item)"],
          dica: "Primeiro garanta que há vaga; só depois entre na região crítica.",
          explicacao: "Esperar vaga → entrar na região crítica → depositar → sair → avisar que há item. Trocar down(mutex) com down(vaga) pode causar deadlock: o produtor dormiria segurando o mutex."
        },
        {
          tipo: "multipla",
          lab: "LAB 03",
          pergunta: "No Lab 03, o ProdutorConsumidorSemControle aceitou só cerca de 6.000 das 10.000 produções, e o número mudava a cada execução. Por quê?",
          contexto: `int atual = itensNoBuffer;   // LEITURA
Thread.yield();
if (atual < CAPACIDADE) {
    itensNoBuffer = atual + 1;  // ESCRITA
}`,
          opcoes: [
            "Porque o buffer tinha capacidade 10.000",
            "Porque nada protege itensNoBuffer entre a leitura e a escrita: é uma condição de corrida",
            "Porque o Java descarta threads lentas",
            "Porque faltou chamar notifyAll()"
          ],
          correta: 1,
          dica: "Entre ler e escrever há um Thread.yield() de propósito.",
          explicacao: "Sem exclusão mútua, as threads se entrelaçam entre a leitura e a escrita do contador. Com os três semáforos, as 10.000 produções e consumos sempre fecharam."
        },
        {
          tipo: "conceito",
          titulo: "Leitores e escritores; jantar dos selvagens",
          texto: `<p><b>Leitores e escritores:</b> leituras podem acontecer em paralelo (Bernstein), mas a escrita exige acesso exclusivo.</p>
            <ul>
              <li><b>Mutex único</b>: correto, mas só um leitor por vez.</li>
              <li><b>Prioridade aos leitores</b>: o primeiro leitor bloqueia os escritores e o último libera; leitura paralela, mas os escritores podem sofrer <b>inanição</b>.</li>
            </ul>
            <p><b>Jantar dos selvagens:</b> um caldeirão com N porções; quem encontra o caldeirão vazio acorda o cozinheiro, que só repõe quando está totalmente vazio.</p>`
        },
        {
          tipo: "multipla",
          lab: "LAB 03",
          pergunta: "No Lab 03, com mutex simples o máximo foi 1 leitor por vez; com ReadWriteLock, 8 de 8. O que explica a diferença?",
          opcoes: [
            "O ReadWriteLock é mais rápido porque desliga a sincronização",
            "O ReadWriteLock permite leituras em paralelo e só exige exclusividade para a escrita",
            "O mutex simples tem um bug",
            "O computador tinha só um núcleo"
          ],
          correta: 1,
          dica: "Leitura não modifica os dados.",
          explicacao: "Leituras concorrentes não geram disputa, então podem ser simultâneas; só a escrita precisa de exclusividade. O mutex simples serializava todo mundo."
        },
        {
          tipo: "multipla",
          pergunta: "Qual é o risco de dar prioridade aos leitores?",
          opcoes: ["Deadlock entre leitores", "Inanição dos escritores", "Leituras com dados corrompidos", "Nenhum"],
          correta: 1,
          dica: "E se sempre houver algum leitor lendo?",
          explicacao: "Se sempre há leitores, o último nunca sai e os escritores nunca entram: inanição."
        },
        {
          tipo: "conceito",
          titulo: "Jantar dos filósofos",
          texto: `<p>Cinco filósofos alternam entre <b>pensar e comer</b>; há cinco garfos, e cada um precisa dos <b>dois garfos vizinhos</b> para comer.
            Eles não se comunicam e não há controle central.</p>
            <p>⚠ Se todos pegam o garfo da <b>esquerda</b> ao mesmo tempo, todos esperam o da direita para sempre: <b>deadlock</b>.</p>
            <p><b>Solução do saleiro:</b> para comer, o filósofo pega primeiro o saleiro, depois os dois garfos, e devolve o saleiro.
            Outras saídas: um filósofo pega os garfos na ordem inversa, ou só 4 sentam à mesa.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual é o ponto fraco da solução do saleiro?",
          opcoes: [
            "Ainda pode haver deadlock",
            "Reduz o paralelismo: filósofos não vizinhos que poderiam comer juntos esperam pelo saleiro",
            "Exige seis garfos",
            "Só funciona com 2 filósofos"
          ],
          correta: 1,
          dica: "O saleiro vira um controle centralizado.",
          explicacao: "Só um filósofo por vez tenta pegar garfos: o saleiro vira um gargalo e a mesa perde paralelismo."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada problema clássico ao que ele ensina.",
          pares: [
            ["Produtor-consumidor", "Buffer limitado: cheio, vazio e exclusão mútua"],
            ["Leitores-escritores", "Leitura paralela, escrita exclusiva"],
            ["Jantar dos selvagens", "Acordar um cozinheiro quando o recurso acaba"],
            ["Jantar dos filósofos", "Risco de deadlock com recursos compartilhados"]
          ],
          dica: "Um deles tem um caldeirão.",
          explicacao: "Cada problema destaca um aspecto da coordenação: buffer limitado, acesso diferenciado, reposição sob demanda e impasse."
        }
      ]
    },

    // ================================================== FASE 2.7 — Deadlocks (chefe)
    {
      id: "p27",
      etapa: "2.7",
      titulo: "Deadlocks",
      descricao: "Impasses: condições e tratamento",
      icone: "🏆",
      chefe: true,
      xv6: {
        titulo: "Ordem global de locks no xv6",
        arquivo: "kernel/proc.c",
        codigo: `// helps ensure that wakeups of wait()ing
// parents are not lost. helps obey the
// memory model when using p->parent.
// must be acquired before any p->lock.
struct spinlock wait_lock;`,
        texto: "O comentário do próprio xv6 define uma <b>ordem global</b>: o <code>wait_lock</code> sempre é adquirido antes de qualquer <code>p->lock</code>. Com todos seguindo a mesma ordem, a <b>espera circular</b> não acontece: é a prevenção de deadlock usada num kernel real."
      },
      linux: {
        titulo: "Deadlock com 2 recursos",
        comando: "java -Dstdout.encoding=UTF-8 DeadlockDuasThreads",
        saida: `Thread-A: obteve recurso1
Thread-B: obteve recurso2
Thread-A: tentando obter recurso2...
Thread-B: tentando obter recurso1...

*** DEADLOCK CONFIRMADO: as threads não terminaram em 5s. ***
*** Estado: A segura recurso1 e espera recurso2; B segura recurso2 e espera recurso1. ***`,
        texto: "Saída do Lab 03. No <code>DeadlockPrevenidoPorOrdenacao</code>, as duas threads pedem primeiro o recurso1 e depois o recurso2: a espera circular não se forma e as duas terminam."
      },
      man: [
        { termo: "deadlock", secao: "7", resumo: "impasse: tarefas bloqueadas esperando recursos umas das outras, para sempre",
          detalhe: "Exemplo: t1 segura a conta c1 e espera c2; t2 segura c2 e espera c1. As tarefas ficam bloqueadas (fora da fila de prontos), então em geral não consomem CPU.",
          veja: ["Coffman(7)", "grafo de alocação(7)"] },
        { termo: "Coffman", secao: "7", resumo: "as quatro condições para um deadlock",
          detalhe: "Exclusão mútua, posse e espera, não preempção e espera circular. São necessárias, mas não suficientes; com uma única instância de cada recurso, passam a ser suficientes.",
          veja: ["deadlock(7)", "prevenção de deadlock(7)"] },
        { termo: "grafo de alocação", secao: "7", resumo: "tarefas (círculos), recursos (retângulos), posse e requisição (setas)",
          detalhe: "Um ciclo com recursos de instância única indica impasse. Com várias instâncias, um ciclo pode existir sem impasse.",
          veja: ["deadlock(7)"] },
        { termo: "prevenção de deadlock", secao: "7", resumo: "impedir uma das quatro condições de Coffman",
          detalhe: "Exclusão mútua: usar um spooler. Posse e espera: pedir tudo de uma vez ou usar time-out. Não preempção: permitir retirar recursos que podem ser salvos (memória, CPU). Espera circular: ordem global dos recursos.",
          veja: ["Coffman(7)", "banqueiro(7)"] },
        { termo: "banqueiro", secao: "7", resumo: "algoritmo de impedimento de Dijkstra (1965)",
          detalhe: "Só concede um pedido se o sistema continuar num estado seguro, em que existe uma ordem para todas as tarefas terminarem. Exige conhecer a demanda máxima de cada tarefa.",
          veja: ["prevenção de deadlock(7)"] },
        { termo: "avestruz", secao: "7", resumo: "ignorar o problema do deadlock",
          detalhe: "Aceitável se os impasses são raros e o sistema não é crítico; inaceitável em sistemas médicos, militares ou que não podem parar.",
          veja: ["deadlock(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Impasses e as condições de Coffman",
          texto: `<p>Transferência entre contas: t1 faz <code>lock(c1)</code> e depois <code>lock(c2)</code>; t2 faz <code>lock(c2)</code> e depois <code>lock(c1)</code>.
            Se t1 pega c1 e t2 pega c2, cada uma espera a outra <b>para sempre</b>: t1 → c2 → t2 → c1 → t1.</p>
            <p>As quatro <b>condições de Coffman</b> precisam ocorrer ao mesmo tempo:</p>
            <ol>
              <li><b>Exclusão mútua</b>: um recurso, uma tarefa por vez.</li>
              <li><b>Posse e espera</b>: segura um recurso e pede outro.</li>
              <li><b>Não preempção</b>: ninguém tira o recurso de quem o detém.</li>
              <li><b>Espera circular</b>: um ciclo de esperas.</li>
            </ol>
            <p>⚠ São <b>necessárias, mas não suficientes</b> (exceto com uma instância de cada recurso).</p>`
        },
        {
          tipo: "associar",
          pergunta: "No jantar dos filósofos, associe cada condição de Coffman ao que acontece na mesa.",
          pares: [
            ["Exclusão mútua", "Cada garfo só pode estar com um filósofo"],
            ["Posse e espera", "Segura um garfo e espera o outro"],
            ["Não preempção", "Ninguém toma o garfo do vizinho"],
            ["Espera circular", "A mesa redonda fecha o ciclo"]
          ],
          dica: "A mesa ser redonda é importante.",
          explicacao: "As quatro condições estão presentes no jantar dos filósofos, por isso o impasse pode acontecer."
        },
        {
          tipo: "multipla",
          pergunta: "As quatro condições de Coffman presentes garantem um deadlock?",
          opcoes: [
            "Sim, sempre",
            "Não: são necessárias, mas não suficientes, salvo com uma instância de cada recurso",
            "Não: basta uma delas",
            "Só em sistemas com várias CPUs"
          ],
          correta: 1,
          dica: "Pense num recurso com várias cópias.",
          explicacao: "Se uma faltar, não há impasse. Mas todas presentes só garantem impasse quando cada recurso tem uma única instância."
        },
        {
          tipo: "multipla",
          pergunta: "Num grafo de alocação com recursos de instância única, um ciclo indica…",
          opcoes: ["Nada de especial", "Impasse", "Inanição", "Condição de disputa"],
          correta: 1,
          dica: "Com uma instância por recurso, as condições viram suficientes.",
          explicacao: "Os processos do ciclo estão bloqueados esperando recursos uns dos outros e não prosseguem sozinhos."
        },
        {
          tipo: "conceito",
          titulo: "Como tratar deadlocks",
          texto: `<ol>
              <li><b>Ignorar</b> (algoritmo do avestruz): aceitável só se o impasse é raro e o sistema não é crítico.</li>
              <li><b>Prevenir</b>: quebrar uma condição. Spooler (exclusão mútua), pedir tudo de uma vez ou time-out (posse e espera),
                retirar recursos que podem ser salvos (não preempção), <b>ordem global</b> dos recursos (espera circular).</li>
              <li><b>Impedir</b> (<i>avoidance</i>): só conceder pedidos que mantêm um <b>estado seguro</b>, como no <b>algoritmo do banqueiro</b> (Dijkstra, 1965).</li>
              <li><b>Detectar e resolver</b>: procurar ciclos no grafo e eliminar tarefas ou fazer <i>rollback</i> a partir de <i>checkpoints</i>.</li>
            </ol>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada técnica à condição de Coffman que ela quebra (ou ao tipo de tratamento).",
          pares: [
            ["Spooler de impressão", "Exclusão mútua"],
            ["Pedir todos os recursos de uma vez", "Posse e espera"],
            ["Ordem global dos recursos", "Espera circular"],
            ["Algoritmo do banqueiro", "Impedimento (estado seguro)"]
          ],
          dica: "O banqueiro não quebra uma condição: ele nega pedidos perigosos.",
          explicacao: "Spooler evita o acesso exclusivo à impressora; pedir tudo junto evita segurar e esperar; a ordem global impede o ciclo; o banqueiro mantém o sistema em estado seguro."
        },
        {
          tipo: "multipla",
          lab: "LAB 03",
          pergunta: "No DeadlockPrevenidoPorOrdenacao do Lab 03, as duas threads pedem primeiro o recurso1 e depois o recurso2. Qual condição foi quebrada?",
          opcoes: ["Exclusão mútua", "Posse e espera", "Não preempção", "Espera circular"],
          correta: 3,
          dica: "Se todas pedem na mesma ordem, dá para fechar um ciclo?",
          explicacao: "Com uma ordem global, quem pega o recurso1 primeiro também consegue o recurso2; o ciclo A → B → A não se forma, e as duas threads terminaram."
        },
        {
          tipo: "multipla",
          pergunta: "O algoritmo do avestruz é aceitável no software de um respirador hospitalar?",
          opcoes: ["Sim, deadlocks são raros", "Não: é um sistema crítico, que não pode parar", "Sim, se o computador for rápido", "Depende do escalonador"],
          correta: 1,
          dica: "O que acontece se o sistema travar?",
          explicacao: "Ignorar deadlocks só é aceitável em sistemas não críticos. Num respirador, um impasse pode custar uma vida."
        },
        {
          tipo: "multipla",
          pergunta: "Durante um deadlock, o processador fica consumido pelas tarefas travadas?",
          opcoes: [
            "Sim, a 100%",
            "Em geral não: as tarefas estão bloqueadas, fora da fila de prontos; só gastariam CPU com espera ocupada",
            "Sim, por causa das trocas de contexto",
            "Depende do quantum"
          ],
          correta: 1,
          dica: "Em que estado ficam as tarefas que esperam um lock comum?",
          explicacao: "As tarefas em impasse estão bloqueadas, e a CPU atende outras ou fica ociosa. Com spinlocks (espera ocupada), elas gastariam CPU, situação às vezes chamada de livelock."
        },
        {
          tipo: "multipla",
          pergunta: "A detecção com rollback (retrocesso) exige…",
          opcoes: [
            "desligar as interrupções",
            "salvar periodicamente o estado das tarefas (checkpoints)",
            "uma única CPU",
            "conhecer a demanda máxima de cada tarefa"
          ],
          correta: 1,
          dica: "Para voltar a um estado anterior, é preciso tê-lo guardado.",
          explicacao: "O rollback desfaz parte da execução até um checkpoint salvo. Ações de rede ou com o usuário podem ser impossíveis de desfazer. (Conhecer a demanda máxima é exigência do banqueiro.)"
        }
      ]
    }
  ]
});
