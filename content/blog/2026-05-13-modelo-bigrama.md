+++
title = "Como seu celular \"adivinha\" a próxima palavra: entendendo o modelo Bigrama com Python"
date = 2026-05-13
description = "O teclado do celular não tem bola de cristal — usa probabilidade. Neste post exploro o modelo bigrama, sua ligação com probabilidade condicional e construímos um gerador de texto em Python básico."
draft = false

[extra]
latency = "—"
status  = "ONLINE"
+++

por Gustavo

Você já reparou que, ao digitar uma mensagem, o teclado do celular sugere a próxima palavra antes mesmo de você começar a escrevê-la?  
Ele não tem bola de cristal — usa probabilidade. E uma das formas mais simples de implementar isso é com um **modelo bigrama**.

Neste artigo, vou te explicar o que é um bigrama, como ele se conecta com a probabilidade condicional que aprendemos na escola e, melhor ainda, vamos construir um **gerador de texto** usando Python básico.

Se você sabe o básico de Python (listas, dicionários, loops), já consegue acompanhar e rodar o código na sua máquina.

---

## 1. A ideia por trás do "chute"

Quando você digita "Eu gosto de", qual palavra tem mais chance de aparecer depois? "pizza"? "programar"? "viajar"?  
Um modelo de linguagem analisa um monte de frases que as pessoas já escreveram e aprende quais palavras costumam andar juntas.

O **bigrama** é um modelo simples que olha só para **a última palavra** que você escreveu e, com base nela, calcula a probabilidade da próxima. Ele assume que o futuro imediato depende só do presente — uma suposição chamada **hipótese de Markov**.

Exemplo:  
Se no conjunto de frases de treino a palavra "gato" é seguida muitas vezes por "mia" e poucas por "dorme", o bigrama vai dar uma probabilidade alta para "mia" depois de "gato".

---

## 2. Probabilidade condicional sem susto

A fórmula que você talvez tenha visto na aula de probabilidade é:

\[
P(A|B) = \frac{P(A \cap B)}{P(B)}
\]

Traduzindo para palavras:

\[
P(\text{próxima} \mid \text{anterior}) = \frac{\text{quantas vezes elas aparecem juntas}}{\text{quantas vezes a anterior aparece}}
\]

Se "gato" aparece 10 vezes no texto e, dessas, 7 vezes é seguido de "mia", então:

\[
P(\text{"mia"} \mid \text{"gato"}) = \frac{7}{10} = 0,7
\]

É só isso! O modelo inteiro é uma tabela dessas probabilidades.

---

## 3. Colocando a mão na massa com Python

Vamos usar um corpus bem pequeno (umas frases inventadas) para treinar nosso modelo e depois gerar texto novo.  
O código pode ser executado em qualquer ambiente Python 3.

### 3.1 Preparando os dados

```python
corpus = [
    "o gato mia",
    "o gato dorme",
    "o cachorro late",
    "o gato mia alto",
    "o cachorro dorme",
    "o gato bebe leite",
    "o cachorro bebe água"
]

frases_processadas = []
for frase in corpus:
    tokens = frase.split()
    frases_processadas.append(["<s>"] + tokens + ["</s>"])
```

### 3.2 Contando unigramas e bigramas

```python
from collections import defaultdict

contagem_unigrama = defaultdict(int)
contagem_bigrama = defaultdict(int)

for tokens in frases_processadas:
    for i in range(len(tokens) - 1):
        palavra_atual = tokens[i]
        proxima_palavra = tokens[i+1]

        contagem_unigrama[palavra_atual] += 1
        contagem_bigrama[(palavra_atual, proxima_palavra)] += 1
    contagem_unigrama[tokens[-1]] += 1
```

### 3.3 Calculando as probabilidades

```python
prob_bigrama = {}

for (anterior, proxima), cont_bigram in contagem_bigrama.items():
    prob_bigrama[(anterior, proxima)] = cont_bigram / contagem_unigrama[anterior]
```

`prob_bigrama[("o", "gato")]` = número de vezes que "o gato" apareceu / quantas vezes "o" apareceu.

### 3.4 Gerando uma frase nova

```python
import random

def gerar_frase(prob_bigrama, max_palavras=10):
    frase = ["<s>"]
    while len(frase) < max_palavras + 2:
        palavra_atual = frase[-1]

        proximas_candidatas = []
        pesos = []
        for (ant, prox), prob in prob_bigrama.items():
            if ant == palavra_atual:
                proximas_candidatas.append(prox)
                pesos.append(prob)

        if not proximas_candidatas:
            break

        proxima = random.choices(proximas_candidatas, weights=pesos)[0]
        frase.append(proxima)

        if proxima == "</s>":
            break

    palavras_finais = [p for p in frase if p not in ("<s>", "</s>")]
    return " ".join(palavras_finais)

for _ in range(5):
    print(gerar_frase(prob_bigrama))
```

Possíveis saídas (aleatórias):

```
o gato mia alto
o cachorro dorme
o gato bebe água
o gato mia
o cachorro late
```

É um modelo bem limitado, mas já gera frases que fazem sentido sintático.

---

## 4. As limitações (e por que ainda amamos bigramas)

Nosso modelo tem dois problemas principais:

- **Probabilidade zero**: se um par nunca apareceu no treino, ele terá probabilidade zero. Para resolver isso, existem técnicas de suavização (como Laplace), mas isso é assunto para outro post.
- **Falta de contexto**: o bigrama só olha uma palavra para trás. Modelos trigrama e, mais modernamente, redes neurais (como GPT) lidam melhor com isso.

Mesmo assim, o bigrama é a porta de entrada para entender modelos de linguagem. Ele usa só o essencial de probabilidade e é implementável em poucas linhas.

---

## 5. O que você pode fazer agora?

- Pegue um livro em `.txt` (Domínio Público, por exemplo) e treine o bigrama com um corpus maior.
- Experimente gerar texto a partir de letras de música, poemas ou discursos.
- Tente implementar a suavização "add-1": soma 1 em todos os bigramas antes de calcular as probabilidades.
