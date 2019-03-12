#!/usr/bin/env bash

TABLE_NAME=$1

if [ $# -eq 0 ]
  then
    TABLE_NAME=askStateGames
fi


aws dynamodb scan \
--table-name $TABLE_NAME \
--projection-expression "id, scores " \
--endpoint-url http://localhost:8000

# --projection-expression "id, attributes.launchCount, attributes.lastUseTimestamp, attributes.stateList, attributes.history " \
