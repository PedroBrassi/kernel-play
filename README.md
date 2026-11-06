# Projeto Integrador de Sistemas Operacionais

Projeto em grupo com três partes que contam a mesma história:

1. **KernelPlay**: jogo educativo em HTML, CSS e JavaScript puro, organizado em trilhas que seguem as unidades da disciplina.
2. **Demonstração no xv6**: o mesmo conceito rodando no xv6 (RISC-V) no QEMU.
3. **Comparação com um SO atual**: o mesmo comportamento observado no Linux.

> **Trilhas prontas:** 1. Introdução aos Sistemas Operacionais · 2. Gerenciamento de Processos · 3. Gerenciamento de Memória · 4. Gerenciamento de Arquivos
> **Prevista:** 5. Dispositivos e Entrada/Saída

## Estrutura
```
projeto-s.o/
├── README.md         ← este arquivo
├── index.html        ← redireciona para o jogo (página inicial do GitHub Pages)
├── kernelPlay/       ← o jogo (é o que vai ao ar)
├── Trilhas/          ← conteúdo de cada trilha em Markdown (fonte do texto do jogo)
├── xv6-demo/         ← demonstração no xv6 (a fazer)
└── design/           ← imagens originais e proposta visual (não vão para o jogo)
```

## Como rodar o jogo
- **Localmente:** abra `kernelPlay/index.html` no navegador. Não precisa instalar nada.
- **Online:** com o GitHub Pages ativado, o endereço fica `https://<usuario>.github.io/projeto-s.o/`.
- **Apresentação:** acrescente `?apresentacao` ao endereço do jogo (`.../kernelPlay/?apresentacao`) para liberar todas as etapas e pular entre os desafios.

### Ativar o GitHub Pages
1. Suba o repositório para o GitHub.
2. Abra **Settings → Pages**.
3. Em *Source*, escolha **Deploy from a branch**, depois a branch `main` e a pasta `/ (root)`.
4. Espere alguns minutos e abra o endereço que aparecer.

## Demonstração no xv6
*A fazer.* A pasta `xv6-demo/` está reservada para essa parte.

## Integrantes
- Pedro
- *(adicionar)*

## Créditos
- xv6: MIT PDOS, licença MIT — https://github.com/mit-pdos/xv6-riscv
- Mascote: ilustrações geradas com IA a partir da proposta visual do grupo.
