import json
import re

all_dnk = json.load(open('complete2.json'))

def save_to_json(filename, dictionary):
    with open(filename, 'w') as file:
        json.dump(list(dictionary), file)


def parse_obj(text):
    text = text.replace('mitochondrial', '').replace('\n', '')
    vals = text.split(' ')
    assert len(vals) == 9
    id, version = vals[0].split('.')
    code = vals[4]
    dna = vals[8]
    return {
        'id': id,
        'code': code,
        'dna': dna,
        'dna_length': len(dna),
        'version': version
    }

def parse_info(filename):
    dnas = []
    with open(filename, 'r', encoding='utf-8') as file:
        text = file.read()
        objects = text.split('>')
        for obj in objects:
            if obj:
                dnas.append(parse_obj(obj))
    return dnas


def parse_obj(text):
    id = re.findall(r'LOCUS\s+(\w+\d+)', text)[0]
    isolation_source = re.findall(r'isolation_source="(.+)"', text)
    isolation_source = isolation_source[0] if isolation_source else None
    country = next(iter(re.findall(r'country="(.+)"', text)), '')
    country_short = country[:3].upper()
    haplogroup = next(iter(re.findall(r'haplogroup="(.+)"', text)), '')
    return {
        'id': id,
        'isolation_source': isolation_source,
        'country': country,
        'country_short': country_short,
        'haplogroup': haplogroup
    }

def parse_info(filename):
    dnas = []
    with open(filename, 'r', encoding='utf-8') as file:
        text = file.read()
        objects = text.split('//')
        for obj in objects:
            if obj:
                dnas.append(parse_obj(obj))
    return dnas


kek = parse_info('Ukraine.fasta')
save_to_json('ukraine_fasta.json', kek)
