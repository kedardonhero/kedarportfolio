#include <HX711_ADC.h>
#include <EEPROM.h>

// --- HX711 ---
const int HX711_dout = 6;
const int HX711_sck  = 7;
HX711_ADC LoadCell(HX711_dout, HX711_sck);

// --- Ultrasonic ---
#define TRIG_PIN 10
#define ECHO_PIN 11

const unsigned long interval_ms = 200;
unsigned long last_ms = 0;

float lastWeight = 0.0;

// simple median of 3 helper
int median3(int a, int b, int c) {
  if (a > b) { int t=a; a=b; b=t; }
  if (b > c) { int t=b; b=c; c=t; }
  if (a > b) { int t=a; a=b; b=t; }
  return b;
}

int readDistanceOnce() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return -1;

  int d = (int)(duration * 0.0343 / 2.0);
  if (d < 2 || d > 400) return -1;
  return d;
}

int readDistanceFiltered() {
  int d1 = readDistanceOnce(); delay(10);
  int d2 = readDistanceOnce(); delay(10);
  int d3 = readDistanceOnce();

  // if all invalid -> invalid
  if (d1 < 0 && d2 < 0 && d3 < 0) return -1;

  // replace invalid with a valid one for median stability
  int v = (d1 >= 0) ? d1 : (d2 >= 0 ? d2 : d3);
  if (d1 < 0) d1 = v;
  if (d2 < 0) d2 = v;
  if (d3 < 0) d3 = v;

  return median3(d1, d2, d3);
}

void setup() {
  Serial.begin(57600);

  float calibrationValue = 696.0;   // your factor
  LoadCell.begin();
  LoadCell.start(2000, true);
  LoadCell.setCalFactor(calibrationValue);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
}

void loop() {
  // update HX711 continuously
  if (LoadCell.update()) {
    float w = LoadCell.getData();
    // small noise clamp (optional)
    if (w < 0) w = 0;
    lastWeight = w;
  }

  if (millis() - last_ms >= interval_ms) {
    last_ms = millis();

    int distance = readDistanceFiltered();

    // CSV: distance_cm,weight_kg
    Serial.print(distance);
    Serial.print(",");
    Serial.println(lastWeight, 2);
  }

  // tare
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 't') LoadCell.tareNoDelay();
  }
}
