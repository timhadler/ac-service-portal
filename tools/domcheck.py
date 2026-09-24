#!/usr/bin/env python3
"""tools/domcheck.py — prove two HTML files render the same.

    python3 tools/domcheck.py OLD.html NEW.html

Walks both documents and compares a token stream of (tag, sorted attributes,
whitespace-collapsed text). Insignificant whitespace between tags is ignored,
so it answers the one question a byte diff cannot: did the DOM change?

Safe on this repo because there is no <pre> and no non-empty <textarea>
anywhere in it — inside those, whitespace would be significant.
"""
import sys
from html.parser import HTMLParser

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Tokens(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []

    def handle_starttag(self, tag, attrs):
        self.out.append((tag, tuple(sorted((k, v) for k, v in attrs))))
        if tag in VOID:
            self.out.append(('/' + tag, ()))

    def handle_startendtag(self, tag, attrs):
        self.out.append((tag, tuple(sorted((k, v) for k, v in attrs))))
        self.out.append(('/' + tag, ()))

    def handle_endtag(self, tag):
        if tag not in VOID:
            self.out.append(('/' + tag, ()))

    def handle_data(self, data):
        text = ' '.join(data.split())
        if text:
            self.out.append(('#text', text))


def tokens(path):
    p = Tokens()
    p.feed(open(path, encoding='utf-8').read())
    return p.out


def main(a, b):
    ta, tb = tokens(a), tokens(b)
    if ta == tb:
        print(f'DOM identical: {a} == {b}  ({len(ta)} nodes)')
        return 0
    for i, (x, y) in enumerate(zip(ta, tb)):
        if x != y:
            print(f'first difference at node {i}:\n  {a}: {x!r}\n  {b}: {y!r}')
            break
    else:
        print(f'same prefix, different length: {len(ta)} vs {len(tb)} nodes')
        longer, name = (ta, a) if len(ta) > len(tb) else (tb, b)
        print(f'  extra in {name}: {longer[min(len(ta), len(tb)):][:4]!r}')
    return 1


if __name__ == '__main__':
    sys.exit(main(*sys.argv[1:3]))
