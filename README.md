# Grupo 3 — Processos e Threads

Projeto Integrador de Sistemas Operacionais, organizado em três entregas: simulador educativo KernelPlay, demonstração prática no xv6 e comparação com um sistema operacional atual.

## Links

- [Jogar KernelPlay](https://pedrobrassi.github.io/kernel-play/kernelPlay/)
- [Modo apresentação](https://pedrobrassi.github.io/kernel-play/kernelPlay/?apresentacao)
- [Padlet do grupo](https://padlet.com/pedroluccas2/grupo-3-processos-e-threads-s024zwdrjwwsaqd4z88l)
- [Repositório](https://github.com/PedroBrassi/kernel-play)

## Estrutura

```text
projeto-s.o/
├── index.html                 # entrada do site; redireciona para kernelPlay/
├── kernelPlay/                # site publicado: HTML, CSS, JS e imagens
├── docs/
│   ├── planejamento.md        # entregas, responsáveis e prazos a combinar
│   ├── trilhas/               # material educativo em Markdown
│   └── justificativa/         # texto editável e PDF final, quando concluídos
├── xv6-demo/                  # código, instruções e evidências da demonstração
│   ├── codigo/
│   └── evidencias/
├── apresentacao/              # fontes editáveis e PDF sobre SO atual
├── design/                    # proposta visual e imagens originais
└── CONTRIBUTING.md            # como colaborar
```

## Situação das entregas

| Entrega | Situação | Local |
|---|---|---|
| KernelPlay | Implementado e publicado; revisão funcional conjunta pendente | [Site e documentação](kernelPlay/README.md) |
| Justificativa técnica | PDF pendente | [Orientações](docs/justificativa/README.md) |
| Demonstração no xv6 | Implementação, execução e testes pendentes | [Roteiro de entrega](xv6-demo/README.md) |
| SO atual | Slides em PDF pendentes; Linux é a referência prevista na documentação existente | [Orientações](apresentacao/README.md) |
| Padlet | Identificação, quatro colunas, link do simulador e modelo de avaliações preparados | Link acima |

O conteúdo didático sobre xv6 dentro do jogo não comprova a execução da demonstração prática.

## Executar o site

Abra `kernelPlay/index.html` no navegador. O jogo usa HTML, CSS e JavaScript puro e não exige instalação de dependências.

O arquivo `index.html` da raiz mantém a entrada do GitHub Pages. A pasta `kernelPlay/` foi preservada para manter o link já compartilhado. A reorganização da documentação não exige alterar o caminho do site nem sua configuração de publicação. Alterações locais só aparecem online depois de enviadas ao GitHub e publicadas.

## Trabalho em equipe

Leia [como contribuir](CONTRIBUTING.md) e registre a divisão em [planejamento](docs/planejamento.md). Mantenha os arquivos editáveis junto dos PDFs finais. Publique no Padlet apenas materiais revisados, identificando pendências com clareza.

## Integrantes — 7

- Pedro Brassi Luccas
- Aurélio Junior
- Victor Orlando Avelar
- Gabriel Alves Domingos
- Pedro Lima
- Ana Flávia dos Santos Peixoto
- Guilherme Gouvêa da Silva

## Créditos

- xv6: MIT PDOS, licença MIT — https://github.com/mit-pdos/xv6-riscv
- Mascote: ilustrações geradas com IA a partir da proposta visual do grupo.
