/**
 * Created by mccaul on 3/30/18.
 */

// const AWS = require('aws-sdk');

const REGION         = 'us-east-1';
const cognitoIdentityPoolId = 'us-east-1:583dd84a-7792-49a6-9ce5-5624f80378e7';
let docClient;

const onLine = true;  // false for local DynamoDB debugging

// AWS.config.endpoint = 'http://localhost:8000';

console.log(`onLine: ${onLine}`);


AWS.config.region = REGION;

if(onLine) {
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: cognitoIdentityPoolId
    });

    getAWSCredentials();

} else {

    AWS.config.update({
        region: "us-east-1",
        endpoint: "http://localhost:8000"
    });

    AWS.config.credentials = {
        accessKeyId: 'abc',
        secretAccessKey: '123'
    };

    docClient = new AWS.DynamoDB.DocumentClient({endpoint: new AWS.Endpoint('http://localhost:8000') } );

}


// if(onLine) {
//     getAWSCredentials();
//
// } else {
//     docClient = new AWS.DynamoDB.DocumentClient({endpoint: new AWS.Endpoint('http://localhost:8000') } );
// }
// loadtable(); // defined in consoledata.js

// Initialize the Amazon Cognito credentials provider
function getAWSCredentials() {
    console.log(`in getAWSCredentials `);

    AWS.config.credentials.refresh(function(err) {
        if (err) console.log(err, err.stack); // an error occurred
        else {                                // successful response);
            console.log(`in getAWSCredentials, refresh success `);
            onCredentialsAvailable(AWS.config.credentials);
        }
    });
}
function onCredentialsAvailable(creds) {
    console.log('connected to aws');

    docClient = new AWS.DynamoDB.DocumentClient();

    loadtable(); // defined in consoledata.js

}
