# Plataforma de quiz

Plataforma frontend de quiz.

## Para rodar

```
npm i -g http-server
# já tendo a ferramenta instalada
http-server .
# vai hostear local e vc responde os quiz.
```

## Quiz//Flashcard
exemplo de flashcard:

```json
  {
    "numero": "1",
    "pergunta": "O que é Separação de Lógica e Dados em contratos inteligentes?",
    "resposta_certa": "A",
    "respostas": {
      "A": "Dividir contrato em armazenamento e lógica para facilitar upgrades mantendo estado.",
      "B": "Juntar lógica e dados num único contrato para simplificar.",
      "C": "Separar contratos por função sem manter dados persistentes.",
      "D": "Usar apenas contratos proxy sem lógica própria."
    }
  },
```
