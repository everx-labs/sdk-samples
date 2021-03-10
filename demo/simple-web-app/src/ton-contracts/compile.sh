#!/bin/bash

tvm_linker="$HOME/TVM-linker/tvm_linker/target/debug/tvm_linker"

name=${1%.*} # filename without extension

solc ${name}.sol && ${tvm_linker} compile ${name}.code -o ${name}.tvc

abi=`cat ${name}.abi.json`
image=`cat ${name}.tvc | base64 -w 0`

echo "const abi = ${abi};" \
     "const imageBase64 = \"${image}\";" \
     "module.exports = {abi, imageBase64}" > ${name}.package.js
