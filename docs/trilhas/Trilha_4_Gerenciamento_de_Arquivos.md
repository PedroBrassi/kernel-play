# Trilha 4 — Gerenciamento de Arquivos

> **Origem:** pasta `Gerenciamento de arquivos` (Aulas 16, 17, 18 e "Diretórios e pastas" — Prof. Romário da Silva Borges, UNIFAL-MG)
> **Livro de referência:** MAZIERO, Carlos A. *Sistemas Operacionais: Conceitos e Mecanismos*. DINF/UFPR, 2019 — Parte VI "Gestão de arquivos" (caps. 22–25, p. 284–347).

| Fase | Aula | Tema | Livro (Maziero) |
|---|---|---|---|
| 4.1 | Aula 16 | Gestão de arquivos: conceito, atributos, operações, formatos | cap. 22 (p. 285–294) |
| 4.2 | Aula 17 | Uso de arquivos: interface, descritores, abertura, formas de acesso, controle de acesso | cap. 23 (p. 295–307) |
| 4.3 | Aula 18 | Sistemas de arquivos: camadas, partições, blocos, alocação, espaço livre, falhas, Ext4 | cap. 24 (p. 308–336) |
| 4.4 | Diretórios e pastas | Diretórios, caminhos, atalhos e resolução de nomes | cap. 25 (p. 337–347) |

---

## Fase 4.1 — Gestão de Arquivos

### Por que existem arquivos?
É preciso guardar programas, dados e configurações para usar depois. O **arquivo** é a abstração que torna isso simples de armazenar e de encontrar.

### Arquivo
Essencialmente uma **sequência de bytes** armazenada em um dispositivo físico **não volátil**.
- Tem um **nome** (ou outra referência) para ser localizado;
- é a **unidade básica de armazenamento persistente** para usuários e aplicações;
- tamanho de poucos bytes a dezenas de GB.

### Atributos (metadados)
Informações **sobre** o arquivo, não o conteúdo: **nome, tipo, tamanho, datas** (criação, último acesso, última modificação), **proprietário**, **permissões** e **localização** no dispositivo. Variam conforme o sistema de arquivos.
**Para testar no Linux:** `ls -l hello.c` (permissões, nº de links, dono, grupo, tamanho, data, nome) e `stat hello.c` (tamanho, blocos, i-node, links, permissões, UID/GID e as datas *Access*, *Modify*, *Change*).

### Operações básicas
**Criar, abrir, ler, escrever, fechar, remover, alterar atributos.**
- **Criar:** alocar espaço no dispositivo e definir os atributos (nome, localização, proprietário, permissões, datas).
- **Abrir:** antes de ler ou escrever, a aplicação pede ao SO para abrir o arquivo. O SO: 1) verifica se o arquivo **existe**; 2) verifica se as **permissões** permitem aquele acesso; 3) **localiza** o conteúdo no dispositivo; 4) cria uma **referência** ao arquivo na memória da aplicação (descritor).
- **Ler/escrever:** transferem dados entre o arquivo e a memória, a partir da posição corrente.
- **Fechar:** conclui escritas pendentes e libera as estruturas da abertura.
- **Remover:** apaga o arquivo e libera seu espaço.
- **Alterar atributos:** ex.: mudar permissões, dono, nome.

