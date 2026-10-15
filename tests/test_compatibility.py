import pytest

def compute_shared_interests(target_interests, candidate_interests):
    t_set = set(i.lower().strip() for i in target_interests)
    c_set = set(i.lower().strip() for i in candidate_interests)
    if not t_set or not c_set:
        return 50, [], True  # Missing data is neutral
    shared = list(t_set.intersection(c_set))
    if len(shared) >= 3:
        score = min(100, 75 + len(shared) * 8)
    elif len(shared) >= 1:
        score = 55 + len(shared) * 12
    else:
        score = 35
    return score, shared, False

def check_dealbreaker(target_dealbreakers, candidate_bio, candidate_habits):
    full_text = (candidate_bio + " " + " ".join(candidate_habits)).lower()
    for db in target_dealbreakers:
        db_lower = db.lower()
        if "smok" in db_lower and ("smok" in full_text or "cigar" in full_text):
            return True, f"Dealbreaker triggered: {db}"
    return False, ""

def compute_overall_compatibility(shared_score, goals_score, conv_score, lifestyle_score, dealbreaker_triggered):
    if dealbreaker_triggered:
        return 0, -100
    raw = 0.35 * shared_score + 0.25 * goals_score + 0.20 * conv_score + 0.20 * lifestyle_score
    return round(min(100, max(0, raw))), 0

def test_shared_interests_calculation():
    score, shared, is_missing = compute_shared_interests(
        ["Architecture", "Ceramics", "Bouldering"],
        ["Ceramics", "Bouldering", "Acoustics"]
    )
    assert not is_missing
    assert len(shared) == 2
    assert score >= 70

def test_missing_data_neutral_handling():
    score, shared, is_missing = compute_shared_interests([], ["Acoustics"])
    assert is_missing is True
    assert score == 50  # Must not penalize to 0

def test_dealbreaker_override():
    triggered, reason = check_dealbreaker(
        ["Active smoking or tobacco use"],
        "Enjoys vintage cigars on the patio",
        ["Cigars", "Vinyl"]
    )
    assert triggered is True
    overall, penalty = compute_overall_compatibility(85, 90, 80, 80, triggered)
    assert overall == 0
    assert penalty == -100

def test_directed_asymmetry():
    # Target A has dealbreaker on smoking, Candidate B smokes.
    # Target B has NO dealbreaker on non-smokers.
    a_db, _ = check_dealbreaker(["Active smoking"], "Cigars and records", [])
    b_db, _ = check_dealbreaker([], "Non-smoker architect", [])
    
    score_a_to_b, _ = compute_overall_compatibility(80, 80, 80, 80, a_db)
    score_b_to_a, _ = compute_overall_compatibility(80, 80, 80, 80, b_db)
    
    assert score_a_to_b == 0
    assert score_b_to_a == 80
