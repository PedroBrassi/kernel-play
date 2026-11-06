# Trilha 1 — Introdução aos Sistemas Operacionais

> **Origem:** pasta `Introdução` (Aulas 1, 2 e 3 — Prof. Romário da Silva Borges, UNIFAL-MG)
> **Livro de referência:** MAZIERO, Carlos A. *Sistemas Operacionais: Conceitos e Mecanismos*. Curitiba: DINF/UFPR, 2019 — Parte I (caps. 1 a 3, p. 1–38).
> Referências complementares citadas nos slides: TANENBAUM & BOS, *Sistemas Operacionais Modernos*, 4ª ed. (Pearson, 2016); SILBERSCHATZ, GALVIN & GAGNE, *Fundamentos de Sistemas Operacionais*, 9ª ed. (LTC, 2015).

**Estrutura da trilha (fases do jogo)**

| Fase | Aula | Tema | Livro (Maziero) |
|---|---|---|---|
| 1.1 | Aula 1 | Apresentação: por que estudar SO | Prefácio; cap. 1 (p. 2–8) |
| 1.2 | Aula 2 | História dos Sistemas Operacionais | cap. 1, seção 1.4 (p. 9–12); cap. 4, seção 4.3 (p. 42–47) |
| 1.3 | Aula 3 | Conceitos, tipos, chamadas de sistema e estruturas | caps. 1, 2 e 3 (p. 2–38) |

---

## Fase 1.1 — Por que aprender Sistemas Operacionais?

**Pergunta-guia (desafio de abertura):**
> "Se o computador tem processador, memória e disco, por que ainda precisamos de um sistema operacional?"

Essa pergunta guia toda a disciplina. A resposta revela camadas de complexidade por trás de cada clique, cada processo e cada arquivo. SO é uma das disciplinas mais fundamentais da computação: nela se entende como o software conversa com o hardware — e por que isso importa para tudo o que se constrói na carreira.

### Expectativa × realidade
- **Expectativa:** notícia do *GenesisOS* — "Brasileiro de apenas 12 anos cria sistema operacional gráfico do zero, sem usar Linux como base". Projeto educacional de código aberto, SO de 32 bits escrito em C e Assembly x86, interface inspirada no Windows XP/Vista, com janelas arredondadas e quatro docks independentes que podem ser arrastados.
- **Realidade — o que a disciplina NÃO é:**
  - ❌ Treinamento de comandos (não é curso de terminal Linux nem de linha de comando Windows);
  - ❌ Configuração de sistemas (não se configuram servidores, nem se instalam distribuições ou ajustam ambientes);
  - ❌ Administração de TI (administrar redes, usuários e permissões está fora do escopo).
- **O que também NÃO será exigido:** desenvolver um SO completo do zero; dominar o código-fonte do Linux, Windows ou macOS; ser especialista em Assembly ou drivers de hardware.
- **Foco:** a compreensão dos **mecanismos**, não a implementação industrial.

### Do que a disciplina trata
Conceitos, estruturas e mecanismos que permitem o funcionamento dos SOs — como eles **gerenciam recursos**, **abstraem o hardware** e **oferecem serviços** aos programas.

**Ementa / estrutura do conteúdo**
1. **Introdução aos SOs** — conceitos, história e estrutura.
   Definição e papéis do SO; breve história (dos mainframes aos smartphones); conceitos fundamentais e terminologia; chamadas de sistema (*system calls*); estruturas internas do SO.
2. **Gerenciamento de Processos** — modelo, comunicação, escalonamento e deadlocks.
   Processos e threads (estados, PCB, criação e término); comunicação entre processos (IPC, pipes, memória compartilhada e sinais); problemas clássicos (produtor-consumidor, leitores-escritores, jantar dos filósofos); escalonamento (FCFS, SJF, Round Robin, prioridades e algoritmos modernos); deadlocks (conceito, detecção, recuperação e prevenção).
3. **Gerência de Memória** — gerência básica, troca de processos, memória virtual e desempenho. "A memória é o recurso mais disputado do sistema."
4. **Sistemas de Arquivos** — conceito de arquivo e metadados; estrutura de diretórios e caminhos; métodos de acesso e alocação; gerenciamento do espaço em disco.
5. **Dispositivos e Entrada/Saída** — tipos de hardware e controladores; registradores e interfaces de controle; drivers de dispositivo; E/S independente do dispositivo. ("A ponte entre o mundo físico e o software.")

