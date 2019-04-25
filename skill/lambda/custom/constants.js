// standard modules and configuration settings
const projectName = 'StateGames';

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION || 'us-east-1';

const DYNAMODB_TABLE_USERS = process.env.DYNAMODB_TABLE || `ask${projectName}`;
const DYNAMODB_TABLE_LEADERBOARD = process.env.DYNAMODB_TABLE_LEADERBOARD || `ask${projectName}Leaderboard`;

// console.log('DYNAMODB_TABLE_USERS:  ' + DYNAMODB_TABLE_USERS);

let debug = false;
// AWS.config.endpoint = 'http://localhost:8000';

let epDetails = {apiVersion : 'latest'};

if(
    //process.mainModule.filename.slice(-11) === 'testflow.js' ||
    debug
){
    debug = true;
    epDetails = {apiVersion : 'latest', endpointAddress : 'http://localhost:8000', endpoint : 'http://localhost:8000'};
    console.log(`Using local DynamoDB at localhost:8000`);
}
console.log(`epDetails ${JSON.stringify(epDetails)}` );
const DynamoDbClient = new AWS.DynamoDB(epDetails);

// const localDynamoDbClient = new AWS.DynamoDB({apiVersion : 'latest', endpointAddress : 'http://localhost:8000', endpoint : 'http://localhost:8000'});
// const DynamoDbClient = localDynamoDbClient;


