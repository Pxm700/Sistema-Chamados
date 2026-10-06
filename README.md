# Sistema-Chamados

Site para cadastro e gestão de chamados por loja, com alerta de cor por tempo em aberto. HTML, CSS e JavaScript puro, dados salvos no navegador (sem banco de dados).

## Funcionalidades

- **Adicionar chamado:** número, loja (lista fixa), equipe (lista fixa), data de inclusão e status.
- **Gestão de chamados:** filtros opcionais e combináveis por número do chamado, status, equipe e loja.
- **Alerta por cor** conforme os dias desde a inclusão:
  - Amarelo: mais de 3 dias
  - Laranja: mais de 7 dias
  - Vermelho: mais de 10 dias
  - Vermelho fluorescente pulsando: mais de 30 dias
- Troca de status e de equipe direto no card.
- Ao marcar como "Chamado concluído", o chamado sai da lista (com confirmação).

## Como alterar as listas

No início do `script.js` ficam as listas `LOJAS` e `EQUIPES`. Para incluir ou remover uma loja ou equipe, edite essas listas.

## Armazenamento

Os dados ficam no `localStorage` do navegador (chave `chamados_v2`). São específicos de cada aparelho e navegador.
