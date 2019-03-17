const constants = require('./constants.js');
const helpers = require('./helpers.js');
const gamehelpers = require('./gamehelpers.js');

const data = require('./data.js');
const games = data.getGames();

module.exports = {
    'ShoppingHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'ShoppingIntent';
        },
        async handle(handlerInput) {
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            const request = handlerInput.requestEnvelope.request;

            const purchasableProducts = await module.exports.getProducts(handlerInput, 'purchasable');  // helper function below

            if (purchasableProducts.length > 0) {
                // console.log(`~~~\n${JSON.stringify(purchasableProducts, null, 2)}\n~~~`);

                const cardList = purchasableProducts.map((item) => {
                    return `${item.name} : ${item.type}`
                });

                let cardText = helpers.displayListFormatter(cardList, `card`);
                cardText += `\nTry saying:\n"Tell me about <product>"\nor\n"Buy <product>"`;

                const prods = helpers.sayArray(purchasableProducts.map(item => item.name), 'or');

                speakOutput = `Products available for purchase at this time are ${prods}` +

                    `. To learn more about a product, say "Tell me about", followed by the product name. ` +
                    ` If you are ready to buy say "Buy", followed by the product name, such as, ${prods}`;

                repromptOutput = `I didn't catch that. What can I help you with?`;

                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(repromptOutput)
                    .withSimpleCard(`Products`, cardText)
                    .getResponse();
            } else {
                return handlerInput.responseBuilder
                    .speak('You are fully stocked with products')
                    .reprompt('Sorry, try again?  Say help to hear some options.')
                    .getResponse();
            }

        }
    },

    'ProductDetailHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'ProductDetailIntent';
        },
        async handle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            let slot1 = `productName`;

            let slotValues = helpers.getSlotValues(request.intent.slots);
            let slotStatus = ``;

            let productName = slotValues[slot1].resolved || slotValues[slot1].heardAs || '';

            if (slotValues[slot1].heardAs) {
                slotStatus += ` You asked for details on ${slotValues[slot1].heardAs}, `;

                if (slotValues[slot1].ERstatus === 'ER_SUCCESS_MATCH') {
                    if(slotValues[slot1].resolved !== slotValues[slot1].heardAs) {
                        slotStatus += `or as we call it,  ` + slotValues[slot1].resolved + `. `;
                    }
                }

                const theProduct = await module.exports.getProducts(handlerInput, helpers.capitalize(productName));  // helper function below

                slotStatus += `This is a, ${helpers.capitalize(theProduct.type.toLowerCase())} product. `;
                slotStatus += `${theProduct.summary} `;
                slotStatus += `If you would like to buy it, just say, Buy ${theProduct.name}`;

            }

            if (slotValues[slot1].ERstatus === 'ER_SUCCESS_NO_MATCH') {
                slotStatus += `which is not a product I know about yet. `;
                console.log(`***** consider adding "${slotValues[slot1].heardAs}" to the custom slot type used by slot productName! `);
            }

            if( (slotValues[slot1].ERstatus === 'ER_SUCCESS_NO_MATCH') ||  (!slotValues[slot1].heardAs) ) {

                slotStatus += `Try again, you can say, tell me about a product, or, what can I buy? `;

            }
            const say = slotStatus;

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt('Try again. ' + say)
                .getResponse();
        }
    },

    'BuyHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'BuyIntent';
        },
        async handle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            const locale = request.locale;
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            let slot1 = `productName`;

            let slotValues = helpers.getSlotValues(request.intent.slots);
            let slotStatus = ``;

            let productName = slotValues[slot1].resolved || slotValues[slot1].heardAs || '';

            if (slotValues[slot1].heardAs) {
                slotStatus += ` You asked to buy ${slotValues[slot1].heardAs}, `;

                if (slotValues[slot1].ERstatus === 'ER_SUCCESS_MATCH') {
                    if(slotValues[slot1].resolved !== slotValues[slot1].heardAs) {
                        slotStatus += `or as we call it,  ` + slotValues[slot1].resolved + `. `;
                    }
                }

                const theProduct = await module.exports.getProducts(handlerInput, helpers.capitalize(productName));  // helper function below

                const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();
                return ms.getInSkillProducts(locale).then(function initiatePurchase(result) {

                    return handlerInput.responseBuilder
                        .addDirective({
                            type: 'Connections.SendRequest',
                            name: 'Buy',
                            payload: {
                                InSkillProduct: {
                                    productId: theProduct.productId,
                                },
                            },
                            token: 'correlationToken',
                        })
                        .getResponse();

                });

            }

            if (slotValues[slot1].ERstatus === 'ER_SUCCESS_NO_MATCH') {
                slotStatus += `which is not a product I know about yet. `;
                console.log(`***** consider adding "${slotValues[slot1].heardAs}" to the custom slot type used by slot productName! `);
            }

            if( (slotValues[slot1].ERstatus === 'ER_SUCCESS_NO_MATCH') ||  (!slotValues[slot1].heardAs) ) {

                slotStatus += `Try again, you can say, tell me about a product, or, what can I buy? `;

            }
            const say = slotStatus;

            return handlerInput.responseBuilder
                .speak(say)
                .reprompt('Try again. ' + say)
                .getResponse();
        }
    },

    'BuyResponseHandler' : {

        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
                (handlerInput.requestEnvelope.request.name === 'Buy' ||
                handlerInput.requestEnvelope.request.name === 'Upsell');
        },
        handle(handlerInput) {
            console.log('IN: BuyResponseHandler.handle');

            const locale = handlerInput.requestEnvelope.request.locale;
            const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();
            const productId = handlerInput.requestEnvelope.request.payload.productId;

            return ms.getInSkillProducts(locale).then(function handlePurchaseResponse(result) {
                const product = result.inSkillProducts.filter(record => record.productId === productId);
                console.log(`PRODUCT = ${JSON.stringify(product)}`);
                if (handlerInput.requestEnvelope.request.status.code === '200') {
                    let speakOutput;
                    let repromptOutput;


                    switch (handlerInput.requestEnvelope.request.payload.purchaseResult) {
                        case 'ACCEPTED':
                            // if (product[0].referenceName !== 'all_access') categoryFacts = ALL_FACTS.filter(record => record.type === product[0].referenceName.replace('_pack', ''));

                            speakOutput = `You now own, ${product[0].name}. `;
                            repromptOutput = speakOutput;
                            break;
                        case 'DECLINED':
                            if (handlerInput.requestEnvelope.request.name === 'Buy') {
                                // response when declined buy request
                                speakOutput = `Thanks for your interest in the ${product[0].name}  `;
                                repromptOutput = speakOutput;
                                break;
                            }
                            // response when declined upsell request

                            speakOutput = `OK.   `;
                            repromptOutput = speakOutput;
                            break;
                        case 'ALREADY_PURCHASED':
                            // may have access to more than what was asked for, but give them a random

                            speakOutput = `you already have this.`;
                            repromptOutput = speakOutput;
                            break;
                        default:
                            console.log(`unhandled purchaseResult: ${handlerInput.requestEnvelope.payload.purchaseResult}`);
                            speakOutput = `Something unexpected happened, but thanks for your interest in the ${product[0].name}.  `;
                            repromptOutput = speakOutput;
                            break;
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(repromptOutput)
                        .getResponse();
                }
                // Something failed.
                console.log(`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`);

                return handlerInput.responseBuilder
                    .speak('There was an error handling your purchase request. Please try again or contact us for help.')
                    .getResponse();
            });
        },

    },
    'CancelResponseHandler' : {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
                handlerInput.requestEnvelope.request.name === 'Cancel';
        },
        handle(handlerInput) {
            console.log('IN: CancelResponseHandler.handle');

            const locale = handlerInput.requestEnvelope.request.locale;
            const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();
            const productId = handlerInput.requestEnvelope.request.payload.productId;

            return ms.getInSkillProducts(locale).then(function handleCancelResponse(result) {
                const product = result.inSkillProducts.filter(record => record.productId === productId);

                console.log(`PRODUCT = ${JSON.stringify(product)}`);
                if (handlerInput.requestEnvelope.request.status.code === '200') {
                    if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
                        const speakOutput = `You have successfully cancelled your subscription. `;
                        const repromptOutput = getRandomYesNoQuestion();
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(repromptOutput)
                            .getResponse();
                    }
                    if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
                        const speakOutput = `You don't currently have a subscription to cancel. `;
                        const repromptOutput = getRandomYesNoQuestion();
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(repromptOutput)
                            .getResponse();
                    }
                }
                // Something failed.
                console.log(`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`);

                return handlerInput.responseBuilder
                    .speak('There was an error handling your purchase request. Please try again or contact us for help.')
                    .getResponse();
            });
        }
    },

    'getProducts' : function(handlerInput, filterExp) {

            return new Promise(resolve => {
                const request = handlerInput.requestEnvelope.request;
                const locale = request.locale;

                const testProducts = constants.getPurchasableProductsTestData();
                // resolve(data);
                // console.log(`in getProducts(handlerInput, ${filterExp})`);

                const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

                ms.getInSkillProducts(locale).then(function fetchProductDetails(result) {
                    products = [];
                    if(filterExp === 'purchasable') {
                        products = result.inSkillProducts.filter(record => record.entitled === 'NOT_ENTITLED' && record.purchasable === 'PURCHASABLE');

                    } else if (filterExp === 'purchased') {
                        products = result.inSkillProducts.filter(record => record.entitled === 'ENTITLED');

                    } else if (filterExp !== '*') { // match single product on filterExp
                        products = result.inSkillProducts.find(record => record.name === filterExp );

                    } else {
                        products = result.inSkillProducts;

                    }
                    // console.log(`*** got products: ${JSON.stringify(products, null, 2)}`);

                  resolve(products);

                }).catch((err) => {
                    if(err.name === 'ServiceError' && err.statusCode === 403) {
                        // console.log(`error: ${JSON.stringify(err, 2, null)}`);
                        // console.log(`using local test data for products`);
                        // resolve(['product one', 'product two']);
                        resolve(testProducts);

                    } else {
                        console.log(`Caught error ${JSON.stringify(err, null, 2)}`);
                    }

                });


            });

    }
};


