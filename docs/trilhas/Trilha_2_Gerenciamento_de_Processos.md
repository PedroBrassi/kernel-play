# Trilha 2 — Gerenciamento de Processos

> **Origem:** pasta `Gerenciamento de processos` (Aulas 4, 5, 7, 8, 9, 10 e 11 — Prof. Romário da Silva Borges, UNIFAL-MG)
> **Livro de referência:** MAZIERO, Carlos A. *Sistemas Operacionais: Conceitos e Mecanismos*. DINF/UFPR, 2019 — Parte II "Gestão de tarefas" (caps. 4–7, p. 39–90) e Parte III "Interação entre tarefas" (caps. 8–13, p. 91–159).
> Obs.: a pasta não contém a Aula 6. Como a Aula 8 (Monitores) parte dos **semáforos**, incluí na Fase 2.4 um bloco-ponte marcado como *complemento do livro* (cap. 11).

| Fase | Aula | Tema | Livro (Maziero) |
|---|---|---|---|
| 2.1 | Aula 4 | Processos | cap. 4 (p. 40–50), cap. 5, seções 5.1–5.3 (p. 51–58) |
| 2.2 | Aula 5 | Threads | cap. 5, seções 5.4–5.5 (p. 58–69) |
| 2.3 | Aula 7 | Comunicação entre processos, condição de disputa e exclusão mútua | caps. 8, 9 e 10 (p. 92–122) |
| 2.4 | Aula 8 | Monitores (e semáforos) | cap. 11 (p. 123–133) |
| 2.5 | Aula 9 | Escalonamento | cap. 6 (p. 70–85); cap. 7 (p. 86–90) |
| 2.6 | Aula 10 | Problemas clássicos de coordenação | cap. 12 (p. 134–147) |
| 2.7 | Aula 11 | Deadlocks (impasses) | cap. 13 (p. 148–159) |

---

## Fase 2.1 — Processos

**Pergunta-guia:**
> "Se a CPU executa uma instrução por vez, como o sistema consegue rodar vários programas ao mesmo tempo?"

### Processo
Um **processo é um programa em execução**. Inclui código, dados, pilha e registradores e é a **unidade básica de execução** controlada pelo SO.
*(Analogia do slide: um site de edição gráfica aberto — o "programa" é a receita; o processo é a receita sendo executada, com seu estado.)*

**Programa × Processo**
- 💾 **Programa:** entidade **passiva**, armazenada em disco.
- ▶ **Processo:** entidade **ativa**, em execução na memória.
- 🔁 Um mesmo programa pode gerar **vários processos** simultaneamente.

**Componentes de um processo:** 📝 código (instruções); 📦 dados (variáveis globais e estáticas); 📚 pilha (chamadas de função e variáveis locais); 🗂 heap (memória dinâmica); 🔢 registradores (estado atual da CPU); 🔖 contador de programa (próxima instrução).

### Contexto do processo
- **O que é:** todo o estado necessário para continuar a execução.
- **O que inclui:** registradores, PC (contador de programa), SP (ponteiro de pilha) e informações do SO.
- **Para que serve:** é salvo e restaurado a cada troca de contexto. Fica guardado no **PCB**.

### Tabela de processos / PCB (Process Control Block)
Estrutura mantida pelo SO para cada processo ativo. Guarda: **PID**, estado, contador de programa, registradores, prioridade, informações de memória, arquivos abertos, tempo de CPU. Permite **pausar** um processo e **retomá-lo** do mesmo ponto — essencial no *context switch*.

Campos típicos (tabela de Tanenbaum mostrada no slide):
- *Gerenciamento de processo:* registradores, contador de programa, palavra de estado do programa, ponteiro de pilha, estado, prioridade, parâmetros de escalonamento, ID do processo, processo pai, grupo, sinais, momento de início, tempo de CPU usado, tempo de CPU dos filhos, tempo do próximo alarme.
- *Gerenciamento de memória:* ponteiros para os segmentos de texto, dados e pilha.
- *Gerenciamento de arquivo:* diretório-raiz, diretório de trabalho, descritores de arquivo, ID do usuário, ID do grupo.

### Troca de contexto
SO interrompe A → salva o contexto de A → carrega o contexto de B → B retoma a execução. Dá a impressão de execução simultânea.

**Custo:** ⚠ durante a troca a CPU não executa trabalho útil do usuário; 📉 trocas excessivas reduzem o desempenho; ⏱ o **quantum** (fatia de tempo) influencia diretamente esse custo.

> 📖 **Maziero, cap. 5, seções 5.1–5.2 (p. 51–54):** contexto = registradores + informações do núcleo no TCB (*task control block*); troca de contexto = salvar contexto atual, acionar o *dispatcher*, restaurar o próximo. A **eficiência** depende do quantum (*tq*) e do tempo de troca (*ttc*): E = tq / (tq + ttc). Quantum pequeno → mais interatividade e menos eficiência.

### Criação de processos
**Quando ocorre:** inicialização do sistema (daemons, serviços); chamada de sistema por um processo existente; solicitação do usuário (abrir app, executar comando); tarefas em lote.

**UNIX (POSIX — Linux, macOS…):**
- `fork()` — cria um **processo filho**, inicialmente cópia exata do pai (retorna 0 no filho e o PID do filho no pai);
- `exec()` — **substitui** o programa em execução por outro;
- entre `fork` e `exec` é possível **redirecionar entrada e saída**;
- `wait()` — o pai aguarda o término do filho; o filho termina com `exit()`.
- A memória do filho é inicialmente uma cópia da do pai (compartilhada até ser modificada — *copy-on-write*). Ambos acessam os mesmos recursos do núcleo, mas executam em áreas de memória distintas.

Fluxo (figura do slide): `pid = fork()` → pai (pid > 0) chama `wait()` e reassume quando o filho termina; filho (pid == 0) chama `exec()` e depois `exit()`.

Código do slide (resumo):
```c
pid = fork();                 // replicação do processo
if (pid < 0) { perror("Erro: "); exit(-1); }   // fork falhou
else if (pid > 0) wait(0);    // sou o pai: espero o filho concluir
else {                        // sou o filho
  execve("/bin/date", argv, envp);   // carrega outro binário
  perror("Erro: ");           // só chega aqui se o execve falhar
}
printf("Tchau !\n");
exit(0);
```
*(Pergunta implícita: quem imprime "Tchau !"? → Só o pai, pois o filho teve sua imagem substituída por `/bin/date`; o filho só imprimiria se o `execve` falhasse.)*

**Windows:** `CreateProcess()` cria um processo **do zero**, recebendo vários parâmetros (programa, argumentos, atributos de segurança…). Não há separação fork/exec: o processo já é criado e executado. Espaços de endereço de pai e filho são distintos desde o início (sem clonagem). Padrão do Windows NT.

### Hierarquia de processos
- **UNIX:** o `init` (PID 1) é a raiz; os filhos formam uma **árvore** (figura: init → login, kthreadd, sshd → bash, khelper, pdflush → ps, emacs, tcsch…). Se o pai termina, o filho órfão é **"adotado"** pelo `init`.
- **Windows:** **não tem conceito de hierarquia** rígida; ao criar um filho, o pai recebe um *handle* (identificador) que pode ser passado a outro processo.

> 📖 **Maziero, cap. 5, seção 5.3 (p. 54–58):** o conceito de processo como "contêiner de recursos"; gestão de processos (PCB, `fork`, `execve`, `wait`, `exit`; `CreateProcess` no Windows); hierarquia de processos (`pstree`).

### Término de processos
**Como termina:** saída normal (voluntária); saída por erro (erro tratável, encerra com código de erro); erro fatal (ex.: divisão por zero, acesso inválido à memória); cancelamento externo (outro processo com permissão encerra à força).

