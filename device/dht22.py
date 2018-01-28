import Adafruit_DHT
import sys

# Check params
if(len(sys.argv) < 2):
   print "Pass the GPIO number as argument"
   exit()

# read data from DHT
humid, temp = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, sys.argv[1])

# Output for easy scraping
print "%s,%s" % (humid, temp)
