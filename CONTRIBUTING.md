# Como contribuir

## Primeiro acesso

1. Envie seu usuário do GitHub ao responsável pelo repositório e aceite o convite de colaboração.
2. Baixe ou clone o repositório. Para enviar pelo navegador, abra a pasta correta e use **Add file → Upload files**.

## Onde colocar sua parte

| Material | Pasta |
|---|---|
| Site do simulador | `kernelPlay/` |
| Textos das trilhas | `docs/trilhas/` |
| Justificativa editável e PDF | `docs/justificativa/` |
| Código da demonstração xv6 | `xv6-demo/codigo/` |
| Capturas e saídas reais do xv6 | `xv6-demo/evidencias/` |
| Slides editáveis e PDF | `apresentacao/` |
| Imagens e proposta visual | `design/` |

## Envio e revisão

1. Atualize sua cópia com a versão principal antes de começar.
2. Crie uma branch por tarefa, por exemplo `docs/justificativa`, `feat/demo-xv6` ou `docs/slides-linux`.
3. Faça alterações apenas nos arquivos relacionados à sua tarefa. Evite duas pessoas editando o mesmo arquivo de apresentação simultaneamente.
4. Envie a branch e abra um pull request explicando o que mudou e como verificou. Pelo navegador, escolha criar uma nova branch ao salvar.
5. Peça revisão a outro integrante antes de incorporar à `main`, pois ela pode alimentar o site publicado.
6. Atualize o planejamento e, após revisão, os materiais finais no Padlet.

## Cuidados com as entregas

- Use nomes descritivos, sem espaços ou acentos, como `justificativa-tecnica.pdf` e `processos-threads-linux.pdf`.
- Guarde a fonte editável junto do PDF. O repositório ignora arquivos ZIP; envie os arquivos extraídos nas pastas certas.
- Registre comandos e saídas realmente executados no xv6, incluindo a versão utilizada. Separe resultado esperado de resultado observado.
- Ao alterar o site, confira abertura, trilha de processos, imagens e modo apresentação. Preserve `kernelPlay/` e o redirecionamento da raiz.
- Não envie senhas, chaves, arquivos pessoais ou instalações completas de ferramentas.
