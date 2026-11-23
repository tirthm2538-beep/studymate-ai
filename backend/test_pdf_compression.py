import io
import os
import sys
from fastapi.testclient import TestClient
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import app, MAX_FILE_SIZE, MAX_COMPRESS_FILE_SIZE

client = TestClient(app)

def create_sample_heavy_pdf() -> bytes:
    """Creates a PDF with high-resolution image data to test compression."""
    pdf_buf = io.BytesIO()
    c = canvas.Canvas(pdf_buf)

    for i in range(2):
        # 1000x1000 noise image
        raw_bytes = os.urandom(1000 * 1000 * 3)
        img = Image.frombytes("RGB", (1000, 1000), raw_bytes)
        img_buf = io.BytesIO()
        img.save(img_buf, format="PNG")
        img_buf.seek(0)

        c.drawString(72, 750, f"Test Chapter Page {i+1} - Heavy Image Content")
        c.drawImage(ImageReader(img_buf), 72, 150, width=450, height=450)
        c.showPage()

    c.save()
    return pdf_buf.getvalue()

def test_constants():
    assert MAX_FILE_SIZE == 70 * 1024 * 1024, f"MAX_FILE_SIZE should be 70MB, got {MAX_FILE_SIZE}"
    assert MAX_COMPRESS_FILE_SIZE == 150 * 1024 * 1024, f"MAX_COMPRESS_FILE_SIZE should be 150MB, got {MAX_COMPRESS_FILE_SIZE}"
    print(f"PASS: MAX_FILE_SIZE={MAX_FILE_SIZE / (1024*1024)}MB, MAX_COMPRESS_FILE_SIZE={MAX_COMPRESS_FILE_SIZE / (1024*1024)}MB")

def test_compress_pdf_endpoint():
    heavy_pdf = create_sample_heavy_pdf()
    orig_len = len(heavy_pdf)
    print(f"Generated test heavy PDF: {orig_len} bytes ({orig_len / (1024*1024):.2f} MB)")

    files = {"file": ("heavy_sample_document.pdf", heavy_pdf, "application/pdf")}
    data = {"quality": "40", "max_dimension": "1000"}

    response = client.post("/compress-pdf", files=files, data=data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    assert response.headers.get("content-type") == "application/pdf"

    orig_header = int(response.headers.get("x-original-size", 0))
    comp_header = int(response.headers.get("x-compressed-size", 0))
    reduction_header = float(response.headers.get("x-reduction-percent", 0.0))

    comp_bytes = response.content
    print(f"Compressed PDF returned: {len(comp_bytes)} bytes ({len(comp_bytes) / (1024*1024):.2f} MB)")
    print(f"Headers: X-Original-Size={orig_header}, X-Compressed-Size={comp_header}, X-Reduction-Percent={reduction_header}%")

    assert len(comp_bytes) < orig_len, "Compressed size should be smaller than original"
    assert comp_header == len(comp_bytes), "X-Compressed-Size header should match body length"
    assert reduction_header > 50.0, f"Expected >50% compression on heavy image PDF, got {reduction_header}%"
    print(f"PASS: PDF Compression achieved {reduction_header}% reduction!")

def test_compress_invalid_format():
    files = {"file": ("notes.txt", b"Hello world text", "text/plain")}
    response = client.post("/compress-pdf", files=files)
    assert response.status_code == 400
    assert "Only PDF" in response.json()["detail"]
    print("PASS: Invalid format rejected correctly.")

if __name__ == "__main__":
    test_constants()
    test_compress_pdf_endpoint()
    test_compress_invalid_format()
    print("ALL FEATURE 1 BACKEND TESTS PASSED SUCCESSFULLY! \u2705")
