#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from collections import Counter, defaultdict
from datetime import date, timedelta
from decimal import Decimal, localcontext, ROUND_HALF_UP
from pathlib import Path

COST = 'BELGE_TARIHINDEKI_SON_ALIS_FIYATI'

def exact(value):
    if value is None:
        return None
    return Decimal(value)

def text(value):
    if value is None:
        return None
    result = format(value, 'f')
    if '.' in result:
        result = result.rstrip('0').rstrip('.')
    return '0' if Decimal(result) == 0 else result

def classify(header, line):
    kind = header['FIS_TURU']
    reason = None
    amount, quantity, multiplier, unit_cost = (exact(line.get(k)) for k in
        ['TOPLAM_KDV_MATRAHI', 'MIKTAR_FIS', 'CARPAN', COST])
    candidate = kind in ['11', '12'] and header['CURRENCY'] == 'TRY' and header['DURUM'] == '1' and header['AKTIF'] == '1'
    sale_amount = amount if candidate and kind == '11' and amount is not None and amount >= 0 else None
    return_amount = -amount if candidate and kind == '12' and amount is not None and amount >= 0 else None
    if kind == '35': reason = 'TYPE_35'
    elif kind not in ['11', '12']: reason = 'OTHER_TYPE'
    elif header['CURRENCY'] != 'TRY': reason = 'UNSUPPORTED_CURRENCY'
    elif header['DURUM'] != '1' or header['AKTIF'] != '1': reason = 'UNSUPPORTED_STATUS'
    elif amount is None or amount < 0: reason = 'INVALID_AMOUNT'
    elif kind == '12': reason = 'RETURN_ATTRIBUTION'
    elif quantity is None or quantity <= 0: reason = 'INVALID_QUANTITY'
    elif multiplier is None or multiplier != 1: reason = 'UNSUPPORTED_MULTIPLIER'
    elif unit_cost is None: reason = 'MISSING_COST'
    elif unit_cost == 0: reason = 'ZERO_COST'
    elif unit_cost < 0: reason = 'NEGATIVE_COST'
    cost = quantity * unit_cost if reason is None else None
    return {'lineId': line['ID'], 'documentId': line['FIS'], 'productId': line['STOK'],
        'date': header['FIS_TARIHI'][:10], 'typeCode': kind, 'reason': reason,
        'saleAmount': text(sale_amount), 'returnAmount': text(return_amount),
        'coveredSaleAmount': text(amount if reason is None else None),
        'candidateCost': text(cost), 'contribution': text(amount - cost if cost is not None else None),
        'unknownAmount': candidate and (amount is None or amount < 0)}

def scope(rows):
    def subtotal(key):
        values = [Decimal(row[key]) for row in rows if row[key] is not None]
        return text(sum(values, Decimal(0))) if values else None
    sale, returned, covered = subtotal('saleAmount'), subtotal('returnAmount'), subtotal('coveredSaleAmount')
    denominator = sum((abs(Decimal(row[key])) for row in rows for key in ['saleAmount', 'returnAmount'] if row[key] is not None), Decimal(0))
    cost, contribution = subtotal('candidateCost'), subtotal('contribution')
    ratio = None if denominator == 0 else text(((Decimal(covered or '0') / denominator) * 100).quantize(Decimal('.01'), rounding=ROUND_HALF_UP))
    margin = None if covered is None or Decimal(covered) <= 0 or contribution is None else text((Decimal(contribution) / Decimal(covered) * 100).quantize(Decimal('.01'), rounding=ROUND_HALF_UP))
    return {'candidateSaleAmount': sale, 'candidateReturnAmount': returned,
        'coveredSaleAmount': covered, 'candidateCost': cost, 'contribution': contribution,
        'costCoveragePercent': ratio, 'coveredMarginPercent': margin,
        'lineCount': len(rows), 'coveredCount': sum(row['reason'] is None for row in rows),
        'excludedCount': sum(row['reason'] is not None for row in rows),
        'unknownAmountCount': sum(row['unknownAmount'] for row in rows),
        'reasons': dict(sorted(Counter(row['reason'] for row in rows if row['reason']).items()))}

