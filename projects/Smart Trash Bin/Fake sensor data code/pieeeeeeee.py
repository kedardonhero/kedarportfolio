import time
import glob
import serial
import requests

SERVER_IP = "138.47.137.195"
PORT = 5000
BIN_ID = "B01"
SERVER_URL = f"http://{SERVER_IP}:{PORT}"
ENDPOINT = f"{SERVER_URL}/api/bin/{BIN_ID}"

BAUD = 57600
SEND_EVERY_SEC = 2.0

# HEIGHT CALIBRATION (set these to your bin)
EMPTY_DISTANCE_CM = 55
FULL_DISTANCE_CM  = 8

# WEIGHT CALIBRATION
EMPTY_WEIGHT_KG = 0.0
FULL_WEIGHT_KG  = 10.0

# smoothing (0.0 = no smoothing, 1.0 = heavy)
ALPHA = 0.35

# fusion thresholds
STRONG_FULL_PCT = 85   # if either sensor >= this, trust “full-ish”
NEAR_EMPTY_PCT  = 10   # if both sensors <= this, trust empty

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

def percent_from_height(distance_cm: float) -> float:
    d = clamp(distance_cm, FULL_DISTANCE_CM, EMPTY_DISTANCE_CM)
    pct = ((EMPTY_DISTANCE_CM - d) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) * 100.0
    return clamp(pct, 0.0, 100.0)

def percent_from_weight(weight_kg: float) -> float:
    w = clamp(weight_kg, EMPTY_WEIGHT_KG, FULL_WEIGHT_KG)
    pct = ((w - EMPTY_WEIGHT_KG) / (FULL_WEIGHT_KG - EMPTY_WEIGHT_KG)) * 100.0
    return clamp(pct, 0.0, 100.0)

def find_serial_port():
    ports = glob.glob("/dev/ttyACM*") + glob.glob("/dev/ttyUSB*")
    return ports[0] if ports else None

def parse_csv_line(line: str):
    # Expected: "distance,weight"
    parts = line.strip().split(",")
    if len(parts) != 2:
        return None
    try:
        d = float(parts[0].strip())
        w = float(parts[1].strip())
        return d, w
    except:
        return None

def ema(prev, new, alpha=ALPHA):
    if prev is None:
        return new
    return alpha * new + (1 - alpha) * prev

def fuse(height_pct, weight_pct):
    # Default safe rule
    base = min(height_pct, weight_pct)

    # Avoid “min() lies” in real life:
    # If either sensor is strongly indicating full, don’t under-report too much.
    if height_pct >= STRONG_FULL_PCT or weight_pct >= STRONG_FULL_PCT:
        return max(base, 0.70 * max(height_pct, weight_pct))  # lift it but not crazy

    # If both near empty, keep it low
    if height_pct <= NEAR_EMPTY_PCT and weight_pct <= NEAR_EMPTY_PCT:
        return min(height_pct, weight_pct)

    return base

def safe_put_fill(fill_level: int):
    try:
        r = requests.put(ENDPOINT, json={"v": fill_level}, timeout=3)
        return r.status_code
    except Exception:
        return None

def main():
    port = find_serial_port()
    if not port:
        print("No serial device found (/dev/ttyACM* or /dev/ttyUSB*). Plug Arduino and retry.")
        return

    print("Using serial:", port, "BAUD:", BAUD)
    ser = serial.Serial(port, BAUD, timeout=1)
    time.sleep(2)

    last_send = 0
    height_pct_s = None
    weight_pct_s = None

    print("Running... Ctrl+C to stop")

    while True:
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        if not line:
            continue

        parsed = parse_csv_line(line)
        if not parsed:
            # ignore noise
            continue

        distance_cm, weight_kg = parsed

        # Arduino uses -1 for invalid distance
        if distance_cm < 0:
            continue

        # compute percents
        height_pct = percent_from_height(distance_cm)
        weight_pct = percent_from_weight(weight_kg)

        # smooth
        height_pct_s = ema(height_pct_s, height_pct)
        weight_pct_s = ema(weight_pct_s, weight_pct)

        # fuse
        fused = fuse(height_pct_s, weight_pct_s)
        fill_level = int(round(clamp(fused, 0, 100)))

        now = time.time()
        if now - last_send >= SEND_EVERY_SEC:
            last_send = now
            status = safe_put_fill(fill_level)

            if status is None:
                print(f"NET DOWN | fill={fill_level}% | h={height_pct_s:.0f}% w={weight_pct_s:.0f}% | raw d={distance_cm:.1f} wkg={weight_kg:.2f}")
            else:
                print(f"OK {status} | fill={fill_level}% | h={height_pct_s:.0f}% w={weight_pct_s:.0f}% | raw d={distance_cm:.1f} wkg={weight_kg:.2f}")

if __name__ == "__main__":
    main()
