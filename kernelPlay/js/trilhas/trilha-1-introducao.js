/* =========================================================
   KernelPlay — Trilha 1: Introdução aos Sistemas Operacionais
   Fonte: Trilhas/Trilha_1_Introducao.md (Aulas 1 a 3 da disciplina;
   MAZIERO, Sistemas Operacionais: Conceitos e Mecanismos, Parte I).
   O formato das fases e dos desafios está documentado em js/trilhas.js.
   ========================================================= */

TRILHAS.push({
  id: "introducao",
  numero: 1,
  titulo: "Introdução aos Sistemas Operacionais",
  subtitulo: "Por que estudar SO, de onde eles vieram e como são por dentro.",
  fases: [
    // ---------------------------------------------------- FASE 1.1
    {
      id: "intro-1",
      etapa: "1.1",
      titulo: "Por que estudar SO?",
      descricao: "O que a disciplina é (e o que não é)",
      icone: "🎯",
      man: [
        { termo: "sistema operacional", secao: "7", resumo: "o software que gerencia os recursos do computador e os oferece aos programas",
          detalhe: "Gerencia recursos (CPU, memória, dispositivos, arquivos), abstrai o hardware e oferece serviços aos programas, de forma conveniente, eficiente, correta e segura.",
          veja: ["máquina estendida(7)", "gerenciador de recursos(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "A pergunta que guia a disciplina",
          texto: `<p class="destaque">"Se o computador tem processador, memória e disco, por que ainda precisamos de um sistema operacional?"</p>
            <p>A resposta revela as camadas de complexidade por trás de cada clique, cada processo e cada arquivo:
            é aqui que se entende como o software conversa com o hardware.</p>
            <p>O foco é a <b>compreensão dos mecanismos</b>: como o SO <b>gerencia recursos</b>,
            <b>abstrai o hardware</b> e <b>oferece serviços</b> aos programas.</p>
            <p>A disciplina <b>não é</b> treinamento de comandos, configuração de sistemas nem administração de TI,
            e não exige escrever um SO do zero.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual destes itens faz parte do foco da disciplina?",
          opcoes: [
            "Instalar distribuições Linux",
            "Administrar usuários de rede",
            "Compreender os mecanismos pelos quais o SO gerencia recursos",
            "Dominar o código-fonte do Windows"
          ],
          correta: 2,
          dica: "A disciplina é sobre entender como funciona, não sobre operar ou configurar.",
          explicacao: "O foco é a compreensão dos mecanismos, não treinamento de comandos nem administração de TI."
        },
        {
          tipo: "multipla",
          pergunta: "Qual é a pergunta que guia a disciplina?",
          opcoes: [
            "Como instalar e configurar um servidor Linux?",
            "Se o computador tem processador, memória e disco, por que ainda precisamos de um SO?",
            "Qual é o sistema operacional mais rápido do mercado?",
            "Como escrever um sistema operacional do zero em Assembly?"
          ],
          correta: 1,
          dica: "É uma pergunta sobre o papel do SO entre o hardware e os programas.",
          explicacao: "A pergunta-guia questiona por que, mesmo com todo o hardware, ainda precisamos de uma camada de software para gerenciá-lo."
        },
        {
          tipo: "conceito",
          titulo: "As unidades da disciplina",
          texto: `<ol>
            <li><b>Introdução aos SOs</b>: conceitos, história, chamadas de sistema e estruturas.</li>
            <li><b>Gerenciamento de Processos</b>: processos e threads, comunicação, escalonamento e deadlocks.</li>
            <li><b>Gerência de Memória</b>: gerência básica, troca de processos e memória virtual.</li>
            <li><b>Sistemas de Arquivos</b>: arquivos, diretórios, acesso, alocação e espaço em disco.</li>
            <li><b>Dispositivos e E/S</b>: controladores, drivers e E/S independente do dispositivo.</li>
          </ol>
          <p>Cada unidade é uma trilha do KernelPlay.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual unidade estuda gerência básica, troca de processos e memória virtual?",
          opcoes: ["Gerenciamento de Processos", "Gerência de Memória", "Sistemas de Arquivos", "Dispositivos e Entrada/Saída"],
          correta: 1,
          dica: "\"A memória é o recurso mais disputado do sistema.\"",
          explicacao: "Gerência de Memória cobre a gerência básica, a troca de processos (swapping), a memória virtual e o desempenho."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada unidade a um assunto dela.",
          pares: [
            ["Gerenciamento de Processos", "Escalonamento e deadlocks"],
            ["Gerência de Memória", "Memória virtual"],
            ["Sistemas de Arquivos", "Diretórios e caminhos"],
            ["Dispositivos e E/S", "Drivers de dispositivo"]
          ],
          dica: "Pense no recurso que cada unidade gerencia: CPU, memória, armazenamento ou periféricos.",
          explicacao: "Processos disputam a CPU (escalonamento, deadlocks); a memória virtual é da gerência de memória; diretórios organizam arquivos; drivers são a ponte com o hardware."
        }
      ]
    },

    // ---------------------------------------------------- FASE 1.2
    {
      id: "intro-2",
      etapa: "1.2",
      titulo: "Um pouco de história",
      descricao: "De Babbage aos PCs",
      icone: "📜",
      xv6: {
        titulo: "O xv6 é um UNIX dos anos 1970",
        arquivo: "README",
        codigo: `xv6 is a re-implementation of Dennis Ritchie's and Ken Thompson's Unix
Version 6 (v6).  xv6 loosely follows the structure and style of v6,
but is implemented for a modern RISC-V multiprocessor using ANSI C.`,
        texto: "O xv6, usado na disciplina, é uma reimplementação didática do <b>UNIX Version 6</b> (1975), de Ken Thompson e Dennis Ritchie. Estudar o xv6 é estudar, em miniatura, o sistema que nasceu na 3ª geração."
      },
      linux: {
        titulo: "O herdeiro do UNIX",
        comando: "uname -srmo",
        saida: "Linux 6.8.0-49-generic x86_64 GNU/Linux",
        texto: "O Linux, iniciado por Linus Torvalds em 1991, é um sistema <i>UNIX-like</i>: escrito do zero, mas seguindo os princípios e as interfaces do UNIX (multiusuário, \"tudo é um arquivo\", shell, padrão POSIX)."
      },
      man: [
        { termo: "lote", secao: "7", resumo: "processamento em lote (batch): executar vários jobs em sequência, sem intervenção manual",
          detalhe: "Surgiu na 2ª geração para não deixar computadores caros ociosos. Não tinha interatividade: um erro só era percebido horas ou dias depois.",
          veja: ["monitor(7)", "multiprogramação(7)"] },
        { termo: "monitor", secao: "7", resumo: "programa que carrega e encadeia os jobs automaticamente",
          detalhe: "Precursor do SO: carregava programas na memória, iniciava jobs e passava de uma tarefa para a outra. Exemplo: Fortran Monitor System (FMS).",
          veja: ["lote(7)"] },
        { termo: "multiprogramação", secao: "7", resumo: "manter vários programas na memória e trocar quando um espera E/S",
          detalhe: "Enquanto um programa espera entrada/saída, o SO executa outro, e a CPU deixa de ficar ociosa. É a base dos sistemas multitarefa modernos.",
          veja: ["time-sharing(7)", "spooling(7)"] },
        { termo: "spooling", secao: "7", resumo: "usar o disco como área intermediária entre a CPU e periféricos lentos",
          detalhe: "Simultaneous Peripheral Operations On-Line. Os jobs são lidos para o disco antes e a saída é gravada em disco e enviada depois ao periférico, como na fila de impressão.",
          veja: ["multiprogramação(7)"] },
        { termo: "time-sharing", secao: "7", resumo: "compartilhamento de tempo: dividir a CPU em fatias de milissegundos entre usuários",
          detalhe: "Cada usuário tem seu terminal e a sensação de usar a máquina sozinho (pseudoparalelismo). Exemplos pioneiros: CTSS e MULTICS.",
          veja: ["multiprogramação(7)", "UNIX(7)"] },
        { termo: "UNIX", secao: "7", resumo: "SO multiusuário criado nos Bell Labs por Ken Thompson e Dennis Ritchie",
          detalhe: "Menor e mais simples que o MULTICS. Filosofia: \"tudo é um arquivo\", sistema de arquivos hierárquico, shell, utilitários pequenos combinados por pipes e compatibilidade POSIX. Inspirou o BSD, o MINIX, o Linux e o xv6.",
          veja: ["time-sharing(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Por que olhar para o passado?",
          texto: `<p class="destaque">"Em que momento da história surgiu a necessidade de um sistema operacional?"</p>
            <p>Os SOs não surgiram prontos: <b>cada geração resolveu os problemas da sua época</b>, e a evolução do
            hardware criou novas exigências para o software. Muitos mecanismos atuais têm raízes de décadas atrás.</p>
            <p>No século XIX, <b>Charles Babbage</b> projetou máquinas para calcular automaticamente (a máquina
            diferencial e a máquina analítica, de uso geral, que nunca foi plenamente construída).
            <b>Ada Lovelace</b> percebeu que uma máquina programável poderia manipular qualquer símbolo e é chamada de
            primeira programadora da história.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Verdadeiro ou falso: a máquina analítica de Babbage tinha um sistema operacional rudimentar.",
          opcoes: ["Verdadeiro", "Falso"],
          correta: 1,
          dica: "Ela tinha ideias que o SO resolveria depois, mas não um software para gerenciar a execução.",
          explicacao: "Falso. Havia só elementos conceituais (instruções, entrada e saída, processamento automático), não um sistema operacional."
        },
        {
          tipo: "conceito",
          titulo: "1ª e 2ª gerações",
          texto: `<p><b>1ª geração (1945–1955), válvulas e painéis:</b> máquinas enormes (o ENIAC ocupava 167 m² e tinha
            cerca de 18 mil válvulas), programadas ligando fios. <b>Não havia SO</b>: tudo era manual.
            No fim do período surgem os cartões perfurados e os primeiros <b>programas monitores</b>.</p>
            <p><b>2ª geração (1955–1965), transistores e lote:</b> computadores mais confiáveis, mas caros demais para
            ficar parados. Surge o <b>processamento em lote</b>: um IBM 1401 lia cartões para fita, a fita ia para o
            IBM 7094, que processava, e a saída voltava para o 1401 imprimir (o "passo duplo").</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O \"passo duplo\" entre o IBM 1401 e o IBM 7094 existia porque…",
          opcoes: [
            "o FORTRAN só rodava no 1401",
            "as máquinas de E/S e de processamento tinham velocidades muito diferentes",
            "o 7094 servia de cópia de segurança do 1401",
            "o 1401 era mais rápido que o 7094 para calcular"
          ],
          correta: 1,
          dica: "Ler cartões e imprimir é lento; calcular é rápido.",
          explicacao: "O 1401, mais barato, cuidava da E/S lenta (cartões e impressora); o 7094, caro e rápido, só processava as fitas, sem esperar pelos periféricos."
        },
        {
          tipo: "conceito",
          titulo: "3ª geração (1965–1980): a mais importante",
          texto: `<p>Com os circuitos integrados e famílias compatíveis como o IBM System/360, surgem os conceitos usados até hoje:</p>
            <ul>
              <li><b>Multiprogramação:</b> vários programas na memória; quando um espera E/S, o SO executa outro.</li>
              <li><b>Spooling:</b> o disco como intermediário entre a CPU e periféricos lentos (a fila de impressão).</li>
              <li><b>Time-sharing:</b> a CPU dividida em fatias de tempo entre usuários em terminais (CTSS, MULTICS).</li>
              <li><b>UNIX</b> (Thompson e Ritchie, Bell Labs): menor e mais simples que o MULTICS, base do Linux.</li>
            </ul>
            <p>O OS/360, com milhões de linhas, inspirou a <b>Lei de Brooks</b>: adicionar pessoas a um projeto atrasado o atrasa ainda mais.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual problema motivou a multiprogramação?",
          opcoes: [
            "A CPU ficava ociosa enquanto um programa esperava E/S",
            "Os programas eram grandes demais para a memória",
            "As válvulas queimavam com frequência",
            "Os usuários não tinham terminais próprios"
          ],
          correta: 0,
          dica: "Pense no que a CPU fazia enquanto o disco ou a fita respondiam.",
          explicacao: "Enquanto um programa esperava E/S, a CPU ficava parada. Com vários programas na memória, o SO passa a executar outro nesse intervalo."
        },
        {
          tipo: "multipla",
          pergunta: "Qual técnica usa o disco como intermediário entre a CPU e periféricos lentos, como na fila de impressão?",
          opcoes: ["Time-sharing", "Spooling", "Overlay", "Lote"],
          correta: 1,
          dica: "A sigla vem de Simultaneous Peripheral Operations On-Line.",
          explicacao: "Spooling: a saída é gravada em disco e enviada ao periférico depois, e a CPU não precisa esperar a impressora."
        },
        {
          tipo: "multipla",
          pergunta: "O que diz a Lei de Brooks?",
          opcoes: [
            "O número de transistores num chip dobra a cada dois anos",
            "Adicionar pessoas a um projeto de software atrasado o atrasa ainda mais",
            "Todo programa cresce até ocupar toda a memória disponível",
            "Um sistema em camadas é sempre mais lento que um monolítico"
          ],
          correta: 1,
          dica: "Fred Brooks escreveu sobre gerenciar o projeto do OS/360 no livro The Mythical Man-Month.",
          explicacao: "Em grandes equipes, coordenar é tão difícil quanto programar: mais gente num projeto atrasado gera mais comunicação e mais atraso. (A primeira opção é a Lei de Moore.)"
        },
        {
          tipo: "conceito",
          titulo: "4ª geração (1980 em diante): computadores pessoais",
          texto: `<p>Os chips baratearam e os computadores chegaram a quem não era especialista: os desafios passaram a envolver
            <b>usabilidade e mercado</b>.</p>
            <ul>
              <li><b>MS-DOS</b> (1981): interface de texto nos IBM PCs.</li>
              <li><b>Windows</b>: começou como interface gráfica sobre o MS-DOS; o <b>NT/2000/XP</b> trouxe 32 bits, segurança e multitarefa preemptiva.</li>
              <li><b>MINIX</b> (1987, Tanenbaum): SO didático inspirado no UNIX, que motivou o <b>Linux</b> (1991, Linus Torvalds).</li>
            </ul>
            <p>Multiprogramação, spooling e time-sharing foram herdados e refinados. A 5ª geração traz os dispositivos móveis e embarcados.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual sistema didático de Tanenbaum inspirou o início do Linux?",
          opcoes: ["MULTICS", "MINIX", "CTSS", "BSD"],
          correta: 1,
          dica: "Foi criado em 1987 para ensinar sistemas operacionais.",
          explicacao: "O MINIX (1987), inspirado na API do UNIX, foi o ponto de partida de Linus Torvalds em 1991."
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene as gerações de computadores, da mais antiga para a mais recente.",
          itens: [
            "Válvulas e painéis",
            "Transistores e lote",
            "Circuitos integrados e multiprogramação",
            "PCs e interfaces gráficas",
            "Móveis e embarcados"
          ],
          dica: "Do componente maior e menos confiável para o menor.",
          explicacao: "1ª válvulas (1945–1955) → 2ª transistores e lote (1955–1965) → 3ª CIs e multiprogramação (1965–1980) → 4ª PCs e GUI (1980–) → 5ª móveis e embarcados."
        }
      ]
    },

    // ---------------------------------------------------- FASE 1.3
    {
      id: "intro-3",
      etapa: "1.3",
      titulo: "Conceitos de SO",
      descricao: "Tipos, chamadas de sistema e estruturas",
      icone: "🧩",
      xv6: {
        titulo: "Uma chamada de sistema no xv6",
        arquivo: "user/usys.S e kernel/syscall.c",
        codigo: `# user/usys.S — o que roda quando um programa chama fork()
fork:
 li a7, SYS_fork      # número da chamada no registrador a7
 ecall                # trap: modo usuário -> modo núcleo
 ret

// kernel/syscall.c — já no modo núcleo
num = p->trapframe->a7;              // qual chamada foi pedida?
p->trapframe->a0 = syscalls[num]();  // executa e guarda o retorno`,
        texto: "A instrução <code>ecall</code> é o <i>trap</i>: o processador passa para o modo núcleo, o kernel descobre qual chamada foi pedida, executa e devolve o resultado ao programa, que volta ao modo usuário."
      },
      linux: {
        titulo: "Espiando as chamadas de sistema",
        comando: "strace -e trace=openat,read,write,close cat /etc/hostname",
        saida: `openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
close(3)                                = 0
openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
read(3, "\\177ELF\\2\\1\\1\\3\\0\\0\\0\\0\\0\\0\\0\\0\\3\\0>\\0\\1\\0\\0\\0"..., 832) = 832
close(3)                                = 0
openat(AT_FDCWD, "/etc/hostname", O_RDONLY) = 3
read(3, "kernelplay\\n", 131072)         = 11
write(1, "kernelplay\\n", 11kernelplay
)            = 11
read(3, "", 131072)                     = 0
close(3)                                = 0
+++ exited with 0 +++`,
        texto: "O <code>strace</code> mostra cada chamada de sistema que um programa faz. Até um simples <code>cat</code> abre arquivos (<code>openat</code>), lê (<code>read</code>), escreve na tela (<code>write</code>) e fecha (<code>close</code>): tudo pedido ao kernel."
      },
      man: [
        { termo: "máquina estendida", secao: "7", resumo: "o SO visto como abstração: esconde o hardware e oferece interfaces simples",
          detalhe: "Os programas usam arquivos, processos e janelas em vez de lidar com setores de disco, registradores de controladores e interrupções.",
          veja: ["gerenciador de recursos(7)", "sistema operacional(7)"] },
        { termo: "gerenciador de recursos", secao: "7", resumo: "o SO visto como quem organiza o uso de CPU, memória, dispositivos e arquivos",
          detalhe: "Decide quem usa cada recurso, quando e por quanto tempo, entre vários programas e usuários.",
          veja: ["máquina estendida(7)"] },
        { termo: "chamada de sistema", secao: "7", resumo: "pedido de um programa ao kernel por um serviço que exige privilégios",
          detalhe: "O programa prepara os parâmetros e executa uma instrução de trap (ecall, syscall, int 0x80): o processador passa ao modo núcleo, o kernel executa o serviço e retorna ao modo usuário. Categorias: processos, arquivos, dispositivos, informações e comunicação/proteção. O conjunto de chamadas forma a API do SO (POSIX, Win32).",
          exemplo: "strace ls",
          veja: ["modo núcleo(7)", "fork(2)"] },
        { termo: "modo núcleo", secao: "7", resumo: "nível privilegiado do processador, em que o kernel executa",
          detalhe: "Programas comuns rodam em modo usuário e não acessam o hardware diretamente. Isso garante segurança, estabilidade e proteção entre processos. No x86, os níveis são os anéis 0 (núcleo) a 3 (usuário).",
          veja: ["chamada de sistema(7)"] },
        { termo: "monolítico", secao: "7", resumo: "estrutura em que quase todo o SO roda no núcleo, com chamadas diretas entre componentes",
          detalhe: "Alto desempenho, mas um erro em qualquer componente pode derrubar o sistema inteiro. O Linux é monolítico e modular.",
          veja: ["micronúcleo(7)", "módulos(7)"] },
        { termo: "micronúcleo", secao: "7", resumo: "microkernel: só o essencial no núcleo; o resto em processos de usuário",
          detalhe: "Modular e confiável, mas a troca de mensagens e de contexto custa desempenho. O Windows NT começou assim e migrou para uma estrutura mais monolítica.",
          veja: ["monolítico(7)"] },
        { termo: "camadas", secao: "7", resumo: "SO organizado em níveis: cada camada usa a de baixo e serve a de cima",
          detalhe: "Facilita testes e manutenção, mas é difícil definir as camadas e cada chamada atravessa várias delas. Primeiro sistema: THE (Dijkstra, 1968).",
          veja: ["micronúcleo(7)"] },
        { termo: "módulos", secao: "7", resumo: "núcleo que carrega componentes extras na inicialização ou em execução",
          detalhe: "Usado no Linux, Solaris, macOS e Windows. Como o micronúcleo, tem um núcleo mínimo; mas os módulos se chamam diretamente, sem troca de mensagens, e por isso são mais eficientes.",
          exemplo: "lsmod",
          veja: ["monolítico(7)", "micronúcleo(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "O que é um sistema operacional?",
          texto: `<p class="destaque">"Se dois SOs executam os mesmos aplicativos, acessam arquivos e controlam memória, por que podem ser tão diferentes por dentro?"</p>
            <p>Um sistema de computação tem quatro componentes: <b>hardware</b>, <b>sistema operacional</b>,
            <b>programas</b> e <b>usuários</b>. O SO é o intermediário entre eles, e há duas formas de enxergá-lo:</p>
            <ul>
              <li>🖥 <b>Máquina estendida</b>: esconde os detalhes do hardware e oferece abstrações simples.</li>
              <li>📦 <b>Gerenciador de recursos</b>: organiza o uso de CPU, memória, dispositivos e arquivos.</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "Quais são as duas grandes perspectivas sobre o que um SO faz?",
          opcoes: [
            "Máquina estendida e gerenciador de recursos",
            "Compilador e interpretador",
            "Shell e interface gráfica",
            "Kernel e driver"
          ],
          correta: 0,
          dica: "Uma olha para os programas (abstração); a outra, para o hardware (recursos).",
          explicacao: "Como máquina estendida, o SO abstrai o hardware; como gerenciador de recursos, organiza quem usa CPU, memória, dispositivos e arquivos."
        },
        {
          tipo: "conceito",
          titulo: "Um zoológico de sistemas operacionais",
          texto: `<p>Cada tipo de SO resolve problemas de um contexto:</p>
            <ul>
              <li><b>Grande porte</b> (mainframes): muita E/S e transações. Ex.: IBM z/OS.</li>
              <li><b>Servidores</b>: muitos usuários pela rede, alta disponibilidade. Ex.: Ubuntu Server.</li>
              <li><b>Computadores pessoais</b>: desempenho, usabilidade e compatibilidade. Ex.: Windows, macOS.</li>
              <li><b>Móveis</b>: toque, energia, sensores, permissões. Ex.: Android, iOS.</li>
              <li><b>Embarcados</b>: função específica dentro de um equipamento (carros, roteadores).</li>
              <li><b>Tempo real</b>: precisam responder dentro de <b>prazos definidos</b> (aviônica, equipamentos médicos).</li>
            </ul>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada sistema ao seu tipo.",
          pares: [
            ["IBM z/OS", "Grande porte"],
            ["Android", "Dispositivo móvel"],
            ["Controlador do freio ABS", "Tempo real / embarcado"],
            ["Ubuntu Server", "Servidor"]
          ],
          dica: "Um deles precisa reagir em milissegundos, ou o carro não freia.",
          explicacao: "z/OS roda em mainframes; Android em celulares; o ABS é um sistema embarcado de tempo real (o prazo é crítico); o Ubuntu Server atende a rede."
        },
        {
          tipo: "conceito",
          titulo: "Chamadas de sistema",
          texto: `<p>Programas comuns <b>não acessam o hardware diretamente</b>: isso garante segurança, estabilidade,
            proteção entre processos e controle de permissões. Para pedir algo privilegiado (criar processo, abrir arquivo,
            usar um dispositivo), eles fazem uma <b>chamada de sistema</b>, a porta de entrada para os serviços do kernel.</p>
            <p>Categorias: controle de processos, manipulação de arquivos, manipulação de dispositivos,
            manutenção de informações e comunicação/proteção.</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene o que acontece numa chamada de sistema.",
          itens: [
            "O processador passa do modo usuário para o modo núcleo",
            "O contexto do programa é salvo",
            "O kernel executa a chamada com privilégios",
            "O contexto é restaurado e o programa volta ao modo usuário"
          ],
          dica: "Primeiro é preciso entrar no kernel; o último passo é sair dele.",
          explicacao: "Trap para o modo núcleo → salvar o contexto → executar o serviço → restaurar o contexto e retornar ao modo usuário."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No laboratório, com um breakpoint em syscall() no gdb, o comando bt mostrou quem chamou syscall(). Quem foi?",
          opcoes: ["main(), do programa de usuário", "usertrap(), em kernel/trap.c", "exec()", "O shell (sh)"],
          correta: 1,
          dica: "O ecall é um trap: o processador entra no kernel pelo tratador de traps.",
          explicacao: "Quando o programa executa ecall, o processador passa ao modo núcleo e entra em usertrap(); ela vê que a causa é uma chamada de sistema e chama syscall()."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No mesmo exercício, p->trapframe->a7 valia 7. O que isso indica?",
          contexto: `// kernel/syscall.h
#define SYS_fork    1
#define SYS_exit    2
#define SYS_wait    3
#define SYS_pipe    4
#define SYS_read    5
#define SYS_kill    6
#define SYS_exec    7`,
          opcoes: [
            "Que o processo tem PID 7",
            "Que a chamada pedida é a número 7: SYS_exec",
            "Que já houve 7 chamadas de sistema",
            "Que o trap aconteceu na CPU 7"
          ],
          correta: 1,
          dica: "O programa coloca o número da chamada em a7 antes do ecall.",
          explicacao: "O stub em usys.S faz li a7, SYS_xxx; o kernel lê a7 para saber qual chamada executar. 7 é SYS_exec: era o init executando o shell."
        },
        {
          tipo: "multipla",
          pergunta: "Em que categoria entra a chamada \"alterar as permissões de um arquivo\"?",
          opcoes: ["Controle de processos", "Manutenção de informações", "Manipulação de dispositivos", "Comunicação e proteção"],
          correta: 3,
          dica: "Permissões decidem quem pode acessar o quê.",
          explicacao: "Alterar permissões é uma operação de proteção, classificada em comunicação e proteção."
        },
        {
          tipo: "conceito",
          titulo: "Estruturas de sistemas operacionais",
          texto: `<ul>
              <li><b>Simples</b>: sem divisão clara em módulos (MS-DOS).</li>
              <li><b>Camadas</b>: cada nível usa o de baixo e serve o de cima (THE, Dijkstra, 1968).</li>
              <li><b>Micronúcleo</b>: só o essencial no kernel; serviços em modo usuário, conversando por <b>mensagens</b>.</li>
              <li><b>Monolítica</b>: quase tudo no núcleo, com chamadas diretas; rápida, mas um erro derruba tudo.</li>
              <li><b>Módulos</b>: núcleo mínimo que carrega módulos, que se chamam diretamente (Linux, Windows, macOS).</li>
              <li><b>Híbridos</b>: a maioria dos SOs reais mistura estruturas.</li>
            </ul>
            <p>Cada arquitetura busca um equilíbrio diferente entre <b>controle, desempenho, segurança e flexibilidade</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual estrutura mantém no kernel apenas o essencial e usa troca de mensagens?",
          opcoes: ["Monolítica", "Micronúcleo", "Camadas", "Estrutura simples"],
          correta: 1,
          dica: "O nome já diz o tamanho do núcleo.",
          explicacao: "No micronúcleo (microkernel), serviços como sistema de arquivos e drivers rodam fora do kernel e se comunicam por mensagens."
        },
        {
          tipo: "multipla",
          pergunta: "Por que o Windows NT migrou de microkernel para algo mais monolítico?",
          opcoes: [
            "Por segurança: o microkernel era fácil de invadir",
            "Por desempenho: o custo da troca de mensagens deixava o sistema lento",
            "Para rodar programas do MS-DOS",
            "Porque o microkernel não suportava interface gráfica"
          ],
          correta: 1,
          dica: "Compare o NT com o Windows 95, da mesma época.",
          explicacao: "O overhead de mensagens e trocas de contexto deixava o NT lento; no NT 4.0, camadas foram movidas para o kernel."
        },
        {
          tipo: "multipla",
          pergunta: "Qual foi o primeiro sistema em camadas e quem o criou?",
          opcoes: ["UNIX, de Thompson e Ritchie", "THE, de Dijkstra (1968)", "MULTICS, do MIT", "MINIX, de Tanenbaum"],
          correta: 1,
          dica: "O nome é a sigla da universidade de Eindhoven, na Holanda.",
          explicacao: "O THE (Technische Hogeschool Eindhoven), de Edsger Dijkstra, em 1968, foi o primeiro sistema organizado em camadas."
        },
        {
          tipo: "multipla",
          pergunta: "Qual a diferença entre um núcleo com módulos e um micronúcleo?",
          opcoes: [
            "Módulos não podem ser carregados com o sistema rodando",
            "Ambos têm núcleo mínimo, mas os módulos se chamam diretamente, sem mensagens, e são mais eficientes",
            "O micronúcleo coloca tudo dentro do kernel",
            "Não há diferença"
          ],
          correta: 1,
          dica: "Os dois começam de um núcleo pequeno. A diferença está em como as partes conversam.",
          explicacao: "Os módulos rodam no espaço do kernel e se chamam diretamente; no micronúcleo, os serviços trocam mensagens, o que custa desempenho."
        }
      ]
    }
  ]
});
