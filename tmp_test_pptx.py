import sys
from pathlib import Path
from cleaner import clean_file, ProcessingOptions

def test_pptx():
    input_file = "smoke_tests/sample.pptx"
    output_dir = "output_test"
    options = ProcessingOptions(strip_metadata=True, compress_output=True)
    
    try:
        result = clean_file(input_file, options=options, output_dir=output_dir)
        print(f"Success: {result.output_path}")
        print(f"Reduction: {result.reduction_percent:.2f}%")
        print(f"Warnings: {result.warnings}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pptx()