def calculate(snapshot, period):
    headers = {row['ID']: row for row in snapshot['headers'] if row['FIS_TARIHI'].startswith(period + '-')}
    rows = [classify(headers[line['FIS']], line) for line in snapshot['lines'] if line['FIS'] in headers]
    products, days = defaultdict(list), defaultdict(list)
    for row in rows:
        products[row['productId']].append(row)
        days[row['date']].append(row)
    daily = []
    day = date.fromisoformat(period + '-01')
    while day.strftime('%Y-%m') == period:
        current = day.isoformat()
        daily.append({'date': current, 'observed': snapshot['from'] <= current <= snapshot['to'], **scope(days[current])})
        day += timedelta(days=1)
    line_headers = {row['documentId'] for row in rows}
    result = {'calculationVersion': 'source-estimate-v1', 'period': period,
        'summary': {**scope(rows), 'emptyHeaderCount': sum(key not in line_headers for key in headers)},
        'products': [{'productId': key, **scope(products[key])} for key in sorted(products)],
        'daily': daily, 'memberships': rows}
    for key in ['candidateSaleAmount', 'candidateReturnAmount', 'coveredSaleAmount', 'candidateCost', 'contribution']:
        total = result['summary'][key]
        for groups in [result['products'], daily]:
            operands = [Decimal(row[key]) for row in groups if row[key] is not None]
            assert (text(sum(operands, Decimal(0))) if operands else None) == total
    return result

def self_check():
    h = {'ID':'1','FIS_TARIHI':'2025-09-01T00:00:00','FIS_TURU':'11','CURRENCY':'TRY','DURUM':'1','AKTIF':'1'}
    def row(identifier, amount='100', quantity='2', cost='30', multiplier='1'):
        return {'ID':identifier,'FIS':'1','STOK':'1','TOPLAM_KDV_MATRAHI':amount,'MIKTAR_FIS':quantity,COST:cost,'CARPAN':multiplier}
    good = classify(h, row('1'))
    assert good['candidateCost'] == '60' and good['contribution'] == '40'
    returned = classify({**h,'FIS_TURU':'12'}, row('2','25'))
    zero = classify(h, row('3',cost='0'))
    unknown = classify(h, row('4',amount=None))
    missing = classify(h, row('5',cost=None))
    negative = classify(h, row('6',cost='-1'))
    s = scope([good, returned, zero, unknown, missing, negative])
    assert s['candidateSaleAmount'] == '400' and s['candidateReturnAmount'] == '-25'
    assert s['contribution'] == '40' and s['excludedCount'] == 5 and s['unknownAmountCount'] == 1
    assert scope([returned])['contribution'] is None and scope([])['candidateSaleAmount'] is None
    assert classify(h,row('7',quantity='0'))['reason'] == 'INVALID_QUANTITY'
    assert classify(h,row('8',multiplier=None))['reason'] == 'UNSUPPORTED_MULTIPLIER'
    assert classify({**h,'FIS_TURU':'35','CURRENCY':'USD'},row('9',amount=None))['reason'] == 'TYPE_35'
    assert scope([classify(h,row('10','60'))])['contribution'] == '0'
    assert scope([classify(h,row('11','10'))])['contribution'] == '-50'
    operand = '9' * 40 + '.' + '9' * 30
    value = classify(h,row('12',operand,operand,operand))
    integer = 10**70 - 1
    expected = Decimal(integer * integer).scaleb(-60)
    assert Decimal(value['candidateCost']) == expected
    assert len(value['candidateCost'].replace('.','')) > 100

REASONS = {'TYPE_35':'TYPE_35','OTHER_TYPE':'OTHER_TYPE',
    'UNSUPPORTED_CURRENCY':'CURRENCY','UNSUPPORTED_STATUS':'STATUS',
    'INVALID_AMOUNT':'AMOUNT','RETURN_ATTRIBUTION':'RETURN_COST',
    'INVALID_QUANTITY':'QUANTITY','UNSUPPORTED_MULTIPLIER':'MULTIPLIER',
    'MISSING_COST':'COST_MISSING','ZERO_COST':'COST_ZERO','NEGATIVE_COST':'COST_NEGATIVE'}
MONEY = ['candidateSaleAmount','candidateReturnAmount','coveredSaleAmount',
    'candidateCost','contribution','costCoveragePercent']

class ComparisonFailure(Exception):
    pass

def require(value):
    if not value:
        raise ComparisonFailure('RECONCILIATION_FAILED')

def compare_number(expected, actual):
    require(expected is None and actual is None or expected is not None and actual is not None
        and isinstance(actual,str) and Decimal(expected) == Decimal(actual))

def keyed(rows, key):
    result = {row[key]:row for row in rows}
    require(len(result) == len(rows))
    return result

def candidate(row, kind):
    return row['typeCode'] == kind and row['reason'] not in ['TYPE_35','OTHER_TYPE','UNSUPPORTED_CURRENCY','UNSUPPORTED_STATUS']

