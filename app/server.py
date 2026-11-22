
import json
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from app.ai.gemini_client import analyze_complaint
from app.ai.image_analyzer import analyze_image
from app.ai.department_router import route_complaint


# =====================================================
# 1. FLASK CONFIGURATION
# =====================================================

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"]
        }
    }
)

BASE_DIR = Path(__file__).resolve().parent

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# =====================================================
# 2. COMPLAINT JSON STORAGE
# =====================================================

COMPLAINTS_DIR = BASE_DIR / "data" / "complaints"
COMPLAINTS_DIR.mkdir(parents=True, exist_ok=True)

complaint_file_lock = threading.Lock()

CATEGORY_FILES = {
    "garbage collection": "garbage.json",
    "roads and potholes": "pothole.json",
    "water supply": "water_supply.json",
    "drainage and sewage": "drainage.json",
    "streetlights": "streetlights.json"
}

STORAGE_FILES = [
    "garbage.json",
    "pothole.json",
    "water_supply.json",
    "drainage.json",
    "streetlights.json",
    "other.json"
]


def initialize_storage():
    """Create missing complaint files with valid empty JSON lists."""

    for filename in STORAGE_FILES:

        file_path = COMPLAINTS_DIR / filename

        if not file_path.exists():
            with open(file_path, "w", encoding="utf-8") as file:
                json.dump([], file, indent=4)


def read_complaints(file_path):
    """Read complaints safely, including empty files."""

    if not file_path.exists():
        return []

    with open(file_path, "r", encoding="utf-8-sig") as file:
        content = file.read().strip()

    if not content:
        return []

    complaints = json.loads(content)

    if not isinstance(complaints, list):
        raise ValueError(
            f"{file_path.name} must contain a JSON list."
        )

    return complaints


initialize_storage()


# =====================================================
# 3. HEALTH CHECK
# =====================================================

@app.route("/api/health", methods=["GET"])
def health_check():

    return jsonify({
        "success": True,
        "message": "JanSahayak AI backend is running.",
        "status": "healthy"
    }), 200


# =====================================================
# 4. AI TEXT COMPLAINT ANALYSIS
# =====================================================

@app.route("/api/ai/analyze-text", methods=["POST"])
def analyze_text():

    try:

        data = request.get_json(silent=True) or {}

        complaint = data.get("complaint", "")

        if not isinstance(complaint, str) or not complaint.strip():

            return jsonify({
                "success": False,
                "error": "Please enter a valid complaint."
            }), 400

        result = analyze_complaint(complaint.strip())

        if isinstance(result, str):
            result = json.loads(result)

        if not isinstance(result, dict):
            raise ValueError("AI returned an invalid analysis format.")

        return jsonify({
            "success": True,
            "message": "Complaint analyzed successfully.",
            "analysis": result
        }), 200

    except Exception:

        app.logger.exception("AI text analysis failed.")

        return jsonify({
            "success": False,
            "error": "AI complaint analysis failed. Please try again."
        }), 500


# =====================================================
# 5. AI IMAGE EVIDENCE ANALYSIS
# =====================================================

@app.route("/api/ai/analyze-image", methods=["POST"])
def analyze_complaint_image():

    try:

        complaint = request.form.get("complaint", "").strip()

        image = request.files.get("image")

        if not image or not image.filename:

            return jsonify({
                "success": False,
                "error": "Please upload an image."
            }), 400

        safe_filename = secure_filename(image.filename)

        extension = Path(safe_filename).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:

            return jsonify({
                "success": False,
                "error": "Unsupported image format. Use JPG, PNG or WEBP."
            }), 400

        with tempfile.TemporaryDirectory() as temp_dir:

            image_path = Path(temp_dir) / f"evidence{extension}"

            image.save(str(image_path))

            result = analyze_image(
                str(image_path),
                complaint=complaint
            )

        return jsonify({
            "success": True,
            "message": "Image evidence analyzed successfully.",
            "image_analysis": result
        }), 200

    except Exception:

        app.logger.exception("Image evidence analysis failed.")

        return jsonify({
            "success": False,
            "error": "Image analysis failed. Please try again."
        }), 500


# =====================================================
# 6. DEPARTMENT ROUTING
# =====================================================

