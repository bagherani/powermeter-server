const EventEmitter = require('events').EventEmitter;

class PowerMonitoring extends EventEmitter {

    constructor() {
        super();
        var self = this;
        this.db = require('./database');
        self.float = require('ieee-float');
        self.config = require('../config');
        self.result = {};
        self.result.data = Object.assign([], self.config.powermeters);
        self.result.isSuccess = true;
        self.result.message = "";
        self.isConnected = false;
        self.connectionErrorMsg = `خطا در اتصال به پورت: ${self.config.serial}`;
        var ModbusRTU = require("modbus-serial");
        self.client = new ModbusRTU();
        self.connect();

        // try connect every 7 second.
        setInterval(function () {
            if (!self.isConnected) {
                self.client.close(function () {});

                setTimeout(function () {
                    self.connect();
                }, 2000);
            }
        }, 7000);
    }

    /** connect to port */
    connect() {
        var self = this;
        if (self.isConnected)
            return;
        // try connect
        self.client.connectRTUBuffered(self.config.serial, {
            baudRate: self.config.baudRate,
            parity: self.config.parity,
        }).then((promiseRes) => {
            console.info('Connected to port:' + self.config.serial);
            self.isConnected = true;
            self.emit('connected');
            // begin reading
            self.read(0, 0);
        }).catch((e) => {
            console.error('Error in connecting to port:' + self.config.serial, e);
            self.isConnected = false;
            self.result.isSuccess = false;
            self.result.message = self.connectionErrorMsg;
            self.emit('disconnected');
        });
    }

    /** set the data status to broken */
    setBrokenConnection() {
        var self = this;
        self.isConnected = false;
        self.result.isSuccess = false;
        self.result.message = self.connectionErrorMsg;
        self.emit('disconnected');

    }

    /** read powemeters sequentially */
    read(powerMeterIndex, registerIndex) {
        var self = this;
        if (!self.isConnected)
            return;

        var currentPowermeter = self.config.powermeters[powerMeterIndex];

        self.client.setID(currentPowermeter.id);

        var powermeterData = self.result.data.find((item) => {
            return item.id == currentPowermeter.id;
        })

        let register = powermeterData.registers[registerIndex];
        let isReadRegisterResolved = false;
        let isReadingExpired = false;
        setTimeout(() => {
            register.value = 0;
            // another thread.
            self.client.readHoldingRegisters(register.address, register.length, (err, res) => {

                isReadRegisterResolved = true;

                if (err && err.errno == 'ECONNREFUSED') {
                    self.setBrokenConnection();
                    return;
                }

                if (err) {
                    console.error('Error reading register:', register, "full stack:", err);
                    currentPowermeter.hasError = true;
                    currentPowermeter.message = `خطا در خواندن: ${register.name} محل: ${register.address}`;
                } else {
                    currentPowermeter.hasError = false;
                    self.result.isSuccess = true;
                    register.value = parseFloat((self.float.readFloatBE([res.buffer[2], res.buffer[3], res.buffer[0], res.buffer[1]])).toFixed(2));
                } // end of else

                setTimeout(() => {
                    if (!isReadingExpired) {
                        registerIndex++;
                        if (registerIndex >= powermeterData.registers.length) {
                            registerIndex = 0;
                            powerMeterIndex++;
                            if (powerMeterIndex >= self.config.powermeters.length) {
                                powerMeterIndex = 0;
                                self.emit('readingdone', self.result.data);
                                self.insertIntoDb(self.result.data);
                            }
                        }
                        // self invoke
                        self.read(powerMeterIndex, registerIndex);
                    }
                }, self.config.registerReadingInterval);
            });

        }, 1);

        setTimeout(() => {
            if (isReadRegisterResolved)
                return;
            currentPowermeter.hasError = true;
            currentPowermeter.message = `خطا در خواندن: ${register.name} محل: ${register.address}`;
            isReadingExpired = true;
            setTimeout(() => {
                registerIndex++;
                if (registerIndex >= powermeterData.registers.length) {
                    registerIndex = 0;
                    powerMeterIndex++;
                    if (powerMeterIndex >= self.config.powermeters.length) {
                        powerMeterIndex = 0;
                        self.emit('readingdone', self.result.data);
                        self.insertIntoDb(self.result.data);
                    }
                }
                // self invoke
                self.read(powerMeterIndex, registerIndex);
            }, 1);
        }, 1300)

    }

    insertIntoDb(data) {
        var self = this;
        data.forEach((pm) => {
            var row = {
                _id: Date.now(),
            }
            pm.registers.forEach((register) => {
                row[register.address] = register.value;
            });
            self.db.insert('p' + pm.id, row, null);
        });
    }
}

module.exports = new PowerMonitoring();