**Metodologia:** aulas expositivas, exercícios, discussões e atividades práticas em laboratório.
**Avaliação:** P1 (30%), P2 (30%), atividades e trabalhos práticos (40%).

**Recapitulando:** a disciplina não é treinamento de comandos, configuração de sistemas nem desenvolvimento de um SO completo; estuda introdução e estrutura dos SOs, sistemas de arquivos e processos, deadlocks, memória e dispositivos — conceitos e mecanismos que formam a base de toda a computação moderna.

> 📖 **Livro:** Maziero, Prefácio (importância de conhecer SOs para todo profissional de computação) e cap. 1 (p. 2–8). Partes do livro correspondentes às unidades: Parte II–III (processos), Parte IV (memória), Parte V (E/S), Parte VI (arquivos).

### Desafios da fase 1.1
1. **Qual destes itens faz parte do foco da disciplina?**
   a) Instalar distribuições Linux · b) Administrar usuários de rede · **c) Compreender os mecanismos pelos quais o SO gerencia recursos** · d) Dominar o código-fonte do Windows
   *Explicação:* o foco é a compreensão dos mecanismos, não treinamento de comandos nem administração de TI.
2. **Qual é a pergunta que guia a disciplina?** → "Se o computador tem processador, memória e disco, por que ainda precisamos de um SO?"
3. **Qual unidade estuda "gerência, troca e memória virtual"?** → Gerenciamento de Memória.

---

## Fase 1.2 — Um pouco de história

**Pergunta-guia:**
> "Se hoje conseguimos abrir vários programas ao mesmo tempo, imprimir documentos, navegar na internet e salvar arquivos sem entender o hardware… em que momento da história surgiu a necessidade de um sistema operacional?"

**Roteiro:** 01 Primeiras máquinas (Babbage e Ada Lovelace) → 02 1ª geração (válvulas e painéis) → 03 2ª geração (transistores e lote) → 04 3ª geração (CIs e multiprogramação) → 05 4ª geração (PCs e SOs modernos) → 06 Legado.

### Por que olhar para o passado?
- **SOs não surgiram prontos:** cada geração resolveu problemas específicos de sua época, de forma incremental.
- **Conceitos antigos, uso atual:** muitos mecanismos modernos têm raízes em sistemas criados décadas atrás.
- **Hardware guia o software:** a evolução do hardware criou novas exigências para o SO.
- **Compreender o porquê:** a história explica por que os SOs são como são hoje.

### Antes do sistema operacional
A computação era direta e manual: o usuário interagia quase diretamente com a máquina; a programação dependia fortemente do hardware específico; tarefas diferentes exigiam reconfigurações manuais; não havia abstrações como arquivos, processos ou permissões. **O SO surge justamente para reduzir essa complexidade.**

### Século XIX — Charles Babbage e a automação dos cálculos
Havia grande demanda por cálculos precisos (navegação, engenharia, pesquisa científica). Babbage idealizou máquinas capazes de calcular automaticamente, especialmente para construir tabelas matemáticas, eliminando erros humanos frequentes.

**Máquina diferencial (1834–1871):** resolvia cálculos baseados em diferenças entre números, gerando tabelas com precisão e rapidez. Já continha ideias essenciais dos computadores modernos:
- **Entrada** (dados inseridos manualmente) → **Processamento** (cálculo automático) → **Armazenamento** (resultados intermediários) → **Saída** (impressão de tabelas).

**Do problema ao resultado:** Problema (situação real) → Algoritmo (procedimento lógico) → Programa (implementação) → Processa (execução) → Resultado. Esse fluxo conceitual continua o mesmo nos computadores atuais — as tecnologias mudaram, a lógica fundamental permanece.

**O que a máquina diferencial representou:** computação automática (cálculos sem intervenção humana constante); inovação sob demanda (nasceu de necessidade real do séc. XIX); base conceitual (ideia de máquinas programáveis).

