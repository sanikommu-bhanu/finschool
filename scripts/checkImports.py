#!/usr/bin/env python3
"""
Verify every internal ('@/...') import against what the target module actually exports.

This catches the error class that dominates code written across many sessions without a
compiler: importing a symbol that was renamed, never created, or lives in a different
module (TS2305 / TS2307 / TS2724). It needs no node_modules, so it runs offline.

Deliberately conservative: it only reports a missing symbol when it can fully parse the
target module's exports. Anything ambiguous (wildcard re-exports it can't follow, etc.)
is reported separately as "unresolved" rather than asserted as an error.
"""
import os
import re
import sys
from collections import defaultdict

SRC = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))
EXTS = (".ts", ".tsx", ".d.ts")


def resolve(spec):
    """Resolve an '@/foo/bar' import spec to a real file path."""
    rel = spec[2:] if spec.startswith("@/") else spec
    base = os.path.join(SRC, rel)
    for cand in (
        base + ".ts", base + ".tsx", base + ".d.ts",
        os.path.join(base, "index.ts"), os.path.join(base, "index.tsx"),
    ):
        if os.path.isfile(cand):
            return cand
    return None


def strip_comments(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)^\s*//.*$", "", text)
    return text


NAMED_DECL = re.compile(
    r"^\s*export\s+(?:declare\s+)?"
    r"(?:async\s+)?"
    r"(?:function\s*\*?|class|const|let|var|interface|type|enum|abstract\s+class)\s+"
    r"([A-Za-z_$][\w$]*)",
    re.M,
)
EXPORT_BLOCK = re.compile(r"export\s*\{([^}]*)\}(?:\s*from\s*['\"]([^'\"]+)['\"])?", re.S)
EXPORT_STAR = re.compile(r"export\s*\*\s*(?:as\s+([A-Za-z_$][\w$]*)\s+)?from\s*['\"]([^'\"]+)['\"]")
HAS_DEFAULT = re.compile(r"export\s+default\b")


def exports_of(path, _seen=None):
    """Return (named_exports:set, has_default:bool, fully_resolved:bool)."""
    if _seen is None:
        _seen = set()
    if path in _seen:
        return set(), False, True
    _seen.add(path)

    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = strip_comments(fh.read())
    except OSError:
        return set(), False, False

    names = set(NAMED_DECL.findall(text))
    has_default = bool(HAS_DEFAULT.search(text))
    resolved = True

    for body, src in EXPORT_BLOCK.findall(text):
        for piece in body.split(","):
            piece = piece.strip()
            if not piece:
                continue
            piece = re.sub(r"^type\s+", "", piece)
            m = re.match(r"([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$", piece)
            if m:
                exported_as = m.group(2) or m.group(1)
                if exported_as == "default":
                    has_default = True
                else:
                    names.add(exported_as)

    # Follow wildcard re-exports so barrel files resolve correctly.
    for alias, src in EXPORT_STAR.findall(text):
        if alias:
            names.add(alias)
            continue
        target = resolve(src) if src.startswith("@/") else resolve_relative(path, src)
        if target:
            sub_names, _sub_default, sub_ok = exports_of(target, _seen)
            names |= sub_names
            resolved = resolved and sub_ok
        else:
            resolved = False

    return names, has_default, resolved


def resolve_relative(from_file, spec):
    if not spec.startswith("."):
        return None
    base = os.path.normpath(os.path.join(os.path.dirname(from_file), spec))
    for cand in (
        base + ".ts", base + ".tsx", base + ".d.ts",
        os.path.join(base, "index.ts"), os.path.join(base, "index.tsx"),
    ):
        if os.path.isfile(cand):
            return cand
    return None


# The clause is matched as [^;]* so it can never run past the end of one import
# statement into the next. An earlier version used [\s\S]*? which lazily swallowed
# whole intervening statements and mis-attributed their symbols to the following
# module path — producing hundreds of phantom errors.
IMPORT_RE = re.compile(
    r"(?m)^\s*import\s+(?:type\s+)?([^;]*?)\s+from\s*['\"](@/[^'\"]+)['\"]"
)

missing_module = []
missing_symbol = []
missing_default = []
unresolved = []
checked = 0

all_files = []
for root, _dirs, files in os.walk(SRC):
    for name in files:
        if name.endswith(EXTS):
            all_files.append(os.path.join(root, name))

cache = {}

for path in sorted(all_files):
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = strip_comments(fh.read())
    rel_self = os.path.relpath(path, SRC)

    for clause, spec in IMPORT_RE.findall(text):
        target = resolve(spec)
        if target is None:
            missing_module.append((rel_self, spec))
            continue

        if target not in cache:
            cache[target] = exports_of(target)
        names, has_default, fully = cache[target]

        clause = clause.strip()
        # Split "Default, { A, B }" into its two halves.
        brace = re.search(r"\{([\s\S]*)\}", clause)
        default_part = clause[: brace.start()].rstrip(", \t\n") if brace else clause
        named_part = brace.group(1) if brace else ""

        if default_part and not default_part.startswith("*"):
            dname = default_part.strip().rstrip(",").strip()
            if dname and re.match(r"^[A-Za-z_$][\w$]*$", dname):
                checked += 1
                if not has_default:
                    missing_default.append((rel_self, spec, dname))

        for piece in named_part.split(","):
            piece = piece.strip()
            if not piece:
                continue
            piece = re.sub(r"^type\s+", "", piece).strip()
            m = re.match(r"^([A-Za-z_$][\w$]*)(?:\s+as\s+[A-Za-z_$][\w$]*)?$", piece)
            if not m:
                continue
            sym = m.group(1)
            checked += 1
            if sym in names:
                continue
            if fully:
                missing_symbol.append((rel_self, spec, sym))
            else:
                unresolved.append((rel_self, spec, sym))

print(f"internal import bindings checked: {checked}")
print(f"files scanned: {len(all_files)}\n")

def show(title, rows, fmt):
    print(f"=== {title}: {len(rows)} ===")
    for row in rows:
        print("  " + fmt(row))
    print()

show("MODULE NOT FOUND (would be TS2307)", missing_module,
     lambda r: f"{r[0]}  ->  {r[1]}")
show("SYMBOL NOT EXPORTED (would be TS2305)", missing_symbol,
     lambda r: f"{r[0]}  ->  {r[1]}  has no export '{r[2]}'")
show("DEFAULT IMPORT BUT NO DEFAULT EXPORT (would be TS1192)", missing_default,
     lambda r: f"{r[0]}  ->  {r[1]}  imported as default '{r[2]}'")
show("UNVERIFIABLE (barrel/wildcard couldn't be followed)", unresolved,
     lambda r: f"{r[0]}  ->  {r[1]}  '{r[2]}'")

total = len(missing_module) + len(missing_symbol) + len(missing_default)
print(f"HARD FAILURES: {total}")
sys.exit(0)
