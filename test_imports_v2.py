import sys
import time

def test_import(module_name):
    print(f"Testing import of {module_name}...", end=" ", flush=True)
    start = time.time()
    try:
        __import__(module_name)
        print(f"OK ({time.time() - start:.2f}s)")
    except Exception as e:
        print(f"FAILED: {e}")

modules = [
    "shutil", "sqlite3", "pathlib", "uuid", "fastapi",
    "cv2", "fitz", "numpy", "PIL", "pptx", "imageio_ffmpeg"
]

for m in modules:
    test_import(m)

print("Testing import of cleaner...", end=" ", flush=True)
try:
    import cleaner
    print("OK")
except Exception as e:
    print(f"FAILED: {e}")

print("Testing app initialization...", end=" ", flush=True)
try:
    from server import app
    print("OK")
except Exception as e:
    print(f"FAILED: {e}")
