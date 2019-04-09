const Alexa = require("ask-sdk");

const constants = require('./constants.js');
const helpers = require('./helpers.js');
const gamehelpers = require('./gamehelpers.js');
const data = require('./data.js');
const producthandlers = require('./producthandlers.js');
const leaderboard = require('./leaderboard.js');
const games = data.getGames();


module.exports = {
    'LaunchHandler': {
        canHandle(handlerInput) {
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const request = handlerInput.requestEnvelope.request;

            return (
                request.type === 'LaunchRequest' ||
                    (request.type === 'IntentRequest'
                        && request.intent.name === 'AMAZON.NavigateHomeIntent' ||
                        (sessionAttributes['gameState'] === 'stopped' &&
                            request.type === 'IntentRequest' &&
                            request.intent.name === 'GuessIntent')
                    )
            );
        },
        async handle(handlerInput) {

            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const launchCount = sessionAttributes['launchCount'];
            const lastUseTimestamp = sessionAttributes['lastUseTimestamp'];
            const gameState = sessionAttributes['gameState'];
            const game = sessionAttributes['game'] || '';
            const skillUserCount = sessionAttributes['skillUserCount'];

            let say = ``;

            // const joinRank = sessionAttributes['joinRank'];
            const recordCount = await leaderboard.getUserRecordCount();

            const thisTimeStamp = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();
            // console.log('thisTimeStamp: ' + thisTimeStamp);

            const span = helpers.timeDelta(lastUseTimestamp, thisTimeStamp);

            say = helpers.randomArrayElement([`Greetings`, `Hello`,`Hi there`]) + `, `;

            const supportedInterfaces = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);

            // console.log(`supportedInterfaces : ${JSON.stringify(supportedInterfaces, null, 2)}`);

            if (launchCount == 1) {
                say += `new user! `;
                   //  + ` You are the <say-as interpret-as="ordinal">${joinRank}</say-as> user to join!`;
            } else {
                say += `and welcome back! `
                    // + `This is session ${launchCount}, `
                    // + `and it has been ${span.timeSpanDesc}. `
                    // + `Did you know there are ${recordCount-1} other skill users. `
                    // + ` You joined as the <say-as interpret-as="ordinal">${joinRank}</say-as> user. `;
                    + ``;
            }
            const stateList = sessionAttributes['stateList'] || [];

            if(gameState == `playing` && stateList.length > 0){

                say = `You left off in the middle of ${game.name}, Let's resume. `;
                say += `Your state list so far is ${helpers.sayArray(stateList)}.  Say the name of another state.`;
            }  else {
                sessionAttributes['gameState'] = `stopped`;


                say += `This is state games.  Which game would you like to play?  I recommend, coast to coast.`;
                // say = `${JSON.stringify(gameNames)}`;
            }

            const DisplayImg1 = constants.getDisplayImg1();
            const DisplayImg2 = constants.getDisplayImg2();

            // if (helpers.supportsDisplayAPL(handlerInput)) {
            //
            //     const myDocument = require('./apl/main.json');
            //
            //     const eventData = {
            //         "liveData": {
            //             "type": "object",
            //             "textIntent": IntentRequest,
            //             "slots": slotArray,
            //             "textResponse": speechOutput
            //         }
            //     };
            //
            //     handlerInput.responseBuilder.addDirective({
            //         type: 'Alexa.Presentation.APL.RenderDocument',
            //         version: '1.0',
            //         document: myDocument,
            //         datasources: eventData
            //     })
            //
            // }

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt(say)
                // .withStandardCard('State Games', say, DisplayImg1.url)
                .getResponse();

        }
    },

    'ChooseGameHandler': {
        canHandle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            return (
                request.type === 'IntentRequest'
                && (request.intent.name === 'ChooseGameIntent'
                )
            );
        },
        async handle(handlerInput) {
            const responseBuilder = handlerInput.responseBuilder;
            const intent = handlerInput.requestEnvelope.request.intent;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            const AvailableItems = sessionAttributes['AvailableItems'];
            const PurchasedItems = sessionAttributes['PurchasedItems'];

            let gameName = ``;
            let say = ``;

            const gamelist = games.map(a => a.name);

            if  (!intent.slots.gameName || intent.slots.gameName.value === '') {
                say = `sorry, play what game?`;

            } else {
                if (!gamelist.includes(intent.slots.gameName.value.toLowerCase())) {
                    say += `Sorry I don't have a game called ${intent.slots.gameName.value}. you can ask me to play ${helpers.sayArray(gamelist,'or')}`;

                } else {

                    gameName = intent.slots.gameName.value;
                    const game = games.find((a) => a.name === gameName);

                    // say += `You said ${game.name}. You can purchase from ${AvailableItemsList}. `;

                    // ****************** ADD ISP
                    const AvailableItemsList = AvailableItems.map(item => item.name.toLowerCase());

                    if(AvailableItemsList.includes(game.name.toLowerCase())) {
                        say += `${game.name} is a premium game you can purchase. `;

                        // const theProduct = await producthandlers.getProducts(handlerInput, helpers.capitalize(game.name));  // helper function below

                        // say += `${game.intro} `;
                        say += `If you would like to buy it, just say, Buy ${game.name}`;

                    } else {

                        // ******************** ISP

                        const scoring = game.lowScoreBetter ? 'fewer' : 'more';

                        say += `Great, let's review the rules of ${game.name}. `;
                        say += `${game.intro}. The ${scoring} states you can name, the better. `;
                        say += `Tell me your first state. `;

                        let nextStates = gamehelpers.validNextStates([], gameName);

                        let nextStatesHint = helpers.sayArray(helpers.shuffleArray(nextStates).slice(0,3), 'or');

                        say += `you could try ${nextStatesHint} `;

                        // console.log(`game: ${JSON.stringify(game, null, 2)}`);
                        sessionAttributes['game'] = game;

                        // sessionAttributes['gameName'] = gameName;
                        sessionAttributes['gameState'] = 'playing';
                        sessionAttributes['stateList'] = [];

                    }


                }
            }

            return responseBuilder
                .speak(say)
                .reprompt(`Try again. Tell me your first state.  Say hints if you need a hint.`)
                .getResponse();
        }
    },
    'GuessHandler': {
        canHandle(handlerInput) {
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const gameState = sessionAttributes['gameState'];

            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'GuessIntent' && gameState === 'playing';

        },
        async handle(handlerInput) {
            const userId = handlerInput.requestEnvelope.session.user.userId;
            const responseBuilder = handlerInput.responseBuilder;
            const intent = handlerInput.requestEnvelope.request.intent;
            const timestamp = handlerInput.requestEnvelope.request.timestamp;

            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const game = sessionAttributes['game'];
            const gameState = sessionAttributes['gameState'];

            let stateList = sessionAttributes['stateList'] || [];

            let say = ``;

            myState = '';
            if (   !intent.slots.usstate || !intent.slots.usstate.value || intent.slots.usstate.value == ''
            ) {
                say = `sorry, you must say a state`;
            } else {

                myState = intent.slots.usstate.value;
                myState = (myState === 'california' ? 'California' : myState);

                const validCurrentStates = gamehelpers.validNextStates(stateList, game.name);

                if(validCurrentStates.includes(myState)) {

                    // say += `your score is ${stateList.length}`;
                    stateList.push(myState);
                    const validNextStates = gamehelpers.validNextStates(stateList, game.name);

                    if(validNextStates[0] === 'endsWhen') {
                        sessionAttributes['gameState'] = 'stopped';

                        say = `${helpers.randomArrayElement(['Awesome','Well done','Hooray'])}, ${myState} ends the game. `;
                        say += `Your score is ${stateList.length}. `;
                        say += `Would you like to play again? `;

                        await leaderboard.addNewScore(game.name, userId, timestamp, stateList);
                        // sessionAttributes['stateList'] = [];

                        // say += `${leaderboardResult} `;

                    } else {
                        if (validNextStates.length === 0) {

                            sessionAttributes['gameState'] = 'stopped';
                            say = `you cannot advance any further than ${myState}. `;
                            if(game.endsWhen && game.endsWhen.length > 0) {
                                say += `Unfortunately, you didn't reach your target. `;
                            } else {
                                say += `your score is ${stateList.length}. `;
                                const leaderboardResult = await leaderboard.addNewScore(game.name, userId, timestamp, stateList);
                                say += `${leaderboardResult} `;
                            }

                            say += `would you like to play again?`;

                        } else {
                            say = `you said ${myState}, next? `;
                            console.log(`${helpers.sayArray(validNextStates,'or')}`);
                        }
                    }

                    sessionAttributes['stateList'] = stateList;

                } else {

                    say = `${myState} is not valid, `;
                    sessionAttributes['hintCounter'] += 1;


                    if(stateList.length > 0) {
                        say += `try again,  starting from ${stateList[stateList.length-1]}? `;
                    }
                    // say += `hint, try one of these: ${helpers.sayArray(validCurrentStates,'or')}`;
                }

            }
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            return responseBuilder
                .speak(say)
                .reprompt(say)
                .getResponse();
        }
    },

    'YesHandler' : {
        canHandle(handlerInput) {
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
                && sessionAttributes['game'] !== '';
        },
        async handle(handlerInput) {

            let say = `You said yes. `;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            let game = sessionAttributes['game'] || {};

            say += `Let's play ${game.name} again.  What's your first state? `;

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt('Try again. ' + say)
                .getResponse();
        }
    },
    'HelpHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
        },
        async handle(handlerInput) {

            let say = `You asked for help. `;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            let history = sessionAttributes['history'] || [];

            // if (!handlerInput.requestEnvelope.session.new) {
            //     say += `Your last intent was ${history[history.length-2].IntentRequest}. `;
            //     // prepare context-sensitive help messages here
            // }
            say += `You can say stop, or, play coast to coast `;

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt('Try again. ' + say)
                .getResponse();
        }
    },
    'ExitHandler' : {
        canHandle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;

            return (request.type === 'IntentRequest'
                    && (request.intent.name === 'AMAZON.CancelIntent'
                    || request.intent.name === 'AMAZON.StopIntent'
                    || request.intent.name === 'AMAZON.PauseIntent'
                    || request.intent.name === 'AMAZON.NoIntent'
                    )
                ) || request.type === 'SessionEndedRequest';

        },
        async handle(handlerInput) {
            const responseBuilder = handlerInput.responseBuilder;
            const request = handlerInput.requestEnvelope.request;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            let say = `Talk to you later! `;

            if(request.type === 'SessionEndedRequest' || request.intent.name === 'AMAZON.PauseIntent') {
                // skill timed out, or was paused
                // let session attributes remain and be persisted by interceptor
                say = `Bye for now, open the skill again soon to resume. `;

            } else {
                sessionAttributes['gameState'] = 'stopped';

            }

            return responseBuilder
                .speak(say)
                .withShouldEndSession(true)
                .getResponse();
        }
    },
    'SpeakSpeedHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'SpeakSpeedIntent';
        },

        handle(handlerInput) {
            const speakingSpeedChange = handlerInput.requestEnvelope.request.intent.slots.speakingSpeedChange.value;
            let say;

            if(typeof speakingSpeedChange === 'undefined') {
                say = "Sorry, I didn't catch your speak speed.  Say, speak faster, or, speak slower. ";

            } else {

                const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                let newSpeed = helpers.changeProsody('rate',sessionAttributes['speakingSpeed'],speakingSpeedChange);

                sessionAttributes['speakingSpeed'] = newSpeed;
                say = "Okay, I will speak " + speakingSpeedChange + " now!";

                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                // handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);
                // handlerInput.attributesManager.savePersistentAttributes();  // already saving in ResponseInterceptor
            }
            return handlerInput.responseBuilder
                .speak(say)
                .reprompt(say)
                .getResponse();

        }
    }

    // 'UnhandledHandler' : {
    //     canHandle(handlerInput) {
    //         return true;  // will catch AMAZON.FallbackIntent or any other requests
    //     },
    //     handle(handlerInput) {
    //         const request = handlerInput.requestEnvelope.request;
    //         console.log('Unhandled request: ');
    //         console.log(JSON.stringify(request, null, 2));
    //         let IntentRequest = (request.type === 'IntentRequest' ? request.intent.name : request.type);
    //
    //         const outputSpeech = (constants.debug ? `Sorry, I don\'t have a handler for ${IntentRequest}` : `Sorry , I didn\'t understand that. Please try something else.`);
    //
    //         return handlerInput.responseBuilder
    //             .speak(outputSpeech)
    //             .reprompt(outputSpeech)
    //             .getResponse();
    //     }
    // }
};


const collisionOdds = (n, k) => {
    const exponent = (-k * (k - 1)) / (2 * n);
    return 1 - Math.E ** exponent
};

const variations = (length) => {
    return Math.pow(36,length);  // Upper case alphanumeric
};

const lastNuserId = 6;
const userCount = 10000;

const odds = collisionOdds(variations(lastNuserId),userCount) * 100;

const oddsDisplay = Math.floor(odds * 1000) / 1000;

// console.log(`odds of an collision between any 2 of ${userCount} users with ${lastNuserId} digit identifiers: ${oddsDisplay } %`);

