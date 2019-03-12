const constants = require('./constants.js');
const data = require('./data.js');
const helpers = require('./helpers.js');
const games = data.getGames();

const AWS = constants.AWS;
const DYNAMODB_TABLE_USERS = constants.DYNAMODB_TABLE_USERS;
const DYNAMODB_TABLE_LEADERBOARD = constants.DYNAMODB_TABLE_LEADERBOARD;

// const util = require('util');

module.exports = {
    'LeaderboardHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'LeaderboardIntent';
        },
        async handle(handlerInput) {
            let intent = handlerInput.requestEnvelope.request.intent;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            let say = ``;
            let gameName = ``;

            const gamelist = games.map(a => a.name);

            if  (!intent.slots.gameName || !intent.slots.gameName.value || intent.slots.gameName.value === '') {
                // show default LB

                gameName = sessionAttributes['game'].name || `coast to coast`;
                // game = `coast to coast`;

            } else {
                gameName = intent.slots.gameName.value;

            }

            if (!gamelist.includes(gameName)) {
                say = `Sorry I don't have a leader board called ${intent.slots.gameName.value}. you can ask me for ${helpers.sayArray(gamelist,'or')}`;

            } else {
                const game = games.find((a) => a.name === gameName);

                let lb = await module.exports.getLeaderBoard(gameName);
                if(lb && lb.scores && lb.scores.length > 0) {
                    say += `Here is the leaderboard.`;
                    // console.log(`lb: ${JSON.stringify(lb, null, 2)}`);

                } else {
                    say += `This leaderboard is empty. Get the high score by saying, play ${gameName}! `;
                }

            }

            // const userRecordCount = await module.exports.getUserRecordCount();
            // say += `There are now ${userRecordCount} skill users. `;

            // say += `lb: ${lb}`;
            // say += `The available games are, ${helpers.sayArray(lb)}. `;
            // say += `Here is the leader board for ${lb[0]}. `;

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt('Try again. ' + say)
                .getResponse();
        }
    },
    'addNewScore': async function(game, userId, timestamp, result) {
        let resultSummary = ``;
        let newScore = {
            "userId": userId,
            "timestamp": Math.floor(new Date(timestamp).getTime() / 1000),  // unix Int format
            "result":result
        };

        const docClient = new AWS.DynamoDB.DocumentClient();
        console.log(`Leaderboard is adding your score for game ${game}!`);
        // console.log(`game: ${JSON.stringify(game)} \nresult: ${result}`);
        // const recordCount = await docClient.scan(params).promise();

        // return recordCount.Count; // recordCount.ScannedCount
        const gameData = await data.getGames(game)[0];
        // console.log(`---> ${JSON.stringify(gameData)}`);
        // console.log(`---> gameData.lowScoreBetter: ${JSON.stringify(gameData.lowScoreBetter)}`);

        let lb = await module.exports.getLeaderBoard(game);
        // console.log(`----> lb:\n${JSON.stringify(lb, null, 2)}`);
        let scoreList = [];

        if(lb && lb.scores && lb.scores.length > 0) {
            resultSummary += `Someone else has played. `;
            scoreList = lb.scores;

        } else {
            resultSummary += `You are the first. `;

        }
        scoreList.push(newScore);

        // console.log(`=== scoreList[] : ${scoreList}`);

        const paramsUpdate = {
            TableName: DYNAMODB_TABLE_LEADERBOARD,
            Key:{
                "id": game,
            },
            UpdateExpression: "set scores = :s",
            ExpressionAttributeValues:{
                ":s":scoreList
            }
        };

        await docClient.update(paramsUpdate, function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));

            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));

            }
        });

    return resultSummary;

    },
    'getUserRecordCount': async function() {

        const params = {
            TableName: DYNAMODB_TABLE_USERS, select: "COUNT"
        };
        const docClient = new AWS.DynamoDB.DocumentClient();
        const recordCount = await docClient.scan(params).promise();

        return recordCount.Count; // recordCount.ScannedCount

    },

    'getLeaderBoard': async function(game) {
        console.log(`you called getLeaderBoard(${game})`);
        // console.log(`The games you can play are ${JSON.stringify(games, null, 2)}`);
        // const gameNames = games.map((item) => item.name);

        const docClient = new AWS.DynamoDB.DocumentClient();

        const params = {
            Key: { id: game },
            TableName: DYNAMODB_TABLE_LEADERBOARD
        };
        //        ConsistentRead: true
        const rec = await docClient.get(params).promise();
        if(rec && rec.Item) {
            // console.log(`---> gameLb \n${game} : \n${JSON.stringify(rec.Item, null, 2)}\n]]]`);

        } else {
            // console.log(`no record found! adding.. `);
            await module.exports.addLeaderboard(game);
        }

        return rec.Item || { "id": game, "scores": [] };
    },

    'addLeaderboard': async function(game) {
        const params = {
            TableName: DYNAMODB_TABLE_LEADERBOARD,
            Item: {
                id: game,
                scores: []
            }
        };
        const docClient = new AWS.DynamoDB.DocumentClient();
        await docClient.put(params, (err, data) => {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);

            }
        });


    }
};