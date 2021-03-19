#!/bin/bash
name=${1%.*} # filename without extension
abi=`cat ${name}.abi.json`
image=`cat ${name}.tvc | base64 -w 0`

echo "const abi = ${abi};" \
     "const imageBase64 = \"${image}\";" \
     "module.exports = {abi, tvc: imageBase64}" > ${name}.package.js
