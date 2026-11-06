# KernelPlay — Aprenda Sistemas Operacionais jogando

Jogo educativo de Sistemas Operacionais organizado em **trilhas**, uma para cada unidade da disciplina. Cada trilha é uma sequência de etapas com conceitos, desafios, simulações e terminal, e cada etapa termina com a ligação com o código do xv6 e com o Linux.
Feito só com HTML, CSS e JavaScript puro: sem frameworks, sem servidor e sem banco de dados.

## Como rodar
Abra o `index.html` no navegador. Não precisa instalar nada.

## Estrutura
```
kernelPlay/
├── index.html             ← só a casca; carrega os scripts
├── manifest.webmanifest   ← permite "adicionar à tela inicial" no celular
├── css/estilo.css         ← visual; as cores ficam todas em :root
├── js/
│   ├── trilhas.js         ← lista de trilhas, trilhas previstas e o formato do conteúdo
│   ├── trilhas/           ← CONTEÚDO: um arquivo por trilha
│   │   ├── trilha-1-introducao.js   ← 3 etapas (1.1 a 1.3)
│   │   ├── trilha-2-processos.js    ← 9 etapas (2.1 A, B e C; 2.2 a 2.7)
│   │   ├── trilha-3-memoria.js      ← 6 etapas (3.1 A e B; 3.2; 3.3; 3.4 A e B)
│   │   └── trilha-4-arquivos.js     ← 5 etapas (4.1; 4.2; 4.3 A e B; 4.4)
│   ├── simulador.js       ← máquina de estados dos processos
│   ├── shell.js           ← bash simulado COM estado (arquivos, i-nodes, links, permissões, processos e sinais)
│   ├── laboratorio.js     ← modo Laboratório: geradores de exercícios e roteiros
│   └── jogo.js            ← motor: telas, estabilidade, ciclos, uptime, mascote
└── assets/
    ├── mascote/           ← 6 poses recortadas (.webp, ~40 KB cada)
    └── icones/            ← favicon, ícone do iPhone e ícone 512 px do manifesto
```
As imagens originais e a proposta visual ficam em `../design/`, fora do jogo.

## Telas
1. **Abertura**: log de boot animado, logo e mascote.
2. **Menu de trilhas** (estilo GRUB): escolha com as setas e `Enter` ou com um clique. Trilhas ainda sem conteúdo aparecem como `[em breve]`.
3. **Trilha**: as etapas em sequência de boot, com status `[  OK  ]`, `[ .... ]` ou `[ LOCK ]`.
4. **Lição**: desafios com o mascote reagindo a acerto, erro e dica.
5. **Veja no xv6 / E no Linux?**: trecho real do xv6 e o mesmo conceito no terminal do Linux.
6. **Resultado**: ciclos ganhos, precisão e maior uptime.
7. **Kernel panic**: quando a estabilidade chega a 0%.
8. **man**: manual no estilo do Linux, aberto pelo botão `man` no topo. Reúne as páginas de todas as trilhas; cada etapa concluída libera as páginas dela (conceitos, comandos e chamadas de sistema), com busca por palavra-chave (`man -k`) e links "VEJA TAMBÉM" entre as páginas. A tecla `q` sai do manual.

