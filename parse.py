import json
import re

#all_dnk = json.load(open('complete2.json'))

def save_to_json(filename, dictionary):
    with open(filename, 'w') as file:
        json.dump(list(dictionary), file)


def parse_obj_fasta(text):
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

def parse_obj_gp(text):
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

def parse_gp(filename):
    dnas = []
    with open(filename, 'r', encoding='utf-8') as file:
        text = file.read()
        objects = text.split('//')
        for obj in objects:
            if obj:
                dnas.append(parse_obj_gp(obj))
    return dnas


def parse_fasta(filename):
    dnas = []
    with open(filename, 'r', encoding='utf-8') as file:
        text = file.read()
        objects = text.split('>')
        for obj in objects:
            if obj:
                dnas.append(parse_obj_fasta(obj))
    return dnas


# gp = parse_gp('balto_slavic.gp')
# save_to_json('balto_slavic_gp1.json', gp)

# fasta = parse_fasta('balto_slavic.fasta')
# save_to_json('balto_slavic_fasta1.json', fasta)



def combine_fasta_gp(fasta, gp):
    res = []
    for fasta_obj in fasta:
        gp_obj = next(filter(lambda d: d['id'] == fasta_obj['id'], gp))
        res.append({**gp_obj, **fasta_obj})
    return res


def combine_all(fasta_slav, gp_slav, fasta_ukr, gp_ukr):
    fasta = []
    gp = []
    fasta.extend(fasta_slav)
    fasta.extend(fasta_ukr)
    gp.extend(gp_slav)
    gp.extend(gp_ukr)
    all_data = combine_fasta_gp(fasta, gp)
    for obj in all_data:
        obj['dna'] = obj['dna'].replace('N', '')[:377]
    return all_data

all_data = combine_all(
    fasta_slav=json.load(open('balto_slavic_fasta1.json')),
    gp_slav=json.load(open('balto_slavic_gp1.json')),
    fasta_ukr=json.load(open('ukraine_fasta1.json')),
    gp_ukr=json.load(open('ukraine_gp1.json'))
)
save_to_json('result1.json', all_data)

# for dnk in all_dnk:
#     if len(dnk['dna']) > 377:
#         dnk['dna'] = dnk['dna'][:377]
#     if dnk['country_short'] == 'CZE':
#         dnk['dna'] = dnk['dna'][:312]
#
# save_to_json('complete2.json', all_dnk)
# print('asasds')
