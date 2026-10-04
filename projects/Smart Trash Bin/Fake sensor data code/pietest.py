import serial
import time
import requests

SERVER_IP = "138.47.137.195"
PORT = 5000
BIN_ID = "B01"
SERVER_URL = f"http://{SERVER_IP}:{PORT}"

SERIAL_PORT = "/dev/ttyACM0"
BAUD = 9600

# HEIGHT CALIBRATION (ultrasonic distance)
EMPTY_DISTANCE_CM = 55   # when bin is empty (sensor sees far)
FULL_DISTANCE_CM  = 8    # when bin is full  (sensor sees near)

# WEIGHT CALIBRATION (load cell)
EMPTY_WEIGHT_KG = 0.0
FULL_WEIGHT_KG  = 10.0  

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
ser.reset_input_buffer()
time.sleep(2)

print("Sending calibrated fill level (height + weight)... Ctrl+C to stop")

while True:
    try:
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        if not line:
            continue

        parts = line.split(",")
        if len(parts) != 2:
            print("Bad line (expected distance,weight):", line)
            continue

        distance_cm = int(parts[0].strip())
        weight_kg = float(parts[1].strip())

        # --- HEIGHT % ---
        distance_cm = clamp(distance_cm, FULL_DISTANCE_CM, EMPTY_DISTANCE_CM)
        height_percent = ((EMPTY_DISTANCE_CM - distance_cm) /
                          (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) * 100.0
        height_percent = clamp(height_percent, 0.0, 100.0)

        # --- WEIGHT % ---
        weight_kg = clamp(weight_kg, EMPTY_WEIGHT_KG, FULL_WEIGHT_KG)
        weight_percent = ((weight_kg - EMPTY_WEIGHT_KG) /
                          (FULL_WEIGHT_KG - EMPTY_WEIGHT_KG)) * 100.0
        weight_percent = clamp(weight_percent, 0.0, 100.0)

        # --- COMBINE (simple average) ---
        fill_level = round((height_percent + weight_percent) / 2.0)
        fill_level = clamp(fill_level, 0, 100)

        response = requests.put(
            f"{SERVER_URL}/api/bin/{BIN_ID}",
            json={
                "v": fill_level,
                "height_cm": int(distance_cm),     # sensor distance 
                "weight_kg": float(weight_kg)
            },
            timeout=5
        )

        print(
            f"Sent: {fill_level}% | "
            f"distance={distance_cm}cm (H={round(height_percent)}%) | "
            f"weight={weight_kg}kg (W={round(weight_percent)}%) | "
            f"HTTP {response.status_code}"
        )

    except Exception as e:
        print("Error:", e)

    time.sleep(10)