# Trilha 3 — Gerenciamento de Memória

> **Origem:** pasta `Gerenciamento de memoria` (Aulas 12, 13, 14 e 15 — Prof. Romário da Silva Borges, UNIFAL-MG)
> **Livro de referência:** MAZIERO, Carlos A. *Sistemas Operacionais: Conceitos e Mecanismos*. DINF/UFPR, 2019 — Parte IV "Gestão da memória" (caps. 14–18, p. 160–232).

| Fase | Aula | Tema | Livro (Maziero) |
|---|---|---|---|
| 3.1 | Aula 12 | Gerenciamento de memória: hardware, memória virtual, partições, segmentos e páginas | cap. 14 (p. 161–183) |
| 3.2 | Aula 13 | Uso da memória: espaço de endereçamento, alocação de variáveis, atribuição de endereços | cap. 15 (p. 184–193) |
| 3.3 | Aula 14 | Alocação de memória: alocadores, fragmentação, estratégias, Buddy e Slab | cap. 16 (p. 194–204) |
| 3.4 | Aula 15 | Paginação em disco: page fault, algoritmos de substituição, Belady, thrashing | cap. 17 (p. 205–225) |

---

## Fase 3.1 — Gerenciamento de Memória

### O que o gerenciador de memória faz?
- **Alocar** memória para novos processos;
- **Liberar** memória de processos finalizados;
- **Expandir** memória quando um processo precisa de mais espaço;
- **Controlar o endereçamento** (espaços de endereçamento dos processos);
- **Realizar swapping** (trocar processos com o disco quando necessário).

### Hardware de memória — o desejo do programador
**Expectativa:** memória infinitamente grande (sem limites de espaço), extremamente rápida (sem atrasos) e não volátil (dados preservados sem energia).
**Realidade:** "Programas tendem a expandir-se a fim de preencher a memória disponível para contê-los" — A. Tanenbaum.

**Hierarquia de memória (livro 14.1, Tabela 14.1):** quanto mais rápida, menor, mais cara e (em geral) volátil:
| Nível | Tamanho típico | Tempo de acesso aproximado |
|---|---|---|
| Registradores da CPU | bytes | ~0,1–1 ns |
| Cache L1/L2/L3 (SRAM) | KB a MB | ~1–20 ns |
| Memória RAM (DRAM) | GB | ~50–100 ns |
| Memória flash / SSD | centenas de GB | ~25–100 µs |
| Disco rígido | TB | ~5–10 ms |
| Fita / mídia ótica | TB | segundos |
(Valores de ordem de grandeza; ver tabela completa no livro.)

**Memória física:** vetor de bytes endereçáveis na RAM, acessado pelo processador via barramento; o mapa de memória inclui RAM, ROM/BIOS e áreas de dispositivos.
**Memória virtual:** abstração em que cada processo vê seu próprio espaço de endereços, independente da memória física.

### O problema do espaço
Desde os primórdios existem programas maiores que a memória disponível. **Como executar algo que não cabe inteiro na memória?**

**Solução inicial — overlays (sobreposição):** ex. do slide: programa de **40 KB**, dividido em **20 módulos de 2 KB**, com espaço para **2 KB por módulo** na memória.
Funcionamento: 1) carrega-se um **módulo inicial**; 2) os demais são carregados **sob demanda**; 3) a **coordenação é do programador**, que organiza manualmente as trocas durante a execução.

**Da sobreposição à memória virtual (1961):** a responsabilidade de gerenciar partes do programa passa ao SO. O **SO escolhe** quais partes ficam na memória; **carga dinâmica** conforme a necessidade; um **programa maior** que a RAM pode executar.
**A memória virtual cria a ilusão de que o processo possui mais memória do que a RAM física disponível.**

### Endereço físico e lógico
- **Endereços físicos:** posições dos bytes na memória física; a quantidade depende da RAM instalada.
- **Endereços lógicos (virtuais):** usados pelos processos, pelo SO e pelo processador durante a execução; definidos pelo **espaço de endereçamento suportado pelo processador** (ex.: 2³² em 32 bits; 2⁴⁸ úteis no x86-64).

