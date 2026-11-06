# IoT-Based Refrigeration System

A utility-aware smart refrigeration controller that simulates IoT sensor data, runs a tariff-optimised state machine, and visualises results on a live dashboard.

## Web dashboard

The Netlify-compatible website is in `public/`, with `netlify.toml` configuring static publishing. It runs a browser simulation without a Python server or build step. Open the site through a static HTTP server; JavaScript modules require HTTP rather than opening the HTML file directly.

The dashboard provides temperature charts, all four controller states, peak/off-peak tariff tracking, a conventional thermostat cost comparison, and CSV export. Pause or reset the simulation, change its speed, adjust ambient temperature, open the simulated door, or disable tariff-aware cooling to explore the behavior.

The initial view simulates the first twelve hours of a day. All readings and settings belong to the current browser session and reset on reload; there is no hardware connection or saved telemetry. The chart and export retain up to 1,440 recent readings, while cost and energy totals cover the entire run. Values are illustrative estimates, not measured savings or food-safety guarantees.

The browser model advances one simulated minute per step with a heat-leak coefficient of 0.0015/minute and cooling of 0.28°C/minute, distinct from the original Python demonstration. It uses the same tariff windows, 150 W compressor rating, and controller targets. A latched safety override starts at 8°C and continues cooling to 5°C before releasing. Both smart and conventional models receive the same ambient temperature and door events.

## Problem
Household refrigerators run compressors regardless of electricity tariff windows, wasting money during expensive peak hours.

## Solution
A four-state controller (IDLE → PRE_COOL → PEAK_HOLD → RESUME) that pre-chills the fridge before peak hours and holds temperature safely without the compressor during expensive windows — saving cost while maintaining food safety.

## Features
- Physics-based fridge thermal simulation (heat leak + compressor cooling model)
- KSEB-style peak/off-peak tariff schedule (₹7.50 vs ₹3.50 per kWh)
- Four-state control machine with hardware safety override (never exceeds 8°C)
- MQTT publishing via paho-mqtt to HiveMQ cloud broker
- SQLite time-series storage
- Streamlit dashboard: live temperature, compressor state, savings tracker

## Project Structure
```
iot-refrigeration-system/
├── simulator/fridge_model.py     # Thermal physics simulation
├── controller/state_machine.py   # IDLE→PRE_COOL→PEAK_HOLD→RESUME logic
├── controller/tariff.py          # KSEB tariff schedule
├── mqtt/publisher.py             # MQTT data publisher
├── storage/db.py                 # SQLite storage
├── dashboard/dashboard.py        # Streamlit live dashboard
└── requirements.txt
```

## How to Run
```bash
pip install -r requirements.txt
streamlit run dashboard/dashboard.py
```

## Tech Stack
- Python 3.11, paho-mqtt, Streamlit, SQLite, HiveMQ
