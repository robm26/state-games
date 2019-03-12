#!/usr/bin/env bash

TABLE_NAME=$1

if [ $# -eq 0 ]
  then
    TABLE_NAME=askStateGamesLeaderboard
fi

aws dynamodb get-item \
--table-name $TABLE_NAME \
--key file://key.json \
--endpoint-url http://localhost:8000

