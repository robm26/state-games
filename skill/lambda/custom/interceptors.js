/**
 * Created by mccaul on 5/11/18.
 */
const constants = require('./constants.js');
const helpers = require('./helpers.js');
const producthandlers = require('./producthandlers.js');

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
    // 'RequestInitializeAttributesInterceptor': {
    //     process(handlerInput) {
    //         if(!handlerInput.requestEnvelope.session) {
    //             handlerInput.requestEnvelope['session'] = {"new": true};  // for Skill Events
    //         }
    //
    //         if(handlerInput.requestEnvelope.session['new']) {
    //
    //
    //             let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //             if(Object.keys(sessionAttributes).length === 0) {
    //                 // console.log('--- First Ever Visit for userId ' + handlerInput.requestEnvelope.session.user.userId);
    //
    //                 const initialAttributes = constants.getMemoryAttributes();
    //                 // console.log(`constants.getMemoryAttributes()\n${JSON.stringify(initialAttributes)}`);
    //                 sessionAttributes = initialAttributes;
    //
    //             }
    //             sessionAttributes['launchCount'] += 1;
    //
    //
    //             handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    //
    //
    //         } // end session['new']
    //
    //     }
    // },

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
                                // console.log(`constants.getMemoryAttributes()\n${JSON.stringify(initialAttributes)}`);
                                sessionAttributes = initialAttributes;

                            }
                            sessionAttributes['launchCount'] += 1;
                            // sessionAttributes['gameState'] = 'pc';

                            // console.log(`about to save sessionAttributes: ${JSON.stringify(sessionAttributes, null, 2)}`);
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

                handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

                // console.log(`about to save sessionAttributes: ${JSON.stringify(sessionAttributes, null, 2)}`);

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
    'AplInterceptor' :  {
        process(handlerInput, responseOutput) {
            return new Promise(async (resolve, reject) => {
                const request = handlerInput.requestEnvelope.request;

                let IntentRequest = (request.type === "IntentRequest" ? request.intent.name : request.type);

                const purchasableProducts = await producthandlers.getProducts(handlerInput, 'purchasable');  // helper function below
                const purchasedProducts = await producthandlers.getProducts(handlerInput, 'purchased');  // helper function below

                //
                // const productListPurchased = [`apples`, `bananas`, `grapes`];
                // const productListAvailable = [`pears`, `coconuts`, `limes`];

                const productListPurchasedItems = purchasedProducts.map((item) => {
                    return {
                        "type": "Text",
                        "text": `${item.name}`,
                        "style": "purchasedStyle"
                    };
                });
                const productListAvailableItems = purchasableProducts.map((item) => {
                    return {
                        "type": "Text",
                        "text": `${item.name}`,
                        "style": "availableStyle"
                    };
                });


                let speechOutput = ``;
                if(responseOutput &&  responseOutput.outputSpeech && responseOutput.outputSpeech.ssml) {
                    speechOutput = stripTags(responseOutput.outputSpeech.ssml);
                } else {
                    speechOutput = `buying..`;
                }

                // console.log(`*****\n${JSON.stringify(speechOutput, null, 2)}`);

                let slotArrayFilled = [];
                let slotArrayEmpty = [];
                let slotArray = [];

                if(request.type === "IntentRequest" && request.intent.slots && Object.keys(request.intent.slots).length > 0) {
                    // console.log(`^^^^^ slots\n${JSON.stringify(request.intent.slots, null, 2)}`);
                    let slots = request.intent.slots;

                    Object.keys(slots).forEach(function(key) {
                        let slot = slots[key];

                        console.log(`${slot.name} : ${slot.value ? slot.value : ""}`);
                        let slotNameStyle = "textSlotNameStyle";
                        if(!slot.value) {
                            slotNameStyle = "textSlotEmptyStyle";
                        }
                        const slotDisplayName = {
                            "type": "Text",
                            "text": `${slot.name}:`,
                            "style": slotNameStyle
                        };

                        const slotDisplayValue = {
                            "type": "Text",
                            "text": `&nbsp;${slot.value ? slot.value : ""}`,
                            "style": "textSlotValueStyle"
                        };

                        if(slot.value) {
                            slotArrayFilled.push(slotDisplayName);
                            slotArrayFilled.push(slotDisplayValue);
                        } else {
                            slotArrayEmpty.push(slotDisplayName);
                            slotArrayEmpty.push(slotDisplayValue);
                        }

                    });
                }

                slotArray = slotArrayFilled;
                slotArray = slotArray.concat(slotArrayEmpty);

                // "slots": [
                //     {
                //         "type": "Text",
                //         "text": "Danielle",
                //         "style": "textSlotStyle"
                //     },
                //     {
                //         "type": "Text",
                //         "text": "Leah",
                //         "style": "textSlotStyle"
                //     }
                // ],

                if (helpers.supportsDisplayAPL(handlerInput) || true) {

                    const myDocument = require('./apl/main.json');

                    const eventData = {
                        "liveData": {
                            "type": "object",
                            "textIntent": IntentRequest,
                            "slots": slotArray,
                            "textResponse": speechOutput,
                            "productsPurchased": productListPurchasedItems,
                            "productsAvailable": productListAvailableItems
                        }
                    };
                    console.log(`eventData:\n${JSON.stringify(eventData, null, 2)}`);

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