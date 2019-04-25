
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

                    if (request.type === 'IntentRequest'
                        && request.intent.name === 'ShoppingIntent'
                    ) {



                    }

                    const launchCount = sessionAttributes['launchCount'];

                    // const eventData = {"name": "Robert"};
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
    },

    'AplInterceptor2': {
        process(handlerInput, responseOutput) {
            return new Promise(async (resolve, reject) => {
                const request = handlerInput.requestEnvelope.request;

                const IntentRequest = (request.type === "IntentRequest" ? request.intent.name : request.type);
                const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                const history = sessionAttributes['history'].map((item) => {
                    return {
                        "type": "Text",
                        "text": `${item.IntentRequest}`,
                        "style": "historyStyle"
                    };
                });

                let prompts =  [
                    {
                        "type": "Text",
                        "text": `Help`,
                        "style": "promptStyle"
                    },
                    {
                        "type": "Text",
                        "text": `Stop`,
                        "style": "promptStyle"
                    }
                ];

                if(sessionAttributes.gameState !== "stopped") {
                    //sessionAttributes.foo
                    let nextStates = gamehelpers.validNextStates([], gameName);
                    let nextStatesHint = helpers.sayArray(helpers.shuffleArray(nextStates).slice(0,3), 'or');

                }


                // constants.getModel();

                const AvailableItems = sessionAttributes['AvailableItems'];
                const PurchasedItems = sessionAttributes['PurchasedItems'];


                const purchasableProducts = await producthandlers.getProducts(handlerInput, 'purchasable');  // helper function below
                const purchasedProducts = await producthandlers.getProducts(handlerInput, 'purchased');  // helper function below


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
                if (responseOutput && responseOutput.outputSpeech && responseOutput.outputSpeech.ssml) {
                    speechOutput = helpers.stripTags(responseOutput.outputSpeech.ssml);
                } else {
                    speechOutput = `buying..`;
                }

                // console.log(`*****\n${JSON.stringify(speechOutput, null, 2)}`);

                let slotArrayFilled = [];
                let slotArrayEmpty = [];
                let slotArray = [];

                if (request.type === "IntentRequest" && request.intent.slots && Object.keys(request.intent.slots).length > 0) {
                    // console.log(`^^^^^ slots\n${JSON.stringify(request.intent.slots, null, 2)}`);
                    let slots = request.intent.slots;

                    Object.keys(slots).forEach(function (key) {
                        let slot = slots[key];

                        // console.log(`${slot.name} : ${slot.value ? slot.value : ""}`);
                        let slotNameStyle = "textSlotNameStyle";
                        if (!slot.value) {
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

                        if (slot.value) {
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


                if (helpers.supportsDisplayAPL(handlerInput)) {

                    const myDocument = require('./apl/main2.json');
                    console.log(`productListAvailableItems:\n${JSON.stringify(productListAvailableItems)}`);

                    const eventData = {
                        "liveData": {
                            "type": "object",
                            "textIntent": IntentRequest,
                            "slots": slotArray,
                            "textResponse": speechOutput,
                            "productsPurchased": productListPurchasedItems,
                            "productsAvailable": productListAvailableItems,
                            "imgTitle": "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/gaming/state_games_1200_800._TTH_.png",
                            "imgBlank": "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/gaming/usa._TTH_.png",
                            "prompts": prompts,
                            "history": history
                        }
                    };
                    console.log(`productListPurchasedItems: ${productListPurchasedItems.map(item => `\n - ` + item.text)}`);
                    console.log(`productListAvailableItems: ${productListAvailableItems.map(item => `\n - ` + item.text)}`);

                    // console.log(`eventData:\n${JSON.stringify(eventData, null, 2)}`);

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
