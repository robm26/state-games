#!/bin/bash

if [ "$#" -ne 1 ]; then
    DIALOG="default"
else
    DIALOG=$1
fi

APPID="$(node ~/Scripts/findAskConfigFile.js)"

echo $APPID

REQ="$(ask simulate -l en-US -s $APPID -t 'open state purchase')"

TOKENPOS=${REQ%%apiAccessToken*}
TOKENPOSPLUS=$(( ${#TOKENPOS} + 18 ))

TOKEN=${REQ:TOKENPOSPLUS:1238}

# echo $TOKEN

node testflow $DIALOG $TOKEN
