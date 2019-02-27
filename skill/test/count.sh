#!/usr/bin/env bash
aws dynamodb scan --table-name askStateGames --select "COUNT" \
--endpoint-url http://localhost:8000
