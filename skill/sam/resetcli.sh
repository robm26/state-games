#!/usr/bin/env bash

rm ../skill.json
cp ../skill_original.json ../skill.json

rm ../.ask/config
cp ../.ask/config_original ../.ask/config

# reset ISP image icons!

#        "smallIconUri": "https://s3.amazonaws.com/skill-images-789/icons/icon_108_A2Z.png",
#        "largeIconUri": "https://s3.amazonaws.com/skill-images-789/icons/icon_512_A2Z.png",