### MMU — Memory Management Unit
Componente de **hardware** que traduz endereços lógicos em físicos; na maioria dos processadores atuais é **integrada ao chip da CPU**. Se o endereço for inválido, a MMU gera uma **exceção** (falha de endereçamento) tratada pelo núcleo.

### Memória virtual por partições
A memória física é dividida em **partições** (iguais ou diferentes, fixas ou variáveis); cada uma armazena um processo. A MMU usa dois registradores:
- **Registrador-base (B):** endereço físico inicial da partição;
- **Registrador-limite (L):** tamanho da partição em bytes.
Tradução: se `endereço_lógico < L` → `endereço_físico = B + endereço_lógico`; senão → **exceção** (acesso inválido). A cada troca de contexto, B e L são recarregados.
*Exemplo:* B = 10.000, L = 2.000. Endereço lógico 1.500 → físico 11.500. Endereço lógico 2.500 → erro.

### Memória virtual por segmentos
Extensão das partições: as seções do processo — **TEXT, DATA, HEAP, STACK** — são armazenadas **separadamente** na memória física. O espaço deixa de ser uma sequência linear única e vira um **conjunto de segmentos**, cada um com tamanho, localização e **permissões** próprias.
Endereço lógico = par **[segmento:offset]** — *segmento* identifica a área; *offset* a posição dentro dela. A MMU usa uma **tabela de segmentos** (base e limite de cada segmento).

### Memória virtual por páginas
O espaço lógico continua **linear e unidimensional**, mas é dividido internamente, de forma transparente, em blocos de tamanho fixo — **páginas**. A memória física é dividida em blocos do mesmo tamanho — **quadros (frames)**. Páginas geralmente têm **4 KB (4.096 bytes)**. As páginas de um processo podem ficar em **quadros não consecutivos**.

**Tradução:** endereço lógico = [nº da página | deslocamento]. Com páginas de 4 KB, os 12 bits menos significativos são o deslocamento. *Exemplo:* endereço lógico 8.200 → página 2 (8.200 / 4.096), deslocamento 8; se a página 2 está no quadro 5 → endereço físico = 5 × 4.096 + 8 = 20.488.

**Tabela de páginas:** cada entrada corresponde a uma página e contém o **número do quadro**. Cada processo tem a sua; a tabela ativa é apontada pelo registrador **PTBR** (*Page Table Base Register*), atualizado a cada troca de contexto.

**Complementos do livro (14.7):**
- **Flags de status e controle** em cada entrada: *presença* (página na RAM), *proteção* (leitura/escrita/execução), *referência/acesso* (bit R), *modificação/dirty* (bit M), *usuário/núcleo*, entre outros.
- **Tabelas multiníveis:** dividem a tabela em níveis (ex.: 2 níveis em 32 bits, 4 níveis no x86-64) para não ocupar memória com faixas não usadas.
- **TLB (*Translation Lookaside Buffer*):** cache de traduções recentes dentro da MMU; evita acessar a tabela na RAM a cada referência.

### Comparação das organizações
- **Partições:** simplicidade e rapidez na tradução.
- **Segmentos:** cada processo com diferentes espaços de endereçamento, flexibilidade e diferentes políticas de acesso.
- **Páginas:** grande espaço de endereçamento linear e **elimina a fragmentação externa** (pode ter fragmentação interna na última página).
(Livro 14.8: sistemas podem combinar **segmentos e páginas**; 14.9: **localidade de referências** — temporal e espacial — é o que faz caches, TLB e paginação funcionarem bem.)

> 📖 **Maziero, cap. 14 "Hardware de memória" (p. 161–183):** tipos de memória (14.1), memória física (14.2), espaço de endereçamento (14.3), memória virtual (14.4), partições (14.5, p. 165), segmentos (14.6, p. 167), páginas (14.7, p. 170), segmentos e páginas (14.8), localidade de referências (14.9).