**Máquina analítica (proposta em 1837):** máquina de uso geral e programável; executaria qualquer tipo de cálculo; possuía unidade aritmética, memória e controle; inspiração direta do conceito moderno de computador; **nunca foi plenamente construída** (limitações técnicas, financeiras e políticas). *(O slide traz "1837–1991"; 1991 é o ano em que o Museu de Ciência de Londres concluiu a construção da Máquina Diferencial nº 2 a partir dos projetos de Babbage.)*

**Ada Lovelace — a ideia de programação:** uma máquina programável precisaria de instruções organizadas. Ada foi uma das primeiras pessoas a compreender o potencial da programação — além dos cálculos, a máquina poderia manipular **qualquer símbolo**. É frequentemente chamada de **primeira programadora da história**.

**Essas máquinas tinham SO? Não.** Mas já havia elementos conceituais: 1) máquina programável com instruções; 2) entrada e saída de dados; 3) processamento automático; 4) necessidade de organizar a execução — os problemas que os SOs viriam a resolver.

### A evolução por gerações (Tanenbaum)
| Geração | Período | Marca |
|---|---|---|
| 1ª | 1945–1955 | Válvulas, painéis, sem SO |
| 2ª | 1955–1965 | Transistores, sistemas em lote |
| 3ª | 1965–1980 | Circuitos integrados, multiprogramação, UNIX |
| 4ª | 1980–hoje | PCs, interfaces gráficas |
| 5ª | — | Computadores móveis e embarcados |

### 1ª geração (1945–1955): válvulas e painéis
- **Hardware:** válvulas termiônicas — grandes, caras e pouco confiáveis.
- **Programação:** linguagem de máquina e painéis de conectores físicos.
- **SO:** praticamente inexistente — operação completamente manual.

**Máquinas pioneiras:** Z3 (Konrad Zuse, Alemanha, 1941 — primeiro computador eletromecânico programável); Colossus (Inglaterra — decifrar códigos nazistas na 2ª Guerra); Mark I (Harvard, com a IBM, 1944 — eletromecânico); ENIAC (Penn — um dos primeiros computadores eletrônicos de uso geral dos EUA).

**ENIAC:** criado na 2ª Guerra para cálculos de trajetórias balísticas; ocupava 167 m²; ~18.000 válvulas; consumo de 150 kW; programado por conexões físicas e chaves; falhas frequentes por queima de válvulas.

**Quando programar era ligar fios:** 1) Planejar (algoritmo no papel) → 2) Configurar (reconectar cabos e painéis) → 3) Executar (ligar e aguardar) → 4) Torcer (para nenhuma válvula queimar). Programar hoje é resultado de décadas de abstração sobre esse processo.

**O problema da interação direta com o hardware:** conhecimento profundo do hardware; preparação manual de cada tarefa; execução lenta e sujeita a falhas; sem gerenciamento automático de recursos; sem proteção entre programas — exatamente o que os SOs vieram resolver.

**Início dos anos 1950 — cartões perfurados:** programas registrados e reutilizáveis; menos reconfiguração por cabos; E/S mais organizada; abriu caminho para o processamento em lote.

**Primeiros programas monitores** (*monitors* ou *directors*): carregar programas na memória; iniciar jobs; organizar a passagem de uma tarefa para outra; reduzir a intervenção manual do operador; apoiar o uso de cartões, fitas e impressoras.

**1955 — Director e Whirlwind I (MIT):** antes, a troca de tarefas exigia intervenção manual; o Director usava fitas magnéticas com instruções predefinidas, e o Whirlwind I executava tarefas automaticamente, uma após a outra — antecipando o processamento em lote. Marca a transição entre operação manual e controle automatizado.

**Limitações que levaram à transição:** baixa confiabilidade (válvulas queimavam), alto custo, grande porte (salas inteiras) e tempo ocioso entre tarefas.

### 2ª geração (1955–1965): transistores e sistemas em lote
- **Transistores** substituem válvulas: ~90% menores, ~10× mais confiáveis, ~95% menos consumo; computadores deixam de exigir salas climatizadas especiais → comercialização em larga escala (empresas, governos, universidades).
- **Especialização de papéis:** projetista, construtor, operador, manutenção e programador.
- **Computadores caros não podiam ficar parados.** Causas de CPU ociosa: operador preparando a próxima tarefa; leitura lenta de cartões; espera por fitas; impressão lenta; CPU aguardando E/S. Esse desperdício motivou os **sistemas em lote**.

