import urllib.request
import urllib.parse
from requests import post
try:
    with open("test_upload.txt", "rb") as f:
        r = post("http://localhost:8000/api/process", files={"file": f}, data={"strip_metadata": "true"})
    print("STATUS", r.status_code)
    print("TEXT", r.text[:200])
except Exception as e:
    import sys
    print("ERROR", str(e), file=sys.stderr)