### Desafios da fase 3.1
1. **Quem traduz endereços lógicos em físicos?** a) O compilador · **b) A MMU** · c) O disco · d) O linker
2. **Overlays eram gerenciados por quem?** → Pelo programador.
3. **Base = 4.000, limite = 1.000. O endereço lógico 900 vira qual físico?** → 4.900. E o 1.200? → Exceção (fora do limite).
4. **Um endereço segmentado tem quais partes?** → Segmento e offset.
5. **Qual organização elimina a fragmentação externa?** → Paginação.
6. **Página de 4 KB: endereço lógico 4.100 está em qual página e com qual deslocamento?** → Página 1, deslocamento 4.
7. **O que o PTBR guarda?** → O endereço da tabela de páginas do processo ativo.

---

## Fase 3.2 — Uso da Memória

### Espaço de endereçamento virtual de um processo
Na maioria dos sistemas, a **parte inicial** dos endereços virtuais é do **processo** e a **parte final** é reservada ao **núcleo**. O núcleo faz parte do espaço de cada processo, mas **não é acessível** a ele, graças às **flags de controle da tabela de páginas** (páginas marcadas como "só núcleo").
(Em Linux x86-64: endereços baixos para o usuário, altos — 0xffff8… — para o núcleo.)

**Bug de segurança Meltdown (2018, meltdownattack.com):** explorava a **execução especulativa** dos processadores para ler, a partir do modo usuário, dados das páginas do núcleo mapeadas no espaço do processo.
**Solução do Linux — KPTI (*Kernel Page-Table Isolation*):** mantém só um **pequeno conjunto de páginas do núcleo** no espaço do processo, o suficiente para receber syscalls e interrupções; o restante fica numa tabela de páginas separada.

### A memória de um processo
Cada processo é uma **"cápsula" de memória isolada** — área exclusiva que só ele e o núcleo acessam. Contém: código binário do programa; variáveis; bibliotecas; buffers; **pilha (stack)**; dados dinâmicos (**heap**); entre outros.
Seções típicas (de endereços baixos para altos): **TEXT** (código, só leitura/execução) → **DATA** (variáveis inicializadas) → **BSS** (variáveis não inicializadas) → **HEAP** (cresce para cima) → … espaço livre … → **STACK** (cresce para baixo). Bibliotecas dinâmicas e áreas mapeadas ficam entre heap e pilha. (No Linux: `cat /proc/<pid>/maps` ou `pmap`.)

### Alocação de variáveis
Variáveis são espaços de memória **reservados e nomeados** — ex.: `int soma` em C reserva 4 bytes chamados `soma`. Em C/C++ há três abordagens:
- **Estática:** a variável existe durante **toda a execução**; tamanho e endereço definidos na compilação/carga. Variáveis **globais** e `static` → seções DATA/BSS.
- **Automática:** criada ao **entrar em uma função** e destruída ao sair; variáveis **locais** e parâmetros → **pilha** (*stack frame*).
- **Dinâmica:** solicitada **explicitamente** durante a execução (`malloc`/`free` em C, `new`/`delete` em C++); fica no **heap**; o programador libera (ou um coletor de lixo, em Java/Python). Esquecer de liberar → *memory leak*.
```c
int total = 0;               // estática (DATA)
void f(int n) {              // n: automática (pilha)
  int i;                     // automática (pilha)
  static int chamadas = 0;   // estática (DATA)
  int *v = malloc(n * sizeof(int));  // ponteiro na pilha; vetor no HEAP
  free(v);
}
```

### Atribuição de endereços
O programador usa **nomes** (variáveis, funções, parâmetros, retornos), sem manipular endereços. O código Assembly de `soma.c` mostra que esses nomes simbólicos precisam ser traduzidos em endereços **em algum momento** entre a escrita e a execução:
- **Na edição (codificação):** o programador define os endereços manualmente — comum só em embarcados simples, em Assembly.
- **Na compilação:** o compilador define os endereços; precisa conhecer **todo** o código para evitar conflitos.
- **Na ligação (linking):** o compilador gera **arquivos-objeto** sem endereços finais; o **linker** combina os objetos, resolve símbolos e define os endereços → executável.
- **Na carga (loading):** o **loader** define os endereços ao carregar o programa na memória; importante também para **bibliotecas dinâmicas (DLLs/.so)**.
- **Na execução:** os endereços gerados pelo processador são convertidos continuamente em endereços físicos, com ajuda do hardware (**MMU**).

