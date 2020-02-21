/*const fs = require("fs");

let dots = ''
process.stdout.write(`Loading `)

let tmrID = setInterval(() => {
    dots += '.'
    process.stdout.write(`\rLoading ${dots}`)
}, 1000)

setTimeout(() => {
    clearInterval(tmrID)
    console.log(`\rLoaded in [3500 ms]`)
}, 3500)*/

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', line => {
    console.log(line);
});

setInterval(() => console.log(1), 1000);