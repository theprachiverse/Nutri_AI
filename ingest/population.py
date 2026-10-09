import os
import yaml
import re

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', 'corpus')
ANNOTATIONS_DIR = os.path.join(CORPUS_DIR, 'annotations')

# Standard population tags
POPULATION_MAP = {
    'infant': 'infants',
    'baby': 'infants',
    'toddler': 'children',
    'child': 'children',
    'children': 'children',
    'teen': 'adolescents',
    'adolescent': 'adolescents',
    'elderly': 'older_adults',
    'senior': 'older_adults',
    'older adult': 'older_adults',
    'pregnant': 'pregnant_women',
    'pregnancy': 'pregnant_women',
    'fbo': 'food_business_operators',
    'food business operator': 'food_business_operators'
}

def load_annotations(doc_id):
    ann_path = os.path.join(ANNOTATIONS_DIR, f"{doc_id}.yaml")
    if os.path.exists(ann_path):
        with open(ann_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    return {}

def extract_population_tags(text, doc_id=None):
    tags = set()
    text_lower = text.lower()
    
    # 1. Keyword-based extraction
    for keyword, tag in POPULATION_MAP.items():
        if re.search(rf'\b{keyword}\b', text_lower):
            tags.add(tag)
            
    # 2. Overrides from annotations
    if doc_id:
        ann = load_annotations(doc_id)
        # Check if the doc entirely excludes or forces some population?
        # The plan says "Override keyword detection using the annotations/Dn.yaml files."
        force_tags = ann.get('force_population_tags', [])
        tags.update(force_tags)
        
        exclude_tags = ann.get('exclude_population_tags', [])
        for ex_tag in exclude_tags:
            tags.discard(ex_tag)

    # Default to general_adults if nothing else is specified or if it's broad guidance
    if not tags:
        tags.add('general_adults')
        
    return list(tags)