**Chamadas:** UNIX/Linux — `exit()` (voluntário), `kill()` (envia sinal para encerrar outro processo). Windows — `ExitProcess()` (voluntário), `TerminateProcess()` (forçado). Após o término, o SO **libera todos os recursos** do processo.

**Processo zumbi (UNIX):** o filho que terminou permanece na tabela de processos até o pai chamar `wait()`; nesse intervalo é um **zumbi**.
*Pergunta do slide:* se o pai não chama `wait()` e termina, o que acontece com o zumbi? → O filho é **adotado pelo `init`**, que executa `wait()` periodicamente e remove a entrada da tabela.

### Estados de um processo
🆕 **Novo** (sendo criado) → ✅ **Pronto** (aguardando a CPU) → ▶ **Executando** (usando a CPU) → ⏸ **Bloqueado/Suspenso** (aguardando evento externo, ex.: E/S) → 🏁 **Finalizado**.

- **Pronto:** pode executar, mas aguarda a CPU; fica na **fila de prontos**, gerenciada pelo escalonador; sai quando o escalonador faz o **despacho** → Executando.
- **Executando:** usa a CPU; só **um processo por CPU** neste estado; pode terminar, ser **preemptado** (volta a Pronto) ou **bloquear**.
- **Bloqueado:** aguarda evento que não depende da CPU (leitura de disco, teclado, resposta de rede); **não deve ocupar a CPU** enquanto espera.

**Transições:** Novo→Pronto (admissão); Pronto→Executando (despacho); Executando→Pronto (fim do quantum/preempção); Executando→Bloqueado (pede E/S ou evento); Bloqueado→Pronto (evento ocorreu); Executando→Finalizado (término).

> 📖 **Maziero, cap. 4, seção 4.4 "Ciclo de vida das tarefas" (p. 47–50):** estados nova, pronta, executando, suspensa e terminada, com o diagrama de transições.

### Multiprogramação e pseudoparalelismo
- 🔂 **Monoprogramação:** um programa executa até terminar; CPU ociosa durante E/S (figura 4.2 de Maziero: execução monotarefa — processador espera o disco/terminal).
- 🔀 **Multiprogramação:** processos alternam o uso da CPU → melhor aproveitamento (figura 4.4: um **monitor** alterna tarefas A, B, C).
- **Pseudoparalelismo:** a CPU alterna entre programas em pequenos intervalos; o usuário percebe uma falsa simultaneidade; enquanto um espera E/S, outro usa a CPU. 🔁 Uma CPU executa um processo por vez; 👁 a troca rápida cria a ilusão; ≠ paralelismo real.
  Figura de Tanenbaum: (a) multiprogramação de 4 programas com um único contador de programa; (b) modelo conceitual de 4 processos sequenciais independentes; (c) só um ativo de cada vez ao longo do tempo.
- **Paralelismo real:** 🖥 múltiplas CPUs/núcleos; ⚡ sistemas multicore; 🎮 GPUs (milhares de tarefas simultâneas).

**Problema da multiprogramação:** ⚔ competição pela CPU; ⏳ espera por E/S sem desperdiçar CPU; 🤔 o SO precisa decidir quem executa e quando — papel do **escalonador** (Fase 2.5).

> 📖 **Maziero, cap. 4, seção 4.3 (p. 42–47):** sistemas monotarefa, monitor de sistema, multitarefa e tempo compartilhado (preempção por *quantum*, interrupções do *timer*).

### Desafios da fase 2.1
1. **Programa × processo:** qual é ativo? → **Processo** (o programa é passivo, no disco).
2. **Onde o SO guarda o contexto de um processo?** a) Na pilha do usuário · **b) No PCB** · c) No disco · d) No cache L1
3. **O que `fork()` retorna ao filho?** → 0 (ao pai, o PID do filho; erro, valor negativo).
4. **Um processo que espera leitura de disco está em qual estado?** → Bloqueado.
5. **Transição Executando → Pronto ocorre quando…** → o quantum termina (preempção).
6. **O que é um processo zumbi?** → Filho já terminado cuja entrada permanece na tabela até o pai chamar `wait()`.
7. **Diferença entre `CreateProcess()` e `fork()`+`exec()`?** → CreateProcess cria e já carrega o novo programa em espaço de endereçamento próprio; no UNIX, cria-se uma cópia e depois substitui-se o programa.
8. **Pseudoparalelismo é o mesmo que paralelismo real?** → Não: é alternância rápida em uma CPU.

---

## Fase 2.2 — Threads

**Pergunta-guia:**
> "Se um processo já pode executar um programa inteiro, por que sistemas modernos precisam dividir esse mesmo processo em várias linhas de execução?"

### Recapitulando processo
Programa em execução; espaço de endereçamento isolado; agrupa recursos (arquivos abertos, variáveis, memória); ciclo de vida controlado pelo SO.
✅ Isolamento é bom para segurança, consistência e proteção da memória.
⚠ Mas dificulta: compartilhar dados, ter atividades simultâneas na mesma aplicação e criar unidades de execução rapidamente.

### Thread
**Linha de execução dentro de um processo.** Compartilha os recursos do processo, mas tem seu próprio fluxo de execução. ⚡ Unidade básica de uso da CPU; 🪶 leve e com bom desempenho.
*(Analogia do slide: o navegador/portal com várias abas e áreas carregando ao mesmo tempo — um processo, várias threads; e a foto de vários operários cavando o mesmo buraco = vários núcleos/threads em uma tarefa.)*

**Recursos próprios de cada thread:** 1) contador de programa; 2) registradores; 3) **pilha** de execução (variáveis locais e chamadas); 4) estado e escalonamento.
**Recursos compartilhados:** 💻 código; 📊 dados globais e heap; 📂 arquivos abertos (descritores) e sinais. ⚠ Compartilhamento exige **sincronização**.

Figura: *processo com um único thread* (código, dados, arquivos, registradores, pilha + 1 fluxo) × *processo com múltiplos threads* (código, dados e arquivos comuns; cada thread com registradores e pilha próprios).

### Threads de usuário × de núcleo
- **Nível de usuário:** implementadas no espaço do usuário por **bibliotecas**; o SO **não as vê** — enxerga só o processo.
- **Nível de núcleo:** gerenciadas diretamente pelo SO; cada thread é visível ao núcleo, que pode escaloná-la.
(Figura 5.4 de Maziero: threads de usuário dos processos A e B mapeadas sobre threads de núcleo e unidades de processamento.)

### Multithreading
Existência de múltiplas threads em um mesmo processo.
*Pergunta do slide:* num editor de texto, por que ter N threads em vez de N processos? → As threads (digitação, revisão ortográfica, salvamento automático, renderização) precisam do **mesmo documento**; com processos, cada um teria memória isolada e exigiria IPC, além de custo maior de criação e troca.

### Por que usar threads?
- **Responsividade:** a aplicação continua respondendo enquanto executa tarefa demorada.
- **Compartilhamento:** comunicação mais rápida, menos IPC, dados comuns acessíveis (mas exige sincronização).
- **Economia:** criar e alternar threads é mais barato que processos (mesmo espaço de endereçamento, menos recursos, comunicação simples).
- **Escalabilidade:** em multicore, threads executam em **paralelo real** — processamento de imagens (cada região por uma thread), servidores web (requisições simultâneas), navegadores (abas e recursos em paralelo).

### Processos × Threads (Maziero, Tabela 5.3)
| Característica | Com processos | Com threads (1:1) | Híbrido |
|---|---|---|---|
| Custo de criação | alto | baixo | médio |
| Troca de contexto | lenta | rápida | variável |
| Uso de memória | alto | baixo | médio |
| Compartilhamento de dados | canais de comunicação e áreas compartilhadas | variáveis globais e dinâmicas | ambos |
| Robustez | alta (erro fica contido no processo) | baixa (um erro afeta todas as threads) | média |
| Segurança | alta (cada processo com usuário e permissões distintas) | baixa (threads herdam as permissões do processo) | alta |
| Exemplos | Apache 1.x, PostgreSQL | Apache 2.x, MySQL | Chrome, Firefox, Oracle |

