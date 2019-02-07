/**
 * Created by mccaul on 5/11/18.
 */
const constants = require('./constants.js');
const helpers = require('./helpers.js');

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
    'RequestInitializeAttributesInterceptor': {
        process(handlerInput) {
            if(!handlerInput.requestEnvelope.session) {
                handlerInput.requestEnvelope['session'] = {"new": true};  // for Skill Events
            }

            if(handlerInput.requestEnvelope.session['new']) {


                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
                if(Object.keys(sessionAttributes).length === 0) {
                    // console.log('--- First Ever Visit for userId ' + handlerInput.requestEnvelope.session.user.userId);

                    const initialAttributes = constants.getMemoryAttributes();
                    // console.log(`constants.getMemoryAttributes()\n${JSON.stringify(initialAttributes)}`);
                    sessionAttributes = initialAttributes;

                }
                sessionAttributes['launchCount'] += 1;

                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);


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

                            // if(Object.keys(sessionAttributes).length === 0) {
                            //     // console.log('--- First Ever Visit for userId ' + handlerInput.requestEnvelope.session.user.userId);
                            //
                            //     const initialAttributes = constants.getMemoryAttributes();
                            //     // console.log(`constants.getMemoryAttributes()\n${JSON.stringify(initialAttributes)}`);
                            //     sessionAttributes = initialAttributes;
                            //
                            // }
                            // sessionAttributes['launchCount'] += 1;

                            console.log(`about to save sessionAttributes: ${JSON.stringify(sessionAttributes, null, 2)}`);
                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

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

    'RequestGameContinueInterceptor': {
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

                            if(Object.keys(sessionAttributes).length > 0) { // user has been here
                                const lastUseTimestamp = sessionAttributes['lastUseTimestamp'];
                                const gameState = sessionAttributes['gameState'];
                                const thisTimeStamp = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

                                const span = helpers.timeDelta(lastUseTimestamp, thisTimeStamp);

                                if(span.timeSpanSEC > constants.getSecondsToAbandonGame() ){
                                    sessionAttributes['gameState'] = `stopped`;
                                    sessionAttributes['stateList'] = [];
                                } else {
                                    // allow game to resume
                                }

                            }

                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

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

    'ResponsePersistenceInterceptor': {
        process(handlerInput, responseOutput) {

            const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession);

            if(ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out

                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                sessionAttributes['lastUseTimestamp'] = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

                // console.log(`ResponsePersistenceInterceptor sessionAttributes:\n${JSON.stringify(sessionAttributes, null, 2)}`);

                handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

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
    }

};

function stripTags(str) {
    return str.replace(/<\/?[^>]+(>|$)/g, "");
}

function flattenRequest(obj) { // maximum of 6 levels of JSON for IOT shadow
    if ( obj.type === 'IntentRequest' && obj.intent.slots ) {

        // console.log(getSlotValues(obj.intent.slots));
        // console.log(`flattening ${JSON.stringify(obj, null, 2)}`);

        let flatter = Object.assign({}, obj);

        flatter.intent.slots = helpers.getSlotValues(obj.intent.slots);
        // console.log(flatter.intent.slots);

        return flatter;

    } else {
        return obj;
    }
}