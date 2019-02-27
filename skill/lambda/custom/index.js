'use strict';

console.log('hello');
const Alexa = require("ask-sdk");

const data      = require('./data.js');

const constants        = require('./constants.js');
const handlers         = require('./handlers.js');
const producthandlers  = require('./producthandlers.js');
const helpers          = require('./helpers.js');
const interceptors     = require('./interceptors.js');

const AWS = constants.AWS;
const AWS_REGION = constants.AWS_REGION;
const DYNAMODB_TABLE = constants.DYNAMODB_TABLE;


const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {

        const debug = true;
        const stack = error.stack.split('\n');
        let speechOutput = 'Sorry, an error occurred. ';

        console.log(stack[0]);
        console.log(stack[1]);
        console.log(stack[2]);
        if(debug && stack[0].slice(0, 33) === `AskSdk.DynamoDbPersistenceAdapter`) {
            speechOutput = 'DyanamoDB error.  Be sure your table and IAM execution role are setup. ';
        }

        let errorLoc = stack[1].substring(stack[1].lastIndexOf('/') + 1, 900);

        errorLoc = errorLoc.slice(0, -1);

        const file = errorLoc.substring(0, errorLoc.indexOf(':'));
        let line = errorLoc.substring(errorLoc.indexOf(':') + 1, 900);
        line = line.substring(0, line.indexOf(':'));

        if(debug) {
            speechOutput +=  error.message + ' in ' + file + ', line ' + line;
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    },
};
const FallbackHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (
            request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.FallbackIntent'
            )
        );
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        console.log('Unhandled request: ');
        console.log(JSON.stringify(request, null, 2));

        const outputSpeech =  `Sorry , I didn\'t understand that. Please try something else.`;

        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(outputSpeech)
            .getResponse();
    }
};
const UnhandledHandler = {
    canHandle(handlerInput) {
        return true;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        console.log('Unhandled request: ');
        console.log(JSON.stringify(request, null, 2));
        let IntentRequest = (request.type === 'IntentRequest' ? request.intent.name : request.type);

        const outputSpeech = (constants.debug ? `Sorry, I don\'t have a handler for ${IntentRequest}` : `Sorry , I didn\'t understand that. Please try something else.`);

        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(outputSpeech)
            .getResponse();
    }
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
    .addRequestHandlers(
        handlers.LaunchHandler,
        handlers.ChooseGameHandler,
        handlers.GuessHandler,
        handlers.YesHandler,


        // handlers.NoHandler,
        producthandlers.ShoppingHandler,
        producthandlers.ProductDetailHandler,
        producthandlers.BuyHandler,
        producthandlers.BuyResponseHandler,
        producthandlers.CancelResponseHandler,

        handlers.HelpHandler,
        handlers.ExitHandler,

        FallbackHandler,
        UnhandledHandler
    )

    .addErrorHandlers(ErrorHandler)


    // .addRequestInterceptors(interceptors.RequestLogInterceptor)
    .addRequestInterceptors(interceptors.RequestPersistenceInterceptor) // ###

    // .addRequestInterceptors(interceptors.RequestInitializeAttributesInterceptor)

    // .addRequestInterceptors(interceptors.RequestGameContinueInterceptor)

    .addRequestInterceptors(interceptors.RequestHistoryInterceptor)

    .addResponseInterceptors(interceptors.ResponsePersistenceInterceptor) // ***

    // .addResponseInterceptors(interceptors.SpeechOutputInterceptor)

    // .addResponseInterceptors(interceptors.AplInterceptor) // ***

    .withTableName(DYNAMODB_TABLE)
    .withAutoCreateTable(false)  // created by SAM deploy
    // .withDynamoDbClient(constants.localDynamoClient)

    .lambda();