### Modelos de threads
**N:1** — N threads de usuário mapeadas em **uma** thread de núcleo (biblioteca no processo).
- *Vantagens:* gerência simples, leve e fácil; carga no núcleo pequena e independente do número de threads. Ex.: GNU Portable Threads, User-Mode Scheduling (UMS, Microsoft), Green Threads (Java).
- *Desvantagens:* **bloqueante** — se uma thread pede leitura do teclado, a thread de núcleo é suspensa e **todas** as threads do processo bloqueiam; sem **paralelismo** entre threads do mesmo processo; distribuição de processamento injusta (núcleo divide o tempo entre threads de núcleo, não de usuário).

**1:1** — cada thread de usuário tem sua thread de núcleo.
- *Vantagens:* não bloqueante (só a thread que pediu E/S é suspensa); várias threads do mesmo processo executam ao mesmo tempo. Modelo mais frequente: Windows NT e descendentes, maioria dos UNIX (Linux).
- *Desvantagens:* pouco escalável — muitas threads impõem carga elevada ao núcleo (grandes servidores web, simulações).

**N:M** — N threads de usuário sobre M ≤ N threads de núcleo.
- *Vantagens:* une a interatividade do 1:1 à escalabilidade do N:1. Ex.: Solaris, FreeBSD KSE (*Kernel-Scheduled Entities*).
- *Desvantagens:* complexidade de implementação; maior custo de gerência.

**Comparação (Maziero, Tabela 5.2):**
| | N:1 | 1:1 | N:M |
|---|---|---|---|
| Implementação | no processo (biblioteca) | no núcleo | em ambos |
| Complexidade | baixa | média | alta |
| Custo de gerência | baixo | médio | alto |
| Escalabilidade | alta | baixa | alta |
| Paralelismo entre threads do processo | não | sim | sim |
| Troca de contexto entre threads do processo | rápida | lenta | rápida |
| Divisão de recursos entre tarefas | injusta | justa | variável |
| Exemplos | GNU Portable Threads, Microsoft UMS | Windows, Linux | Solaris, FreeBSD KSE |

### Programando com threads
No passado cada SO tinha sua interface → problemas de portabilidade. Em **1995** surge o padrão **IEEE POSIX 1003.1c — POSIX Threads (PThreads)**, interface padronizada em C.
**Biblioteca de threads:** API para criar e gerenciar threads (Pthreads, Win32, threads da JVM).

| Chamada | Descrição |
|---|---|
| `pthread_create` | cria uma nova thread |
| `pthread_exit` | encerra a thread atual |
| `pthread_join` | aguarda o término de outra thread |
| `pthread_yield` | cede voluntariamente a CPU |
| `pthread_attr_init` / `pthread_attr_destroy` | cria/remove estrutura de atributos da thread |

Exemplo do slide (compilar com `gcc exemplo.c -o exemplo -lpthread`):
```c
#define NUM_THREADS 5
void *print_hello (void *threadid) {
  printf ("%ld: Hello World!\n", (long) threadid);
  sleep (5);
  printf ("%ld: Bye bye World!\n", (long) threadid);
  pthread_exit (NULL);
}
int main (int argc, char *argv[]) {
  pthread_t thread[NUM_THREADS];
  for (long i = 0; i < NUM_THREADS; i++) {
    printf ("Creating thread %ld\n", i);
    if (pthread_create (&thread[i], NULL, print_hello, (void *) i)) {
      perror ("pthread_create"); exit (-1);
    }
  }
  pthread_exit (NULL);   // encerra a thread "main"
}
```
**"Qual thread apresentará 'Hello World' primeiro?"** → **Não é possível saber**: a ordem depende do escalonador; pode variar a cada execução.

**"Qual a diferença?"**
```c
// Versão A: cria e espera cada uma → execução SEQUENCIAL (0, depois 1, depois 2…)
for (i = 0; i < NUM_THREADS; i++) {
  pthread_create(&thread[i], NULL, print_hello, (void *) i);
  pthread_join(thread[i], NULL);
}
// Versão B: cria todas e depois espera todas → execução CONCORRENTE
for (i = 0; i < NUM_THREADS; i++) pthread_create(&thread[i], NULL, print_hello, (void *) i);
for (i = 0; i < NUM_THREADS; i++) pthread_join(thread[i], NULL);
```

### Riscos e boas práticas
Threads compartilham dados → resultados imprevisíveis:
⚠ **condição de corrida** (duas threads alteram a mesma variável global ao mesmo tempo); ❌ **inconsistência** (resultado depende da ordem não controlada); 🔒 **sincronização necessária** (mutex e semáforos resolvem).

### Exercícios do slide (com gabarito)
1. *Dois exemplos em que múltiplas threads não melhoram o desempenho:* (a) um programa estritamente sequencial, em que cada passo depende do anterior (ex.: cálculo iterativo de uma sequência/recorrência); (b) um programa simples que espera um único evento (ex.: shell monitorando o próprio espaço) ou que roda em uma única CPU sem E/S — o custo de criação/sincronização só acrescenta overhead.
2. *Threads de nível de usuário obtêm melhor desempenho em multiprocessador?* → **Não** (modelo N:1): o núcleo vê um único fluxo e o escalona em uma CPU por vez; as demais CPUs não são aproveitadas.
3. *O Chrome teria os mesmos benefícios abrindo cada site em uma thread?* → **Não.** Threads compartilham o espaço de endereçamento: o travamento ou a exploração de uma falha em um site afetaria todo o navegador; processos isolam memória e permissões (robustez e segurança).
4. *Questão com código de `fork`/threads ("Quantos processos e threads únicos são criados?")* → resolver contando: cada `fork()` executado por N processos dobra o número de processos; cada `pthread_create` só cria thread no processo que o executa. (Consulte o código exibido no slide.)

> 📖 **Maziero, cap. 5, seções 5.4 "Threads" (p. 58–65) e 5.5 "Uso de processos versus threads" (p. 65–69).**

### Desafios da fase 2.2
1. **O que cada thread tem de próprio?** a) Código · b) Heap · **c) Pilha e registradores** · d) Arquivos abertos
2. **No modelo N:1, o que acontece se uma thread faz E/S bloqueante?** → Todo o processo bloqueia.
3. **Modelo usado por Linux e Windows?** → 1:1.
4. **Qual modelo une escalabilidade e paralelismo, mas é complexo?** → N:M.
5. **`pthread_join` serve para…** → esperar o término de outra thread.
6. **Por que threads são mais "baratas" que processos?** → Compartilham o espaço de endereçamento; criar e trocar exige menos recursos.

---

## Fase 2.3 — Comunicação entre processos (IPC)

**Pergunta-guia:**
> "Pense no processo de copiar um texto no navegador e colar em outro programa… como acontece essa comunicação?"

**Por que comunicar processos?** Trocar informações; cooperar numa tarefa; compartilhar resultados; acessar recursos comuns; dividir responsabilidades.
- Tarefas **no mesmo processo** compartilham memória → comunicação por variáveis globais.
- Tarefas **em processos distintos** não compartilham variáveis → comunicação **via núcleo**, por chamadas de sistema.
- Em computadores distintos → mecanismos de rede. (Figura 8.1: comunicação intraprocesso, interprocessos e intersistemas.) Genericamente chamados de **mecanismos IPC** (*Inter-Process Communication*).

> 📖 Motivos para tarefas cooperantes (Maziero 8.1, p. 92): atender vários usuários, usar multiprocessadores, modularidade e aplicações interativas.

