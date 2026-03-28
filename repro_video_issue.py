import os
import time
from cleaner import clean_video, ProcessingOptions
from pathlib import Path

def test_video_processing():
    input_video = r"smoke_tests\sample.mp4"
    output_video = r"output\DEBUG_video_res.mp4"
    options = ProcessingOptions(
        strip_metadata=True,
        compress_output=True,
        redact_visible_text=True, # Stress test with OCR
        remove_audio=True,
        video_ocr_interval=10
    )
    
    if not os.path.exists(input_video):
        print(f"Input video not found: {input_video}")
        return

    print(f"Starting video processing for {input_video}...")
    start_time = time.time()
    
    def progress_callback(msg):
        print(f"[PROGRESS] {msg}")

    try:
        warnings = clean_video(input_video, output_video, options, progress_callback=progress_callback)
        duration = time.time() - start_time
        print(f"\nSuccess! Total time: {duration:.2f}s")
        print(f"Output saved to: {output_video}")
        print(f"Warnings: {warnings}")
        if os.path.exists(output_video):
            print(f"Output size: {os.path.getsize(output_video) / 1024 / 1024:.2f} MB")
    except Exception as e:
        print(f"\nFAILED with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    os.makedirs("output", exist_ok=True)
    test_video_processing()
