/* =========================================================
   KernelPlay — Trilha 4: Gerenciamento de Arquivos
   Fonte: Trilhas/Trilha_4_Gerenciamento_de_Arquivos.md (Aulas 16 a 18 e
   "Diretórios e pastas"; MAZIERO, Parte VI) + Lab 00 do xv6 (ls).
   Desafios com o campo "lab" vêm das aulas de laboratório.
   Trechos do xv6: xv6-labs-2024 (versão usada no laboratório).
   O formato das fases e dos desafios está documentado em js/trilhas.js.
   ========================================================= */

TRILHAS.push({
  id: "arquivos",
  numero: 4,
  titulo: "Gerenciamento de Arquivos",
  subtitulo: "Arquivos, descritores, sistemas de arquivos e diretórios.",
  fases: [
    // ================================================== FASE 4.1 — Arquivos
    {
      id: "a41",
      etapa: "4.1",
      titulo: "Arquivos",
      descricao: "Conceito, atributos, operações e formatos",
      icone: "📁",
      xv6: {
        titulo: "Tipos de arquivo no xv6",
        arquivo: "kernel/stat.h",
        codigo: `#define T_DIR     1   // Directory
#define T_FILE    2   // File
#define T_DEVICE  3   // Device

struct stat {
  int dev;     // dispositivo do sistema de arquivos
  uint ino;    // número do i-node
  short type;  // tipo do arquivo
  short nlink; // número de links (nomes) do arquivo
  uint64 size; // tamanho em bytes
};

$ ls            (nome  tipo  i-node  tamanho)
.              1 1 1024
README         2 2 2403
console        3 20 0`,
        texto: "Os <b>metadados</b> do xv6 cabem numa struct pequena: tipo, i-node, links e tamanho. No <code>ls</code> do Lab 00, o README é um arquivo comum (tipo 2) e o <code>console</code> é um <b>arquivo especial de dispositivo</b> (tipo 3)."
      },
      linux: {
        titulo: "Os metadados de um arquivo",
        comando: "stat hello.c",
        saida: `  File: hello.c
  Size: 48        	Blocks: 8          IO Block: 4096   regular file
Device: 8,2	Inode: 1204274     Links: 1
Access: (0644/-rw-r--r--)  Uid: ( 1000/   pedro)   Gid: ( 1000/   pedro)
Access: 2026-10-30 21:26:54.692251451 -0300
Modify: 2026-10-30 21:26:54.697290750 -0300
Change: 2026-10-30 21:26:54.697290750 -0300
 Birth: 2026-10-30 21:26:54.692251451 -0300`,
        texto: "Nada disso é o conteúdo: são os <b>atributos</b> que o sistema de arquivos guarda no i-node. Repare que um arquivo de 48 bytes ocupa 8 setores (um bloco de 4 KB)."
      },
      man: [
        { termo: "arquivo", secao: "7", resumo: "sequência de bytes guardada num dispositivo não volátil, com um nome",
          detalhe: "É a unidade básica de armazenamento persistente. Operações: criar, abrir, ler, escrever, fechar, remover e alterar atributos.",
          veja: ["metadados(7)", "descritor de arquivo(7)"] },
        { termo: "metadados", secao: "7", resumo: "informações sobre o arquivo: nome, tipo, tamanho, datas, dono, permissões e localização",
          detalhe: "Ficam no i-node (UNIX) ou em estruturas equivalentes. Mapas de blocos livres também são metadados do sistema de arquivos.",
          exemplo: "ls -l hello.c\nstat hello.c",
          veja: ["i-node(7)", "stat(1)"] },
        { termo: "stat", secao: "1", resumo: "mostra os metadados completos de um arquivo",
          detalhe: "Tamanho, blocos, i-node, número de links, permissões, dono e as datas Access, Modify e Change.",
          exemplo: "stat hello.c",
          veja: ["metadados(7)"] },
        { termo: "número mágico", secao: "7", resumo: "bytes iniciais do conteúdo que identificam o formato",
          detalhe: "Ex.: %PDF (PDF), FF D8 FF (JPEG), CAFEBABE (classe Java), PK (ZIP), 7F E L F (ELF), #! (script). O comando file usa esses bytes, e não a extensão.",
          exemplo: "file /usr/bin/ls",
          veja: ["file(1)", "MIME(7)"] },
        { termo: "file", secao: "1", resumo: "identifica o tipo de um arquivo pelo conteúdo",
          exemplo: "file /usr/bin/ls\n/usr/bin/ls: ELF 64-bit LSB pie executable, x86-64 ...",
          veja: ["número mágico(7)"] },
        { termo: "MIME", secao: "7", resumo: "tipo/subtipo usado na web, no e-mail e nos ambientes gráficos",
          detalhe: "Ex.: image/png, text/html, audio/mpeg. É usado por aplicações, não pelo núcleo.",
          veja: ["número mágico(7)"] },
        { termo: "ELF", secao: "7", resumo: "formato de executáveis e bibliotecas do Linux/UNIX (o PE é o do Windows)",
          detalhe: "É um dos poucos formatos que o núcleo entende, porque é ele quem carrega o programa. Por isso um .exe (PE) não roda direto no Linux, a não ser com um tradutor como o Wine.",
          veja: ["número mágico(7)"] },
        { termo: "fim de linha", secao: "7", resumo: "UNIX usa LF (\\n, ASCII 10); Windows usa CR+LF (\\r\\n, ASCII 13 e 10)",
          detalhe: "Por isso um texto do Windows pode mostrar ^M no Linux. O comando file avisa: \"with CRLF line terminators\".",
          veja: ["arquivo(7)"] },
        { termo: "arquivo especial", secao: "7", resumo: "arquivo que representa um dispositivo, canal de comunicação ou informação do núcleo",
          detalhe: "Dispositivos ficam em /dev (/dev/sda1, /dev/null, /dev/tty); pseudoarquivos do núcleo em /proc e /sys. É o \"tudo é um arquivo\" do UNIX.",
          veja: ["arquivo(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "O que é um arquivo",
          texto: `<p>Um <b>arquivo</b> é uma <b>sequência de bytes</b> guardada num dispositivo <b>não volátil</b>, com um nome para ser encontrado.
            É a unidade básica de armazenamento persistente.</p>
            <p>Os <b>atributos</b> (<b>metadados</b>) descrevem o arquivo, não o conteúdo: <b>nome, tipo, tamanho, datas</b>
            (criação, acesso, modificação), <b>proprietário</b>, <b>permissões</b> e <b>localização</b> no dispositivo.</p>
            <p>Operações básicas: <b>criar, abrir, ler, escrever, fechar, remover</b> e <b>alterar atributos</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual destes NÃO é um atributo (metadado) do arquivo?",
          opcoes: ["O tamanho", "O proprietário", "O texto escrito no documento", "A data de modificação"],
          correta: 2,
          dica: "Metadados são dados sobre o arquivo.",
          explicacao: "O texto é o conteúdo (os dados). Tamanho, dono, datas e permissões são informações sobre o arquivo."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Mostre os metadados completos de hello.c, incluindo o número do i-node e as datas de acesso e modificação.",
          aceitar: ["stat( -\\S+)* hello\\.c"],
          saida: `  File: hello.c
  Size: 48        	Blocks: 8          IO Block: 4096   regular file
Device: 8,2	Inode: 1204274     Links: 1
Access: (0644/-rw-r--r--)  Uid: ( 1000/   pedro)   Gid: ( 1000/   pedro)
Access: 2026-10-30 21:26:54.692251451 -0300
Modify: 2026-10-30 21:26:54.697290750 -0300
Change: 2026-10-30 21:26:54.697290750 -0300`,
          neutros: [
            { re: "ls -\\S*l\\S*( hello\\.c)?", saida: "-rw-r--r-- 1 pedro pedro 48 Oct 30 21:26 hello.c",
              nota: "O ls -l mostra parte dos metadados (permissões, links, dono, tamanho, data), mas não o i-node nem as três datas." },
            { re: "cat hello\\.c", saida: "#include <stdio.h>\nint main(){printf(\"Ola\\n\");}", nota: "Isso é o conteúdo, não os metadados." },
            { re: "file hello\\.c", saida: "hello.c: C source, ASCII text", nota: "O file identifica o tipo pelo conteúdo. Para os metadados há outro comando." }
          ],
          dica: "O comando tem o mesmo nome da chamada de sistema que lê os metadados.",
          explicacao: "O stat mostra tudo o que está no i-node: tamanho, blocos, i-node, links, permissões, dono e as datas Access, Modify e Change."
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene o que o SO faz quando uma aplicação pede para abrir um arquivo.",
          itens: [
            "Verifica se o arquivo existe",
            "Verifica se as permissões permitem esse acesso",
            "Localiza o conteúdo no dispositivo",
            "Cria uma referência ao arquivo para a aplicação (o descritor)"
          ],
          dica: "Não adianta checar permissões de um arquivo que nem existe.",
          explicacao: "Existe? → posso? → onde está? → devolve o descritor. Daí em diante, ler e escrever usam essa referência."
        },
        {
          tipo: "conceito",
          titulo: "Formatos de arquivos",
          texto: `<p>Para a maioria dos núcleos, um arquivo é só uma <b>sequência de bytes opaca</b>: quem interpreta o conteúdo é a <b>aplicação</b>.</p>
            <ul>
              <li><b>Texto</b>: código-fonte, configuração, HTML. O fim de linha difere: <b>UNIX usa <code>\\n</code></b> (LF, ASCII 10);
                <b>Windows usa <code>\\r\\n</code></b> (CR+LF, ASCII 13 e 10).</li>
              <li><b>Registros</b>: sequência de registros de tamanho fixo ou variável (hoje tratados por bibliotecas e SGBDs).</li>
              <li><b>Executáveis</b>: a exceção que o núcleo entende, porque é ele quem carrega o programa: <b>ELF</b> no Linux, <b>PE</b> no Windows.</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "Qual é o fim de linha de um arquivo de texto do Windows?",
          opcoes: ["\\n (LF)", "\\r\\n (CR + LF)", "\\0", "EOF"],
          correta: 1,
          dica: "É por isso que aparece ^M quando se abre esse texto no Linux.",
          explicacao: "O Windows usa os caracteres 13 (CR) e 10 (LF); o UNIX usa só o 10 (LF)."
        },
        {
          tipo: "multipla",
          pergunta: "Por que um .exe do Windows não roda direto no Linux?",
          opcoes: [
            "Porque a extensão .exe é proibida no Linux",
            "Porque o formato PE é um contrato com o Windows; o Linux carrega executáveis ELF",
            "Porque o processador é diferente",
            "Porque o arquivo está corrompido"
          ],
          correta: 1,
          dica: "O formato do executável diz ao SO como carregar o programa.",
          explicacao: "Cabeçalhos, seções e dependências seguem o formato PE, que o carregador do Linux não entende. Um tradutor como o Wine faz essa ponte."
        },
        {
          tipo: "conceito",
          titulo: "Identificando o conteúdo",
          texto: `<ul>
              <li><b>Extensão do nome</b>: a forma mais comum, herdada do padrão \"8.3\" do DOS. É só uma convenção.</li>
              <li><b>Números mágicos</b>: os <b>primeiros bytes do próprio conteúdo</b>: <code>%PDF</code>, <code>FF D8 FF</code> (JPEG),
                <code>CAFEBABE</code> (Java), <code>PK</code> (ZIP), <code>7F 45 4C 46</code> (ELF), <code>#!</code> (script).</li>
              <li><b>Tipos MIME</b>: <code>image/png</code>, <code>text/html</code>, usados na web, no e-mail e nos ambientes gráficos.</li>
            </ul>
            <p><b>Arquivos especiais</b>: no UNIX, dispositivos aparecem em <code>/dev</code> (<code>/dev/sda1</code>, <code>/dev/null</code>)
            e informações do núcleo em <code>/proc</code> e <code>/sys</code>: \"tudo é um arquivo\".</p>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada número mágico ao formato que ele identifica.",
          pares: [
            ["%PDF", "Documento PDF"],
            ["7F 45 4C 46 (\\x7FELF)", "Executável ELF"],
            ["PK", "Arquivo ZIP"],
            ["#!", "Script (ex.: #!/bin/bash)"]
          ],
          dica: "Um deles começa com o nome do próprio formato.",
          explicacao: "São os bytes iniciais do conteúdo. O comando file do Linux compara esses bytes com uma base de números mágicos."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Descubra o tipo de /usr/bin/ls pelo conteúdo, sem depender da extensão.",
          aceitar: ["file( -\\S+)* /usr/bin/ls"],
          saida: "/usr/bin/ls: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, stripped",
          neutros: [
            { re: "ls -\\S* /usr/bin/ls", saida: "-rwxr-xr-x 1 root root 138216 Apr  5  2024 /usr/bin/ls", nota: "O ls mostra os metadados. Para identificar o formato pelo conteúdo, use outro comando." },
            { re: "cat /usr/bin/ls", saida: "\u007fELF\u0002\u0001\u0001\u0000\u0000…(binário ilegível)…", nota: "Repare no começo: \\x7FELF. Há um comando que interpreta esses bytes para você." },
            { re: "stat( .*)?", nota: "O stat mostra os metadados, não o formato do conteúdo." }
          ],
          dica: "O comando tem o nome mais óbvio possível: arquivo, em inglês.",
          explicacao: "O file leu o número mágico 7F 45 4C 46 e reconheceu um executável ELF de 64 bits, mesmo sem extensão no nome."
        },
        {
          tipo: "multipla",
          pergunta: "Sobre formatos de arquivos, qual afirmação está CORRETA?",
          opcoes: [
            "Um número mágico é um atributo numérico separado do conteúdo",
            "Textos DOS e UNIX diferem no caractere de fim de arquivo",
            "Para a maioria dos núcleos, arquivos são meras sequências de bytes",
            "ELF e PE são formatos típicos de arquivos de configuração"
          ],
          correta: 2,
          dica: "Três delas são as afirmações incorretas da atividade do slide.",
          explicacao: "O número mágico está no próprio conteúdo; DOS e UNIX diferem no fim de linha; ELF e PE são executáveis. Só a terceira está certa."
        },
        {
          tipo: "multipla",
          pergunta: "O que é /dev/sda1?",
          opcoes: [
            "Um arquivo de configuração do disco",
            "Um arquivo especial que representa a 1ª partição do 1º disco SATA",
            "Uma pasta com os arquivos do usuário",
            "Um programa que formata discos"
          ],
          correta: 1,
          dica: "sd = disco, a = primeiro disco, 1 = primeira partição.",
          explicacao: "No UNIX, dispositivos aparecem como arquivos em /dev. Ler e escrever em /dev/sda1 é ler e escrever direto na partição."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No ls do xv6 (Lab 00), apareceu a linha \"console 3 20 0\". O que significa o 3?",
          opcoes: [
            "Que o arquivo tem 3 links",
            "Que é um arquivo especial de dispositivo (T_DEVICE)",
            "Que ocupa 3 blocos",
            "Que é o terceiro arquivo do diretório"
          ],
          correta: 1,
          dica: "Em kernel/stat.h: T_DIR 1, T_FILE 2, T_DEVICE 3.",
          explicacao: "O ls do xv6 mostra nome, tipo, i-node e tamanho. O console é o dispositivo do terminal: escrever nele é escrever na tela."
        }
      ]
    },

    // ================================================== FASE 4.2 — Uso de arquivos
    {
      id: "a42",
      etapa: "4.2",
      titulo: "Uso de arquivos",
      descricao: "Interface, descritores, acesso e permissões",
      icone: "🔑",
      xv6: {
        titulo: "O descritor é um índice",
        arquivo: "kernel/proc.h, kernel/file.h e kernel/sysfile.c",
        codigo: `struct proc {
  ...
  struct file *ofile[NOFILE];  // arquivos abertos (NOFILE = 16)
  struct inode *cwd;           // diretório de trabalho
};

struct file {
  enum { FD_NONE, FD_PIPE, FD_INODE, FD_DEVICE } type;
  int ref;          // quantos descritores apontam para ele
  char readable;
  char writable;
  struct inode *ip;
  uint off;         // posição corrente
};

// fdalloc(): devolve o MENOR descritor livre
for(fd = 0; fd < NOFILE; fd++){
  if(p->ofile[fd] == 0){
    p->ofile[fd] = f;
    return fd;
  }
}`,
        texto: "O descritor que o <code>open()</code> devolve é só um <b>índice</b> na tabela de arquivos abertos do processo. A <code>struct file</code> guarda o modo de abertura e a <b>posição corrente</b> (<code>off</code>), que avança a cada <code>read</code> e <code>write</code>."
      },
      linux: {
        titulo: "Os descritores do seu shell",
        comando: "ls -l /proc/$$/fd",
        saida: `lrwx------ 1 pedro pedro 64 Oct 30 21:28 0 -> /dev/pts/0
lrwx------ 1 pedro pedro 64 Oct 30 21:28 1 -> /dev/pts/0
lrwx------ 1 pedro pedro 64 Oct 30 21:28 2 -> /dev/pts/0
lrwx------ 1 pedro pedro 64 Oct 30 21:28 255 -> /dev/pts/0`,
        texto: "Os descritores 0, 1 e 2 (entrada, saída e erro padrão) apontam para o terminal <code>/dev/pts/0</code>, um arquivo especial. O bash guarda uma cópia extra no 255."
      },
      man: [
        { termo: "descritor de arquivo", secao: "7", resumo: "a referência a um arquivo aberto por um processo",
          detalhe: "De baixo nível: criado pelo núcleo na abertura; no UNIX é um inteiro (0 = stdin, 1 = stdout, 2 = stderr), no Windows um handle. De alto nível: a referência da linguagem (FILE* em C, streams em Java), que envolve o de baixo nível e acrescenta buffers. As bibliotecas fazem o mapeamento, o que torna as aplicações portáveis.",
          veja: ["open(2)", "FILE(3)"] },
        { termo: "open", secao: "2", resumo: "abre um arquivo e devolve um descritor (o menor livre)",
          detalhe: "O núcleo resolve o caminho, verifica as permissões, cria as estruturas do arquivo aberto (posição corrente, modo) e devolve o descritor. close() conclui escritas pendentes e libera essas estruturas.",
          exemplo: "int fd = open(\"dados.txt\", O_RDONLY);\nread(fd, buf, 100);\nclose(fd);",
          veja: ["descritor de arquivo(7)", "lseek(2)"] },
        { termo: "FILE", secao: "3", resumo: "a referência de alto nível da biblioteca C (fopen, fread, fprintf, fclose)",
          detalhe: "Internamente, fopen chama open, fread chama read, e assim por diante. No Windows, as chamadas equivalentes são CreateFile, ReadFile, WriteFile e CloseHandle.",
          veja: ["descritor de arquivo(7)"] },
        { termo: "lseek", secao: "2", resumo: "muda a posição corrente do arquivo: acesso aleatório (direto)",
          exemplo: "lseek(fd, 1000 * sizeof(reg), SEEK_SET);",
          veja: ["formas de acesso(7)"] },
        { termo: "formas de acesso", secao: "7", resumo: "sequencial, aleatório, mapeado em memória e indexado",
          detalhe: "Sequencial: do início ao fim (textos, logs, mídia). Aleatório: qualquer posição com lseek (bancos de dados, registros fixos). Mapeado: o arquivo vira uma região de memória com mmap (executáveis, bibliotecas). Indexado: por chave, com um índice (SGBDs).",
          veja: ["lseek(2)", "mmap(2)"] },
        { termo: "mmap", secao: "2", resumo: "mapeia um arquivo numa região do espaço de endereçamento",
          detalhe: "Ler e escrever nessa memória lê e escreve no arquivo, usando o mecanismo de paginação. É assim que o Linux carrega executáveis e bibliotecas.",
          veja: ["formas de acesso(7)"] },
        { termo: "trava", secao: "7", resumo: "lock de arquivo: evita condições de disputa entre processos",
          detalhe: "Obrigatórias ou consultivas (advisory); compartilhadas (leitura) ou exclusivas (escrita). No Linux: flock e fcntl.",
          veja: ["condição de disputa(7)"] },
        { termo: "permissões", secao: "7", resumo: "rwx para dono (u), grupo (g) e outros (o)",
          detalhe: "r = ler, w = escrever, x = executar. São verificadas na abertura: o processo mantém o acesso enquanto o arquivo estiver aberto, mesmo que as permissões mudem. O Windows usa ACLs.",
          exemplo: "-rwxr-x---  dono: rwx · grupo: r-x · outros: nada",
          veja: ["open(2)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Dois níveis de interface",
          texto: `<ul>
              <li><b>Baixo nível</b>: as <b>chamadas de sistema</b> do SO, porque os arquivos são abstrações mantidas pelo núcleo.</li>
              <li><b>Alto nível</b>: as funções da linguagem, que internamente chamam as de baixo nível.</li>
            </ul>
            <table class="tabela">
              <tr><th>Operação</th><th>C (alto nível)</th><th>Linux/POSIX</th><th>Windows</th></tr>
              <tr><td>Abrir</td><td><code>fopen</code></td><td><code>open</code></td><td><code>CreateFile</code></td></tr>
              <tr><td>Ler</td><td><code>fread</code></td><td><code>read</code></td><td><code>ReadFile</code></td></tr>
              <tr><td>Escrever</td><td><code>fwrite</code></td><td><code>write</code></td><td><code>WriteFile</code></td></tr>
              <tr><td>Posicionar</td><td><code>fseek</code></td><td><code>lseek</code></td><td><code>SetFilePointer</code></td></tr>
              <tr><td>Fechar</td><td><code>fclose</code></td><td><code>close</code></td><td><code>CloseHandle</code></td></tr>
              <tr><td>Remover</td><td><code>remove</code></td><td><code>unlink</code></td><td><code>DeleteFile</code></td></tr>
            </table>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada função da biblioteca C à chamada de sistema POSIX que ela usa.",
          pares: [
            ["fopen", "open"],
            ["fread", "read"],
            ["fseek", "lseek"],
            ["remove", "unlink"]
          ],
          dica: "Remover um arquivo, no UNIX, é desfazer um link.",
          explicacao: "As funções de alto nível acrescentam buffers e formatação, mas por baixo chamam o núcleo. remove usa unlink porque, no UNIX, apagar é retirar um nome (link) do i-node."
        },
        {
          tipo: "multipla",
          pergunta: "open, read e write pertencem a qual nível?",
          opcoes: ["Baixo nível: chamadas de sistema", "Alto nível: biblioteca da linguagem", "Hardware", "Shell"],
          correta: 0,
          dica: "Quem mantém os arquivos é o núcleo.",
          explicacao: "São chamadas de sistema POSIX. fopen, fread e fwrite são as versões de alto nível da biblioteca C."
        },
        {
          tipo: "conceito",
          titulo: "Descritores, abertura e fechamento",
          texto: `<p>O <b>descritor</b> representa um arquivo <b>em uso por um processo</b>, criado na abertura:</p>
            <ul>
              <li><b>Baixo nível</b>: no UNIX, um <b>inteiro</b>, índice na tabela de arquivos abertos do processo
                (<b>0</b> = entrada, <b>1</b> = saída, <b>2</b> = erro); no Windows, um <b>handle</b>.</li>
              <li><b>Alto nível</b>: <code>FILE*</code> em C, streams em Java, que envolvem o descritor e acrescentam buffers.</li>
            </ul>
            <p>Na <b>abertura</b>, o núcleo resolve o caminho, verifica as permissões, cria as estruturas do arquivo aberto (com a
            <b>posição corrente</b>) e devolve o descritor. No <b>fechamento</b>, conclui as escritas pendentes e libera essas estruturas.</p>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada descritor padrão ao que ele representa.",
          pares: [
            ["0", "Entrada padrão (stdin)"],
            ["1", "Saída padrão (stdout)"],
            ["2", "Saída de erro (stderr)"]
          ],
          dica: "O 2> do shell redireciona os erros.",
          explicacao: "Todo processo nasce com esses três abertos, em geral apontando para o terminal."
        },
        {
          tipo: "multipla",
          pergunta: "Um processo tem os descritores 0, 1 e 2 abertos e chama open(\"dados.txt\", O_RDONLY). Que descritor ele recebe?",
          opcoes: ["0", "3", "4", "Um número aleatório"],
          correta: 1,
          dica: "Veja o fdalloc() do xv6.",
          explicacao: "O núcleo devolve o menor descritor livre: 3. Por isso, fechar o 1 e abrir um arquivo logo em seguida redireciona a saída para ele (é assim que o shell faz o >)."
        },
        {
          tipo: "multipla",
          pergunta: "O que o fechamento de um arquivo garante?",
          opcoes: [
            "Que o arquivo seja apagado",
            "Que as escritas pendentes sejam concluídas e as estruturas do núcleo sejam liberadas",
            "Que ninguém mais consiga abri-lo",
            "Que o arquivo vá para o fim do disco"
          ],
          correta: 1,
          dica: "O que foi criado na abertura precisa ser desfeito.",
          explicacao: "close() termina o que estava pendente e libera a entrada na tabela de arquivos abertos e as estruturas do núcleo."
        },
        {
          tipo: "conceito",
          titulo: "Formas de acesso",
          texto: `<ul>
              <li><b>Sequencial</b>: do início ao fim, com um ponteiro de posição que avança. Textos, logs, mídia.</li>
              <li><b>Aleatório (direto)</b>: qualquer posição, usando <code>lseek</code>/<code>fseek</code>. Bancos de dados, registros de tamanho fixo.</li>
              <li><b>Mapeado em memória</b>: o arquivo vira uma região do espaço de endereçamento (<code>mmap</code>). Executáveis e bibliotecas.</li>
              <li><b>Indexado</b>: por <b>chave</b>, com um índice. Comum em mainframes; hoje feito por SGBDs.</li>
            </ul>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada forma de acesso ao uso mais adequado.",
          pares: [
            ["Sequencial", "Ler um arquivo de log do início ao fim"],
            ["Aleatório", "Ler o registro nº 1000 de tamanho fixo"],
            ["Mapeado em memória", "Carregar uma biblioteca compartilhada"],
            ["Indexado", "Buscar um cliente pelo CPF numa base"]
          ],
          dica: "Só uma delas transforma o arquivo em memória.",
          explicacao: "Cada forma atende um padrão de uso: em ordem, por posição, como memória ou por chave."
        },
        {
          tipo: "conceito",
          titulo: "Compartilhamento e controle de acesso",
          texto: `<p>Vários processos podem abrir o mesmo arquivo; <b>travas</b> (<code>flock</code>, <code>fcntl</code>) evitam condições de disputa.</p>
            <p>O controle de acesso é feito <b>na abertura</b>: depois de aberto, o processo mantém o acesso <b>enquanto o arquivo estiver aberto</b>,
            mesmo que as permissões mudem.</p>
            <p>No UNIX, as permissões são <b>r</b> (ler), <b>w</b> (escrever) e <b>x</b> (executar) para <b>dono</b>, <b>grupo</b> e
            <b>outros</b>: <code>-rwxr-x---</code>. O Windows usa <b>ACLs</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Um processo abriu um arquivo para leitura. Depois, o dono retirou a permissão de leitura. O processo ainda consegue ler?",
          opcoes: [
            "Não, a leitura falha na hora",
            "Sim, enquanto mantiver o arquivo aberto, porque a verificação é feita na abertura",
            "Só se for root",
            "O arquivo é fechado automaticamente"
          ],
          correta: 1,
          dica: "Quando o SO verifica as permissões?",
          explicacao: "As permissões são checadas no open(). Uma vez aberto, o descritor continua válido até o close()."
        },
        {
          tipo: "multipla",
          pergunta: "Um arquivo tem as permissões -rwxr-x---. O que um usuário do grupo pode fazer?",
          opcoes: ["Ler, escrever e executar", "Ler e executar", "Só ler", "Nada"],
          correta: 1,
          dica: "Divida em três blocos de três letras: dono, grupo, outros.",
          explicacao: "rwx (dono) · r-x (grupo) · --- (outros): o grupo pode ler e executar, mas não escrever; os outros não têm acesso."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Liste os descritores de arquivo abertos pelo seu shell, vendo para onde cada um aponta.",
          aceitar: ["ls -\\S*l\\S* /proc/(\\$\\$|self|\\d+)/fd/?", "ls -\\S*l\\S* /dev/fd/?"],
          saida: `lrwx------ 1 pedro pedro 64 Oct 30 21:28 0 -> /dev/pts/0
lrwx------ 1 pedro pedro 64 Oct 30 21:28 1 -> /dev/pts/0
lrwx------ 1 pedro pedro 64 Oct 30 21:28 2 -> /dev/pts/0
lrwx------ 1 pedro pedro 64 Oct 30 21:28 255 -> /dev/pts/0`,
          neutros: [
            { re: "ls /proc/(\\$\\$|self|\\d+)/fd/?", saida: "0  1  2  255", nota: "Esses são os números dos descritores. Use o formato longo para ver para onde cada um aponta." },
            { re: "ls (-\\S+ )?/proc/(\\$\\$|self|\\d+)/?", nota: "Quase lá: dentro desse diretório há um subdiretório só com os descritores (fd)." },
            { re: "lsof( .*)?", nota: "O lsof também funciona, mas aqui use o diretório que o /proc cria para cada processo." }
          ],
          dica: "O /proc tem um diretório por processo; $$ é o PID do shell. Lá dentro, procure fd e use ls -l.",
          explicacao: "Os descritores 0, 1 e 2 apontam para o terminal /dev/pts/0. Cada um é um link para o arquivo aberto, e isso também vale para arquivos comuns, pipes e sockets."
        }
      ]
    },

    // ================================================== FASE 4.3A — Sistemas de arquivos
    {
      id: "a43a",
      etapa: "4.3 A",
      titulo: "Sistemas de arquivos",
      descricao: "Camadas, volumes, blocos, cache e falhas",
      icone: "🗄",
      xv6: {
        titulo: "O disco do xv6 e o journaling",
        arquivo: "kernel/fs.h e kernel/log.c",
        codigo: `#define BSIZE 1024  // tamanho do bloco

// Disk layout:
// [ boot block | super block | log | inode blocks |
//                                   free bit map | data blocks ]

// commit(): grava uma transação de forma segura
if (log.lh.n > 0) {
  write_log();      // 1) copia os blocos alterados para a área de log
  write_head();     // 2) grava o cabeçalho: ESTE é o commit de verdade
  install_trans(0); // 3) copia do log para os lugares definitivos
  log.lh.n = 0;
  write_head();     // 4) apaga a transação do log
}`,
        texto: "O xv6 tem <b>journaling</b>: toda alteração passa antes pela área de <b>log</b>. Se o sistema cair depois do passo 2, o <code>recover_from_log()</code> refaz a transação no boot; se cair antes, ela é descartada. O espaço livre é controlado por um <b>mapa de bits</b>."
      },
      linux: {
        titulo: "Um volume Ext4",
        comando: "sudo dumpe2fs -h /dev/sdb1",
        saida: `Filesystem volume name:   dados
Filesystem features:      has_journal ext_attr resize_inode dir_index filetype extent 64bit flex_bg sparse_super large_file huge_file dir_nlink extra_isize metadata_csum
Inode count:              16384
Block count:              16384
Block size:               4096
Inode size:	          256`,
        texto: "<code>has_journal</code> é o journaling, <code>extent</code> é a alocação por extensões, <code>metadata_csum</code> é o checksum dos metadados e <code>dir_index</code> é a busca em diretórios por hash. O bloco lógico tem 4 KB."
      },
      man: [
        { termo: "sistema de arquivos", secao: "7", resumo: "a parte do SO que implementa arquivos e diretórios sobre o armazenamento bruto",
          detalhe: "Camadas: dispositivo → controlador → driver → gerência de blocos e cache → sistema de arquivos específico (Ext4, NTFS, FAT) → VFS → chamadas de sistema → bibliotecas → aplicação.",
          veja: ["VFS(7)", "bloco(7)"] },
        { termo: "VFS", secao: "7", resumo: "Virtual File System: camada que unifica os diferentes sistemas de arquivos",
          detalhe: "As chamadas de sistema (open, read…) falam com o VFS, que repassa para o Ext4, o NTFS, o FAT ou o /proc. Por isso o mesmo cat funciona em todos.",
          veja: ["sistema de arquivos(7)"] },
        { termo: "montagem", secao: "7", resumo: "ligar um volume formatado a um ponto de acesso",
          detalhe: "Lê o bloco de inicialização (VBR) e cria as estruturas em memória. No UNIX, o volume vira um diretório da árvore única; no Windows, uma letra de unidade (C:, D:).",
          exemplo: "mount /dev/sdb1 /mnt/pendrive\ndf -T",
          veja: ["sistema de arquivos(7)", "VFS(7)"] },
        { termo: "bloco", secao: "7", resumo: "a unidade mínima de alocação do sistema de arquivos",
          detalhe: "Blocos lógicos (clusters) agrupam setores físicos de 512 B ou 4 KB. Blocos grandes dão mais desempenho de E/S, mas mais fragmentação interna: um arquivo de 200 B ocupa um bloco inteiro.",
          veja: ["cache de blocos(7)", "fragmentação interna(7)"] },
        { termo: "cache de blocos", secao: "7", resumo: "blocos do disco guardados na RAM",
          detalhe: "Read-through: guarda o que foi lido. Read-ahead: lê adiantado os próximos. Write-through: grava no disco na hora (seguro). Write-back: grava depois (rápido, mas pode perder dados num crash). Em geral: dados em write-back, metadados em write-through.",
          veja: ["bloco(7)", "journaling(7)"] },
        { termo: "journaling", secao: "7", resumo: "registrar as alterações num log antes de aplicá-las",
          detalhe: "Depois de um crash, o SO completa ou descarta as operações do journal, sem precisar verificar o disco inteiro (fsck). Em geral cobre só os metadados. Ext4, NTFS e o xv6 usam.",
          veja: ["copy-on-write(7)", "fsck(8)"] },
        { termo: "copy-on-write", secao: "7", resumo: "escrever o conteúdo novo num bloco livre, preservando o antigo",
          detalhe: "Permite snapshots e, após um crash, voltar ao último estado consistente. Usado no ZFS e no BTRFS. (A mesma ideia aparece no fork() com copy-on-write da memória.)",
          veja: ["journaling(7)"] },
        { termo: "fsck", secao: "8", resumo: "verifica e corrige um sistema de arquivos (chkdsk no Windows)",
          detalhe: "Percorre todas as estruturas; em discos grandes pode levar horas. O journaling torna isso raro.",
          veja: ["journaling(7)"] },
        { termo: "mapa de bits", secao: "7", resumo: "1 bit por bloco indicando se está livre ou ocupado",
          detalhe: "Simples e compacto. Outras formas de controlar o espaço livre: lista de blocos livres, tabela de extensões livres ou a própria FAT.",
          veja: ["bloco(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Sistemas de arquivos em camadas",
          texto: `<p>O <b>sistema de arquivos</b> implementa o conceito de arquivo sobre o armazenamento bruto, em camadas:</p>
            <pre class="terminal">aplicação → bibliotecas de E/S → chamadas de sistema → VFS
→ sistema de arquivos (Ext4, NTFS, FAT) → cache de blocos
→ driver → controlador → dispositivo</pre>
            <p>Ele guarda <b>dados</b> (o conteúdo) e <b>metadados</b> (atributos e a localização do conteúdo; o mapa de blocos livres também é metadado).</p>`
        },
        {
          tipo: "ordenar",
          pergunta: "Ordene as camadas, da aplicação até o hardware.",
          itens: ["Aplicação", "Chamadas de sistema", "VFS (sistema de arquivos virtual)", "Sistema de arquivos específico (Ext4)", "Driver de dispositivo", "Disco ou SSD"],
          dica: "O VFS fica entre as chamadas de sistema e o Ext4.",
          explicacao: "A aplicação chama o núcleo; o VFS repassa ao sistema de arquivos certo; este fala com o driver, que comanda o dispositivo."
        },
        {
          tipo: "conceito",
          titulo: "Discos, partições e montagem",
          texto: `<p>O disco é visto como um <b>grande vetor de blocos</b>. O <b>MBR</b> (no primeiro bloco) guarda a tabela de partições
            e o código de boot (discos modernos usam <b>GPT</b>); cada partição tem um <b>VBR</b>. Cada <b>volume</b> é formatado com seu próprio sistema de arquivos.</p>
            <p><b>Montar</b> é ler o bloco de inicialização, criar as estruturas em memória e definir um ponto de acesso:</p>
            <ul>
              <li><b>UNIX</b>: o volume vira um <b>diretório</b> da árvore única (<code>mount /dev/sdb1 /mnt/pendrive</code>).</li>
              <li><b>Windows</b>: o volume vira um <b>disco lógico</b> (C:, D:).</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "No UNIX, o que acontece ao montar um volume?",
          opcoes: [
            "Ele ganha uma letra, como D:",
            "Ele é ligado a um diretório da árvore única",
            "Ele é formatado",
            "Ele é copiado para a RAM"
          ],
          correta: 1,
          dica: "No UNIX só existe uma raiz: /.",
          explicacao: "O conteúdo do volume passa a aparecer sob o ponto de montagem (por exemplo, /mnt/pendrive), dentro da mesma árvore de diretórios."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Veja os sistemas de arquivos montados, com o tipo de cada um.",
          aceitar: ["df -\\S*T\\S*( .*)?", "mount( .*)?", "findmnt( .*)?", "lsblk -\\S*f\\S*( .*)?", "cat /proc/mounts"],
          saida: `Filesystem     Type     1K-blocks     Used Available Use% Mounted on
/dev/sda2      ext4     264212084 12424812  238288736   5% /
tmpfs          tmpfs      4053456        0    4053456   0% /dev/shm
/dev/sda1      vfat        523248     6220     517028   2% /boot/efi
/dev/sdb1      ext4         59876       24      55852   1% /mnt/dados`,
          neutros: [
            { re: "df( -h)?", saida: "Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/sda2      264212084 12424812  238288736   5% /", nota: "Faltou a coluna com o tipo do sistema de arquivos (opção T)." },
            { re: "ls( .*)?", nota: "O ls lista arquivos, não os volumes montados." }
          ],
          dica: "O df mostra os volumes; uma opção acrescenta a coluna Type.",
          explicacao: "Cada volume aparece com seu tipo e seu ponto de montagem: a raiz em ext4, a partição de boot em vfat (FAT32) e o pendrive montado em /mnt/dados."
        },
        {
          tipo: "conceito",
          titulo: "Blocos e cache",
          texto: `<p>Setores físicos (512 B ou 4 KB) são agrupados em <b>blocos lógicos</b>, a <b>unidade mínima de alocação</b>.
            Blocos grandes melhoram a E/S, mas aumentam a fragmentação interna.</p>
            <ul>
              <li><b>Read-through</b>: o que foi lido fica no cache.</li>
              <li><b>Read-ahead</b>: lê antecipadamente os próximos blocos.</li>
              <li><b>Write-through</b>: grava no disco na hora; seguro, sem ganho na escrita.</li>
              <li><b>Write-back</b>: grava no cache e libera o processo; rápido, mas pode <b>perder dados num crash</b>.</li>
            </ul>
            <p>Em geral, <b>dados usam write-back</b> e <b>metadados usam write-through</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Um arquivo de 200 bytes num sistema com blocos de 4 KB (4.096 B) desperdiça quanto espaço?",
          opcoes: ["0 B", "200 B", "3.896 B", "4.096 B"],
          correta: 2,
          dica: "O bloco é a unidade mínima de alocação.",
          explicacao: "Ele ocupa um bloco inteiro: 4.096 − 200 = 3.896 B de fragmentação interna."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada política de cache ao seu comportamento.",
          pares: [
            ["Read-ahead", "Lê antecipadamente os próximos blocos"],
            ["Write-through", "Grava no disco imediatamente"],
            ["Write-back", "Grava depois; rápido, mas arrisca dados num crash"],
            ["Read-through", "Guarda no cache o que foi lido"]
          ],
          dica: "Through = passa direto; back = deixa para depois.",
          explicacao: "Leituras se beneficiam de guardar e antecipar; nas escritas, há um compromisso entre desempenho (write-back) e segurança (write-through)."
        },
        {
          tipo: "conceito",
          titulo: "Espaço livre e falhas",
          texto: `<p><b>Espaço livre</b>: mapa de bits (1 bit por bloco), lista de blocos livres, tabela de extensões livres ou a própria FAT.</p>
            <p><b>Falhas</b>: criar um arquivo exige várias escritas (mapa de i-nodes, i-node, diretório). Um crash no meio deixa o sistema <b>inconsistente</b>.</p>
            <ul>
              <li><b>Verificação</b> (<code>fsck</code>, <code>chkdsk</code>): percorre tudo e corrige; pode levar <b>horas</b>.</li>
              <li><b>Journaling</b>: registra as alterações num <b>log antes</b> de aplicá-las; após o crash, completa ou descarta as pendentes.</li>
              <li><b>Copy-on-write</b>: escreve o novo conteúdo num bloco livre e mantém <b>snapshots</b> (ZFS, BTRFS).</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "O que o journaling registra antes de alterar o disco?",
          opcoes: [
            "Uma cópia de todo o disco",
            "As operações pendentes (em geral, as de metadados) num log",
            "A lista de usuários conectados",
            "Os blocos livres"
          ],
          correta: 1,
          dica: "Journal = diário.",
          explicacao: "Com a operação registrada no log antes, o SO sabe o que estava fazendo quando caiu e pode completar ou descartar, sem verificar o disco inteiro."
        },
        {
          tipo: "multipla",
          pergunta: "Quais sistemas de arquivos usam copy-on-write?",
          opcoes: ["FAT32 e exFAT", "ZFS e BTRFS", "ISO 9660", "Ext2"],
          correta: 1,
          dica: "Os dois têm snapshots.",
          explicacao: "ZFS e BTRFS nunca sobrescrevem dados no lugar: escrevem em blocos livres, o que permite snapshots e recuperação para o último estado consistente."
        },
        {
          tipo: "multipla",
          pergunta: "No commit() do xv6, o sistema cai logo depois de write_head() gravar o cabeçalho do log. O que acontece no próximo boot?",
          opcoes: [
            "A transação se perde",
            "O recover_from_log() copia os blocos do log para os lugares definitivos: a transação é concluída",
            "O disco precisa ser formatado",
            "O fsck apaga os arquivos novos"
          ],
          correta: 1,
          dica: "O comentário diz que gravar o cabeçalho é \"o commit de verdade\".",
          explicacao: "Com o cabeçalho gravado, a transação está confirmada: no boot, o xv6 a reinstala a partir do log (install_trans). Se o crash fosse antes do write_head(), a transação seria descartada inteira."
        }
      ]
    },

    // ================================================== FASE 4.3B — Alocação de arquivos
    {
      id: "a43b",
      etapa: "4.3 B",
      titulo: "Alocação de arquivos",
      descricao: "Contígua, encadeada, FAT, i-nodes e extensões",
      icone: "🧱",
      xv6: {
        titulo: "O i-node do xv6",
        arquivo: "kernel/fs.h e kernel/fs.c",
        codigo: `#define NDIRECT 12
#define NINDIRECT (BSIZE / sizeof(uint))   // 1024 / 4 = 256
#define MAXFILE (NDIRECT + NINDIRECT)      // 268 blocos

struct dinode {
  short type;
  short nlink;
  uint size;
  uint addrs[NDIRECT+1];   // 12 diretos + 1 indireto
};

// bmap(): qual bloco do disco guarda o bloco bn do arquivo?
if(bn < NDIRECT)
  return ip->addrs[bn];          // ponteiro direto
bn -= NDIRECT;
bp = bread(ip->dev, ip->addrs[NDIRECT]);   // lê o bloco de índice
a = (uint*)bp->data;
return a[bn];                    // ponteiro indireto`,
        texto: "O xv6 usa <b>alocação indexada</b> com 12 ponteiros diretos e 1 indireto (sem duplo e triplo). Com blocos de 1 KB, o maior arquivo possível tem 268 blocos: <b>268 KB</b>. O Ext2/3 tem a mesma ideia, com mais níveis."
      },
      linux: {
        titulo: "Extensões no Ext4",
        comando: "sudo debugfs -R \"stat grande.bin\" /dev/sdb1",
        saida: `Inode: 12   Type: regular    Mode:  0644   Flags: 0x80000
User:  1000   Group:  1000   Size: 20971520
Links: 1   Blockcount: 40960
EXTENTS:
(0-5119):2065-7184`,
        texto: "Um arquivo de 20 MB = 5.120 blocos de 4 KB, guardado numa <b>única extensão</b>: os blocos lógicos 0 a 5119 estão nos blocos físicos 2065 a 7184. Em vez de 5.120 ponteiros, o i-node guarda um trio (início lógico, início físico, quantidade). A flag 0x80000 indica que o i-node usa extensões."
      },
      man: [
        { termo: "alocação contígua", secao: "7", resumo: "o arquivo ocupa blocos consecutivos",
          detalhe: "Basta guardar o primeiro bloco e o tamanho. Acesso sequencial e aleatório rápidos e boa robustez, mas é difícil crescer e há fragmentação externa. Usada no ISO 9660 (CD-ROM).",
          veja: ["extensão(7)"] },
        { termo: "alocação encadeada", secao: "7", resumo: "cada bloco guarda dados e um ponteiro para o próximo",
          detalhe: "Sem fragmentação externa e o arquivo cresce livremente, mas o acesso aleatório é lento (para o bloco n é preciso ler os n − 1 anteriores) e um bloco defeituoso perde o resto do arquivo.",
          veja: ["FAT(7)"] },
        { termo: "FAT", secao: "7", resumo: "File Allocation Table: os ponteiros da alocação encadeada numa tabela",
          detalhe: "A tabela fica em memória, o que acelera o acesso aleatório. É um dado crítico, por isso há cópias. Usada em FAT12/16/32, pendrives e câmeras; também marca os blocos livres.",
          veja: ["alocação encadeada(7)"] },
        { termo: "i-node", secao: "7", resumo: "estrutura com os atributos de um arquivo e o índice dos seus blocos",
          detalhe: "No Ext2/3/4: 12 ponteiros diretos, 1 indireto, 1 duplo e 1 triplo. Com blocos de 4 KB e ponteiros de 4 B: 48 KB diretos, 4 MB pelo indireto, 4 GB pelo duplo e 4 TB pelo triplo. O nome do arquivo não fica no i-node, e sim no diretório.",
          exemplo: "ls -i hello.c\nstat hello.c",
          veja: ["alocação indexada(7)", "hard link(7)"] },
        { termo: "alocação indexada", secao: "7", resumo: "um índice (no i-node) aponta para os blocos do arquivo",
          detalhe: "Acesso sequencial e aleatório rápidos. O índice simples limita o tamanho do arquivo; a versão multinível usa ponteiros indiretos para arquivos enormes, ao custo de até 3 leituras extras.",
          veja: ["i-node(7)", "extensão(7)"] },
        { termo: "extensão", secao: "7", resumo: "extent: grupo de blocos contíguos descrito por (início lógico, início físico, quantidade)",
          detalhe: "Junta a economia da alocação contígua com a flexibilidade da indexada. Usada em NTFS, HFS, Ext4 e ZFS.",
          exemplo: "filefrag -v grande.bin",
          veja: ["alocação contígua(7)", "alocação indexada(7)"] },
        { termo: "Ext4", secao: "7", resumo: "o sistema de arquivos mais usado no Linux",
          detalhe: "Journaling, checksum de metadados, alocação indexada multinível e por extensões, bitmaps de blocos e de i-nodes. O volume é dividido em grupos de blocos, cada um com cópia do superbloco, descritores, bitmaps, tabela de i-nodes e blocos de dados.",
          veja: ["journaling(7)", "extensão(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Contígua, encadeada e FAT",
          texto: `<p>Como dispor o conteúdo nos blocos? Critérios: <b>rapidez</b>, <b>robustez</b> e <b>flexibilidade</b>.</p>
            <ul>
              <li><b>Contígua</b>: blocos consecutivos; basta o primeiro bloco e o tamanho. Rápida e robusta, mas difícil de crescer e com fragmentação externa (ISO 9660).</li>
              <li><b>Encadeada simples</b>: cada bloco aponta para o próximo. Cresce à vontade, mas o acesso aleatório é lento e um bloco defeituoso perde o resto.</li>
              <li><b>FAT</b>: os ponteiros vão para uma <b>tabela</b> em memória; acesso aleatório mais rápido, mas a tabela é crítica (FAT12/16/32, pendrives).</li>
            </ul>`
        },
        {
          tipo: "multipla",
          pergunta: "Em qual alocação é preciso ler n − 1 blocos para chegar ao bloco n?",
          opcoes: ["Contígua", "Encadeada simples", "Indexada", "Extensões"],
          correta: 1,
          dica: "O endereço de cada bloco está dentro do bloco anterior.",
          explicacao: "Na encadeada simples, só dá para descobrir onde está o bloco n lendo a corrente desde o início. A FAT resolve isso levando os ponteiros para uma tabela em memória."
        },
        {
          tipo: "multipla",
          pergunta: "CD-ROMs (ISO 9660) usam qual alocação, e por que ela faz sentido ali?",
          opcoes: [
            "Encadeada, porque os arquivos crescem",
            "Contígua: o disco é gravado uma vez, então a dificuldade de crescer não importa",
            "FAT, porque é compatível com Windows",
            "Indexada multinível, por causa dos arquivos grandes"
          ],
          correta: 1,
          dica: "Arquivos num CD nunca mudam de tamanho.",
          explicacao: "A desvantagem da contígua é crescer e fragmentar. Num meio somente leitura isso não acontece, e sobram as vantagens: acesso rápido e simplicidade."
        },
        {
          tipo: "conceito",
          titulo: "Indexada, multinível e extensões",
          texto: `<ul>
              <li><b>Indexada</b>: cada arquivo tem um <b>i-node</b> com os atributos e um índice de blocos. O tamanho fixo do i-node limita o arquivo, e a tabela de i-nodes limita o número de arquivos.</li>
              <li><b>Multinível</b>: ponteiros <b>indiretos</b> apontam para blocos cheios de ponteiros. No Ext2/3/4: <b>12 diretos, 1 indireto, 1 duplo e 1 triplo</b>.</li>
              <li><b>Extensões</b>: grupos de blocos contíguos descritos por (início lógico, início físico, quantidade). NTFS, HFS, Ext4 e ZFS.</li>
            </ul>
            <pre class="terminal">blocos de 4 KB, ponteiros de 4 B → 1024 ponteiros por bloco
12 diretos  = 12 × 4 KB       = 48 KB
1 indireto  = 1024 × 4 KB     = 4 MB
1 duplo     = 1024² × 4 KB    = 4 GB
1 triplo    = 1024³ × 4 KB    = 4 TB</pre>`
        },
        {
          tipo: "multipla",
          pergunta: "Quantos ponteiros diretos o i-node do Ext2/3/4 tem?",
          opcoes: ["8", "12", "15", "1024"],
          correta: 1,
          dica: "São 15 ponteiros no total, contando os indiretos.",
          explicacao: "12 diretos + 1 indireto + 1 duplo indireto + 1 triplo indireto = 15. Arquivos pequenos (até 48 KB com blocos de 4 KB) só usam os diretos."
        },
        {
          tipo: "multipla",
          pergunta: "Com blocos de 4 KB, um arquivo de 1 MB no Ext2/3 precisa usar quais ponteiros?",
          opcoes: [
            "Só os diretos",
            "Os diretos e o indireto simples",
            "Até o duplo indireto",
            "Até o triplo indireto"
          ],
          correta: 1,
          dica: "Os diretos cobrem 48 KB; o indireto, mais 4 MB.",
          explicacao: "1 MB passa dos 48 KB dos diretos, mas cabe nos 48 KB + 4 MB alcançados com o indireto simples. Cada acesso além dos 48 KB custa uma leitura extra (o bloco de índice)."
        },
        {
          tipo: "multipla",
          pergunta: "Qual é o maior arquivo possível no xv6 (blocos de 1 KB, 12 ponteiros diretos e 1 indireto com 256 ponteiros)?",
          opcoes: ["12 KB", "256 KB", "268 KB", "4 GB"],
          correta: 2,
          dica: "12 + 256 blocos de 1 KB.",
          explicacao: "MAXFILE = NDIRECT + NINDIRECT = 12 + 256 = 268 blocos de 1 KB = 268 KB. Um dos labs clássicos do xv6 acrescenta o ponteiro duplo indireto para passar desse limite."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada estratégia de alocação à sua característica marcante.",
          pares: [
            ["Contígua", "Rápida, mas difícil de crescer"],
            ["Encadeada simples", "Acesso aleatório lento"],
            ["FAT", "Ponteiros numa tabela crítica em memória"],
            ["Indexada multinível", "Ponteiros indiretos para arquivos enormes"],
            ["Extensões", "Trios (lógico, físico, quantidade)"]
          ],
          dica: "Comece pelas que você já conhece pelo nome.",
          explicacao: "Cada estratégia equilibra de um jeito rapidez, robustez e flexibilidade. Os sistemas modernos (Ext4, NTFS) combinam índice com extensões."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "O arquivo grande.bin tem 20 MB. Descubra em quantas extensões ele está guardado no disco.",
          aceitar: ["filefrag( -\\S+)* grande\\.bin"],
          saida: `Filesystem type is: ef53
File size of grande.bin is 20971520 (5120 blocks of 4096 bytes)
 ext:     logical_offset:        physical_offset: length:   expected: flags:
   0:        0..    5119:    3164160..   3169279:   5120:             last,eof
grande.bin: 1 extent found`,
          neutros: [
            { re: "stat( -\\S+)* grande\\.bin", saida: "  File: grande.bin\n  Size: 20971520  	Blocks: 40960      IO Block: 4096   regular file", nota: "O stat mostra o tamanho e os blocos, mas não como eles estão agrupados no disco. Existe um comando que mede a fragmentação de um arquivo." },
            { re: "ls( .*)?", nota: "O ls mostra o tamanho, não a disposição dos blocos." }
          ],
          dica: "O comando mede a fragmentação de um arquivo (file + frag).",
          explicacao: "Os 5.120 blocos estão numa única extensão contígua: o Ext4 descreve o arquivo inteiro com um só trio. Num disco fragmentado, apareceriam várias extensões."
        },
        {
          tipo: "multipla",
          pergunta: "O que o Ext4 guarda para descrever uma extensão?",
          opcoes: [
            "Um ponteiro para cada bloco",
            "O bloco lógico inicial, o bloco físico inicial e a quantidade de blocos",
            "Só o primeiro bloco",
            "Uma tabela FAT"
          ],
          correta: 1,
          dica: "Veja a linha (0-5119):2065-7184 no cartão do Linux.",
          explicacao: "Uma extensão descreve um intervalo contíguo inteiro com três números. Para arquivos pouco fragmentados, isso é muito mais compacto que um ponteiro por bloco."
        }
      ]
    },

    // ================================================== FASE 4.4 — Diretórios (chefe)
    {
      id: "a44",
      etapa: "4.4",
      titulo: "Diretórios e atalhos",
      descricao: "Caminhos, links e resolução de nomes",
      icone: "🏆",
      chefe: true,
      xv6: {
        titulo: "Diretórios e resolução de caminhos no xv6",
        arquivo: "kernel/fs.h e kernel/fs.c",
        codigo: `// Um diretório é um arquivo com uma sequência de dirent
#define DIRSIZ 14
struct dirent {
  ushort inum;          // número do i-node
  char name[DIRSIZ];    // nome
};

// namex(): resolve um caminho, um nível de cada vez
if(*path == '/')
  ip = iget(ROOTDEV, ROOTINO);     // absoluto: começa na raiz
else
  ip = idup(myproc()->cwd);        // relativo: diretório de trabalho

while((path = skipelem(path, name)) != 0){
  ilock(ip);
  if(ip->type != T_DIR){ ... return 0; }
  if((next = dirlookup(ip, name, 0)) == 0){ ... return 0; }
  iunlockput(ip);
  ip = next;                       // desce para o próximo nível
}`,
        texto: "No xv6, cada entrada de diretório tem só <b>2 bytes de i-node + 14 de nome</b>. O <code>namex()</code> faz a tradução nível a nível: começa na raiz (caminho absoluto) ou no diretório de trabalho (relativo) e, a cada nome, busca a entrada no diretório com <code>dirlookup()</code>."
      },
      linux: {
        titulo: "Hard link e link simbólico",
        comando: "ln hello.c fisico.c; ln -s hello.c simbolico.c; ls -li",
        saida: `1204274 -rw-r--r-- 2 pedro pedro 48 Oct 30 21:26 fisico.c
1204274 -rw-r--r-- 2 pedro pedro 48 Oct 30 21:26 hello.c
1204275 lrwxrwxrwx 1 pedro pedro  7 Oct 30 21:26 simbolico.c -> hello.c

$ rm hello.c
$ cat simbolico.c
cat: simbolico.c: No such file or directory
$ cat fisico.c
#include <stdio.h>`,
        texto: "O hard link <code>fisico.c</code> tem o <b>mesmo i-node</b> (1204274) e o contador de links sobe para 2. O link simbólico tem i-node próprio e só guarda o caminho \"hello.c\" (7 bytes). Depois do <code>rm</code>, o simbólico quebra, mas o hard link continua funcionando."
      },
      man: [
        { termo: "diretório", secao: "7", resumo: "um arquivo cujo conteúdo é uma tabela de entradas (nome, tipo, i-node)",
          detalhe: "O diretório não contém os arquivos, só os relaciona. Entradas especiais: . (o próprio diretório) e .. (o pai). Busca linear em sistemas simples (MS-DOS, Ext2); hashes e árvores no Ext4, ZFS e NTFS.",
          veja: ["caminho absoluto(7)", "resolução de nomes(7)"] },
        { termo: "FHS", secao: "7", resumo: "Filesystem Hierarchy Standard: a árvore padrão do Linux",
          detalhe: "/bin e /sbin (executáveis), /boot (núcleo), /dev (dispositivos), /etc (configurações), /home (usuários), /lib (bibliotecas), /mnt e /media (montagem), /proc e /sys (núcleo), /tmp (temporários), /usr (programas), /var (logs e dados variáveis).",
          veja: ["diretório(7)"] },
        { termo: "caminho absoluto", secao: "7", resumo: "caminho a partir da raiz",
          detalhe: "Ex.: /usr/local/share/fortunes/brasil.dat. O caminho canônico é o absoluto mais curto, sem ., .. nem atalhos.",
          veja: ["caminho relativo(7)"] },
        { termo: "caminho relativo", secao: "7", resumo: "caminho a partir do diretório de trabalho",
          detalhe: "Usa .. (pai) e . (atual). Com diretório de trabalho /home/ana/so/aula1, o relativo ../../docs/proj1.pdf é /home/ana/docs/proj1.pdf.",
          exemplo: "cd ../../docs",
          veja: ["caminho absoluto(7)"] },
        { termo: "link simbólico", secao: "7", resumo: "soft link: pequeno arquivo especial que guarda o caminho do alvo",
          detalhe: "Pode cruzar volumes e apontar para diretórios. Se o alvo for movido ou apagado, o link fica quebrado.",
          exemplo: "ln -s alvo atalho",
          veja: ["hard link(7)"] },
        { termo: "hard link", secao: "7", resumo: "outra entrada de diretório apontando para o mesmo i-node",
          detalhe: "Só no mesmo volume e nunca para diretórios. O conteúdo só é liberado quando o contador de links do i-node chega a 0.",
          exemplo: "ln alvo atalho",
          veja: ["link simbólico(7)", "i-node(7)"] },
        { termo: "resolução de nomes", secao: "7", resumo: "lookup: traduzir um caminho no i-node do arquivo, nível a nível",
          detalhe: "Em cada nível, lê-se o i-node do diretório, verifica-se a permissão de travessia e lê-se a tabela de entradas. Um cache de pares caminho → i-node (hash com substituição LRU) evita repetir o trabalho. Um link simbólico encontrado no caminho é lido e resolvido de novo.",
          veja: ["diretório(7)"] }
      ],
      desafios: [
        {
          tipo: "conceito",
          titulo: "Diretórios e caminhos",
          texto: `<p>Um <b>diretório</b> (pasta) é um contêiner de arquivos e de outros diretórios. Todo sistema de arquivos tem uma <b>raiz</b>,
            e os diretórios formam uma <b>árvore</b>. Cada processo tem um <b>diretório de trabalho</b> (<code>cd</code> no shell, <code>chdir</code> no UNIX).</p>
            <ul>
              <li><b>Direta</b>: só o nome, no diretório de trabalho (<code>index.html</code>).</li>
              <li><b>Absoluta</b>: a partir da raiz (<code>/usr/local/share/fortunes/brasil.dat</code>).</li>
              <li><b>Relativa</b>: a partir do diretório de trabalho, com <code>..</code> (pai) e <code>.</code> (atual).</li>
              <li><b>Canônica</b>: o caminho absoluto mais curto, sem <code>.</code>, <code>..</code> nem atalhos.</li>
            </ul>
            <p>O separador é <code>/</code> no UNIX e <code>\\</code> no Windows (<code>C:\\Users\\maria\\docs</code>).</p>`
        },
        {
          tipo: "associar",
          pergunta: "Associe cada diretório do Linux (FHS) ao que ele guarda.",
          pares: [
            ["/etc", "Arquivos de configuração"],
            ["/home", "Diretórios dos usuários"],
            ["/dev", "Arquivos de dispositivos"],
            ["/var", "Logs e dados variáveis"],
            ["/tmp", "Arquivos temporários"]
          ],
          dica: "/dev você já viu na fase 4.1.",
          explicacao: "O FHS padroniza a árvore do Linux. Saber onde cada coisa fica ajuda a navegar em qualquer distribuição."
        },
        {
          tipo: "multipla",
          pergunta: "O diretório de trabalho é /home/ana/so/aula1. A qual caminho absoluto corresponde ../../docs/proj1.pdf?",
          opcoes: ["/home/ana/so/docs/proj1.pdf", "/home/ana/docs/proj1.pdf", "/home/docs/proj1.pdf", "/docs/proj1.pdf"],
          correta: 1,
          dica: "Cada .. sobe um nível: aula1 → so → ana.",
          explicacao: "De /home/ana/so/aula1, o primeiro .. vai para /home/ana/so e o segundo para /home/ana. Daí, docs/proj1.pdf."
        },
        {
          tipo: "associar",
          pergunta: "Associe cada referência ao seu tipo.",
          pares: [
            ["index.html", "Direta"],
            ["/usr/local/share/brasil.dat", "Absoluta"],
            ["../../docs/proj1.pdf", "Relativa"],
            ["/home/ana/docs/proj1.pdf (sem . nem ..)", "Canônica"]
          ],
          dica: "Absoluta começa na raiz; a canônica é a absoluta mais curta.",
          explicacao: "A direta usa só o nome; a absoluta parte de /; a relativa parte do diretório de trabalho; a canônica é a forma absoluta mais limpa."
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Você está em /home/pedro/so/aula1. Vá para /home/pedro/docs usando um caminho RELATIVO.",
          inicial: "# diretório de trabalho: /home/pedro/so/aula1",
          aceitar: ["cd \\.\\./\\.\\./docs/?"],
          saida: "pedro@kernelplay:~/docs$ pwd\n/home/pedro/docs",
          neutros: [
            { re: "cd (/home/pedro|~)/docs/?", saida: "(funcionou, mas este caminho é absoluto)", nota: "Chegou lá, mas com caminho absoluto. Tente de novo usando .. para subir." },
            { re: "cd \\.\\./docs/?", saida: "bash: cd: ../docs: No such file or directory", nota: "Um .. só sobe até /home/pedro/so, onde não existe docs. Suba mais um nível." },
            { re: "cd \\.\\./\\.\\./\\.\\./docs/?", saida: "bash: cd: ../../../docs: No such file or directory", nota: "Subiu demais: três .. chegam a /home." },
            { re: "pwd|ls( .*)?", nota: "Agora use o cd com um caminho relativo." }
          ],
          dica: "aula1 → so → pedro: são dois níveis acima.",
          explicacao: "../../docs sobe de aula1 para so, de so para pedro, e entra em docs. O caminho absoluto equivalente é /home/pedro/docs."
        },
        {
          tipo: "conceito",
          titulo: "O diretório é uma tabela",
          texto: `<p>Um diretório é um <b>arquivo cujo conteúdo é uma tabela de entradas</b>: <b>nome</b>, <b>tipo</b> e <b>localização</b>
            (número do i-node). Ele <b>não contém</b> os arquivos, só os relaciona. Entradas especiais: <code>.</code> e <code>..</code>.</p>
            <p>A busca numa tabela simples (MS-DOS, Ext2) é <b>linear</b>. O Ext4, o ZFS e o NTFS usam <b>hashes e árvores</b>.
            A posição do diretório raiz fica registrada no <b>VBR</b>.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "O que um diretório realmente contém?",
          opcoes: [
            "Os próprios arquivos",
            "Uma tabela de entradas com nome, tipo e localização (i-node) de cada arquivo",
            "Só os nomes, sem localização",
            "Uma cópia dos i-nodes"
          ],
          correta: 1,
          dica: "Pense na struct dirent do xv6.",
          explicacao: "O diretório só relaciona nomes a i-nodes. É por isso que um mesmo i-node pode ter vários nomes (hard links)."
        },
        {
          tipo: "multipla",
          lab: "LAB 04 · xv6",
          pergunta: "No ls do xv6 (Lab 00), a primeira linha foi \". 1 1 1024\". O que significam o segundo 1 e o 1024?",
          opcoes: [
            "1 arquivo e 1024 bytes livres",
            "i-node 1 (a raiz, ROOTINO) e tamanho de 1024 bytes: um bloco com as entradas do diretório",
            "1 link e 1024 arquivos",
            "Versão 1 do sistema de arquivos"
          ],
          correta: 1,
          dica: "Colunas do ls do xv6: nome, tipo, i-node, tamanho. ROOTINO vale 1 e BSIZE vale 1024.",
          explicacao: "O diretório raiz é o i-node 1. Ele ocupa um bloco de 1 KB, que cabe 64 entradas dirent de 16 bytes (2 do i-node + 14 do nome)."
        },
        {
          tipo: "conceito",
          titulo: "Atalhos: simbólico e físico",
          texto: `<p>Um <b>atalho</b> dá vários caminhos para <b>uma só cópia</b> dos dados.</p>
            <table class="tabela">
              <tr><th></th><th>Simbólico (<i>soft</i>)</th><th>Físico (<i>hard</i>)</th></tr>
              <tr><td>O que é</td><td>arquivo especial com o <b>caminho</b> do alvo</td><td>outra <b>entrada</b> para o <b>mesmo i-node</b></td></tr>
              <tr><td>Outro volume?</td><td>sim</td><td><b>não</b></td></tr>
              <tr><td>Diretórios?</td><td>sim</td><td><b>nunca</b></td></tr>
              <tr><td>Alvo apagado</td><td>fica <b>quebrado</b></td><td>o conteúdo continua até o contador de links chegar a 0</td></tr>
              <tr><td>Comando</td><td><code>ln -s alvo atalho</code></td><td><code>ln alvo atalho</code></td></tr>
            </table>`
        },
        {
          tipo: "terminal",
          ambiente: "linux",
          pergunta: "Crie um link SIMBÓLICO chamado atalho.c que aponte para hello.c.",
          aceitar: ["ln -s hello\\.c atalho\\.c", "ln --symbolic hello\\.c atalho\\.c", "ln -s \\./hello\\.c atalho\\.c"],
          saida: "pedro@kernelplay:~$ ls -l atalho.c\nlrwxrwxrwx 1 pedro pedro 7 Oct 30 21:40 atalho.c -> hello.c",
          neutros: [
            { re: "ln hello\\.c atalho\\.c", saida: "pedro@kernelplay:~$ ls -li hello.c atalho.c\n1204274 -rw-r--r-- 2 pedro pedro 48 Oct 30 21:26 atalho.c\n1204274 -rw-r--r-- 2 pedro pedro 48 Oct 30 21:26 hello.c", nota: "Isso criou um hard link (mesmo i-node). Para um link simbólico falta uma opção." },
            { re: "ln -s atalho\\.c hello\\.c", saida: "ln: failed to create symbolic link 'hello.c': File exists", nota: "A ordem é: ln -s ALVO NOME_DO_ATALHO." },
            { re: "cp hello\\.c atalho\\.c", nota: "Isso faz uma cópia dos dados, não um atalho." }
          ],
          dica: "O comando é ln, com a opção de symbolic.",
          explicacao: "O l no início de lrwxrwxrwx indica um link simbólico, e o tamanho de 7 bytes é exatamente o caminho guardado: \"hello.c\"."
        },
        {
          tipo: "multipla",
          pergunta: "Você criou um hard link fisico.c para hello.c e depois apagou hello.c. O que acontece com fisico.c?",
          opcoes: [
            "Fica quebrado, como um link simbólico",
            "Continua funcionando: o i-node só é liberado quando o contador de links chega a 0",
            "Vira um link simbólico",
            "É apagado junto"
          ],
          correta: 1,
          dica: "No cartão do Linux da fase anterior, o contador de links era 2.",
          explicacao: "Os dois nomes apontavam para o mesmo i-node. O rm apagou um nome (unlink) e o contador caiu de 2 para 1: o conteúdo continua lá."
        },
        {
          tipo: "multipla",
          pergunta: "Um hard link pode apontar para um arquivo em outro volume (outro disco)?",
          opcoes: [
            "Sim, sempre",
            "Não: o número do i-node só vale dentro do próprio volume",
            "Só se os dois volumes forem Ext4",
            "Só para diretórios"
          ],
          correta: 1,
          dica: "O hard link guarda um número de i-node, não um caminho.",
          explicacao: "O i-node 1204274 de um volume não tem nada a ver com o i-node 1204274 de outro. Para cruzar volumes, use um link simbólico, que guarda o caminho."
        },
        {
          tipo: "conceito",
          titulo: "Resolução de caminhos",
          texto: `<p>Para abrir <code>/home/daniel/arq1</code>, o núcleo percorre o caminho <b>nível a nível</b>: em cada diretório, lê o
            <b>i-node</b>, <b>verifica a permissão</b> de travessia e lê a <b>tabela de entradas</b> para achar o próximo nome.
            Com o cache vazio, são 2 leituras por diretório (i-node + conteúdo) e, no fim, o i-node do arquivo.</p>
            <p>O <b>cache de resolução de nomes</b> guarda pares <b>caminho → i-node</b> recentes numa tabela hash com substituição <b>LRU</b>.
            Ao encontrar um <b>link simbólico</b> no meio do caminho, o núcleo lê o caminho guardado nele e resolve de novo.</p>`
        },
        {
          tipo: "multipla",
          pergunta: "Com o cache vazio, quantas leituras de disco são necessárias para localizar /home/aluno/marcos/so/projetos/hello.c? (Suponha cada diretório num único bloco.)",
          opcoes: ["6", "7", "12", "13"],
          correta: 3,
          dica: "Há 6 diretórios no caminho (/, home, aluno, marcos, so, projetos), cada um com i-node + conteúdo, e depois o i-node do arquivo.",
          explicacao: "6 diretórios × 2 leituras = 12, mais o i-node de hello.c = 13. É por isso que o cache de resolução de nomes faz tanta diferença."
        },
        {
          tipo: "multipla",
          pergunta: "Qual política de substituição o cache de resolução de nomes usa?",
          opcoes: ["FIFO", "LRU", "Aleatória", "Ótima"],
          correta: 1,
          dica: "A mesma ideia da substituição de páginas da Trilha 3.",
          explicacao: "Os caminhos usados há mais tempo saem primeiro: os diretórios que você está usando agora tendem a ser usados de novo (localidade)."
        }
      ]
    }
  ]
});
