'use strict';

console.log('hello');
const Alexa = require("ask-sdk");

const data      = require('./data.js');

const constants     = require('./constants.js');
const handlers      = require('./handlers.js');
const helpers       = require('./helpers.js');
const interceptors  = require('./interceptors.js');

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
const UnhandledHandler = {
    canHandle(handlerInput) {
        return true;  // will catch AMAZON.FallbackIntent or any other requests
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
        handlers.HelpHandler,
        handlers.ExitHandler,
        UnhandledHandler
    )

    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(interceptors.RequestInitializeAttributesInterceptor)
    // .addRequestInterceptors(interceptors.RequestLogInterceptor)
    // // .addRequestInterceptors(interceptors.RequestPersistenceInterceptor)
    // .addRequestInterceptors(interceptors.RequestGameContinueInterceptor)
    .addRequestInterceptors(interceptors.RequestHistoryInterceptor)
    .addResponseInterceptors(interceptors.ResponsePersistenceInterceptor)

    .withTableName(DYNAMODB_TABLE)
    .withAutoCreateTable(true)  // created by SAM deploy

    .lambda();