### Formatos de arquivos
**O núcleo vê só bytes:** reconhece poucos formatos (executáveis e bibliotecas); o resto é uma **"sequência de bytes opaca"**. **Quem interpreta o conteúdo é a aplicação.**
- Formato **padronizado** (JPEG, PNG) × **proprietário** (PSD, XCF): o proprietário limita o uso dos dados.
- **Arquivos de registros:** o arquivo é uma sequência de registros de tamanho fixo ou variável, com estrutura interna (ex.: arquivos indexados de mainframes; arquivos de dados de bancos). Em SOs antigos o núcleo conhecia essa estrutura; hoje isso fica com bibliotecas/aplicações.
- **Arquivos de texto (plain text):** guardam informações textuais simples — código-fonte, configuração, HTML, XML. Diferença de **fim de linha**: **UNIX** usa **ASCII 10 (`\n`, LF)**; **Windows** usa **ASCII 13 + 10 (`\r\n`, CR+LF)**. (Por isso um texto do Windows pode mostrar `^M` no Linux.)
- **Arquivos de código (executáveis):** a exceção que o núcleo entende, pois é o SO quem carrega o programa. Contêm código, dados, símbolos, dependências e um "manual de carga" (cabeçalhos, seções e segmentos). **ELF** no Linux/UNIX; **PE** no Windows. O formato é parte do "contrato" com o SO — por isso um `.exe` não roda direto no Linux, a não ser com um tradutor como o **Wine**.

### Identificação de conteúdo
Como usuários e aplicações sabem o que há no arquivo?
- **Extensão no nome:** vem do DOS, padrão **"8.3"** (8 caracteres + 3 de extensão). É a forma mais comum, mas apenas uma convenção.
- **Números mágicos (magic numbers):** os **bytes iniciais do conteúdo** (Tabela 22.1): `%PDF` (PDF), `0xFF D8 FF` (JPEG), `0xCAFEBABE` (classe Java), `PK` / `0x504B0304` (ZIP), `\x7FELF` (ELF), `#!` (script). O comando `file` do Linux usa isso.
- **Atributos e tipos MIME** (*tipo/subtipo*): `image/png`, `text/html`, `audio/mpeg` — usados na web, e-mail e ambientes gráficos.

### Arquivos especiais
**Abstração de dispositivos de E/S:** sistemas UNIX mapeiam dispositivos como arquivos no diretório **`/dev`** — ex.: `/dev/sda1` = primeira partição do primeiro disco SATA. Outros: `/dev/null`, `/dev/random`, `/dev/tty`. Também há abstrações de **comunicação** (pipes nomeados, sockets locais) e **pseudoarquivos** com informações do núcleo (`/proc`, `/sys`). ("Tudo é um arquivo.")

### Atividade do slide (com gabarito)
Indique as afirmações **incorretas** sobre formatos de arquivos:
- (a) "Um magic number é um atributo numérico separado que identifica o tipo." → **Incorreta:** são os bytes iniciais do **próprio conteúdo**, não um atributo separado.
- (b) "A forma mais comum de identificação é a extensão do nome." → Correta.
- (c) "Textos DOS e UNIX diferem nos caracteres de fim de arquivo." → **Incorreta:** diferem no **fim de linha** (`\r\n` × `\n`).
- (d) "Para a maioria dos núcleos, arquivos são meras sequências de bytes." → Correta.
- (e) "ELF e PE são formatos típicos de arquivos de configuração." → **Incorreta:** são formatos de **executáveis/código**.
- (f) "O padrão MIME é usado no Linux para identificação de tipos pelo sistema operacional." → **Incorreta:** o núcleo não usa MIME; ele é usado por aplicações e ambientes (navegadores, e-mail, desktops).

> 📖 **Maziero, cap. 22 "O conceito de arquivo" (p. 285–294):** elementos básicos (22.1), atributos e operações (22.2, p. 286), formatos — sequência de bytes, registros, texto, código, identificação de conteúdo (22.3, p. 288–292), arquivos especiais (22.4, p. 292).

### Desafios da fase 4.1
1. **Qual destes NÃO é atributo do arquivo?** a) Tamanho · b) Proprietário · **c) O texto do documento** · d) Data de modificação
2. **Ao abrir um arquivo, o que o SO verifica primeiro?** → Se ele existe (depois, permissões).
3. **Fim de linha no Windows?** → `\r\n` (ASCII 13 + 10).
4. **Por que um `.exe` não roda no Linux?** → O formato PE é um contrato com o Windows; o Linux carrega ELF.
5. **Os bytes `%PDF` no início do arquivo são…** → um número mágico.
6. **O que é `/dev/sda1`?** → Arquivo especial que representa a 1ª partição do 1º disco SATA.

