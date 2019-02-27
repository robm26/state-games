
const constants     = require('./constants.js');
const handlers      = require('./handlers.js');
const helpers       = require('./helpers.js');

const gamehelpers = require('./gamehelpers.js');

const data      = require('./data.js');
const games = data.getGames();

// console.log(JSON.stringify(data.getData(), null, 2));
const statusEveryN  =    5 * 1000 * 1000;
const maxIterations = 2500 * 1000 * 1000;

console.log(`========> starting simulate.js`);

const gameName = `coast to coast`;
const game = games.find((a) => a.name === gameName);
// console.log(`game.lowScoreBetter: ${game.lowScoreBetter}`);
const dataset = data.getData();

if(game.startsOn) {
    startingStates = dataset.filter((state) => eval(game.startsOn));
    // return dataset.filter((state) => eval(game.startsOn)).map(b => b['Name']);
}

console.log(`\ngame.name: ${gameName}`);
// console.log(`game: ${JSON.stringify(game, null, 2)}`);

let loopCount = 0;
let successCount = 0;

let bestScore = 0;
let bestPath = [];

// while(i < 10) {
//     i += 1;
//     console.log(i);
//     const ns = gamehelpers.validNextStates([], gameName);
// }
// console.time("simulate");
let start = process.hrtime();

const SL = [];
getNextStates(SL, gameName);

function getNextStates(stateList, gameName) {
    loopCount += 1;
    if(loopCount % statusEveryN === 0) {
        console.log(`running test ${loopCount}`);
    }

    const nextStates = gamehelpers.validNextStates(stateList, gameName);

    if (nextStates[0] === 'endsWhen') {
        successCount += 1;
        if(bestScore === 0) {
            bestScore = stateList.length;
        } else {
            if(stateList.length < bestScore) {
                bestScore = stateList.length;
                bestPath = Array.from(stateList);
                console.log(`##### new best score of ${bestScore}: ${bestPath}`);
            }
        }
        // console.log(`${loopCount} success path! ${stateList.length} : ${stateList}`);
    } else {
        // console.log(`i: ${i} ${stateList}`);

        nextStates.forEach((state) => {
            // console.log(`startingStates: ${startingStates}`);
            if(startingStates.map((st)=>st.Name).includes(state) && stateList.length > 0) {
                // console.log(`############ ${loopCount} ${state} : ${stateList}`);
            } else {
                let newList = Array.from(stateList);
                newList.push(state);
                // console.log(`state : ${state} \n newList: ${newList}`);
                if(loopCount < maxIterations) {
                    getNextStates(newList, gameName);
                }
            }

        });

    }
    // console.log(`nextStates: ${nextStates}`);

}
// console.timeEnd("simulate");
elapsed_time('simulation');
console.log(`\n----------------------\nRan ${loopCount} tests, found ${successCount} solutions.`);
console.log(`The best solution is ${bestScore} steps!\n${bestPath}\n`);


function elapsed_time(note){
    const precision = 1; // 3 decimal places
    const elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(process.hrtime(start)[0] + " seconds for " + note); // print message + time
    start = process.hrtime(); // reset the timer
}

// const game = games.find((a) => a.name === gameName);
//
// const scoring = game.lowScoreBetter === 'true' ? 'fewer' : 'more';
//
// say = `Great, let's review the rules of ${game.name}. `;
// say += `${game.intro}. The ${scoring} states you can name, the better. `;
// say += `Tell me your first state. `;
//
// let nextStates = gamehelpers.validNextStates([], gameName);
//
// nextStates.forEach((state) => {
//     console.log(`state for: ${state}`);
// });
// let nextStatesHint = helpers.sayArray(helpers.shuffleArray(nextStates).slice(0,3), 'or');
// say += `you could try ${nextStatesHint} `;

// console.log(`say: ${say}`);

// console.log(`game: ${JSON.stringify(game, null, 2)}`);


// getNextStates([], gameName);

// const ns = gamehelpers.validNextStates([], gameName);
// // console.log(`ns: ${ns}`);
//
// ns.forEach((state) => {
//
//    const SL = [];
//    SL.push(state);
//    console.log(`  ${JSON.stringify(SL)}`);
//    const ns2 = gamehelpers.validNextStates(SL, gameName);
//
//    console.log(`ns2: ${ns2}`);
//
// });
// getNextStates([], gameName);

// function getNextStates(stateList, gameName) {


// console.log(`loopCount: ${loopCount}`);
// const SL = ['Florida','Georgia'];
// console.log(`starting SL: ${SL}`);
//
// const ns = gamehelpers.validNextStates(SL, gameName);
// console.log(`ns: ${JSON.stringify(ns)}`);
// ns.forEach((state) => {
//     console.log(JSON.stringify(state));
//     loopCount += 1;
//     const SL2 = Array.from(SL);
//     SL2.push(state);
//
//     console.log(`SL2 : ${JSON.stringify(SL2)}`);
//
//     const newSL = SL;
//     // console.log(`${loopCount} : ${newSL.push(state)} : state: ${state}`);
//
//     // const newSL = SL.push(state);
//     // console.log(`newSL ${typeof newSL}`);
//
// });

// ns.forEach((state) => {
//     loopCount += 1;
//     console.log(`${loopCount} state: ${state}`);
//     SL.push(state);
//
//     console.log(` SL:  ${SL}`);
//
//     // const SL = stateList;
//     // SL.push(state);
//     //
//     // console.log(`  ${JSON.stringify(SL)}`);
// });

// }


