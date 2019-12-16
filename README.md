# freifunk-co2-compensator
Calculator service for carbon footprint of Freifunk Rhein Neckar nodes. Demo for Corrently IoT proof of sustainability in complex and dynamic infrastructure environements (CDIEs).

## Purpose of this script
This script is intended to be used on a command line to run a CO2 footprint calculation of Freifunk-Rhein-Neckar active nodes. It is a demonstrator to illustrate usage of Corrently API as a backbone for a sustainability strategy.

## Installation Node JS
```
npm install -g freifunk-co2-compensator
```

## Execute / Run
```
freifunk-co2-compensator
```

## Sample Output
```
Meter Id freifunk_rrnk1576430805760
Current Power Load (kW): 4.523
Total Consumption/Meter Reading (kWh): 30.996
Immutable URL of virtual meter reading: https://api.corrently.io/core/reading?account=0xE4C6a242633148634BD7205D742e6f14B30d95BB
Immutable URL for CO2 comission of virtual meter https://api.corrently.io/core/emission?account=0xE4C6a242633148634BD7205D742e6f14B30d95BB
Total CO2 emission (kg) 9.926
Compensated CO2 (kg) 0
Waiting for Compensation (kg) 10.457
```

The two URLs will be individual per instance (e.q. server, installation or path executed) and will not change. By executing this script via a cron those urls might be used to
show CO2 footprint and compensation.

## Further Reading
- https://corrently.io/  - API used in this demonstration
- https://freifunk-rhein-neckar.de/ - Freifunk Rhein-Neckar homepage
- https://corrently.de/co2.html - CO2 Compensation for power usage (Germany)
- https://gruenstromindex.de/ - GrünstromIndex (GreenPowerIndex) - used in the background for CO2 Calculation of consumed energy
- https://stromdao.de/ - Maintainer of this Script