---

## Fase 4.2 — Uso de Arquivos

### Interface de acesso
Dois níveis:
- **Baixo nível:** oferecida pelo SO por **chamadas de sistema** — os arquivos são abstrações criadas e mantidas pelo núcleo.
- **Alto nível:** funções da linguagem de programação usadas pela aplicação (que internamente chamam as de baixo nível).

| Operação | C padrão (alto nível) | Linux/POSIX (baixo nível) | Windows |
|---|---|---|---|
| Abrir | `fopen` | `open` | `CreateFile` |
| Ler | `fread`, `fscanf` | `read` | `ReadFile` |
| Escrever | `fwrite`, `fprintf` | `write` | `WriteFile` |
| Posicionar | `fseek` | `lseek` | `SetFilePointer` |
| Fechar | `fclose` | `close` | `CloseHandle` |
| Remover | `remove` | `unlink` | `DeleteFile` |
(Ver tabela completa no livro, Seção 23.6.)

### Descritores de arquivos
Representação lógica de um arquivo **em uso por um processo**: criado na **abertura** e usado como referência nas operações seguintes.
- **Baixo nível (do núcleo):** no UNIX, um **inteiro** (índice na tabela de arquivos abertos do processo; 0 = stdin, 1 = stdout, 2 = stderr); no Windows, um **handle**.
- **Alto nível (da linguagem):** ex.: ponteiro `FILE*` em C, objetos `FileInputStream` em Java — contêm o descritor de baixo nível mais buffers e informações da biblioteca.
**Portabilidade:** cabe às bibliotecas e ao suporte de execução de cada linguagem **mapear** a representação do núcleo na referência usada pela linguagem — isso garante que as aplicações sejam portáveis entre SOs distintos.

### Abertura e fechamento
**Abertura (passo a passo, livro 23.2.2):** 1) a aplicação pede a abertura (`open(nome, modo)`); 2) o núcleo **localiza** o arquivo resolvendo o caminho nos diretórios; 3) verifica as **permissões** para o modo pedido (leitura, escrita…); 4) cria na memória do núcleo as estruturas do arquivo aberto (cópia do i-node/FCB, **posição corrente**, modo); 5) cria uma entrada na **tabela de arquivos abertos do processo** e devolve o **descritor**; 6) a biblioteca da linguagem envolve esse descritor na referência de alto nível.
**Fechamento:** ao terminar, o processo pede ao núcleo para fechar: o núcleo **conclui escritas pendentes** e **remove da memória** as estruturas criadas na abertura.

### Formas de acesso
- **Sequencial:** dados lidos/escritos em ordem, do início ao fim, com um **ponteiro de posição** avançando a cada operação. Uso: textos, logs, mídia, cópia de arquivos.
- **Aleatório (direto):** acessa qualquer posição indicando o **deslocamento** (`lseek`/`fseek`) antes da leitura/escrita. Uso: bancos de dados, arquivos de registros de tamanho fixo, edição de grandes arquivos.
- **Mapeado em memória:** o arquivo é **associado a uma região do espaço de endereçamento** (`mmap`); ler/escrever na memória lê/escreve no arquivo, via mecanismo de paginação. Uso: carregar executáveis e bibliotecas, arquivos grandes com acesso frequente, compartilhamento entre processos.
- **Indexado:** acesso por **chave**, com um **índice** que localiza os registros (comum em mainframes; hoje feito por bibliotecas e SGBDs). Uso: bases de dados com buscas por chave.

