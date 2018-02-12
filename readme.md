# HiveAlive

|<img src="assets/logo.png" style="width:70%">|<h2>Open Source monitoring and data analytics for bee keepers and agricultural research</h2>|
|-|-|


## Contents
- **assets**: Images, PPTX and other stuff that isn't code
- **device**: Device client for collecting sensor data and sending to Azure
- **azure/templates**: Templates to deploy HiveAlive to Azure
- **azure/functions**: Azure Functions serverless code for message processing and API
- **site**: Node.js Express web site and portal

## Device Setup on Raspberry Pi
This guide assumes you are running Raspbian Stretch Lite
https://www.raspberrypi.org/downloads/raspbian/

First time fresh setup:  

Run `raspi-config`
- Enable Wifi
- Enable SSH
- Enable I2C

Update APT
```
sudo apt-get update
sudo apt-get dist-upgrade
```
Then reboot 

### Install Node.js
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install ffpmeg
```
sudo apt install -y ffmpeg
```

### Install BME680 Python library 
```
sudo apt install -y i2c-tools python-pip python-smbus
sudo pip2 install bme680
```