@app.route("/api/departments/route", methods=["POST"])
def department_routing():

    try:

        data = request.get_json(silent=True) or {}

        category = data.get("category", "")

        if not isinstance(category, str) or not category.strip():

            return jsonify({
                "success": False,
                "error": "A valid complaint category is required."
            }), 400

        department = route_complaint(category.strip())

        return jsonify({
            "success": True,
            "routing": department
        }), 200

    except Exception:

        app.logger.exception("Department routing failed.")

        return jsonify({
            "success": False,
            "error": "Department routing failed."
        }), 500


# =====================================================
# 7. REGISTER COMPLAINT
# =====================================================

@app.route("/api/complaints/register", methods=["POST"])
def register_complaint():

    try:

        data = request.get_json(silent=True) or {}

        complaint = data.get("complaint", "")
        location = data.get("location", "")
        language = data.get("language", "English")

        analysis = data.get("analysis")
        image_analysis = data.get("image_analysis")

        # Validate complaint.

        if not isinstance(complaint, str) or not complaint.strip():

            return jsonify({
                "success": False,
                "error": "Complaint text is required."
            }), 400

        if not isinstance(location, str):

            return jsonify({
                "success": False,
                "error": "Location must be text."
            }), 400

        if not isinstance(language, str):

            return jsonify({
                "success": False,
                "error": "Language must be text."
            }), 400

        if not isinstance(analysis, dict):

            return jsonify({
                "success": False,
                "error": "Valid AI analysis is required."
            }), 400

        if image_analysis is not None and not isinstance(image_analysis, dict):

            return jsonify({
                "success": False,
                "error": "Invalid image analysis."
            }), 400

        complaint = complaint.strip()
        location = location.strip()

        # Get category.

        category = analysis.get("category", "Other")

        if not isinstance(category, str):
            category = "Other"

        category = category.strip() or "Other"

        # Select JSON file.

        filename = CATEGORY_FILES.get(
            category.casefold(),
            "other.json"
        )

        file_path = COMPLAINTS_DIR / filename

        # Route to department.

        department = route_complaint(category)

        # Generate ticket.

        ticket_id = f"JS-{uuid4().hex[:10].upper()}"

        # Determine human review requirement.

        needs_human_review = (
            department["routing_status"] != "matched"
        )

        evidence_match = None

        if isinstance(image_analysis, dict):

            evidence_match = image_analysis.get(
                "complaint_evidence_match"
            )

        if isinstance(evidence_match, dict):

            match_status = evidence_match.get("match_status")

            if match_status != "Consistent":
                needs_human_review = True

            if evidence_match.get("needs_human_review") is True:
                needs_human_review = True

        # Build complaint record.

        record = {
            "ticket_id": ticket_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "complaint": complaint,
            "location": location,
            "language": language,
            "category": category,
            "problem_summary": analysis.get("problem_summary"),
            "urgency": analysis.get("urgency"),
            "duration": analysis.get("duration"),
            "assigned_department": department["department_name"],
            "department_id": department["department_id"],
            "routing_status": department["routing_status"],
            "status": "Submitted - Demo",
            "needs_human_review": needs_human_review,
            "image_evidence": image_analysis
        }

        # Save record.

        with complaint_file_lock:

            complaints = read_complaints(file_path)

            complaints.append(record)

            with open(
                file_path,
                "w",
                encoding="utf-8"
            ) as file:

                json.dump(
                    complaints,
                    file,
                    indent=4,
                    ensure_ascii=False
                )

        return jsonify({
            "success": True,
            "message": "Complaint registered successfully.",
            "ticket_id": ticket_id,
            "category": category,
            "assigned_department": department["department_name"],
            "routing_status": department["routing_status"],
            "needs_human_review": needs_human_review,
            "status": "Submitted - Demo",
            "storage_file": filename
        }), 201

    except json.JSONDecodeError:

        app.logger.exception("Complaint storage contains invalid JSON.")

        return jsonify({
            "success": False,
            "error": "Complaint storage file contains invalid JSON."
        }), 500

    except Exception:

        app.logger.exception("Complaint registration failed.")

        return jsonify({
            "success": False,
            "error": "Complaint registration failed. Please try again."
        }), 500


# =====================================================
# 8. FILE SIZE ERROR
# =====================================================

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "error": "Image is too large. Maximum allowed size is 10 MB."
    }), 413


# =====================================================
# 9. START FLASK SERVER
# =====================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
