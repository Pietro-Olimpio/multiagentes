from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "papelaria_limpa.csv"


def formatar_reais(valor, _posicao=None):
    """Formata valores em reais no padrão brasileiro."""
    texto = f"{valor:,.2f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {texto}"


def criar_grafico_barras(totais, dimensao, titulo, caminho_saida):
    totais = totais.sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(9, 5.5))

    barras = ax.bar(totais.index.astype(str), totais.values, color="#4C72B0", width=0.68)
    ax.set_title(titulo, fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel(dimensao)
    ax.set_ylabel("Valor total vendido (R$)")
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(formatar_reais))
    ax.set_ylim(0, max(totais.values) * 1.2)
    ax.grid(axis="y", alpha=0.25)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    for barra, valor in zip(barras, totais.values):
        ax.annotate(
            formatar_reais(valor),
            (barra.get_x() + barra.get_width() / 2, barra.get_height()),
            xytext=(0, 5),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=9,
        )

    fig.text(
        0.5,
        0.015,
        "Valor de vendas; não representa lucro.",
        ha="center",
        fontsize=9,
        color="#555555",
    )
    fig.tight_layout(rect=(0, 0.05, 1, 1))
    fig.savefig(caminho_saida, dpi=160, bbox_inches="tight")
    plt.close(fig)


def main():
    dados = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    colunas_necessarias = {"categoria", "cidade", "valor_venda"}
    faltantes = colunas_necessarias.difference(dados.columns)
    if faltantes:
        raise ValueError(f"Colunas ausentes no CSV: {', '.join(sorted(faltantes))}")

    dados["valor_venda"] = pd.to_numeric(dados["valor_venda"], errors="raise")
    total_categoria = dados.groupby("categoria")["valor_venda"].sum()
    total_cidade = dados.groupby("cidade")["valor_venda"].sum()

    criar_grafico_barras(
        total_categoria,
        "Categoria",
        "Valor total vendido por categoria",
        BASE_DIR / "categorias.png",
    )
    criar_grafico_barras(
        total_cidade,
        "Cidade",
        "Valor total vendido por cidade",
        BASE_DIR / "cidades.png",
    )

    print("Totais por categoria (R$):")
    print(total_categoria.sort_values(ascending=False).to_string())
    print("\nTotais por cidade (R$):")
    print(total_cidade.sort_values(ascending=False).to_string())
    print("\nGráficos salvos em categorias.png e cidades.png")


if __name__ == "__main__":
    main()