**Processamento em lote (batch):** processar dados em grandes grupos, e não em tempo real; reunir várias tarefas e processá-las sequencialmente sem interrupções manuais.

**Fluxo clássico (Tanenbaum) com duas máquinas:** programador escreve o programa → cartões são perfurados → **IBM 1401** lê cartões e grava fita → fita é levada ao **IBM 7094**, que processa → (saída gravada em fita e impressa no 1401). O "passo duplo" existia porque as duas máquinas operavam em velocidades muito diferentes.

**Já havia SO?** Ainda não plenamente, mas surgiram: filas de jobs, programas monitores de execução, controle automatizado entre tarefas e automação parcial. Exemplo: **Fortran Monitor System (FMS)**, um dos primeiros monitores de lote.

**FORTRAN (IBM, 1954–1957):** uma das primeiras linguagens de alto nível amplamente usadas; primeira linguagem imperativa divulgada; reduziu a dependência da linguagem de máquina; compilador otimizado (os autores achavam que ninguém a usaria se o desempenho não se comparasse ao Assembly).

**O que o lote não resolvia:** sem interatividade; erros percebidos só após horas ou dias; CPU ociosa durante E/S; sem tempo real.

### 3ª geração (1965–1980): circuitos integrados
A geração mais importante para os conceitos usados até hoje: circuitos integrados (mais poder, menos espaço e custo); famílias de máquinas compatíveis (IBM System/360); multiprogramação; time-sharing; sistemas influentes (OS/360, CTSS, MULTICS, UNIX).

**IBM System/360 (1964):** unificou linhas diferentes de computadores em uma família compatível — modelos de desempenho diferentes, **mesmo conjunto de instruções**; usos científicos e comerciais; software de um modelo rodava nos demais; exigiu um SO que funcionasse em todos.

**OS/360 e a complexidade:** milhões de linhas de código, centenas de programadores; bugs em cascata (cada correção introduzia novos problemas); gestão quase impossível.
**Lições (Fred Brooks, *The Mythical Man-Month*, 1975):** **Lei de Brooks** — adicionar pessoas a um projeto atrasado o atrasa ainda mais; em grandes equipes, coordenar é tão difícil quanto programar; corrigir um erro pode introduzir outro.

**Multiprogramação (conceito central):**
- *Problema:* enquanto um programa esperava E/S, a CPU ficava ociosa.
- *Solução:* manter **vários programas na memória**; quando um bloqueia, o SO executa outro.
- *Resultado:* melhor aproveitamento da CPU, redução drástica da ociosidade, base dos sistemas multitarefa modernos.
- A memória é dividida em **partições**, cada uma com um programa. Surgem as questões que formam o núcleo da disciplina: quem usa a CPU? Como proteger um programa do outro? Quem decide o próximo a executar?

**Spooling** (*Simultaneous Peripheral Operations On-Line*): usar o disco como área intermediária entre CPU e periféricos lentos — jobs lidos para o disco antecipadamente; CPU processa sem esperar entrada direta; saída gravada em disco e enviada ao periférico depois; filas de entrada e saída automáticas. A **fila de impressão** usa exatamente esse princípio.

**Compartilhamento de tempo (timesharing):** cada usuário com seu terminal; o processador é dividido em fatias de milissegundos; **pseudoparalelismo** (sensação de uso simultâneo com uma única CPU); interatividade com resposta rápida.

**CTSS — Compatible Time-Sharing System (MIT, 1961):** um dos primeiros sistemas de tempo compartilhado bem-sucedidos (John McCarthy e Fernando Corbató); influenciou o MULTICS e, por extensão, o UNIX; mostrou que o computador podia ser um recurso compartilhado.

**MULTICS (MIT, Bell Labs e General Electric):** objetivos (Corbató e Vyssotsky, 1965): uso remoto e conveniente de terminais; grande variedade de configurações alteradas de forma transparente; sistema de arquivos de alta confiança; compartilhamento seletivo de informação; estruturas hierárquicas de informação; suporte a várias aplicações, ambientes de programação e interfaces. Muito avançado, porém grande, complexo e dependente de mainframes caros — **seu legado foi mais forte que sua adoção prática**.

