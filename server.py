#!/usr/bin/env python3
"""
Simple static file server for SkillSprint frontend
Run: python server.py
Then visit: http://localhost:5500/frontend/html/signup.html
"""

import http.server
import socketserver
import os

PORT = 5500
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"[SUCCESS] Server running at http://localhost:{PORT}")
            print(f"[INFO] Serving from: {DIRECTORY}")
            print(f"\nAccess your pages:")
            print(f"   * Signup: http://localhost:{PORT}/frontend/html/signup.html")
            print(f"   * Student Dashboard: http://localhost:{PORT}/frontend/html/student-dashboard.html")
            print(f"   * Quiz: http://localhost:{PORT}/frontend/html/quiz.html")
            print(f"\nPress Ctrl+C to stop the server\n")
            
            httpd.serve_forever()
    except OSError as e:
        print(f"[ERROR] Could not start server: {e}")
    except KeyboardInterrupt:
        print("\n[STOP] Server stopped")
