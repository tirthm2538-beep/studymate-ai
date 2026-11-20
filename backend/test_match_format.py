import os
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

STUDY_NOTES = """
Data Structures and Algorithms:
Binary Search Trees (BST): An ordered tree where each node's left child key <= parent key, and right child key >= parent key. Average search time is O(log n), worst case is O(n) for degenerate trees.
AVL Trees: Self-balancing binary search trees where height difference between left and right subtrees (balance factor) is at most 1. Lookups, insertions, and deletions are guaranteed O(log n).
Hash Tables: Use a hash function to map keys to bucket indices. Average search time is O(1). Collisions are resolved via chaining or open addressing (linear/quadratic probing).
Quicksort: Divide-and-conquer sorting algorithm with average O(n log n) time and worst-case O(n^2) when pivot selection is poor.
"""

# Highly distinctive exam format: Roman numeral assertion format (I, II, III)
SAMPLE_QUESTION_PAPER = """
Official Exam Sample Paper - Standard Structure & Phrasing:
Question 1: Consider the following statements regarding computational systems:
I. Statement one about system properties.
II. Statement two about asymptotic boundaries.
III. Statement three about storage overhead.
Which of the statements above is/are correct?
A) I only
B) II only
C) I and II only
D) I, II, and III

Question 2: Consider the following assertions:
I. Condition regarding data access.
II. Condition regarding worst-case complexity.
Which of the following is correct?
A) I only
B) II only
C) Both I and II
D) Neither I nor II
"""

def test_match_format():
    print("Testing /generate with 'Match This Format' option...")
    response = client.post(
        "/generate",
        data={
            "text": STUDY_NOTES,
            "difficulty": "Medium",
            "sample_paper_text": SAMPLE_QUESTION_PAPER
        }
    )

    assert response.status_code == 200, f"Match format request failed: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    assert data.get("format_matched") is True, "Expected format_matched to be True"
    assert len(data["flashcards"]) >= 8
    assert len(data["quiz"]) == 5

    print(f"\nFormat Matched: {data['format_matched']}")
    print(f"Difficulty: {data.get('difficulty')}")
    print(f"Important Topics ({len(data.get('important_topics', []))}):")
    for topic in data.get("important_topics", []):
        print(f"  • {topic}")

    print("\n--- Generated Quiz Questions (Formatted after Reference Paper) ---")
    matched_style_count = 0
    for idx, q in enumerate(data["quiz"]):
        print(f"\nQuestion {idx+1}: {q['question']}")
        print(f"Options: {q['options']}")
        print(f"Correct Answer: {q['options'][q['correct_answer_index']]}")
        # Check if question adopted "Consider", "statements", "I.", "Which of the", etc.
        q_text = q['question'] + " " + " ".join(q['options'])
        if any(marker in q_text for marker in ["Consider", "statement", "statements", "I", "II", "Which of the"]):
            matched_style_count += 1

    print(f"\nQuestions matching reference phrasing conventions: {matched_style_count}/5")
    assert matched_style_count >= 2, "Expected quiz questions to reflect reference question paper style"

    print("\n✅ Task 5 'Match This Format' test PASSED successfully!")

if __name__ == "__main__":
    test_match_format()
