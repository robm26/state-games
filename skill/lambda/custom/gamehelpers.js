const constants = require('./constants.js');
const helpers = require('./helpers.js');
const data = require('./data.js');
const AWS = constants.AWS;

const dataset = data.getData();
const games = data.getGames();


module.exports = {

    'validNextStates':function(stateList, gamename) {
            const game = games.find((a) => a.name === gamename);

            if(game) {
                // console.log(`game: ${JSON.stringify(game)}`);
                // console.log(`stateList: ${stateList}`);


                let allRulesFirstState = ``;
                let allRules = ``;

                // let allRules = game.rules.reduce(rule => `${rule} && `);

                for (const rule of game.rules) {

                    allRules += `${rule} && `;
                    allRulesFirstState += rule.includes('lastState') ? `` : `${rule} && `;
                    // console.log(`rule.includes:  ${rule.includes('lastState')}`);
                    // allRulesFirstState +=  `${rule} && `;
                }
                allRules = allRules.slice(0,-4);
                allRulesFirstState = allRulesFirstState.slice(0,-4);


                if (stateList.length === 0) {
                    // console.log(`stateList.length === 0\nallRulesFirstState: ${allRulesFirstState}`);

                    // console.log(`startsOn: ${game.startsOn}`);
                    // console.log(`endsWhen: ${game.endsWhen}`);

                    // return dataset.filter((state) => state.Ocean === 'Atlantic').map(b => b['Name']); // for example
                    // dynamic evaluation of game rules!  eval()
                    let startingStates = dataset;
                    if(game.startsOn) {
                        startingStates = dataset.filter((state) => eval(game.startsOn));
                        // return dataset.filter((state) => eval(game.startsOn)).map(b => b['Name']);
                    }
                    if(game.rules.length > 0) {
                        startingStates = startingStates.filter((state) => eval(allRulesFirstState));
                    }

                    return startingStates.map(b => b['Name']);

                } else {
                    // console.log(`stateList.length !== 0`);

                    let lastStateName = stateList[stateList.length - 1];
                    let lastState = dataset.find((a) => a.Name === lastStateName);

                    let finalStates = [];
                    if(game.endsWhen) {
                        finalStates = dataset.filter((state) => eval(game.endsWhen)).map(a => a.Name);
                    }
                    // console.log(`finalStates : ${finalStates}`);

                    if(finalStates.includes(lastStateName)) { // game ends
                        console.log(`game over`);
                        console.log(`endsWhen: ${game.endsWhen}\n${finalStates}`);

                        return ['endsWhen']; // indicates the use has achieved the objective
                    }

                    let csBorders = lastState.Borders.split(',').map(b => parseInt(b));

                    borderingStates = dataset.filter((state) => {
                        let thisStateStatus = false;
                        if(game.rules.length === 0) {
                            thisStateStatus = csBorders.includes(state.Id);
                        } else {
                            thisStateStatus = csBorders.includes(state.Id) && (eval(allRules));
                        }
                        // return csBorders.includes(state.Id) && state.Population > lastState.Population;
                        return thisStateStatus;

                    } ).map(a => a.Name).diff(stateList);

                    return borderingStates;

                }

            } else {
                console.log(`game ${gamename} was not found in the catalog`);
            }
    },

    'validStateName': function(usstate) {
        for (let i = 0; i < dataset.length; i++) {
            if (dataset[i].Name.toLowerCase() == usstate.toLowerCase()) {
                return true;
            }
        }
        return false; // not found
    },
    'getStateName': function(Id) {
        for (let i = 0; i < dataset.length; i++) {
            if (dataset[i].Id == Id) {

                return dataset[i].Name;
            }
        }
        return '';
    },
    'getBorderIds': function(usstate) {
        for (let i = 0; i < dataset.length; i++) {
            if (dataset[i].Name == usstate) {
                if (usstate == 'Maine') {
                    let myArray = [];
                    myArray.push(parseInt(dataset[i].Borders));
                    return myArray;
                } else {
                    return dataset[i].Borders.split(",").map(Number);
                }
            }
        }
        return [];
    },
    'borderingStates': function(usstate){

        const list = module.exports.getBorderIds(usstate);

        let array = [];
        for(let i = 0; i< list.length; i++) {
            array.push( module.exports.getStateName(list[i]) );
        }

        console.log('*** bordering ' + usstate + ' is ' + array.toString() );

        return array;
    },
    'allowedNextStates': function(stateList, gamename)  {


        let currentState = stateList[stateList.length - 1];
        if (currentState == 'Hawaii' || currentState == 'Alaska') {
            return [];
        }


        if (gamename == 'coast to coast') {

            if (module.exports.ocean(currentState) == 'Pacific') {
                return []; // game finished
            } else {

                return module.exports.borderingStates(currentState).diff(stateList);
            }
        } else if (gamename == 'bigger pop') {

            let possibleStates = module.exports.borderingStates(currentState).diff(stateList);
            // console.log('possibleStates ' + possibleStates);

            for (let i = 0; i < possibleStates.length; i++) {
                // console.log('##### ' + i + ' of ' + possibleStates.length);
                // console.log(' one possible state is ' + possibleStates[i]);
                if(module.exports.biggerPop(currentState, possibleStates[i])) {
                    // console.log('splicing out state ' + i + ' ' + possibleStates[i]);

                    possibleStates.splice(i,1); // remove array element
                    i--;
                } else {
                    // console.log('keeping state ' + possibleStates[i] + ' which is not bigger than ' + currentState);
                }
            }
            return possibleStates;
        }
    },
    'ocean': function(usstate) {
        for (var i = 0; i < dataset.length; i++) {
            if (dataset[i].Name == usstate) {

                return dataset[i].Ocean;
            }
        }
        return '';
    },
    'biggerPop': function(state1, state2) {
        var pop1 = 0;
        var pop2 = 0;

        for (var i = 0; i < dataset.length; i++) {
            if (dataset[i].Name == state1) {
                pop1 = dataset[i].Population;
            }
            if (dataset[i].Name == state2) {
                pop2 = dataset[i].Population;
            }
        }
        return (pop1 > pop2);
    }


};
