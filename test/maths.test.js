const {fahrenheitToCelsius, celsiusToFahrenheit , add} = require('../src/maths');

test('should convert 32F to 0C', () => {
    const celsiusValue = fahrenheitToCelsius(32);
    expect(celsiusValue).toBe(0);
});

test('should convert 0C to 32F',()=>{
    const fahrenheitValue= celsiusToFahrenheit(0);
    expect(fahrenheitValue).toBe(32);
});

test();