**UNIX (fim dos anos 1960, Bell Labs — Ken Thompson e Dennis Ritchie):** menor e mais simples que o MULTICS; associado a minicomputadores; multiusuário; forte relação com programação e ferramentas de desenvolvimento; enorme influência histórica.

**Filosofia UNIX** (e o Linux, de Linus Torvalds, sistema *UNIX-like*: construído do zero, mas seguindo princípios e interfaces do UNIX):
- multiusuário e multitarefa;
- **"tudo é um arquivo"** (dispositivos, pipes e sockets tratados como arquivos);
- sistema de arquivos hierárquico (/bin, /etc, /home);
- shell e linha de comando (controle granular e automação via scripts);
- utilitários pequenos e combináveis (grep, sort, awk encadeados por pipes);
- compatibilidade **POSIX** (portabilidade).

**Sistemas UNIX-like:** **BSD** (Universidade da Califórnia, Berkeley, a partir do código do UNIX da AT&T; desde 1977); **Solaris** (Sun Microsystems, início dos anos 1990, sucessor do SunOS; robusto e escalável em servidores); **FreeBSD** (1993, derivado do 386BSD/4.3BSD Net/2; muito usado em servidores, embarcados e desktops).

### 4ª geração (1980 em diante): computadores pessoais
Chips com milhares de transistores; preço cai de milhões para milhares de dólares; computadores chegam a não especialistas → necessidade de sistemas simples, acessíveis e com interfaces amigáveis. Os desafios passam a envolver **usabilidade e mercado**. MS-DOS, Mac OS e Windows popularizam os SOs; a internet amplia a transformação. Multiprogramação, spooling e time-sharing são herdados e refinados.

**MS-DOS (Microsoft, 1981):** usado nos IBM PCs e compatíveis; interface de comandos de texto; simples e limitado pelo hardware da época; essencial na popularização dos PCs; versões posteriores incorporaram recursos do UNIX.

**Windows:** começou como interface gráfica (GUI) sobre o MS-DOS.
- Windows 3.x — GUI inicial sobre o MS-DOS;
- Windows 95/98/Me — usabilidade, *plug-and-play* e internet;
- **Windows NT/2000/XP** — arquitetura robusta de 32 bits, segurança, estabilidade e **multitarefa preemptiva** (divisor de águas);
- Windows moderno — evolução contínua e ecossistema integrado.

**Do MINIX ao Linux:** 1987 — Andrew Tanenbaum cria o **MINIX**, SO didático inspirado na API do UNIX; 1991 — **Linus Torvalds** inicia o Linux como núcleo; desenvolvimento comunitário global; hoje é base de servidores, desktops, embarcados e Android (inspirado no UNIX, mas com código próprio).

### Síntese
- **Babbage/Ada:** ideias de computação e programação — sem SO.
- **1ª geração:** válvulas, painéis, operação manual.
- **2ª geração:** transistores, lote, monitores de job.
- **3ª geração:** multiprogramação, spooling, time-sharing, UNIX.
- **4ª geração:** PCs, interfaces gráficas, SOs modernos.
Muitos conceitos antigos permanecem — reconhecê-los é a base para compreender os SOs modernos.

**Dicas de filmes/documentários:** *Revolution OS*; *The Code: Story of Linux*; *Piratas do Vale do Silício* (*Pirates of Silicon Valley*).

> 📖 **Livro:** Maziero, cap. 1, seção 1.4 "Um breve histórico dos SOs" (p. 9–12); cap. 4, seção 4.3 (p. 42–47) — sistemas monotarefa, **monitor de sistema**, sistemas multitarefa e de **tempo compartilhado** (mesmos conceitos de lote, monitor, multiprogramação e time-sharing desta fase). A divisão por gerações segue Tanenbaum & Bos, cap. 1.