def compare_totals(expected, actual, rows):
    for key in MONEY:
        compare_number(expected[key],actual[key])
    checks = {'totalLines':expected['lineCount'],'coveredLines':expected['coveredCount'],
        'saleCandidateLines':sum(candidate(row,'11') for row in rows),
        'returnCandidateLines':sum(candidate(row,'12') for row in rows),
        'unknownSaleAmounts':sum(candidate(row,'11') and row['unknownAmount'] for row in rows),
        'unknownReturnAmounts':sum(candidate(row,'12') and row['unknownAmount'] for row in rows)}
    require(all(actual[key] == value and type(actual[key]) is int for key,value in checks.items()))
    require(actual['totalLines'] - actual['coveredLines'] == expected['excludedCount'])
    require(actual['unknownSaleAmounts'] + actual['unknownReturnAmounts'] == expected['unknownAmountCount'])
    require(set(actual['exclusions']) == set(REASONS.values()))
    require(actual['exclusions'] == {new:expected['reasons'].get(old,0) for old,new in REASONS.items()})

def compare(expected, actual):
    require(actual['quality'] == 'unverified-estimate' and actual['format'] == 'source-estimate-v1'
        and actual['calculationVersion'] == expected['calculationVersion'] and actual['period'] == expected['period'])
    require(isinstance(actual['sourceHash'],str) and len(actual['sourceHash']) == 64
        and all(ch in '0123456789abcdef' for ch in actual['sourceHash']))
    rows = expected['memberships']
    compare_totals(expected['summary'],actual['summary'],rows)
    require(actual['emptyDocuments'] == expected['summary']['emptyHeaderCount'])
    for collection,key,actual_name in [('products','productId','products'),('daily','date','days')]:
        grouped = defaultdict(list)
        for row in rows:
            grouped[row[key]].append(row)
        old,new = keyed(expected[collection],key),keyed(actual[actual_name],key)
        require(old.keys() == new.keys())
        for identifier,value in old.items():
            if collection == 'daily' and not value['observed']:
                require(new[identifier]['totals'] is None)
            else:
                compare_totals(value,new[identifier]['totals'],grouped[identifier])
    old,new = keyed(rows,'lineId'),keyed(actual['lines'],'lineId')
    require(old.keys() == new.keys())
    fields = {'saleAmount':'candidateSaleAmount','returnAmount':'candidateReturnAmount',
        'coveredSaleAmount':'coveredSaleAmount','candidateCost':'candidateCost','contribution':'contribution'}
    for identifier,row in old.items():
        target = new[identifier]
        require(all(row[key] == target[key] for key in ['documentId','productId','date']))
        require(target['reason'] == (None if row['reason'] is None else REASONS[row['reason']]))
        for source,destination in fields.items():
            compare_number(row[source],target[destination])
        for kind,label in [('11','sale'),('12','return')]:
            selected = candidate(row,kind)
            require(target[label+'Candidate'] is selected)
            require(target['unknown'+label.capitalize()+'Amount'] is (selected and row['unknownAmount']))

def comparator_self_check():
    import copy
    h = {'ID':'1','FIS_TARIHI':'2025-09-01T00:00:00','FIS_TURU':'11','CURRENCY':'TRY','DURUM':'1','AKTIF':'1'}
    line = {'ID':'1','FIS':'1','STOK':'1','TOPLAM_KDV_MATRAHI':'100','MIKTAR_FIS':'2',COST:'30','CARPAN':'1'}
    expected = calculate({'headers':[h],'lines':[line],'from':'2025-09-01','to':'2025-09-30'},'2025-09')
    def adapt(value,rows):
        return {**{key:value[key] for key in MONEY},'totalLines':value['lineCount'],
            'coveredLines':value['coveredCount'],'saleCandidateLines':len(rows),'returnCandidateLines':0,
            'unknownSaleAmounts':0,'unknownReturnAmounts':0,'exclusions':{key:0 for key in REASONS.values()}}
    member = expected['memberships'][0]
    actual = {'quality':'unverified-estimate','format':'source-estimate-v1',
        'calculationVersion':'source-estimate-v1','period':'2025-09','sourceHash':'a'*64,
        'summary':adapt(expected['summary'],[member]),'emptyDocuments':0,
        'products':[{'productId':'1','totals':adapt(expected['products'][0],[member])}],
        'days':[{'date':day['date'],'totals':adapt(day,[member] if day['date']==member['date'] else [])} for day in expected['daily']],
        'lines':[{'lineId':'1','documentId':'1','productId':'1','date':member['date'],'reason':None,
            'candidateSaleAmount':'100','candidateReturnAmount':None,'coveredSaleAmount':'100',
            'candidateCost':'60','contribution':'40','saleCandidate':True,'returnCandidate':False,
            'unknownSaleAmount':False,'unknownReturnAmount':False}]}
    compare(expected,actual)
    mutations = [lambda value:value['lines'].clear(),
        lambda value:value['lines'].append(copy.deepcopy(value['lines'][0])),
        lambda value:value['lines'][0].update(candidateCost='61')]
    for mutate in mutations:
        changed = copy.deepcopy(actual)
        mutate(changed)
        try:
            compare(expected,changed)
        except ComparisonFailure:
            continue
        raise ComparisonFailure('MUTATION_NOT_REJECTED')

