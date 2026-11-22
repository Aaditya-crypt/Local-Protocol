
import json
from pathlib import Path

DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "departments.json"
)


def load_departments():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data["departments"]


def route_complaint(category):
    if not isinstance(category, str) or not category.strip():
        return {
            "department_id": None,
            "department_name": None,
            "routing_status": "manual_review"
        }

    normalized_category = category.strip().casefold()

    departments = load_departments()

    for department in departments:
        categories = department.get("categories", [])

        for department_category in categories:
            if normalized_category == department_category.strip().casefold():
                return {
                    "department_id": department["id"],
                    "department_name": department["name"],
                    "routing_status": "matched"
                }

    return {
        "department_id": None,
        "department_name": None,
        "routing_status": "manual_review"
    }
