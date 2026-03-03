#!/usr/bin/env python3
import json
import os
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

DB_DIR = os.path.join(os.path.dirname(__file__), 'data')
DB_PATH = os.path.join(DB_DIR, 'pingpong.db')
HOST = '0.0.0.0'
PORT = 8787


def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        '''CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_time TEXT NOT NULL,
            category TEXT NOT NULL,
            detail TEXT NOT NULL,
            phase TEXT NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL
        )'''
    )
    conn.commit()
    conn.close()


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send_json({'ok': True})

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            return self._send_json({'ok': True})
        if path == '/api/records':
            conn = sqlite3.connect(DB_PATH)
            rows = conn.execute(
                'SELECT id, match_time, category, detail, phase, note, created_at FROM records ORDER BY id DESC'
            ).fetchall()
            conn.close()
            records = [
                {
                    'id': str(r[0]),
                    'matchTime': r[1],
                    'category': r[2],
                    'detail': r[3],
                    'phase': r[4],
                    'note': r[5] or '',
                    'createdAt': r[6],
                }
                for r in rows
            ]
            return self._send_json({'records': records})
        if path == '/api/stats':
            conn = sqlite3.connect(DB_PATH)
            rows = conn.execute('SELECT category, detail FROM records').fetchall()
            conn.close()
            total = len(rows)
            by_category = {}
            by_detail = {}
            for category, detail in rows:
                by_category[category] = by_category.get(category, 0) + 1
                by_detail[detail] = by_detail.get(detail, 0) + 1

            def top_entry(d):
                return max(d.items(), key=lambda kv: kv[1]) if d else ('暂无', 0)

            top_category = top_entry(by_category)
            top_detail = top_entry(by_detail)
            return self._send_json(
                {
                    'total': total,
                    'topCategory': {'name': top_category[0], 'count': top_category[1]},
                    'topDetail': {'name': top_detail[0], 'count': top_detail[1]},
                }
            )
        self._send_json({'error': 'Not found'}, status=404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path != '/api/records':
            return self._send_json({'error': 'Not found'}, status=404)

        length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(length) if length else b'{}'
        try:
            payload = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            return self._send_json({'error': 'Invalid JSON'}, status=400)

        required = ['matchTime', 'category', 'detail', 'phase']
        for key in required:
            if not payload.get(key):
                return self._send_json({'error': f'Missing field: {key}'}, status=400)

        conn = sqlite3.connect(DB_PATH)
        created_at = datetime.utcnow().isoformat()
        cur = conn.execute(
            'INSERT INTO records(match_time, category, detail, phase, note, created_at) VALUES(?,?,?,?,?,?)',
            (
                payload['matchTime'],
                payload['category'],
                payload['detail'],
                payload['phase'],
                payload.get('note', ''),
                created_at,
            ),
        )
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return self._send_json({'id': str(new_id), 'createdAt': created_at}, status=201)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path != '/api/records':
            return self._send_json({'error': 'Not found'}, status=404)

        conn = sqlite3.connect(DB_PATH)
        conn.execute('DELETE FROM records')
        conn.commit()
        conn.close()
        self._send_json({'ok': True})


if __name__ == '__main__':
    init_db()
    print(f'Serving API on http://{HOST}:{PORT}')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
