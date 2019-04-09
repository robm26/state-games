# state-games
A fun game skill sample.

# Overview
You can play "coast to coast" as the default game.


## Installation

New developers should start with a tutorial 
like Cakewalk or [Fact Skill](https://github.com/alexa/skill-sample-nodejs-fact) to learn the basics of Alexa skill building.


## Steps
1. Clone this repository to your laptop
1. Run ```npm install``` from the skill/lambda/custom folder to install dependencies.
1. Zip the contents of the skill/lambda/custom folder.
1. Create a new Lambda function called **ask-state-games** and upload the zip file.
1. Add the Alexa trigger to your Lambda function.
1. Update the IAM role of your function to include DynamoDB Full Access policy permissions.
1. Create a new skill in the Alexa Developer console.
1. Use the models\en-US.json file for your model.
1. Enable the Alexa Presentation Language interface from the Interfaces page.
1. Save and build your skill.

## Database
1. In the AWS Console, click to DynamoDB
1. Create a database called **askStateGames** with primary key "id", a string.
1. Create a second database called **askStateGamesLeaderboard** with primary key "id", a string.


## Testing
1. Test your skill by invoking it and asking for "coast to coast".

## Local Testing
1. From a command prompt, navigate to /skill/test folder.
1. Type ```node testflow```
1. You should see the skill code be executed for LaunchRequest, AMAZON.HelpIntent, AMAZON.StopIntent
1. Try out some of the other tests found in the test/dialogs folder.
1. For example, try ```node testflow resume``` to see the skill resume a game in progress.
1. Create your own tests, and read more at the [Testflow project](https://github.com/alexa/alexa-cookbook/tree/master/tools/TestFlow) and [blog post](https://developer.amazon.com/blogs/alexa/post/35eb8ae8-2cd8-4de7-86c5-97a1abc239b9/testflow-simulate-conversations-with-your-alexa-skill-code-to-ease-debugging).

 ## Extend the skill
1. Check out the source file names in the lambda/custom folder.
1. From the bottom of the index.js file, uncomment out the AplInterceptor
1. Uncomment the IspStatusInterceptor as well.
1. Add ISP products to your skill:  see the isps\ folder for details.
1. Test that the skill shows APL content in the test panel.
 

