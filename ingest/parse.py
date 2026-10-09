import os
import json
import yaml
import re
from markdownify import markdownify as md
from bs4 import BeautifulSoup

try:
    from docling.document_converter import DocumentConverter
    # Force None to prevent C++ segfaults on this machine
    DocumentConverter = None
except ImportError:
    DocumentConverter = None

try:
    import pymupdf4llm
    # Force None to prevent DLL load failures on this machine
    pymupdf4llm = None
except ImportError:
    pymupdf4llm = None

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', 'corpus')
MANIFEST_PATH = os.path.join(CORPUS_DIR, 'manifest.json')
RAW_DIR = os.path.join(CORPUS_DIR, 'raw')
PARSED_DIR = os.path.join(CORPUS_DIR, 'parsed')
ANNOTATIONS_DIR = os.path.join(CORPUS_DIR, 'annotations')

def load_annotations(doc_id):
    ann_path = os.path.join(ANNOTATIONS_DIR, f"{doc_id}.yaml")
    if os.path.exists(ann_path):
        with open(ann_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    return {}

def process_heading_promoters(text, promoters):
    for promoter in promoters:
        regex = promoter.get('regex')
        level = promoter.get('level', 1)
        if regex:
            hashes = '#' * level
            flags = re.MULTILINE
            if regex.startswith("(?i)"):
                regex = regex[4:]
                flags |= re.IGNORECASE
            text = re.sub(f"^({regex}.*)$", rf"{hashes} \1", text, flags=flags)
    return text

def parse_exclude_pages(exclude_list):
    excluded = set()
    for item in exclude_list:
        if isinstance(item, str) and '-' in item:
            start, end = map(int, item.split('-'))
            excluded.update(range(start, end + 1))
        else:
            excluded.add(int(item))
    return excluded

def parse_documents():
    if not os.path.exists(PARSED_DIR):
        os.makedirs(PARSED_DIR, exist_ok=True)

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    for doc_id, doc_info in manifest.items():
        fmt = doc_info.get('format', 'PDF')
        print(f"Parsing {doc_id}...")
        
        ext = '.pdf' if fmt == 'PDF' else '.html'
        raw_path = os.path.join(RAW_DIR, f"{doc_id}{ext}")
        parsed_path = os.path.join(PARSED_DIR, f"{doc_id}.md")
        
        if not os.path.exists(raw_path):
            print(f"  Raw file not found for {doc_id}, skipping.")
            continue

        annotations = load_annotations(doc_id)
        heading_promoters = annotations.get('heading_promoters', [])
        exclude_pages = parse_exclude_pages(annotations.get('exclude_pages', []))
        
        try:
            markdown_content = ""
            if fmt == 'PDF':
                md_text = None
                
                # 1. Try docling (primary for tables/structure)
                if DocumentConverter:
                    try:
                        converter = DocumentConverter()
                        result = converter.convert(raw_path)
                        # Use export_to_markdown() for structure
                        # Note: Docling doesn't natively expose page markers in simple markdown export,
                        # but it's powerful for tables.
                        md_text = result.document.export_to_markdown()
                        print(f"  Successfully parsed {doc_id} with docling.")
                    except Exception as e:
                        print(f"  docling failed for {doc_id}: {e}")
                        md_text = None

                # 2. Try pymupdf4llm (fallback)
                if md_text is None and pymupdf4llm:
                    try:
                        raw_md_chunks = pymupdf4llm.to_markdown(raw_path, page_chunks=True)
                        md_parts = []
                        for chunk in raw_md_chunks:
                            page_num = chunk.get('metadata', {}).get('page', 0) + 1
                            if page_num in exclude_pages:
                                continue
                            page_text = chunk.get('text', '')
                            md_parts.append(f"<!-- page: {page_num} -->\n\n{page_text.strip()}")
                        md_text = "\n\n".join(md_parts)
                        print(f"  Successfully parsed {doc_id} with pymupdf4llm.")
                    except Exception as e:
                        print(f"  pymupdf4llm failed for {doc_id}: {e}")
                        md_text = None

                # 3. Ultimate Fallback (pypdf) if DLLs fail
                if md_text is None:
                    print(f"  Using ultimate fallback (pypdf) for {doc_id}...")
                    from pypdf import PdfReader
                    reader = PdfReader(raw_path)
                    md_parts = []
                    for i, page in enumerate(reader.pages):
                        page_num = i + 1
                        if page_num in exclude_pages:
                            continue
                        page_text = page.extract_text() or ""
                        md_parts.append(f"<!-- page: {page_num} -->\n\n{page_text.strip()}")
                    md_text = "\n\n".join(md_parts)

                markdown_content = md_text
                markdown_content = process_heading_promoters(markdown_content, heading_promoters)
                    
            elif fmt == 'HTML':
                with open(raw_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                soup = BeautifulSoup(html_content, 'html.parser')
                main_content = soup.find('main') or soup.find(id='content') or soup.find(class_='main-content')
                if main_content:
                    soup = main_content
                else:
                    for elm in soup(["nav", "footer", "script", "style", "header", "aside", "noscript"]):
                        elm.decompose()
                
                markdown_content = md(str(soup), heading_style="ATX")
                markdown_content = process_heading_promoters(markdown_content, heading_promoters)
            
            with open(parsed_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            print(f"  Successfully saved {doc_id}.md")
            
        except Exception as e:
            print(f"  Error parsing {doc_id}: {e}")

if __name__ == '__main__':
    parse_documents()
