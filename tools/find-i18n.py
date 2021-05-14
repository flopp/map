#!/usr/bin/env python3

import argparse
import json
import os
import re


def record(key, hash):
    d = hash
    ks = key.split('.')
    for k in ks[:-1]:
        if k not in d:
            d[k] = {}
        d = d[k]
    d[ks[-1]] = ""

def scan_html(file_name, hash):
    r = re.compile(r'data-i18n="([^"]+)"')
    with open(file_name) as f:
        content = f.read()
        for m in r.finditer(content):
            record(m[1], hash)

def scan_js(file_name, hash):
    r1 = re.compile(r'\.translate\(\s*\'([^\']+)\'')
    r2 = re.compile(r'\.translate\(\s*\"([^\"]+)\"')
    with open(file_name) as f:
        content = f.read()
        for m in r1.finditer(content):
            record(m[1], hash)
        for m in r2.finditer(content):
            record(m[1], hash)

def merge(into, keys, path=[]):
    for key in keys:
        if key in into:
            if isinstance(into[key], dict):
                if isinstance(keys[key], dict):
                    merge(into[key], keys[key], path + [str(key)])
                else:
                    raise ValueError(f'key {path} has sub-keys in target, but is leaf in source extraction')
            elif isinstance(keys[key], dict):
                raise ValueError(f'key {path} is leaf in target, but has sub-keys in source extraction')
            else:
                pass
        else:
            into[key] = keys[key]
    for key in into:
        if key not in keys:
            raise ValueError(f'key {path}/{key} is in target, but not in source extraction')

parser = argparse.ArgumentParser()
parser.add_argument('files', metavar='SOURCE_FILE', type=str, nargs='+', help='source file to scan for i18n statements')
parser.add_argument('-t', '--translation', metavar='CATALOG_FILE', type=str, action='append', help='translation catalog file to create/update')
args = parser.parse_args()

hash = {}
for file_name in args.files:
    extension = os.path.splitext(file_name)[1]
    if extension == '.html':
        scan_html(file_name, hash)
    elif extension in ['.js', '.ts']:
        scan_js(file_name, hash)
    else:
        print(f'{file_name}: unsupported file type')
hash = {'main': hash}

if args.translation is not None:
    for file_name in args.translation:
        if os.path.exists(file_name):
            with open(file_name) as json_file:
                catalog = json.load(json_file)
        else:
            catalog = {}   
        merge(catalog, hash)
        with open(file_name, 'w') as json_file:
            json.dump(catalog, json_file, sort_keys=True, indent=4)

    
    