**Exemplo — C# / .NET:** o código-fonte é traduzido para linguagem intermediária (**CIL/bytecode**); no ambiente de execução (**CLR**), o compilador **JIT** (*Just-In-Time*) gera código nativo e atribui endereços na RAM **somente quando o código é executado**. Esse adiamento permite recursos como **Hot Reload** (atualizar código em memória sem parar o processo).

> 📖 **Maziero, cap. 15 "Uso da memória" (p. 184–193):** espaço de endereçamento virtual de um processo (15.1), a memória de um processo (15.2), alocação de variáveis — estática (p. 187), automática (p. 188), dinâmica (p. 189) — e atribuição de endereços (15.4, p. 190).

### Desafios da fase 3.2
1. **Uma variável local de função fica em qual área?** a) DATA · b) HEAP · **c) Pilha** · d) TEXT
2. **`malloc` aloca memória em qual área?** → Heap.
3. **Por que o processo não consegue ler as páginas do núcleo mapeadas no seu espaço?** → Flags da tabela de páginas marcam essas páginas como exclusivas do núcleo.
4. **O que é KPTI?** → Isolamento da tabela de páginas do núcleo, mantendo no processo só o mínimo para syscalls/interrupções (resposta ao Meltdown).
5. **Em qual momento o linker define endereços?** → Na ligação, ao combinar arquivos-objeto.
6. **O JIT do .NET atribui endereços quando?** → Na execução.

---

## Fase 3.3 — Alocação de Memória

### Alocadores de memória — os três níveis
1. **Alocador de memória física (nível 1 — base):** organiza a RAM, define áreas alocáveis pelo núcleo e processos e áreas **reservadas** (BIOS, DMA etc.); gerencia os **quadros (frames)** físicos e atende pedidos de alocação/liberação.
2. **Alocador de espaço de núcleo (nível 2):** o núcleo cria e destrói continuamente muitas **estruturas pequenas** (descritores de arquivos abertos, de processos, sockets, pipes…); obtém áreas do alocador físico e as usa para essas estruturas.
3. **Alocador de espaço de usuário (nível 3):** processos pedem blocos para estruturas dinâmicas com `malloc`/`free`; implementado por bibliotecas como a **LibC**, que pede ao núcleo para **redimensionar a seção HEAP** quando necessário.
"Diferentes clientes exigem diferentes garçons": o SO tem camadas especializadas para não sobrecarregar o hardware com pequenos pedidos. (Figura 16.1: userspace allocator → kernel allocator → physical memory allocator → page frames.)

### Fragmentação
**O desafio:** manter uma grande área de RAM e atender um **fluxo contínuo** de pedidos de alocação e liberação, rapidamente.

**Fragmentação externa — exemplo (Figura 16.2):** 1 GB livre → aloca 200 MB (a1) → aloca 100 MB (a2) → aloca 100 MB (a3) → libera a1 → aloca 300 MB (a4) → libera a3. Resultado: **600 MB livres no total**, mas a maior área **contínua** tem **300 MB** — só pedidos de até 300 MB são aceitos.
Surge de áreas livres ("buracos") entre áreas alocadas, **fora** das áreas alocadas. É muito prejudicial: limita a capacidade de alocação e torna mais custosa a gestão (listas de áreas livres mais longas).
**Como enfrentar:** minimizar com **estratégias de alocação**; **desfragmentar** periodicamente; ou aceitar **fragmentação interna**.

### Estratégias (algoritmos) de alocação
Ao carregar um processo, o SO procura uma área livre suficientemente grande. Algoritmos usados em sistemas antigos e ainda base conceitual para gerência de heap.

**Cenário dos slides** (do início ao final da memória): Livre 50 MB → P5 → Livre 10 MB → P4 → Livre 30 MB → P3 → P2 → Livre 40 MB → P1.
- **First-fit (primeiro encaixe):** escolhe a **primeira** área livre que satisfaça o pedido; vantagem: rapidez (sobretudo com listas longas).
  *Processo de 10 MB?* → na área de **50 MB** (primeira encontrada a partir do início), sobrando 40 MB.
