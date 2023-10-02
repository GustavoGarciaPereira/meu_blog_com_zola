+++
title = "Automação com python"
draft = false
+++

Recentemente, me deparei com um desafio: converter um arquivo PDF para TXT.<br>
No entanto, eu não queria apenas uma conversão simples. <br>
esejava implementar uma solução que me permitisse aplicar filtros iniciais, mas que também fosse flexível o suficiente para permitir customizações futuras.<br> 
Após algumas pesquisas e testes, desenvolvi o seguinte script:<br>

```python
import PyPDF2
from tqdm import tqdm


def pdf_to_txt(pdf_path, txt_path):
    with open(pdf_path, 'rb') as file:
        # Criando um objeto PDF reader
        pdf_reader = PyPDF2.PdfReader(file)

        # Extraindo texto de cada página
        text = ""
        for page in tqdm(pdf_reader.pages, desc="Convertendo PDF para TXT", unit="página"):
            text += page.extract_text()

    # Salvando o texto em um arquivo .txt
    with open(txt_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write(text)


# Usando a função para converter um arquivo PDF em TXT
pdf_to_txt(
    './1_Publicacoes_Pronunciamentos-Técnicos-Contábeis.pdf',
    'saida_1_livro_CPC2.txt'
)

```