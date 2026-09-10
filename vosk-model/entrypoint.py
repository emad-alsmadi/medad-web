#!/usr/bin/env python3
"""Start the website and the recognizer together."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

procs: list[subprocess.Popen] = []


def shutdown(signum=None, frame=None) -> None:
    for proc in procs:
        if proc.poll() is None:
            proc.terminate()
    deadline = time.time() + 8
    for proc in procs:
        remaining = deadline - time.time()
        if remaining > 0:
            try:
                proc.wait(timeout=remaining)
            except subprocess.TimeoutExpired:
                proc.kill()
    sys.exit(0)


signal.signal(signal.SIGTERM, shutdown)
signal.signal(signal.SIGINT, shutdown)

procs.append(subprocess.Popen([sys.executable, "-u", "asr_server.py", "model"]))
procs.append(subprocess.Popen([sys.executable, "-u", "web_server.py"]))

while True:
    for proc in procs:
        if proc.poll() is not None:
            shutdown()
    time.sleep(0.5)
