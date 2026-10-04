from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
CORS(app)

DATA_FILE = "bins.json"

OFFLINE_AFTER_SECONDS = 10 #if bin doesnot sends data in this time it is considered as offline  

#this function helps to get the information of bin safely without crashing if file is corrupt or something is missing in the file
def load_bins():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        # file exists but is empty/corrupt
        return []

#this function helps to write the information of bin in the json file
def save_bins(bins):
    with open(DATA_FILE, "w") as f:
        json.dump(bins, f, indent=2)

#this function returns current time in utc format which help us to track when the bin was updated last
def iso_now_utc():
    return datetime.now(timezone.utc).isoformat()

#this function decides whether the bin is online or offline 
def compute_status(last_seen_iso: str) -> str:
    if not last_seen_iso:
        return "offline"
    try:
        last = datetime.fromisoformat(last_seen_iso.replace("Z", "+00:00"))
        age = datetime.now(timezone.utc) - last
        return "offline" if age.total_seconds() > OFFLINE_AFTER_SECONDS else "online"
    except Exception:
        return "offline"

def with_status(bin_obj: dict) -> dict:
    b = dict(bin_obj)
    b["status"] = compute_status(b.get("last_seen"))
    return b


@app.route("/api/bins", methods=["GET"])
def get_bins():
    bins = load_bins()
    # return bins WITH status (online/offline)
    return jsonify([with_status(b) for b in bins])


@app.route("/api/bin", methods=["POST"])
def add_bin():
    data = request.json or {}

    required = ["id", "loc", "lat", "lng"]
    missing = [k for k in required if k not in data]
    if missing:
        return {"error": f"Missing fields: {', '.join(missing)}"}, 400

    bins = load_bins()

    # Prevent duplicate IDs
    if any(b.get("id") == data["id"] for b in bins):
        return {"error": "Bin ID already exists"}, 409

    bins.append({
        "id": data["id"],
        "loc": data["loc"],
        "v": data.get("v", 0),
        "lat": data["lat"],
        "lng": data["lng"],
        "height_cm": data.get("height_cm", None),
        "weight_kg": data.get("weight_kg", None),
        "last_seen": iso_now_utc()
    })

    save_bins(bins)
    return {"message": "Bin added"}, 201


@app.route("/api/bin/<bin_id>", methods=["DELETE"])
def delete_bin(bin_id):
    bins = load_bins()
    new_bins = [b for b in bins if b.get("id") != bin_id]

    if len(new_bins) == len(bins):
        return {"error": "Not found"}, 404

    save_bins(new_bins)
    return {"message": "Bin deleted"}, 200


@app.route("/api/bin/<bin_id>", methods=["PUT"])
def update_bin(bin_id):
    data = request.json or {}
    bins = load_bins()

    for b in bins:
        if b.get("id") == bin_id:
            if "v" in data:
                b["v"] = data["v"]
            if "height_cm" in data:
                b["height_cm"] = data["height_cm"]
            if "weight_kg" in data:
                b["weight_kg"] = data["weight_kg"]

            b["last_seen"] = iso_now_utc()
            save_bins(bins)
            return {"message": "Updated", "bin": with_status(b)}, 200

    return {"error": "Not found"}, 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)