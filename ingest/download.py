import os
import json
import hashlib
import requests
from datetime import datetime
from bs4 import BeautifulSoup

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', 'corpus')
MANIFEST_PATH = os.path.join(CORPUS_DIR, 'manifest.json')
RAW_DIR = os.path.join(CORPUS_DIR, 'raw')

def get_sha256(content):
    return hashlib.sha256(content).hexdigest()

def download_documents():
    if not os.path.exists(RAW_DIR):
        os.makedirs(RAW_DIR)

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    })

    for doc_id, doc_info in manifest.items():
        url = doc_info['source_url']
        fmt = doc_info['format']
        print(f"Downloading {doc_id} from {url}...")
        
        try:
            response = session.get(url, timeout=30, verify=False)
            response.raise_for_status()

            content = response.content

            # Handle D2 (Health Canada) cookie interstitial
            if doc_id == 'D2' and b'%PDF' not in content[:1024]:
                print(f"  Handling interstitial for {doc_id}...")
                headers = {
                    "Referer": "https://publications.gc.ca/site/archivee-archived.html?url=https%3A%2F%2Fpublications.gc.ca%2Fcollections%2Fcollection_2019%2Fsc-hc%2FH164-231-2019-eng.pdf"
                }
                response = session.get(url, headers=headers, timeout=30, verify=False)
                response.raise_for_status()
                content = response.content

            # Validate PDF
            if fmt == 'PDF':
                if b'%PDF' not in content[:1024]:
                    print(f"  Warning: {doc_id} does not appear to be a valid PDF.")
                ext = '.pdf'
            elif fmt == 'HTML':
                # Generate a dated snapshot via beautifulsoup4
                soup = BeautifulSoup(content, 'html.parser')
                content = str(soup).encode('utf-8')
                ext = '.html'
            else:
                ext = ''

            file_path = os.path.join(RAW_DIR, f"{doc_id}{ext}")
            with open(file_path, 'wb') as f:
                f.write(content)

            sha256_hash = get_sha256(content)
            retrieval_date = datetime.utcnow().isoformat() + "Z"
            
            manifest[doc_id]['sha256'] = sha256_hash
            manifest[doc_id]['retrieval_date'] = retrieval_date
            
            print(f"  Saved {doc_id}{ext} (SHA256: {sha256_hash})")

        except Exception as e:
            print(f"  Failed to download {doc_id}: {e}")

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

if __name__ == '__main__':
    download_documents()