- **Next-fit (próximo encaixe):** variante do first-fit que começa a busca a partir da **última área alocada/liberada**, distribuindo o uso de forma mais homogênea.
  *Processo de 35 MB, último alocado = P4?* → a partir de P4: Livre 30 MB (não cabe) → **Livre 40 MB** (cabe, sobra 5 MB).
- **Best-fit (melhor encaixe):** escolhe a **menor** área que comporte o pedido, minimizando desperdício; porém gera sobras pequenas demais e inúteis.
  *Processo de 28 MB?* → na área de **30 MB** (sobra 2 MB).
- **Worst-fit (pior encaixe):** escolhe sempre a **maior** área livre, para que a sobra seja grande o suficiente para outras alocações.
  *Processo de 3 MB?* → na área de **50 MB** (sobra 47 MB).
(Figura 16.3 compara first-fit, best-fit e worst-fit sobre a mesma memória.)

**Qual algoritmo é o melhor?** Não há vencedor absoluto: depende do padrão de pedidos. Estudos clássicos indicam que **first-fit e best-fit** têm desempenho semelhante em aproveitamento, com first-fit **mais rápido**; worst-fit tende a ser pior; next-fit espalha a fragmentação.

### Desfragmentação
Mover as áreas usadas para **concatenar** as livres. Ao mover um processo, suas informações de endereçamento virtual (base/limite, tabela de segmentos ou de páginas) devem ser ajustadas. Por isso só se aplica a **áreas físicas** (o hardware oculta a mudança) — **não** à gestão do heap de um processo (os ponteiros do programa ficariam inválidos).
Figura 16.4 (situação 150M, 200M, 100M, 150M, 200M, 100M): *Solução 1* move 300 MB; *Solução 2* move 200 MB; *Solução 3* move apenas 100 MB → escolher a que move **menos dados**, pois desfragmentar tem custo.

### Fragmentação interna
Arredondar pedidos para evitar sobras pequenas: ex., no best-fit, alocar **100 MB em vez de 80 MB** e evitar um fragmento livre de 20 MB. A memória extra provavelmente não será usada por quem pediu → **desperdício dentro da área alocada** = fragmentação interna (Figura 16.5).

**Matriz diagnóstica:**
| | Fragmentação externa | Fragmentação interna |
|---|---|---|
| Onde | Nas áreas **livres**, entre as alocadas | **Dentro** da área alocada |
| Sintoma | Há 80 MB livres no total, mas não se consegue um bloco contínuo de 50 MB | Programa pediu 1 KB, mas recebe uma página de 4 KB; 3 KB "evaporam" |
| Causa | Espaço livre espalhado; afeta alocadores contíguos | Granularidade mínima de entrega maior que o pedido |

### Outras estratégias
**Alocador Buddy (por pares):** a memória é tratada em blocos de **potências de 2**; um pedido é arredondado para a potência de 2 imediatamente superior e blocos maiores são **divididos ao meio** ("buddies") até o tamanho adequado; ao liberar, um bloco é **fundido** com seu par se este estiver livre. Usado no **núcleo Linux** para alocar **page frames** (memória física para processos, para o alocador de objetos do núcleo e outros subsistemas). Gera fragmentação interna, mas facilita a fusão.
*Exemplo (Figura 16.6):* início 1 MB (1024 K) livre → aloca 200 KB (a1): divide 1024 → 512+512 → 256+256; a1 recebe 256 K → aloca 100 KB (a2): divide 256 → 128+128; a2 recebe 128 K → aloca 150 KB (a3): divide o outro 512 → 256+256; a3 recebe 256 K → libera a1 → libera a2: os pares de 128 K e o de 256 K se fundem até reconstituir 512 K.

**Alocador Slab:** em vez de pedir e liberar memória a cada estrutura criada, o núcleo mantém **reservas de objetos prontos** para reutilização — um "estoque organizado". Cada **cache** guarda um tipo de objeto (ex.: `task_struct`); caches têm **slabs**; cada slab tem vários espaços para objetos daquele tipo. Slabs podem estar **cheios, parciais ou vazios** (Figura 16.7). Ao "liberar" um objeto, ele volta limpo para a prateleira e é reciclado em microssegundos — evita fragmentação e custo de inicialização.