## Conteúdo
- **Trilha 1 · Introdução aos SOs** — `../docs/trilhas/Trilha_1_Introducao.md` (Aulas 1 a 3).
- **Trilha 2 · Gerenciamento de Processos** — `../docs/trilhas/Trilha_2_Gerenciamento_de_Processos.md` (Aulas 4 a 11). A fase 2.1 foi dividida em três etapas (processo e PCB; estados; criação e término) para as lições não ficarem longas demais.
- **Trilha 3 · Gerenciamento de Memória** — `../docs/trilhas/Trilha_3_Gerenciamento_de_Memoria.md` (Aulas 12 a 15): MMU, paginação, uso da memória, alocação, paginação em disco e substituição de páginas (FIFO, LRU e ótimo como simulação).
- **Trilha 4 · Gerenciamento de Arquivos** — `../docs/trilhas/Trilha_4_Gerenciamento_de_Arquivos.md` (Aulas 16 a 18 e Diretórios): arquivos, descritores, sistemas de arquivos, alocação de arquivos (FAT, i-nodes, extensões) e diretórios e atalhos.
- **Aulas de laboratório**: desafios marcados com 🧪 (LAB 01 a LAB 04 · xv6) usam os comandos, códigos e resultados das aulas práticas: `ps`, `pstree`, `fork`, threads, os programas de escalonamento e sincronização em C, os experimentos em Java do Lab 03 e os exercícios do xv6.
- **Estados de processo**: o jogo usa os nomes da aula (Novo, Pronto, Executando, Bloqueado, Zumbi, Finalizado) e mostra ao lado o nome do xv6 (RUNNABLE, RUNNING, SLEEPING, ZOMBIE, UNUSED).
- **Trechos do xv6**: seguem o xv6-labs-2024, a versão usada no laboratório.

## Laboratório
Entrada própria no menu de trilhas (**🧪 Laboratório**). Erros não custam estabilidade e não travam etapas; o progresso das trilhas não muda.

**Treino livre**: exercícios gerados na hora, com números novos a cada rodada (o botão "Treinar de novo" sorteia outros).

| Treino | O que gera | Trilha |
|---|---|---|
| Substituição de páginas | cadeias sorteadas para FIFO, LRU ou ótimo, com 3 ou 4 quadros | 3 |
| Tradução de endereços | tabela de páginas sorteada: endereço físico, página e deslocamento, falta de página | 3 |
| Escalonamento | 4 processos com chegada e duração sorteadas: espera média no FCFS, SJF, SRTF ou Round-Robin | 2 |
| Permissões | rwx ↔ octal e "o que o grupo/outros podem fazer" | 4 |
| Blocos e i-nodes | fragmentação interna e quais ponteiros do i-node (Ext2/3) um arquivo usa | 4 |
| Caminhos | relativo → absoluto e caminho canônico | 4 |
| Misturado | um de cada | — |

As explicações mostram a conta completa (por exemplo, o diagrama de Gantt e a espera de cada processo).

**Roteiros**: missões em passos num terminal que lembra o que foi feito (`js/shell.js`). Cada passo é conferido pelo estado do sistema, não pelo texto digitado, e mostra uma explicação ao ser cumprido. O botão "Dica do passo" não tem custo; `help` lista os comandos aceitos.
- **Arquivos, links e permissões** (15 passos): `mkdir`, `cd`, `echo > arquivo`, `stat`, `ln`, `ln -s`, `ls -li`, `rm`, link quebrado, `chmod 750`, `chmod u-r` e Permission denied.
- **Processos e sinais** (14 passos): `ps`, `echo $$`, `sleep 1000 &`, `ps aux`, `grep`, `pstree -p`, `kill -STOP`/`-CONT`, SIGTERM, `yes > /dev/null &` em estado R e `kill -9`.

Para criar um roteiro novo, acrescente um objeto em `roteiros` no `js/laboratorio.js` (o formato está comentado no topo do arquivo). Para um treino novo, escreva uma função que devolva um desafio `multipla` ou `substituicao` e registre-a em `treinos`.

## Modo apresentação
Abra o jogo com `?apresentacao` no fim do endereço, por exemplo `kernelPlay/index.html?apresentacao` ou `https://pedrobrassi.github.io/kernel-play/kernelPlay/?apresentacao`.
- Todas as etapas ficam liberadas.
- Dentro da lição aparece a barra **Ir para:**, que pula direto para qualquer desafio (C = conceito, Q = questão, O = ordenar, A = associar, S = simulação, T = terminal, R = roteiro) ou para os cartões do xv6 e do Linux.
- A estabilidade nunca zera sozinha (para em 20%). Para mostrar o kernel panic, use o link **Mostrar a tela de kernel panic** na trilha.
- O progresso fica separado do modo normal.

