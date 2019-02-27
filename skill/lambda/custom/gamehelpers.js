const constants = require('./constants.js');
const helpers = require('./helpers.js');
const data = require('./data.js');
const AWS = constants.AWS;

AWS.config.endpoint = 'http://localhost:8000';

const dataset = data.getData();
const games = data.getGames();


module.exports = {

    'validNextStates':function(stateList, gamename) {
            const game = games.find((a) => a.name === gamename);

            if(game) {
                // console.log(`game: ${JSON.stringify(game)}`);
                // console.log(`\n*** stateList: ${stateList}`);

                let allRulesFirstState = ``;
                let allRules = ``;

                // let allRules = game.rules.reduce(rule => `${rule} && `);

                for (const rule of game.rules) {

                    allRules += `${rule} && `;
                    allRulesFirstState += rule.includes('lastState') ? `` : `${rule} && `;
                    // create separate rules without lastState conditions, which will not exist on the users' first guess

                }


                allRules = allRules.slice(0,-4);
                allRulesFirstState = allRulesFirstState.slice(0,-4);

                // console.log(`*** allRules ${allRules}\n`);

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

                        if(allRulesFirstState === ``) {
                            allRulesFirstState = `state`;
                        }
                        startingStates = startingStates.filter((state) => eval(allRulesFirstState));

                    }

                    return startingStates.map(b => b['Name']);

                } else {
                    // console.log(`stateList.length !== 0`);

                    let lastStateName = stateList[stateList.length - 1];
                    lastStateName = (lastStateName === 'california' ? 'California' : lastStateName);

                    let lastState = dataset.find((a) => a.Name === lastStateName);
                    // console.log(`lastStateName: ${lastStateName}`);

                    let finalStates = [];
                    if(game.endsWhen) {
                        finalStates = dataset.filter((state) => eval(game.endsWhen)).map(a => a.Name);
                    }
                    // console.log(`finalStates : ${finalStates}`);

                    if(finalStates.includes(lastStateName)) { // game ends
                        // console.log(`game over`);
                        // console.log(`endsWhen: ${game.endsWhen}\n${finalStates}`);

                        return ['endsWhen']; // indicates the use has achieved the objective

                    } else {
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
                    // console.log(`lastState: ${lastState}`);

                }

            } else {
                console.log(`game ${gamename} was not found in the catalog`);
            }
    },

    'validStateName': function(state) {
        for (let i = 0; i < dataset.length; i++) {
            if (dataset[i].Name.toLowerCase() == state.toLowerCase()) {
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
    'getBorderIds': function(state) {
        for (let i = 0; i < dataset.length; i++) {
            if (dataset[i].Name == state) {
                if (state == 'Maine') {
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
    'borderingStates': function(state){

        const list = module.exports.getBorderIds(state);

        let array = [];
        for(let i = 0; i< list.length; i++) {
            array.push( module.exports.getStateName(list[i]) );
        }

        console.log('*** bordering ' + state + ' is ' + array.toString() );

        return array;
    },
    'getUserRecordCount': async function() {
        console.log(`in getRecordCount`);
        const params = {
            TableName: constants.DYNAMODB_TABLE, select: "COUNT"
        };
        const docClient = new AWS.DynamoDB.DocumentClient();
        const recordCount = await docClient.scan(params).promise();

        return recordCount.Count; // recordCount.ScannedCount

    }

};
