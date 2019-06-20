const assert = require('assert');
const config = require('../config.json');

test('config exists', () => {
    expect(config).not.toBe(null);
});

test('config has satisfying properties', () => {
    var expectedProperties = ['registerReadingInterval', 'serverPath', 'serverPort', 'socketPort', 'baudRate', 'parity', 'serial', 'powermeters', 'monthToKeepData'];

    expectedProperties.forEach(key => {
        expect(config[key]).not.toBe(undefined);
    });

});

test('config has powermeters', () => {
    expect(Array.isArray(config.powermeters)).toBe(true);
});

test('config powermeters have satisfying properties', () => {
    var powermeterProperties = ['hasError', 'message', 'name', 'id', 'show', 'registers', 'order'];

    config.powermeters.forEach(p => {
        powermeterProperties.forEach((key, idx) => {
            assert(p[key] != undefined, `powermeter ${p.id} has no ${key}`)
        });
    });
});

test('config powermeters have registers', () => {
    expect(Array.isArray(config.powermeters[0].registers)).toBe(true);
});


test('config powermeter registers have satisfying properties', () => {
    var registerProperties = ['name', 'address', 'length', 'value', 'max', 'min', 'width', 'show', 'order'];

    config.powermeters.forEach(p => {
        p.registers.forEach(reg => {
            registerProperties.forEach((key, idx) => {
                assert(reg[key] != undefined, `powermeter ${p.id} -> register ${reg.address} has no ${key}`)
            })
        })
    });
});

test('registers have correct `show` attribute', () => {
    config.powermeters.forEach(p => {
        p.registers.forEach(reg => {
            assert('number;chart;none'.indexOf(reg.show) > -1, `powermeter ${p.id} -> register ${reg.address} has show='${reg.show}' which is invalid`)
        })
    });
});