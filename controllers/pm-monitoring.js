const EventEmitter = require('events').EventEmitter;
const Database = require('./database');
const config = require('../config.json');
const ModbusRTU = require("modbus-serial");
const schedule = require('node-schedule');
const moment = require('moment');

class PowerMonitoring extends EventEmitter {

    constructor() {
        super();
        this.result = {
            data: [/* config.powermeters */],
            isSuccess: true,
            message: ''
        };
        this.isConnected = false;
        this.result.data = Object.assign([], config.powermeters);
        this.connectionErrorMsg = `Error in connecting to port ${config.serial}`;
        this.client = new ModbusRTU();
        this.connectToPort();

        // try connect every 7 second.
        setInterval(() => {
            if (!this.isConnected) {
                setTimeout(() => {
                    this.connectToPort();
                }, 2000);
            }
        }, 7000);

        schedule.scheduleJob({ hour: 23, minute: 30, dayOfWeek: 0 }, function () {
            config.powermeters.forEach(pm => {
                Database.delete(`p${pm.id}`, moment().subtract(config.monthToKeepData, 'M').valueOf())
            })
        });
    }

    /** connect to port */
    connectToPort() {
        if (this.isConnected)
            return;

        // try connect
        this.client.connectRTUBuffered(config.serial, {
            baudRate: config.baudRate,
            parity: config.parity,
        }).then((promiseRes) => {
            console.info('Connected to port:' + config.serial);
            this.isConnected = true;
            this.emit('connected');
            // begin reading
            this.read(0, 0);
        }).catch((e) => {
            console.error(`Error in connecting to port ${config.serial}`, e);
            this.isConnected = false;
            this.result.isSuccess = false;
            this.result.message = this.connectionErrorMsg;
            this.emit('disconnected');
        });
    }

    /** set the data status to broken */
    setBrokenConnection() {
        this.isConnected = false;
        this.result.isSuccess = false;
        this.result.message = this.connectionErrorMsg;
        this.emit('disconnected');

    }

    /** read powemeters sequentially */
    read(powerMeterIndex, registerIndex) {
        if (!this.isConnected)
            return;

        var currentPowermeter = config.powermeters[powerMeterIndex];

        this.client.setID(currentPowermeter.id);

        var powermeterData = this.result.data.find((item) => {
            return item.id == currentPowermeter.id;
        })

        let register = powermeterData.registers[registerIndex];
        let isReadRegisterResolved = false;
        let isReadingExpired = false;

        setTimeout(() => {
            register.value = 0;
            // another thread.
            this.client.readHoldingRegisters(register.address, register.length, (err, res) => {

                isReadRegisterResolved = true;

                if (err && err.errno == 'ECONNREFUSED') {
                    this.setBrokenConnection();
                    return;
                }

                if (err) {
                    currentPowermeter.hasError = true;
                    currentPowermeter.message = `Error reading register: ${register.name} address: ${register.address}`;
                } else {
                    currentPowermeter.hasError = false;
                    this.result.isSuccess = true;
                    register.value = Buffer(res.buffer, 'hex').readFloatBE(0).toFixed(2);
                } // end of else

                setTimeout(() => {
                    if (!isReadingExpired) {
                        registerIndex++;
                        if (registerIndex >= powermeterData.registers.length) {
                            registerIndex = 0;
                            powerMeterIndex++;
                            if (powerMeterIndex >= config.powermeters.length) {
                                powerMeterIndex = 0;
                                this.emit('readingdone', this.result.data);
                                this.insertIntoDb(this.result.data);
                            }
                        }
                        // read next registers
                        this.read(powerMeterIndex, registerIndex);
                    }
                }, config.registerReadingInterval);
            });

        }, 1);

        setTimeout(() => {
            if (isReadRegisterResolved)
                return;
            currentPowermeter.hasError = true;
            currentPowermeter.message = `Error reading register: ${register.name} address: ${register.address}`;
            isReadingExpired = true;

            setTimeout(() => {
                registerIndex++;
                if (registerIndex >= powermeterData.registers.length) {
                    registerIndex = 0;
                    powerMeterIndex++;
                    if (powerMeterIndex >= config.powermeters.length) {
                        powerMeterIndex = 0;
                        this.emit('readingdone', this.result.data);
                        this.insertIntoDb(this.result.data);
                    }
                }
                // read next registers
                this.read(powerMeterIndex, registerIndex);
            }, 100);
        }, 2000)

    }

    /**
     * 
     * @param {[]} data 
     */
    insertIntoDb(data) {
        data.forEach((pm) => {
            var row = {};
            pm.registers.forEach((register) => {
                row[register.name] = register.value;
            });

            Database.insert(`p${pm.id}`, row);
        });
    }
}

module.exports = new PowerMonitoring();