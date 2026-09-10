#!/usr/bin/env python3
"""Health check endpoint for the Vosk recognizer container.

Transcript persistence now lives in the main medad-web backend (see
VITE_API_BASE_URL in the React app) instead of a local SQLite file —
this process no longer serves any HTML or stores any data itself.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("WEB_HOST", "0.0.0.0")
PORT = int(os.environ.get("WEB_PORT", "8080"))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:  # noqa: A002
        pass

    def do_GET(self) -> None:
        if self.path.rstrip("/") in {"", "/healthz"}:
            body = json.dumps({"status": "ok"}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_response(404)
        self.end_headers()


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Health check serving on http://localhost:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