### Formas de comunicação (aspectos)
- **Direta × indireta:** direta — `enviar(dados, destino)` / `receber(dados, origem)`, emissor e receptor se conhecem; indireta (mais usada, mais flexível) — via **canal** criado pelo SO: `enviar(dados, canal)` / `receber(dados, canal)`.
- **Sincronismo:**
  - *Síncrona (bloqueante):* envio e recepção bloqueiam até a comunicação concluir;
  - *Assíncrona (não bloqueante):* as primitivas retornam imediatamente (com erro se não for possível); exige buffer no canal;
  - *Semissíncrona:* bloqueia por um **prazo**; esgotado, retorna erro — `enviar(dados, destino, prazo)`.
- **Formato de envio:**
  - *Mensagens:* pacotes independentes, recebidos inteiros (não existe "meia mensagem") — ex.: *message queues* UNIX, UDP;
  - *Fluxo de dados:* sequência contínua de bytes, como um arquivo; o receptor lê em blocos de qualquer tamanho — ex.: pipes UNIX, TCP.
- **Capacidade do canal:** nula (n = 0 — transferência direta; síncrona = *rendez-vous*); infinita (abstração teórica); **finita** (caso real: canal cheio bloqueia o emissor ou retorna erro).
- **Confiabilidade:** canal **confiável** entrega todos os dados, íntegros e em ordem. Erros possíveis: **perda de dados**, **perda de integridade** e **perda de ordem** (canal que garante ordem = canal FIFO). Canais locais geralmente são confiáveis; redes (Ethernet, IP, UDP) não, mas o TCP constrói canais confiáveis.
- **Número de participantes:** **1:1** (pipes, TCP) ou **M:N**: *mailbox* (cada mensagem para um só receptor — message queues, UDP) ou *barramento de mensagens / publish-subscribe* (cada receptor recebe uma cópia — multicast, D-Bus, COM).

> 📖 **Maziero, cap. 8, seção 8.3 (p. 94–101).**

### Mecanismos de comunicação
**Pipes (UNIX):** canal **unidirecional** entre dois processos, ligando stdout de um ao stdin de outro. Ex.: `who | grep marcos | sort`. Classificação: local, **1:1**, síncrono, **orientado a fluxo**, confiável, capacidade finita (64 KB no Linux); usado com `read`/`write`. Pipes nomeados (**FIFOs**) persistem até serem removidos: `mkfifo /tmp/pipe`, `date > /tmp/pipe`, `cat < /tmp/pipe`.

**Sockets (redes):** extremidades de comunicação identificadas por endereço IP + porta; permitem comunicação entre processos locais ou remotos, por fluxo (TCP — confiável, orientado a conexão) ou por datagramas (UDP — mensagens, não confiável).

**Filas de mensagens:** implementam *mailbox*; N:M; confiáveis; orientadas a mensagens; capacidade finita (POSIX: `mq_open`, `mq_send`, `mq_receive`, `mq_close`, `mq_unlink`).

**Memória compartilhada:** entre processos distintos, a comunicação normalmente passa pelo núcleo (custo). Com memória compartilhada, cria-se uma **área comum** acessada **diretamente** pelos processos: o núcleo gerencia a criação e o mapeamento, mas o acesso ao conteúdo não tem intermediação do núcleo (rápido). POSIX: `shm_open`, `ftruncate`, `mmap`, `munmap`, `shm_unlink`.
⚠ **Agora que dois processos acessam a mesma memória ao mesmo tempo, podem surgir inconsistências!**

> 📖 **Maziero, cap. 9 (p. 103–111):** pipes (9.1), filas de mensagens (9.2), memória compartilhada (9.3).

### Condições de disputa (race conditions)
Exemplo (Maziero 10.1): função `depositar(saldo, valor) { (*saldo) += valor; }` — em Assembly vira: carregar saldo em registrador → carregar valor → somar → escrever de volta. Duas tarefas depositam R$ 50 e R$ 1000 numa conta com R$ 0:
- sem entrelaçamento → saldo final R$ 1050 ✅;
- com entrelaçamento (ambas leem 0 antes de alguma escrever) → saldo final R$ 50 ou R$ 1000 ❌ (um depósito se perde: vale a última escrita).

**Definição:** ocorre quando **dois ou mais processos/threads acessam o mesmo dado**, **pelo menos um o modifica**, e o **resultado depende da ordem de execução**. Pode ocorrer em memória, arquivos, variáveis etc.
São **erros dinâmicos**: não aparecem no código-fonte e só se manifestam em certos entrelaçamentos — difíceis de detectar e reproduzir.

**Condições de Bernstein** (livro, 10.1.3): t1 e t2 podem executar em paralelo sem disputa sse R(t1)∩W(t2) = ∅, R(t2)∩W(t1) = ∅ e W(t1)∩W(t2) = ∅ — leituras concorrentes nunca geram disputa.

### Região crítica
Trecho do programa que **acessa dados ou recursos compartilhados** (no exemplo: `(*saldo) += valor;`).
**O que proteger:** ❌ não o programa inteiro (ineficiente); ✅ apenas o trecho crítico; ✅ a operação que deve ser indivisível; ✅ onde a interferência causa erro. **A região crítica deve ser a menor possível.**

### Exclusão mútua — os quatro mandamentos
Garantir acesso exclusivo à região crítica para evitar condições de disputa.
1. **Nunca dois processos simultaneamente na região crítica** (exclusão mútua).
2. **Independência de fatores externos:** nada se assume sobre velocidade, temporizações ou número de processadores.
3. **Um processo fora da região crítica não pode bloquear outro** (independência de outras tarefas). Ex.: A não usa o recurso, B quer entrar → A não deve impedir.
4. **Nenhum processo espera eternamente** (espera limitada, sem inanição).

**Exemplo prático — servidor HTTP:** regiões críticas em cache compartilhada, fila de requisições, contador de acessos, arquivo de log, pool de conexões.

### Soluções para a exclusão mútua
**Inibição de interrupções (livro, 10.2.1):** desligar interrupções na seção crítica; perigosa (laço infinito trava o sistema, E/S não é atendida) e inútil em multiprocessadores — só usada dentro do núcleo.

**Solução trivial com espera ocupada:**
```c
int busy = 0;
void enter() { while (busy) {}; busy = 1; }
void leave() { busy = 0; }
```
**Não funciona!** O teste (`while(busy)`) e a atribuição (`busy = 1`) ocorrem em momentos distintos; uma troca de contexto entre eles permite que duas tarefas entrem juntas. Além disso, a **espera ocupada** (*busy wait*) consome CPU.

**Alternância de turno:**
```c
int turn = 0;
void enter(int task) { while (turn != task) {}; }
void leave(int task) { turn = (turn + 1) % num_tasks; }
```
Exemplo do slide: A e B com `turn = 0`. Garante exclusão mútua (A e B nunca entram juntos), **mas** obriga alternância estrita: se A não quiser entrar, B fica impedido (viola o mandamento 3/progresso, podendo causar inanição) — e ainda usa espera ocupada.

**Solução de Peterson (1981; Dekker propôs a primeira em 1965):**
```c
int turn = 0;          // de quem é a vez
int wants[2] = {0, 0}; // intenção de entrar
void enter(int task) { // task = 0 ou 1
  int other = 1 - task;
  wants[task] = 1;     // declara intenção
  turn = other;        // cede a vez
  while (wants[other] && turn == other) {}; // espera condicional
}
void leave(int task) { wants[task] = 0; }
```
Elementos: **intenção de entrar**, **variável de vez**, **espera condicional** (espera só se o outro também quer e é a vez dele). Garante exclusão mútua e espera limitada para **duas** tarefas.
**Limitações:** 🔄 usa espera ocupada (laço `while`); 🖥 desperdício de processamento; ⚖ **inversão de prioridade** — um processo de baixa prioridade pode bloquear um de alta prioridade.

