#!/usr/bin/env bash


PROJECT_NAME="StateGames"
LAMBDA_NAME="ask-state-games"

OBJECT_NAME="state-games.zip"


cd ../lambda
rm $OBJECT_NAME
cd custom
npm install
rm -rf node_modules/aws-sdk # unnecessary within Lambda, smaller size enables code editor

zip  ../$OBJECT_NAME * –X -r
cd ..
aws lambda update-function-code --function-name $LAMBDA_NAME --zip-file fileb://$OBJECT_NAME

cd ../sam



