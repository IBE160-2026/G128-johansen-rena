"""Lokale dokumentkontroller. Kjør: python3 OpenAI_QA/kontroller.py.

Ingen eksterne pakker, nettverkskall eller endringer i prosjektgrunnlaget.
Resultatene er observasjoner; scriptet avgjør ikke dokumentenes kvalitet.
"""
import ast
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent


def main():
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=ROOT
    ).decode().split("\0")
    files = [ROOT / p for p in tracked if p and (ROOT / p).is_file()]
    docs = [p for p in files if p.suffix == ".md" and not
            p.relative_to(ROOT).parts[0] in (".claude", "_bmad", "OpenAI_QA")]
    broken = []
    for path in docs:
        for number, line in enumerate(path.read_text().splitlines(), 1):
            for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", line):
                if re.match(r"[a-zA-Z]+:|#", target):
                    continue
                target = unquote(target.split("#")[0].strip("<>"))
                if target and not (path.parent / target).exists():
                    broken.append({"file": str(path.relative_to(ROOT)),
                                   "line": number, "target": target})
    syntax_errors = []
    python_files = [p for p in files if p.suffix == ".py"]
    for path in python_files:
        try:
            ast.parse(path.read_text(), filename=str(path))
        except SyntaxError as error:
            syntax_errors.append({"file": str(path.relative_to(ROOT)),
                                  "error": str(error)})
    epics = (ROOT / "planning-artifacts/epics.md").read_text()
    prd = next((ROOT / "planning-artifacts/prds").glob("*/prd.md")).read_text()
    spine_dir = next((ROOT / "planning-artifacts/architecture").iterdir())
    lint = subprocess.run(
        [sys.executable, str(ROOT / ".claude/skills/bmad-architecture/scripts/lint_spine.py"),
         "--workspace", str(spine_dir)], capture_output=True, text=True)
    result = {
        "baseline_commit": subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT).decode().strip(),
        "python": sys.version.split()[0],
        "tracked_files": len(files),
        "documents_checked": [str(p.relative_to(ROOT)) for p in docs],
        "broken_local_markdown_links": broken,
        "python_files_parsed": len(python_files),
        "python_syntax_errors": syntax_errors,
        "product_entrypoints": {p: (ROOT / p).exists() for p in
                                ("package.json", "src", "supabase", "e2e", ".env.example")},
        "story_ids": re.findall(r"^### Story ([0-9.]+):", epics, re.M),
        "prd_fr_ids": sorted(set(re.findall(r"^#### FR-(\d+):", prd, re.M)), key=int),
        "spine_lint_exit_code": lint.returncode,
        "spine_lint": json.loads(lint.stdout) if lint.stdout.strip().startswith("{") else lint.stdout,
        "spine_lint_stderr": lint.stderr,
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