### Desafios da fase 1.2
1. **Qual técnica usa o disco como intermediário entre a CPU e periféricos lentos (como na fila de impressão)?** a) Time-sharing · **b) Spooling** · c) Overlay · d) Lote
2. **Qual problema motivou a multiprogramação?** → A CPU ficava ociosa enquanto um programa esperava E/S.
3. **Ordene as gerações:** válvulas → transistores/lote → CIs/multiprogramação → PCs/GUI → móveis/embarcados.
4. **Verdadeiro ou falso:** "A máquina analítica de Babbage tinha um sistema operacional rudimentar." → **Falso.** Tinha apenas elementos conceituais (instruções, E/S, processamento automático).
5. **O que diz a Lei de Brooks?** → Adicionar pessoas a um projeto de software atrasado o atrasa ainda mais.
6. **Qual sistema didático de Tanenbaum inspirou o início do Linux?** → MINIX (1987).
7. **O "passo duplo" 1401/7094 existia porque…** → as máquinas de E/S e de processamento tinham velocidades muito diferentes.

---

## Fase 1.3 — Conceitos de Sistemas Operacionais

**Pergunta-guia:**
> "Se dois sistemas operacionais executam os mesmos aplicativos básicos, acessam arquivos e controlam memória, por que eles podem ser tão diferentes por dentro?"

**Roteiro:** 1) diferentes tipos de SO e contextos de uso; 2) conceitos fundamentais (processos, arquivos, proteção, chamadas de sistema); 3) chamadas de sistema (API, biblioteca e kernel); 4) estruturas de SOs.

### Um sistema de computação
Quatro componentes essenciais: **hardware**, **sistema operacional**, **programas** e **usuários**. O SO é o componente central que gerencia os recursos.

### O que é um SO?
1. Intermediário entre usuário, programas e hardware;
2. objetivo: permitir que programas executem de forma **conveniente e eficiente**;
3. funciona como **gerenciador de recursos**;
4. deve garantir operação **correta, segura e organizada** do sistema.

**Duas perspectivas:**
- 🖥 **Máquina estendida (abstração):** esconde detalhes complexos do hardware e oferece abstrações mais simples aos programas.
- 📦 **Gerenciador de recursos:** controla CPU, memória, dispositivos e arquivos, organizando seu uso entre programas e usuários.
Os SOs fornecem **serviços** aos programas e usuários; esses serviços variam de SO para SO.

**Imagine se** cada programador tivesse de se preocupar com o funcionamento das unidades de disco (e as dúzias de coisas que podem dar errado ao ler um bloco), com todos os outros processos rodando simultaneamente e com o modelo do processador… A solução histórica foi "colocar uma camada de software por cima do hardware básico para gerenciar todas as partes do sistema" (Tanenbaum).

**Por que estudar SO?** Ajuda a utilizar, programar e projetar aplicações **eficazes** e **eficientes**. É multidisciplinar: combina conceitos de praticamente todas as áreas da computação.

> 📖 **Maziero, cap. 1 (p. 2–5):** objetivos do SO — *abstração de recursos* (p. 3) e *gerência de recursos* (p. 4). Funcionalidades (seção 1.2, p. 5): gerência do processador, da memória, dos dispositivos, de arquivos e de proteção.

### Conceitos fundamentais
| Conceito | Ideia |
|---|---|
| **Processos** | Unidade básica de execução no sistema |
| **Espaços de endereçamento** | Região de memória de cada processo |
| **Arquivos** | Abstração de armazenamento persistente |
| **Entrada e saída** | Comunicação com periféricos e dispositivos |
| **Proteção e chamadas de sistema** | Segurança e interface com o kernel |

### Tipos de sistemas operacionais
Existem muitos tipos porque existem muitos computadores e contextos: o SO de um servidor bancário não tem as mesmas prioridades de um smartphone, de um embarcado ou de um cartão inteligente. **Ideia central: cada tipo de SO é projetado para resolver problemas específicos.**

