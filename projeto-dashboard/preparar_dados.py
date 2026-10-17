"""Prepara a cópia limpa de vendas para o dashboard estático."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "papelaria_limpa.csv"
OUTPUT = Path(__file__).resolve().parent / "site" / "data" / "vendas.json"
REQUIRED = [
    "id_venda",
    "data",
    "cidade",
    "categoria",
    "produto",
    "quantidade",
    "preco_unitario",
    "forma_pagamento",
    "valor_venda",
]


def prepare() -> int:
    if not SOURCE.exists():
        raise FileNotFoundError(f"CSV limpo não encontrado: {SOURCE}")

    df = pd.read_csv(SOURCE, encoding="utf-8")
    missing_columns = sorted(set(REQUIRED) - set(df.columns))
    if missing_columns:
        raise ValueError(f"Colunas obrigatórias ausentes: {', '.join(missing_columns)}")

    df = df[REQUIRED].copy()
    for column in ("id_venda", "cidade", "categoria", "produto", "forma_pagamento"):
        df[column] = df[column].astype("string").str.strip()
        if df[column].isna().any() or df[column].eq("").any():
            raise ValueError(f"Há valores vazios em {column}")

    df["data"] = pd.to_datetime(df["data"], errors="raise").dt.strftime("%Y-%m-%d")
    for column in ("quantidade", "preco_unitario", "valor_venda"):
        df[column] = pd.to_numeric(df[column], errors="raise")
        if not df[column].map(lambda value: pd.notna(value) and abs(float(value)) != float("inf")).all():
            raise ValueError(f"Há valores numéricos inválidos em {column}")

    if df["id_venda"].duplicated().any():
        raise ValueError("id_venda deve identificar uma venda; duplicatas encontradas")
    if (df["quantidade"] <= 0).any() or (df["preco_unitario"] <= 0).any():
        raise ValueError("Quantidade e preço unitário devem ser positivos")

    # Recalcula o valor a partir dos campos de origem para evitar propagar discrepâncias.
    calculated = (df["quantidade"] * df["preco_unitario"]).round(2)
    if not (calculated.sub(df["valor_venda"]).abs() <= 0.01).all():
        raise ValueError("valor_venda não confere com quantidade × preco_unitario")
    df["valor_venda"] = calculated
    df["quantidade"] = df["quantidade"].astype(int)
    df["preco_unitario"] = df["preco_unitario"].round(2)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    records = df.to_dict(orient="records")
    with OUTPUT.open("w", encoding="utf-8", newline="\n") as output:
        json.dump(records, output, ensure_ascii=False, indent=2, allow_nan=False)
        output.write("\n")

    print(f"Preparadas {len(records)} vendas em {OUTPUT.relative_to(ROOT)}")
    print(f"Total vendido: R$ {df['valor_venda'].sum():,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    return len(records)


if __name__ == "__main__":
    prepare()
