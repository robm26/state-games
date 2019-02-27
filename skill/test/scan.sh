#!/usr/bin/env bash
aws dynamodb scan \
--table-name askStateGames \
--projection-expression "id, attributes.launchCount, attributes.lastUseTimestamp, attributes.stateList, attributes.history " \
--endpoint-url http://localhost:8000