LABELS = {'totalLines':'Tüm satırlar','coveredLines':'Kapsanan satış satırları',
    'saleCandidateLines':'Satış adayı satırlar','returnCandidateLines':'İade adayı satırlar',
    'unknownSaleAmounts':'Bilinmeyen satış tutarı','unknownReturnAmounts':'Bilinmeyen iade tutarı',
    'candidateSaleAmount':'Kaydedilmiş satış tutarı adayı','candidateReturnAmount':'İade tutarı adayı',
    'coveredSaleAmount':'Kapsanan satış tutarı adayı','candidateCost':'Tahmini maliyet adayı',
    'contribution':'Tahmini satış katkısı (kapsanan satırlar)','costCoveragePercent':'Maliyet kapsamı (%)'}
REASON_LABELS = dict(zip(REASONS.values(),['Tür 35: olası çift sayım','Diğer belge türü',
    'Para birimi desteklenmiyor','Durum / aktif kodu desteklenmiyor','Tutar eksik veya negatif',
    'İade maliyeti eşleştirilmedi','Miktar eksik veya pozitif değil','Çarpan bir değil veya bilinmiyor',
    'Maliyet eksik','Sıfır maliyet doğrulanmadı','Negatif maliyet']))

def workbook_sheets(path):
    import zipfile
    import xml.etree.ElementTree as ET
    ns = {'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(item.itertext()) for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        book = ET.fromstring(archive.read('xl/workbook.xml'))
        rels = {r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in book.find('s:sheets',ns):
            target = rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            xml = ET.fromstring(archive.read(target.lstrip('/') if target.startswith('/') else 'xl/'+target))
            require(not xml.findall('.//s:f',ns))
            rows = []
            for row in xml.findall('.//s:sheetData/s:row',ns):
                values = []
                for cell in row:
                    letters = ''.join(ch for ch in cell.attrib['r'] if ch.isalpha())
                    column = 0
                    for ch in letters: column = column*26+ord(ch)-64
                    while len(values)<column: values.append(None)
                    v = cell.find('s:v',ns)
                    if cell.attrib.get('t') == 's': value = strings[int(v.text)]
                    elif cell.attrib.get('t') == 'inlineStr': value = ''.join(cell.find('s:is',ns).itertext())
                    else:
                        require(v is None)  # exporter promises exact string cells, never binary numbers
                        value = None
                    values[column-1] = value
                rows.append(values)
            sheets[sheet.attrib['name']] = rows
        return sheets

def compare_workbook_rows(sheets, actual):
    require(set(sheets) == {'Özet','Günler','Ürünler','Yöntem','Dışlananlar'})
    data = {}
    for name, rows in sheets.items():
        require(rows[0] == ['Doğrulanmamış tahmin — net kâr değildir'])
        require(rows[1] == ['Kaynak sürümü',actual['sourceHash']])
        require(rows[2] == ['Hesaplama sürümü',actual['calculationVersion']])
        require(rows[3] == ['Dönem',actual['period']])
        require(rows[4] == ['Kaynak kapsamı',actual['from']+' / '+actual['to']])
        require(rows[5] == ['Hazırlanma',actual['extractedAt']])
        require(rows[6] == ['İadelerin maliyet ve katkısı dahil değildir; sonuç yüksek görünebilir. Giderler dahil değildir.'])
        require(rows[7] == ['Tutarlar kesin ondalık metin olarak korunmuştur; boş hücre bilinmeyendir, sıfır değildir.'])
        data[name] = [row for row in rows[8:] if row]
    summary = data['Özet']
    require(summary[0] == ['Gösterge','Kesin değer'] and len(summary) == len(LABELS)+2)
    require({row[0] for row in summary[1:-1]} == set(LABELS.values()))
    for row in summary[1:-1]:
        key = next((key for key,label in LABELS.items() if label == row[0]),None)
        require(key is not None and row[1:] == [None if actual['summary'][key] is None else str(actual['summary'][key])])
    require(summary[-1] == ['Satırsız belgeler — tutar bilinmiyor',str(actual['emptyDocuments'])])
    for name,collection,key in [('Günler','days','date'),('Ürünler','products','productId')]:
        rows = data[name]
        require(rows[0][1:] == list(LABELS.values()))
        mapped = {row[0]:row[1:] for row in rows[1:]}
        require(len(mapped) == len(rows)-1 and set(mapped) == {item[key] for item in actual[collection]})
        for item in actual[collection]:
            expected = [None if item['totals'] is None or item['totals'][field] is None else str(item['totals'][field]) for field in LABELS]
            observed = mapped[item[key]]
            observed += [None]*(len(expected)-len(observed))
            require(observed == expected)
    require(data['Yöntem'][1:] == actual['assumptions'])
    excluded = []
    for scope,identity,totals in [('Ay',actual['period'],actual['summary'])] + [('Gün',d['date'],d['totals']) for d in actual['days'] if d['totals'] is not None] + [('Ürün',p['productId'],p['totals']) for p in actual['products']]:
        excluded.extend([[scope,identity,REASON_LABELS[reason],str(count)] for reason,count in totals['exclusions'].items()])
    require(data['Dışlananlar'][1:] == excluded)


def private_write(path, value):
    path.parent.mkdir(parents=True,exist_ok=True)
    payload = (json.dumps(value,sort_keys=True,separators=(',',':')) + '\n').encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd,'wb') as stream:
        stream.write(payload)
        stream.flush()
        os.fsync(stream.fileno())
    return hashlib.sha256(payload).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview', type=Path)
    parser.add_argument('--rows', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--period',default='2025-09')
    parser.add_argument('--self-check',action='store_true')
    parser.add_argument('--expected',type=Path)
    parser.add_argument('--actual',type=Path)
    parser.add_argument('--workbook',type=Path)
    args = parser.parse_args()
    with localcontext() as ctx:
        ctx.prec = 200
        self_check()
        comparator_self_check()
        if args.actual:
            if not args.expected: parser.error('explicit expected path required for comparison')
            expected = json.loads(args.expected.read_text())
            actual = json.loads(args.actual.read_text())
            try:
                compare(expected,actual)
                if args.workbook:
                    sheets = workbook_sheets(args.workbook)
                    compare_workbook_rows(sheets,actual)
                    import copy
                    changed = copy.deepcopy(sheets)
                    changed['Ürünler'].pop()
                    try:
                        compare_workbook_rows(changed,actual)
                    except ComparisonFailure:
                        pass
                    else:
                        raise ComparisonFailure('MUTATION_NOT_REJECTED')
            except (ComparisonFailure,KeyError,TypeError,ValueError):
                raise SystemExit('RECONCILIATION_FAILED') from None
            print(json.dumps({'status':'PASS_WORKBOOK_RECONCILIATION' if args.workbook else 'PASS_RECONCILIATION','lines':len(expected['memberships']),
                'products':len(expected['products']),'days':len(expected['daily']),
                'expectedSha256':hashlib.sha256(args.expected.read_bytes()).hexdigest(),
                'actualSha256':hashlib.sha256(args.actual.read_bytes()).hexdigest(),
                **({'workbookSha256':hashlib.sha256(args.workbook.read_bytes()).hexdigest()} if args.workbook else {})},sort_keys=True))
            return
        if args.self_check:
            print('PASS: independent Decimal golden and precision checks')
            return
        if not all([args.preview,args.rows,args.output]): parser.error('explicit preview, rows and output paths required')
        preview = json.loads(args.preview.read_text())
        retained = json.loads(args.rows.read_text())
        snapshot = preview['snapshot']
        assert snapshot['headers'] == retained[0]
        raw_lines = snapshot['lines']
        assert len(raw_lines) == len(retained[1])
        for raw,line in zip(raw_lines,retained[1]):
            assert raw == {k:v for k,v in line.items() if k != COST}
        enriched = {**snapshot,'lines':retained[1]}
        expected = calculate(enriched,args.period)
        expected['inputDigests'] = {label:hashlib.sha256(path.read_bytes()).hexdigest() for label,path in [('preview',args.preview),('retainedRows',args.rows)]}
        digest = private_write(args.output,expected)
        print(json.dumps({'status':'PASS_ORACLE_ONLY','headers':len(snapshot['headers']),'lines':len(raw_lines),'products':len(expected['products']),'days':len(expected['daily']),'coveredCount':expected['summary']['coveredCount'],'excludedCount':expected['summary']['excludedCount'],'emptyHeaderCount':expected['summary']['emptyHeaderCount'],'reasonCounts':expected['summary']['reasons'],'outputSha256':digest},sort_keys=True))

if __name__ == '__main__':
    main()