## Mecânicas
| Mecânica | Como funciona |
|---|---|
| 🟩 Estabilidade (SYS) | 5 segmentos (100%). Cada erro tira 20%; em 0% acontece um kernel panic. Etapa sem erros devolve +20%. |
| ⚡ Ciclos | +10 por acerto, −5 se usou dica, +5 de bônus com uptime ≥ 3. |
| ⏱ Uptime | Acertos seguidos; zera ao errar. |
| 🔒 Trilha | Dentro de cada trilha, cada etapa libera a próxima. As trilhas podem ser feitas em qualquer ordem. |
| ✅ Feedback | Logo após cada resposta, com uma explicação curta e a reação do mascote. |
| 🔁 Revisão | Questão errada volta no fim da mesma lição. |
| 📈 Diagrama ao vivo | Na simulação, o estado do processo selecionado acende e a transição feita pisca. |
| 💾 Sessão | Progresso salvo em `sessionStorage` (some ao fechar a aba). |

## Tipos de desafio (em `js/trilhas/*.js`)
- `conceito`: texto curto explicando o assunto.
- `multipla`: múltipla escolha com dica e explicação.
- `ordenar`: o jogador monta uma sequência na ordem certa.
- `associar`: o jogador liga cada item da esquerda ao seu par na direita.
- `simulacao`: o jogador seleciona processos e aplica ações (`fork`, `exit`, `wait`, `yield`, `I/O`, `Fim da E/S`, `Escalonar`) até cumprir um objetivo de estados.
- `substituicao`: simulação de substituição de páginas. O jogo percorre a cadeia de referências sozinho; quando a memória está cheia, o jogador clica no quadro que o algoritmo (FIFO, LRU ou ótimo) removeria. Vítima errada custa estabilidade.
- `roteiro`: usado só no Laboratório; passos num terminal com estado (veja abaixo).
- `terminal`: o jogador digita o comando num terminal simulado (Linux ou xv6) e vê a saída. Comandos desconhecidos não custam nada; comandos perigosos (como matar o próprio shell) custam estabilidade. No xv6, o Ctrl-P funciona pelo teclado ou pelo botão.

Cada etapa também tem `etapa` (rótulo curto), `xv6` e `linux` (os cartões do fim da etapa) e `man` (as páginas do manual que a etapa libera). O formato completo está comentado no topo do `js/trilhas.js`.

## Adicionar uma trilha
1. Escreva o conteúdo em `../docs/trilhas/` (como o `Trilha_1_Introducao.md`).
2. Crie `js/trilhas/trilha-N-nome.js` começando com `TRILHAS.push({ id, numero, titulo, subtitulo, fases: [...] })`. Use como modelo as trilhas que já existem; os `id` das etapas precisam ser únicos entre todas as trilhas.
3. Acrescente `<script src="js/trilhas/trilha-N-nome.js"></script>` no `index.html`, depois do `trilhas.js`.
4. A trilha com o mesmo número em `TRILHAS_PREVISTAS` (em `js/trilhas.js`) deixa de aparecer como `[em breve]` sozinha.

Simulações de outros assuntos (como escalonamento) precisam de um simulador próprio, com a mesma ideia do `simulador.js` (estado + `aplicar(acao)` → `{ ok, msg }`).

## Mudar as cores
Todas as cores estão nas variáveis do topo do `css/estilo.css` (`--marca`, `--fundo`, `--running`…).

## Créditos
- Desenvolvimento do jogo: [Pedro Brassi](https://github.com/PedroBrassi)
- Trechos de código do xv6 (MIT): https://github.com/mit-pdos/xv6-riscv

## Teclado
`1`–`4` escolhem a opção; `Enter` verifica ou continua.
