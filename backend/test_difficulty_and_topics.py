import os
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

SAMPLE_NOTES = """
Thermodynamics and Heat Engines:
The First Law of Thermodynamics states energy cannot be created or destroyed: delta U = Q - W.
The Second Law states that the total entropy of an isolated system always increases over time: delta S >= 0.
The Carnot engine represents the theoretical maximum efficiency for any heat engine operating between hot reservoir Th and cold reservoir Tc:
Efficiency eta = 1 - (Tc / Th).
Isothermal processes occur at constant temperature (delta U = 0, Q = W = nRT * ln(Vf/Vi)).
Adiabatic processes have no heat exchange (Q = 0, P*V^gamma = constant).
"""

def test_difficulty_and_topics():
    print("Testing /generate with Difficulty = Easy...")
    res_easy = client.post(
        "/generate",
        data={"text": SAMPLE_NOTES, "difficulty": "Easy"}
    )
    assert res_easy.status_code == 200, f"Easy failed: {res_easy.text}"
    data_easy = res_easy.json()
    assert data_easy["status"] == "success"
    assert data_easy["difficulty"] == "Easy"
    assert "important_topics" in data_easy
    assert 3 <= len(data_easy["important_topics"]) <= 5, f"Expected 3-5 topics, got {len(data_easy['important_topics'])}"
    print(f"Easy generation OK: {len(data_easy['important_topics'])} Important Topics:")
    for t in data_easy["important_topics"]:
        print(f"  - {t}")

    print("\nTesting /generate with Difficulty = Hard...")
    res_hard = client.post(
        "/generate",
        data={"text": SAMPLE_NOTES, "difficulty": "Hard"}
    )
    assert res_hard.status_code == 200, f"Hard failed: {res_hard.text}"
    data_hard = res_hard.json()
    assert data_hard["status"] == "success"
    assert data_hard["difficulty"] == "Hard"
    assert "important_topics" in data_hard
    assert 3 <= len(data_hard["important_topics"]) <= 5, f"Expected 3-5 topics, got {len(data_hard['important_topics'])}"
    print(f"Hard generation OK: {len(data_hard['important_topics'])} Important Topics:")
    for t in data_hard["important_topics"]:
        print(f"  - {t}")

    print("\nSample Hard Flashcard:", data_hard["flashcards"][0])
    print("Sample Hard Quiz Question:", data_hard["quiz"][0]["question"])

    print("\n✅ Task 4 Difficulty Selector & Important Topics test PASSED successfully!")

if __name__ == "__main__":
    test_difficulty_and_topics()
