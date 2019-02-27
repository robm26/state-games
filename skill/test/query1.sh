aws dynamodb query --table-name askMemory --key-condition-expression 'begins_with(id, :a)' \
    --expression-attribute-values '{":a": {"S": "123"}}'