### Alocação no espaço de usuário
Cada processo recebe uma área para variáveis dinâmicas, o **HEAP**. Seu tamanho é ajustado por chamadas de sistema que modificam o ponteiro **Program Break** (`brk`/`sbrk`; para blocos grandes, a LibC usa `mmap`). O `malloc` gerencia os blocos internamente (listas de áreas livres, estratégias tipo first/best-fit).

> 📖 **Maziero, cap. 16 "Alocação de memória" (p. 194–204):** alocadores (16.1), alocação básica (16.2), fragmentação, estratégias, desfragmentação e fragmentação interna (16.3, p. 196–199), Buddy (16.4, p. 199), Slab (16.5, p. 200), alocação no espaço de usuário (16.6, p. 202).

### Desafios da fase 3.3
1. **Há 600 MB livres, mas só cabe um pedido de 300 MB. Isso é…** **a) fragmentação externa** · b) interna · c) thrashing · d) page fault
2. **Livres: 50, 10, 30 e 40 MB (nessa ordem). Best-fit para 28 MB?** → 30 MB. **Worst-fit para 3 MB?** → 50 MB. **First-fit para 10 MB?** → 50 MB.
3. **Por que não se desfragmenta o heap de um processo?** → Os ponteiros do programa apontariam para endereços errados.
4. **Pedido de 1 KB que recebe 4 KB gera…** → fragmentação interna de 3 KB.
5. **Buddy: pedido de 200 KB recebe bloco de quanto?** → 256 KB.
6. **Para que serve o Slab?** → Reaproveitar objetos do núcleo já prontos, evitando alocação/inicialização repetidas.
7. **Qual nível de alocador atende o `malloc`?** → Alocador de espaço de usuário (LibC).

---

## Fase 3.4 — Paginação em Disco

### Armazenamento externo
A RAM sempre foi **escassa**; a manipulação de multimídia (imagens, áudio, vídeo) agrava o problema. Esta fase mostra como usar um **dispositivo secundário como extensão da RAM**, de forma **transparente** às aplicações.

### Estendendo a memória RAM
Os mecanismos de memória virtual permitem mover partes **ociosas** da memória para o disco e trazê-las de volta quando acessadas — tudo feito pelo SO, transparente para os processos.
- **Overlays:** o programador divide o programa em módulos carregados na mesma região em momentos distintos, via biblioteca. Ex.: um compilador separado em analisador léxico, sintático e gerador de código. Popular nos anos 1970–90 (ex.: **Turbo Pascal**, da Borland); hoje raro, por exigir esforço do programador.
- **Swapping:** move um **processo inteiro** ocioso para o disco (**swap-out**); quando volta à fila de prontos, é recarregado (**swap-in**). Muito usado até os anos 1990; hoje pouco usado em SOs de uso geral.
- **Paginação:** move **páginas individuais** (ou conjuntos, ou segmentos) para o disco (**page-out**); se o processo acessá-las, a MMU gera uma **falta de página** e o núcleo as recarrega (**page-in**). Técnica mais usada hoje: flexível, rápida e eficiente.

### Mecanismo da paginação em disco
Páginas ociosas vão para uma **área de troca** (*swap*) no disco; o **núcleo** faz a transferência e escolhe as vítimas por **algoritmos de substituição**. Para cada página levada ao disco, a tabela de páginas é ajustada: o **flag de presença** é desligado e registra-se a **posição no disco** em vez do quadro.

**Page fault (falta de página):** ao acessar uma página, a MMU verifica se ela está na RAM; se sim, acessa o endereço físico; se não, gera uma **interrupção de falta de página**, desviando para o SO, que:
1) verifica se o acesso é válido; 2) escolhe um quadro livre (ou libera um, salvando a vítima no disco se modificada); 3) lê a página do disco para o quadro; 4) atualiza a tabela de páginas; 5) reexecuta a instrução que causou a falta. (Enquanto isso, o processo fica suspenso.)

### Eficiência
Permite usar o disco como extensão transparente da RAM, mas **o disco é muito mais lento**: um disco rígido típico tem tempo de acesso **~100.000 vezes** maior que a RAM.
(Livro 17.2.2: tempo médio de acesso = (1 − p)·t_RAM + p·t_falta; mesmo uma taxa de faltas *p* minúscula multiplica o tempo médio.)

