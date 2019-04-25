#!/bin/bash
# ################# WARNING! This script will delete all items in the table you specify

TABLE_NAME=askStateGames
# TABLE_NAME=$1
ENDPOINT_URL="--endpoint-url http://localhost:8000"
# ENDPOINT_URL=""
KEY=id

aws dynamodb scan \
--table-name $TABLE_NAME \
--attributes-to-get "id" \
--query "Items[].id.S" \
$ENDPOINT_URL \
--output text | tr "\t" "\n" | xargs -t -I keyvalue aws dynamodb delete-item --table-name $TABLE_NAME --key '{"id": {"S": "keyvalue"}}' $ENDPOINT_URL \



TABLE_NAME=askStateGamesLeaderboard

aws dynamodb scan \
--table-name $TABLE_NAME \
--attributes-to-get "id" \
--query "Items[].id.S" \
$ENDPOINT_URL \
--output text | tr "\t" "\n" | xargs -t -I keyvalue aws dynamodb delete-item --table-name $TABLE_NAME --key '{"id": {"S": "keyvalue"}}' $ENDPOINT_URL \

