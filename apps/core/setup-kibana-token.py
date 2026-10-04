#!/usr/bin/env python3
"""Recover Kibana authentication without reusing source file-based tokens."""
import base64
import json
import os
from pathlib import Path
import secrets
import subprocess
import urllib.error
import urllib.request


def main():
    config = Path('/home/nivo/academy/config/kibana.env')
    if config.is_symlink():
        raise RuntimeError('Kibana configuration must be a regular private file')
    values = dict(line.split('=', 1) for line in config.read_text().splitlines() if '=' in line)
    container = json.loads(subprocess.check_output(['docker', 'inspect', 'academy-elasticsearch']))[0]
    environment = dict(value.split('=', 1) for value in container['Config']['Env'] if '=' in value)
    address = container['NetworkSettings']['Networks']['academy-storage']['IPAddress']
    endpoint = 'http://' + address + ':9200'
    token = values.get('ELASTICSEARCH_SERVICEACCOUNTTOKEN', '')
    request = urllib.request.Request(endpoint + '/_security/_authenticate', headers={'Authorization': 'Bearer ' + token})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status == 200:
                print('Kibana service token verified')
                return
    except urllib.error.HTTPError as error:
        if error.code != 401:
            raise RuntimeError('Kibana service authentication could not be verified') from None
    credentials = base64.b64encode(('elastic:' + environment['ELASTIC_PASSWORD']).encode()).decode()
    name = 'academy-kibana-' + secrets.token_hex(6)
    request = urllib.request.Request(
        endpoint + '/_security/service/elastic/kibana/credential/token/' + name,
        method='POST', headers={'Authorization': 'Basic ' + credentials},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.loads(response.read())
    values['ELASTICSEARCH_SERVICEACCOUNTTOKEN'] = result['token']['value']
    temporary = config.with_suffix('.env.new')
    with open(temporary, 'w', opener=lambda path, flags: os.open(path, flags, 0o600)) as stream:
        stream.write('\n'.join(key + '=' + value for key, value in sorted(values.items())) + '\n')
    os.chmod(temporary, 0o600)
    temporary.replace(config)
    request = urllib.request.Request(
        endpoint + '/_security/service/elastic/kibana/credential',
        headers={'Authorization': 'Basic ' + credentials},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        existing = json.loads(response.read()).get('tokens', {})
    for old in existing:
        if old.startswith('academy-kibana-') and old != name:
            request = urllib.request.Request(
                endpoint + '/_security/service/elastic/kibana/credential/token/' + old,
                method='DELETE', headers={'Authorization': 'Basic ' + credentials},
            )
            with urllib.request.urlopen(request, timeout=20):
                pass
    print('Kibana service token provisioned in private host custody')


if __name__ == '__main__':
    main()
