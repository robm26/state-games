
const constants = require('./constants.js');
const helpers = require('./helpers.js');
const gamehelpers = require('./gamehelpers.js');
const producthandlers = require('./producthandlers.js');
const leaderboard = require('./leaderboard.js');

const AWS = constants.AWS;
AWS.config.region = process.env.AWS_REGION || 'us-east-1';

// const postData =  JSON.parse(event.body).data;

module.exports = {
    'AplInterceptor':{
        process: function (handlerInput, responseOutput) {

            return new Promise(async (resolve, reject) => {

                if (helpers.supportsDisplayAPL(handlerInput)) {
                    const myDocument = require('./apl/main.json');

                    const request = handlerInput.requestEnvelope.request;
                    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                    let img = '';
                    let title = 'Welcome to State Games!';

                    let title1 = "";
                    let array1 = [];

                    let title2 = "";
                    let array2 = [];

                    if (request.type === 'LaunchRequest') {
                        img = 'https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/gaming/state_games_1200_800._TTH_.png';
                        title1 = 'Launch Count';
                        array1 = [sessionAttributes['launchCount']];

                        const thisTimeStamp = new Date(request.timestamp).getTime();
                        const lastUseTimestamp = sessionAttributes['lastUseTimestamp'];
                        const span = helpers.timeDelta(lastUseTimestamp, thisTimeStamp);

                        if(sessionAttributes['launchCount'] > 1) {
                            title2 = 'Last Visit';
                            array2 = [`${span.timeSpanDesc} ago`];
                        }

                    } else {
                        title = 'State Games';
                        img = 'https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/gaming/usa._TTH_.png';
                    }

                    if (sessionAttributes['gameState'] === 'playing') {

                        title = `Playing: ${helpers.capitalize(sessionAttributes['game'].name)}`;
                        title1 = 'Path';
                        array1 = sessionAttributes['stateList'].map((item, index) => { return `${index + 1}. ${item}`});

                        title2 = 'Hints';
                        array2 = sessionAttributes['validNextStates'];

                    }


                    if (request.type === 'IntentRequest' && request.intent.name === 'ShoppingIntent')
                    {
                        title = `Shopping Status`;

                        title1 = 'Own';
                        array1 = sessionAttributes['PurchasedItems'].map((item) => { return ` ${item.name}`});

                        title2 = 'Available';
                        array2 = sessionAttributes['AvailableItems'].map((item) => { return ` ${item.name}`});

                    }

                    if (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent')
                    {
                        title = `HELP`;

                        title1 = 'UserID';
                        array1 = [handlerInput.requestEnvelope.session.user.userId.slice(-6)];

                        title2 = 'Options';
                        array2 = ['play coast to coast', 'stop', 'leaderboard'];


                    }

                    if (request.type === 'IntentRequest' && request.intent.name === 'LeaderboardIntent'
                    ) {

                        let gameName = ``;
                        let intent = request.intent;
                        if  (!intent.slots.gameName || !intent.slots.gameName.value || intent.slots.gameName.value === '') {

                            gameName = sessionAttributes['game'].name || `coast to coast`;

                        } else {
                            gameName = request.intent.slots.gameName.value;

                        }

                        let lb = await leaderboard.getLeaderBoard(gameName);

                        title = `Leaderboard for ${gameName}`;

                        title1 = 'Score : User';

                        array1 = lb.scores.slice(0,5).map((item) => {
                            let userId = item.userId.slice(-6);

                            if(handlerInput.requestEnvelope.session.user.userId.slice(-6) === userId) {

                                userId = `<u>${userId}</u>`;
                            }

                            return `${item.result.length} : ${userId} `;
                        });

                        title2 = `Best Path`;
                        array2 = lb.scores[0].result;

                    }


                    const eventData = {
                        "liveData": {
                            "type": "object",
                            "title":title,
                            "img": img,

                            "statsTitle1": `<u>${title1}</u>`,
                            "statsArray1": array1.map((item) =>  { return {
                                    "type": "Text",
                                    "text": `${item}`,
                                    "style": "statsText1"
                                }
                            } ),

                            "statsTitle2": `<u>${title2}</u>`,
                            "statsArray2": array2.map((item) =>  { return {
                                    "type": "Text",
                                    "text": `${item}`,
                                    "style": "statsText2"
                                }
                            } ),

                        }
                    };


                    handlerInput.responseBuilder.addDirective({
                        type: 'Alexa.Presentation.APL.RenderDocument',
                        version: '1.0',
                        document: myDocument,
                        datasources: eventData
                    })

                }
                resolve();
            });

        }
    }

}

