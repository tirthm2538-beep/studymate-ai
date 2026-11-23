import io
import os
import sys
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import app

client = TestClient(app)

SAMPLE_BIO_TEXT = """
Chapter 5: Cell Membrane Structure and Transport

The cell membrane (plasma membrane) is a selectively permeable phospholipid bilayer that encloses the cytoplasm of all cells.

1. Phospholipid Bilayer Structure:
Phospholipids are amphipathic molecules with hydrophilic phosphate heads pointing outward towards aqueous environments and hydrophobic fatty acid tails sequestered inside. The fluid mosaic model describes the membrane as a dynamic, two-dimensional liquid where integral and peripheral proteins drift laterally.
Key Definition: Fluid Mosaic Model is the structural model describing the plasma membrane as a fluid phospholipid bilayer embedded with diverse proteins, cholesterol, and carbohydrates.

2. Passive Transport Mechanisms:
Passive transport involves movement of solutes along their concentration gradient without ATP expenditure:
- Simple Diffusion: Small, nonpolar molecules (O2, CO2) dissolve directly through the lipid bilayer.
- Facilitated Diffusion: Polar or charged ions (glucose, Na+, K+) traverse via transmembrane protein channels or carrier proteins.
- Osmosis: The net passive movement of water molecules across a selectively permeable membrane from lower solute concentration to higher solute concentration.
Key Definition: Osmosis is the passive diffusion of water through a selectively permeable membrane towards regions of higher solute concentration.

3. Active Transport:
Active transport moves substances against electrochemical or concentration gradients requiring metabolic energy (ATP). The primary example is the Sodium-Potassium Pump (Na+/K+-ATPase), which transports 3 Na+ ions out of the cell and 2 K+ ions into the cell per cycle of ATP hydrolysis.
Key Definition: Sodium-Potassium Pump is an electrogenic transmembrane ATPase that pumps three Na+ out and two K+ into animal cells per ATP consumed.
"""

def test_generate_notes_endpoint():
    print("Testing POST /generate-notes with biological text...")
    response = client.post(
        "/generate-notes",
        data={"text": SAMPLE_BIO_TEXT, "difficulty": "Medium", "title": "Cell Membrane Transport"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()

    assert data.get("status") == "success"
    assert "document_title" in data
    assert len(data.get("sections", [])) >= 1, "Expected at least 1 section"
    assert len(data.get("quick_revision_summary", [])) >= 3, "Expected at least 3 quick revision summary points"
    assert "markdown_content" in data

    first_sec = data["sections"][0]
    assert "heading" in first_sec
    assert "subheadings" in first_sec
    assert len(first_sec["subheadings"]) >= 1

    print(f"PASS: Generated notes title: '{data['document_title']}' with {len(data['sections'])} sections")
    print(f"Quick Revision Summary has {len(data['quick_revision_summary'])} takeaways.")
    return data

def test_export_notes_pdf_endpoint(notes_data):
    print("Testing POST /export-notes-pdf...")
    payload = {
        "title": notes_data["document_title"],
        "sections": notes_data["sections"],
        "quick_revision_summary": notes_data["quick_revision_summary"],
        "difficulty": notes_data.get("difficulty", "Medium")
    }
    response = client.post("/export-notes-pdf", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.headers.get("content-type") == "application/pdf"
    assert len(response.content) > 1000, "Expected valid PDF content"
    assert "attachment; filename=" in response.headers.get("content-disposition", "")
    print(f"PASS: Notes PDF exported successfully! PDF size: {len(response.content)} bytes.")

def test_generate_notes_from_pdf():
    print("Testing POST /generate-notes with uploaded PDF...")
    pdf_buf = io.BytesIO()
    c = canvas.Canvas(pdf_buf)
    c.drawString(72, 750, "Organic Chemistry Notes: Hydrocarbons and Alkanes")
    c.drawString(72, 720, "Alkanes are saturated hydrocarbons with general formula CnH2n+2.")
    c.drawString(72, 690, "Combustion of alkanes produces carbon dioxide and water with heat release.")
    c.drawString(72, 660, "Key Definition: Saturated Hydrocarbon is an organic compound with single C-C bonds only.")
    c.save()

    pdf_bytes = pdf_buf.getvalue()
    files = {"file": ("organic_chem_chapter.pdf", pdf_bytes, "application/pdf")}
    data = {"difficulty": "Hard"}

    response = client.post("/generate-notes", files=files, data=data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    result = response.json()
    assert result.get("status") == "success"
    assert len(result.get("sections", [])) >= 1
    print(f"PASS: Generated notes from PDF upload successfully! Sections: {len(result['sections'])}")

if __name__ == "__main__":
    notes_data = test_generate_notes_endpoint()
    test_export_notes_pdf_endpoint(notes_data)
    test_generate_notes_from_pdf()
    print("ALL FEATURE 2 BACKEND TESTS PASSED SUCCESSFULLY! \u2705")
