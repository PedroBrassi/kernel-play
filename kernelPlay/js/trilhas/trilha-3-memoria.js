/* =========================================================
   KernelPlay — Trilha 3: Gerenciamento de Memória
   Fonte: Trilhas/Trilha_3_Gerenciamento_de_Memoria.md (Aulas 12 a 15;
   MAZIERO, Parte IV) + Lab 03 do xv6 (Memória: vertabela, aloca, falta,
   compartilha, memlivre).
   Desafios com o campo "lab" vêm das aulas de laboratório.
   Trechos do xv6: xv6-labs-2024 (versão usada no laboratório).
   O formato das fases e dos desafios está documentado em js/trilhas.js.
   ========================================================= */

TRILHAS.push({
  id: "memoria",
  numero: 3,
  titulo: "Gerenciamento de Memória",
  subtitulo: "Endereços, páginas, alocação e o disco como extensão da RAM.",
  fases: [
    // ================================================== FASE 3.1A — Memória e MMU
    {
      id: "m31a",
      etapa: "3.1 A",
      titulo: "Memória e MMU",
      descricao: "Hierarquia, endereços, partições e segmentos",
      icone: "🧠",
      xv6: {
        titulo: "O xv6 usa só paginação",
        arquivo: "kernel/riscv.h",
        codigo: `#define PGSIZE 4096 // bytes por página

#define PTE_V (1L << 0) // válida (página presente)
#define PTE_R (1L << 1) // pode ler
#define PTE_W (1L << 2) // pode escrever
#define PTE_X (1L << 3) // pode executar
#define PTE_U (1L << 4) // o programa do usuário pode acessar

// 3 níveis de 9 bits + 12 bits de deslocamento (Sv39)
#define PXSHIFT(level)  (PGSHIFT+(9*(level)))
#define PX(level, va) ((((uint64) (va)) >> PXSHIFT(level)) & PXMASK)`,
        texto: "O RISC-V do xv6 não usa partições nem segmentos: a MMU traduz endereços por <b>páginas de 4 KB</b> (esquema Sv39). Cada entrada da tabela tem as flags de presença e de proteção (R, W, X, U) que você vai ver na fase 3.1 B."
      },
      linux: {
        titulo: "A hierarquia de memória do seu computador",
        comando: "lscpu | grep -i cache",
        saida: `L1d cache:                               64 KiB (2 instances)
L1i cache:                               64 KiB (2 instances)
L2 cache:                                2 MiB (2 instances)
L3 cache:                                33 MiB (1 instance)`,
        texto: "Os caches L1, L2 e L3 ficam entre os registradores e a RAM: quanto mais perto da CPU, menores e mais rápidos. O comando <code>free -h</code> mostra o próximo nível: a RAM e a área de swap no disco."
      },
      man: [
        { termo: "gerenciador de memória", secao: "7", resumo: "a parte do SO que aloca, libera e protege a memória dos processos",
          detalhe: "Aloca memória para novos processos, libera a dos que terminaram, expande quando um processo precisa de mais, controla os espaços de endereçamento e faz swapping quando necessário.",
          veja: ["memória virtual(7)", "MMU(7)"] },
        { termo: "hierarquia de memória", secao: "7", resumo: "registradores → cache → RAM → SSD → disco → fita",
          detalhe: "Quanto mais rápida, menor, mais cara e (em geral) volátil. Registradores: ~1 ns; RAM: ~50–100 ns; SSD: ~25–100 µs; disco rígido: ~5–10 ms.",
          veja: ["localidade(7)"] },
        { termo: "overlay", secao: "7", resumo: "sobreposição: módulos do programa carregados na mesma região em momentos diferentes",
          detalhe: "Técnica antiga para rodar programas maiores que a memória. Quem coordenava as trocas era o programador. Foi substituída pela memória virtual (1961), em que o SO decide o que fica na RAM.",
          veja: ["memória virtual(7)", "swapping(7)"] },
        { termo: "memória virtual", secao: "7", resumo: "cada processo vê seu próprio espaço de endereços, independente da RAM física",
          detalhe: "Cria a ilusão de que o processo tem mais memória do que a RAM disponível. Pode ser implementada por partições, segmentos ou páginas.",
          veja: ["MMU(7)", "página(7)"] },
        { termo: "MMU", secao: "7", resumo: "Memory Management Unit: hardware que traduz endereços lógicos em físicos",
          detalhe: "Fica integrada ao chip da CPU. Se o endereço for inválido ou o acesso não for permitido, gera uma exceção tratada pelo núcleo (por exemplo, uma falta de página).",
          veja: ["memória virtual(7)", "tabela de páginas(7)"] },
        { termo: "partição", secao: "7", resumo: "área contígua da memória física com um processo, definida por base e limite",
          detalhe: "Se endereço_lógico < limite, endereço_físico = base + endereço_lógico; senão, exceção. Base e limite são recarregados a cada troca de contexto.",
          exemplo: "B = 10.000, L = 2.000\nlógico 1.500 → físico 11.500\nlógico 2.500 → exceção",
          veja: ["segmentação(7)"] },
        { termo: "segmentação", secao: "7", resumo: "o processo dividido em segmentos (TEXT, DATA, HEAP, STACK) com tamanho e permissões próprios",
          detalhe: "O endereço lógico é o par [segmento:offset]. A MMU usa uma tabela de segmentos com a base e o limite de cada um.",
          veja: ["partição(7)", "página(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "O gerenciador de memória",
          texto: `<p>O gerenciador de memória <b>aloca</b> memória para novos processos, <b>libera</b> a dos que terminam,
            <b>expande</b> a de quem precisa de mais, <b>controla o endereçamento</b> e faz <b>swapping</b> quando necessário.</p>
            <p>O programador gostaria de uma memória infinita, rapidíssima e não volátil. A realidade é uma <b>hierarquia</b>:
            quanto mais rápida, menor, mais cara e (em geral) volátil.</p>
            <p class="destaque">"Programas tendem a expandir-se a fim de preencher a memória disponível para contê-los." (Tanenbaum)</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene a hierarquia de memória, da mais rápida para a mais lenta.",
          itens: ["Registradores da CPU", "Cache (L1, L2, L3)", "Memória RAM", "SSD", "Disco rígido"],
          dica: "Comece pelo que está dentro do processador.",
          explicacao: "Registradores (~1 ns) → cache (~1–20 ns) → RAM (~50–100 ns) → SSD (~25–100 µs) → disco rígido (~5–10 ms). Cada nível é maior e mais barato que o anterior."
        },
        {
          tipo: "conceito",
          titulo: "Programas maiores que a memória",
          texto: `<p>Como executar um programa que não cabe inteiro na memória? A primeira solução foram os <b>overlays</b>:
            um programa de 40 KB dividido em 20 módulos de 2 KB, carregados sob demanda na mesma região.
            A coordenação era do <b>programador</b>.</p>
            <p>Com a <b>memória virtual</b> (1961), essa tarefa passou ao <b>SO</b>, que escolhe quais partes ficam na RAM.
            Cada processo usa <b>endereços lógicos</b>, e a <b>MMU</b> (hardware dentro da CPU) os traduz em <b>endereços físicos</b>.
            Endereço inválido? A MMU gera uma <b>exceção</b> para o núcleo.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Quem coordenava as trocas de módulos nos overlays?",
          opcoes: ["O sistema operacional", "A MMU", "O programador", "O compilador, automaticamente"],
          correta: 2,
          dica: "Foi justamente esse trabalho que a memória virtual passou para o SO.",
          explicacao: "Nos overlays, o programador organizava manualmente quais módulos carregar e quando. A memória virtual transferiu essa responsabilidade ao SO."
        },
        {
          tipo: "multipla",
          pergunta: "Quem traduz endereços lógicos em físicos?",
          opcoes: ["O compilador", "A MMU", "O disco", "O linker"],
          correta: 1,
          dica: "É um componente de hardware integrado à CPU.",
          explicacao: "A MMU (Memory Management Unit) traduz cada endereço gerado pelo processador, a cada acesso, e gera uma exceção se ele for inválido."
        },
        {
          tipo: "conceito",
          titulo: "Partições e segmentos",
          texto: `<p><b>Partições:</b> cada processo ocupa uma área contígua. A MMU usa o registrador-<b>base</b> (início da partição) e o
            registrador-<b>limite</b> (tamanho):</p>
            <pre class="terminal">se lógico &lt; L:  físico = B + lógico
senão:          exceção (acesso inválido)</pre>
            <p><b>Segmentos:</b> as seções do processo (TEXT, DATA, HEAP, STACK) ficam separadas, cada uma com tamanho, posição e
            <b>permissões</b> próprios. O endereço lógico vira o par <b>[segmento : offset]</b>, traduzido por uma tabela de segmentos.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Base = 4.000 e limite = 1.000. O endereço lógico 900 vira qual endereço físico?",
          opcoes: ["900", "3.100", "4.900", "Exceção"],
          correta: 2,
          dica: "900 é menor que o limite; então some a base.",
          explicacao: "Como 900 < 1.000, o acesso é válido: físico = 4.000 + 900 = 4.900."
        },
        {
          tipo: "multipla",
          pergunta: "Com a mesma partição (base 4.000, limite 1.000), o que acontece com o endereço lógico 1.200?",
          opcoes: ["Vira 5.200", "Vira 1.200", "A MMU gera uma exceção", "O SO aumenta a partição"],
          correta: 2,
          dica: "Compare com o limite antes de somar.",
          explicacao: "1.200 não é menor que o limite (1.000): o acesso está fora da partição, e a MMU gera uma exceção para o núcleo."
        },
        {
          tipo: "multipla",
          pergunta: "Um endereço lógico na segmentação é formado por…",
          opcoes: ["base e limite", "segmento e offset", "página e quadro", "PID e endereço"],
          correta: 1,
          dica: "Primeiro diz qual área, depois a posição dentro dela.",
          explicacao: "O segmento identifica a área (código, dados, pilha…) e o offset é a posição dentro dela. A tabela de segmentos dá a base e o limite de cada um."
        }
      ]
    },

    // ================================================== FASE 3.1B — Paginação
    {
      id: "m31b",
      etapa: "3.1 B",
      titulo: "Paginação",
      descricao: "Páginas, quadros, tabela de páginas e TLB",
      icone: "📄",
      xv6: {
        titulo: "walk(): a tradução em 3 níveis",
        arquivo: "kernel/vm.c",
        codigo: `pte_t *
walk(pagetable_t pagetable, uint64 va, int alloc)
{
  if(va >= MAXVA)
    panic("walk");

  for(int level = 2; level > 0; level--) {
    pte_t *pte = &pagetable[PX(level, va)];
    if(*pte & PTE_V) {
      pagetable = (pagetable_t)PTE2PA(*pte);   // desce um nível
    } else {
      if(!alloc || (pagetable = (pde_t*)kalloc()) == 0)
        return 0;
      memset(pagetable, 0, PGSIZE);            // cria a tabela que faltava
      *pte = PA2PTE(pagetable) | PTE_V;
    }
  }
  return &pagetable[PX(0, va)];   // entrada do último nível
}`,
        texto: "É a tabela de páginas <b>multinível</b> em código: o endereço virtual é fatiado em três índices de 9 bits (512 entradas por tabela) e o deslocamento de 12 bits. Cada nível aponta para a tabela do nível seguinte."
      },
      linux: {
        titulo: "O tamanho da página",
        comando: "getconf PAGESIZE",
        saida: "4096",
        texto: "No Linux x86-64, a página padrão também tem <b>4 KB</b>: os 12 bits menos significativos do endereço são o deslocamento dentro da página."
      },
      man: [
        { termo: "página", secao: "7", resumo: "bloco de tamanho fixo (geralmente 4 KB) do espaço de endereçamento lógico",
          detalhe: "A memória física é dividida em quadros (frames) do mesmo tamanho. As páginas de um processo podem ocupar quadros não consecutivos. Endereço lógico = [nº da página | deslocamento].",
          exemplo: "lógico 8.200 → página 2, deslocamento 8\npágina 2 no quadro 5 → físico = 5 × 4.096 + 8 = 20.488",
          veja: ["tabela de páginas(7)", "quadro(7)"] },
        { termo: "quadro", secao: "7", resumo: "frame: bloco da memória física do tamanho de uma página",
          veja: ["página(7)"] },
        { termo: "tabela de páginas", secao: "7", resumo: "mapa de cada processo: para cada página, o quadro onde ela está e suas flags",
          detalhe: "A tabela ativa é apontada pelo PTBR (Page Table Base Register), trocado a cada troca de contexto. Flags: presença, proteção (R/W/X), usuário/núcleo, referência (R) e modificação (M). Para não gastar memória com faixas vazias, a tabela é multinível (3 níveis no xv6, 4 no x86-64).",
          veja: ["TLB(7)", "página(7)", "MMU(7)"] },
        { termo: "TLB", secao: "7", resumo: "Translation Lookaside Buffer: cache de traduções recentes dentro da MMU",
          detalhe: "Evita consultar a tabela de páginas na RAM a cada acesso. Funciona bem graças à localidade de referências.",
          veja: ["localidade(7)", "tabela de páginas(7)"] },
        { termo: "localidade", secao: "7", resumo: "programas tendem a acessar endereços próximos e recém-usados",
          detalhe: "Localidade temporal (o que foi usado tende a ser usado de novo) e espacial (endereços vizinhos tendem a ser usados juntos). É o que faz caches, TLB e paginação funcionarem bem.",
          veja: ["TLB(7)", "conjunto de trabalho(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Páginas e quadros",
          texto: `<p>Na <b>paginação</b>, o espaço lógico continua linear, mas é dividido em blocos de tamanho fixo, as <b>páginas</b>
            (geralmente <b>4 KB</b>). A memória física é dividida em <b>quadros</b> do mesmo tamanho, e as páginas podem ficar
            em quadros <b>não consecutivos</b>.</p>
            <p>O endereço lógico vira <b>[nº da página | deslocamento]</b>. Com páginas de 4 KB, os 12 bits de baixo são o deslocamento:</p>
            <pre class="terminal">lógico 8.200 → página 8.200 / 4.096 = 2, deslocamento 8
página 2 está no quadro 5 → físico = 5 × 4.096 + 8 = 20.488</pre>`
        },
        {
          tipo: "multipla",
          pergunta: "Com páginas de 4 KB (4.096 bytes), o endereço lógico 4.100 está em qual página e com qual deslocamento?",
          opcoes: ["Página 0, deslocamento 4.100", "Página 1, deslocamento 4", "Página 1, deslocamento 100", "Página 4, deslocamento 100"],
          correta: 1,
          dica: "Divida por 4.096: o quociente é a página e o resto é o deslocamento.",
          explicacao: "4.100 / 4.096 = 1 com resto 4: página 1, deslocamento 4."
        },
        {
          tipo: "multipla",
          pergunta: "A página 3 de um processo está no quadro 7. Com páginas de 4.096 bytes, qual é o endereço físico do lógico 12.300?",
          opcoes: ["12.300", "28.684", "28.672", "49.164"],
          correta: 1,
          dica: "12.300 = 3 × 4.096 + 12.",
          explicacao: "12.300 está na página 3 com deslocamento 12. Página 3 → quadro 7: físico = 7 × 4.096 + 12 = 28.684."
        },
        {
          tipo: "conceito",
          titulo: "Tabela de páginas, flags e TLB",
          texto: `<p>Cada processo tem uma <b>tabela de páginas</b>: cada entrada diz em qual <b>quadro</b> está a página.
            A tabela ativa é apontada pelo registrador <b>PTBR</b>, atualizado a cada troca de contexto.</p>
            <ul>
              <li><b>Flags</b> de cada entrada: <b>presença</b>, <b>proteção</b> (ler, escrever, executar), <b>usuário/núcleo</b>,
                <b>referência</b> (bit R) e <b>modificação</b> (bit M, <i>dirty</i>).</li>
              <li><b>Tabelas multinível</b>: a tabela é dividida em níveis para não ocupar memória com faixas não usadas.</li>
              <li><b>TLB</b>: cache de traduções recentes dentro da MMU, para não consultar a tabela na RAM a cada acesso.</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "O que o registrador PTBR guarda?",
          opcoes: [
            "O endereço da tabela de páginas do processo em execução",
            "O número de páginas livres",
            "O último endereço que causou falta de página",
            "O tamanho da página"
          ],
          correta: 0,
          dica: "Page Table Base Register.",
          explicacao: "O PTBR aponta para a tabela de páginas ativa; a cada troca de contexto, o SO o carrega com a tabela do próximo processo. No RISC-V do xv6, esse registrador é o satp."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada flag da tabela de páginas ao que ela indica.",
          pares: [
            ["Presença (V)", "A página está na RAM"],
            ["Proteção (R/W/X)", "Ler, escrever ou executar é permitido"],
            ["Referência (R)", "A página foi acessada recentemente"],
            ["Modificação (M)", "A página foi escrita (dirty)"]
          ],
          dica: "Os bits R e M são usados pelos algoritmos de substituição da fase 3.4.",
          explicacao: "Presença diz se há tradução; proteção limita o tipo de acesso; R e M são ligados pela MMU e ajudam o SO a escolher que página tirar da RAM."
        },
        {
          tipo: "multipla",
          pergunta: "Para que serve a TLB?",
          opcoes: [
            "Guardar páginas que foram para o disco",
            "Fazer cache das traduções recentes, evitando ler a tabela de páginas na RAM a cada acesso",
            "Contar as faltas de página",
            "Proteger as páginas do núcleo"
          ],
          correta: 1,
          dica: "Translation Lookaside Buffer.",
          explicacao: "Sem a TLB, cada acesso à memória exigiria antes ler a tabela de páginas (vários níveis!). Graças à localidade, a maioria das traduções já está na TLB."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada organização da memória virtual à sua principal vantagem.",
          pares: [
            ["Partições", "Simplicidade e tradução rápida"],
            ["Segmentos", "Áreas com tamanhos e permissões próprios"],
            ["Páginas", "Elimina a fragmentação externa"]
          ],
          dica: "Só uma delas usa blocos de tamanho fixo.",
          explicacao: "Partições são simples; segmentos dão flexibilidade e políticas de acesso diferentes; páginas de tamanho fixo eliminam a fragmentação externa (sobra só fragmentação interna na última página)."
        },
        {
          tipo: "associar",
          lab: "LAB 04 · xv6",
          pergunta: "No vertabela do laboratório, associe cada página da tabela à região do processo.",
          pares: [
            ["va 0x0 [R-XU]", "Código"],
            ["va 0x1000 [RW-U]", "Dados"],
            ["va 0x2000 [RW--]", "Página de guarda"],
            ["va 0x3000 [RW-U]", "Pilha"],
            ["va 0x3ffffff000 [R-X-]", "Trampoline"]
          ],
          dica: "Código pode ser executado mas não escrito; a guarda e a trampoline não têm a flag U.",
          explicacao: "As flags revelam a função de cada página: código é R-X, dados e pilha são RW, e as páginas sem U (guarda e trampoline) não podem ser acessadas pelo programa."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No vertabela, por que a página 0x2000 não tem a flag U?",
          opcoes: [
            "Porque ainda não foi alocada",
            "Porque é uma página de guarda: se a pilha crescer além do limite, o acesso a ela gera falta de página",
            "Porque pertence a outro processo",
            "Porque é a página do núcleo que trata as chamadas de sistema"
          ],
          correta: 1,
          dica: "Ela fica logo abaixo da pilha.",
          explicacao: "Sem a flag U, o modo usuário não pode acessar a página. Se a pilha transbordar, o acesso cai na guarda e a MMU gera uma exceção, em vez de corromper os dados silenciosamente."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "Quantos níveis tem a tabela de páginas do xv6, e quantas entradas há em cada tabela?",
          opcoes: ["1 nível, 4.096 entradas", "2 níveis, 1.024 entradas", "3 níveis, 512 entradas", "4 níveis, 256 entradas"],
          correta: 2,
          dica: "No vmprint, os níveis aparecem como .., .. .. e .. .. ..; os índices vão de 0 a 511.",
          explicacao: "O xv6 usa o Sv39 do RISC-V: 3 níveis de 9 bits (2⁹ = 512 entradas por tabela) + 12 bits de deslocamento. Por isso o vmprint desce três níveis."
        }
      ]
    },

    // ================================================== FASE 3.2 — Uso da memória
    {
      id: "m32",
      etapa: "3.2",
      titulo: "Uso da memória",
      descricao: "Espaço de endereçamento, variáveis e endereços",
      icone: "🗺",
      xv6: {
        titulo: "O mapa de memória de um processo do xv6",
        arquivo: "kernel/memlayout.h",
        codigo: `// User memory layout.
// Address zero first:
//   text
//   original data and bss
//   fixed-size stack
//   expandable heap
//   ...
//   TRAPFRAME (p->trapframe, used by the trampoline)
//   TRAMPOLINE (the same page as in the kernel)
#define TRAPFRAME (TRAMPOLINE - PGSIZE)`,
        texto: "No xv6, a <b>pilha tem tamanho fixo</b> (uma página, com a página de guarda embaixo) e fica <b>abaixo</b> do heap, que cresce para cima com <code>sbrk()</code>. No topo do espaço ficam o trapframe e a trampoline, usados para entrar no núcleo."
      },
      linux: {
        titulo: "As seções de um executável",
        comando: "size /usr/bin/ls",
        saida: `   text	   data	    bss	    dec	    hex	filename
 128185	   4936	   4760	 137881	  21a99	/usr/bin/ls`,
        texto: "O comando <code>size</code> mostra quantos bytes o executável reserva para <b>TEXT</b> (código), <b>DATA</b> (variáveis inicializadas) e <b>BSS</b> (variáveis não inicializadas). Heap e pilha só existem durante a execução."
      },
      man: [
        { termo: "espaço de endereçamento", secao: "7", resumo: "a faixa de endereços virtuais que um processo enxerga",
          detalhe: "Em geral, a parte baixa é do processo e a parte alta é do núcleo. As páginas do núcleo estão mapeadas, mas marcadas como \"só núcleo\" nas flags da tabela de páginas.",
          veja: ["KPTI(7)", "seções de memória(7)"] },
        { termo: "KPTI", secao: "7", resumo: "Kernel Page-Table Isolation: a defesa do Linux contra o Meltdown (2018)",
          detalhe: "O Meltdown usava a execução especulativa do processador para ler páginas do núcleo a partir do modo usuário. Com o KPTI, só um pequeno conjunto de páginas do núcleo (o necessário para syscalls e interrupções) fica no espaço do processo.",
          veja: ["espaço de endereçamento(7)"] },
        { termo: "seções de memória", secao: "7", resumo: "TEXT, DATA, BSS, HEAP e STACK",
          detalhe: "TEXT: código (ler/executar). DATA: variáveis globais inicializadas. BSS: globais não inicializadas. HEAP: alocação dinâmica, cresce para cima. STACK: variáveis locais e chamadas, cresce para baixo (no Linux). No Linux: cat /proc/PID/maps.",
          exemplo: "cat /proc/self/maps",
          veja: ["heap(7)", "pilha(7)"] },
        { termo: "pilha", secao: "7", resumo: "stack: área das variáveis locais, parâmetros e endereços de retorno",
          detalhe: "Cada chamada de função cria um stack frame, destruído no retorno (alocação automática).",
          veja: ["seções de memória(7)"] },
        { termo: "heap", secao: "7", resumo: "área da alocação dinâmica (malloc/free, new/delete)",
          detalhe: "O tamanho é ajustado pelo ponteiro program break (brk/sbrk); blocos grandes podem vir de mmap. Esquecer de liberar gera memory leak.",
          veja: ["malloc(3)", "sbrk(2)"] },
        { termo: "malloc", secao: "3", resumo: "aloca um bloco no heap; free o devolve",
          detalhe: "Faz parte da biblioteca C (LibC), o alocador de espaço de usuário. Quando o heap não basta, pede ao núcleo para aumentá-lo.",
          exemplo: "int *v = malloc(n * sizeof(int));\nfree(v);",
          veja: ["heap(7)", "sbrk(2)"] },
        { termo: "atribuição de endereços", secao: "7", resumo: "quando os nomes do programa viram endereços",
          detalhe: "Na codificação (Assembly em embarcados), na compilação, na ligação (linker), na carga (loader, inclusive bibliotecas dinâmicas) ou na execução (MMU). No .NET, o JIT só gera código nativo e endereços quando o método é executado.",
          veja: ["espaço de endereçamento(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "O espaço de endereçamento de um processo",
          texto: `<p>Na maioria dos sistemas, a <b>parte inicial</b> dos endereços virtuais é do <b>processo</b> e a <b>parte final</b> é do
            <b>núcleo</b>. O núcleo está mapeado em todo processo, mas <b>não é acessível</b> a ele: as flags da tabela de páginas
            marcam essas páginas como exclusivas do núcleo.</p>
            <p>Em 2018, o ataque <b>Meltdown</b> usou a execução especulativa dos processadores para ler essas páginas a partir do modo usuário.
            O Linux respondeu com o <b>KPTI</b>: só um pequeno conjunto de páginas do núcleo fica no espaço do processo.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Se as páginas do núcleo estão no espaço de endereçamento do processo, por que o processo não consegue lê-las?",
          opcoes: [
            "Porque estão criptografadas",
            "Porque as flags da tabela de páginas as marcam como exclusivas do núcleo",
            "Porque o compilador impede",
            "Porque ficam no disco"
          ],
          correta: 1,
          dica: "É a mesma flag U que você viu no vertabela.",
          explicacao: "Sem a flag de usuário, qualquer acesso em modo usuário gera exceção. O Meltdown contornava isso pela execução especulativa; daí o KPTI."
        },
        {
          tipo: "conceito",
          titulo: "As seções de um processo",
          texto: `<p>Cada processo é uma \"cápsula\" de memória isolada. Dos endereços baixos para os altos:</p>
            <ul>
              <li><b>TEXT</b>: o código (só leitura e execução);</li>
              <li><b>DATA</b>: variáveis globais inicializadas; <b>BSS</b>: globais não inicializadas;</li>
              <li><b>HEAP</b>: dados dinâmicos, cresce para cima;</li>
              <li>… bibliotecas e áreas mapeadas …</li>
              <li><b>STACK</b>: a pilha, cresce para baixo.</li>
            </ul>
            <p>Três formas de alocar variáveis em C: <b>estática</b> (toda a execução; DATA/BSS), <b>automática</b> (enquanto a função
            executa; pilha) e <b>dinâmica</b> (<code>malloc</code>/<code>free</code>; heap).</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene as seções de um processo no Linux, dos endereços baixos para os altos.",
          itens: ["TEXT", "DATA", "BSS", "HEAP", "STACK"],
          dica: "O código vem primeiro; heap e pilha crescem um em direção ao outro.",
          explicacao: "TEXT → DATA → BSS → HEAP (cresce para cima) → … → STACK (cresce para baixo). Entre heap e pilha ficam as bibliotecas dinâmicas e outras áreas mapeadas."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada trecho de código C à área onde o dado fica.",
          pares: [
            ["int total = 0;  (variável global)", "DATA (alocação estática)"],
            ["int i;  (variável local de função)", "Pilha (alocação automática)"],
            ["malloc(n * sizeof(int))", "Heap (alocação dinâmica)"],
            ["as instruções de main()", "TEXT"]
          ],
          dica: "Locais nascem e morrem com a função.",
          explicacao: "Globais (e static) existem a execução inteira; locais vivem na pilha enquanto a função executa; malloc reserva no heap; o código fica em TEXT."
        },
        {
          tipo: "multipla",
          pergunta: "O que acontece se um programa chama malloc em laço e nunca chama free?",
          opcoes: ["Nada: a pilha libera sozinha", "Memory leak: o heap cresce sem parar", "Falta de página imediata", "O compilador acusa erro"],
          correta: 1,
          dica: "Em C não há coletor de lixo.",
          explicacao: "A memória dinâmica só é devolvida com free (ou quando o processo termina). Sem free, o heap só cresce: é um vazamento de memória (memory leak)."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Mostre o mapa de memória do próprio processo que você executar (seções, bibliotecas, heap e pilha).",
          aceitar: ["cat /proc/self/maps", "cat /proc/\\$\\$/maps", "cat /proc/\\d+/maps"],
          saida: `55d289659000-55d28965b000 r--p 00000000 fe:00 321497   /usr/bin/cat
55d28965b000-55d289660000 r-xp 00002000 fe:00 321497   /usr/bin/cat
55d289663000-55d289664000 rw-p 00009000 fe:00 321497   /usr/bin/cat
55d2aec9d000-55d2aecdf000 rw-p 00000000 00:00 0        [heap]
7f059ca28000-7f059cbb1000 r-xp 00028000 fe:00 322137   /usr/lib/x86_64-linux-gnu/libc.so.6
7f059ccb2000-7f059ccdd000 r-xp 00001000 fe:00 322117   /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7fff849dc000-7fff84a05000 rw-p 00000000 00:00 0        [stack]`,
          neutros: [
            { re: "pmap( .*)?", nota: "O pmap também funciona, mas aqui use o pseudoarquivo do /proc que o kernel gera para cada processo (maps)." },
            { re: "cat /proc/(self|\\$\\$|\\d+)", nota: "Isso é um diretório. Dentro dele, o arquivo com o mapa de memória se chama maps." },
            { re: "free( .*)?", nota: "O free mostra a memória do sistema inteiro, não o mapa de um processo." }
          ],
          dica: "O Linux expõe isso em /proc/self/... e o arquivo se chama maps.",
          explicacao: "Repare nas permissões: o código do cat é r-x (TEXT), os dados rw-, e no fim aparecem [heap] e [stack]. A libc e o ld-linux são bibliotecas dinâmicas mapeadas entre os dois."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No vertabela, a pilha do xv6 aparece em 0x3000, logo acima da guarda, e o sbrk() cresce o heap acima dela. O que muda em relação ao Linux?",
          opcoes: [
            "Nada: é igual ao Linux",
            "No xv6 a pilha tem tamanho fixo e fica abaixo do heap; no Linux a pilha fica no topo e cresce para baixo",
            "O xv6 não tem pilha",
            "No xv6 o heap fica no núcleo"
          ],
          correta: 1,
          dica: "Leia o comentário de memlayout.h: \"fixed-size stack, expandable heap\".",
          explicacao: "O xv6 simplifica: uma página de pilha fixa (com guarda embaixo) e o heap crescendo acima. No Linux, heap e pilha crescem um em direção ao outro, com espaço livre entre eles."
        },
        {
          tipo: "conceito",
          titulo: "Atribuição de endereços",
          texto: `<p>O programador usa <b>nomes</b> (variáveis, funções); em algum momento eles viram <b>endereços</b>:</p>
            <ul>
              <li><b>Na codificação</b>: o programador define os endereços (Assembly em embarcados simples).</li>
              <li><b>Na compilação</b>: o compilador precisa conhecer todo o código.</li>
              <li><b>Na ligação</b>: o <b>linker</b> combina os arquivos-objeto e resolve os símbolos.</li>
              <li><b>Na carga</b>: o <b>loader</b> define os endereços ao carregar (também para bibliotecas dinâmicas).</li>
              <li><b>Na execução</b>: a <b>MMU</b> traduz continuamente os endereços.</li>
            </ul>
            <p>No <b>.NET</b>, o código vira CIL e o <b>JIT</b> gera código nativo só quando o método executa, o que permite o Hot Reload.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Em que momento o linker define endereços?",
          opcoes: ["Na edição", "Na ligação, ao combinar os arquivos-objeto", "Na execução", "Nunca: quem define é a MMU"],
          correta: 1,
          dica: "O compilador gera objetos sem endereços finais.",
          explicacao: "O compilador gera arquivos-objeto com símbolos pendentes; o linker os combina, resolve os símbolos e define os endereços do executável."
        },
        {
          tipo: "multipla",
          pergunta: "Quando o compilador JIT do .NET atribui endereços ao código?",
          opcoes: ["Na compilação do projeto", "Na ligação", "Na execução, quando o método é chamado", "Na instalação do programa"],
          correta: 2,
          dica: "JIT = Just-In-Time.",
          explicacao: "O CIL só é traduzido para código nativo, com endereços na RAM, quando o método executa. Esse adiamento permite recursos como o Hot Reload."
        }
      ]
    },

    // ================================================== FASE 3.3 — Alocação de memória
    {
      id: "m33",
      etapa: "3.3",
      titulo: "Alocação de memória",
      descricao: "Alocadores, fragmentação, Buddy e Slab",
      icone: "🧩",
      xv6: {
        titulo: "O alocador de páginas físicas do xv6",
        arquivo: "kernel/kalloc.c",
        codigo: `struct run {
  struct run *next;
};

// kalloc(): tira uma página da lista de livres
r = kmem.freelist;
if(r)
  kmem.freelist = r->next;

// kfree(): devolve a página para o início da lista
r = (struct run*)pa;
r->next = kmem.freelist;
kmem.freelist = r;`,
        texto: "O xv6 só aloca <b>páginas inteiras de 4 KB</b>, guardadas numa <b>lista de páginas livres</b>. Como todos os blocos têm o mesmo tamanho, não há fragmentação externa; em troca, quem pede pouco desperdiça o resto da página (fragmentação interna). O <code>freemem()</code> do laboratório conta essa lista."
      },
      linux: {
        titulo: "O alocador Buddy do Linux",
        comando: "cat /proc/buddyinfo",
        saida: `Node 0, zone      DMA      0      0      0      0      0      0      0      0      1      1      3
Node 0, zone    DMA32      0      2      3      1      2      4      2      3      4      2    753
Node 0, zone   Normal   2216    970    165    100     30     27     23      4      3      2     33`,
        texto: "Cada coluna conta os blocos livres de 2⁰, 2¹, 2², … 2¹⁰ páginas. Na zona Normal há 2.216 blocos de 1 página e 33 blocos de 1.024 páginas (4 MB). Os objetos pequenos do núcleo, como a <code>task_struct</code>, vêm do <b>Slab</b> (<code>/proc/slabinfo</code>)."
      },
      man: [
        { termo: "alocadores de memória", secao: "7", resumo: "físico (quadros), de núcleo (estruturas do kernel) e de usuário (malloc)",
          detalhe: "O alocador físico gerencia os quadros da RAM; o de núcleo cria e destrói estruturas pequenas (descritores, sockets, pipes…); o de usuário (LibC) atende malloc/free e pede ao núcleo para crescer o heap.",
          veja: ["Buddy(7)", "Slab(7)", "malloc(3)"] },
        { termo: "fragmentação externa", secao: "7", resumo: "espaço livre espalhado em pedaços entre áreas alocadas",
          detalhe: "Há memória livre suficiente no total, mas não contígua. Ex.: 600 MB livres e o maior bloco contínuo com 300 MB. Combate-se com estratégias de alocação, desfragmentação ou paginação.",
          veja: ["fragmentação interna(7)", "desfragmentação(7)"] },
        { termo: "fragmentação interna", secao: "7", resumo: "desperdício dentro da área alocada",
          detalhe: "Acontece quando a unidade mínima entregue é maior que o pedido. Ex.: pediu 1 KB e recebeu uma página de 4 KB: 3 KB não serão usados.",
          veja: ["fragmentação externa(7)", "Buddy(7)"] },
        { termo: "estratégias de alocação", secao: "7", resumo: "first-fit, next-fit, best-fit e worst-fit",
          detalhe: "First-fit: a primeira área que serve (rápido). Next-fit: como o first-fit, mas a partir da última posição. Best-fit: a menor área que serve (sobras pequenas e inúteis). Worst-fit: a maior área (sobras grandes). First-fit e best-fit têm aproveitamento parecido; o first-fit é mais rápido.",
          exemplo: "livres: 50, 10, 30, 40 MB\nfirst-fit(10) → 50   best-fit(28) → 30   worst-fit(3) → 50",
          veja: ["fragmentação externa(7)"] },
        { termo: "desfragmentação", secao: "7", resumo: "mover as áreas usadas para juntar as livres",
          detalhe: "Só se aplica a áreas físicas, porque o hardware de tradução esconde a mudança. Não serve para o heap de um processo, cujos ponteiros ficariam inválidos. Escolhe-se a solução que move menos dados.",
          veja: ["fragmentação externa(7)"] },
        { termo: "Buddy", secao: "7", resumo: "alocador por pares: blocos em potências de 2 divididos e fundidos ao meio",
          detalhe: "O pedido é arredondado para a potência de 2 acima; blocos maiores são divididos em pares (buddies) e, ao liberar, um bloco se funde com seu par livre. Usado pelo Linux para alocar page frames.",
          exemplo: "pedido de 200 KB → bloco de 256 KB",
          veja: ["Slab(7)", "fragmentação interna(7)"] },
        { termo: "Slab", secao: "7", resumo: "reservas de objetos do núcleo prontos para reuso",
          detalhe: "Cada cache guarda um tipo de objeto (ex.: task_struct) em slabs cheios, parciais ou vazios. Liberar um objeto devolve-o à prateleira, evitando fragmentação e o custo de inicializar de novo.",
          exemplo: "sudo grep task_struct /proc/slabinfo",
          veja: ["Buddy(7)"] },
        { termo: "sbrk", secao: "2", resumo: "aumenta ou diminui o heap movendo o program break",
          detalhe: "No Linux existe também brk; blocos grandes do malloc vêm de mmap. No xv6, sbrk(n) aloca páginas novas para o processo, como no aloca do laboratório.",
          exemplo: "char *p = sbrk(3 * 4096);",
          veja: ["heap(7)", "malloc(3)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Os três níveis de alocadores",
          texto: `<ol>
              <li><b>Alocador de memória física</b>: organiza a RAM e gerencia os <b>quadros</b>.</li>
              <li><b>Alocador do núcleo</b>: cria e destrói milhares de <b>estruturas pequenas</b> (descritores de processos e de arquivos, sockets, pipes).</li>
              <li><b>Alocador de usuário</b>: atende o <code>malloc</code>/<code>free</code> dos processos (LibC) e pede ao núcleo para crescer o HEAP.</li>
            </ol>
            <p class="destaque">"Diferentes clientes exigem diferentes garçons."</p>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada alocador ao que ele gerencia.",
          pares: [
            ["Alocador físico", "Quadros (frames) da RAM"],
            ["Alocador do núcleo", "Estruturas pequenas do kernel"],
            ["Alocador de usuário (LibC)", "Blocos do malloc no heap"]
          ],
          dica: "Do mais baixo (hardware) ao mais alto (programa).",
          explicacao: "O físico entrega quadros; o do núcleo os usa para estruturas internas; o de usuário divide o heap em blocos para o malloc."
        },
        {
          tipo: "conceito",
          titulo: "Fragmentação externa",
          texto: `<p>Com 1 GB livre: aloca 200 MB (a1), 100 MB (a2), 100 MB (a3); libera a1; aloca 300 MB (a4); libera a3.
            Resultado: <b>600 MB livres no total</b>, mas o maior bloco <b>contínuo</b> tem só <b>300 MB</b>.</p>
            <p>Isso é <b>fragmentação externa</b>: buracos livres espalhados entre as áreas alocadas. Para enfrentar:
            <b>estratégias de alocação</b>, <b>desfragmentação</b> ou aceitar <b>fragmentação interna</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Há 600 MB livres, mas um pedido de 400 MB é recusado porque o maior bloco contínuo tem 300 MB. Isso é…",
          opcoes: ["fragmentação externa", "fragmentação interna", "thrashing", "falta de página"],
          correta: 0,
          dica: "O espaço livre está fora das áreas alocadas, espalhado.",
          explicacao: "A memória livre existe, mas em pedaços não contíguos: fragmentação externa."
        },
        {
          tipo: "conceito",
          titulo: "Estratégias de alocação",
          texto: `<p>Memória, do início ao fim:</p>
            <pre class="terminal">[Livre 50] [P5] [Livre 10] [P4] [Livre 30] [P3] [P2] [Livre 40] [P1]</pre>
            <ul>
              <li><b>First-fit</b>: a <b>primeira</b> área que serve (rápido).</li>
              <li><b>Next-fit</b>: como o first-fit, mas começa da <b>última</b> alocação.</li>
              <li><b>Best-fit</b>: a <b>menor</b> área que serve (sobras pequenas e inúteis).</li>
              <li><b>Worst-fit</b>: a <b>maior</b> área (a sobra ainda serve para outros).</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "Áreas livres de 50, 10, 30 e 40 MB (nessa ordem). Onde o best-fit coloca um processo de 28 MB?",
          opcoes: ["50 MB", "10 MB", "30 MB", "40 MB"],
          correta: 2,
          dica: "A menor área em que o processo cabe.",
          explicacao: "30 MB é a menor área que comporta 28 MB: sobram só 2 MB, um fragmento provavelmente inútil."
        },
        {
          tipo: "multipla",
          pergunta: "Mesmas áreas (50, 10, 30, 40 MB). Onde o worst-fit coloca um processo de 3 MB?",
          opcoes: ["50 MB", "10 MB", "30 MB", "40 MB"],
          correta: 0,
          dica: "A maior área livre.",
          explicacao: "O worst-fit usa a maior área (50 MB), deixando 47 MB livres, uma sobra grande o bastante para outros pedidos."
        },
        {
          tipo: "multipla",
          pergunta: "A última alocação foi o P4. Onde o next-fit coloca um processo de 35 MB?",
          opcoes: ["Livre 50 MB", "Livre 10 MB", "Livre 30 MB", "Livre 40 MB"],
          correta: 3,
          dica: "Comece a busca logo depois de P4.",
          explicacao: "A partir de P4: Livre 30 MB (não cabe) → Livre 40 MB (cabe, sobram 5 MB). O first-fit, que começa do início, teria usado a de 50 MB."
        },
        {
          tipo: "multipla",
          pergunta: "Por que não se desfragmenta o heap de um processo, movendo os blocos do malloc?",
          opcoes: [
            "Porque é lento demais",
            "Porque os ponteiros do programa continuariam apontando para os endereços antigos",
            "Porque o heap não fragmenta",
            "Porque a MMU não deixa"
          ],
          correta: 1,
          dica: "Quem guarda os endereços dos blocos é o próprio programa.",
          explicacao: "Na memória física, a tabela de páginas esconde a mudança. No heap, o programa guarda os endereços em ponteiros, que ficariam inválidos."
        },
        {
          tipo: "conceito",
          titulo: "Fragmentação interna, Buddy e Slab",
          texto: `<p><b>Fragmentação interna</b>: desperdício <b>dentro</b> da área alocada, quando a unidade mínima é maior que o pedido
            (pediu 1 KB, recebeu uma página de 4 KB).</p>
            <p><b>Buddy</b>: blocos em <b>potências de 2</b>. O pedido é arredondado para cima e blocos maiores são <b>divididos ao meio</b>
            até o tamanho certo; ao liberar, o bloco se <b>funde</b> com seu par. O Linux o usa para alocar quadros.</p>
            <p><b>Slab</b>: o núcleo mantém <b>reservas de objetos prontos</b> de cada tipo (ex.: <code>task_struct</code>), reaproveitados em microssegundos.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "No alocador Buddy, um pedido de 200 KB recebe um bloco de quanto?",
          opcoes: ["200 KB", "256 KB", "512 KB", "1 MB"],
          correta: 1,
          dica: "Arredonde para a potência de 2 imediatamente superior.",
          explicacao: "A potência de 2 logo acima de 200 KB é 256 KB. Os 56 KB que sobram são fragmentação interna."
        },
        {
          tipo: "multipla",
          pergunta: "Para que serve o alocador Slab?",
          opcoes: [
            "Para mover páginas para o disco",
            "Para reaproveitar objetos do núcleo já prontos, sem alocar e inicializar de novo",
            "Para dividir blocos em potências de 2",
            "Para traduzir endereços"
          ],
          correta: 1,
          dica: "Pense numa prateleira de objetos do mesmo tipo.",
          explicacao: "Cada cache do Slab guarda objetos de um tipo. Liberar devolve o objeto à prateleira, evitando fragmentação e o custo de inicialização."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No laboratório, aloca 1 gastou 1 página e aloca 3 gastou 3. Por que aloca 600 gastou 601?",
          opcoes: [
            "Erro de contagem do freemem",
            "Uma tabela de páginas tem 512 entradas: passando disso, o kernel precisou criar mais uma página de tabela",
            "O sbrk sempre arredonda para potência de 2",
            "A pilha cresceu junto"
          ],
          correta: 1,
          dica: "Cada tabela do último nível mapeia no máximo 512 páginas.",
          explicacao: "As tabelas de páginas também ocupam memória. Com 600 páginas novas, a tabela do último nível existente encheu e o walk() alocou mais uma página para outra tabela."
        }
      ]
    },

    // ================================================== FASE 3.4A — Paginação em disco
    {
      id: "m34a",
      etapa: "3.4 A",
      titulo: "Paginação em disco",
      descricao: "Swapping, falta de página e eficiência",
      icone: "💽",
      xv6: {
        titulo: "Tratando a falta de página (Lab 03)",
        arquivo: "kernel/trap.c (código do laboratório)",
        codigo: `// falta de pagina? (scause 13 = leitura, 15 = escrita)
int
faltapagina(struct proc *p)
{
  uint64 c = r_scause();
  if(c != 13 && c != 15)
    return 0; // nao e falta de pagina
  printf("FALTA DE PAGINA: processo %d (%s) tentou %s",
         p->pid, p->name, c == 13 ? "LER" : "ESCREVER");
  printf(" o endereco 0x%lx\\n", r_stval());
  setkilled(p); // mata o processo
  return 1;
}`,
        texto: "A MMU do RISC-V avisa a falta de página pelo registrador <code>scause</code> (13 = leitura, 15 = escrita) e informa o endereço em <code>stval</code>. O xv6 <b>não faz paginação em disco</b>: toda falta é tratada como acesso inválido, e o processo é encerrado."
      },
      linux: {
        titulo: "Faltas de página no Linux",
        comando: "ps -o pid,min_flt,maj_flt,rss,comm -p $$",
        saida: `  PID  MINFL  MAJFL   RSS COMMAND
  296    335      0  3488 bash`,
        texto: "<b>MINFL</b> são faltas resolvidas sem disco (a página já estava na RAM, por exemplo no cache). <b>MAJFL</b> são faltas que exigiram ler do disco, as caras. RSS é a memória residente em KB."
      },
      man: [
        { termo: "swapping", secao: "7", resumo: "mover um processo inteiro ocioso para o disco (swap-out) e trazê-lo de volta (swap-in)",
          detalhe: "Muito usado até os anos 1990; hoje os SOs de uso geral preferem a paginação, que move páginas individuais.",
          veja: ["paginação em disco(7)", "overlay(7)"] },
        { termo: "paginação em disco", secao: "7", resumo: "mover páginas ociosas para a área de troca (swap) e trazê-las quando acessadas",
          detalhe: "Ao levar uma página ao disco, o SO desliga o bit de presença e anota a posição no disco. Se ela for acessada, ocorre uma falta de página e o núcleo a recarrega (page-in).",
          veja: ["falta de página(7)", "substituição de páginas(7)"] },
        { termo: "falta de página", secao: "7", resumo: "page fault: acesso a uma página que não está na RAM (ou sem permissão)",
          detalhe: "A MMU gera a interrupção; o SO verifica se o acesso é válido, escolhe um quadro (salvando a vítima se modificada), lê a página do disco, atualiza a tabela e reexecuta a instrução. Enquanto isso, o processo fica suspenso.",
          veja: ["paginação em disco(7)", "MMU(7)"] },
        { termo: "tempo médio de acesso", secao: "7", resumo: "(1 − p) · t_RAM + p · t_falta",
          detalhe: "Como o disco é cerca de 100.000 vezes mais lento que a RAM, até uma taxa de faltas p minúscula multiplica o tempo médio.",
          exemplo: "t_RAM = 100 ns, t_falta = 10 ms, p = 0,001\n→ ≈ 10.100 ns (100 vezes mais lento)",
          veja: ["falta de página(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Usando o disco como extensão da RAM",
          texto: `<p>A RAM sempre foi escassa. Os mecanismos de memória virtual permitem mover partes <b>ociosas</b> para o disco,
            de forma <b>transparente</b> para os processos:</p>
            <ul>
              <li><b>Overlays</b>: o programador divide o programa em módulos (ex.: Turbo Pascal). Hoje é raro.</li>
              <li><b>Swapping</b>: move um <b>processo inteiro</b> para o disco (swap-out) e de volta (swap-in).</li>
              <li><b>Paginação</b>: move <b>páginas individuais</b> (page-out); se forem acessadas, ocorre uma <b>falta de página</b> e o núcleo as traz de volta (page-in). É a técnica mais usada hoje.</li>
            </ul>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada técnica ao que ela move entre a RAM e o disco.",
          pares: [
            ["Overlay", "Módulos escolhidos pelo programador"],
            ["Swapping", "O processo inteiro"],
            ["Paginação", "Páginas individuais, escolhidas pelo SO"]
          ],
          dica: "Só uma delas depende do programador.",
          explicacao: "Overlays são manuais; o swapping troca processos inteiros; a paginação troca páginas, o que é mais flexível e eficiente."
        },
        {
          tipo: "conceito",
          titulo: "A falta de página",
          texto: `<p>Quando uma página vai para a área de <b>swap</b>, o SO desliga o <b>bit de presença</b> na tabela e anota a posição no disco.
            Se o processo acessar essa página, a <b>MMU</b> gera uma interrupção de <b>falta de página</b> e o SO:</p>
            <ol>
              <li>verifica se o acesso é válido;</li>
              <li>escolhe um quadro livre (ou libera um, salvando a vítima no disco se ela foi modificada);</li>
              <li>lê a página do disco para o quadro;</li>
              <li>atualiza a tabela de páginas;</li>
              <li>reexecuta a instrução que causou a falta.</li>
            </ol>
            <p>⚠ O disco é cerca de <b>100.000 vezes mais lento</b> que a RAM: tempo médio = (1 − p)·t_RAM + p·t_falta.</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene o tratamento de uma falta de página.",
          itens: [
            "A MMU gera a interrupção de falta de página",
            "O SO verifica se o acesso é válido",
            "O SO escolhe um quadro (salvando a vítima, se modificada)",
            "A página é lida do disco para o quadro",
            "A tabela de páginas é atualizada e a instrução é reexecutada"
          ],
          dica: "Quem percebe o problema é o hardware.",
          explicacao: "MMU detecta → SO valida → arranja um quadro → lê a página → atualiza a tabela e repete a instrução. Enquanto isso, o processo fica suspenso."
        },
        {
          tipo: "multipla",
          pergunta: "Com t_RAM = 100 ns, t_falta = 10 ms e taxa de faltas p = 0,001 (uma falta a cada mil acessos), qual é o tempo médio de acesso, aproximadamente?",
          opcoes: ["100 ns", "200 ns", "≈ 10.100 ns", "10 ms"],
          correta: 2,
          dica: "0,999 × 100 ns + 0,001 × 10.000.000 ns.",
          explicacao: "≈ 99,9 + 10.000 = 10.099,9 ns: com só uma falta a cada mil acessos, a memória fica ~100 vezes mais lenta. Por isso a escolha da vítima importa tanto."
        },
        {
          tipo: "multipla",
          pergunta: "Por que páginas de código são vítimas \"baratas\" na hora de liberar um quadro?",
          opcoes: [
            "Porque são pequenas",
            "Porque não são modificadas: dá para descartá-las e reler do executável, sem salvar no disco",
            "Porque nunca são usadas de novo",
            "Porque ficam na TLB"
          ],
          correta: 1,
          dica: "Pense no bit M.",
          explicacao: "Uma página de código está intacta no executável. Já uma página de dados modificada (bit M = 1) precisa ser escrita no swap antes de sair: dois acessos ao disco em vez de um."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No falta do laboratório, o kernel mostra scause 0xd (13) ao rodar falta 1, que lê 0x40000000. O que significa 13?",
          opcoes: ["Falta de página por escrita", "Falta de página por leitura", "Chamada de sistema", "Interrupção do timer"],
          correta: 1,
          dica: "No faltapagina(): c == 13 ? \"LER\" : \"ESCREVER\".",
          explicacao: "No RISC-V, scause 13 é falta de página de leitura (load page fault) e 15 é de escrita (store page fault). O endereço problemático vem em stval."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "A página 0x0 existe na tabela do processo. Por que falta 2, que escreve em main(), gerou falta de página?",
          opcoes: [
            "Porque a página foi para o disco",
            "Porque a página de código é R-XU: pode ler e executar, mas não tem permissão de escrita",
            "Porque main() fica no núcleo",
            "Porque o endereço 0x0 é sempre inválido"
          ],
          correta: 1,
          dica: "Olhe as flags da página 0x0 no vertabela.",
          explicacao: "A falta de página também acontece por violação de permissão: a página está presente, mas sem a flag W. Por isso o falta 2 é uma falta de escrita."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "falta 4 4096 leu o valor 0, mas falta 4 8192 gerou falta de página. Por quê?",
          opcoes: [
            "8192 é um endereço do núcleo",
            "4096 (0x1000) é a página de dados, com flag U; 8192 (0x2000) é a página de guarda, sem U",
            "8192 está além de MAXVA",
            "A segunda leitura foi depois de um exit()"
          ],
          correta: 1,
          dica: "Converta para hexadecimal: 4096 = 0x1000 e 8192 = 0x2000.",
          explicacao: "A página de guarda existe na tabela, mas sem a flag U: qualquer acesso do modo usuário gera falta. É assim que o xv6 detecta o estouro da pilha."
        }
      ]
    },

    // ================================================== FASE 3.4B — Substituição de páginas (chefe)
    {
      id: "m34b",
      etapa: "3.4 B",
      titulo: "Substituição de páginas",
      descricao: "FIFO, ótimo, LRU, Belady e thrashing",
      icone: "🏆",
      chefe: true,
      linux: {
        titulo: "A área de troca (swap)",
        comando: "free -h; cat /proc/sys/vm/swappiness",
        saida: `               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       2.1Gi       3.9Gi        28Mi       1.8Gi       5.4Gi
Swap:          2.0Gi          0B       2.0Gi
60`,
        texto: "A linha <b>Swap</b> é a área de troca no disco. O <code>swappiness</code> (0 a 200, padrão 60) diz o quanto o kernel prefere mandar páginas anônimas para o swap em vez de descartar o cache de arquivos. O Linux escolhe as vítimas com aproximações do LRU; versões recentes usam o <b>MGLRU</b> (gerações)."
      },
      man: [
        { termo: "substituição de páginas", secao: "7", resumo: "escolher qual página tirar da RAM quando a memória está cheia",
          detalhe: "Critérios: idade, frequência e data do último acesso, prioridade do processo, conteúdo (código é barato; dados modificados precisam ser salvos) e páginas especiais (buffers de E/S).",
          veja: ["FIFO(7)", "LRU(7)", "OPT(7)"] },
        { termo: "FIFO", secao: "7", resumo: "remove a página que está há mais tempo na memória",
          detalhe: "Simples, mas ignora o uso: uma página muito usada pode sair só por ser antiga. Sofre a anomalia de Belady.",
          exemplo: "cadeia do livro, 3 quadros → 15 faltas",
          veja: ["anomalia de Belady(7)", "segunda chance(7)"] },
        { termo: "OPT", secao: "7", resumo: "algoritmo ótimo: remove a página que ficará mais tempo sem uso no futuro",
          detalhe: "Não é implementável (exige conhecer o futuro), mas define o limite mínimo de faltas e serve de referência para avaliar os outros.",
          exemplo: "cadeia do livro, 3 quadros → 9 faltas",
          veja: ["LRU(7)"] },
        { termo: "LRU", secao: "7", resumo: "Least Recently Used: remove a página usada há mais tempo",
          detalhe: "Supõe que o passado recente prevê o futuro próximo. O LRU exato exigiria registrar cada acesso, por isso os SOs usam aproximações baseadas nos bits R e M.",
          exemplo: "cadeia do livro, 3 quadros → 12 faltas",
          veja: ["segunda chance(7)", "NRU(7)", "envelhecimento(7)"] },
        { termo: "segunda chance", secao: "7", resumo: "FIFO que poupa páginas com o bit R ligado",
          detalhe: "Se a página mais antiga tem R = 1, o R é zerado e ela vai para o fim da fila. Implementado como lista circular com ponteiro: o algoritmo do relógio.",
          veja: ["FIFO(7)", "LRU(7)"] },
        { termo: "NRU", secao: "7", resumo: "Not Recently Used: escolhe a vítima pelos bits R e M",
          detalhe: "Nível 0: R=0, M=0 (melhor vítima) · nível 1: R=0, M=1 · nível 2: R=1, M=0 · nível 3: R=1, M=1.",
          veja: ["LRU(7)"] },
        { termo: "envelhecimento", secao: "7", resumo: "aging: contador por página que aproxima o LRU",
          detalhe: "Periodicamente, o contador é deslocado à direita e o bit R entra no bit mais significativo. Sai a página de menor contador.",
          exemplo: "A = 10000000 (usada agora)\nB = 01111111 (usada antes)\n→ sai B",
          veja: ["LRU(7)"] },
        { termo: "anomalia de Belady", secao: "7", resumo: "mais quadros causando mais faltas",
          detalhe: "Ocorre com o FIFO, por exemplo. Os algoritmos de pilha (OPT, LRU) não sofrem a anomalia.",
          exemplo: "1,2,3,4,1,2,5,1,2,3,4,5 com FIFO:\n3 quadros → 9 faltas; 4 quadros → 10 faltas",
          veja: ["FIFO(7)"] },
        { termo: "conjunto de trabalho", secao: "7", resumo: "as páginas que um processo usou numa janela recente de acessos",
          detalhe: "Se o conjunto de trabalho cabe na RAM, ocorrem poucas faltas. Se a soma dos conjuntos de todos os processos não cabe, surge o thrashing.",
          veja: ["thrashing(7)", "localidade(7)"] },
        { termo: "thrashing", secao: "7", resumo: "o sistema passa mais tempo paginando do que executando",
          detalhe: "A RAM não comporta os conjuntos de trabalho: cada processo executa pouco, gera falta, rouba páginas de outro, que também falta. Soluções: reduzir o grau de multiprogramação, aumentar a RAM, controlar a taxa de faltas por processo.",
          veja: ["conjunto de trabalho(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Algoritmos de substituição",
          texto: `<p>Com a RAM cheia, uma falta de página exige tirar uma página (a <b>vítima</b>). Se sair uma página muito usada, ela logo vai faltar de novo.</p>
            <ul>
              <li><b>FIFO</b>: sai a que está <b>há mais tempo na memória</b>. Simples, mas ignora o uso.</li>
              <li><b>Ótimo (OPT)</b>: sai a que vai ficar <b>mais tempo sem uso no futuro</b>. Impossível na prática, mas é o limite mínimo.</li>
              <li><b>LRU</b>: sai a <b>usada há mais tempo</b> no passado. Boa aproximação do ótimo.</li>
              <li><b>RANDOM</b>: sorteia a vítima; útil em varreduras cíclicas, em que LRU e FIFO vão mal.</li>
            </ul>
            <p>Nas simulações a seguir, o jogo avança sozinho nos acertos. Quando a memória estiver cheia, <b>clique no quadro da vítima</b>.</p>`
        },
        {
          tipo: "substituicao",
          pergunta: "Aplique o FIFO com 3 quadros.",
          algoritmo: "FIFO",
          cadeia: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
          quadros: 3,
          dica: "Olhe em que instante (t) cada página entrou: sai a mais antiga, mesmo que tenha sido usada agora há pouco.",
          explicacao: "O FIFO gerou 9 faltas. Guarde esta cadeia: ela aparece de novo na anomalia de Belady."
        },
        {
          tipo: "substituicao",
          pergunta: "Agora o LRU, com a cadeia do livro e 3 quadros.",
          algoritmo: "LRU",
          cadeia: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
          quadros: 3,
          dica: "Sai a página cujo último uso é o mais antigo.",
          explicacao: "O LRU gerou 12 faltas nesta cadeia, contra 15 do FIFO."
        },
        {
          tipo: "substituicao",
          pergunta: "Por fim, o algoritmo ótimo, com a mesma cadeia e 3 quadros.",
          algoritmo: "OPT",
          cadeia: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
          quadros: 3,
          dica: "Olhe o próximo uso de cada página: sai a que vai demorar mais (ou que não será mais usada).",
          explicacao: "O ótimo gerou 9 faltas: nenhum algoritmo consegue menos nesta cadeia com 3 quadros."
        },
        {
          tipo: "multipla",
          pergunta: "Por que o algoritmo ótimo não pode ser implementado num SO real?",
          opcoes: [
            "Porque é lento demais",
            "Porque exige conhecer os acessos futuros",
            "Porque usa memória demais",
            "Porque sofre a anomalia de Belady"
          ],
          correta: 1,
          dica: "Lembre como você escolheu as vítimas na simulação.",
          explicacao: "Para escolher a página que demorará mais a ser usada, seria preciso conhecer o futuro. Ele serve como referência: um algoritmo bom chega perto das suas 9 faltas."
        },
        {
          tipo: "conceito",
          titulo: "Aproximações do LRU",
          texto: `<p>O LRU exato exigiria registrar a data de <b>cada</b> acesso à memória. Os SOs usam os bits <b>R</b> (referência) e <b>M</b> (modificação) da MMU:</p>
            <ul>
              <li><b>Segunda chance</b>: FIFO que, se a mais antiga tem R = 1, zera o R e a manda para o fim da fila (o \"relógio\").</li>
              <li><b>NRU</b>: quatro níveis por (R, M); sai primeiro uma página do nível 0 (R = 0, M = 0).</li>
              <li><b>Envelhecimento</b> (<i>aging</i>): um contador por página; periodicamente desloca à direita e coloca o R no bit mais significativo. Sai a de <b>menor</b> contador.</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "Na segunda chance, a página mais antiga tem R = 1. O que acontece com ela?",
          opcoes: [
            "É removida",
            "O bit R é zerado e ela vai para o fim da fila",
            "O bit M é ligado",
            "Ela vai para o disco sem ser salva"
          ],
          correta: 1,
          dica: "Ela foi usada recentemente, então merece outra chance.",
          explicacao: "O R = 1 indica uso recente: a página é poupada, perde o R e volta para o fim da fila. Se todas tiverem R = 1, o algoritmo vira FIFO."
        },
        {
          tipo: "associar",
          pergunta: "No NRU, associe cada combinação dos bits R e M ao seu nível (o nível 0 é a melhor vítima).",
          pares: [
            ["R = 0, M = 0", "Nível 0: melhor vítima"],
            ["R = 0, M = 1", "Nível 1"],
            ["R = 1, M = 0", "Nível 2"],
            ["R = 1, M = 1", "Nível 3: pior vítima"]
          ],
          dica: "Não ter sido usada recentemente pesa mais do que não ter sido modificada.",
          explicacao: "O NRU prefere páginas sem uso recente (R = 0) e, entre elas, as não modificadas (M = 0), que podem sair sem ser salvas no disco."
        },
        {
          tipo: "multipla",
          pergunta: "No envelhecimento com contadores de 8 bits, qual página sai?",
          contexto: "Página A: 10000000   (acessada só no último intervalo)\nPágina B: 01111111   (acessada em todos os intervalos, menos no último)",
          opcoes: ["A, porque foi acessada uma vez só", "B, porque tem o menor contador", "Nenhuma: empate", "As duas"],
          correta: 1,
          dica: "Compare os contadores como números binários.",
          explicacao: "10000000 (128) > 01111111 (127): sai B. O bit mais significativo representa o acesso mais recente, que pesa mais que todos os antigos juntos. É por isso que não basta somar os bits R."
        },
        {
          tipo: "conceito",
          titulo: "Belady e thrashing",
          texto: `<p><b>Anomalia de Belady</b>: o esperado é que mais quadros gerem menos faltas, mas o <b>FIFO</b> pode gerar <b>mais faltas com mais quadros</b>.
            Com a cadeia 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5: <b>9 faltas com 3 quadros</b> e <b>10 com 4 quadros</b>.
            Os algoritmos de pilha (OPT, LRU) não sofrem a anomalia.</p>
            <p><b>Thrashing</b>: a RAM não comporta os <b>conjuntos de trabalho</b> dos processos ativos. Cada um executa pouco, gera falta e
            rouba páginas de outro, que também falta: o sistema passa <b>mais tempo paginando do que executando</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O que é a anomalia de Belady?",
          opcoes: [
            "Mais quadros causando mais faltas de página",
            "Faltas de página em páginas de código",
            "O LRU gerando mais faltas que o FIFO",
            "O algoritmo ótimo errando a vítima"
          ],
          correta: 0,
          dica: "Lembre da cadeia da primeira simulação, agora com 4 quadros.",
          explicacao: "Com FIFO, a cadeia 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 gera 9 faltas com 3 quadros e 10 com 4. Ou seja, não basta ter mais RAM: o algoritmo também importa."
        },
        {
          tipo: "multipla",
          pergunta: "Qual família de algoritmos não sofre a anomalia de Belady?",
          opcoes: ["Os algoritmos de pilha, como OPT e LRU", "Os baseados em fila, como o FIFO", "Os aleatórios", "Nenhuma"],
          correta: 0,
          dica: "No LRU, as páginas na memória com N quadros estão sempre contidas nas páginas com N + 1 quadros.",
          explicacao: "Nos algoritmos de pilha, o conjunto de páginas com N quadros é sempre um subconjunto do conjunto com N + 1. Com mais quadros, nunca há mais faltas."
        },
        {
          tipo: "multipla",
          pergunta: "O que caracteriza o thrashing?",
          opcoes: [
            "A CPU ociosa por falta de processos",
            "O sistema passar mais tempo tratando faltas e movendo páginas do que executando os processos",
            "Um deadlock entre processos",
            "A TLB cheia"
          ],
          correta: 1,
          dica: "A paginação toma conta de tudo.",
          explicacao: "Quando os conjuntos de trabalho não cabem na RAM, as faltas se realimentam. As soluções são reduzir o grau de multiprogramação, aumentar a RAM ou controlar a taxa de faltas por processo."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada solução atual à sua ideia principal.",
          pares: [
            ["LIRS", "Considera o intervalo entre reusos de uma página"],
            ["ARC", "Combina recência e frequência, adaptando-se (usado no ZFS)"],
            ["MGLRU", "Organiza as páginas em gerações (Linux)"]
          ],
          dica: "Uma delas é do Linux; outra, do ZFS.",
          explicacao: "As três superam limitações do LRU: o LIRS olha o intervalo de reuso, o ARC equilibra recência e frequência, e o Multi-Gen LRU do Linux agrupa as páginas por gerações de acesso."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No compartilha do laboratório, só a trampoline tinha o mesmo endereço físico no pai e no filho; código, dados e pilha foram copiados. Como o copy-on-write reduziria o gasto do fork()?",
          opcoes: [
            "Copiando as páginas para o disco",
            "Pai e filho compartilhariam as mesmas páginas (marcadas só para leitura) e só copiariam uma página quando alguém escrevesse nela",
            "Impedindo o filho de usar memória",
            "Usando páginas maiores"
          ],
          correta: 1,
          dica: "Copiar só quando escrever: copy-on-write.",
          explicacao: "Com COW, o fork() só copia a tabela de páginas e marca as páginas como somente leitura. A primeira escrita gera uma falta de página, e só então o kernel copia aquela página. O Linux faz assim; o xv6 original copia tudo no uvmcopy()."
        }
      ]
    }
  ]
});
