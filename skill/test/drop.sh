#!/usr/bin/env bash

read -n1 -r -p "Warning! You are going to delete two DynamoDB tables! press any key to continue..." key

aws dynamodb delete-table --table-name askStateGames --endpoint-url http://localhost:8000
aws dynamodb delete-table --table-name askStateGamesLeaderboard --endpoint-url http://localhost:8000

