
const constants = require('./constants.js');
const helpers = require('./helpers.js');
const AWS = constants.AWS;

module.exports = {

    'randomArrayElement': function(myArray) {
        return(myArray[Math.floor(Math.random() * myArray.length)]);

    },

    'capitalize': function(myString) {
        return myString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });

    },
    'supportsDisplayAPL': function(handlerInput) // returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.)
    {                                      //  Enable your skill for display as shown here: https://alexa.design/enabledisplay
        const hasDisplay =
            handlerInput.requestEnvelope.context &&
            handlerInput.requestEnvelope.context.System &&
            handlerInput.requestEnvelope.context.System.device &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces["Alexa.Presentation.APL"];

        return hasDisplay;
    },
    'supportsDisplay': function(handlerInput) // returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.)
    {                                      //  Enable your skill for display as shown here: https://alexa.design/enabledisplay
        const hasDisplay =
            handlerInput.requestEnvelope.context &&
            handlerInput.requestEnvelope.context.System &&
            handlerInput.requestEnvelope.context.System.device &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;

        return hasDisplay;
    },
    'displayListFormatter': function(arr, type) {

        if(type === `card`) {
            let list = ``;
            let i = 1;
            arr.forEach(function(item) {
                list += `${i++}. ${item.name}\n`;
            });
            return list;

        } else {

            let list = [];
            arr.forEach(function(item) {
                let token = item.name;

                let inlineImg = `<img src='https://s3.amazonaws.com/skill-images-789/cards/${token}.png' width='88' height='68' alt='image' />`;
//                let inlineImg = `<img src='${module.exports.getImgUrl(item.asin)}' width='88' height='68' alt='image' />`;

                list.push(
                    {
                        "token":token,
                        "textContent": {
                            "primaryText":{
                                "type":"RichText",
                                "text":`${inlineImg}${item.name}`
                            }
                        }
                    }
                );
            });

            return list;
        }
    },

    'timeDelta': function(t1, t2) {

        const dt1 = new Date(t1);
        const dt2 = new Date(t2);

        const timeSpanMS = dt2.getTime() - dt1.getTime();

        const span = {
            "timeSpanSEC": Math.floor(timeSpanMS / (1000 )),
            "timeSpanMIN": Math.floor(timeSpanMS / (1000 * 60 )),
            "timeSpanHR": Math.floor(timeSpanMS / (1000 * 60 * 60)),
            "timeSpanDAY": Math.floor(timeSpanMS / (1000 * 60 * 60 * 24)),
            "timeSpanDesc" : ""
        };

        if (span.timeSpanMIN < 2) {
            span.timeSpanDesc = span.timeSpanSEC + " seconds";
        } else if (span.timeSpanHR < 2) {
            span.timeSpanDesc = span.timeSpanMIN + " minutes";
        } else if (span.timeSpanDAY < 2) {
            span.timeSpanDesc = span.timeSpanHR + " hours";
        } else {
            span.timeSpanDesc = span.timeSpanDAY + " days";
        }

        return span;

    },
    'sayArray': function(myData, penultimateWord = 'and') {
        // the first argument is an array [] of items
        // the second argument is the list penultimate word; and/or/nor etc.  Default to 'and'
        let result = '';

        myData.forEach(function(element, index, arr) {

            if (index === 0) {
                result = element;
            } else if (index === myData.length - 1) {
                result += ` ${penultimateWord} ${element}`;
            } else {
                result += `, ${element}`;
            }
        });
        return result;
    },
    'stripTags': function(str) {
        return str.replace(/<\/?[^>]+(>|$)/g, "");
    },

    'getSlotValues': function(filledSlots) {
        const slotValues = {};

        Object.keys(filledSlots).forEach((item) => {
            const name  = filledSlots[item].name;

            if (filledSlots[item] &&
                filledSlots[item].resolutions &&
                filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
                filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
                filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                    case 'ER_SUCCESS_MATCH':

                        let resolutions = [];
                        let vals = filledSlots[item].resolutions.resolutionsPerAuthority[0].values;
                        for (let i = 0; i < vals.length; i++) {
                            resolutions.push(vals[i].value.name);
                        }
                        slotValues[name] = {
                            heardAs: filledSlots[item].value,

                            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                            resolutions: resolutions,

                            ERstatus: 'ER_SUCCESS_MATCH'
                        };
                        break;
                    case 'ER_SUCCESS_NO_MATCH':
                        slotValues[name] = {
                            heardAs: filledSlots[item].value,
                            resolved: '',
                            ERstatus: 'ER_SUCCESS_NO_MATCH'
                        };
                        break;
                    default:
                        break;
                }
            } else {
                slotValues[name] = {
                    heardAs: filledSlots[item].value,
                    resolved: '',
                    ERstatus: ''
                };
            }
        }, this);

        return slotValues;
    },


    'getRecordCount': function(callback) {

        const params = {
            TableName: DYNAMODB_TABLE
        };

        let docClient = new AWS.DynamoDB.DocumentClient();

        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));

            } else {
                const skillUserCount = data.Items.length;

                callback(skillUserCount);
            }
        });

    },


    'shuffleArray': function(array) {  // Fisher Yates shuffle!

        let currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },


    'incrementArray': function(arr, element) {
        for(let i = 0; i < arr.length; i++) {
            if (arr[i].name === element) {
                arr[i].value += 1;
                return arr;
            }
        }
        arr.push({'name':element, 'value': 1});
        return arr;

    },
    'sortArray': function(arr) {
        return arr.sort();
        // return arr.sort(function(a,b) {return (a.value > b.value) ? -1 : ((b.value > a.value) ? 1 : 0);} );
    },

    'rankArray': function(arr) {  // assumes sorted array
        let rank = 0;
        let previousValue = 0;
        let tiesAll = {};
        let ties = [];

        for(let i = 0; i < arr.length; i++) {

            if (arr[i].value !== previousValue) {
                rank += 1;
                ties = [];
            }
            ties.push(arr[i].name);

            arr[i].rank = rank;

            arr[i].ties = ties;

            previousValue = arr[i].value;

        }

        // list other elements tied at the same rank
        for(let i = 0; i < arr.length; i++) {

            let tiesCleaned = [];
            for (let j = 0; j < arr[i].ties.length; j++) {
                if (arr[i].ties[j] !== arr[i].name) {
                    tiesCleaned.push(arr[i].ties[j]);
                }
            }

            arr[i].ties = tiesCleaned;

        }

        return arr;
    }

};

// another way to define helpers: extend a native type with a new function
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

