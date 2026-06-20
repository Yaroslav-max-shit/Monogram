import marshal
from pathlib import Path

PYC_DIR = Path(__file__).parent / 'backend' / '__pycache__'
pyc_files = list(PYC_DIR.glob('auth.cpython-*.pyc'))
if not pyc_files:
    print(f"Error: no auth.pyc found in {PYC_DIR}")
    exit(1)

pyc_path = pyc_files[0]
print(f"Loading {pyc_path}...")

with open(pyc_path, 'rb') as f:
    hdr = f.read(16)
    code = marshal.load(f)

def analyze_code(co, depth=0, results=None):
    if results is None:
        results = {'strings': [], 'names': [], 'code_objects': []}
    results['code_objects'].append(co)
    results['names'].extend(co.co_names)
    for c in co.co_consts:
        if isinstance(c, str):
            results['strings'].append(c)
        elif hasattr(c, 'co_code'):
            analyze_code(c, depth+1, results)
    return results

results = analyze_code(code)
print(f'Total code objects: {len(results["code_objects"])}')
print(f'Total strings: {len(results["strings"])}')
print()

long_strings = [s for s in results['strings'] if len(s) > 5]
print('=== Strings (len > 5) ===')
for i, s in enumerate(long_strings):
    print(f'{i}: {repr(s[:200])}')
