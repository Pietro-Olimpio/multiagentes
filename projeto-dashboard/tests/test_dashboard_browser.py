"""Executa o teste de integração sem bibliotecas de terceiros."""

from __future__ import annotations

import os
import shutil
import subprocess
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_suffix(".cjs")
BROWSERS = (
    Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
    Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Microsoft/Edge/Application/msedge.exe",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Google/Chrome/Application/chrome.exe",
)


class DashboardBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if shutil.which("node") is None:
            raise unittest.SkipTest("Node.js não encontrado; integração de navegador pendente.")
        if not any(browser.is_file() for browser in BROWSERS):
            raise unittest.SkipTest("Chrome/Edge não encontrado; integração de navegador pendente.")

    def test_dashboard_interactions_in_real_browser(self) -> None:
        result = subprocess.run(
            ["node", str(SCRIPT)],
            check=False,
            capture_output=True,
            text=True,
            timeout=90,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        print(result.stdout, end="")


if __name__ == "__main__":
    unittest.main(verbosity=2)
