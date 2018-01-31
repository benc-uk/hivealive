#!/usr/bin/env python
import bme680
import time
import sys
import smbus
i2c = smbus.SMBus()

sensor = bme680.BME680()

# These oversampling settings can be tweaked to
# change the balance between accuracy and noise in
# the data.

sensor.set_humidity_oversample(bme680.OS_2X)
sensor.set_pressure_oversample(bme680.OS_4X)
sensor.set_temperature_oversample(bme680.OS_8X)
sensor.set_filter(bme680.FILTER_SIZE_3)
sensor.set_gas_status(bme680.ENABLE_GAS_MEAS)

sensor.set_gas_heater_temperature(320)
sensor.set_gas_heater_duration(150)
sensor.select_gas_heater_profile(0)
start_time = time.time()
curr_time = time.time()
burn_in_time = int(sys.argv[1])

burn_in_data = []

# Check params
if(len(sys.argv) < 2):
   print "Pass the burn in time (seconds) as argument"
   exit()

try:
    while curr_time - start_time < burn_in_time:
        curr_time = time.time()
        if sensor.get_sensor_data() and sensor.data.heat_stable:
            gas = sensor.data.gas_resistance
            burn_in_data.append(gas)
            time.sleep(0.5)
except:
    pass

if sensor.get_sensor_data() and sensor.data.heat_stable:
   output = "{0:.3f},{1:.3f},{2:.3f},{3:.3f}".format(sensor.data.temperature, sensor.data.pressure, sensor.data.humidity, sensor.data.gas_resistance)
   print(output)