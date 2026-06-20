import re
import shutil
from pathlib import Path

AUTH_PATH = Path(__file__).parent / 'backend' / 'routes' / 'auth.py'

if not AUTH_PATH.exists():
    print(f"Error: {AUTH_PATH} not found. Run this script from the MonogramApp directory.")
    exit(1)

shutil.copy2(AUTH_PATH, AUTH_PATH.with_suffix('.py.bak'))
print(f"Backup saved to {AUTH_PATH.with_suffix('.py.bak')}")

with open(AUTH_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# The corrupted text is the result of UTF-8 bytes being interpreted as Windows-1251
# To fix: take each corrupted character, use its Windows-1251 byte value,
# then interpret that byte as part of a UTF-8 sequence.

def fix_mojibake(s):
    """Fix mojibake: UTF-8 bytes interpreted as CP1251 and saved as UTF-8 again."""
    try:
        # Encode the mojibake chars to CP1251 bytes
        raw = s.encode('cp1251')
        # Decode those bytes as UTF-8 (they were originally UTF-8)
        return raw.decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError) as e:
        # If some chars can't be encoded, try partial fix
        result = []
        for ch in s:
            try:
                byte = ch.encode('cp1251')
                result.append(byte.decode('utf-8'))
            except:
                result.append(ch)
        return ''.join(result)

# Map of known fixed strings (direct replacements for ones that can't auto-fix)
fixes = {
    'РљРћРќР¤РР“РЈР РђР¦РРЇ': 'КОНФИГУРАЦИЯ',
    'Р’РЎРџРћРњРћР“РђРўР•Р›Р¬РќР«Р• Р¤РЈРќРљР¦РР': 'ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ',
    'PYDANTIC РњРћР”Р•Р›Р': 'PYDANTIC МОДЕЛИ',
    'Р Р•Р“РРЎРўР РђР¦РРЇ РЎ РџРћР”РўР’Р•Р Р–Р”Р•РќРР•Рњ EMAIL': 'РЕГИСТРАЦИЯ С ПОДТВЕРЖДЕНИЕМ EMAIL',
    'РџР РћРЎРўРђРЇ Р Р•Р“РРЎРўР РђР¦РРЇ (Р‘Р•Р— РџРћР”РўР’Р•Р Р–Р”Р•РќРРЇ)': 'ПРОСТАЯ РЕГИСТРАЦИЯ (БЕЗ ПОДТВЕРЖДЕНИЯ)',
    'CSRF TOKEN': 'CSRF TOKEN',
    'Р›РћР“РРќ Р Р›РћР“РђРЈРў': 'ЛОГИН И ЛОГАУТ',
    'РџРћР›Р¬Р—РћР’РђРўР•Р›Р¬': 'ПОЛЬЗОВАТЕЛЬ',
    'GOOGLE AUTH': 'GOOGLE AUTH',
    'YANDEX AUTH': 'YANDEX AUTH',
    'QR Р›РћР“РРќ': 'QR ЛОГИН',
}

lines = text.split('\n')
fixed_lines = []
fixed_count = 0

for line in lines:
    original = line
    # Try auto-fix first
    if '#' in line or '"""' in line or "detail=" in line or "description=" in line:
        try:
            fixed = fix_mojibake(line)
            if fixed != line:
                line = fixed
                fixed_count += 1
        except:
            pass
    
    # Apply manual fixes for remaining known patterns
    for corrupted, correct in fixes.items():
        if corrupted in line:
            line = line.replace(corrupted, correct)
            fixed_count += 1
    
    fixed_lines.append(line)

new_text = '\n'.join(fixed_lines)
with open(AUTH_PATH, 'w', encoding='utf-8') as f:
    f.write(new_text)

print(f'Fixed {fixed_count} lines')

# Show sample fixes
for i, (old_line, new_line) in enumerate(zip(text.split('\n'), fixed_lines)):
    if old_line != new_line:
        print(f'  Line {i+1}: {new_line.strip()[:60]}')
        if i > 50:
            break
