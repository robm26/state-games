
const constants = require('./constants.js');
const helpers = require('./helpers.js');
const producthandlers = require('./producthandlers.js');
const leaderboard = require('./leaderboard.js');

const AWS = constants.AWS;
AWS.config.region = process.env.AWS_REGION || 'us-east-1';

// const postData =  JSON.parse(event.body).data;

module.exports = {
    'RequestLogInterceptor': {
        process(handlerInput) {
            console.log(` ~~~~~~~~~~~~~~~~~~~~~~~~~~ request: \n`);
            console.log(handlerInput.requestEnvelope.request);
        }
    },

    'RequestPersistenceInterceptorOrig': {
        process(handlerInput) {
            if(!handlerInput.requestEnvelope.session) {
                handlerInput.requestEnvelope['session'] = {"new": true};  // for Skill Events
            }

            if(handlerInput.requestEnvelope.session['new']) {

                return new Promise((resolve, reject) => {

                    handlerInput.attributesManager.getPersistentAttributes()

                        .then((sessionAttributes) => {
                            sessionAttributes = sessionAttributes || {};

                            // console.log(`in RequestPersistenceInterceptor! `);

                            // console.log(JSON.stringify(sessionAttributes, null, 2));

                            if(Object.keys(sessionAttributes).length === 0) {
                                console.log('--- First Ever Visit for userId ' + handlerInput.requestEnvelope.session.user.userId);

                                const initialAttributes = constants.getMemoryAttributes();
                                // console.log(`constants.getMemoryAttributes()\n${JSON.stringify(initialAttributes, null, 2)}`);

                                // Object.keys(initialAttributes).forEach(function(key) {
                                //     sessionAttributes[key] = initialAttributes[key];
                                // });

                                sessionAttributes = initialAttributes;


                            } else {
                                console.log(`--- Return visit`);
                            }
                            sessionAttributes['launchCount'] += 1;
                            // sessionAttributes['gameState'] = 'pc';

                            console.log(`about to save sessionAttributes: ${JSON.stringify(sessionAttributes, null, 2)}`);
                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                            // resolve();

                            handlerInput.attributesManager.savePersistentAttributes()
                                .then(() => {
                                    resolve();
                                })
                                .catch((err) => {
                                    reject(err);
                                });

                        })
                        .catch((error) => {
                            console.log(`requires DynamoDB table`);
                            reject(error);
                        });

                });

            } // end session['new']


        }
    },
    'RequestPersistenceInterceptor': {
        process(handlerInput) {
            if(!handlerInput.requestEnvelope.session) {
                handlerInput.requestEnvelope['session'] = {"new": true};  // for Skill Events
            }

            if(handlerInput.requestEnvelope.session['new']) {

                return new Promise((resolve, reject) => {

                    handlerInput.attributesManager.getPersistentAttributes()

                        .then((sessionAttributes) => {
                            sessionAttributes = sessionAttributes || {};

                            // console.log(JSON.stringify(sessionAttributes, null, 2));

                            if(Object.keys(sessionAttributes).length === 0) {
                                // console.log('--- First Ever Visit for userId ' + handlerInput.requestEnvelope.session.user.userId);

                                const initialAttributes = constants.getMemoryAttributes();
                                // console.log(`constants.getMemoryAttributes()\n${JSON.stringify(initialAttributes, null, 2)}`);
                                sessionAttributes = initialAttributes;

                            }

                            sessionAttributes['launchCount'] = sessionAttributes['launchCount'] + 1 || 1;

                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                            handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

                            handlerInput.attributesManager.savePersistentAttributes()
                                .then(() => {
                                    resolve();
                                })
                                .catch((err) => {
                                    reject(err);
                                });

                        })
                        .catch((error) => {
                            console.log(`requires DynamoDB table`);
                            reject(error);
                        });

                });

            } // end session['new']


        }
    },
    'IspStatusInterceptor': {
        async process(handlerInput) {
            if(handlerInput.requestEnvelope.session['new']) {

                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                const AvailableItems = await producthandlers.getProducts(handlerInput, 'purchasable');
                const PurchasedItems = await producthandlers.getProducts(handlerInput, 'purchased');

                sessionAttributes['AvailableItems'] = AvailableItems;
                sessionAttributes['PurchasedItems'] = PurchasedItems;

                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            }
        }
    },

    'RequestGameContinueInterceptor': {
        process(handlerInput) {
            // if(!handlerInput.requestEnvelope.session) {
            //     handlerInput.requestEnvelope['session'] = {"new": true};  // for Skill Events
            // }
            //console.log(`in RequestGameContinueInterceptor`);
            // console.log(handlerInput.requestEnvelope.session['new']);

            if(handlerInput.requestEnvelope.session['new']) {
                // console.log(`new!`);
                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                if(Object.keys(sessionAttributes).length > 0) { // user has been here
                    const lastUseTimestamp = sessionAttributes['lastUseTimestamp'];
                    const gameState = sessionAttributes['gameState'];
                    const thisTimeStamp = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

                    const span = helpers.timeDelta(lastUseTimestamp, thisTimeStamp);

                    // console.log(`${span.timeSpanSEC}`);
                    // console.log(`${constants.getSecondsToAbandonGame()}`);

                    if(span.timeSpanSEC > constants.getSecondsToAbandonGame() && gameState === 'playing' ){
                        console.log(`force stop`);
                        sessionAttributes['gameState'] = `stopped`;
                        sessionAttributes['stateList'] = [];

                    }

                }

                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            } // end session['new']

        }
    },
    'ResponsePersistenceInterceptor': {
        process(handlerInput, responseOutput) {
            // console.log(`R P I`);

            const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession);

            if(ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out

                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                sessionAttributes['lastUseTimestamp'] = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

                handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

                // console.log(`about to save persistent attributes: ${JSON.stringify(sessionAttributes, null, 2)}`);

                return new Promise((resolve, reject) => {
                    handlerInput.attributesManager.savePersistentAttributes()
                        .then(() => {
                            resolve();
                        })
                        .catch((err) => {
                            reject(err);
                        });

                });

            }

        }
    },

    'RequestHistoryInterceptor': {
        process(handlerInput) {

            const maxHistorySize = constants.getMaxHistorySize();  // number of intent/request events to store

            const thisRequest = handlerInput.requestEnvelope.request;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            let history = sessionAttributes['history'] || [];

            let IntentRequest = {};
            if (thisRequest.type === 'IntentRequest') {

                let slots = {};

                IntentRequest = {
                    'IntentRequest': thisRequest.intent.name
                };

                if (thisRequest.intent.slots) {

                    for (let slot in thisRequest.intent.slots) {
                        slots[slot] = thisRequest.intent.slots[slot].value;
                    }

                    IntentRequest = {
                        'IntentRequest': thisRequest.intent.name,
                        'slots': slots
                    };

                }

            } else {
                IntentRequest = {'IntentRequest': thisRequest.type};
            }

            if (history.length >= maxHistorySize) {
                history.shift();
            }
            history.push(IntentRequest);

            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            // handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

            // }


        }
    },
    'SpeechOutputInterceptor': {
        process(handlerInput, responseOutput) {

            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            let speakingSpeed = sessionAttributes['speakingSpeed'] || 'medium';
            if (responseOutput.outputSpeech && responseOutput.outputSpeech.ssml) {

                let speechOutput = responseOutput.outputSpeech.ssml;

                speechOutput = speechOutput.replace('<speak>', '').replace('</speak>', '');

                speechOutput = '' + speechOutput + '';

                let rate = 'medium';
                if (speakingSpeed && speakingSpeed !== 'medium') {

                    speechOutput = "<speak><prosody rate='" + speakingSpeed + "'>" + speechOutput + "</prosody></speak>";
                    // console.log(speechOutput);
                    responseOutput.outputSpeech.ssml = speechOutput;

                } else {
                    speechOutput = "<speak>" + speechOutput + "</speak>";

                }
            } // else no outputSpeech.ssml; dialog delegate output

        }
    },



};

function stripTags(str) {
    return str.replace(/<\/?[^>]+(>|$)/g, "");
}

function flattenRequest(obj) { // maximum of 6 levels of JSON for IOT shadow
    if ( obj.type === 'IntentRequest' && obj.intent.slots ) {


        let flatter = Object.assign({}, obj);

        flatter.intent.slots = helpers.getSlotValues(obj.intent.slots);


        return flatter;

    } else {
        return obj;
    }
}