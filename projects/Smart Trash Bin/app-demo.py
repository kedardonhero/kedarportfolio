
# Flask helps us create a web server
# request is used to read data sent from frontend (website)
# jsonify converts Python data into JSON (web-friendly format)
from flask import Flask, request, jsonify

# CORS allows frontend (JavaScript) to talk to this backend
from flask_cors import CORS

# json is used to save data into a file
import json

# os helps us check if a file exists
import os

from datetime import datetime, timezone




# CREATE FLASK APP (SERVER)

app = Flask(__name__)   # create the server
CORS(app)               # allow frontend to access this server


# ----------------------------
# FILE WHERE BINS ARE SAVED
# ----------------------------
DATA_FILE = "bins.json"


# ----------------------------
# FUNCTION TO LOAD BINS
# ----------------------------
def load_bins():
    # if file does not exist, return empty list
    if not os.path.exists(DATA_FILE):
        return []

    # open file in read mode
    with open(DATA_FILE, "r") as f:
        # read JSON data and convert to Python list
        return json.load(f)


# ----------------------------
# FUNCTION TO SAVE BINS (PERMANENT)
# ----------------------------
def save_bins(bins):
    # open file in write mode
    with open(DATA_FILE, "w") as f:
        # save Python list as JSON into file
        json.dump(bins, f, indent=2)


# ----------------------------
# GET ALL BINS (READ DATA)
# ----------------------------
@app.route("/api/bins", methods=["GET"])
def get_bins():
    # load bins from file
    bins = load_bins()

    # send bins to frontend in JSON format
    return jsonify(bins)


# ----------------------------
# ADD A NEW BIN (CREATE)
# ----------------------------
@app.route("/api/bin", methods=["POST"])
def add_bin():
    # get data sent from frontend
    data = request.json

    # load existing bins
    bins = load_bins()

    # add new bin to list
    bins.append({
        "id": data["id"],
        "loc": data["loc"],
        "v": data.get("v", 0),
        "lat": data["lat"],
        "lng": data["lng"],
        "height_cm": data.get("height_cm", None),
        "weight_kg": data.get("weight_kg", None),
        "last_seen": datetime.now(timezone.utc).isoformat()
    })


    # save updated bins to file (PERMANENT SAVE)
    save_bins(bins)

    # send success message
    return {"message": "Bin added"}, 201


# ----------------------------
# DELETE A BIN
# ----------------------------
@app.route("/api/bin/<bin_id>", methods=["DELETE"])
def delete_bin(bin_id):
    # load bins from file
    bins = load_bins()
    new_bins = []
    # remove the bin with matching ID
    for b in bins:
        if b["id"] != bin_id:
            new_bins.append(b)

    bins = new_bins

    # save updated bins to file
    save_bins(bins)

    # send success message
    return {"message": "Bin deleted"}, 200


# ----------------------------
# UPDATE BIN FILL LEVEL
# ----------------------------
@app.route("/api/bin/<bin_id>", methods=["PUT"])
def update_bin(bin_id):
    # get new fill level from frontend
    data = request.json

    # load bins from file
    bins = load_bins()

    # find the bin and update value
    for b in bins:
        if b["id"] == bin_id:
            # keep existing if not provided
            if "v" in data:
                b["v"] = data["v"]

            if "height_cm" in data:
                b["height_cm"] = data["height_cm"]

            if "weight_kg" in data:
                b["weight_kg"] = data["weight_kg"]

            b["last_seen"] = datetime.now(timezone.utc).isoformat()
            save_bins(bins)
            return {"message": "Updated"}, 200

    # if bin ID not found
    return {"error": "Not found"}, 404


# ----------------------------
# START THE SERVER
# ----------------------------
if __name__ == "__main__":
    # run server on port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)









#     [
#   {
#     "id": "B01",
#     "loc": "IESB",
#     "v": 85,
#     "lat": 32.5257,
#     "lng": -92.6465
#   },
#   {
#     "id": "B02",
#     "loc": "Cafeteria",
#     "v": 46,
#     "lat": 32.5234,
#     "lng": -92.639
#   },
#   {
#     "id": "B03",
#     "loc": "Dorm",
#     "v": 83,
#     "lat": 32.522,
#     "lng": -92.6355
#   }
# ]