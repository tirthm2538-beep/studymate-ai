import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv("backend/.env")
key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=key, transport="rest")
model = genai.GenerativeModel("gemini-3.5-flash-lite", generation_config={"response_mime_type": "application/json"})

sample_notes = """
Chapter 4: Cellular Respiration and Energy Metabolism

Cellular respiration is the biochemical pathway by which cells harvest chemical energy from glucose molecules to produce ATP (adenosine triphosphate). It is essential for aerobic organisms and proceeds through four interconnected stages:

1. Glycolysis:
Occurs in the cytoplasm in both aerobic and anaerobic conditions. A single 6-carbon glucose molecule is cleaved into two 3-carbon pyruvate molecules. The pathway requires an initial investment of 2 ATP, producing 4 ATP via substrate-level phosphorylation, yielding a net gain of 2 ATP and 2 NADH.
Key Definition: Glycolysis is the anaerobic enzymatic breakdown of glucose into pyruvate in the cytosol.

2. Pyruvate Oxidation (Link Reaction):
In the mitochondrial matrix, each 3-carbon pyruvate is decarboxylated, releasing CO2. The remaining acetyl group is bonded to Coenzyme A to yield Acetyl-CoA and 1 NADH per pyruvate (2 NADH total per glucose).

3. Citric Acid Cycle (Krebs Cycle):
Acetyl-CoA enters the cyclic pathway combining with 4-carbon oxaloacetate to form 6-carbon citrate. Through successive oxidation and decarboxylation steps, 2 CO2, 3 NADH, 1 FADH2, and 1 ATP (via GTP) are generated per turn (multiplied by 2 for each glucose).
Key Definition: Citric Acid Cycle is the cyclic metabolic reaction series in the mitochondrial matrix that fully oxidizes acetyl units into carbon dioxide while generating reduced coenzymes.

4. Oxidative Phosphorylation:
The electron transport chain (ETC) situated in the inner mitochondrial membrane accepts high-energy electrons from NADH and FADH2. As electrons traverse complexes I through IV to the terminal electron acceptor O2 (forming H2O), protons (H+) are pumped across into the intermembrane space, building a steep proton-motive gradient. Chemiosmosis follows through ATP Synthase, synthesizing approximately 26-28 ATP molecules.
Key Definition: Chemiosmosis is the generation of ATP using energy stored across a transmembrane proton electrochemical gradient.
"""

prompt = f"""You are an expert academic educator and textbook revision author. Analyze the study notes below and generate comprehensive, well-structured revision notes.

Instructions:
1. Organize the material by logical sections and subsections.
2. For each section, provide thorough bullet-point summaries capturing all key principles, mechanisms, formulas, and relationships.
3. Highlight critical definitions: each definition item MUST include "term" and "definition".
4. Conclude with a "quick_revision_summary": an array of 5 to 8 high-yield core takeaways, rules, or formulas for rapid last-minute revision.
5. Mathematical expressions: use clean notation or standard LaTeX ($...$).
6. Output valid JSON only.

JSON schema:
{{
  "document_title": "Descriptive Chapter Title",
  "sections": [
    {{
      "heading": "Section 1: ...",
      "subheadings": [
        {{
          "title": "Subsection 1.1: ...",
          "bullets": [
            "Bullet point explanation..."
          ],
          "key_definitions": [
            {{
              "term": "Key Term",
              "definition": "Definition text..."
            }}
          ]
        }}
      ]
    }}
  ],
  "quick_revision_summary": [
    "High-yield takeaway 1...",
    "High-yield takeaway 2..."
  ]
}}

Study Material:
---
{sample_notes}
---
"""

res = model.generate_content(prompt)
data = json.loads(res.text)
print("SUCCESS!")
print("Document Title:", data.get("document_title"))
print("Sections count:", len(data.get("sections", [])))
for s in data.get("sections", []):
    print(" - Heading:", s.get("heading"))
    for sub in s.get("subheadings", []):
        print("   * Subheading:", sub.get("title"))
        print("     Bullets count:", len(sub.get("bullets", [])))
        print("     Definitions count:", len(sub.get("key_definitions", [])))
print("Quick Revision Summary count:", len(data.get("quick_revision_summary", [])))