module.exports = {
    'AWS': AWS,
    'DYNAMODB_TABLE_USERS': DYNAMODB_TABLE_USERS,
    'DYNAMODB_TABLE_LEADERBOARD': DYNAMODB_TABLE_LEADERBOARD,

    'invocationName': 'state games',
    'debug':debug,
    'DynamoDbClient':DynamoDbClient,

    'getMemoryAttributes': function() {

        const memoryAttributes = {
            "history":[],
            "launchCount":0,
            "lastUseTimestamp":0,
            "gameState": "stopped",
            "stateList": [],
            "validNextStates" : [],
            "game": {},
            "currentQuestion": null,
            "joinRank": 1,
            "skillUserCount": 1,
            "PurchasedItems":[],
            "AvailableItems":[],

            "hintCounter": 0,
            "hintOfferTimestamp":0

            // "speakingSpeed":"fast" // fast // medium // slow

        };

        return memoryAttributes;
    },
    'getModel' : function() {
        return {
            "interactionModel": {
                "languageModel": {
                    "invocationName": "state purchase",
                    "intents": [
                        {
                            "name": "ChooseGameIntent",
                            "slots": [
                                {
                                    "name": "gameName",
                                    "type": "gameName"
                                }
                            ],
                            "samples": [
                                "{gameName}",
                                "lets play {gameName}",
                                "play {gameName}"
                            ]
                        },
                        {
                            "name": "GuessIntent",
                            "slots": [
                                {
                                    "name": "usstate",
                                    "type": "AMAZON.US_STATE"
                                }
                            ],
                            "samples": [
                                "{usstate}",
                                "go to {usstate}"
                            ]
                        },
                        {
                            "name": "ShoppingIntent",
                            "slots": [],
                            "samples": [
                                "I want to purchase",
                                "I want to buy",
                                "what could i buy",
                                "can i buy something",
                                "i want to buy something",
                                "what is available to buy",
                                "what can i buy"
                            ]
                        },
                        {
                            "name": "ProductDetailIntent",
                            "slots": [
                                {
                                    "name": "productName",
                                    "type": "productNames"
                                }
                            ],
                            "samples": [
                                "tell me about {productName}"
                            ]
                        },
                        {
                            "name": "BuyIntent",
                            "slots": [
                                {
                                    "name": "productName",
                                    "type": "productNames"
                                }
                            ],
                            "samples": [
                                "subscribe to {productName}",
                                "buy {productName}",
                                "buy the {productName} pack"
                            ]
                        },
                        {
                            "name": "CancelSubscriptionIntent",
                            "slots": [
                                {
                                    "name": "productName",
                                    "type": "productNames"
                                }
                            ],
                            "samples": [
                                "cancel {productName}"
                            ]
                        },
                        {
                            "name": "LeaderboardIntent",
                            "slots": [
                                {
                                    "name": "gameName",
                                    "type": "gameName"
                                }
                            ],
                            "samples": [
                                "show the leaderboard",
                                "show the leader board",
                                "leaderboard",
                                "leader board",
                                "leaderboard {gameName}",
                                "leaderboard for {gameName}",
                                "leader board {gameName}",
                                "leader board for {gameName}",
                                "high scores",
                                "top scores",
                                "top ten",
                                "high scores {gameName}",
                                "top scores {gameName}",
                                "top ten {gameName}"
                            ]
                        },
                        {
                            "name": "AMAZON.YesIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.NoIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.FallbackIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.CancelIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.HelpIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.StopIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.NavigateHomeIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.PauseIntent",
                            "samples": []
                        },
                        {
                            "name": "IDontKnowIntent",
                            "slots": [],
                            "samples": [
                                "no idea",
                                "not sure",
                                "I don't know"
                            ]
                        }
                    ],
                    "types": [
                        {
                            "name": "gameName",
                            "values": [
                                {
                                    "name": {
                                        "value": "bigger pop"
                                    }
                                },
                                {
                                    "name": {
                                        "value": "coast to coast"
                                    }
                                }
                            ]
                        },
                        {
                            "name": "productNames",
                            "values": [
                                {
                                    "name": {
                                        "value": "leader board"
                                    }
                                },
                                {
                                    "name": {
                                        "value": "hints pack"
                                    }
                                },
                                {
                                    "name": {
                                        "value": "bigger pop"
                                    }
                                },
                                {
                                    "name": {
                                        "value": "coast to coast"
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        };
    },

    'getMaxHistorySize': function() {  // number of intent/request events to store
        return 3;
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
            title: 'State Games Splash',
            url: 'https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/gaming/state_games_1200_800._TTH_.png'

        };
    },
    'getDisplayImg2': function() {
        return  {
            title: 'Starry Sky',
            url: 'https://s3.amazonaws.com/skill-images-789/display/background1024_600.png'

        };
    },

    'getPurchasableProductsTestData': function() {

        const purchasableProductsTest = [
            {
                "productId": "amzn1.adg.product.9230e6d1-502f-4ad4-a3b8-b76dc4397ad2",
                "referenceName": "bigger_pop",
                "type": "ENTITLEMENT",
                "name": "Bigger Pop",
                "summary": "Bigger Pop is a super fun game.",
                "entitled": "NOT_ENTITLED",
                "entitlementReason": "NOT_PURCHASED",
                "purchasable": "PURCHASABLE",
                "activeEntitlementCount": 0,
                "purchaseMode": "TEST"
            },
            {
                "productId": "amzn1.adg.product.6d99a310-6d51-409a-a884-81d8c076ab96",
                "referenceName": "leaderboard",
                "type": "SUBSCRIPTION",
                "name": "Leader Board",
                "summary": "The leaderboard is a listing of the top all time scores for each game.",
                "entitled": "NOT_ENTITLED",
                "entitlementReason": "NOT_PURCHASED",
                "purchasable": "PURCHASABLE",
                "activeEntitlementCount": 0,
                "purchaseMode": "TEST"
            },
            {
                "productId": "amzn1.adg.product.911dbf47-4ae5-4a3b-a9a5-d3e8be80e61f",
                "referenceName": "hint_pack",
                "type": "CONSUMABLE",
                "name": "Hint Pack",
                "summary": "A five pack of hints you can use during the game.",
                "entitled": "NOT_ENTITLED",
                "entitlementReason": "NOT_PURCHASED",
                "purchasable": "PURCHASABLE",
                "activeEntitlementCount": 0,
                "purchaseMode": "TEST"
            }
        ];
        return purchasableProductsTest;

    }


};

