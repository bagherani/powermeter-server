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


```
etcher > 2017-09-07-raspbian-stretch.zip
git clone pm-monitoring
-- remove usb and it's code
sudo npm i --unsafe-perm
npm i -g pm2

change config to 192.168.1.1000
pm2 start chromluncher.js

pm2 startup systemd  

sudo env PATH=$PATH:/home/pi/.config/versions/node/v11.11.0/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi

pm2 save

run an app that runs chromium-browser --kiosk localhost:3000
```