**Operações atômicas (livro, 10.2.5):** instruções de hardware como **TSL** (*Test-and-Set Lock*) e **XCHG** testam e alteram uma variável de forma indivisível — resolvem a falha da solução trivial (base dos *spinlocks*), mas ainda com espera ocupada.

> 📖 **Maziero, cap. 10 "Coordenação entre tarefas" (p. 112–122):** condições de disputa (p. 113), Bernstein (p. 115), seções críticas (p. 115), exclusão mútua (p. 116–120), problemas das soluções (10.3: ineficiência, injustiça, dependência de quantidade de tarefas).

### Desafios da fase 2.3
1. **Pipe UNIX é:** **a) unidirecional, 1:1 e orientado a fluxo** · b) bidirecional e por mensagens · c) M:N · d) não confiável
2. **Três ingredientes de uma condição de disputa?** → Acesso concorrente ao mesmo dado; ao menos uma escrita; resultado depende da ordem.
3. **Por que a solução com `busy` falha?** → Teste e atribuição não são atômicos.
4. **Qual mandamento a alternância de turno viola?** → Um processo fora da região crítica não deve bloquear outro (progresso).
5. **Por que condições de disputa são difíceis de depurar?** → São erros dinâmicos, dependentes do entrelaçamento.
6. **Comunicação semissíncrona é…** → bloqueante até um prazo; depois retorna erro.
7. **Duas tarefas só leem a mesma variável. Há condição de disputa?** → Não (Bernstein).

---

## Fase 2.4 — Semáforos e Monitores

### Bloco-ponte: semáforos (complemento do livro, cap. 11.1–11.3)
**Semáforo (Dijkstra, 1965):** contador inteiro + fila de tarefas suspensas, acessível só por duas operações **atômicas**:
- `down(s)` (P, *wait*): decrementa; se ficar negativo, a tarefa é **suspensa** na fila (sem espera ocupada);
- `up(s)` (V, *signal*): incrementa; se houver tarefas esperando, **acorda** uma.
Semáforo iniciado em 1 = exclusão mútua (`down(mutex)` → região crítica → `up(mutex)`); iniciado em N = controle de N recursos.
**Mutex:** semáforo binário simplificado (`lock`/`unlock`; ex.: `pthread_mutex_lock`).
**Variável de condição:** permite esperar uma condição dentro de uma seção protegida (`wait(c, m)`, `notify(c)`/`signal`, `broadcast`).

### Por que monitores?
Semáforos são eficazes, mas: exigem uso correto de `down`/`up`; **erros sutis** quebram toda a sincronização; **difíceis de testar** (erros só em certas sequências).

**Erro comum:** sequência correta `down(mutex)` → região crítica → `up(mutex)`. Sequência incorreta `up(mutex)` → região crítica → `down(mutex)` → **todos os processos podem entrar na região crítica simultaneamente**.

**Questão central:** "Será simples criar soluções corretas com semáforos em todos os casos?" → **Nem sempre.**

### Origem e definição
- **C. A. R. Hoare** propôs em **1974** como unidade de sincronização de alto nível; **Per Brinch Hansen** formalizou em **1975**. Objetivo: facilitar soluções corretas.
- **Monitor** = módulo que agrupa **funções** (operações sobre os dados compartilhados), **variáveis** (estado interno protegido) e **estruturas de dados** (dados compartilhados encapsulados).
- **Monitor como TAD:** dados protegidos (não acessíveis diretamente), acesso só pelos procedimentos do monitor, detalhes internos ocultos.
- **Encapsulamento:** processos ✅ podem chamar procedimentos e usar as operações fornecidas; ❌ não podem acessar variáveis/estruturas internas nem manipular os dados diretamente → menos uso incorreto.

```
monitor NomeDoMonitor {
  variáveis privadas;
  método1() { /* operação sobre dados internos */ }
  método2() { /* operação sobre dados internos */ }
}
```

### Exclusão mútua no monitor
**Apenas um processo/thread ativo dentro do monitor por vez.** Se já há um ativo, o novo é bloqueado até o monitor ficar disponível; quando o processo sai, outro pode entrar.
**Quem controla?** A **linguagem, o compilador ou o interpretador** — o programador não insere `down`/`up` manualmente.
**Papel do compilador:** ao chamar um procedimento do monitor, verifica se há outro processo ativo: livre → libera a entrada; ocupado → bloqueia até ficar disponível.

**Por que reduz erros?** Com semáforos, o programador controla `down`/`up` (risco de esquecer, inverter ou posicionar mal). Com monitores, a entrada é automática e o programador foca na lógica.

**Monitor × semáforo binário:** uma implementação simples de monitor usa internamente um semáforo binário. Diferença na abstração: semáforo = controle **explícito** pelo programador; monitor = controle **encapsulado** pela linguagem. "Mesma base, nível de abstração diferente."

**Linguagens sem suporte direto (C, Pascal):** 01 usar bibliotecas que emulam monitores; 02 usar semáforos para implementar manualmente o controle equivalente; 03 simular a lógica de acesso no espaço de usuário.

### Monitores em Java
Em Java, **todo objeto possui um monitor** associado — um "passe" que só uma thread pode possuir por vez.
**`synchronized` em métodos:** a thread tenta adquirir o monitor do objeto → se conseguir, executa; senão, bloqueia → ao sair, o monitor é liberado automaticamente.
```java
public synchronized void alterarDados() { /* região protegida */ }
```
Garantia: apenas uma thread por vez executa esse método **no mesmo objeto**.
**`synchronized` em blocos:**
```java
synchronized (objeto) { /* região protegida */ }
```
Vantagens: menor tempo bloqueado, mais flexibilidade (protege exatamente o necessário), maior paralelismo nas partes não protegidas. **Cuidados:** código menos coeso; uso do monitor de outro objeto; maior chance de erro de projeto; manutenção mais difícil.
(Java também oferece `wait()`, `notify()` e `notifyAll()` como variáveis de condição do monitor.)

### Monitores × Semáforos
| Semáforos | Monitores |
|---|---|
| Mecanismo mais básico | Mecanismo de mais alto nível |
| Dependem de `down`/`up` corretos | Encapsulam dados e operações |
| Flexíveis | Exclusão mútua automática |
| Podem gerar erros difíceis de detectar | Reduzem erros comuns |

**Quando usar monitores:** há dados compartilhados; encapsulamento é importante; quer-se reduzir erros de sincronização; a linguagem oferece suporte e o código precisa de clareza.
**Limitações:** o projeto das **condições de espera** continua com o programador; a **ordem das chamadas** pode gerar bloqueios indesejados; interação entre objetos em aplicações complexas ainda exige atenção.

> 📖 **Maziero, cap. 11 "Mecanismos de coordenação" (p. 123–133):** semáforos (11.1), mutexes (11.2), variáveis de condição (11.3), **monitores (11.4, p. 129)** — incluindo o exemplo de conta bancária com monitor e o `synchronized` de Java.

### Desafios da fase 2.4
1. **O que acontece se o programador escrever `up(mutex)` antes da região crítica e `down(mutex)` depois?** → Todos podem entrar na região crítica ao mesmo tempo.
2. **Quem garante a exclusão mútua em um monitor?** a) O programador · **b) A linguagem/compilador** · c) O hardware · d) O usuário
3. **Quem propôs os monitores?** → Hoare (1974) e Brinch Hansen (1975).
4. **Em Java, `synchronized` em bloco é vantajoso porque…** → protege só o trecho necessário, reduzindo o tempo de bloqueio.
5. **Verdadeiro ou falso:** "Monitores eliminam totalmente a possibilidade de deadlock." → **Falso** (a ordem das chamadas ainda pode causar bloqueios).
6. **Semáforo iniciado com 3 serve para…** → permitir até 3 tarefas simultâneas no recurso.

---

## Fase 2.5 — Escalonamento de processos

**Pergunta-guia:**
> "Se vários processos estão prontos para executar… como o sistema operacional decide quem usa a CPU primeiro?"

