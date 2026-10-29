#!/usr/bin/env python3
"""Local acceptance server. Does not deploy or modify any hosted site."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

ROOT=Path(__file__).resolve().parents[1]

class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store' if self.path.split('?')[0]=='/sw.js' else 'no-cache')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'")
        super().end_headers()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8080);args=parser.parse_args()
    directory=ROOT/'dist'
    if not (directory/'index.html').exists():
        raise SystemExit('请先运行 python3 scripts/build.py')
    server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(PreviewHandler,directory=str(directory)))
    print(f'本机验收链接：http://127.0.0.1:{args.port}/\n只在本机运行。关闭此窗口可停止预览。',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
