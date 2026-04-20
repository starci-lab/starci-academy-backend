import os
import chardet

base_path = r'c:\Repositories\ac\starci-academy-backend\.mount\data\courses\0-fullstack-mastery\modules'
modules = os.listdir(base_path)

for m in modules:
    vi_path = os.path.join(base_path, m, 'vi.md')
    if os.path.exists(vi_path):
        with open(vi_path, 'rb') as f:
            raw = f.read()
            result = chardet.detect(raw)
            print(f"{m}/vi.md: {result['encoding']} (confidence {result['confidence']})")
            if raw.startswith(b'\xef\xbb\xbf'):
                print(f"  -> has BOM")
