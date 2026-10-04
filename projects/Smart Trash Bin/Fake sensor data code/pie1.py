import requests
import time
import random

SERVER_IP = "192.168.1.56"
PORT = 5000
BIN_ID = "B02"

SERVER_URL = f"http://{SERVER_IP}:{PORT}"

# DEMO SENSOR VALUES
def read_demo_values():
    distance_cm = random.randint(8, 55)   # ultrasonic range
    weight_kg = round(random.uniform(0, 10), 2)
    return distance_cm, weight_kg

while True:
    distance_cm, weight_kg = read_demo_values()

    # simple percent calculation for demo
    height_percent = (55 - distance_cm) / (55 - 8) * 100
    weight_percent = (weight_kg / 10) * 100
    fill_level = int((height_percent + weight_percent) / 2)

    try:
        response = requests.put(
            f"{SERVER_URL}/api/bin/{BIN_ID}",
            json={
                "v": fill_level,
                "height_cm": distance_cm,
                "weight_kg": weight_kg
            },
            timeout=5
        )

        print(
            f"Sent → {fill_level}% | "
            f"height={distance_cm}cm | weight={weight_kg}kg | "
            f"HTTP {response.status_code}"
        )

    except Exception as e:
        print("Error sending data:", e)

    time.sleep(5)