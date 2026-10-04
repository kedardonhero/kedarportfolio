const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

// Change this to your bin depth (sensor to bottom)
const float BIN_DEPTH_CM = 50.0;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  float distance = getDistance();

  if (distance > 0) {
    float trashHeight = BIN_DEPTH_CM - distance;

    if (trashHeight < 0) trashHeight = 0;

    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.print(" cm   Trash height: ");
    Serial.print(trashHeight);
    Serial.println(" cm");
  }

  delay(500);
}

float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);

  float distance = duration * 0.0343 / 2;
  return distance;
}
