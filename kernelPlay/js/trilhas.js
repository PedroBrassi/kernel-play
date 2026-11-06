/* =========================================================
   KernelPlay — trilhas.js
   Lista de trilhas do jogo. Cada arquivo em js/trilhas/ acrescenta
   a sua com TRILHAS.push({...}) e precisa ser carregado no index.html
   DEPOIS deste arquivo. O jogo ordena as trilhas pelo número.

   Formato de uma trilha:
     { id, numero, titulo, subtitulo, fases: [ ... ] }

   Formato de uma fase (etapa):
     id        identificador ÚNICO entre todas as trilhas (ex.: "intro-1")
     titulo, descricao, icone, chefe? (true na última etapa, o "desafio final")
     etapa     rótulo curto mostrado na trilha (ex.: "1.1", "BIOS")
     desafios  lista de desafios (tipos abaixo)
     xv6?      { titulo, arquivo, codigo, texto }   → cartão "Veja no xv6"
     linux?    { titulo, comando, saida, texto }    → cartão "E no Linux?"
     man?      [{ termo, secao, resumo, detalhe?, exemplo?, veja?[] }]
               → páginas do manual, liberadas quando a etapa é concluída
               secao: "1" comando, "2" chamada de sistema, "7" conceito,
                      "kernel" função do kernel do xv6, "xv6" recurso do xv6
   (código, saídas e páginas do man são mostrados como texto puro;
    textos de conceito, perguntas e explicações aceitam HTML)

   Tipos de desafio:
   - conceito:  { tipo, titulo, texto }
   - multipla:  { tipo, pergunta, contexto?, opcoes[], correta, dica, explicacao }
   - ordenar:   { tipo, pergunta, itens[] (na ordem CERTA), dica, explicacao }
   - associar:  { tipo, pergunta, pares: [[esquerda, direita], ...] (pares CERTOS), dica, explicacao }
   - simulacao: { tipo, pergunta, processos[], acoes[], objetivo[], dica, explicacao }
       processos: { nome, estado, pai?, motivo? ("io" | "wait") }
       acoes: chaves de ACOES em simulador.js
       objetivo: lista de { processo, estado } que precisam valer ao mesmo tempo
                 (estado "UNUSED" = processo removido da tabela)
   - terminal:  { tipo, ambiente ("linux" | "xv6"), pergunta, inicial?, aceitar[], saida,
                  neutros?[], erradas?[], dica, explicacao }
       aceitar: expressões regulares dos comandos certos (ex.: "ps aux"; "\\^P" = Ctrl-P)
       neutros: { re, saida?, nota } → mostram algo, mas não resolvem (sem custo)
       erradas: { re, saida?, nota } → comandos errados/perigosos (custam estabilidade)
   - substituicao: { tipo, pergunta, algoritmo ("FIFO" | "LRU" | "OPT"), cadeia[], quadros, dica, explicacao }
       simulação de substituição de páginas: o jogo avança sozinho nos acertos e nas
       faltas com quadro livre; com a memória cheia, o jogador clica na vítima.
       Vítima errada custa estabilidade. No OPT, empates aceitam qualquer uma.
   Campo opcional em qualquer desafio: lab: "LAB 03 · xv6" → mostra a tag 🧪 de laboratório.
   ========================================================= */

const TRILHAS = [];

// Trilhas que ainda não têm conteúdo: aparecem no menu como "[em breve]".
// Quando uma trilha com o mesmo número for criada, ela substitui o aviso.
const TRILHAS_PREVISTAS = [
  { numero: 5, titulo: "Dispositivos e Entrada/Saída" }
];
