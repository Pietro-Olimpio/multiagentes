"""Baseline independente para o CSV indicado, sem depender do contrato do dashboard."""

from __future__ import annotations

import csv
import hashlib
import unittest
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "papelaria_limpa.csv"
SOURCE_SHA256 = "54b3dc935f673dfadae68b2313186948f5c35a0fdc9a54de81537bdf5f837621"
EXPECTED_COLUMNS = (
    "id_venda",
    "data",
    "cidade",
    "categoria",
    "produto",
    "quantidade",
    "preco_unitario",
    "forma_pagamento",
    "valor_venda",
)


def read_source() -> list[dict[str, str]]:
    with SOURCE.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def independent_totals(rows: list[dict[str, str]]) -> tuple[Decimal, dict[str, Decimal]]:
    """Recalcula vendas por quantidade × preço, sem usar a coluna derivada."""
    total = Decimal("0.00")
    by_category: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for row in rows:
        amount = Decimal(row["quantidade"]) * Decimal(row["preco_unitario"])
        total += amount
        by_category[row["categoria"]] += amount
    return total, dict(by_category)


class SourceBaselineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.rows = read_source()

    def test_source_bytes_match_recorded_sha256(self) -> None:
        digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
        self.assertEqual(digest, SOURCE_SHA256, "O CSV fornecido foi alterado.")

    def test_schema_row_count_and_required_values(self) -> None:
        self.assertEqual(tuple(self.rows[0].keys()), EXPECTED_COLUMNS)
        self.assertEqual(len(self.rows), 180)
        for line_number, row in enumerate(self.rows, start=2):
            with self.subTest(line=line_number):
                self.assertEqual(set(row), set(EXPECTED_COLUMNS))
                self.assertTrue(all(value.strip() for value in row.values()), f"Campo vazio na linha {line_number}")
                self.assertRegex(row["id_venda"], r"^V\d{4}$")
                self.assertTrue(1 <= int(row["quantidade"]) <= 5)
                self.assertGreater(Decimal(row["preco_unitario"]), Decimal("0"))
                self.assertEqual(date.fromisoformat(row["data"]).isoformat(), row["data"])
                self.assertEqual(Decimal(row["valor_venda"]).as_tuple().exponent, -2)

    def test_ids_and_rows_follow_cleaned_duplicate_policy(self) -> None:
        ids = [row["id_venda"] for row in self.rows]
        self.assertEqual(len(ids), len(set(ids)), "IDs devem ser únicos após manter primeira ocorrência.")
        canonical_rows = [tuple(row[column] for column in EXPECTED_COLUMNS) for row in self.rows]
        self.assertEqual(len(canonical_rows), len(set(canonical_rows)), "Não devem restar linhas idênticas duplicadas.")

    def test_independent_total_and_groupings_match_known_results(self) -> None:
        total, by_category = independent_totals(self.rows)
        self.assertEqual(total, Decimal("20059.00"))
        self.assertEqual(
            by_category,
            {
                "Acessórios": Decimal("10517.00"),
                "Livros": Decimal("7438.00"),
                "Papelaria": Decimal("2104.00"),
            },
        )
        self.assertEqual(sum(by_category.values(), Decimal("0.00")), total)

    def test_known_small_example_guards_oracle(self) -> None:
        example = [
            {"categoria": "A", "quantidade": "2", "preco_unitario": "3.50"},
            {"categoria": "B", "quantidade": "1", "preco_unitario": "10.00"},
            {"categoria": "A", "quantidade": "3", "preco_unitario": "1.00"},
        ]
        total, by_category = independent_totals(example)
        self.assertEqual(total, Decimal("20.00"))
        self.assertEqual(by_category, {"A": Decimal("10.00"), "B": Decimal("10.00")})


if __name__ == "__main__":
    unittest.main()