### Como escolher a página a remover?
- Com a **RAM cheia**, podem ser necessários **dois acessos ao disco**: um para retirar uma página e outro para carregar a necessária.
- Muitas faltas → muitos acessos ao disco → tempo médio de acesso aumenta muito.
- Se forem removidas páginas **muito usadas**, elas logo serão acessadas de novo, gerando mais faltas.

**Critérios de seleção:**
- **Idade da página** — muito tempo na memória pode indicar pouco uso;
- **Frequência de acessos** — páginas muito acessadas tendem a continuar sendo usadas;
- **Data do último acesso** — páginas sem acesso há mais tempo têm maior chance de continuar sem uso;
- **Prioridade do processo** — páginas de processos de alta prioridade/tempo real devem ficar na RAM;
- **Conteúdo** — páginas de código são fáceis de recuperar do disco; páginas de dados **modificadas** precisam ser salvas antes;
- **Páginas especiais** — ligadas a E/S (ex.: buffers de DMA) ou com dados sensíveis podem precisar ficar na RAM.

### Algoritmos de substituição de páginas
Cadeia de referências (20 acessos a 6 páginas): **7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1** — memória com **3 quadros**. Acessos consecutivos à mesma página não importam (só o primeiro pode gerar falta).

**FIFO:** remove a página **há mais tempo na memória** (fila). Simples, mas ignora o uso. → **15 faltas**.
Evolução (quadros após cada falta): 7 | 7,0 | 7,0,1 | 2 entra (sai 7) | 3 entra (sai 0) | 0 entra (sai 1) | 4 (sai 2) | 2 (sai 3) | 3 (sai 0) | 0 (sai 4) | 1 (sai 2) | 2 (sai 3) | 7 (sai 0) | 0 (sai 1) | 1 (sai 2).

**Ótimo (OPT):** remove a página que ficará **mais tempo sem ser usada** no futuro. **Não implementável** (não se conhece o futuro), mas define o **limite mínimo**: nenhum algoritmo gera menos faltas que ele na mesma cadeia — serve de parâmetro de avaliação. → **9 faltas**.

**LRU (*Least Recently Used*):** remove a página **acessada há mais tempo no passado** (aproximação implementável do ótimo, pressupondo que o passado recente prevê o futuro próximo). → **12 faltas** (três a mais que o ótimo).

**RANDOM:** escolhe a vítima **aleatoriamente**. Útil quando LRU e FIFO vão mal, como em padrões de acesso **fortemente sequenciais** (varredura cíclica maior que a memória); alguns SOs antigos o usavam nessas situações.

**Comparação (Figura 17.4/17.5):** para qualquer número de quadros, OPT ≤ LRU ≤ FIFO em faltas, na maioria das cargas; com muitos quadros, todos convergem.

### Aproximações do LRU
O LRU completo é pouco usado: exigiria registrar a data de **cada** acesso à memória — difícil em software e caro em hardware. Os SOs reais usam aproximações baseadas nos bits **R** (referência) e **M** (modificação) mantidos pela MMU.

- **Segunda chance:** modificação do FIFO. Ao escolher a página mais antiga, verifica o **bit R**: se R = 1, ela foi usada recentemente → ganha uma "segunda chance": R é zerado e ela vai para o fim da fila. Se todas tiverem R = 1, vira FIFO. Implementado como **lista circular com ponteiro ("relógio")**. Mescla FIFO com informação de popularidade.
- **NRU (*Not Recently Used*):** considera **R e M**, formando 4 níveis:
  - Nível 0: R = 0, M = 0 — não referenciada, não modificada (melhor vítima);
  - Nível 1: R = 0, M = 1 — não referenciada, mas modificada;
  - Nível 2: R = 1, M = 0 — referenciada, não modificada;
  - Nível 3: R = 1, M = 1 — referenciada e modificada.
  Substitui primeiro páginas do nível 0; se não houver, do nível 1, e assim por diante (pode ser preciso percorrer a lista várias vezes).
