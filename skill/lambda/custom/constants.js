// standard modules and configuration settings

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION || 'us-east-1';

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'askSkillUsers';

console.log('DYNAMODB_TABLE ' + DYNAMODB_TABLE);

module.exports = {
    'AWS': AWS,
    'DYNAMODB_TABLE': DYNAMODB_TABLE,

    'invocationName': 'ping me',
    'debug':true,

    'getMemoryAttributes': function() {
        const memoryAttributes = {
            "history":[],
            "launchCount":0,
            "lastUseTimestamp":0,
            // "gameName": "coast to coast",
            "gameState": "stopped",
            "stateList": [],
            "game": {}

        };

        return memoryAttributes;
    },

    'getMaxHistorySize': function() {  // number of intent/request events to store
        return 2;
    },
    'getSecondsToAbandonGame': function() {  // number of intent/request events to store
        return 60;
    },
    'getWelcomeCardImg': function() {
        return {
            smallImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png",
            largeImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png"
        };
    },
    'getDisplayImg1': function() {
        return  {
            title: 'Starry Sky',
            url: 'https://s3.amazonaws.com/skill-images-789/display/background1024_600.png'

        };
    }


};

