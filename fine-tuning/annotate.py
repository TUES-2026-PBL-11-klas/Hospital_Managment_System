"""
Annotates the Symptom2Disease dataset using Groq (free tier, Llama 3.1 70B).

Usage:
  1. py -m pip install groq
  2. Get a free API key from https://console.groq.com
  3. Drop Symptom2Disease.csv in this folder
  4. py annotate.py --api-key YOUR_KEY_HERE

Output: training_data.jsonl  (ready for fine-tuning)
"""

import json
import time
import argparse
import csv
import os
import sys

DISEASE_TO_SPECIALTY = {
    "Fungal infection": "Dermatology",
    "Allergy": "Allergy and Immunology",
    "GERD": "Gastroenterology",
    "Chronic cholestasis": "Gastroenterology",
    "Drug Reaction": "Allergy and Immunology",
    "Peptic ulcer disease": "Gastroenterology",
    "AIDS": "Infectious Disease",
    "Diabetes": "Endocrinology",
    "Gastroenteritis": "Gastroenterology",
    "Bronchial Asthma": "Pulmonology",
    "Hypertension": "Cardiology",
    "Migraine": "Neurology",
    "Cervical spondylosis": "Orthopedics",
    "Paralysis (brain hemorrhage)": "Neurology",
    "Jaundice": "Gastroenterology",
    "Malaria": "Infectious Disease",
    "Chicken pox": "Infectious Disease",
    "Dengue": "Infectious Disease",
    "Typhoid": "Infectious Disease",
    "hepatitis A": "Gastroenterology",
    "Hepatitis B": "Gastroenterology",
    "Hepatitis C": "Gastroenterology",
    "Hepatitis D": "Gastroenterology",
    "Hepatitis E": "Gastroenterology",
    "Alcoholic hepatitis": "Gastroenterology",
    "Tuberculosis": "Pulmonology",
    "Common Cold": "General Practice",
    "Pneumonia": "Pulmonology",
    "Dimorphic hemmorhoids(piles)": "Gastroenterology",
    "Heart attack": "Cardiology",
    "Varicose veins": "Vascular Surgery",
    "Hypothyroidism": "Endocrinology",
    "Hyperthyroidism": "Endocrinology",
    "Hypoglycemia": "Endocrinology",
    "Osteoarthristis": "Orthopedics",
    "Arthritis": "Rheumatology",
    "(vertigo) Paroymsal Positional Vertigo": "Neurology",
    "Acne": "Dermatology",
    "Urinary tract infection": "Urology",
    "Psoriasis": "Dermatology",
    "Impetigo": "Dermatology",
}

SYSTEM_PROMPT = (
    "You are a medical triage assistant. "
    "When given a patient's symptom description and their diagnosis, "
    "return ONLY a valid JSON object with no extra text or markdown. "
    'Format: {"specialty": "...", "confidence_score": 0.0, "reasoning": "..."}'
)


def load_csv(path: str) -> list[dict]:
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({"label": row.get("label", "").strip(),
                         "text": row.get("text", "").strip()})
    return rows


def load_progress(progress_file: str) -> dict:
    if os.path.exists(progress_file):
        with open(progress_file, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_progress(progress_file: str, progress: dict):
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)


def build_user_message(symptoms_text: str, disease: str, specialty_hint: str) -> str:
    hint = f", specialty: {specialty_hint}" if specialty_hint else ""
    return f'Symptoms: "{symptoms_text}"\nDiagnosis: {disease}{hint}\nJSON only:'


def call_groq(client, user_message: str, retries: int = 3) -> dict | None:
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                max_tokens=256,
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            parsed = json.loads(text.strip())
            if "specialty" in parsed and "confidence_score" in parsed and "reasoning" in parsed:
                return parsed
        except Exception as e:
            wait = 2 ** attempt
            print(f"\n  Attempt {attempt + 1} failed: {e}")
            if "rate_limit" in str(e).lower() or "429" in str(e):
                wait = 30
            print(f"  Waiting {wait}s...", end=" ", flush=True)
            time.sleep(wait)
    return None


def build_training_entry(symptoms_text: str, annotation: dict) -> dict:
    return {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a medical triage assistant. Analyze the patient's symptoms and return "
                    "ONLY valid JSON with the fields: specialty, confidence_score, reasoning."
                ),
            },
            {"role": "user", "content": f"Patient describes: {symptoms_text}"},
            {
                "role": "assistant",
                "content": json.dumps({
                    "specialty": annotation["specialty"],
                    "confidence_score": round(float(annotation["confidence_score"]), 2),
                    "reasoning": annotation["reasoning"],
                }),
            },
        ]
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", required=True, help="Groq API key from console.groq.com")
    parser.add_argument("--input", default="Symptom2Disease.csv")
    parser.add_argument("--output", default="training_data.jsonl")
    parser.add_argument("--delay", type=float, default=2.0,
                        help="Seconds between calls (Groq free: 30 req/min = 2s delay)")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, args.input)
    output_path = os.path.join(script_dir, args.output)
    progress_file = os.path.join(script_dir, ".progress.json")

    if not os.path.exists(input_path):
        print(f"ERROR: {args.input} not found in {script_dir}")
        print("Download from: https://www.kaggle.com/datasets/niyarrbarman/symptom2disease")
        sys.exit(1)

    try:
        from groq import Groq
    except ImportError:
        print("Run: py -m pip install groq")
        sys.exit(1)

    client = Groq(api_key=args.api_key)
    rows = load_csv(input_path)
    progress = load_progress(progress_file)
    print(f"Loaded {len(rows)} rows. {len(progress)} already annotated.\n")

    results = []
    errors = 0

    for i, row in enumerate(rows):
        key = f"{i}_{row['label']}"

        if key in progress:
            results.append(build_training_entry(row["text"], progress[key]))
            continue

        specialty_hint = DISEASE_TO_SPECIALTY.get(row["label"], "")
        user_msg = build_user_message(row["text"], row["label"], specialty_hint)

        print(f"[{i+1}/{len(rows)}] {row['label']}...", end=" ", flush=True)
        annotation = call_groq(client, user_msg)

        if annotation:
            print(f"→ {annotation['specialty']} ({annotation['confidence_score']})")
            progress[key] = annotation
            results.append(build_training_entry(row["text"], annotation))
            if (i + 1) % 20 == 0:
                save_progress(progress_file, progress)
                eta_min = round((len(rows) - i - 1) * args.delay / 60, 1)
                print(f"  [checkpoint saved — ~{eta_min} min remaining]")
        else:
            print("FAILED — skipping")
            errors += 1

        time.sleep(args.delay)

    save_progress(progress_file, progress)

    with open(output_path, "w", encoding="utf-8") as f:
        for entry in results:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"\nDone! {len(results)} entries written to {args.output}")
    print(f"Errors/skipped: {errors}")
    if errors == 0 and os.path.exists(progress_file):
        os.remove(progress_file)


if __name__ == "__main__":
    main()
