const fahrenheitToCelsius = (temp) => {
    return (temp - 32) / 1.8
}

const celsiusToFahrenheit = (temp) => {
    return (temp * 1.8) + 32
}

const add = (firstNum, secNum) => {
    return new Promise((resolve, reject) => {
        // noinspection MagicNumberJS,FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
        setTimeout(() => {
            if (firstNum < 0 || secNum < 0) {
                return reject('number cannot be negative.');
            }
            resolve(firstNum + secNum);
        }, 2000);
    });
}

module.exports = {
    fahrenheitToCelsius,
    celsiusToFahrenheit,
    add,
}
