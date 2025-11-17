"""
Download images from Zalo sticker pack pages into a local folder.

Usage:
  python3 scripts/download_zalo_stickers.py urls.txt --out ./downloads/stickers
  or
  python3 scripts/download_zalo_stickers.py https://... https://...

The script will try to extract any image URLs (png/jpg/webp/gif/svg) found in the HTML for each pack
and download them. Zalo pages may load assets dynamically; this script uses a best-effort regex
and optional BeautifulSoup pass to collect image links.

After download you can run:
  python3 scripts/import_stickers.py ./downloads/stickers --created-by 1

Requirements:
  pip install requests beautifulsoup4

Note: I cannot run network requests from inside this workspace; run this script locally on your machine.
"""

import sys
import os
import re
import requests
from urllib.parse import urlparse
from pathlib import Path

try:
    from bs4 import BeautifulSoup
    HAVE_BS4 = True
except Exception:
    HAVE_BS4 = False

IMG_EXT_RE = re.compile(r'https?://[^"\'\)\s>]+\.(?:png|jpg|jpeg|webp|gif|svg)')


def collect_image_urls(html, base_url=None):
    urls = set()
    # regex scan
    for m in IMG_EXT_RE.findall(html):
        urls.add(m)
    # try BeautifulSoup for <img> tags if available
    if HAVE_BS4:
        soup = BeautifulSoup(html, 'html.parser')
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if not src:
                continue
            # resolve relative
            if src.startswith('//'):
                src = 'https:' + src
            if base_url and src.startswith('/'):
                parsed = urlparse(base_url)
                src = f"{parsed.scheme}://{parsed.netloc}{src}"
            if IMG_EXT_RE.match(src):
                urls.add(src)
    return sorted(urls)


def download_url(url, dest_folder):
    try:
        r = requests.get(url, stream=True, timeout=15)
        r.raise_for_status()
    except Exception as e:
        print(f"  [x] Failed to download {url}: {e}")
        return False
    # derive filename
    p = urlparse(url)
    name = os.path.basename(p.path)
    if not name:
        name = f"img_{abs(hash(url))}.png"
    dest = os.path.join(dest_folder, name)
    # avoid re-download
    if os.path.exists(dest):
        print(f"  [-] Skipping existing: {name}")
        return True
    with open(dest, 'wb') as f:
        for chunk in r.iter_content(8192):
            if chunk:
                f.write(chunk)
    print(f"  [+] Saved {name}")
    return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/download_zalo_stickers.py <url1> <url2> ... OR a file with URLs (one per line)')
        sys.exit(1)

    args = sys.argv[1:]
    out = './downloads/stickers'
    # check for --out
    if '--out' in args:
        i = args.index('--out')
        if i + 1 < len(args):
            out = args[i+1]
            del args[i:i+2]

    # if first arg is a file path, read URLs from file
    urls = []
    if len(args) == 1 and os.path.isfile(args[0]):
        with open(args[0], 'r') as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith('#'): continue
                urls.append(line)
    else:
        urls = args

    Path(out).mkdir(parents=True, exist_ok=True)

    print(f'Downloading to {out}...')
    for u in urls:
        print(f'Processing: {u}')
        try:
            r = requests.get(u, timeout=15)
            r.raise_for_status()
            html = r.text
        except Exception as e:
            print(f'  [x] Failed to fetch {u}: {e}')
            continue

        imgs = collect_image_urls(html, base_url=u)
        if not imgs:
            print('  [!] No image links found via regex/HTML scan. The page may load assets dynamically via JS.')
            print('      Try opening the page in a browser and saving images manually, or enable a headless browser.')
            continue

        print(f'  Found {len(imgs)} candidate images. Attempting to download...')
        for img in imgs:
            download_url(img, out)

    print('\nDone. If you want to import into server DB run:')
    print('  python3 scripts/import_stickers.py', out, '--created-by <user_id>')
