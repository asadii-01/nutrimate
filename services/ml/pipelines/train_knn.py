"""Build the KNN meal recommender (TRD §6.2).

Feature vector (5-dim, StandardScaler-normalized, Euclidean):
    [age, bmi, activityLevel (1-5), goalEncoded, dietPrefEncoded]

    goalEncoded:     lose=0, maintain=1, gain=2
    dietPrefEncoded: nonveg=0, veg=1, vegan=2

Fits `NearestNeighbors(k=5)` on the 52 seed meal-plan profiles from
`seed_data.py`. The artifact bundles the scaler, the index, and the full meal
compositions so the FastAPI service can serve recommendations on startup.

Writes:
    models/knn_v{VERSION}.pkl
    models/knn_meta.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

from seed_data import DISHES, build_meal_plans

VERSION = "0.1.0"
DEFAULT_K = 5
GOAL_ENCODING = {"lose": 0, "maintain": 1, "gain": 2}
DIET_ENCODING = {"nonveg": 0, "veg": 1, "vegan": 2}
FEATURE_ORDER = ["age", "bmi", "activityLevel", "goalEncoded", "dietPrefEncoded"]
SERVICE_ROOT = Path(__file__).resolve().parent.parent


def encode_profile(profile: dict) -> list[float]:
    """Turn a profile dict into the 5-dim KNN feature vector (pre-scaling)."""
    return [
        float(profile["age"]),
        float(profile["bmi"]),
        float(profile["activityLevel"]),
        float(GOAL_ENCODING[profile["goal"]]),
        float(DIET_ENCODING[profile["dietPref"]]),
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Train KNN meal recommender.")
    parser.add_argument("--models-dir", type=Path, default=SERVICE_ROOT / "models")
    parser.add_argument("--k", type=int, default=DEFAULT_K)
    args = parser.parse_args()

    args.models_dir.mkdir(parents=True, exist_ok=True)

    plans = build_meal_plans()
    if len(plans) < 50:
        raise SystemExit(f"FAIL: only {len(plans)} seed plans, need ≥ 50 (TRD §6.2)")
    print(f"loaded {len(plans)} seed meal plans")

    X = np.array([encode_profile(p["profile"]) for p in plans], dtype=np.float64)

    scaler = StandardScaler().fit(X)
    X_scaled = scaler.transform(X)

    k = min(args.k, len(plans))
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean").fit(X_scaled)

    artifact = {
        "version": VERSION,
        "k": k,
        "scaler": scaler,
        "nn": nn,
        "plans": plans,
        "dishes": {k: dict(v) for k, v in DISHES.items()},
        "featureOrder": FEATURE_ORDER,
        "goalEncoding": GOAL_ENCODING,
        "dietEncoding": DIET_ENCODING,
    }
    artifact_path = args.models_dir / f"knn_v{VERSION}.pkl"
    joblib.dump(artifact, artifact_path)

    meta_path = args.models_dir / "knn_meta.json"
    cluster_counts: dict[str, int] = {}
    for p in plans:
        cluster_counts[p["cluster"]] = cluster_counts.get(p["cluster"], 0) + 1
    meta_path.write_text(
        json.dumps(
            {
                "modelVersion": VERSION,
                "k": k,
                "planCount": len(plans),
                "clusters": cluster_counts,
                "featureOrder": FEATURE_ORDER,
            },
            indent=2,
        )
    )

    # Sanity check: query a lean, very-active gainer — expect a high-cal match.
    probe = encode_profile(
        {"age": 22, "bmi": 20.0, "activityLevel": 5, "goal": "gain", "dietPref": "nonveg"}
    )
    dist, idx = nn.kneighbors(scaler.transform([probe]))
    nearest = [plans[i]["id"] + f"({plans[i]['cluster']})" for i in idx[0]]
    print(f"saved: {artifact_path}")
    print(f"saved: {meta_path}")
    print(f"probe (lean active gainer) → {nearest}")
    print(f"PASS: KNN built with {len(plans)} plans, k={k}")


if __name__ == "__main__":
    main()