- **Envelhecimento (*aging*):** cada página tem um **contador** (ex.: 8 bits). Periodicamente, o contador é **deslocado à direita** e o bit R é colocado no bit **mais significativo** (MSB); R é zerado. Páginas pouco acessadas "envelhecem" (contadores menores); as muito acessadas ficam "jovens" (contadores maiores). Remove-se a de **menor contador** — boa aproximação do LRU. (Não basta somar R: o contador estouraria e não diferenciaria acessos recentes de antigos.)

**Conjunto de trabalho (livro 17.5):** conjunto de páginas que um processo usou em uma janela recente de acessos; se cabe na RAM, poucas faltas ocorrem.

### Anomalia de Belady
Esperado: mais quadros → menos faltas. Mas alguns algoritmos, como o **FIFO**, podem gerar **mais faltas com mais quadros**. Estudado pelo matemático húngaro **László Belady** nos anos 1960.
*Exemplo clássico:* cadeia 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 com FIFO → **9 faltas com 3 quadros** e **10 faltas com 4 quadros**.
Os **algoritmos de pilha** (OPT, LRU, entre outros) **não** apresentam a anomalia. Logo, **não basta ter RAM disponível**: o resultado também depende do algoritmo.

### Thrashing
A RAM não é suficiente para os **conjuntos de trabalho** de todos os processos ativos. Cada processo, ao receber a CPU, executa poucas instruções, gera uma falta de página e é suspenso; para trazer a página, é preciso tirar páginas de **outros** processos, que logo também faltarão. Quanto mais processos nessa situação, maior a paginação e mais processos suspensos.
**Thrashing:** o sistema gasta mais tempo tratando faltas e movendo páginas entre RAM e disco do que executando os processos. (Soluções do livro: reduzir o grau de multiprogramação — suspender processos inteiros —, aumentar a RAM, controlar a taxa de faltas por processo.)

### Algumas soluções atuais
- **LIRS (*Low Inter-reference Recency Set*):** considera o intervalo entre reusos (recência de reutilização) para superar limitações do LRU — "Qual é o intervalo entre os acessos dessa página?"
- **ARC (*Adaptive Replacement Cache*):** combina **recência e frequência** e se adapta ao padrão de acesso — "Devo preservar o que foi usado recentemente ou o que é reutilizado frequentemente?" (usado no ZFS).
- **Multi-Gen LRU (MGLRU):** abordagem recente do **Linux** que organiza páginas em **gerações** conforme o histórico de acesso, melhorando a recuperação de memória.

> 📖 **Maziero, cap. 17 "Paginação em disco" (p. 205–225):** estendendo a RAM (17.1), mecanismo, eficiência e critérios (17.2), algoritmos clássicos — cadeia de referências, FIFO, Ótimo, LRU, RANDOM e comparação (17.3, p. 210–215), aproximações do LRU — segunda chance, NRU, envelhecimento (17.4, p. 215–218), conjunto de trabalho (17.5), anomalia de Belady (17.6, p. 220), thrashing (17.7, p. 221). Tópicos extras no cap. 18: compartilhamento de memória, **copy-on-write** e arquivos mapeados em memória.

### Desafios da fase 3.4
1. **Qual técnica move processos inteiros para o disco?** a) Paginação · **b) Swapping** · c) Overlay · d) Slab
2. **Quem gera a interrupção de falta de página?** → A MMU.
3. **Quantas faltas o algoritmo ótimo gera na cadeia do livro com 3 quadros? E o LRU? E o FIFO?** → 9, 12 e 15.
4. **Por que o algoritmo ótimo não é implementável?** → Exige conhecer os acessos futuros.
5. **No NRU, qual página sai primeiro?** → Nível 0 (R = 0, M = 0).
6. **Na segunda chance, o que acontece com uma página com R = 1?** → R é zerado e ela vai para o fim da fila.
7. **O que é a anomalia de Belady?** → Mais quadros causando mais faltas (ex.: FIFO).
8. **Qual família de algoritmos não sofre Belady?** → Algoritmos de pilha (OPT, LRU).
9. **O que caracteriza o thrashing?** → O sistema passa mais tempo paginando do que executando.
10. **Por que páginas de código são vítimas "baratas"?** → Não são modificadas; podem ser relidas do executável sem salvar.
