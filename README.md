# powermeter-server
powermeter server
```
--unsafe-perm --build-from-source
```
sudo npm start // sudo is important, otherwise serial port get error

npm i mongodb@2.3.33

/dev/ttyUSB0

https://www.aggsoft.com/serial-data-logger/tutorials/modbus-data-logging/schneider-electric-em6400ng-pm2100-pm2200.htm

goto src.
sudo su
pm2 start bin/www.js
pm2 startup
pm2 save

goto src.
pm2 start start.js
pm2 startup
pm2 save