### Compartilhamento (complemento do livro, 23.4)
Vários processos podem abrir o mesmo arquivo. **Travas (locks)** evitam condições de disputa: obrigatórias × consultivas (*advisory*), compartilhadas (leitura) × exclusivas (escrita) — ex.: `flock`/`fcntl`. **Semânticas de acesso:** UNIX (escritas visíveis imediatamente aos demais), de sessão (visíveis após fechar) e imutável.

### Controle de acesso
Geralmente feito **somente na abertura do arquivo**: uma vez aberto, o processo mantém o acesso **enquanto o arquivo estiver aberto**, mesmo que as permissões sejam alteradas depois para impedir o acesso.
Nos sistemas UNIX, permissões são definidas para **dono (u)**, **grupo (g)** e **outros (o)**, com os direitos **r** (leitura), **w** (escrita) e **x** (execução): ex.: `-rwxr-x---`. No Windows, usam-se **ACLs** (listas de controle de acesso). (Detalhes no cap. 29 do livro.)

### Resumo
Descritor de arquivo · interface em dois níveis · formas de acesso · controle de acesso.

### Atividade do slide (com gabarito)
1. *Descritores de alto e baixo nível:* o de **baixo nível** é criado pelo **núcleo** na abertura (inteiro no UNIX, *handle* no Windows) e usado nas chamadas de sistema (`read`, `write`, `close`); o de **alto nível** é a referência da **linguagem** (`FILE*`, streams), criada pela biblioteca, que encapsula o de baixo nível e acrescenta buffers e funções formatadas. Diferença: o de baixo nível depende do SO; o de alto nível é portável entre SOs.
2. *Formas de acesso e uso apropriado:* sequencial (textos, logs, mídia); aleatório (bancos de dados, registros de tamanho fixo); mapeado em memória (executáveis/bibliotecas, arquivos grandes, compartilhamento); indexado (buscas por chave em bases de dados).

> 📖 **Maziero, cap. 23 "Uso de arquivos" (p. 295–307):** interface de acesso e descritores (23.2, p. 295–298), formas de acesso (23.3, p. 298–299), compartilhamento — travas e semânticas (23.4, p. 300), controle de acesso (23.5, p. 303), tabela de interfaces (23.6, p. 304).

### Desafios da fase 4.2
1. **`open`, `read` e `write` pertencem a qual nível?** **a) Baixo nível (chamadas de sistema)** · b) Alto nível · c) Hardware · d) Shell
2. **No UNIX, o descritor de baixo nível é…** → um número inteiro.
3. **Um processo abriu o arquivo e depois o dono retirou sua permissão. O processo ainda lê?** → Sim, enquanto mantiver o arquivo aberto.
4. **Qual forma de acesso usa `mmap`?** → Mapeado em memória.
5. **Para um banco de dados com registros de tamanho fixo, qual forma é mais adequada?** → Aleatório (direto).
6. **O que o fechamento garante?** → Concluir escritas pendentes e liberar as estruturas do núcleo.

---

## Fase 4.3 — Sistemas de Arquivos

### Conceito
Subsistemas do SO que implementam o conceito de arquivo sobre o **armazenamento bruto** dos dispositivos físicos. Organizados em **camadas**, do hardware às bibliotecas usadas pelos processos.

### Arquitetura em camadas (Maziero 24.2)
Do mais baixo ao mais alto: **dispositivo físico** (disco, SSD) → **controlador** → **driver de dispositivo** → **gerência de blocos / cache** → **sistema de arquivos específico** (Ext4, NTFS, FAT…) → **sistema de arquivos virtual (VFS)** → **chamadas de sistema** → **bibliotecas de E/S** → **aplicação**.

### Dados e metadados
- **Dados:** o conteúdo em si (uma música, uma foto, um documento).
- **Metadados:** atributos (nome, datas, permissões) e informações para **localizar** o conteúdo no disco. **Mapas de blocos livres** também são metadados.

