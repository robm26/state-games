aws dynamodb create-table --table-name askStateGames \
--attribute-definitions AttributeName=id,AttributeType=S \
--key-schema AttributeName=id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://localhost:8000

aws dynamodb create-table --table-name askStateGamesLeaderboard \
--attribute-definitions AttributeName=id,AttributeType=S \
--key-schema AttributeName=id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
--endpoint-url http://localhost:8000