### Fila de prontos e escalonamento
Todos os processos no estado pronto aguardam na **fila de prontos**: seleção → execução (até terminar, bloquear ou perder a vez).
**Escalonamento** ocorre quando dois ou mais processos estão prontos ao mesmo tempo. O escalonador decide **qual** processo usa a CPU e **quando** trocar.
**Objetivos:** justiça entre usuários e processos; uso eficiente dos recursos; reduzir trocas de contexto; priorizar aplicações; cumprir as políticas; manter a CPU bem aproveitada.

**Por que era tão importante:** em sistemas antigos o tempo de CPU era escasso; uma má escolha prejudicava muito o desempenho; com vários usuários, o tempo de resposta virou fator crítico.
**Hoje:** em PCs, muitos programas são limitados pela entrada de dados e a CPU fica ociosa boa parte do tempo (o alto clock influencia a percepção); em **servidores**, com muitas requisições simultâneas, o escalonamento continua muito importante.

**Quando escalonar:** 🔚 processo termina; ⏸ processo bloqueia (E/S/evento); 🔄 processo retorna à fila (pronto); ⏰ interrupção de clock (fim do quantum).

**Tipos de tarefa (livro 6.1):** *CPU-bound* (orientadas a processamento) × *IO-bound* (orientadas a E/S) — uma tarefa pode alternar entre fases.

### Objetivos por tipo de sistema
- **Tempo real:** previsibilidade (controle industrial, multimídia) — cumprir **deadlines**, evitar perda de dados, comportamento previsível.
- **Interativos:** respondem rapidamente a eventos (editores, navegadores, jogos, servidores) — reduzir **tempo de resposta**, satisfazer o usuário, fluidez.
- **Lote:** sem requisitos temporais explícitos (backup, antivírus, cálculos longos, renderização) — maximizar **vazão** (*throughput*), reduzir tempo de retorno, manter a CPU ocupada.

### Critérios de escalonamento
- **Tempo de execução / retorno (*turnaround*, tt):** da criação ao encerramento = tempo de processamento (tp) + tempo de espera. Típico de lote.
- **Tempo de espera (*waiting*, tw):** tempo total na **fila de prontos** (não inclui espera de E/S).
- **Tempo de resposta (*response*, tr):** da chegada de um evento (ex.: tecla) ao resultado imediato (caractere na tela). Típico de interativos.
- **Justiça:** tarefas de comportamento e prioridade similares têm durações similares.
- **Eficiência:** grau de uso do processador em trabalho útil.
Objetiva-se **maximizar** utilização e vazão da CPU e **minimizar** tempo de execução, de espera e de resposta.

**Efeito do quantum (slides 1A/1B):**
- *Quantum curto (5 ms):* alta interatividade, mas baixa vazão — muitas trocas, overhead alto (ex.: ~30% de uso útil, ~70% de overhead).
- *Quantum longo (50 ms):* baixa interatividade, alta vazão (ex.: ~90% de uso útil, ~10% de overhead), melhor para tarefas longas.
- *Sem quantum (cooperativo):* a tarefa executa até terminar — baixa interatividade. O **quantum ideal** equilibra eficiência e responsividade.

### Procedimento — troca de contexto
1) salvar registradores; 2) armazenar informações na tabela de processos; 3) considerar dados de cache; 4) selecionar novo processo; 5) restaurar informações do novo processo.

### Preemptivo × não preemptivo
- **Não preemptivo (cooperativo):** o processo executa até terminar ou bloquear; sem decisões por interrupção de relógio. Uso: **lote**. (Ex. histórico: Windows 3.x, MacOS 8/9.)
- **Preemptivo:** o escalonador pode interromper o processo e entregar a CPU a outro (fim de quantum ou chegada de tarefa mais prioritária). Uso: **interativos**. (Linux, Windows NT, Solaris têm núcleos preemptivos.)

### Algoritmos (exemplo base — Maziero, Tabela 6.1)
| Tarefa | t1 | t2 | t3 | t4 | t5 |
|---|---|---|---|---|---|
| Ingresso | 0 | 0 | 1 | 3 | 5 |
| Duração | 5 | 2 | 4 | 1 | 2 |
| Prioridade | 2 | 3 | 1 | 4 | 5 |

**FCFS — First Come, First Served:** atende na ordem de chegada (fila FIFO). Fácil de entender e implementar; não preemptivo.
Sequência: t1[0–5] t2[5–7] t3[7–11] t4[11–12] t5[12–14] → **Tt = 8,0 s; Tw = 5,2 s**.
Limitações: **efeito comboio** — um job longo na frente faz todos esperarem; jobs curtos ficam presos atrás de longos.

**Round-Robin (RR):** FCFS + preempção por **quantum** (alternância circular). Antigo, justo, amplamente usado. Com tq = 2: sequência t1→t2→t3→t1→t4→t5→t3→t1 → **Tt = 8,4 s; Tw = 5,6 s**, 7 trocas de contexto. Pior para lote, mas melhor tempo de resposta para interativos.

**SJF — Shortest Job First:** executa primeiro o job de menor duração; não preemptivo; exige **conhecer/estimar** a duração (estimativa pelo histórico recente dos últimos quanta).
Sequência: t2[0–2] t3[2–6] t4[6–7] t5[7–9] t1[9–14] → **Tt = 5,8 s; Tw = 3,0 s**. ⚠ Pode causar **inanição** dos jobs longos.

**SRTF — Shortest Remaining Time First:** versão preemptiva do SJF — executa o de **menor tempo restante**; jobs curtos que chegam tarde não ficam presos.
Sequência: t2[0–2] t3[2–3] t4[3–4] t3[4–7] t5[7–9] t1[9–14] → **Tt = 5,4 s; Tw = 2,6 s** (os menores possíveis). ⚠ Inanição possível.

**Prioridades:** cada processo tem uma prioridade (por data, duração, tipo de tarefa, proprietário…); pode ser **cooperativo (PRIOc)** ou **preemptivo (PRIOp)**; processos que interagem com usuários podem receber mais atenção; pode haver várias filas por prioridade.
- PRIOc (escala positiva — maior número = mais prioridade): t2[0–2] t1[2–7] t5[7–9] t4[9–10] t3[10–14] → **Tt = 6,6; Tw = 3,8**.
- PRIOp: t2[0–2] t1[2–3] t4[3–4] t1[4–5] t5[5–7] t1[7–10] t3[10–14] → **Tt = 5,6; Tw = 2,8**.
- **Política de prioridades** (pergunta do slide, ilustrada com a cobertura das eleições de 2022): fatores **externos** (classe do usuário, valor pago, importância da tarefa) e **internos** (idade, duração estimada, interatividade, uso de recursos).
- **E se os de prioridade alta se mantiverem em execução?** → **Inanição** dos de baixa prioridade. Caso famoso: no IBM 7094 do MIT, ao ser desligado em 1973, encontrou-se um processo de baixa prioridade submetido em 1967 que nunca havia executado.
- **Solução — envelhecimento (*aging*, PRIOd):** a cada turno, as tarefas que não foram escolhidas "envelhecem" (prioridade dinâmica += α) e no próximo turno têm mais chance; a escolhida volta à prioridade estática. PRIOd: **Tt = 5,8; Tw = 3,0**.

**Loteria:** o SO distribui **bilhetes** aos processos e sorteia um; o sorteado recebe a CPU. Mais importantes recebem mais bilhetes. **P(ganhar) = bilhetes do processo / total de bilhetes.** ⚠ Depende de aleatoriedade (pouco previsível); inanição ainda possível, embora com baixa probabilidade.