### Espaços de armazenamento — discos e partições
- O disco é visto como um **grande vetor de blocos** de tamanho fixo.
- **MBR** (*Master Boot Record*): tabela de partições e código de boot do disco (no primeiro bloco). *(Discos modernos usam GPT.)*
- **VBR** (*Volume Boot Record*): bloco de inicialização de cada partição.
- Cada **volume** (partição) é formatado com seu próprio sistema de arquivos.

### Montagem de volumes
**Montar** = ler o bloco de inicialização, criar as estruturas em memória e **definir um ponto de acesso**.
- **UNIX:** volumes viram **subdiretórios** da árvore única (`mount /dev/sdb1 /mnt/pendrive`).
- **Windows:** cada volume vira um **disco lógico** (C:, D:).

### Gestão de blocos
**Blocos físicos e lógicos:** blocos físicos (setores de **512 B ou 4 KB**) são agrupados em **blocos lógicos (clusters)**. O bloco lógico é a **unidade mínima de alocação**. Blocos grandes → mais eficiência de E/S **e** mais fragmentação interna. Ex.: um arquivo de **200 bytes ocupa um bloco lógico inteiro** (ex.: 4 KB).

**Caching de blocos:**
- **Read-through:** blocos lidos ficam no cache para leituras futuras;
- **Read-ahead:** lê antecipadamente os blocos seguintes (acesso sequencial);
- **Write-through:** escrita **síncrona** no disco — segura, sem ganho de desempenho na escrita;
- **Write-back:** escreve no cache e libera o processo; grava depois — rápido, mas pode **perder dados em um crash**.
Em geral: **dados usam write-back; metadados usam write-through** (consistência).

### Alocação de arquivos
**Problema:** dispor conteúdo e metadados nos blocos lógicos. Critérios: **rapidez**, **robustez** e **flexibilidade**. O **FCB** (*File Control Block*) guarda metadados e a localização do conteúdo.

- **Contígua:** blocos **consecutivos**; basta o endereço do **primeiro** bloco (e o tamanho). Acesso sequencial e aleatório **rápidos**; boa robustez. Porém **baixa flexibilidade** (difícil crescer) e **fragmentação externa**. Ex.: **ISO 9660** (CD-ROM).
- **Encadeada simples:** cada bloco guarda **dados e um ponteiro** para o próximo. Sem fragmentação externa; arquivo cresce livremente. Acesso aleatório **lento** (para o bloco n é preciso ler os n − 1 anteriores); um **bloco defeituoso** torna inacessíveis os seguintes.
- **Encadeada com FAT:** os ponteiros saem dos blocos e vão para uma **tabela** (*File Allocation Table*), mantida em memória. Mantém a flexibilidade e **acelera** o acesso aleatório. A FAT é dado **crítico** — cópias ficam na área reservada. Usada em **FAT12/16/32**, pendrives e câmeras.
- **Indexada simples:** cada arquivo tem um **i-node** com atributos e um **índice** de blocos. Acesso sequencial e aleatório rápidos. Mas o i-node tem **tamanho fixo** (limita o tamanho do arquivo) e a **tabela de i-nodes** limita o **número** de arquivos.
- **Indexada multinível:** ponteiros **indiretos** apontam para blocos com mais ponteiros. **Ext2/3/4:** **12 ponteiros diretos, 1 indireto, 1 duplo indireto e 1 triplo indireto**. Com blocos de **4 KB**: arquivos de até **≈ 4 TB** (limite prático do i-node). Blocos no fim de arquivos grandes exigem **até 3 leituras extras**.
  *Cálculo:* com blocos de 4 KB e ponteiros de 4 B, cada bloco de índice tem 1024 ponteiros: diretos = 12 × 4 KB = 48 KB; indireto = 1024 × 4 KB = 4 MB; duplo = 1024² × 4 KB = 4 GB; triplo = 1024³ × 4 KB = 4 TB.
