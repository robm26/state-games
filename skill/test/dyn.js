const constants = require('../lambda/custom/constants.js');
const gamehelpers = require('../lambda/custom/gamehelpers.js');

const AWS = constants.AWS;

AWS.config.endpoint = 'http://localhost:8000';

console.log(`testing DynamoDB`);

const st = gamehelpers.getStateName(5);

console.log(`st ${st}`);

getCount();

async function getCount() {
    const uc = await gamehelpers.getUserRecordCount();
    console.log(`uc ${uc}`);
}