**Comparação (Maziero, Tabela 6.2):**
| | FCFS | RR | SJF | SRTF | PRIOc | PRIOp | PRIOd |
|---|---|---|---|---|---|---|---|
| Tempo médio de execução Tt | 8,0 | 8,4 | 5,8 | 5,4 | 6,6 | 5,6 | 5,8 |
| Tempo médio de espera Tw | 5,2 | 5,6 | 3,0 | 2,6 | 3,8 | 2,8 | 3,0 |
| Trocas de contexto | 4 | 7 | 4 | 5 | 4 | 6 | 6 |
| Tempo total de processamento | 14 | 14 | 14 | 14 | 14 | 14 | 14 |

### Escalonamento no Linux
Classes de escalonamento, cada uma com sua fila (*Multiple Feedback Queues*), núcleo 4.16 (2018):
- **SCHED_DEADLINE:** tempo real periódico com prazos; algoritmo **EDF** (*Earliest Deadline First*).
- **SCHED_FIFO:** prioridade fixa preemptiva, sem envelhecimento nem quantum (executa até bloquear, chamar `sched_yield()` ou ser preemptada por maior prioridade).
- **SCHED_RR:** como FIFO + Round-Robin; quantum proporcional à prioridade (10–200 ms).
- **SCHED_NORMAL/OTHER:** padrão, tarefas interativas; prioridades dinâmicas e RR com quantum variável.
- **SCHED_BATCH:** como NORMAL, para tarefas CPU-bound, ativadas menos frequentemente.
- **SCHED_IDLE:** menor prioridade; só executa se não houver mais nada.
Ordem: DEADLINE > FIFO > RR > NORMAL/BATCH/IDLE. As classes interativas usam o **CFS** (*Completely Fair Scheduler*, prioridades −20 a +19, árvore rubro-negra, O(log n)); as de tempo real têm prioridades 1–99.

### Multiprocessadores
- **Afinidade de processador:** manter o processo na mesma CPU para aproveitar o **cache** (figura: partições de CPUs para conjuntos de processos).
- **Balanceamento de carga:** distribuir processos para evitar CPU sobrecarregada e outra ociosa — **push migration** (o sistema empurra processos de uma CPU ocupada para outra) e **pull migration** (CPU ociosa puxa processos de outra).
- **Assimétrico:** um processador principal decide e distribui; simples, mas gargalo.
- **Simétrico (SMP):** todos participam do escalonamento, com fila comum ou por CPU; mais flexível, exige sincronização entre processadores.

### Exercício do slide (com gabarito calculado)
Tarefas: t1(ingresso 0, duração 5, prio 2), t2(0, 4, 3), t3(3, 5, 5), t4(5, 6, 9), t5(7, 4, 6). Escala positiva; desempate pela ordem de chegada.
| Política | Sequência | Tt médio | Tw médio |
|---|---|---|---|
| (a) FCFS | t1[0–5] t2[5–9] t3[9–14] t4[14–20] t5[20–24] | 11,4 | 6,6 |
| (b) SJF | t2[0–4] t1[4–9] t5[9–13] t3[13–18] t4[18–24] | 10,6 | 5,8 |
| (c) SRTF | igual ao SJF neste caso | 10,6 | 5,8 |
| (d) PRIOc | t2[0–4] t3[4–9] t4[9–15] t5[15–19] t1[19–24] | 11,2 | 6,4 |
| (e) PRIOp | t2[0–3] t3[3–5] t4[5–11] t5[11–15] t3[15–18] t2[18–19] t1[19–24] | 14,4 | 9,6 |
| (f) RR, tq = 2 | t1 t2 t1 t3 t2 t4 t1 t5 t3 t4 t5 t3 t4 (trocas em 2,4,6,8,10,12,13,15,17,19,21,22) | 15,0 | 10,2 |

> 📖 **Maziero, cap. 6 "Escalonamento de tarefas" (p. 70–85):** tipos de tarefas (6.1), métricas (6.2), preemptivo × cooperativo (6.3), algoritmos FCFS, RR, SJF, SRTF, PRIOc/p/d, definição de prioridades e comparação (6.4), escalonadores reais (6.5). **Cap. 7 (p. 86–90):** inversão e herança de prioridades.

### Desafios da fase 2.5
1. **Qual algoritmo tem o menor tempo médio de espera?** a) FCFS · b) RR · **c) SRTF** · d) PRIOc
2. **O que é efeito comboio?** → Jobs curtos esperando atrás de um job longo no FCFS.
3. **Como evitar inanição nas prioridades?** → Envelhecimento (aging).
4. **Tempo de espera inclui tempo bloqueado em E/S?** → Não; só tempo na fila de prontos.
5. **Quantum muito pequeno causa…** → muitas trocas de contexto e baixa eficiência.
6. **Processo com 3 de 10 bilhetes na loteria tem que chance?** → 30%.
7. **Afinidade de processador serve para…** → aproveitar dados ainda no cache da CPU.
8. **Qual classe Linux usa EDF?** → SCHED_DEADLINE.

---

## Fase 2.6 — Problemas clássicos de coordenação

**Por que estudar?** Representam situações recorrentes em sistemas reais; ajudam a testar primitivas de sincronização; servem de referência prática. Permitem analisar **disputa por recursos**, **exclusão mútua**, **deadlock e starvation** e **eficiência e corretude** de algoritmos concorrentes.

### Produtores e consumidores (buffer limitado)
Tarefas acessam um **buffer compartilhado de capacidade N** (inteiros, registros, mensagens…). Três aspectos de coordenação:
1. **Exclusão mútua** no acesso ao buffer (evitar corrupção);
2. **Buffer cheio** → produtores suspensos até haver vaga;
3. **Buffer vazio** → consumidores suspensos até haver item.
Solução com semáforos (Maziero 12.1):
```c
sem_t mutex = 1;   // exclusão mútua no buffer
sem_t item  = 0;   // itens disponíveis
sem_t vaga  = N;   // vagas livres
produtor: down(vaga); down(mutex); depositar(item); up(mutex); up(item);
consumidor: down(item); down(mutex); retirar(item); up(mutex); up(vaga);
```
(A ordem dos `down` importa: trocar `down(mutex)` com `down(vaga)` pode causar deadlock.)

### Leitores e escritores
Várias tarefas leem ou escrevem uma área compartilhada. Pelas **condições de Bernstein**, leituras podem ocorrer em paralelo; escritas exigem **acesso exclusivo**.
- **Solução simples:** um mutex/semáforo iniciado em 1 para toda a área → correta, mas **baixo desempenho** (limita leitores desnecessariamente).
- **E se priorizássemos os leitores?** Contador de leitores (`nl`) protegido por um mutex: o **primeiro** leitor a entrar bloqueia a área para escritores; o **último** a sair a libera. Leitores leem em paralelo — mas escritores podem sofrer **inanição** se sempre houver leitores.

### Jantar dos selvagens
Variação de produtor/consumidor: tribo com **caldeirão de N porções**. Selvagem retira uma porção; se vazio, **acorda o cozinheiro** e espera; o cozinheiro enche o caldeirão e volta a dormir.
Regras: só um selvagem se serve por vez (vários comem ao mesmo tempo); ninguém se serve com o caldeirão vazio; o cozinheiro só repõe quando estiver totalmente vazio.
Solução (Downey, 2016): semáforos — um para exclusão mútua no caldeirão, um para acordar o cozinheiro (`vazio`) e um para os selvagens aguardarem (`cheio`).

### Jantar dos filósofos
Cinco filósofos alternam entre **pensar e comer**; cinco pratos, **cinco garfos** compartilhados e macarrão no centro. Para comer, cada um precisa dos **dois garfos** (esquerda e direita); vizinhos não comem juntos. Não se comunicam, não conhecem o estado dos outros e **não há controle centralizado**.
**Ensina:** recursos limitados, processos independentes, exclusão mútua, risco de **deadlock** (todos pegam o garfo da esquerda e esperam o da direita) e de **starvation**, necessidade de algoritmos corretos.
**Solução do saleiro:** para comer, o filósofo pega primeiro o **saleiro**, depois os dois garfos, devolve o saleiro e come — só um tenta pegar garfos por vez, evitando o impasse.
**Ponto fraco?** → Serializa a obtenção de garfos e **reduz o paralelismo**: filósofos não vizinhos que poderiam comer juntos esperam pelo saleiro; o saleiro vira gargalo/controle centralizado. Outras soluções: inverter a ordem de um filósofo (quebra a espera circular), limitar a 4 filósofos à mesa, pegar ambos os garfos atomicamente.