- **Por extensões (extents):** extensão = grupo de blocos **contíguos**; para cada uma guarda-se **bloco lógico inicial, bloco físico inicial e quantidade**. Combina a **economia** da contígua com a **flexibilidade** da indexada. Usada em **NTFS, HFS, Ext4 e ZFS**.

**Análise comparativa (síntese; ver a análise do livro na seção 24.5.7, p. 327):**
| Estratégia | Rapidez (seq./aleatório) | Robustez | Flexibilidade |
|---|---|---|---|
| Contígua | alta / alta | alta | baixa |
| Encadeada simples | alta / baixa | baixa | alta |
| Encadeada FAT | alta / média | média (FAT crítica) | alta |
| Indexada | alta / alta | média | média (limites do i-node) |
| Indexada multinível | alta / alta (com leituras extras) | média | alta |
| Extensões | alta / alta | média | alta |

### Gestão do espaço livre
- **Mapa de bits:** 1 bit por bloco (livre/ocupado); simples e compacto.
- **Lista de blocos livres:** cada bloco livre aponta para o próximo.
- **Tabela de extensões livres:** pares [bloco inicial, tamanho].
- Na **FAT**, blocos livres são marcados na própria tabela.

### Falhas e recuperação
**Falhas por crash:** criar um arquivo exige várias escritas (mapa de i-nodes, i-node, diretório); um crash no meio deixa o sistema **inconsistente**. Perder metadados pode perder **subárvores inteiras** de diretórios.
- **Verificação (`fsck`, `chkdsk`):** percorre todas as estruturas e corrige inconsistências — pode levar **horas** em discos grandes.
- **Journaling:** as alterações são **registradas em um log (journal) antes** de serem feitas; após um crash, o SO **completa** (ou descarta) as operações pendentes. Em geral, o journal cobre **só os metadados**.
- **Copy-on-write (CoW):** o novo conteúdo vai para um **bloco livre**, preservando o antigo; mantém **snapshots** de estados anteriores; após um crash, volta ao último snapshot consistente. Usado em **ZFS** e **BTRFS**.

### Exemplo: Ext4
Sistema de arquivos mais usado no Linux. **Journaling** e **checksum de metadados**; alocação **indexada multinível e por extensões**; espaço livre controlado por **bitmaps de blocos e de i-nodes**.
Estrutura: o volume é dividido em **grupos de blocos**; cada grupo tem cópia do **superbloco** (parâmetros do volume), **descritores de grupo**, **bitmap de blocos**, **bitmap de i-nodes**, **tabela de i-nodes** e **blocos de dados**.

### Resumo
Dados e metadados · blocos e caching · estratégias de alocação · gestão do espaço livre · consistência após falhas.

### Atividade do slide (com gabarito)
1. *Explique as diferentes formas de alocação (de arquivos), com vantagens e desvantagens.* → Contígua (rápida e robusta; inflexível, fragmentação externa); encadeada simples (flexível, sem fragmentação externa; acesso aleatório lento e frágil a blocos defeituosos); FAT (flexível e acesso aleatório mais rápido; tabela crítica e grande em memória); indexada (acesso rápido; limites de tamanho e de número de arquivos); multinível (arquivos enormes; leituras extras); extensões (compacta e flexível; mais complexa).
2. *Fragmentação interna × externa:* **interna** — espaço desperdiçado **dentro** de uma unidade alocada (ex.: arquivo de 200 B ocupando um bloco de 4 KB), causada pela unidade mínima de alocação; **externa** — espaço livre **espalhado** em pedaços não contíguos, causada por alocações e liberações sucessivas em estratégias contíguas.

> 📖 **Maziero, cap. 24 "Sistemas de arquivos" (p. 308–336):** arquitetura (24.2), discos, partições e montagem (24.3, p. 310–312), blocos e caching (24.4, p. 313–314), alocação contígua, encadeada, FAT, indexada, multinível, extensões e comparação (24.5, p. 315–327), espaço livre (24.6, p. 327), falhas, journal e CoW (24.7, p. 328–331), Ext4 (24.8, p. 331). Dispositivos de armazenamento (HD, RAID, SSD) no cap. 21.

