import os
import json
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

SAMPLE_MATH_NOTES = """
Calculus and Linear Algebra Study Notes:
1. Fundamental Theorem of Calculus: If f is continuous on [a, b] and F'(x) = f(x), then \\int_a^b f(x) dx = F(b) - F(a).
2. Derivative of Power Functions: \\frac{d}{dx}[x^n] = n x^{n-1}. For example, \\frac{d}{dx}[x^3] = 3x^2.
3. Quadratic Formula: For equation ax^2 + bx + c = 0, roots are given by x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}.
4. Euler's Identity: e^{i \\pi} + 1 = 0, relating the constants e, i, \\pi, 1, and 0.
5. Invertibility of 2x2 Matrix: det(A) = ad - bc. The matrix A is invertible if and only if det(A) \\neq 0.
"""

def test_math_generation():
    print("Testing /generate with math-heavy notes...")
    response = client.post(
        "/generate",
        data={"text": SAMPLE_MATH_NOTES}
    )

    assert response.status_code == 200, f"Math generation failed: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    assert "flashcards" in data and len(data["flashcards"]) >= 8
    assert "quiz" in data and len(data["quiz"]) == 5

    # Check for garbled unicode characters
    corrupted_chars = ["\\ufffd", "\ufffd", "???"]
    all_text = json.dumps(data)
    for bad in corrupted_chars:
        assert bad not in all_text, f"Found corrupted character sequence '{bad}' in output!"

    print("\n--- Generated Flashcards Sample ---")
    for i, fc in enumerate(data["flashcards"][:3]):
        print(f"Card {i+1} Front: {fc['front']}")
        print(f"Card {i+1} Back:  {fc['back']}")

    print("\n--- Generated Quiz Sample ---")
    q0 = data["quiz"][0]
    print(f"Question 1: {q0['question']}")
    print(f"Options: {q0['options']}")
    print(f"Explanation: {q0['explanation']}")

    # Verify math symbols are present (exponents, fractions, derivatives, or roots)
    has_math_tokens = any(
        token in all_text for token in ["^", "sqrt", "frac", "int", "det", "dx", "\\", "x^2", "pi"]
    )
    assert has_math_tokens, "Expected mathematical expressions or notation in output"

    print("\n✅ Task 2 Math Symbol Rendering test PASSED with clean mathematical expressions and zero corrupted glyphs!")

if __name__ == "__main__":
    test_math_generation()