> 📖 **Maziero, cap. 12 "Problemas clássicos" (p. 134–147):** produtores/consumidores com semáforos e com variáveis de condição (12.1), leitores/escritores simplista e com prioridade aos leitores (12.2), jantar dos selvagens (12.3), jantar dos filósofos e soluções (12.4).

### Desafios da fase 2.6
1. **No produtor/consumidor, quantos semáforos a solução clássica usa?** → Três (mutex, item, vaga).
2. **Por que leitores podem acessar em paralelo?** → Leituras não modificam os dados (Bernstein).
3. **Risco da prioridade aos leitores?** → Inanição dos escritores.
4. **Quando o cozinheiro age no jantar dos selvagens?** → Só quando o caldeirão está vazio e alguém o acorda.
5. **Se cada filósofo pegar o garfo esquerdo ao mesmo tempo, o que ocorre?** → Deadlock.
6. **Ponto fraco do saleiro?** → Perda de paralelismo (gargalo).

---

## Fase 2.7 — Deadlocks (impasses)

### Introdução
O controle de concorrência suspende tarefas enquanto outras acessam recursos; cada recurso tem um semáforo/mutex. Em alguns casos, isso leva a **impasses**: todas as tarefas envolvidas ficam **bloqueadas aguardando** liberações, e **nada mais acontece**.

**Exemplo (Maziero 13.1) — transferência entre contas:** a tarefa t1 transfere de c1 para c2 (`lock(c1)`, depois `lock(c2)`); t2 transfere de c2 para c1 (`lock(c2)`, depois `lock(c1)`). Se t1 obtém c1 e t2 obtém c2, cada uma espera pela outra para sempre: **t1 → c2 → t2 → c1 → t1**.

### Condições de Coffman (devem ocorrer simultaneamente)
1. **Exclusão mútua:** só uma tarefa por vez acessa cada recurso (cada conta).
2. **Posse e espera:** a tarefa mantém o recurso obtido e solicita outro.
3. **Não preempção:** recursos só são liberados explicitamente por quem os detém.
4. **Espera circular:** ciclo de esperas (t1 → t2 → t1).
**Jantar dos filósofos:** cada garfo é exclusivo; cada filósofo segura um garfo e espera o outro; ninguém toma o garfo do vizinho; o círculo da mesa forma a espera circular.

⚠ **As quatro condições são necessárias, mas não suficientes:** se uma faltar, não há impasse; porém as quatro presentes não garantem impasse. Só são **suficientes** quando há **uma única instância** de cada tipo de recurso.

### Grafos de alocação de recursos
🔵 **Processos/tarefas** = círculos; 🟥 **recursos** = retângulos; **→ aresta de posse** (recurso alocado à tarefa); **- -> aresta de requisição** (tarefa pede o recurso).
Ciclo no grafo: processos no ciclo estão bloqueados, aguardam recursos uns dos outros e não prosseguem sozinhos. Ex.: `t1 - -> c2 → t2 - -> c1 → t1`.
(Com várias instâncias por recurso — vários pontos no retângulo — um ciclo pode existir sem impasse.)

### Estratégias de tratamento
**1) Ignorar — algoritmo do avestruz:** "fingir que o problema não existe". Ignora o deadlock, aceita o risco, evita o custo. Aceitável se deadlocks são raros, o custo de prevenção é alto e o sistema não é crítico. **Inaceitável** em sistemas médicos, militares, que não podem parar ou de alto impacto.

**2) Prevenção — quebrar uma das quatro condições:**
- *Exclusão mútua:* usar um **servidor/spooler** que gerencia o recurso (ex.: *printer spooler* — os processos não precisam de acesso exclusivo à impressora). Difícil para arquivos e memória compartilhada.
- *Posse e espera:* usar um recurso por vez (dividir a transferência em débito em c1 e crédito em c2, sem segurar as duas contas); ou pedir todos os recursos de uma vez; ou **time-out** na solicitação (expirado, desiste e libera o que detém).
- *Não preempção:* permitir "arrancar" o recurso — viável para recursos cujo estado pode ser salvo/restaurado (páginas de memória, o próprio processador); difícil para arquivos e memória compartilhada (violaria a exclusão mútua).
- *Espera circular:* **ordem global** dos recursos e pedidos sempre nessa ordem (ex.: c1 < c2 → todas pedem primeiro a conta de menor número). Filósofos: fi (i = 0…3) pegam pi e depois pi+1; f4 pega p0 e depois p4.

**3) Impedimento (*avoidance*):** acompanhar a alocação e **negar** pedidos que possam levar a impasse, mantendo o sistema em **estado seguro** (existe uma ordem em que todas as tarefas conseguem terminar). **Algoritmo do banqueiro** (Dijkstra, 1965): tarefas = clientes; recursos = crédito emprestado; só se concede um pedido se o estado resultante continuar seguro. Exige conhecer de antemão a demanda máxima de cada tarefa.

**4) Detecção e resolução:** o sistema **permite** impasses e depois os identifica e resolve. Detecção: análise periódica do grafo em busca de **ciclos** — verificar muito custa caro; verificar pouco atrasa a detecção.
Resolução:
- **Eliminar tarefas:** encerrar uma ou mais tarefas do ciclo para liberar recursos (critérios: tempo de vida, recursos detidos, prejuízo aos usuários).
- **Retroceder tarefas (*rollback*):** desfazer parte da execução até um estado seguro anterior, salvando estados periodicamente (*checkpoints*). Operações de rede ou interação com usuário podem ser impossíveis de desfazer (como "desenviar" um pacote ou um áudio já tocado?).

### Questões para discussão (do slide)
- *"Em uma situação de deadlock, o processador está consumindo recurso?"* → Em geral **não**: as tarefas envolvidas estão **bloqueadas** (suspensas) e fora da fila de prontos; a CPU atende outras tarefas ou fica ociosa. Só haveria consumo se a espera fosse **ocupada** (spinlock), caso chamado às vezes de *livelock*.
- *A telinha "Não está respondendo" do Windows é deadlock?* → Não necessariamente: o Windows detecta que a interface **não respondeu às mensagens dentro de um timeout**; isso não prova um deadlock, mas um deadlock pode ser uma das causas.

> 📖 **Maziero, cap. 13 "Impasses" (p. 148–159):** exemplo (13.1), condições (13.2), grafos de alocação (13.3), técnicas de tratamento — prevenção (p. 153), impedimento/banqueiro (p. 154), detecção e resolução (p. 155).

### Desafios da fase 2.7
1. **Quais são as quatro condições de Coffman?** → Exclusão mútua, posse e espera, não preempção, espera circular.
2. **Ordenar globalmente os recursos quebra qual condição?** a) Exclusão mútua · b) Posse e espera · c) Não preempção · **d) Espera circular**
3. **O spooler de impressão previne impasse quebrando…** → a exclusão mútua.
4. **O algoritmo do banqueiro é uma técnica de…** → impedimento (evitar estados inseguros).
5. **Algoritmo do avestruz é aceitável em um respirador hospitalar?** → Não.
6. **Um ciclo no grafo com recursos de instância única indica…** → impasse.
7. **Rollback exige…** → salvar periodicamente o estado das tarefas.
8. **As quatro condições presentes garantem deadlock?** → Não (necessárias, não suficientes), salvo com uma instância por recurso.