### Desafios da fase 4.3
1. **Qual alocação precisa ler n − 1 blocos para chegar ao bloco n?** a) Contígua · **b) Encadeada simples** · c) Indexada · d) Extensões
2. **Ext4 usa quantos ponteiros diretos no i-node?** → 12 (+ 1 indireto, 1 duplo e 1 triplo).
3. **Write-back é mais rápido, mas…** → pode perder dados em um crash.
4. **O que o journaling registra antes de alterar o disco?** → As operações pendentes (em geral, de metadados).
5. **Quais sistemas usam copy-on-write?** → ZFS e BTRFS.
6. **No UNIX, montar um volume faz o quê?** → Liga o volume a um diretório da árvore única.
7. **Um arquivo de 200 B em blocos de 4 KB desperdiça quanto?** → 3.896 B (fragmentação interna).
8. **CD-ROMs (ISO 9660) usam qual alocação?** → Contígua.

---

## Fase 4.4 — Diretórios e Pastas

### Diretórios
- Um **diretório** (pasta, *folder*) é um **contêiner** de arquivos e de outros diretórios.
- Todo sistema de arquivos tem um **diretório raiz**.
- Os diretórios formam uma **hierarquia em árvore**.
- Cada processo tem um **diretório de trabalho** (*working directory*; `chdir` no UNIX, `cd` no shell).

**Árvore de diretórios do Linux (FHS — Filesystem Hierarchy Standard):** `/` raiz; `/bin` e `/sbin` (executáveis essenciais); `/boot` (núcleo e boot); `/dev` (dispositivos); `/etc` (configurações); `/home` (usuários); `/lib` (bibliotecas); `/media` e `/mnt` (montagem); `/opt` (aplicativos adicionais); `/proc` e `/sys` (informações do núcleo); `/root` (administrador); `/tmp` (temporários); `/usr` (programas e dados de usuário); `/var` (dados variáveis, logs).

