const constants = require('./constants.js');
const data = require('./data.js');
const helpers = require('./helpers.js');
const games = data.getGames();

const AWS = constants.AWS;
const DYNAMODB_TABLE_USERS = constants.DYNAMODB_TABLE_USERS;
const DYNAMODB_TABLE_LEADERBOARD = constants.DYNAMODB_TABLE_LEADERBOARD;
const DynamoDbClient = constants.DynamoDbClient;

// const util = require('util');

module.exports = {
    'LeaderboardHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'LeaderboardIntent';
        },
        async handle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            const session = handlerInput.requestEnvelope.session;
            const intent = request.intent;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            let say = ``;
            let gameName = ``;
            let cardText = ``;
            const userId = session.user.userId;

            const gamelist = games.map(a => a.name);

            if  (!intent.slots.gameName || !intent.slots.gameName.value || intent.slots.gameName.value === '') {
                // show default LB

                gameName = sessionAttributes['game'].name || `coast to coast`;

            } else {
                gameName = intent.slots.gameName.value;

            }

            if (!gamelist.includes(gameName)) {
                say = `Sorry I don't have a leader board called ${intent.slots.gameName.value}. you can ask me for ${helpers.sayArray(gamelist,'or')}`;

            } else {
                const game = games.find((a) => a.name === gameName);

                let lb = await module.exports.getLeaderBoard(gameName);

                const thisTimeStamp = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();
                cardText = module.exports.prepareLbCard(lb, thisTimeStamp, userId);


                if(lb && lb.scores && lb.scores.length > 0) {
                    say += `Here is the leaderboard.`;

                } else {
                    say += `This leaderboard is empty. Get the high score by saying, play ${gameName}! `;
                }

            }

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt('Try again. ' + say)
                .withSimpleCard(`Leaderboard for ${gameName}`, cardText)
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

        const gameData = await data.getGames(game)[0]; //

        // console.log(`---> ${JSON.stringify(gameData)}`);

        // console.log(`---> gameData.lowScoreBetter: ${JSON.stringify(gameData.lowScoreBetter)}`);

        let lb = await module.exports.getLeaderBoard(game);

        console.log(`----> lb:\n${JSON.stringify(lb, null, 2)}`);

        let scoreList = [];
        // console.log(`\n*** addNewScore with ts: ${newScore.timestamp}`);

        if(lb && lb.scores && lb.scores.length > 0) {
            resultSummary += `Someone else has played. `;

        } else {
            resultSummary += `You are the first. `;

        }
        let newScoreList = module.exports.mergeIntoLeaderboard(lb.scores, newScore, gameData.lowScoreBetter, timestamp);

        // console.log(`resultSummary: ${resultSummary}`);

        // scoreList.push(newScore);

        const paramsUpdate = {
            TableName: DYNAMODB_TABLE_LEADERBOARD,
            Key:{
                "id": game,
            },
            UpdateExpression: "set scores = :s",
            ExpressionAttributeValues:{
                ":s":newScoreList
            }
        };

        await docClient.update(paramsUpdate, async function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                return 'error';

            } else {

                let lb = await module.exports.getLeaderBoard(gameName);
                // say += ``;

                // const thisTimeStamp = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

                // cardText = module.exports.prepareLbCard(lb, thisTimeStamp, userId);

                return resultSummary;

            }
        }).promise();

    },
    'prepareLeaderboardSpeech' : function(game, lb, user) {


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

        const docClient = new AWS.DynamoDB.DocumentClient();

        const params = {
            Key: { id: game },
            TableName: DYNAMODB_TABLE_LEADERBOARD
        };
        //        ConsistentRead: true
        const rec = await docClient.get(params).promise();

        if(rec && rec.Item) {
            return rec.Item;

        } else {
            //console.log(`no leaderboard found! adding.. `);
            const newLb = await module.exports.addLeaderboard(game);
            return newLb;
        }
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
                console.log(`addLeaderboard Error: ${err}\nparams: ${params}`);
            }
        }).promise();

        return { "id": game, "scores": [] };

    },
    'mergeIntoLeaderboard' : function(scores, newResult, lowScoreBetter, timestamp) {

        scores.push(newResult);

        return scores.sort(function(a,b) {

            if(lowScoreBetter) {
                const c = a;
                a = b;
                b = c;
            }
            return (a.result.length > b.result.length) ? -1 : (b.result.length > a.result.length) ? 1 :
                ( (b.timestamp > a.timestamp) ? -1 : ((a.timestamp > b.timestamp) ? 1 : 0) )

        } );

    },



    'prepareLbCard': function(lb, timestamp, userId) {
        // console.log(`prepareLbCard: ${JSON.stringify(lb)}`);
        const userIdShort = userId.slice(-6);

        let cardText = `Score  User   Date\n`;

        lb.scores.forEach((item, index) => {
            let rank = index+1;

            const timeSince = helpers.timeDelta(item.timestamp * 1000, timestamp).timeSpanDesc;
            const score = (` ` + item.result.length.toString()).slice(-2);  // justify single and double digit scores
            let scoreUserIdShort = item.userId.slice(-6);

            if(userIdShort === scoreUserIdShort) {
                scoreUserIdShort = `*${scoreUserIdShort}*`;
            } else {
                scoreUserIdShort = ` ${scoreUserIdShort} `;
            }

            cardText = `${cardText}\n  ${score}  ${scoreUserIdShort} ${timeSince} ago`;
            cardText = `${cardText}`;
        });
        if(lb.scores.length > 0) {
            const bestStates = lb.scores[0].result.reduce((accumulator, item) => {
                return `${accumulator}\n  ${item}`;
            });
            return  `${cardText}\n\nBest score states:\n  ${bestStates}`;
        } else {
            return  `${cardText}`;
        }


    }
};