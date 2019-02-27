#!/usr/bin/env bash

PROJECT_NAME="StateGames"
S3_BUCKET="alexaconsole789"

#  aws cloudformation deploy --template-file ./game.yaml --stack-name $PROJECT_NAME --parameter-overrides ProjectName=$PROJECT_NAME  --capabilities CAPABILITY_IAM

#    PACKAGE_BUCKET="ask-samples-resources"
#    BUCKET_FOLDER="code-packages"
#    OBJECT_NAME="proactive-events-skill.zip"
#

    PACKAGE_BUCKET="ask-samples-us-east-1-region"
    BUCKET_FOLDER="state-games-demo"
    OBJECT_NAME="state-games.zip"

    cd ../lambda
    rm $OBJECT_NAME
    cd custom
    npm install
    rm -rf node_modules/aws-sdk # unnecessary within Lambda, smaller size enables code editor

    zip  ../$OBJECT_NAME * –X -r
    cd ..
    # aws lambda update-function-code --function-name ask-custom-PingMe --zip-file fileb://index.zip
    aws s3 cp $OBJECT_NAME s3://$PACKAGE_BUCKET/$BUCKET_FOLDER/$OBJECT_NAME --profile vde
    cd ../sam
#
    aws cloudformation package --template-file ./game.yaml --s3-bucket $S3_BUCKET --s3-prefix $BUCKET_FOLDER --output-template-file ./packaged-game.yaml