### Caminhos de acesso
- **Caminho:** sequência de diretórios da raiz até o arquivo.
- **Separador:** `\` no Windows e `/` no UNIX. (No Windows, com letra de unidade: `C:\Users\maria\docs\prova.pdf`.)
- **`..`** indica o diretório anterior (pai) e **`.`** o diretório atual.

**Formas de referência:**
- **Direta:** só o nome, no diretório de trabalho (`index.html`);
- **Absoluta:** a partir da raiz (`/usr/local/share/fortunes/brasil.dat`);
- **Relativa:** a partir do diretório de trabalho (`../../docs/proj1.pdf`);
- **Caminho canônico:** o caminho absoluto **mais curto** (sem `.`, `..` ou atalhos).
*Exemplo:* diretório de trabalho `/home/ana/so/aula1`; o relativo `../../docs/proj1.pdf` corresponde ao absoluto `/home/ana/docs/proj1.pdf`.

### Implementação de diretórios
**Diretório é uma tabela:** um diretório é um **arquivo cujo conteúdo é uma tabela de entradas**. Cada entrada: **nome, tipo e localização** (número do i-node ou bloco inicial). O diretório **não contém** os arquivos, apenas os **relaciona**. Entradas especiais: **`.`** (o próprio diretório) e **`..`** (o pai).

**Busca nas entradas:** tabela simples (MS-DOS, Ext2) → **busca linear, O(n)**. **Ext4, ZFS e NTFS** usam **hashes e árvores** (ex.: árvores B), com busca mais rápida. A posição do **diretório raiz** fica registrada no **VBR**.

### Atalhos (links)
Referências **indiretas** a um arquivo ou diretório: **uma só cópia dos dados, vários caminhos** até ela. Ex.: `libcrypt.so → /lib/x86_64-linux-gnu/libcrypt.so.1`.

| | Simbólico (*soft link*) | Físico (*hard link*) |
|---|---|---|
| O que guarda | o **caminho** do alvo (é um pequeno arquivo especial) | é outra **entrada de diretório** apontando para o **mesmo i-node** |
| Outro volume? | sim | **não**, só no mesmo volume |
| Diretórios? | sim | **nunca** para diretórios |
| Se o alvo for movido/removido | o atalho fica **quebrado** | o conteúdo continua acessível; só some quando o contador de links do i-node chega a 0 |
| Comando UNIX | `ln -s alvo atalho` | `ln alvo atalho` |
(No Windows: atalhos `.lnk` da interface, links simbólicos e *hard links* do NTFS — `mklink`.)

### Tradução de caminhos (lookup)
Para abrir `/home/daniel/arq1`, o núcleo percorre o caminho **nível a nível**: em cada nível, lê o **i-node** do diretório, **checa a permissão** de travessia e lê a **tabela do diretório** para achar a próxima entrada. Nesse exemplo: **6 leituras de disco para 3 níveis** (`/`, `home`, `daniel` — i-node + conteúdo de cada um); depois, o i-node de `arq1`.

**Cache de resolução de nomes:** guarda pares **caminho → i-node** usados recentemente; **tabela hash** com substituição **LRU**. A consulta usa o caminho completo e vai **"para trás"** até achar um prefixo conhecido, resolvendo só o restante. **Atalho simbólico:** ao encontrá-lo, lê-se o caminho guardado nele e **resolve-se de novo**.

### Resumo
Diretórios e hierarquia · caminhos absolutos e relativos · diretório como tabela de entradas · atalhos simbólicos e físicos · resolução de nomes e cache.

### Atividade do slide (com gabarito)
1. *Tipos de referência a arquivos:* direta (nome no diretório de trabalho), absoluta (a partir da raiz), relativa (a partir do diretório de trabalho, com `.`/`..`) e canônica (absoluta mais curta).
2. *Dois tipos de atalho:* simbólico (guarda o caminho do alvo; pode cruzar volumes e apontar para diretórios; quebra se o alvo sumir) e físico (nova entrada para o mesmo i-node; só no mesmo volume, nunca para diretórios; conteúdo persiste enquanto houver links).
3. *Acessos a disco para localizar `/home/aluno/marcos/so/projetos/hello.c` com cache vazio:* para cada diretório do caminho — `/`, `home`, `aluno`, `marcos`, `so`, `projetos` — lê-se o **i-node** e o **bloco de conteúdo** (tabela de entradas): 6 × 2 = **12 leituras**, verificando permissões a cada nível; por fim, lê-se o **i-node de `hello.c`** → **13 leituras** no total (supondo cada diretório em um único bloco).

> 📖 **Maziero, cap. 25 "Diretórios e atalhos" (p. 337–347):** diretórios (25.1), caminhos de acesso (25.2, p. 339), implementação (25.3, p. 340), atalhos (25.4, p. 341), implementação de atalhos (25.5, p. 342), tradução dos caminhos e cache (25.6, p. 344).

### Desafios da fase 4.4
1. **`../../docs/proj1.pdf` é um caminho…** a) Absoluto · **b) Relativo** · c) Canônico · d) Direto
2. **O que um diretório realmente contém?** → Uma tabela de entradas (nome, tipo, localização) — não os arquivos.
3. **Hard link pode apontar para outro volume?** → Não.
4. **Apaguei o alvo de um soft link. E agora?** → O atalho fica quebrado.
5. **Que estrutura acelera a busca em diretórios no Ext4/NTFS?** → Hashes e árvores.
6. **O cache de resolução de nomes usa qual política de substituição?** → LRU.
7. **Quantas leituras de disco para resolver `/home/daniel` com cache vazio?** → 4 (i-node e conteúdo de `/` e de `home`), mais o i-node de `daniel`.