- **Grande porte (mainframes):** grande capacidade de E/S, muitos jobs, lote, processamento de transações, tempo compartilhado. Usos: bancos, companhias aéreas, grandes sistemas corporativos, comércio eletrônico em larga escala. Ex.: **IBM z/OS** (64 bits).
- **Servidores:** serviços a muitos usuários/máquinas pela rede (páginas web, bancos de dados, arquivos, autenticação, aplicações corporativas). Características: alta disponibilidade, segurança, gerenciamento de usuários, uso eficiente de CPU, memória, disco e rede. Ex.: Ubuntu Server.
- **Computadores pessoais:** uso individual; equilíbrio entre desempenho, usabilidade (interface gráfica amigável) e compatibilidade (aplicativos e dispositivos). Ex.: Windows, macOS, Linux desktop.
- **Dispositivos móveis:** toque, economia de energia, sensores, conexão sem fio, controle de permissões, isolamento entre apps, loja de aplicativos. Ex.: Android, iOS.
- **Embarcados:** executam dentro de dispositivos específicos, com função bem definida (carros, eletrodomésticos, roteadores, equipamentos industriais).
- **Tempo real:** controle industrial, aviônica, equipamentos médicos, automação; precisam responder dentro de **prazos definidos** (o tempo é parâmetro-chave). Nem todo SO interage diretamente com o usuário — alguns operam quase invisíveis.
- **Outras categorias ("zoológico" dos SOs):** nós sensores (recursos extremamente limitados); cartões inteligentes (CPU própria, memória restrita, alta segurança); sistemas distribuídos (várias máquinas como um sistema coeso); dispositivos especializados.
"Quanto mais diverso o hardware e o contexto de uso, mais diverso será o projeto do SO."

> 📖 **Maziero, cap. 1, seção 1.3 "Categorias" (p. 7–9):** batch, de rede, distribuído, multiusuário, desktop, servidor, embarcado, tempo real (*soft* e *hard*).

### Chamadas de sistema (system calls)
Rotina que permite a um aplicativo de usuário solicitar ações que exigem **privilégios especiais**; são a **porta de entrada para os serviços do kernel** e uma das formas de ampliar as funções do kernel. Permitem: (1) criar processos e gerenciar execução; (2) abrir, ler e escrever arquivos; (3) acessar dispositivos e obter informações; (4) encerrar programas.

**Por que não acessar o hardware diretamente?**
- 🔐 **Segurança** — impede que programas maliciosos comprometam o sistema;
- 🛡 **Estabilidade** — falha de um programa não derruba o sistema;
- 🔒 **Proteção entre processos** — um processo não interfere nos dados de outro;
- 📋 **Controle de permissões** — organiza quem pode acessar o quê.

**Troca de contexto em uma chamada de sistema:**
1. **Modo usuário → modo núcleo:** o processador passa do estado não privilegiado ao privilegiado;
2. **Salvamento de contexto** do programa de usuário;
3. **Execução da chamada** pelo kernel com permissões elevadas;
4. **Retorno ao modo usuário**, restaurando o contexto.

**Categorias:**
- ⚙ Controle de processos — criar processo, encerrar, aguardar evento;
- 📁 Manipulação de arquivos — abrir, fechar, ler, escrever, renomear;
- 🖨 Manipulação de dispositivos — ler/escrever em dispositivos;
- ℹ Manutenção de informações — hora do sistema, dados de processos e recursos;
- 💬 Comunicação e proteção — enviar mensagens, criar canais, alterar permissões.

> 📖 **Maziero, cap. 2 (p. 13–26):** elementos do SO (núcleo, drivers, código de inicialização, programas utilitários — seção 2.1); elementos de hardware: **interrupções e exceções** (p. 17), **níveis de privilégio** (núcleo × usuário, anéis 0–3 do x86, p. 20); **chamadas de sistema** (seção 2.3, p. 21): a aplicação prepara os parâmetros, executa uma instrução de *trap* (ex.: `int 0x80`/`syscall`), o processador muda para o nível núcleo, o núcleo executa a rotina e retorna. Conjunto de chamadas = **API do SO** (ex.: POSIX, Win32).

### Estruturas de sistemas operacionais
A estrutura interna define: como os componentes se organizam; onde os serviços executam (no kernel ou fora); como os módulos se comunicam; quão fácil é manter, atualizar e depurar; quão seguro e eficiente o sistema pode ser.

- **Estrutura simples:** sistemas sem estrutura bem definida, que começam pequenos e crescem além do escopo original. **MS-DOS**: projetado por poucas pessoas, sem imaginar a popularidade; máximo de funcionalidade no menor espaço, sem divisão cuidadosa em módulos.
- **Camadas:** níveis hierárquicos — cada camada usa serviços da inferior e oferece à superior; facilita teste, manutenção e segurança. Primeiro sistema: **THE** (Technische Hogeschool Eindhoven, E. W. Dijkstra, 1968).
  *Desvantagens:* dificuldade de definir as camadas; chamadas atravessam várias camadas (custo de desempenho); dependências nem sempre são hierárquicas.
