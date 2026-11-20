import os
from fastapi.testclient import TestClient
from app import app, MAX_FILE_SIZE

client = TestClient(app)

def test_large_pdf():
    print("Testing health endpoint...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health check OK:", r.json())

    assert MAX_FILE_SIZE == 25 * 1024 * 1024, f"MAX_FILE_SIZE incorrect: {MAX_FILE_SIZE}"
    print("MAX_FILE_SIZE confirmed 25MB.")

    print("\nTesting /generate with genuine 25-page PDF: test_25_pages.pdf...")
    pdf_path = "test_25_pages.pdf" if os.path.exists("test_25_pages.pdf") else "../test_25_pages.pdf"
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/generate",
        files={"file": ("test_25_pages.pdf", file_bytes, "application/pdf")}
    )

    print("Status code:", response.status_code)
    assert response.status_code == 200, f"Generate failed: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    assert "flashcards" in data and len(data["flashcards"]) >= 8
    assert "quiz" in data and len(data["quiz"]) == 5
    print(f"Generated {len(data['flashcards'])} flashcards and {len(data['quiz'])} quiz questions!")
    print("Sample flashcard:", data["flashcards"][0])
    print("Sample quiz question:", data["quiz"][0]["question"])
    print("\nTesting /generate with dense 25-page PDF: test_dense_25_pages.pdf (120k+ chars)...")
    dense_pdf_path = "test_dense_25_pages.pdf" if os.path.exists("test_dense_25_pages.pdf") else "../test_dense_25_pages.pdf"
    with open(dense_pdf_path, "rb") as f:
        dense_bytes = f.read()

    response2 = client.post(
        "/generate",
        files={"file": ("test_dense_25_pages.pdf", dense_bytes, "application/pdf")}
    )
    assert response2.status_code == 200, f"Dense generate failed: {response2.text}"
    data2 = response2.json()
    assert data2["status"] == "success"
    assert "flashcards" in data2 and len(data2["flashcards"]) >= 8
    assert "quiz" in data2 and len(data2["quiz"]) == 5
    print(f"Dense PDF: Generated {len(data2['flashcards'])} flashcards and {len(data2['quiz'])} quiz questions!")
    print("\n✅ Task 1 Large & Dense PDF verification PASSED successfully!")

if __name__ == "__main__":
    test_large_pdf()
