aws dynamodb query --table-name askStateGamesLeaderboard --key-condition-expression 'begins_with(id, :a)' \
    --expression-attribute-values '{":a": {"S": "123"}}' --endpoint-url http://localhost:8000