- **Micronúcleo (microkernel):** mantém no kernel só funções essenciais; move serviços para o espaço de usuário; busca modularidade, isolamento, confiabilidade e extensibilidade; comunicação por **troca de mensagens**.
  *Desvantagens:* overhead de mensagens e trocas de modo/contexto → pior desempenho. **Caso Windows NT:** a 1ª versão era microkernel em camadas e tinha desempenho baixo frente ao Windows 95; o NT 4.0 moveu camadas do espaço de usuário para o kernel; no XP a arquitetura já era mais monolítica que microkernel.
- **Monolítica:** grande parte do SO executa no núcleo (modo privilegiado), com chamadas diretas entre componentes (processos, memória, sistema de arquivos, drivers, rede). Vantagens: alto desempenho e facilidade de interação interna.
  *Desvantagens:* um erro em qualquer componente pode derrubar o sistema inteiro; pouca robustez e isolamento; manutenção e evolução mais difíceis.
- **Módulos:** núcleo com componentes nucleares que vincula serviços adicionais por **módulos carregáveis** na inicialização ou em execução (UNIX modernos, Solaris, Linux, Mac OS X, Windows). Lembra camadas (interfaces definidas e protegidas), porém mais flexível (qualquer módulo chama qualquer outro); lembra microkernel (núcleo mínimo que sabe carregar módulos), porém mais eficiente (sem troca de mensagens).
- **Híbridos:** poucos SOs seguem uma estrutura única. Linux e Solaris são monolíticos (desempenho de um único espaço de endereçamento) **e** modulares. Windows é amplamente monolítico, mas mantém comportamentos de microkernel (subsistemas separados) e módulos carregáveis.
  - **iOS:** camadas — *Cocoa Touch* (API Objective-C para apps), *serviços de mídia* (gráficos, áudio, vídeo), *serviços nucleares* (nuvem, bancos de dados) e o núcleo.
  - **Android:** pilha de software em camadas; na base, kernel Linux modificado pelo Google (fora da distribuição normal), usado para processos, memória, drivers e gerenciamento de energia.
- **Cliente-servidor:** processos clientes solicitam serviços; servidores respondem; comunicação por mensagens.
- **Máquinas virtuais:** criam abstrações de hardware; executam sistemas ou ambientes isolados; úteis em testes, servidores, nuvem e segurança.

**Moral da história:** arquiteturas diferentes buscam equilíbrios diferentes entre **controle, desempenho, segurança e flexibilidade**.

> 📖 **Maziero, cap. 3 "Arquiteturas de SOs" (p. 27–38):** monolíticos (3.1, p. 27), micronúcleo (3.2, p. 28), camadas (3.3, p. 30), híbridos (3.4, p. 31), arquiteturas avançadas (3.5, p. 32): **máquinas virtuais**, **contêineres**, **exonúcleo** e **uninúcleo**.

### Desafios da fase 1.3
1. **Quais são as duas grandes perspectivas sobre o que um SO faz?** **a) Máquina estendida e gerenciador de recursos** · b) Compilador e interpretador · c) Shell e GUI · d) Kernel e driver
2. **O que acontece primeiro quando uma aplicação faz uma chamada de sistema?** → O processador passa de modo usuário para modo núcleo (e salva o contexto).
3. **Qual estrutura mantém no kernel apenas o essencial e usa troca de mensagens?** → Micronúcleo.
4. **Por que o Windows NT migrou de microkernel para algo mais monolítico?** → Desempenho: o overhead de mensagens deixava o sistema lento.
5. **Qual foi o primeiro sistema em camadas e quem o criou?** → THE, de Dijkstra (1968).
6. **Qual a diferença entre módulos e microkernel?** → Ambos têm núcleo mínimo, mas módulos se comunicam por chamadas diretas (sem mensagens), sendo mais eficientes.
7. **Associe:** z/OS → grande porte · Android → móvel · controlador de freio ABS → tempo real/embarcado · Ubuntu Server → servidor.
8. **Classifique a chamada "alterar permissões de um arquivo":** → Comunicação e proteção.
