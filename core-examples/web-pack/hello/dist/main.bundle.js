/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@eversdk/core/dist/bin.js":
/*!************************************************!*\
  !*** ./node_modules/@eversdk/core/dist/bin.js ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonBinaryBridge = exports.useLibrary = exports.getBridge = exports.ResponseType = void 0;
const errors_1 = __webpack_require__(/*! ./errors */ "./node_modules/@eversdk/core/dist/errors.js");
var ResponseType;
(function (ResponseType) {
    ResponseType[ResponseType["Success"] = 0] = "Success";
    ResponseType[ResponseType["Error"] = 1] = "Error";
    ResponseType[ResponseType["Nop"] = 2] = "Nop";
    ResponseType[ResponseType["AppRequest"] = 3] = "AppRequest";
    ResponseType[ResponseType["AppNotify"] = 4] = "AppNotify";
    ResponseType[ResponseType["Custom"] = 100] = "Custom";
})(ResponseType = exports.ResponseType || (exports.ResponseType = {}));
let bridge = undefined;
function getBridge() {
    if (!bridge) {
        throw new errors_1.TonClientError(1, "TON Client binary bridge isn't set.");
    }
    return bridge;
}
exports.getBridge = getBridge;
function useLibrary(loader) {
    if ("createContext" in loader) {
        bridge = loader;
    }
    else {
        bridge = new CommonBinaryBridge(loader);
    }
}
exports.useLibrary = useLibrary;
class BinaryLibraryAdapter {
    constructor(library) {
        this.library = library;
    }
    setResponseParamsHandler(handler) {
        if (handler === undefined) {
            this.library.setResponseHandler(undefined);
        }
        else {
            this.library.setResponseHandler((requestId, paramsJson, responseType, finished) => handler(requestId, paramsJson !== "" ? JSON.parse(paramsJson) : undefined, responseType, finished));
        }
    }
    sendRequestParams(context, requestId, functionName, functionParams) {
        const paramsJson = (functionParams === undefined) || (functionParams === null)
            ? ""
            : JSON.stringify(functionParams, (_, value) => typeof value === "bigint"
                ? (value < Number.MAX_SAFE_INTEGER && value > Number.MIN_SAFE_INTEGER
                    ? Number(value)
                    : value.toString())
                : value);
        this.library.sendRequest(context, requestId, functionName, paramsJson);
    }
    createContext(configJson) {
        return this.library.createContext(configJson);
    }
    destroyContext(context) {
        this.library.destroyContext(context);
    }
}
class CommonBinaryBridge {
    constructor(loader) {
        this.loading = undefined;
        this.loadError = undefined;
        this.library = undefined;
        this.requests = new Map();
        this.nextRequestId = 1;
        this.contextCount = 0;
        this.responseHandlerAssigned = false;
        this.loading = [];
        loader().then((library) => {
            const saveLoading = this.loading;
            this.loading = undefined;
            let libraryWithParams = "setResponseParamsHandler" in library
                ? library
                : new BinaryLibraryAdapter(library);
            this.library = libraryWithParams;
            saveLoading === null || saveLoading === void 0 ? void 0 : saveLoading.forEach(x => x.resolve(libraryWithParams));
        }, (reason) => {
            const saveLoading = this.loading;
            this.loading = undefined;
            this.loadError = reason !== null && reason !== void 0 ? reason : undefined;
            saveLoading === null || saveLoading === void 0 ? void 0 : saveLoading.forEach(x => x.reject(reason));
        });
    }
    checkResponseHandler() {
        var _a, _b;
        const mustBeAssigned = (this.contextCount > 0) || (this.requests.size > 0);
        if (this.responseHandlerAssigned !== mustBeAssigned) {
            if (mustBeAssigned) {
                (_a = this.library) === null || _a === void 0 ? void 0 : _a.setResponseParamsHandler((requestId, params, responseType, finished) => this.handleLibraryResponse(requestId, params, responseType, finished));
            }
            else {
                (_b = this.library) === null || _b === void 0 ? void 0 : _b.setResponseParamsHandler();
            }
            this.responseHandlerAssigned = mustBeAssigned;
        }
    }
    createContext(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const lib = this.library || (yield this.loadRequired());
            this.contextCount += 1;
            return CommonBinaryBridge.parseResult(yield lib.createContext(JSON.stringify(config)));
        });
    }
    destroyContext(context) {
        var _a;
        this.contextCount = Math.max(this.contextCount - 1, 0);
        this.checkResponseHandler();
        (_a = this.library) === null || _a === void 0 ? void 0 : _a.destroyContext(context);
    }
    request(context, functionName, functionParams, responseHandler) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const lib = (_a = this.library) !== null && _a !== void 0 ? _a : yield this.loadRequired();
            return new Promise((resolve, reject) => {
                const request = {
                    resolve,
                    reject,
                    responseHandler,
                };
                const requestId = this.generateRequestId();
                this.requests.set(requestId, request);
                this.checkResponseHandler();
                lib.sendRequestParams(context, requestId, functionName, functionParams);
            });
        });
    }
    loadRequired() {
        if (this.library !== undefined) {
            return Promise.resolve(this.library);
        }
        if (this.loadError !== undefined) {
            return Promise.reject(this.loadError);
        }
        if (this.loading === undefined) {
            return Promise.reject(new errors_1.TonClientError(1, "TON Client binary library isn't set."));
        }
        return new Promise((resolve, reject) => {
            var _a;
            (_a = this.loading) === null || _a === void 0 ? void 0 : _a.push({
                resolve,
                reject,
            });
        });
    }
    generateRequestId() {
        const id = this.nextRequestId;
        do {
            this.nextRequestId += 1;
            if (this.nextRequestId >= Number.MAX_SAFE_INTEGER) {
                this.nextRequestId = 1;
            }
        } while (this.requests.has(this.nextRequestId));
        return id;
    }
    handleLibraryResponse(requestId, params, responseType, finished) {
        const request = this.requests.get(requestId);
        if (!request) {
            return;
        }
        if (finished) {
            this.requests.delete(requestId);
            this.checkResponseHandler();
        }
        switch (responseType) {
            case ResponseType.Success:
                request.resolve(params);
                break;
            case ResponseType.Error:
                request.reject(params);
                break;
            default:
                const isAppObjectOrCustom = responseType === ResponseType.AppNotify
                    || responseType === ResponseType.AppRequest
                    || responseType >= ResponseType.Custom;
                if (isAppObjectOrCustom && request.responseHandler) {
                    request.responseHandler(params, responseType);
                }
        }
    }
    static parseResult(resultJson) {
        const result = JSON.parse(resultJson);
        if ("error" in result) {
            throw new errors_1.TonClientError(result.error.code, result.error.message, result.error.data);
        }
        return result.result;
    }
}
exports.CommonBinaryBridge = CommonBinaryBridge;
//# sourceMappingURL=bin.js.map

/***/ }),

/***/ "./node_modules/@eversdk/core/dist/client.js":
/*!***************************************************!*\
  !*** ./node_modules/@eversdk/core/dist/client.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright 2018-2020 TON Labs LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 *
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TonClient = void 0;
const modules_1 = __webpack_require__(/*! ./modules */ "./node_modules/@eversdk/core/dist/modules.js");
const bin_1 = __webpack_require__(/*! ./bin */ "./node_modules/@eversdk/core/dist/bin.js");
class TonClient {
    constructor(config) {
        this.context = undefined;
        this.contextCreation = undefined;
        this.contextError = undefined;
        this.config = config !== null && config !== void 0 ? config : {};
        this.client = new modules_1.ClientModule(this);
        this.crypto = new modules_1.CryptoModule(this);
        this.abi = new modules_1.AbiModule(this);
        this.boc = new modules_1.BocModule(this);
        this.processing = new modules_1.ProcessingModule(this);
        this.utils = new modules_1.UtilsModule(this);
        this.net = new modules_1.NetModule(this);
        this.tvm = new modules_1.TvmModule(this);
        this.proofs = new modules_1.ProofsModule(this);
    }
    static set default(client) {
        this._default = client;
    }
    static get default() {
        if (this._default === null) {
            this._default = new TonClient(this._defaultConfig);
        }
        return this._default;
    }
    static set defaultConfig(config) {
        this._defaultConfig = config;
    }
    static get defaultConfig() {
        return this._defaultConfig;
    }
    static useBinaryLibrary(loader) {
        (0, bin_1.useLibrary)(loader);
    }
    static toKey(d) {
        return toHex(d, 256);
    }
    static toHash64(d) {
        return toHex(d, 64);
    }
    static toHash128(d) {
        return toHex(d, 128);
    }
    static toHash256(d) {
        return toHex(d, 256);
    }
    static toHash512(d) {
        return toHex(d, 512);
    }
    static toHex(dec, bits = 0) {
        return toHex(dec, bits);
    }
    close() {
        const context = this.context;
        if (context !== undefined) {
            this.context = undefined;
            (0, bin_1.getBridge)().destroyContext(context);
        }
    }
    resolveError(functionName, params, err) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (err.code !== 23 || !((_a = err.data) === null || _a === void 0 ? void 0 : _a.suggest_use_helper_for)) {
                return err;
            }
            try {
                const [modName, funcName] = functionName.split(".");
                const api = (yield this.client.get_api_reference()).api;
                const allTypesArray = api.modules.reduce((accumulator, element) => accumulator.concat(element.types), []);
                const allTypesDict = {};
                allTypesArray.forEach((element) => allTypesDict[element.name] = element);
                const module = api.modules.find((x) => x.name === modName);
                const func = module.functions.find((x) => x.name === funcName);
                const param = func.params[1];
                // If there is only context param (or AppObject second param), there is nothing to analyze
                if (!param || param.generic_name == "AppObject") {
                    return err;
                }
                const paramTypeInfo = allTypesDict[param.ref_name];
                walkParameters(paramTypeInfo, params, "");
                function walkParameters(valueTypeInfo, value, path) {
                    switch (valueTypeInfo.type) {
                        case "Array":
                            if (Array.isArray(value)) {
                                value.forEach(v => walkParameters(valueTypeInfo.array_item, v, `${path}[i]`));
                            }
                            break;
                        case "Struct":
                            valueTypeInfo.struct_fields.forEach((sf) => walkParameters(sf, value[sf.name], path ? `${path}.${sf.name}` : sf.name));
                            break;
                        case "Optional":
                            if (value) {
                                walkParameters(valueTypeInfo.optional_inner, value, path);
                            }
                            break;
                        case "Ref":
                            if (valueTypeInfo.ref_name != "Value" &&
                                valueTypeInfo.ref_name != "API" &&
                                valueTypeInfo.ref_name != "AbiParam") {
                                walkParameters(allTypesDict[valueTypeInfo.ref_name], value, path);
                            }
                            break;
                        case "EnumOfTypes":
                            if (valueTypeInfo.enum_types.some((et) => et.name == value.type)) {
                                return;
                            }
                            let parameterName = valueTypeInfo.name.toLowerCase();
                            let helperFunctions = [];
                            valueTypeInfo.enum_types.forEach((et) => helperFunctions.push(parameterName + et.name));
                            err.message = `Consider using one of the helper methods (${helperFunctions.join(", ")}) for the \"${path}\" parameter\n` + err.message;
                            break;
                        default:
                            break;
                    }
                }
            }
            catch (e) {
                err.message = (_b = e.message) !== null && _b !== void 0 ? _b : `${e}`;
            }
            return err;
        });
    }
    contextRequired() {
        if (this.context !== undefined) {
            return Promise.resolve(this.context);
        }
        if (this.contextError !== undefined) {
            return Promise.reject(this.contextError);
        }
        if (this.contextCreation === undefined) {
            this.contextCreation = [];
            (0, bin_1.getBridge)().createContext(this.config).then((context) => {
                const creation = this.contextCreation;
                this.contextCreation = undefined;
                this.context = context;
                creation === null || creation === void 0 ? void 0 : creation.forEach(x => x.resolve(context));
            }, (reason) => {
                const creation = this.contextCreation;
                this.contextCreation = undefined;
                this.contextError = reason !== null && reason !== void 0 ? reason : undefined;
                creation === null || creation === void 0 ? void 0 : creation.forEach(x => x.reject(reason));
            });
        }
        return new Promise((resolve, reject) => {
            var _a;
            (_a = this.contextCreation) === null || _a === void 0 ? void 0 : _a.push({
                resolve,
                reject,
            });
        });
    }
    request(functionName, functionParams, responseHandler) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const context = (_a = this.context) !== null && _a !== void 0 ? _a : yield this.contextRequired();
            return (0, bin_1.getBridge)()
                .request(context, functionName, functionParams, responseHandler !== null && responseHandler !== void 0 ? responseHandler : (() => {
            }))
                .catch((reason) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.resolveError(functionName, functionParams, reason);
            }));
        });
    }
    resolve_app_request(app_request_id, result) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app_request_id) {
                yield this.client.resolve_app_request({
                    app_request_id,
                    result: {
                        type: "Ok",
                        result,
                    },
                });
            }
        });
    }
    reject_app_request(app_request_id, error) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app_request_id) {
                yield this.client.resolve_app_request({
                    app_request_id,
                    result: {
                        type: "Error",
                        text: error.message,
                    },
                });
            }
        });
    }
}
exports.TonClient = TonClient;
TonClient._defaultConfig = {};
TonClient._default = null;
// Converts value to hex
function toHex(value, bits) {
    let hex;
    if (typeof value === "number" || typeof value === "bigint") {
        hex = value.toString(16);
    }
    else if (typeof value === "string") {
        if (value.startsWith("0x")) {
            hex = value.substring(2);
        }
        else {
            hex = decToHex(value);
        }
    }
    else {
        hex = value.toString();
    }
    let len = bits / 4;
    while (hex.length > len && hex.startsWith("0")) {
        hex = hex.substring(1);
    }
    return hex.padStart(len, "0");
}
function decToHex(dec) {
    var _a;
    let bigNum = [];
    for (let i = 0; i < dec.length; i += 1) {
        const d = ((_a = dec.codePointAt(i)) !== null && _a !== void 0 ? _a : 0) - 48;
        const mul8 = shl(bigNum, 3);
        const mul2 = shl(bigNum, 1);
        const mul10 = add(mul8, mul2);
        bigNum = add(mul10, [d]);
    }
    let hex = "";
    for (let i = bigNum.length - 1; i >= 0; i -= 1) {
        hex += bigNum[i].toString(16).padStart(4, "0");
    }
    return hex;
}
function shl(bigNum, bits) {
    let rest = 0;
    const result = [];
    for (let i = 0; i < bigNum.length; i += 1) {
        let v = (bigNum[i] << bits) + rest;
        result.push(v & 0xFFFF);
        rest = (v >> 16) & 0xFFFF;
    }
    if (rest > 0) {
        result.push(rest);
    }
    return result;
}
function add(a, b) {
    let rest = 0;
    const result = [];
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
        let v = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0) + rest;
        result.push(v & 0xFFFF);
        rest = (v >> 16) & 0xFFFF;
    }
    if (rest > 0) {
        result.push(rest);
    }
    return result;
}
//# sourceMappingURL=client.js.map

/***/ }),

/***/ "./node_modules/@eversdk/core/dist/errors.js":
/*!***************************************************!*\
  !*** ./node_modules/@eversdk/core/dist/errors.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TonClientError = void 0;
class TonClientError extends Error {
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
    }
}
exports.TonClientError = TonClientError;
//# sourceMappingURL=errors.js.map

/***/ }),

/***/ "./node_modules/@eversdk/core/dist/index.js":
/*!**************************************************!*\
  !*** ./node_modules/@eversdk/core/dist/index.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./modules */ "./node_modules/@eversdk/core/dist/modules.js"), exports);
__exportStar(__webpack_require__(/*! ./client */ "./node_modules/@eversdk/core/dist/client.js"), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@eversdk/core/dist/modules.js":
/*!****************************************************!*\
  !*** ./node_modules/@eversdk/core/dist/modules.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.builderOpInteger = exports.BocErrorCode = exports.bocCacheTypeUnpinned = exports.bocCacheTypePinned = exports.AbiModule = exports.messageSourceEncodingParams = exports.messageSourceEncoded = exports.stateInitSourceTvc = exports.stateInitSourceStateInit = exports.stateInitSourceMessage = exports.MessageBodyType = exports.signerSigningBox = exports.signerKeys = exports.signerExternal = exports.signerNone = exports.abiSerialized = exports.abiHandle = exports.abiJson = exports.abiContract = exports.AbiErrorCode = exports.CryptoModule = exports.resultOfAppEncryptionBoxDecrypt = exports.resultOfAppEncryptionBoxEncrypt = exports.resultOfAppEncryptionBoxGetInfo = exports.paramsOfAppEncryptionBoxDecrypt = exports.paramsOfAppEncryptionBoxEncrypt = exports.paramsOfAppEncryptionBoxGetInfo = exports.resultOfAppSigningBoxSign = exports.resultOfAppSigningBoxGetPublicKey = exports.paramsOfAppSigningBoxSign = exports.paramsOfAppSigningBoxGetPublicKey = exports.resultOfAppPasswordProviderGetPassword = exports.paramsOfAppPasswordProviderGetPassword = exports.boxEncryptionAlgorithmNaclSecretBox = exports.boxEncryptionAlgorithmNaclBox = exports.boxEncryptionAlgorithmChaCha20 = exports.cryptoBoxSecretEncryptedSecret = exports.cryptoBoxSecretPredefinedSeedPhrase = exports.cryptoBoxSecretRandomSeedPhrase = exports.CipherMode = exports.encryptionAlgorithmNaclSecretBox = exports.encryptionAlgorithmNaclBox = exports.encryptionAlgorithmChaCha20 = exports.encryptionAlgorithmAES = exports.CryptoErrorCode = exports.ClientModule = exports.appRequestResultOk = exports.appRequestResultError = exports.NetworkQueriesProtocol = exports.ClientErrorCode = void 0;
exports.resultOfAppDebotBrowserInput = exports.paramsOfAppDebotBrowserApprove = exports.paramsOfAppDebotBrowserSend = exports.paramsOfAppDebotBrowserInvokeDebot = exports.paramsOfAppDebotBrowserGetSigningBox = exports.paramsOfAppDebotBrowserInput = exports.paramsOfAppDebotBrowserShowAction = exports.paramsOfAppDebotBrowserSwitchCompleted = exports.paramsOfAppDebotBrowserSwitch = exports.paramsOfAppDebotBrowserLog = exports.debotActivityTransaction = exports.DebotErrorCode = exports.NetModule = exports.AggregationFn = exports.paramsOfQueryOperationQueryCounterparties = exports.paramsOfQueryOperationAggregateCollection = exports.paramsOfQueryOperationWaitForCollection = exports.paramsOfQueryOperationQueryCollection = exports.SortDirection = exports.NetErrorCode = exports.TvmModule = exports.accountForExecutorAccount = exports.accountForExecutorUninit = exports.accountForExecutorNone = exports.TvmErrorCode = exports.UtilsModule = exports.AccountAddressType = exports.addressStringFormatBase64 = exports.addressStringFormatHex = exports.addressStringFormatAccountId = exports.ProcessingModule = exports.processingEventRempError = exports.processingEventRempOther = exports.processingEventRempIncludedIntoAcceptedBlock = exports.processingEventRempIncludedIntoBlock = exports.processingEventRempSentToValidators = exports.processingEventMessageExpired = exports.processingEventFetchNextBlockFailed = exports.processingEventWillFetchNextBlock = exports.processingEventSendFailed = exports.processingEventDidSend = exports.processingEventWillSend = exports.processingEventFetchFirstBlockFailed = exports.processingEventWillFetchFirstBlock = exports.ProcessingErrorCode = exports.BocModule = exports.builderOpAddress = exports.builderOpCellBoc = exports.builderOpCell = exports.builderOpBitString = void 0;
exports.ProofsModule = exports.ProofsErrorCode = exports.DebotModule = exports.resultOfAppDebotBrowserApprove = exports.resultOfAppDebotBrowserInvokeDebot = exports.resultOfAppDebotBrowserGetSigningBox = void 0;
// client module
var ClientErrorCode;
(function (ClientErrorCode) {
    ClientErrorCode[ClientErrorCode["NotImplemented"] = 1] = "NotImplemented";
    ClientErrorCode[ClientErrorCode["InvalidHex"] = 2] = "InvalidHex";
    ClientErrorCode[ClientErrorCode["InvalidBase64"] = 3] = "InvalidBase64";
    ClientErrorCode[ClientErrorCode["InvalidAddress"] = 4] = "InvalidAddress";
    ClientErrorCode[ClientErrorCode["CallbackParamsCantBeConvertedToJson"] = 5] = "CallbackParamsCantBeConvertedToJson";
    ClientErrorCode[ClientErrorCode["WebsocketConnectError"] = 6] = "WebsocketConnectError";
    ClientErrorCode[ClientErrorCode["WebsocketReceiveError"] = 7] = "WebsocketReceiveError";
    ClientErrorCode[ClientErrorCode["WebsocketSendError"] = 8] = "WebsocketSendError";
    ClientErrorCode[ClientErrorCode["HttpClientCreateError"] = 9] = "HttpClientCreateError";
    ClientErrorCode[ClientErrorCode["HttpRequestCreateError"] = 10] = "HttpRequestCreateError";
    ClientErrorCode[ClientErrorCode["HttpRequestSendError"] = 11] = "HttpRequestSendError";
    ClientErrorCode[ClientErrorCode["HttpRequestParseError"] = 12] = "HttpRequestParseError";
    ClientErrorCode[ClientErrorCode["CallbackNotRegistered"] = 13] = "CallbackNotRegistered";
    ClientErrorCode[ClientErrorCode["NetModuleNotInit"] = 14] = "NetModuleNotInit";
    ClientErrorCode[ClientErrorCode["InvalidConfig"] = 15] = "InvalidConfig";
    ClientErrorCode[ClientErrorCode["CannotCreateRuntime"] = 16] = "CannotCreateRuntime";
    ClientErrorCode[ClientErrorCode["InvalidContextHandle"] = 17] = "InvalidContextHandle";
    ClientErrorCode[ClientErrorCode["CannotSerializeResult"] = 18] = "CannotSerializeResult";
    ClientErrorCode[ClientErrorCode["CannotSerializeError"] = 19] = "CannotSerializeError";
    ClientErrorCode[ClientErrorCode["CannotConvertJsValueToJson"] = 20] = "CannotConvertJsValueToJson";
    ClientErrorCode[ClientErrorCode["CannotReceiveSpawnedResult"] = 21] = "CannotReceiveSpawnedResult";
    ClientErrorCode[ClientErrorCode["SetTimerError"] = 22] = "SetTimerError";
    ClientErrorCode[ClientErrorCode["InvalidParams"] = 23] = "InvalidParams";
    ClientErrorCode[ClientErrorCode["ContractsAddressConversionFailed"] = 24] = "ContractsAddressConversionFailed";
    ClientErrorCode[ClientErrorCode["UnknownFunction"] = 25] = "UnknownFunction";
    ClientErrorCode[ClientErrorCode["AppRequestError"] = 26] = "AppRequestError";
    ClientErrorCode[ClientErrorCode["NoSuchRequest"] = 27] = "NoSuchRequest";
    ClientErrorCode[ClientErrorCode["CanNotSendRequestResult"] = 28] = "CanNotSendRequestResult";
    ClientErrorCode[ClientErrorCode["CanNotReceiveRequestResult"] = 29] = "CanNotReceiveRequestResult";
    ClientErrorCode[ClientErrorCode["CanNotParseRequestResult"] = 30] = "CanNotParseRequestResult";
    ClientErrorCode[ClientErrorCode["UnexpectedCallbackResponse"] = 31] = "UnexpectedCallbackResponse";
    ClientErrorCode[ClientErrorCode["CanNotParseNumber"] = 32] = "CanNotParseNumber";
    ClientErrorCode[ClientErrorCode["InternalError"] = 33] = "InternalError";
    ClientErrorCode[ClientErrorCode["InvalidHandle"] = 34] = "InvalidHandle";
    ClientErrorCode[ClientErrorCode["LocalStorageError"] = 35] = "LocalStorageError";
})(ClientErrorCode = exports.ClientErrorCode || (exports.ClientErrorCode = {}));
/**
 * Network protocol used to perform GraphQL queries.
 */
var NetworkQueriesProtocol;
(function (NetworkQueriesProtocol) {
    NetworkQueriesProtocol["HTTP"] = "HTTP";
    NetworkQueriesProtocol["WS"] = "WS";
})(NetworkQueriesProtocol = exports.NetworkQueriesProtocol || (exports.NetworkQueriesProtocol = {}));
function appRequestResultError(text) {
    return {
        type: 'Error',
        text,
    };
}
exports.appRequestResultError = appRequestResultError;
function appRequestResultOk(result) {
    return {
        type: 'Ok',
        result,
    };
}
exports.appRequestResultOk = appRequestResultOk;
/**
 * Provides information about library.
 */
class ClientModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Returns Core Library API reference
     * @returns ResultOfGetApiReference
     */
    get_api_reference() {
        return this.client.request('client.get_api_reference');
    }
    /**
     * Returns Core Library version
     * @returns ResultOfVersion
     */
    version() {
        return this.client.request('client.version');
    }
    /**
     * Returns Core Library API reference
     * @returns ClientConfig
     */
    config() {
        return this.client.request('client.config');
    }
    /**
     * Returns detailed information about this build.
     * @returns ResultOfBuildInfo
     */
    build_info() {
        return this.client.request('client.build_info');
    }
    /**
     * Resolves application request processing result
     *
     * @param {ParamsOfResolveAppRequest} params
     * @returns
     */
    resolve_app_request(params) {
        return this.client.request('client.resolve_app_request', params);
    }
}
exports.ClientModule = ClientModule;
// crypto module
var CryptoErrorCode;
(function (CryptoErrorCode) {
    CryptoErrorCode[CryptoErrorCode["InvalidPublicKey"] = 100] = "InvalidPublicKey";
    CryptoErrorCode[CryptoErrorCode["InvalidSecretKey"] = 101] = "InvalidSecretKey";
    CryptoErrorCode[CryptoErrorCode["InvalidKey"] = 102] = "InvalidKey";
    CryptoErrorCode[CryptoErrorCode["InvalidFactorizeChallenge"] = 106] = "InvalidFactorizeChallenge";
    CryptoErrorCode[CryptoErrorCode["InvalidBigInt"] = 107] = "InvalidBigInt";
    CryptoErrorCode[CryptoErrorCode["ScryptFailed"] = 108] = "ScryptFailed";
    CryptoErrorCode[CryptoErrorCode["InvalidKeySize"] = 109] = "InvalidKeySize";
    CryptoErrorCode[CryptoErrorCode["NaclSecretBoxFailed"] = 110] = "NaclSecretBoxFailed";
    CryptoErrorCode[CryptoErrorCode["NaclBoxFailed"] = 111] = "NaclBoxFailed";
    CryptoErrorCode[CryptoErrorCode["NaclSignFailed"] = 112] = "NaclSignFailed";
    CryptoErrorCode[CryptoErrorCode["Bip39InvalidEntropy"] = 113] = "Bip39InvalidEntropy";
    CryptoErrorCode[CryptoErrorCode["Bip39InvalidPhrase"] = 114] = "Bip39InvalidPhrase";
    CryptoErrorCode[CryptoErrorCode["Bip32InvalidKey"] = 115] = "Bip32InvalidKey";
    CryptoErrorCode[CryptoErrorCode["Bip32InvalidDerivePath"] = 116] = "Bip32InvalidDerivePath";
    CryptoErrorCode[CryptoErrorCode["Bip39InvalidDictionary"] = 117] = "Bip39InvalidDictionary";
    CryptoErrorCode[CryptoErrorCode["Bip39InvalidWordCount"] = 118] = "Bip39InvalidWordCount";
    CryptoErrorCode[CryptoErrorCode["MnemonicGenerationFailed"] = 119] = "MnemonicGenerationFailed";
    CryptoErrorCode[CryptoErrorCode["MnemonicFromEntropyFailed"] = 120] = "MnemonicFromEntropyFailed";
    CryptoErrorCode[CryptoErrorCode["SigningBoxNotRegistered"] = 121] = "SigningBoxNotRegistered";
    CryptoErrorCode[CryptoErrorCode["InvalidSignature"] = 122] = "InvalidSignature";
    CryptoErrorCode[CryptoErrorCode["EncryptionBoxNotRegistered"] = 123] = "EncryptionBoxNotRegistered";
    CryptoErrorCode[CryptoErrorCode["InvalidIvSize"] = 124] = "InvalidIvSize";
    CryptoErrorCode[CryptoErrorCode["UnsupportedCipherMode"] = 125] = "UnsupportedCipherMode";
    CryptoErrorCode[CryptoErrorCode["CannotCreateCipher"] = 126] = "CannotCreateCipher";
    CryptoErrorCode[CryptoErrorCode["EncryptDataError"] = 127] = "EncryptDataError";
    CryptoErrorCode[CryptoErrorCode["DecryptDataError"] = 128] = "DecryptDataError";
    CryptoErrorCode[CryptoErrorCode["IvRequired"] = 129] = "IvRequired";
    CryptoErrorCode[CryptoErrorCode["CryptoBoxNotRegistered"] = 130] = "CryptoBoxNotRegistered";
    CryptoErrorCode[CryptoErrorCode["InvalidCryptoBoxType"] = 131] = "InvalidCryptoBoxType";
    CryptoErrorCode[CryptoErrorCode["CryptoBoxSecretSerializationError"] = 132] = "CryptoBoxSecretSerializationError";
    CryptoErrorCode[CryptoErrorCode["CryptoBoxSecretDeserializationError"] = 133] = "CryptoBoxSecretDeserializationError";
    CryptoErrorCode[CryptoErrorCode["InvalidNonceSize"] = 134] = "InvalidNonceSize";
})(CryptoErrorCode = exports.CryptoErrorCode || (exports.CryptoErrorCode = {}));
function encryptionAlgorithmAES(value) {
    return {
        type: 'AES',
        value,
    };
}
exports.encryptionAlgorithmAES = encryptionAlgorithmAES;
function encryptionAlgorithmChaCha20(value) {
    return {
        type: 'ChaCha20',
        value,
    };
}
exports.encryptionAlgorithmChaCha20 = encryptionAlgorithmChaCha20;
function encryptionAlgorithmNaclBox(value) {
    return {
        type: 'NaclBox',
        value,
    };
}
exports.encryptionAlgorithmNaclBox = encryptionAlgorithmNaclBox;
function encryptionAlgorithmNaclSecretBox(value) {
    return {
        type: 'NaclSecretBox',
        value,
    };
}
exports.encryptionAlgorithmNaclSecretBox = encryptionAlgorithmNaclSecretBox;
var CipherMode;
(function (CipherMode) {
    CipherMode["CBC"] = "CBC";
    CipherMode["CFB"] = "CFB";
    CipherMode["CTR"] = "CTR";
    CipherMode["ECB"] = "ECB";
    CipherMode["OFB"] = "OFB";
})(CipherMode = exports.CipherMode || (exports.CipherMode = {}));
function cryptoBoxSecretRandomSeedPhrase(dictionary, wordcount) {
    return {
        type: 'RandomSeedPhrase',
        dictionary,
        wordcount,
    };
}
exports.cryptoBoxSecretRandomSeedPhrase = cryptoBoxSecretRandomSeedPhrase;
function cryptoBoxSecretPredefinedSeedPhrase(phrase, dictionary, wordcount) {
    return {
        type: 'PredefinedSeedPhrase',
        phrase,
        dictionary,
        wordcount,
    };
}
exports.cryptoBoxSecretPredefinedSeedPhrase = cryptoBoxSecretPredefinedSeedPhrase;
function cryptoBoxSecretEncryptedSecret(encrypted_secret) {
    return {
        type: 'EncryptedSecret',
        encrypted_secret,
    };
}
exports.cryptoBoxSecretEncryptedSecret = cryptoBoxSecretEncryptedSecret;
function boxEncryptionAlgorithmChaCha20(value) {
    return {
        type: 'ChaCha20',
        value,
    };
}
exports.boxEncryptionAlgorithmChaCha20 = boxEncryptionAlgorithmChaCha20;
function boxEncryptionAlgorithmNaclBox(value) {
    return {
        type: 'NaclBox',
        value,
    };
}
exports.boxEncryptionAlgorithmNaclBox = boxEncryptionAlgorithmNaclBox;
function boxEncryptionAlgorithmNaclSecretBox(value) {
    return {
        type: 'NaclSecretBox',
        value,
    };
}
exports.boxEncryptionAlgorithmNaclSecretBox = boxEncryptionAlgorithmNaclSecretBox;
function paramsOfAppPasswordProviderGetPassword(encryption_public_key) {
    return {
        type: 'GetPassword',
        encryption_public_key,
    };
}
exports.paramsOfAppPasswordProviderGetPassword = paramsOfAppPasswordProviderGetPassword;
function resultOfAppPasswordProviderGetPassword(encrypted_password, app_encryption_pubkey) {
    return {
        type: 'GetPassword',
        encrypted_password,
        app_encryption_pubkey,
    };
}
exports.resultOfAppPasswordProviderGetPassword = resultOfAppPasswordProviderGetPassword;
function paramsOfAppSigningBoxGetPublicKey() {
    return {
        type: 'GetPublicKey',
    };
}
exports.paramsOfAppSigningBoxGetPublicKey = paramsOfAppSigningBoxGetPublicKey;
function paramsOfAppSigningBoxSign(unsigned) {
    return {
        type: 'Sign',
        unsigned,
    };
}
exports.paramsOfAppSigningBoxSign = paramsOfAppSigningBoxSign;
function resultOfAppSigningBoxGetPublicKey(public_key) {
    return {
        type: 'GetPublicKey',
        public_key,
    };
}
exports.resultOfAppSigningBoxGetPublicKey = resultOfAppSigningBoxGetPublicKey;
function resultOfAppSigningBoxSign(signature) {
    return {
        type: 'Sign',
        signature,
    };
}
exports.resultOfAppSigningBoxSign = resultOfAppSigningBoxSign;
function paramsOfAppEncryptionBoxGetInfo() {
    return {
        type: 'GetInfo',
    };
}
exports.paramsOfAppEncryptionBoxGetInfo = paramsOfAppEncryptionBoxGetInfo;
function paramsOfAppEncryptionBoxEncrypt(data) {
    return {
        type: 'Encrypt',
        data,
    };
}
exports.paramsOfAppEncryptionBoxEncrypt = paramsOfAppEncryptionBoxEncrypt;
function paramsOfAppEncryptionBoxDecrypt(data) {
    return {
        type: 'Decrypt',
        data,
    };
}
exports.paramsOfAppEncryptionBoxDecrypt = paramsOfAppEncryptionBoxDecrypt;
function resultOfAppEncryptionBoxGetInfo(info) {
    return {
        type: 'GetInfo',
        info,
    };
}
exports.resultOfAppEncryptionBoxGetInfo = resultOfAppEncryptionBoxGetInfo;
function resultOfAppEncryptionBoxEncrypt(data) {
    return {
        type: 'Encrypt',
        data,
    };
}
exports.resultOfAppEncryptionBoxEncrypt = resultOfAppEncryptionBoxEncrypt;
function resultOfAppEncryptionBoxDecrypt(data) {
    return {
        type: 'Decrypt',
        data,
    };
}
exports.resultOfAppEncryptionBoxDecrypt = resultOfAppEncryptionBoxDecrypt;
function dispatchAppPasswordProvider(obj, params, app_request_id, client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = {};
            switch (params.type) {
                case 'GetPassword':
                    result = yield obj.get_password(params);
                    break;
            }
            client.resolve_app_request(app_request_id, Object.assign({ type: params.type }, result));
        }
        catch (error) {
            client.reject_app_request(app_request_id, error);
        }
    });
}
function dispatchAppSigningBox(obj, params, app_request_id, client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = {};
            switch (params.type) {
                case 'GetPublicKey':
                    result = yield obj.get_public_key();
                    break;
                case 'Sign':
                    result = yield obj.sign(params);
                    break;
            }
            client.resolve_app_request(app_request_id, Object.assign({ type: params.type }, result));
        }
        catch (error) {
            client.reject_app_request(app_request_id, error);
        }
    });
}
function dispatchAppEncryptionBox(obj, params, app_request_id, client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = {};
            switch (params.type) {
                case 'GetInfo':
                    result = yield obj.get_info();
                    break;
                case 'Encrypt':
                    result = yield obj.encrypt(params);
                    break;
                case 'Decrypt':
                    result = yield obj.decrypt(params);
                    break;
            }
            client.resolve_app_request(app_request_id, Object.assign({ type: params.type }, result));
        }
        catch (error) {
            client.reject_app_request(app_request_id, error);
        }
    });
}
/**
 * Crypto functions.
 */
class CryptoModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Integer factorization
     *
     * @remarks
     * Performs prime factorization – decomposition of a composite number
     * into a product of smaller prime integers (factors).
     * See [https://en.wikipedia.org/wiki/Integer_factorization]
     *
     * @param {ParamsOfFactorize} params
     * @returns ResultOfFactorize
     */
    factorize(params) {
        return this.client.request('crypto.factorize', params);
    }
    /**
     * Modular exponentiation
     *
     * @remarks
     * Performs modular exponentiation for big integers (`base`^`exponent` mod `modulus`).
     * See [https://en.wikipedia.org/wiki/Modular_exponentiation]
     *
     * @param {ParamsOfModularPower} params
     * @returns ResultOfModularPower
     */
    modular_power(params) {
        return this.client.request('crypto.modular_power', params);
    }
    /**
     * Calculates CRC16 using TON algorithm.
     *
     * @param {ParamsOfTonCrc16} params
     * @returns ResultOfTonCrc16
     */
    ton_crc16(params) {
        return this.client.request('crypto.ton_crc16', params);
    }
    /**
     * Generates random byte array of the specified length and returns it in `base64` format
     *
     * @param {ParamsOfGenerateRandomBytes} params
     * @returns ResultOfGenerateRandomBytes
     */
    generate_random_bytes(params) {
        return this.client.request('crypto.generate_random_bytes', params);
    }
    /**
     * Converts public key to ton safe_format
     *
     * @param {ParamsOfConvertPublicKeyToTonSafeFormat} params
     * @returns ResultOfConvertPublicKeyToTonSafeFormat
     */
    convert_public_key_to_ton_safe_format(params) {
        return this.client.request('crypto.convert_public_key_to_ton_safe_format', params);
    }
    /**
     * Generates random ed25519 key pair.
     * @returns KeyPair
     */
    generate_random_sign_keys() {
        return this.client.request('crypto.generate_random_sign_keys');
    }
    /**
     * Signs a data using the provided keys.
     *
     * @param {ParamsOfSign} params
     * @returns ResultOfSign
     */
    sign(params) {
        return this.client.request('crypto.sign', params);
    }
    /**
     * Verifies signed data using the provided public key. Raises error if verification is failed.
     *
     * @param {ParamsOfVerifySignature} params
     * @returns ResultOfVerifySignature
     */
    verify_signature(params) {
        return this.client.request('crypto.verify_signature', params);
    }
    /**
     * Calculates SHA256 hash of the specified data.
     *
     * @param {ParamsOfHash} params
     * @returns ResultOfHash
     */
    sha256(params) {
        return this.client.request('crypto.sha256', params);
    }
    /**
     * Calculates SHA512 hash of the specified data.
     *
     * @param {ParamsOfHash} params
     * @returns ResultOfHash
     */
    sha512(params) {
        return this.client.request('crypto.sha512', params);
    }
    /**
     * Perform `scrypt` encryption
     *
     * @remarks
     * Derives key from `password` and `key` using `scrypt` algorithm.
     * See [https://en.wikipedia.org/wiki/Scrypt].
     *
     * # Arguments
     * - `log_n` - The log2 of the Scrypt parameter `N`
     * - `r` - The Scrypt parameter `r`
     * - `p` - The Scrypt parameter `p`
     * # Conditions
     * - `log_n` must be less than `64`
     * - `r` must be greater than `0` and less than or equal to `4294967295`
     * - `p` must be greater than `0` and less than `4294967295`
     * # Recommended values sufficient for most use-cases
     * - `log_n = 15` (`n = 32768`)
     * - `r = 8`
     * - `p = 1`
     *
     * @param {ParamsOfScrypt} params
     * @returns ResultOfScrypt
     */
    scrypt(params) {
        return this.client.request('crypto.scrypt', params);
    }
    /**
     * Generates a key pair for signing from the secret key
     *
     * @remarks
     * **NOTE:** In the result the secret key is actually the concatenation
     * of secret and public keys (128 symbols hex string) by design of [NaCL](http://nacl.cr.yp.to/sign.html).
     * See also [the stackexchange question](https://crypto.stackexchange.com/questions/54353/).
     *
     * @param {ParamsOfNaclSignKeyPairFromSecret} params
     * @returns KeyPair
     */
    nacl_sign_keypair_from_secret_key(params) {
        return this.client.request('crypto.nacl_sign_keypair_from_secret_key', params);
    }
    /**
     * Signs data using the signer's secret key.
     *
     * @param {ParamsOfNaclSign} params
     * @returns ResultOfNaclSign
     */
    nacl_sign(params) {
        return this.client.request('crypto.nacl_sign', params);
    }
    /**
     * Verifies the signature and returns the unsigned message
     *
     * @remarks
     * Verifies the signature in `signed` using the signer's public key `public`
     * and returns the message `unsigned`.
     *
     * If the signature fails verification, crypto_sign_open raises an exception.
     *
     * @param {ParamsOfNaclSignOpen} params
     * @returns ResultOfNaclSignOpen
     */
    nacl_sign_open(params) {
        return this.client.request('crypto.nacl_sign_open', params);
    }
    /**
     * Signs the message using the secret key and returns a signature.
     *
     * @remarks
     * Signs the message `unsigned` using the secret key `secret`
     * and returns a signature `signature`.
     *
     * @param {ParamsOfNaclSign} params
     * @returns ResultOfNaclSignDetached
     */
    nacl_sign_detached(params) {
        return this.client.request('crypto.nacl_sign_detached', params);
    }
    /**
     * Verifies the signature with public key and `unsigned` data.
     *
     * @param {ParamsOfNaclSignDetachedVerify} params
     * @returns ResultOfNaclSignDetachedVerify
     */
    nacl_sign_detached_verify(params) {
        return this.client.request('crypto.nacl_sign_detached_verify', params);
    }
    /**
     * Generates a random NaCl key pair
     * @returns KeyPair
     */
    nacl_box_keypair() {
        return this.client.request('crypto.nacl_box_keypair');
    }
    /**
     * Generates key pair from a secret key
     *
     * @param {ParamsOfNaclBoxKeyPairFromSecret} params
     * @returns KeyPair
     */
    nacl_box_keypair_from_secret_key(params) {
        return this.client.request('crypto.nacl_box_keypair_from_secret_key', params);
    }
    /**
     * Public key authenticated encryption
     *
     * @remarks
     * Encrypt and authenticate a message using the senders secret key, the receivers public
     * key, and a nonce.
     *
     * @param {ParamsOfNaclBox} params
     * @returns ResultOfNaclBox
     */
    nacl_box(params) {
        return this.client.request('crypto.nacl_box', params);
    }
    /**
     * Decrypt and verify the cipher text using the receivers secret key, the senders public key, and the nonce.
     *
     * @param {ParamsOfNaclBoxOpen} params
     * @returns ResultOfNaclBoxOpen
     */
    nacl_box_open(params) {
        return this.client.request('crypto.nacl_box_open', params);
    }
    /**
     * Encrypt and authenticate message using nonce and secret key.
     *
     * @param {ParamsOfNaclSecretBox} params
     * @returns ResultOfNaclBox
     */
    nacl_secret_box(params) {
        return this.client.request('crypto.nacl_secret_box', params);
    }
    /**
     * Decrypts and verifies cipher text using `nonce` and secret `key`.
     *
     * @param {ParamsOfNaclSecretBoxOpen} params
     * @returns ResultOfNaclBoxOpen
     */
    nacl_secret_box_open(params) {
        return this.client.request('crypto.nacl_secret_box_open', params);
    }
    /**
     * Prints the list of words from the specified dictionary
     *
     * @param {ParamsOfMnemonicWords} params
     * @returns ResultOfMnemonicWords
     */
    mnemonic_words(params) {
        return this.client.request('crypto.mnemonic_words', params);
    }
    /**
     * Generates a random mnemonic
     *
     * @remarks
     * Generates a random mnemonic from the specified dictionary and word count
     *
     * @param {ParamsOfMnemonicFromRandom} params
     * @returns ResultOfMnemonicFromRandom
     */
    mnemonic_from_random(params) {
        return this.client.request('crypto.mnemonic_from_random', params);
    }
    /**
     * Generates mnemonic from pre-generated entropy
     *
     * @param {ParamsOfMnemonicFromEntropy} params
     * @returns ResultOfMnemonicFromEntropy
     */
    mnemonic_from_entropy(params) {
        return this.client.request('crypto.mnemonic_from_entropy', params);
    }
    /**
     * Validates a mnemonic phrase
     *
     * @remarks
     * The phrase supplied will be checked for word length and validated according to the checksum
     * specified in BIP0039.
     *
     * @param {ParamsOfMnemonicVerify} params
     * @returns ResultOfMnemonicVerify
     */
    mnemonic_verify(params) {
        return this.client.request('crypto.mnemonic_verify', params);
    }
    /**
     * Derives a key pair for signing from the seed phrase
     *
     * @remarks
     * Validates the seed phrase, generates master key and then derives
     * the key pair from the master key and the specified path
     *
     * @param {ParamsOfMnemonicDeriveSignKeys} params
     * @returns KeyPair
     */
    mnemonic_derive_sign_keys(params) {
        return this.client.request('crypto.mnemonic_derive_sign_keys', params);
    }
    /**
     * Generates an extended master private key that will be the root for all the derived keys
     *
     * @param {ParamsOfHDKeyXPrvFromMnemonic} params
     * @returns ResultOfHDKeyXPrvFromMnemonic
     */
    hdkey_xprv_from_mnemonic(params) {
        return this.client.request('crypto.hdkey_xprv_from_mnemonic', params);
    }
    /**
     * Returns extended private key derived from the specified extended private key and child index
     *
     * @param {ParamsOfHDKeyDeriveFromXPrv} params
     * @returns ResultOfHDKeyDeriveFromXPrv
     */
    hdkey_derive_from_xprv(params) {
        return this.client.request('crypto.hdkey_derive_from_xprv', params);
    }
    /**
     * Derives the extended private key from the specified key and path
     *
     * @param {ParamsOfHDKeyDeriveFromXPrvPath} params
     * @returns ResultOfHDKeyDeriveFromXPrvPath
     */
    hdkey_derive_from_xprv_path(params) {
        return this.client.request('crypto.hdkey_derive_from_xprv_path', params);
    }
    /**
     * Extracts the private key from the serialized extended private key
     *
     * @param {ParamsOfHDKeySecretFromXPrv} params
     * @returns ResultOfHDKeySecretFromXPrv
     */
    hdkey_secret_from_xprv(params) {
        return this.client.request('crypto.hdkey_secret_from_xprv', params);
    }
    /**
     * Extracts the public key from the serialized extended private key
     *
     * @param {ParamsOfHDKeyPublicFromXPrv} params
     * @returns ResultOfHDKeyPublicFromXPrv
     */
    hdkey_public_from_xprv(params) {
        return this.client.request('crypto.hdkey_public_from_xprv', params);
    }
    /**
     * Performs symmetric `chacha20` encryption.
     *
     * @param {ParamsOfChaCha20} params
     * @returns ResultOfChaCha20
     */
    chacha20(params) {
        return this.client.request('crypto.chacha20', params);
    }
    /**
     * Creates a Crypto Box instance.
     *
     * @remarks
     * Crypto Box is a root crypto object, that encapsulates some secret (seed phrase usually)
     * in encrypted form and acts as a factory for all crypto primitives used in SDK:
     * keys for signing and encryption, derived from this secret.
     *
     * Crypto Box encrypts original Seed Phrase with salt and password that is retrieved
     * from `password_provider` callback, implemented on Application side.
     *
     * When used, decrypted secret shows up in core library's memory for a very short period
     * of time and then is immediately overwritten with zeroes.
     *
     * @param {ParamsOfCreateCryptoBox} params
     * @returns RegisteredCryptoBox
     */
    create_crypto_box(params, obj) {
        return this.client.request('crypto.create_crypto_box', params, (params, responseType) => {
            if (responseType === 3) {
                dispatchAppPasswordProvider(obj, params.request_data, params.app_request_id, this.client);
            }
            else if (responseType === 4) {
                dispatchAppPasswordProvider(obj, params, null, this.client);
            }
        });
    }
    /**
     * Removes Crypto Box. Clears all secret data.
     *
     * @param {RegisteredCryptoBox} params
     * @returns
     */
    remove_crypto_box(params) {
        return this.client.request('crypto.remove_crypto_box', params);
    }
    /**
     * Get Crypto Box Info. Used to get `encrypted_secret` that should be used for all the cryptobox initializations except the first one.
     *
     * @param {RegisteredCryptoBox} params
     * @returns ResultOfGetCryptoBoxInfo
     */
    get_crypto_box_info(params) {
        return this.client.request('crypto.get_crypto_box_info', params);
    }
    /**
     * Get Crypto Box Seed Phrase.
     *
     * @remarks
     * Attention! Store this data in your application for a very short period of time and overwrite it with zeroes ASAP.
     *
     * @param {RegisteredCryptoBox} params
     * @returns ResultOfGetCryptoBoxSeedPhrase
     */
    get_crypto_box_seed_phrase(params) {
        return this.client.request('crypto.get_crypto_box_seed_phrase', params);
    }
    /**
     * Get handle of Signing Box derived from Crypto Box.
     *
     * @param {ParamsOfGetSigningBoxFromCryptoBox} params
     * @returns RegisteredSigningBox
     */
    get_signing_box_from_crypto_box(params) {
        return this.client.request('crypto.get_signing_box_from_crypto_box', params);
    }
    /**
     * Gets Encryption Box from Crypto Box.
     *
     * @remarks
     * Derives encryption keypair from cryptobox secret and hdpath and
     * stores it in cache for `secret_lifetime`
     * or until explicitly cleared by `clear_crypto_box_secret_cache` method.
     * If `secret_lifetime` is not specified - overwrites encryption secret with zeroes immediately after
     * encryption operation.
     *
     * @param {ParamsOfGetEncryptionBoxFromCryptoBox} params
     * @returns RegisteredEncryptionBox
     */
    get_encryption_box_from_crypto_box(params) {
        return this.client.request('crypto.get_encryption_box_from_crypto_box', params);
    }
    /**
     * Removes cached secrets (overwrites with zeroes) from all signing and encryption boxes, derived from crypto box.
     *
     * @param {RegisteredCryptoBox} params
     * @returns
     */
    clear_crypto_box_secret_cache(params) {
        return this.client.request('crypto.clear_crypto_box_secret_cache', params);
    }
    /**
     * Register an application implemented signing box.
     * @returns RegisteredSigningBox
     */
    register_signing_box(obj) {
        return this.client.request('crypto.register_signing_box', undefined, (params, responseType) => {
            if (responseType === 3) {
                dispatchAppSigningBox(obj, params.request_data, params.app_request_id, this.client);
            }
            else if (responseType === 4) {
                dispatchAppSigningBox(obj, params, null, this.client);
            }
        });
    }
    /**
     * Creates a default signing box implementation.
     *
     * @param {KeyPair} params
     * @returns RegisteredSigningBox
     */
    get_signing_box(params) {
        return this.client.request('crypto.get_signing_box', params);
    }
    /**
     * Returns public key of signing key pair.
     *
     * @param {RegisteredSigningBox} params
     * @returns ResultOfSigningBoxGetPublicKey
     */
    signing_box_get_public_key(params) {
        return this.client.request('crypto.signing_box_get_public_key', params);
    }
    /**
     * Returns signed user data.
     *
     * @param {ParamsOfSigningBoxSign} params
     * @returns ResultOfSigningBoxSign
     */
    signing_box_sign(params) {
        return this.client.request('crypto.signing_box_sign', params);
    }
    /**
     * Removes signing box from SDK.
     *
     * @param {RegisteredSigningBox} params
     * @returns
     */
    remove_signing_box(params) {
        return this.client.request('crypto.remove_signing_box', params);
    }
    /**
     * Register an application implemented encryption box.
     * @returns RegisteredEncryptionBox
     */
    register_encryption_box(obj) {
        return this.client.request('crypto.register_encryption_box', undefined, (params, responseType) => {
            if (responseType === 3) {
                dispatchAppEncryptionBox(obj, params.request_data, params.app_request_id, this.client);
            }
            else if (responseType === 4) {
                dispatchAppEncryptionBox(obj, params, null, this.client);
            }
        });
    }
    /**
     * Removes encryption box from SDK
     *
     * @param {RegisteredEncryptionBox} params
     * @returns
     */
    remove_encryption_box(params) {
        return this.client.request('crypto.remove_encryption_box', params);
    }
    /**
     * Queries info from the given encryption box
     *
     * @param {ParamsOfEncryptionBoxGetInfo} params
     * @returns ResultOfEncryptionBoxGetInfo
     */
    encryption_box_get_info(params) {
        return this.client.request('crypto.encryption_box_get_info', params);
    }
    /**
     * Encrypts data using given encryption box Note.
     *
     * @remarks
     * Block cipher algorithms pad data to cipher block size so encrypted data can be longer then original data. Client should store the original data size after encryption and use it after
     * decryption to retrieve the original data from decrypted data.
     *
     * @param {ParamsOfEncryptionBoxEncrypt} params
     * @returns ResultOfEncryptionBoxEncrypt
     */
    encryption_box_encrypt(params) {
        return this.client.request('crypto.encryption_box_encrypt', params);
    }
    /**
     * Decrypts data using given encryption box Note.
     *
     * @remarks
     * Block cipher algorithms pad data to cipher block size so encrypted data can be longer then original data. Client should store the original data size after encryption and use it after
     * decryption to retrieve the original data from decrypted data.
     *
     * @param {ParamsOfEncryptionBoxDecrypt} params
     * @returns ResultOfEncryptionBoxDecrypt
     */
    encryption_box_decrypt(params) {
        return this.client.request('crypto.encryption_box_decrypt', params);
    }
    /**
     * Creates encryption box with specified algorithm
     *
     * @param {ParamsOfCreateEncryptionBox} params
     * @returns RegisteredEncryptionBox
     */
    create_encryption_box(params) {
        return this.client.request('crypto.create_encryption_box', params);
    }
}
exports.CryptoModule = CryptoModule;
// abi module
var AbiErrorCode;
(function (AbiErrorCode) {
    AbiErrorCode[AbiErrorCode["RequiredAddressMissingForEncodeMessage"] = 301] = "RequiredAddressMissingForEncodeMessage";
    AbiErrorCode[AbiErrorCode["RequiredCallSetMissingForEncodeMessage"] = 302] = "RequiredCallSetMissingForEncodeMessage";
    AbiErrorCode[AbiErrorCode["InvalidJson"] = 303] = "InvalidJson";
    AbiErrorCode[AbiErrorCode["InvalidMessage"] = 304] = "InvalidMessage";
    AbiErrorCode[AbiErrorCode["EncodeDeployMessageFailed"] = 305] = "EncodeDeployMessageFailed";
    AbiErrorCode[AbiErrorCode["EncodeRunMessageFailed"] = 306] = "EncodeRunMessageFailed";
    AbiErrorCode[AbiErrorCode["AttachSignatureFailed"] = 307] = "AttachSignatureFailed";
    AbiErrorCode[AbiErrorCode["InvalidTvcImage"] = 308] = "InvalidTvcImage";
    AbiErrorCode[AbiErrorCode["RequiredPublicKeyMissingForFunctionHeader"] = 309] = "RequiredPublicKeyMissingForFunctionHeader";
    AbiErrorCode[AbiErrorCode["InvalidSigner"] = 310] = "InvalidSigner";
    AbiErrorCode[AbiErrorCode["InvalidAbi"] = 311] = "InvalidAbi";
    AbiErrorCode[AbiErrorCode["InvalidFunctionId"] = 312] = "InvalidFunctionId";
    AbiErrorCode[AbiErrorCode["InvalidData"] = 313] = "InvalidData";
    AbiErrorCode[AbiErrorCode["EncodeInitialDataFailed"] = 314] = "EncodeInitialDataFailed";
    AbiErrorCode[AbiErrorCode["InvalidFunctionName"] = 315] = "InvalidFunctionName";
})(AbiErrorCode = exports.AbiErrorCode || (exports.AbiErrorCode = {}));
function abiContract(value) {
    return {
        type: 'Contract',
        value,
    };
}
exports.abiContract = abiContract;
function abiJson(value) {
    return {
        type: 'Json',
        value,
    };
}
exports.abiJson = abiJson;
function abiHandle(value) {
    return {
        type: 'Handle',
        value,
    };
}
exports.abiHandle = abiHandle;
function abiSerialized(value) {
    return {
        type: 'Serialized',
        value,
    };
}
exports.abiSerialized = abiSerialized;
function signerNone() {
    return {
        type: 'None',
    };
}
exports.signerNone = signerNone;
function signerExternal(public_key) {
    return {
        type: 'External',
        public_key,
    };
}
exports.signerExternal = signerExternal;
function signerKeys(keys) {
    return {
        type: 'Keys',
        keys,
    };
}
exports.signerKeys = signerKeys;
function signerSigningBox(handle) {
    return {
        type: 'SigningBox',
        handle,
    };
}
exports.signerSigningBox = signerSigningBox;
var MessageBodyType;
(function (MessageBodyType) {
    MessageBodyType["Input"] = "Input";
    MessageBodyType["Output"] = "Output";
    MessageBodyType["InternalOutput"] = "InternalOutput";
    MessageBodyType["Event"] = "Event";
})(MessageBodyType = exports.MessageBodyType || (exports.MessageBodyType = {}));
function stateInitSourceMessage(source) {
    return {
        type: 'Message',
        source,
    };
}
exports.stateInitSourceMessage = stateInitSourceMessage;
function stateInitSourceStateInit(code, data, library) {
    return {
        type: 'StateInit',
        code,
        data,
        library,
    };
}
exports.stateInitSourceStateInit = stateInitSourceStateInit;
function stateInitSourceTvc(tvc, public_key, init_params) {
    return {
        type: 'Tvc',
        tvc,
        public_key,
        init_params,
    };
}
exports.stateInitSourceTvc = stateInitSourceTvc;
function messageSourceEncoded(message, abi) {
    return {
        type: 'Encoded',
        message,
        abi,
    };
}
exports.messageSourceEncoded = messageSourceEncoded;
function messageSourceEncodingParams(params) {
    return Object.assign({ type: 'EncodingParams' }, params);
}
exports.messageSourceEncodingParams = messageSourceEncodingParams;
/**
 * Provides message encoding and decoding according to the ABI specification.
 */
class AbiModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Encodes message body according to ABI function call.
     *
     * @param {ParamsOfEncodeMessageBody} params
     * @returns ResultOfEncodeMessageBody
     */
    encode_message_body(params) {
        return this.client.request('abi.encode_message_body', params);
    }
    /**
     *
     * @param {ParamsOfAttachSignatureToMessageBody} params
     * @returns ResultOfAttachSignatureToMessageBody
     */
    attach_signature_to_message_body(params) {
        return this.client.request('abi.attach_signature_to_message_body', params);
    }
    /**
     * Encodes an ABI-compatible message
     *
     * @remarks
     * Allows to encode deploy and function call messages,
     * both signed and unsigned.
     *
     * Use cases include messages of any possible type:
     * - deploy with initial function call (i.e. `constructor` or any other function that is used for some kind
     * of initialization);
     * - deploy without initial function call;
     * - signed/unsigned + data for signing.
     *
     * `Signer` defines how the message should or shouldn't be signed:
     *
     * `Signer::None` creates an unsigned message. This may be needed in case of some public methods,
     * that do not require authorization by pubkey.
     *
     * `Signer::External` takes public key and returns `data_to_sign` for later signing.
     * Use `attach_signature` method with the result signature to get the signed message.
     *
     * `Signer::Keys` creates a signed message with provided key pair.
     *
     * [SOON] `Signer::SigningBox` Allows using a special interface to implement signing
     * without private key disclosure to SDK. For instance, in case of using a cold wallet or HSM,
     * when application calls some API to sign data.
     *
     * There is an optional public key can be provided in deploy set in order to substitute one
     * in TVM file.
     *
     * Public key resolving priority:
     * 1. Public key from deploy set.
     * 2. Public key, specified in TVM file.
     * 3. Public key, provided by signer.
     *
     * @param {ParamsOfEncodeMessage} params
     * @returns ResultOfEncodeMessage
     */
    encode_message(params) {
        return this.client.request('abi.encode_message', params);
    }
    /**
     * Encodes an internal ABI-compatible message
     *
     * @remarks
     * Allows to encode deploy and function call messages.
     *
     * Use cases include messages of any possible type:
     * - deploy with initial function call (i.e. `constructor` or any other function that is used for some kind
     * of initialization);
     * - deploy without initial function call;
     * - simple function call
     *
     * There is an optional public key can be provided in deploy set in order to substitute one
     * in TVM file.
     *
     * Public key resolving priority:
     * 1. Public key from deploy set.
     * 2. Public key, specified in TVM file.
     *
     * @param {ParamsOfEncodeInternalMessage} params
     * @returns ResultOfEncodeInternalMessage
     */
    encode_internal_message(params) {
        return this.client.request('abi.encode_internal_message', params);
    }
    /**
     * Combines `hex`-encoded `signature` with `base64`-encoded `unsigned_message`. Returns signed message encoded in `base64`.
     *
     * @param {ParamsOfAttachSignature} params
     * @returns ResultOfAttachSignature
     */
    attach_signature(params) {
        return this.client.request('abi.attach_signature', params);
    }
    /**
     * Decodes message body using provided message BOC and ABI.
     *
     * @param {ParamsOfDecodeMessage} params
     * @returns DecodedMessageBody
     */
    decode_message(params) {
        return this.client.request('abi.decode_message', params);
    }
    /**
     * Decodes message body using provided body BOC and ABI.
     *
     * @param {ParamsOfDecodeMessageBody} params
     * @returns DecodedMessageBody
     */
    decode_message_body(params) {
        return this.client.request('abi.decode_message_body', params);
    }
    /**
     * Creates account state BOC
     *
     * @remarks
     * Creates account state provided with one of these sets of data :
     * 1. BOC of code, BOC of data, BOC of library
     * 2. TVC (string in `base64`), keys, init params
     *
     * @param {ParamsOfEncodeAccount} params
     * @returns ResultOfEncodeAccount
     */
    encode_account(params) {
        return this.client.request('abi.encode_account', params);
    }
    /**
     * Decodes account data using provided data BOC and ABI.
     *
     * @remarks
     * Note: this feature requires ABI 2.1 or higher.
     *
     * @param {ParamsOfDecodeAccountData} params
     * @returns ResultOfDecodeAccountData
     */
    decode_account_data(params) {
        return this.client.request('abi.decode_account_data', params);
    }
    /**
     * Updates initial account data with initial values for the contract's static variables and owner's public key. This operation is applicable only for initial account data (before deploy). If the contract is already deployed, its data doesn't contain this data section any more.
     *
     * @param {ParamsOfUpdateInitialData} params
     * @returns ResultOfUpdateInitialData
     */
    update_initial_data(params) {
        return this.client.request('abi.update_initial_data', params);
    }
    /**
     * Encodes initial account data with initial values for the contract's static variables and owner's public key into a data BOC that can be passed to `encode_tvc` function afterwards.
     *
     * @remarks
     * This function is analogue of `tvm.buildDataInit` function in Solidity.
     *
     * @param {ParamsOfEncodeInitialData} params
     * @returns ResultOfEncodeInitialData
     */
    encode_initial_data(params) {
        return this.client.request('abi.encode_initial_data', params);
    }
    /**
     * Decodes initial values of a contract's static variables and owner's public key from account initial data This operation is applicable only for initial account data (before deploy). If the contract is already deployed, its data doesn't contain this data section any more.
     *
     * @param {ParamsOfDecodeInitialData} params
     * @returns ResultOfDecodeInitialData
     */
    decode_initial_data(params) {
        return this.client.request('abi.decode_initial_data', params);
    }
    /**
     * Decodes BOC into JSON as a set of provided parameters.
     *
     * @remarks
     * Solidity functions use ABI types for [builder encoding](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#tvmbuilderstore).
     * The simplest way to decode such a BOC is to use ABI decoding.
     * ABI has it own rules for fields layout in cells so manually encoded
     * BOC can not be described in terms of ABI rules.
     *
     * To solve this problem we introduce a new ABI type `Ref(<ParamType>)`
     * which allows to store `ParamType` ABI parameter in cell reference and, thus,
     * decode manually encoded BOCs. This type is available only in `decode_boc` function
     * and will not be available in ABI messages encoding until it is included into some ABI revision.
     *
     * Such BOC descriptions covers most users needs. If someone wants to decode some BOC which
     * can not be described by these rules (i.e. BOC with TLB containing constructors of flags
     * defining some parsing conditions) then they can decode the fields up to fork condition,
     * check the parsed data manually, expand the parsing schema and then decode the whole BOC
     * with the full schema.
     *
     * @param {ParamsOfDecodeBoc} params
     * @returns ResultOfDecodeBoc
     */
    decode_boc(params) {
        return this.client.request('abi.decode_boc', params);
    }
    /**
     * Encodes given parameters in JSON into a BOC using param types from ABI.
     *
     * @param {ParamsOfAbiEncodeBoc} params
     * @returns ResultOfAbiEncodeBoc
     */
    encode_boc(params) {
        return this.client.request('abi.encode_boc', params);
    }
    /**
     * Calculates contract function ID by contract ABI
     *
     * @param {ParamsOfCalcFunctionId} params
     * @returns ResultOfCalcFunctionId
     */
    calc_function_id(params) {
        return this.client.request('abi.calc_function_id', params);
    }
}
exports.AbiModule = AbiModule;
function bocCacheTypePinned(pin) {
    return {
        type: 'Pinned',
        pin,
    };
}
exports.bocCacheTypePinned = bocCacheTypePinned;
function bocCacheTypeUnpinned() {
    return {
        type: 'Unpinned',
    };
}
exports.bocCacheTypeUnpinned = bocCacheTypeUnpinned;
var BocErrorCode;
(function (BocErrorCode) {
    BocErrorCode[BocErrorCode["InvalidBoc"] = 201] = "InvalidBoc";
    BocErrorCode[BocErrorCode["SerializationError"] = 202] = "SerializationError";
    BocErrorCode[BocErrorCode["InappropriateBlock"] = 203] = "InappropriateBlock";
    BocErrorCode[BocErrorCode["MissingSourceBoc"] = 204] = "MissingSourceBoc";
    BocErrorCode[BocErrorCode["InsufficientCacheSize"] = 205] = "InsufficientCacheSize";
    BocErrorCode[BocErrorCode["BocRefNotFound"] = 206] = "BocRefNotFound";
    BocErrorCode[BocErrorCode["InvalidBocRef"] = 207] = "InvalidBocRef";
})(BocErrorCode = exports.BocErrorCode || (exports.BocErrorCode = {}));
function builderOpInteger(size, value) {
    return {
        type: 'Integer',
        size,
        value,
    };
}
exports.builderOpInteger = builderOpInteger;
function builderOpBitString(value) {
    return {
        type: 'BitString',
        value,
    };
}
exports.builderOpBitString = builderOpBitString;
function builderOpCell(builder) {
    return {
        type: 'Cell',
        builder,
    };
}
exports.builderOpCell = builderOpCell;
function builderOpCellBoc(boc) {
    return {
        type: 'CellBoc',
        boc,
    };
}
exports.builderOpCellBoc = builderOpCellBoc;
function builderOpAddress(address) {
    return {
        type: 'Address',
        address,
    };
}
exports.builderOpAddress = builderOpAddress;
/**
 * BOC manipulation module.
 */
class BocModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Parses message boc into a JSON
     *
     * @remarks
     * JSON structure is compatible with GraphQL API message object
     *
     * @param {ParamsOfParse} params
     * @returns ResultOfParse
     */
    parse_message(params) {
        return this.client.request('boc.parse_message', params);
    }
    /**
     * Parses transaction boc into a JSON
     *
     * @remarks
     * JSON structure is compatible with GraphQL API transaction object
     *
     * @param {ParamsOfParse} params
     * @returns ResultOfParse
     */
    parse_transaction(params) {
        return this.client.request('boc.parse_transaction', params);
    }
    /**
     * Parses account boc into a JSON
     *
     * @remarks
     * JSON structure is compatible with GraphQL API account object
     *
     * @param {ParamsOfParse} params
     * @returns ResultOfParse
     */
    parse_account(params) {
        return this.client.request('boc.parse_account', params);
    }
    /**
     * Parses block boc into a JSON
     *
     * @remarks
     * JSON structure is compatible with GraphQL API block object
     *
     * @param {ParamsOfParse} params
     * @returns ResultOfParse
     */
    parse_block(params) {
        return this.client.request('boc.parse_block', params);
    }
    /**
     * Parses shardstate boc into a JSON
     *
     * @remarks
     * JSON structure is compatible with GraphQL API shardstate object
     *
     * @param {ParamsOfParseShardstate} params
     * @returns ResultOfParse
     */
    parse_shardstate(params) {
        return this.client.request('boc.parse_shardstate', params);
    }
    /**
     * Extract blockchain configuration from key block and also from zerostate.
     *
     * @param {ParamsOfGetBlockchainConfig} params
     * @returns ResultOfGetBlockchainConfig
     */
    get_blockchain_config(params) {
        return this.client.request('boc.get_blockchain_config', params);
    }
    /**
     * Calculates BOC root hash
     *
     * @param {ParamsOfGetBocHash} params
     * @returns ResultOfGetBocHash
     */
    get_boc_hash(params) {
        return this.client.request('boc.get_boc_hash', params);
    }
    /**
     * Calculates BOC depth
     *
     * @param {ParamsOfGetBocDepth} params
     * @returns ResultOfGetBocDepth
     */
    get_boc_depth(params) {
        return this.client.request('boc.get_boc_depth', params);
    }
    /**
     * Extracts code from TVC contract image
     *
     * @param {ParamsOfGetCodeFromTvc} params
     * @returns ResultOfGetCodeFromTvc
     */
    get_code_from_tvc(params) {
        return this.client.request('boc.get_code_from_tvc', params);
    }
    /**
     * Get BOC from cache
     *
     * @param {ParamsOfBocCacheGet} params
     * @returns ResultOfBocCacheGet
     */
    cache_get(params) {
        return this.client.request('boc.cache_get', params);
    }
    /**
     * Save BOC into cache or increase pin counter for existing pinned BOC
     *
     * @param {ParamsOfBocCacheSet} params
     * @returns ResultOfBocCacheSet
     */
    cache_set(params) {
        return this.client.request('boc.cache_set', params);
    }
    /**
     * Unpin BOCs with specified pin defined in the `cache_set`. Decrease pin reference counter for BOCs with specified pin defined in the `cache_set`. BOCs which have only 1 pin and its reference counter become 0 will be removed from cache
     *
     * @param {ParamsOfBocCacheUnpin} params
     * @returns
     */
    cache_unpin(params) {
        return this.client.request('boc.cache_unpin', params);
    }
    /**
     * Encodes bag of cells (BOC) with builder operations. This method provides the same functionality as Solidity TvmBuilder. Resulting BOC of this method can be passed into Solidity and C++ contracts as TvmCell type.
     *
     * @param {ParamsOfEncodeBoc} params
     * @returns ResultOfEncodeBoc
     */
    encode_boc(params) {
        return this.client.request('boc.encode_boc', params);
    }
    /**
     * Returns the contract code's salt if it is present.
     *
     * @param {ParamsOfGetCodeSalt} params
     * @returns ResultOfGetCodeSalt
     */
    get_code_salt(params) {
        return this.client.request('boc.get_code_salt', params);
    }
    /**
     * Sets new salt to contract code.
     *
     * @remarks
     * Returns the new contract code with salt.
     *
     * @param {ParamsOfSetCodeSalt} params
     * @returns ResultOfSetCodeSalt
     */
    set_code_salt(params) {
        return this.client.request('boc.set_code_salt', params);
    }
    /**
     * Decodes tvc into code, data, libraries and special options.
     *
     * @param {ParamsOfDecodeTvc} params
     * @returns ResultOfDecodeTvc
     */
    decode_tvc(params) {
        return this.client.request('boc.decode_tvc', params);
    }
    /**
     * Encodes tvc from code, data, libraries ans special options (see input params)
     *
     * @param {ParamsOfEncodeTvc} params
     * @returns ResultOfEncodeTvc
     */
    encode_tvc(params) {
        return this.client.request('boc.encode_tvc', params);
    }
    /**
     * Encodes a message
     *
     * @remarks
     * Allows to encode any external inbound message.
     *
     * @param {ParamsOfEncodeExternalInMessage} params
     * @returns ResultOfEncodeExternalInMessage
     */
    encode_external_in_message(params) {
        return this.client.request('boc.encode_external_in_message', params);
    }
    /**
     * Returns the compiler version used to compile the code.
     *
     * @param {ParamsOfGetCompilerVersion} params
     * @returns ResultOfGetCompilerVersion
     */
    get_compiler_version(params) {
        return this.client.request('boc.get_compiler_version', params);
    }
}
exports.BocModule = BocModule;
// processing module
var ProcessingErrorCode;
(function (ProcessingErrorCode) {
    ProcessingErrorCode[ProcessingErrorCode["MessageAlreadyExpired"] = 501] = "MessageAlreadyExpired";
    ProcessingErrorCode[ProcessingErrorCode["MessageHasNotDestinationAddress"] = 502] = "MessageHasNotDestinationAddress";
    ProcessingErrorCode[ProcessingErrorCode["CanNotBuildMessageCell"] = 503] = "CanNotBuildMessageCell";
    ProcessingErrorCode[ProcessingErrorCode["FetchBlockFailed"] = 504] = "FetchBlockFailed";
    ProcessingErrorCode[ProcessingErrorCode["SendMessageFailed"] = 505] = "SendMessageFailed";
    ProcessingErrorCode[ProcessingErrorCode["InvalidMessageBoc"] = 506] = "InvalidMessageBoc";
    ProcessingErrorCode[ProcessingErrorCode["MessageExpired"] = 507] = "MessageExpired";
    ProcessingErrorCode[ProcessingErrorCode["TransactionWaitTimeout"] = 508] = "TransactionWaitTimeout";
    ProcessingErrorCode[ProcessingErrorCode["InvalidBlockReceived"] = 509] = "InvalidBlockReceived";
    ProcessingErrorCode[ProcessingErrorCode["CanNotCheckBlockShard"] = 510] = "CanNotCheckBlockShard";
    ProcessingErrorCode[ProcessingErrorCode["BlockNotFound"] = 511] = "BlockNotFound";
    ProcessingErrorCode[ProcessingErrorCode["InvalidData"] = 512] = "InvalidData";
    ProcessingErrorCode[ProcessingErrorCode["ExternalSignerMustNotBeUsed"] = 513] = "ExternalSignerMustNotBeUsed";
    ProcessingErrorCode[ProcessingErrorCode["MessageRejected"] = 514] = "MessageRejected";
    ProcessingErrorCode[ProcessingErrorCode["InvalidRempStatus"] = 515] = "InvalidRempStatus";
    ProcessingErrorCode[ProcessingErrorCode["NextRempStatusTimeout"] = 516] = "NextRempStatusTimeout";
})(ProcessingErrorCode = exports.ProcessingErrorCode || (exports.ProcessingErrorCode = {}));
function processingEventWillFetchFirstBlock() {
    return {
        type: 'WillFetchFirstBlock',
    };
}
exports.processingEventWillFetchFirstBlock = processingEventWillFetchFirstBlock;
function processingEventFetchFirstBlockFailed(error) {
    return {
        type: 'FetchFirstBlockFailed',
        error,
    };
}
exports.processingEventFetchFirstBlockFailed = processingEventFetchFirstBlockFailed;
function processingEventWillSend(shard_block_id, message_id, message) {
    return {
        type: 'WillSend',
        shard_block_id,
        message_id,
        message,
    };
}
exports.processingEventWillSend = processingEventWillSend;
function processingEventDidSend(shard_block_id, message_id, message) {
    return {
        type: 'DidSend',
        shard_block_id,
        message_id,
        message,
    };
}
exports.processingEventDidSend = processingEventDidSend;
function processingEventSendFailed(shard_block_id, message_id, message, error) {
    return {
        type: 'SendFailed',
        shard_block_id,
        message_id,
        message,
        error,
    };
}
exports.processingEventSendFailed = processingEventSendFailed;
function processingEventWillFetchNextBlock(shard_block_id, message_id, message) {
    return {
        type: 'WillFetchNextBlock',
        shard_block_id,
        message_id,
        message,
    };
}
exports.processingEventWillFetchNextBlock = processingEventWillFetchNextBlock;
function processingEventFetchNextBlockFailed(shard_block_id, message_id, message, error) {
    return {
        type: 'FetchNextBlockFailed',
        shard_block_id,
        message_id,
        message,
        error,
    };
}
exports.processingEventFetchNextBlockFailed = processingEventFetchNextBlockFailed;
function processingEventMessageExpired(message_id, message, error) {
    return {
        type: 'MessageExpired',
        message_id,
        message,
        error,
    };
}
exports.processingEventMessageExpired = processingEventMessageExpired;
function processingEventRempSentToValidators(message_id, timestamp, json) {
    return {
        type: 'RempSentToValidators',
        message_id,
        timestamp,
        json,
    };
}
exports.processingEventRempSentToValidators = processingEventRempSentToValidators;
function processingEventRempIncludedIntoBlock(message_id, timestamp, json) {
    return {
        type: 'RempIncludedIntoBlock',
        message_id,
        timestamp,
        json,
    };
}
exports.processingEventRempIncludedIntoBlock = processingEventRempIncludedIntoBlock;
function processingEventRempIncludedIntoAcceptedBlock(message_id, timestamp, json) {
    return {
        type: 'RempIncludedIntoAcceptedBlock',
        message_id,
        timestamp,
        json,
    };
}
exports.processingEventRempIncludedIntoAcceptedBlock = processingEventRempIncludedIntoAcceptedBlock;
function processingEventRempOther(message_id, timestamp, json) {
    return {
        type: 'RempOther',
        message_id,
        timestamp,
        json,
    };
}
exports.processingEventRempOther = processingEventRempOther;
function processingEventRempError(error) {
    return {
        type: 'RempError',
        error,
    };
}
exports.processingEventRempError = processingEventRempError;
/**
 * Message processing module.
 *
 * @remarks
 * This module incorporates functions related to complex message
 * processing scenarios.
 */
class ProcessingModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Sends message to the network
     *
     * @remarks
     * Sends message to the network and returns the last generated shard block of the destination account
     * before the message was sent. It will be required later for message processing.
     *
     * @param {ParamsOfSendMessage} params
     * @returns ResultOfSendMessage
     */
    send_message(params, responseHandler) {
        return this.client.request('processing.send_message', params, responseHandler);
    }
    /**
     * Performs monitoring of the network for the result transaction of the external inbound message processing.
     *
     * @remarks
     * `send_events` enables intermediate events, such as `WillFetchNextBlock`,
     * `FetchNextBlockFailed` that may be useful for logging of new shard blocks creation
     * during message processing.
     *
     * Note, that presence of the `abi` parameter is critical for ABI
     * compliant contracts. Message processing uses drastically
     * different strategy for processing message for contracts which
     * ABI includes "expire" header.
     *
     * When the ABI header `expire` is present, the processing uses
     * `message expiration` strategy:
     * - The maximum block gen time is set to
     *   `message_expiration_timeout + transaction_wait_timeout`.
     * - When maximum block gen time is reached, the processing will
     *   be finished with `MessageExpired` error.
     *
     * When the ABI header `expire` isn't present or `abi` parameter
     * isn't specified, the processing uses `transaction waiting`
     * strategy:
     * - The maximum block gen time is set to
     *   `now() + transaction_wait_timeout`.
     *
     * - If maximum block gen time is reached and no result transaction is found,
     * the processing will exit with an error.
     *
     * @param {ParamsOfWaitForTransaction} params
     * @returns ResultOfProcessMessage
     */
    wait_for_transaction(params, responseHandler) {
        return this.client.request('processing.wait_for_transaction', params, responseHandler);
    }
    /**
     * Creates message, sends it to the network and monitors its processing.
     *
     * @remarks
     * Creates ABI-compatible message,
     * sends it to the network and monitors for the result transaction.
     * Decodes the output messages' bodies.
     *
     * If contract's ABI includes "expire" header, then
     * SDK implements retries in case of unsuccessful message delivery within the expiration
     * timeout: SDK recreates the message, sends it and processes it again.
     *
     * The intermediate events, such as `WillFetchFirstBlock`, `WillSend`, `DidSend`,
     * `WillFetchNextBlock`, etc - are switched on/off by `send_events` flag
     * and logged into the supplied callback function.
     *
     * The retry configuration parameters are defined in the client's `NetworkConfig` and `AbiConfig`.
     *
     * If contract's ABI does not include "expire" header
     * then, if no transaction is found within the network timeout (see config parameter ), exits with error.
     *
     * @param {ParamsOfProcessMessage} params
     * @returns ResultOfProcessMessage
     */
    process_message(params, responseHandler) {
        return this.client.request('processing.process_message', params, responseHandler);
    }
}
exports.ProcessingModule = ProcessingModule;
function addressStringFormatAccountId() {
    return {
        type: 'AccountId',
    };
}
exports.addressStringFormatAccountId = addressStringFormatAccountId;
function addressStringFormatHex() {
    return {
        type: 'Hex',
    };
}
exports.addressStringFormatHex = addressStringFormatHex;
function addressStringFormatBase64(url, test, bounce) {
    return {
        type: 'Base64',
        url,
        test,
        bounce,
    };
}
exports.addressStringFormatBase64 = addressStringFormatBase64;
var AccountAddressType;
(function (AccountAddressType) {
    AccountAddressType["AccountId"] = "AccountId";
    AccountAddressType["Hex"] = "Hex";
    AccountAddressType["Base64"] = "Base64";
})(AccountAddressType = exports.AccountAddressType || (exports.AccountAddressType = {}));
/**
 * Misc utility Functions.
 */
class UtilsModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Converts address from any TON format to any TON format
     *
     * @param {ParamsOfConvertAddress} params
     * @returns ResultOfConvertAddress
     */
    convert_address(params) {
        return this.client.request('utils.convert_address', params);
    }
    /**
     * Validates and returns the type of any TON address.
     *
     * @remarks
     * Address types are the following
     *
     * `0:919db8e740d50bf349df2eea03fa30c385d846b991ff5542e67098ee833fc7f7` - standard TON address most
     * commonly used in all cases. Also called as hex address
     * `919db8e740d50bf349df2eea03fa30c385d846b991ff5542e67098ee833fc7f7` - account ID. A part of full
     * address. Identifies account inside particular workchain
     * `EQCRnbjnQNUL80nfLuoD+jDDhdhGuZH/VULmcJjugz/H9wam` - base64 address. Also called "user-friendly".
     * Was used at the beginning of TON. Now it is supported for compatibility
     *
     * @param {ParamsOfGetAddressType} params
     * @returns ResultOfGetAddressType
     */
    get_address_type(params) {
        return this.client.request('utils.get_address_type', params);
    }
    /**
     * Calculates storage fee for an account over a specified time period
     *
     * @param {ParamsOfCalcStorageFee} params
     * @returns ResultOfCalcStorageFee
     */
    calc_storage_fee(params) {
        return this.client.request('utils.calc_storage_fee', params);
    }
    /**
     * Compresses data using Zstandard algorithm
     *
     * @param {ParamsOfCompressZstd} params
     * @returns ResultOfCompressZstd
     */
    compress_zstd(params) {
        return this.client.request('utils.compress_zstd', params);
    }
    /**
     * Decompresses data using Zstandard algorithm
     *
     * @param {ParamsOfDecompressZstd} params
     * @returns ResultOfDecompressZstd
     */
    decompress_zstd(params) {
        return this.client.request('utils.decompress_zstd', params);
    }
}
exports.UtilsModule = UtilsModule;
// tvm module
var TvmErrorCode;
(function (TvmErrorCode) {
    TvmErrorCode[TvmErrorCode["CanNotReadTransaction"] = 401] = "CanNotReadTransaction";
    TvmErrorCode[TvmErrorCode["CanNotReadBlockchainConfig"] = 402] = "CanNotReadBlockchainConfig";
    TvmErrorCode[TvmErrorCode["TransactionAborted"] = 403] = "TransactionAborted";
    TvmErrorCode[TvmErrorCode["InternalError"] = 404] = "InternalError";
    TvmErrorCode[TvmErrorCode["ActionPhaseFailed"] = 405] = "ActionPhaseFailed";
    TvmErrorCode[TvmErrorCode["AccountCodeMissing"] = 406] = "AccountCodeMissing";
    TvmErrorCode[TvmErrorCode["LowBalance"] = 407] = "LowBalance";
    TvmErrorCode[TvmErrorCode["AccountFrozenOrDeleted"] = 408] = "AccountFrozenOrDeleted";
    TvmErrorCode[TvmErrorCode["AccountMissing"] = 409] = "AccountMissing";
    TvmErrorCode[TvmErrorCode["UnknownExecutionError"] = 410] = "UnknownExecutionError";
    TvmErrorCode[TvmErrorCode["InvalidInputStack"] = 411] = "InvalidInputStack";
    TvmErrorCode[TvmErrorCode["InvalidAccountBoc"] = 412] = "InvalidAccountBoc";
    TvmErrorCode[TvmErrorCode["InvalidMessageType"] = 413] = "InvalidMessageType";
    TvmErrorCode[TvmErrorCode["ContractExecutionError"] = 414] = "ContractExecutionError";
})(TvmErrorCode = exports.TvmErrorCode || (exports.TvmErrorCode = {}));
function accountForExecutorNone() {
    return {
        type: 'None',
    };
}
exports.accountForExecutorNone = accountForExecutorNone;
function accountForExecutorUninit() {
    return {
        type: 'Uninit',
    };
}
exports.accountForExecutorUninit = accountForExecutorUninit;
function accountForExecutorAccount(boc, unlimited_balance) {
    return {
        type: 'Account',
        boc,
        unlimited_balance,
    };
}
exports.accountForExecutorAccount = accountForExecutorAccount;
class TvmModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Emulates all the phases of contract execution locally
     *
     * @remarks
     * Performs all the phases of contract execution on Transaction Executor -
     * the same component that is used on Validator Nodes.
     *
     * Can be used for contract debugging, to find out the reason why a message was not delivered successfully.
     * Validators throw away the failed external inbound messages (if they failed bedore `ACCEPT`) in the real network.
     * This is why these messages are impossible to debug in the real network.
     * With the help of run_executor you can do that. In fact, `process_message` function
     * performs local check with `run_executor` if there was no transaction as a result of processing
     * and returns the error, if there is one.
     *
     * Another use case to use `run_executor` is to estimate fees for message execution.
     * Set  `AccountForExecutor::Account.unlimited_balance`
     * to `true` so that emulation will not depend on the actual balance.
     * This may be needed to calculate deploy fees for an account that does not exist yet.
     * JSON with fees is in `fees` field of the result.
     *
     * One more use case - you can produce the sequence of operations,
     * thus emulating the sequential contract calls locally.
     * And so on.
     *
     * Transaction executor requires account BOC (bag of cells) as a parameter.
     * To get the account BOC - use `net.query` method to download it from GraphQL API
     * (field `boc` of `account`) or generate it with `abi.encode_account` method.
     *
     * Also it requires message BOC. To get the message BOC - use `abi.encode_message` or `abi.encode_internal_message`.
     *
     * If you need this emulation to be as precise as possible (for instance - emulate transaction
     * with particular lt in particular block or use particular blockchain config,
     * downloaded from a particular key block - then specify `execution_options` parameter.
     *
     * If you need to see the aborted transaction as a result, not as an error, set `skip_transaction_check` to `true`.
     *
     * @param {ParamsOfRunExecutor} params
     * @returns ResultOfRunExecutor
     */
    run_executor(params) {
        return this.client.request('tvm.run_executor', params);
    }
    /**
     * Executes get-methods of ABI-compatible contracts
     *
     * @remarks
     * Performs only a part of compute phase of transaction execution
     * that is used to run get-methods of ABI-compatible contracts.
     *
     * If you try to run get-methods with `run_executor` you will get an error, because it checks ACCEPT and exits
     * if there is none, which is actually true for get-methods.
     *
     *  To get the account BOC (bag of cells) - use `net.query` method to download it from GraphQL API
     * (field `boc` of `account`) or generate it with `abi.encode_account method`.
     * To get the message BOC - use `abi.encode_message` or prepare it any other way, for instance, with FIFT script.
     *
     * Attention! Updated account state is produces as well, but only
     * `account_state.storage.state.data`  part of the BOC is updated.
     *
     * @param {ParamsOfRunTvm} params
     * @returns ResultOfRunTvm
     */
    run_tvm(params) {
        return this.client.request('tvm.run_tvm', params);
    }
    /**
     * Executes a get-method of FIFT contract
     *
     * @remarks
     * Executes a get-method of FIFT contract that fulfills the smc-guidelines https://test.ton.org/smc-guidelines.txt
     * and returns the result data from TVM's stack
     *
     * @param {ParamsOfRunGet} params
     * @returns ResultOfRunGet
     */
    run_get(params) {
        return this.client.request('tvm.run_get', params);
    }
}
exports.TvmModule = TvmModule;
// net module
var NetErrorCode;
(function (NetErrorCode) {
    NetErrorCode[NetErrorCode["QueryFailed"] = 601] = "QueryFailed";
    NetErrorCode[NetErrorCode["SubscribeFailed"] = 602] = "SubscribeFailed";
    NetErrorCode[NetErrorCode["WaitForFailed"] = 603] = "WaitForFailed";
    NetErrorCode[NetErrorCode["GetSubscriptionResultFailed"] = 604] = "GetSubscriptionResultFailed";
    NetErrorCode[NetErrorCode["InvalidServerResponse"] = 605] = "InvalidServerResponse";
    NetErrorCode[NetErrorCode["ClockOutOfSync"] = 606] = "ClockOutOfSync";
    NetErrorCode[NetErrorCode["WaitForTimeout"] = 607] = "WaitForTimeout";
    NetErrorCode[NetErrorCode["GraphqlError"] = 608] = "GraphqlError";
    NetErrorCode[NetErrorCode["NetworkModuleSuspended"] = 609] = "NetworkModuleSuspended";
    NetErrorCode[NetErrorCode["WebsocketDisconnected"] = 610] = "WebsocketDisconnected";
    NetErrorCode[NetErrorCode["NotSupported"] = 611] = "NotSupported";
    NetErrorCode[NetErrorCode["NoEndpointsProvided"] = 612] = "NoEndpointsProvided";
    NetErrorCode[NetErrorCode["GraphqlWebsocketInitError"] = 613] = "GraphqlWebsocketInitError";
    NetErrorCode[NetErrorCode["NetworkModuleResumed"] = 614] = "NetworkModuleResumed";
    NetErrorCode[NetErrorCode["Unauthorized"] = 615] = "Unauthorized";
})(NetErrorCode = exports.NetErrorCode || (exports.NetErrorCode = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "ASC";
    SortDirection["DESC"] = "DESC";
})(SortDirection = exports.SortDirection || (exports.SortDirection = {}));
function paramsOfQueryOperationQueryCollection(params) {
    return Object.assign({ type: 'QueryCollection' }, params);
}
exports.paramsOfQueryOperationQueryCollection = paramsOfQueryOperationQueryCollection;
function paramsOfQueryOperationWaitForCollection(params) {
    return Object.assign({ type: 'WaitForCollection' }, params);
}
exports.paramsOfQueryOperationWaitForCollection = paramsOfQueryOperationWaitForCollection;
function paramsOfQueryOperationAggregateCollection(params) {
    return Object.assign({ type: 'AggregateCollection' }, params);
}
exports.paramsOfQueryOperationAggregateCollection = paramsOfQueryOperationAggregateCollection;
function paramsOfQueryOperationQueryCounterparties(params) {
    return Object.assign({ type: 'QueryCounterparties' }, params);
}
exports.paramsOfQueryOperationQueryCounterparties = paramsOfQueryOperationQueryCounterparties;
var AggregationFn;
(function (AggregationFn) {
    AggregationFn["COUNT"] = "COUNT";
    AggregationFn["MIN"] = "MIN";
    AggregationFn["MAX"] = "MAX";
    AggregationFn["SUM"] = "SUM";
    AggregationFn["AVERAGE"] = "AVERAGE";
})(AggregationFn = exports.AggregationFn || (exports.AggregationFn = {}));
/**
 * Network access.
 */
class NetModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Performs DAppServer GraphQL query.
     *
     * @param {ParamsOfQuery} params
     * @returns ResultOfQuery
     */
    query(params) {
        return this.client.request('net.query', params);
    }
    /**
     * Performs multiple queries per single fetch.
     *
     * @param {ParamsOfBatchQuery} params
     * @returns ResultOfBatchQuery
     */
    batch_query(params) {
        return this.client.request('net.batch_query', params);
    }
    /**
     * Queries collection data
     *
     * @remarks
     * Queries data that satisfies the `filter` conditions,
     * limits the number of returned records and orders them.
     * The projection fields are limited to `result` fields
     *
     * @param {ParamsOfQueryCollection} params
     * @returns ResultOfQueryCollection
     */
    query_collection(params) {
        return this.client.request('net.query_collection', params);
    }
    /**
     * Aggregates collection data.
     *
     * @remarks
     * Aggregates values from the specified `fields` for records
     * that satisfies the `filter` conditions,
     *
     * @param {ParamsOfAggregateCollection} params
     * @returns ResultOfAggregateCollection
     */
    aggregate_collection(params) {
        return this.client.request('net.aggregate_collection', params);
    }
    /**
     * Returns an object that fulfills the conditions or waits for its appearance
     *
     * @remarks
     * Triggers only once.
     * If object that satisfies the `filter` conditions
     * already exists - returns it immediately.
     * If not - waits for insert/update of data within the specified `timeout`,
     * and returns it.
     * The projection fields are limited to `result` fields
     *
     * @param {ParamsOfWaitForCollection} params
     * @returns ResultOfWaitForCollection
     */
    wait_for_collection(params) {
        return this.client.request('net.wait_for_collection', params);
    }
    /**
     * Cancels a subscription
     *
     * @remarks
     * Cancels a subscription specified by its handle.
     *
     * @param {ResultOfSubscribeCollection} params
     * @returns
     */
    unsubscribe(params) {
        return this.client.request('net.unsubscribe', params);
    }
    /**
     * Creates a collection subscription
     *
     * @remarks
     * Triggers for each insert/update of data that satisfies
     * the `filter` conditions.
     * The projection fields are limited to `result` fields.
     *
     * The subscription is a persistent communication channel between
     * client and Free TON Network.
     * All changes in the blockchain will be reflected in realtime.
     * Changes means inserts and updates of the blockchain entities.
     *
     * ### Important Notes on Subscriptions
     *
     * Unfortunately sometimes the connection with the network brakes down.
     * In this situation the library attempts to reconnect to the network.
     * This reconnection sequence can take significant time.
     * All of this time the client is disconnected from the network.
     *
     * Bad news is that all blockchain changes that happened while
     * the client was disconnected are lost.
     *
     * Good news is that the client report errors to the callback when
     * it loses and resumes connection.
     *
     * So, if the lost changes are important to the application then
     * the application must handle these error reports.
     *
     * Library reports errors with `responseType` == 101
     * and the error object passed via `params`.
     *
     * When the library has successfully reconnected
     * the application receives callback with
     * `responseType` == 101 and `params.code` == 614 (NetworkModuleResumed).
     *
     * Application can use several ways to handle this situation:
     * - If application monitors changes for the single blockchain
     * object (for example specific account):  application
     * can perform a query for this object and handle actual data as a
     * regular data from the subscription.
     * - If application monitors sequence of some blockchain objects
     * (for example transactions of the specific account): application must
     * refresh all cached (or visible to user) lists where this sequences presents.
     *
     * @param {ParamsOfSubscribeCollection} params
     * @returns ResultOfSubscribeCollection
     */
    subscribe_collection(params, responseHandler) {
        return this.client.request('net.subscribe_collection', params, responseHandler);
    }
    /**
     * Creates a subscription
     *
     * @remarks
     * The subscription is a persistent communication channel between
     * client and Everscale Network.
     *
     * ### Important Notes on Subscriptions
     *
     * Unfortunately sometimes the connection with the network breakes down.
     * In this situation the library attempts to reconnect to the network.
     * This reconnection sequence can take significant time.
     * All of this time the client is disconnected from the network.
     *
     * Bad news is that all changes that happened while
     * the client was disconnected are lost.
     *
     * Good news is that the client report errors to the callback when
     * it loses and resumes connection.
     *
     * So, if the lost changes are important to the application then
     * the application must handle these error reports.
     *
     * Library reports errors with `responseType` == 101
     * and the error object passed via `params`.
     *
     * When the library has successfully reconnected
     * the application receives callback with
     * `responseType` == 101 and `params.code` == 614 (NetworkModuleResumed).
     *
     * Application can use several ways to handle this situation:
     * - If application monitors changes for the single
     * object (for example specific account):  application
     * can perform a query for this object and handle actual data as a
     * regular data from the subscription.
     * - If application monitors sequence of some objects
     * (for example transactions of the specific account): application must
     * refresh all cached (or visible to user) lists where this sequences presents.
     *
     * @param {ParamsOfSubscribe} params
     * @returns ResultOfSubscribeCollection
     */
    subscribe(params, responseHandler) {
        return this.client.request('net.subscribe', params, responseHandler);
    }
    /**
     * Suspends network module to stop any network activity
     * @returns
     */
    suspend() {
        return this.client.request('net.suspend');
    }
    /**
     * Resumes network module to enable network activity
     * @returns
     */
    resume() {
        return this.client.request('net.resume');
    }
    /**
     * Returns ID of the last block in a specified account shard
     *
     * @param {ParamsOfFindLastShardBlock} params
     * @returns ResultOfFindLastShardBlock
     */
    find_last_shard_block(params) {
        return this.client.request('net.find_last_shard_block', params);
    }
    /**
     * Requests the list of alternative endpoints from server
     * @returns EndpointsSet
     */
    fetch_endpoints() {
        return this.client.request('net.fetch_endpoints');
    }
    /**
     * Sets the list of endpoints to use on reinit
     *
     * @param {EndpointsSet} params
     * @returns
     */
    set_endpoints(params) {
        return this.client.request('net.set_endpoints', params);
    }
    /**
     * Requests the list of alternative endpoints from server
     * @returns ResultOfGetEndpoints
     */
    get_endpoints() {
        return this.client.request('net.get_endpoints');
    }
    /**
     * Allows to query and paginate through the list of accounts that the specified account has interacted with, sorted by the time of the last internal message between accounts
     *
     * @remarks
     * *Attention* this query retrieves data from 'Counterparties' service which is not supported in
     * the opensource version of DApp Server (and will not be supported) as well as in Evernode SE (will be supported in SE in future),
     * but is always accessible via [EVER OS Clouds](../ton-os-api/networks.md)
     *
     * @param {ParamsOfQueryCounterparties} params
     * @returns ResultOfQueryCollection
     */
    query_counterparties(params) {
        return this.client.request('net.query_counterparties', params);
    }
    /**
     * Returns a tree of transactions triggered by a specific message.
     *
     * @remarks
     * Performs recursive retrieval of a transactions tree produced by a specific message:
     * in_msg -> dst_transaction -> out_messages -> dst_transaction -> ...
     * If the chain of transactions execution is in progress while the function is running,
     * it will wait for the next transactions to appear until the full tree or more than 50 transactions
     * are received.
     *
     * All the retrieved messages and transactions are included
     * into `result.messages` and `result.transactions` respectively.
     *
     * Function reads transactions layer by layer, by pages of 20 transactions.
     *
     * The retrieval prosess goes like this:
     * Let's assume we have an infinite chain of transactions and each transaction generates 5 messages.
     * 1. Retrieve 1st message (input parameter) and corresponding transaction - put it into result.
     * It is the first level of the tree of transactions - its root.
     * Retrieve 5 out message ids from the transaction for next steps.
     * 2. Retrieve 5 messages and corresponding transactions on the 2nd layer. Put them into result.
     * Retrieve 5*5 out message ids from these transactions for next steps
     * 3. Retrieve 20 (size of the page) messages and transactions (3rd layer) and 20*5=100 message ids (4th layer).
     * 4. Retrieve the last 5 messages and 5 transactions on the 3rd layer + 15 messages and transactions (of 100) from the 4th layer
     * + 25 message ids of the 4th layer + 75 message ids of the 5th layer.
     * 5. Retrieve 20 more messages and 20 more transactions of the 4th layer + 100 more message ids of the 5th layer.
     * 6. Now we have 1+5+20+20+20 = 66 transactions, which is more than 50. Function exits with the tree of
     * 1m->1t->5m->5t->25m->25t->35m->35t. If we see any message ids in the last transactions out_msgs, which don't have
     * corresponding messages in the function result, it means that the full tree was not received and we need to continue iteration.
     *
     * To summarize, it is guaranteed that each message in `result.messages` has the corresponding transaction
     * in the `result.transactions`.
     * But there is no guarantee that all messages from transactions `out_msgs` are
     * presented in `result.messages`.
     * So the application has to continue retrieval for missing messages if it requires.
     *
     * @param {ParamsOfQueryTransactionTree} params
     * @returns ResultOfQueryTransactionTree
     */
    query_transaction_tree(params) {
        return this.client.request('net.query_transaction_tree', params);
    }
    /**
     * Creates block iterator.
     *
     * @remarks
     * Block iterator uses robust iteration methods that guaranties that every
     * block in the specified range isn't missed or iterated twice.
     *
     * Iterated range can be reduced with some filters:
     * - `start_time` – the bottom time range. Only blocks with `gen_utime`
     * more or equal to this value is iterated. If this parameter is omitted then there is
     * no bottom time edge, so all blocks since zero state is iterated.
     * - `end_time` – the upper time range. Only blocks with `gen_utime`
     * less then this value is iterated. If this parameter is omitted then there is
     * no upper time edge, so iterator never finishes.
     * - `shard_filter` – workchains and shard prefixes that reduce the set of interesting
     * blocks. Block conforms to the shard filter if it belongs to the filter workchain
     * and the first bits of block's `shard` fields matches to the shard prefix.
     * Only blocks with suitable shard are iterated.
     *
     * Items iterated is a JSON objects with block data. The minimal set of returned
     * fields is:
     * ```text
     * id
     * gen_utime
     * workchain_id
     * shard
     * after_split
     * after_merge
     * prev_ref {
     *     root_hash
     * }
     * prev_alt_ref {
     *     root_hash
     * }
     * ```
     * Application can request additional fields in the `result` parameter.
     *
     * Application should call the `remove_iterator` when iterator is no longer required.
     *
     * @param {ParamsOfCreateBlockIterator} params
     * @returns RegisteredIterator
     */
    create_block_iterator(params) {
        return this.client.request('net.create_block_iterator', params);
    }
    /**
     * Resumes block iterator.
     *
     * @remarks
     * The iterator stays exactly at the same position where the `resume_state` was catched.
     *
     * Application should call the `remove_iterator` when iterator is no longer required.
     *
     * @param {ParamsOfResumeBlockIterator} params
     * @returns RegisteredIterator
     */
    resume_block_iterator(params) {
        return this.client.request('net.resume_block_iterator', params);
    }
    /**
     * Creates transaction iterator.
     *
     * @remarks
     * Transaction iterator uses robust iteration methods that guaranty that every
     * transaction in the specified range isn't missed or iterated twice.
     *
     * Iterated range can be reduced with some filters:
     * - `start_time` – the bottom time range. Only transactions with `now`
     * more or equal to this value are iterated. If this parameter is omitted then there is
     * no bottom time edge, so all the transactions since zero state are iterated.
     * - `end_time` – the upper time range. Only transactions with `now`
     * less then this value are iterated. If this parameter is omitted then there is
     * no upper time edge, so iterator never finishes.
     * - `shard_filter` – workchains and shard prefixes that reduce the set of interesting
     * accounts. Account address conforms to the shard filter if
     * it belongs to the filter workchain and the first bits of address match to
     * the shard prefix. Only transactions with suitable account addresses are iterated.
     * - `accounts_filter` – set of account addresses whose transactions must be iterated.
     * Note that accounts filter can conflict with shard filter so application must combine
     * these filters carefully.
     *
     * Iterated item is a JSON objects with transaction data. The minimal set of returned
     * fields is:
     * ```text
     * id
     * account_addr
     * now
     * balance_delta(format:DEC)
     * bounce { bounce_type }
     * in_message {
     *     id
     *     value(format:DEC)
     *     msg_type
     *     src
     * }
     * out_messages {
     *     id
     *     value(format:DEC)
     *     msg_type
     *     dst
     * }
     * ```
     * Application can request an additional fields in the `result` parameter.
     *
     * Another parameter that affects on the returned fields is the `include_transfers`.
     * When this parameter is `true` the iterator computes and adds `transfer` field containing
     * list of the useful `TransactionTransfer` objects.
     * Each transfer is calculated from the particular message related to the transaction
     * and has the following structure:
     * - message – source message identifier.
     * - isBounced – indicates that the transaction is bounced, which means the value will be returned back to the sender.
     * - isDeposit – indicates that this transfer is the deposit (true) or withdraw (false).
     * - counterparty – account address of the transfer source or destination depending on `isDeposit`.
     * - value – amount of nano tokens transferred. The value is represented as a decimal string
     * because the actual value can be more precise than the JSON number can represent. Application
     * must use this string carefully – conversion to number can follow to loose of precision.
     *
     * Application should call the `remove_iterator` when iterator is no longer required.
     *
     * @param {ParamsOfCreateTransactionIterator} params
     * @returns RegisteredIterator
     */
    create_transaction_iterator(params) {
        return this.client.request('net.create_transaction_iterator', params);
    }
    /**
     * Resumes transaction iterator.
     *
     * @remarks
     * The iterator stays exactly at the same position where the `resume_state` was caught.
     * Note that `resume_state` doesn't store the account filter. If the application requires
     * to use the same account filter as it was when the iterator was created then the application
     * must pass the account filter again in `accounts_filter` parameter.
     *
     * Application should call the `remove_iterator` when iterator is no longer required.
     *
     * @param {ParamsOfResumeTransactionIterator} params
     * @returns RegisteredIterator
     */
    resume_transaction_iterator(params) {
        return this.client.request('net.resume_transaction_iterator', params);
    }
    /**
     * Returns next available items.
     *
     * @remarks
     * In addition to available items this function returns the `has_more` flag
     * indicating that the iterator isn't reach the end of the iterated range yet.
     *
     * This function can return the empty list of available items but
     * indicates that there are more items is available.
     * This situation appears when the iterator doesn't reach iterated range
     * but database doesn't contains available items yet.
     *
     * If application requests resume state in `return_resume_state` parameter
     * then this function returns `resume_state` that can be used later to
     * resume the iteration from the position after returned items.
     *
     * The structure of the items returned depends on the iterator used.
     * See the description to the appropriated iterator creation function.
     *
     * @param {ParamsOfIteratorNext} params
     * @returns ResultOfIteratorNext
     */
    iterator_next(params) {
        return this.client.request('net.iterator_next', params);
    }
    /**
     * Removes an iterator
     *
     * @remarks
     * Frees all resources allocated in library to serve iterator.
     *
     * Application always should call the `remove_iterator` when iterator
     * is no longer required.
     *
     * @param {RegisteredIterator} params
     * @returns
     */
    remove_iterator(params) {
        return this.client.request('net.remove_iterator', params);
    }
}
exports.NetModule = NetModule;
// debot module
var DebotErrorCode;
(function (DebotErrorCode) {
    DebotErrorCode[DebotErrorCode["DebotStartFailed"] = 801] = "DebotStartFailed";
    DebotErrorCode[DebotErrorCode["DebotFetchFailed"] = 802] = "DebotFetchFailed";
    DebotErrorCode[DebotErrorCode["DebotExecutionFailed"] = 803] = "DebotExecutionFailed";
    DebotErrorCode[DebotErrorCode["DebotInvalidHandle"] = 804] = "DebotInvalidHandle";
    DebotErrorCode[DebotErrorCode["DebotInvalidJsonParams"] = 805] = "DebotInvalidJsonParams";
    DebotErrorCode[DebotErrorCode["DebotInvalidFunctionId"] = 806] = "DebotInvalidFunctionId";
    DebotErrorCode[DebotErrorCode["DebotInvalidAbi"] = 807] = "DebotInvalidAbi";
    DebotErrorCode[DebotErrorCode["DebotGetMethodFailed"] = 808] = "DebotGetMethodFailed";
    DebotErrorCode[DebotErrorCode["DebotInvalidMsg"] = 809] = "DebotInvalidMsg";
    DebotErrorCode[DebotErrorCode["DebotExternalCallFailed"] = 810] = "DebotExternalCallFailed";
    DebotErrorCode[DebotErrorCode["DebotBrowserCallbackFailed"] = 811] = "DebotBrowserCallbackFailed";
    DebotErrorCode[DebotErrorCode["DebotOperationRejected"] = 812] = "DebotOperationRejected";
    DebotErrorCode[DebotErrorCode["DebotNoCode"] = 813] = "DebotNoCode";
})(DebotErrorCode = exports.DebotErrorCode || (exports.DebotErrorCode = {}));
function debotActivityTransaction(msg, dst, out, fee, setcode, signkey, signing_box_handle) {
    return {
        type: 'Transaction',
        msg,
        dst,
        out,
        fee,
        setcode,
        signkey,
        signing_box_handle,
    };
}
exports.debotActivityTransaction = debotActivityTransaction;
function paramsOfAppDebotBrowserLog(msg) {
    return {
        type: 'Log',
        msg,
    };
}
exports.paramsOfAppDebotBrowserLog = paramsOfAppDebotBrowserLog;
function paramsOfAppDebotBrowserSwitch(context_id) {
    return {
        type: 'Switch',
        context_id,
    };
}
exports.paramsOfAppDebotBrowserSwitch = paramsOfAppDebotBrowserSwitch;
function paramsOfAppDebotBrowserSwitchCompleted() {
    return {
        type: 'SwitchCompleted',
    };
}
exports.paramsOfAppDebotBrowserSwitchCompleted = paramsOfAppDebotBrowserSwitchCompleted;
function paramsOfAppDebotBrowserShowAction(action) {
    return {
        type: 'ShowAction',
        action,
    };
}
exports.paramsOfAppDebotBrowserShowAction = paramsOfAppDebotBrowserShowAction;
function paramsOfAppDebotBrowserInput(prompt) {
    return {
        type: 'Input',
        prompt,
    };
}
exports.paramsOfAppDebotBrowserInput = paramsOfAppDebotBrowserInput;
function paramsOfAppDebotBrowserGetSigningBox() {
    return {
        type: 'GetSigningBox',
    };
}
exports.paramsOfAppDebotBrowserGetSigningBox = paramsOfAppDebotBrowserGetSigningBox;
function paramsOfAppDebotBrowserInvokeDebot(debot_addr, action) {
    return {
        type: 'InvokeDebot',
        debot_addr,
        action,
    };
}
exports.paramsOfAppDebotBrowserInvokeDebot = paramsOfAppDebotBrowserInvokeDebot;
function paramsOfAppDebotBrowserSend(message) {
    return {
        type: 'Send',
        message,
    };
}
exports.paramsOfAppDebotBrowserSend = paramsOfAppDebotBrowserSend;
function paramsOfAppDebotBrowserApprove(activity) {
    return {
        type: 'Approve',
        activity,
    };
}
exports.paramsOfAppDebotBrowserApprove = paramsOfAppDebotBrowserApprove;
function resultOfAppDebotBrowserInput(value) {
    return {
        type: 'Input',
        value,
    };
}
exports.resultOfAppDebotBrowserInput = resultOfAppDebotBrowserInput;
function resultOfAppDebotBrowserGetSigningBox(signing_box) {
    return {
        type: 'GetSigningBox',
        signing_box,
    };
}
exports.resultOfAppDebotBrowserGetSigningBox = resultOfAppDebotBrowserGetSigningBox;
function resultOfAppDebotBrowserInvokeDebot() {
    return {
        type: 'InvokeDebot',
    };
}
exports.resultOfAppDebotBrowserInvokeDebot = resultOfAppDebotBrowserInvokeDebot;
function resultOfAppDebotBrowserApprove(approved) {
    return {
        type: 'Approve',
        approved,
    };
}
exports.resultOfAppDebotBrowserApprove = resultOfAppDebotBrowserApprove;
function dispatchAppDebotBrowser(obj, params, app_request_id, client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = {};
            switch (params.type) {
                case 'Log':
                    obj.log(params);
                    break;
                case 'Switch':
                    obj.switch(params);
                    break;
                case 'SwitchCompleted':
                    obj.switch_completed();
                    break;
                case 'ShowAction':
                    obj.show_action(params);
                    break;
                case 'Input':
                    result = yield obj.input(params);
                    break;
                case 'GetSigningBox':
                    result = yield obj.get_signing_box();
                    break;
                case 'InvokeDebot':
                    yield obj.invoke_debot(params);
                    break;
                case 'Send':
                    obj.send(params);
                    break;
                case 'Approve':
                    result = yield obj.approve(params);
                    break;
            }
            client.resolve_app_request(app_request_id, Object.assign({ type: params.type }, result));
        }
        catch (error) {
            client.reject_app_request(app_request_id, error);
        }
    });
}
/**
 * [UNSTABLE](UNSTABLE.md) Module for working with debot.
 */
class DebotModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * [UNSTABLE](UNSTABLE.md) Creates and instance of DeBot.
     *
     * @remarks
     * Downloads debot smart contract (code and data) from blockchain and creates
     * an instance of Debot Engine for it.
     *
     * # Remarks
     * It does not switch debot to context 0. Browser Callbacks are not called.
     *
     * @param {ParamsOfInit} params
     * @returns RegisteredDebot
     */
    init(params, obj) {
        return this.client.request('debot.init', params, (params, responseType) => {
            if (responseType === 3) {
                dispatchAppDebotBrowser(obj, params.request_data, params.app_request_id, this.client);
            }
            else if (responseType === 4) {
                dispatchAppDebotBrowser(obj, params, null, this.client);
            }
        });
    }
    /**
     * [UNSTABLE](UNSTABLE.md) Starts the DeBot.
     *
     * @remarks
     * Downloads debot smart contract from blockchain and switches it to
     * context zero.
     *
     * This function must be used by Debot Browser to start a dialog with debot.
     * While the function is executing, several Browser Callbacks can be called,
     * since the debot tries to display all actions from the context 0 to the user.
     *
     * When the debot starts SDK registers `BrowserCallbacks` AppObject.
     * Therefore when `debote.remove` is called the debot is being deleted and the callback is called
     * with `finish`=`true` which indicates that it will never be used again.
     *
     * @param {ParamsOfStart} params
     * @returns
     */
    start(params) {
        return this.client.request('debot.start', params);
    }
    /**
     * [UNSTABLE](UNSTABLE.md) Fetches DeBot metadata from blockchain.
     *
     * @remarks
     * Downloads DeBot from blockchain and creates and fetches its metadata.
     *
     * @param {ParamsOfFetch} params
     * @returns ResultOfFetch
     */
    fetch(params) {
        return this.client.request('debot.fetch', params);
    }
    /**
     * [UNSTABLE](UNSTABLE.md) Executes debot action.
     *
     * @remarks
     * Calls debot engine referenced by debot handle to execute input action.
     * Calls Debot Browser Callbacks if needed.
     *
     * # Remarks
     * Chain of actions can be executed if input action generates a list of subactions.
     *
     * @param {ParamsOfExecute} params
     * @returns
     */
    execute(params) {
        return this.client.request('debot.execute', params);
    }
    /**
     * [UNSTABLE](UNSTABLE.md) Sends message to Debot.
     *
     * @remarks
     * Used by Debot Browser to send response on Dinterface call or from other Debots.
     *
     * @param {ParamsOfSend} params
     * @returns
     */
    send(params) {
        return this.client.request('debot.send', params);
    }
    /**
     * [UNSTABLE](UNSTABLE.md) Destroys debot handle.
     *
     * @remarks
     * Removes handle from Client Context and drops debot engine referenced by that handle.
     *
     * @param {ParamsOfRemove} params
     * @returns
     */
    remove(params) {
        return this.client.request('debot.remove', params);
    }
}
exports.DebotModule = DebotModule;
// proofs module
var ProofsErrorCode;
(function (ProofsErrorCode) {
    ProofsErrorCode[ProofsErrorCode["InvalidData"] = 901] = "InvalidData";
    ProofsErrorCode[ProofsErrorCode["ProofCheckFailed"] = 902] = "ProofCheckFailed";
    ProofsErrorCode[ProofsErrorCode["InternalError"] = 903] = "InternalError";
    ProofsErrorCode[ProofsErrorCode["DataDiffersFromProven"] = 904] = "DataDiffersFromProven";
})(ProofsErrorCode = exports.ProofsErrorCode || (exports.ProofsErrorCode = {}));
/**
 * [UNSTABLE](UNSTABLE.md) Module for proving data, retrieved from TONOS API.
 */
class ProofsModule {
    constructor(client) {
        this.client = client;
    }
    /**
     * Proves that a given block's data, which is queried from TONOS API, can be trusted.
     *
     * @remarks
     * This function checks block proofs and compares given data with the proven.
     * If the given data differs from the proven, the exception will be thrown.
     * The input param is a single block's JSON object, which was queried from DApp server using
     * functions such as `net.query`, `net.query_collection` or `net.wait_for_collection`.
     * If block's BOC is not provided in the JSON, it will be queried from DApp server
     * (in this case it is required to provide at least `id` of block).
     *
     * Please note, that joins (like `signatures` in `Block`) are separated entities and not supported,
     * so function will throw an exception in a case if JSON being checked has such entities in it.
     *
     * If `cache_in_local_storage` in config is set to `true` (default), downloaded proofs and
     * master-chain BOCs are saved into the persistent local storage (e.g. file system for native
     * environments or browser's IndexedDB for the web); otherwise all the data is cached only in
     * memory in current client's context and will be lost after destruction of the client.
     *
     * **Why Proofs are needed**
     *
     * Proofs are needed to ensure that the data downloaded from a DApp server is real blockchain
     * data. Checking proofs can protect from the malicious DApp server which can potentially provide
     * fake data, or also from "Man in the Middle" attacks class.
     *
     * **What Proofs are**
     *
     * Simply, proof is a list of signatures of validators', which have signed this particular master-
     * block.
     *
     * The very first validator set's public keys are included in the zero-state. Whe know a root hash
     * of the zero-state, because it is stored in the network configuration file, it is our authority
     * root. For proving zero-state it is enough to calculate and compare its root hash.
     *
     * In each new validator cycle the validator set is changed. The new one is stored in a key-block,
     * which is signed by the validator set, which we already trust, the next validator set will be
     * stored to the new key-block and signed by the current validator set, and so on.
     *
     * In order to prove any block in the master-chain we need to check, that it has been signed by
     * a trusted validator set. So we need to check all key-blocks' proofs, started from the zero-state
     * and until the block, which we want to prove. But it can take a lot of time and traffic to
     * download and prove all key-blocks on a client. For solving this, special trusted blocks are used
     * in Ever-SDK.
     *
     * The trusted block is the authority root, as well, as the zero-state. Each trusted block is the
     * `id` (e.g. `root_hash`) of the already proven key-block. There can be plenty of trusted
     * blocks, so there can be a lot of authority roots. The hashes of trusted blocks for MainNet
     * and DevNet are hardcoded in SDK in a separated binary file (trusted_key_blocks.bin) and is
     * being updated for each release by using `update_trusted_blocks` utility.
     *
     * See [update_trusted_blocks](../../../tools/update_trusted_blocks) directory for more info.
     *
     * In future SDK releases, one will also be able to provide their hashes of trusted blocks for
     * other networks, besides for MainNet and DevNet.
     * By using trusted key-blocks, in order to prove any block, we can prove chain of key-blocks to
     * the closest previous trusted key-block, not only to the zero-state.
     *
     * But shard-blocks don't have proofs on DApp server. In this case, in order to prove any shard-
     * block data, we search for a corresponding master-block, which contains the root hash of this
     * shard-block, or some shard block which is linked to that block in shard-chain. After proving
     * this master-block, we traverse through each link and calculate and compare hashes with links,
     * one-by-one. After that we can ensure that this shard-block has also been proven.
     *
     * @param {ParamsOfProofBlockData} params
     * @returns
     */
    proof_block_data(params) {
        return this.client.request('proofs.proof_block_data', params);
    }
    /**
     * Proves that a given transaction's data, which is queried from TONOS API, can be trusted.
     *
     * @remarks
     * This function requests the corresponding block, checks block proofs, ensures that given
     * transaction exists in the proven block and compares given data with the proven.
     * If the given data differs from the proven, the exception will be thrown.
     * The input parameter is a single transaction's JSON object (see params description),
     * which was queried from TONOS API using functions such as `net.query`, `net.query_collection`
     * or `net.wait_for_collection`.
     *
     * If transaction's BOC and/or `block_id` are not provided in the JSON, they will be queried from
     * TONOS API.
     *
     * Please note, that joins (like `account`, `in_message`, `out_messages`, etc. in `Transaction`
     * entity) are separated entities and not supported, so function will throw an exception in a case
     * if JSON being checked has such entities in it.
     *
     * For more information about proofs checking, see description of `proof_block_data` function.
     *
     * @param {ParamsOfProofTransactionData} params
     * @returns
     */
    proof_transaction_data(params) {
        return this.client.request('proofs.proof_transaction_data', params);
    }
    /**
     * Proves that a given message's data, which is queried from TONOS API, can be trusted.
     *
     * @remarks
     * This function first proves the corresponding transaction, ensures that the proven transaction
     * refers to the given message and compares given data with the proven.
     * If the given data differs from the proven, the exception will be thrown.
     * The input parameter is a single message's JSON object (see params description),
     * which was queried from TONOS API using functions such as `net.query`, `net.query_collection`
     * or `net.wait_for_collection`.
     *
     * If message's BOC and/or non-null `src_transaction.id` or `dst_transaction.id` are not provided
     * in the JSON, they will be queried from TONOS API.
     *
     * Please note, that joins (like `block`, `dst_account`, `dst_transaction`, `src_account`,
     * `src_transaction`, etc. in `Message` entity) are separated entities and not supported,
     * so function will throw an exception in a case if JSON being checked has such entities in it.
     *
     * For more information about proofs checking, see description of `proof_block_data` function.
     *
     * @param {ParamsOfProofMessageData} params
     * @returns
     */
    proof_message_data(params) {
        return this.client.request('proofs.proof_message_data', params);
    }
}
exports.ProofsModule = ProofsModule;
//# sourceMappingURL=modules.js.map

/***/ }),

/***/ "./node_modules/@eversdk/lib-web/index.js":
/*!************************************************!*\
  !*** ./node_modules/@eversdk/lib-web/index.js ***!
  \************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "libWeb": () => (/* binding */ libWeb),
/* harmony export */   "libWebSetup": () => (/* binding */ libWebSetup)
/* harmony export */ });
/* module decorator */ module = __webpack_require__.hmd(module);
/*
 * Copyright 2018-2020 TON Labs LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 *
 */

// This file is just a template that used to generate index.js at npm installation stage

const workerScript = `//****************************************************************** WRAPPER BEGIN

let wasm;

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedBigInt64Memory0 = new BigInt64Array();

function getBigInt64Memory0() {
    if (cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  \`\${val}\`;
    }
    if (type == 'string') {
        return \`"\${val}"\`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return \`Symbol(\${description})\`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return \`Function(\${name})\`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\\[object ([^\\]]+)\\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of \`val\`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return \`\${val.name}: \${val.message}\\n\${val.stack}\`;
    }
    // TODO we could test for more things here, like \`Set\`s and \`Map\`s.
    return className;
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
                state.a = 0;

            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_50(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__Fn__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__he8db5fa167706a09(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_53(arg0, arg1) {
    wasm._dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hed540c88454df031(arg0, arg1);
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_56(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc182e4d50354196b(arg0, arg1);
}

function __wbg_adapter_59(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7cbc3c322963706f(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wbg_adapter_62(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3709808ff1741914(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_65(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h6c6161aacd664479(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_68(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h68aa97d113ee360c(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {string} config_json
* @returns {string}
*/
function core_create_context(config_json) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.core_create_context(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(r0, r1);
    }
}

/**
* @param {number} context
*/
function core_destroy_context(context) {
    wasm.core_destroy_context(context);
}

/**
* @param {number} context
* @param {string} function_name
* @param {any} params
* @param {number} request_id
*/
function core_request(context, function_name, params, request_id) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(function_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.core_request(retptr, context, ptr0, len0, addHeapObject(params), request_id);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("\`WebAssembly.instantiateStreaming\` failed because your server does not serve wasm with \`application/wasm\` MIME type. Falling back to \`WebAssembly.instantiate\` which is slower. Original error:\\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function getImports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_new_8d2af00bc1e329ee = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_3f3d764d4747d564 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d9aa266703cb98be = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_newwithlength_7c42f7e738a9d5d3 = function(arg0) {
        const ret = new Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_a68214f35c417fa9 = function(arg0, arg1, arg2) {
        getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_newwithu8arraysequence_f863246af83e1785 = function() { return handleError(function (arg0) {
        const ret = new Blob(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_765201544a2b6869 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_ArrayBuffer_e5e48f4762c5610b = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof ArrayBuffer;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg_new_8c3f0052272a457a = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_keys_0702294afaeb6044 = function(arg0) {
        const ret = Object.keys(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_6e3bbe7c8bd4dbd8 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_get_57245cc7d7c7619d = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_new0_a57059d72c5b7aee = function() {
        const ret = new Date();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getTime_cb82adb2556ed13e = function(arg0) {
        const ret = getObject(arg0).getTime();
        return ret;
    };
    imports.wbg.__wbindgen_jsval_loose_eq = function(arg0, arg1) {
        const ret = getObject(arg0) == getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = getObject(arg0);
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_is_bigint = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'bigint';
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbg_isSafeInteger_dfa0593e8d7ac35a = function(arg0) {
        const ret = Number.isSafeInteger(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbindgen_bigint_get_as_i64 = function(arg0, arg1) {
        const v = getObject(arg1);
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getBigInt64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0n : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbindgen_bigint_from_i64 = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_jsval_eq = function(arg0, arg1) {
        const ret = getObject(arg0) === getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_u64 = function(arg0) {
        const ret = BigInt.asUintN(64, arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_isArray_27c46c67f498e15d = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_iterator_6f9d4f28845f426c = function() {
        const ret = Symbol.iterator;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_in = function(arg0, arg1) {
        const ret = getObject(arg0) in getObject(arg1);
        return ret;
    };
    imports.wbg.__wbg_entries_65a76a413fc91037 = function(arg0) {
        const ret = Object.entries(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = getObject(arg0) === null;
        return ret;
    };
    imports.wbg.__wbg_String_91fba7ded13ba54c = function(arg0, arg1) {
        const ret = String(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_0b9bfdd97583284e = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_String_33099856e8a8246a = function(arg0, arg1) {
        const ret = String(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_coreresponsehandler_a52879454c60c764 = function(arg0, arg1, arg2, arg3) {
        core_response_handler(arg0 >>> 0, takeObject(arg1), arg2 >>> 0, arg3 !== 0);
    };
    imports.wbg.__wbg_message_fe2af63ccc8985bc = function(arg0) {
        const ret = getObject(arg0).message;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_1d9a920c6bfc44a8 = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_268f7b7dd3430798 = function() {
        const ret = new Map();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_933729cf5b66ac11 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'string';
        return ret;
    };
    imports.wbg.__wbg_set_fbc33d020f507b72 = function(arg0, arg1, arg2) {
        getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
    };
    imports.wbg.__wbg_process_0cc2ada8524d6f83 = function(arg0) {
        const ret = getObject(arg0).process;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_versions_c11acceab27a6c87 = function(arg0) {
        const ret = getObject(arg0).versions;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_node_7ff1ce49caf23815 = function(arg0) {
        const ret = getObject(arg0).node;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_NODE_MODULE_cf6401cc1091279e = function() {
        const ret = module;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_require_a746e79b322b9336 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_crypto_2036bed7c44c25e7 = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_msCrypto_a21fc88caf1ecdc8 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithlength_f5933855e4f48a19 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_transaction_cce96cbebd81fe1c = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = getObject(arg0).transaction(getStringFromWasm0(arg1, arg2), takeObject(arg3));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setoncomplete_3e57a8cec8327f66 = function(arg0, arg1) {
        getObject(arg0).oncomplete = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_00051c0213f27b2c = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbg_setonabort_404bee3b9940d03d = function(arg0, arg1) {
        getObject(arg0).onabort = getObject(arg1);
    };
    imports.wbg.__wbg_item_52a6bec36314687b = function(arg0, arg1, arg2) {
        const ret = getObject(arg1).item(arg2 >>> 0);
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_objectStore_f17976b0e6377830 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).objectStore(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_target_bf704b7db7ad1387 = function(arg0) {
        const ret = getObject(arg0).target;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_readyState_fb287f170113917c = function(arg0) {
        const ret = getObject(arg0).readyState;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setonsuccess_5f71593bc51653a3 = function(arg0, arg1) {
        getObject(arg0).onsuccess = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_d5771cc5bf9ea74c = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbg_next_aaef7c8aa5e212ac = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_done_1b73b0672e15f234 = function(arg0) {
        const ret = getObject(arg0).done;
        return ret;
    };
    imports.wbg.__wbg_value_1ccc36bc03462d71 = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbg_call_97ae9d8645dc388b = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_next_579e583d33566a86 = function(arg0) {
        const ret = getObject(arg0).next;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_self_6d479506f72c6a71 = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_window_f2557cc78490aceb = function() { return handleError(function () {
        const ret = window.window;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_globalThis_7f206bda628d5286 = function() { return handleError(function () {
        const ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_global_ba75c50d1cf384f4 = function() { return handleError(function () {
        const ret = global.global;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_newnoargs_b5b063fc6c2f0376 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_83db9690f9353e79 = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    };
    imports.wbg.__wbg_length_9e1ae1900cb0fbd5 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_set_bf3f89b92d5a34bf = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_self_7eede1f4488bf346 = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_crypto_c909fb428dcbddb6 = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_msCrypto_511eefefbfc70ae4 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_MODULE_ef3aa2eb251158a5 = function() {
        const ret = module;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_require_900d5c3984fe7703 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_307049345d0bd88c = function(arg0) {
        const ret = getObject(arg0).getRandomValues;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_randomFillSync_85b3f4c52c56c313 = function(arg0, arg1, arg2) {
        getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_subarray_58ad4efbb5bcb886 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_cd175915511f705e = function(arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    };
    imports.wbg.__wbg_randomFillSync_065afffde01daa66 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_b99eec4244a475bb = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_instanceof_Uint8Array_971eeda69eb75003 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Uint8Array;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_put_84e7fc93eee27b28 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).put(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_delete_8abedd1043b4105d = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).delete(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setTimeout_d6fcf0d9067b8e64 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_clearTimeout_7d6f7bfeed34b348 = function(arg0, arg1) {
        getObject(arg0).clearTimeout(arg1);
    };
    imports.wbg.__wbg_newwithstrandinit_05d7180788420c40 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_headers_85824e993aa739bf = function(arg0) {
        const ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_992c1d31586b2957 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_fetch_0fe04905cccfc2aa = function(arg0, arg1) {
        const ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Response_eaa426220848a39e = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Response;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_status_c4ef3dd591e63435 = function(arg0) {
        const ret = getObject(arg0).status;
        return ret;
    };
    imports.wbg.__wbg_url_74285ddf2747cb3d = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_setonversionchange_840d65cd0888dfb0 = function(arg0, arg1) {
        getObject(arg0).onversionchange = getObject(arg1);
    };
    imports.wbg.__wbg_setonupgradeneeded_17d0b9530f1e0cac = function(arg0, arg1) {
        getObject(arg0).onupgradeneeded = getObject(arg1);
    };
    imports.wbg.__wbg_setonblocked_e66d6be5c879980d = function(arg0, arg1) {
        getObject(arg0).onblocked = getObject(arg1);
    };
    imports.wbg.__wbg_message_a7af3ee0cc0fe28d = function(arg0, arg1) {
        const ret = getObject(arg1).message;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_Window_5684341ff6dfe3ad = function(arg0) {
        const ret = getObject(arg0).Window;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_WorkerGlobalScope_e0447ffcae8bb272 = function(arg0) {
        const ret = getObject(arg0).WorkerGlobalScope;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_indexedDB_050f0962ab607ac5 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).indexedDB;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_indexedDB_8d9e9ab4616df7f0 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).indexedDB;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_open_a31c3fe1fdc244eb = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_newwithstr_d5b5f9b985ee84fb = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_d29e507f6606de91 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setonmessage_c5a806b62a0c5607 = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    };
    imports.wbg.__wbg_setonopen_9ce48dce57e549b5 = function(arg0, arg1) {
        getObject(arg0).onopen = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_02393260b3e29972 = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbg_send_80b256d87a6779e5 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_data_7b1f01f4e6a64fbe = function(arg0) {
        const ret = getObject(arg0).data;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stringify_d6471d300ded9b68 = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_objectStoreNames_8c06c40d2b05141c = function(arg0) {
        const ret = getObject(arg0).objectStoreNames;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_createObjectStore_d3e2789c13dde1fc = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).createObjectStore(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Error_56b496a10a56de66 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Error;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_getTimezoneOffset_89bd4275e1ca8341 = function(arg0) {
        const ret = getObject(arg0).getTimezoneOffset();
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_then_cedad20fbbd9418a = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_resolve_99fe17964f31ffc0 = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_11f7a54d67b4bfad = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_result_9e399c14676970d9 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).result;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_error_aacf5ac191e54ed0 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).error;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_6285bf458a1ee758 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).get(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Window_acc97ff9f5d2c7b4 = function(arg0) {
        let result;
        try {
            result = true;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_close_45d053bea59e7746 = function() { return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments) };
    imports.wbg.__wbg_text_1169d752cc697903 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).text();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_closure_wrapper947 = function(arg0, arg1, arg2) {
        const ret = makeClosure(arg0, arg1, 44, __wbg_adapter_50);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper958 = function(arg0, arg1, arg2) {
        const ret = makeClosure(arg0, arg1, 47, __wbg_adapter_53);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6159 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 238, __wbg_adapter_56);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6824 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 247, __wbg_adapter_59);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6874 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 244, __wbg_adapter_62);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6875 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1206, __wbg_adapter_65);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6876 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 241, __wbg_adapter_68);
        return addHeapObject(ret);
    };

    return imports;
}

function initMemory(imports, maybe_memory) {

}

function finalizeInit(instance, module) {
    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    cachedBigInt64Memory0 = new BigInt64Array();
    cachedFloat64Memory0 = new Float64Array();
    cachedInt32Memory0 = new Int32Array();
    cachedUint8Memory0 = new Uint8Array();


    return wasm;
}

function initSync(module) {
    const imports = getImports();

    initMemory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return finalizeInit(instance, module);
}

async function init(input) {
    if (typeof input === 'undefined') {    }
    const imports = getImports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    initMemory(imports);

    const { instance, module } = await load(await input, imports);

    return finalizeInit(instance, module);
}


//****************************************************************** WRAPPER END

function replaceUndefinedWithNulls(value) {
    if (value === undefined) {
        return null;
    }
    if (value instanceof Blob) {
        return value;
    }
    if (typeof value === "object" && value !== null) {
        const result = Array.isArray(value) ? [] : {};
        for (const key in value) {
            result[key] = replaceUndefinedWithNulls(value[key]);
        }
        return result;
    }
    return value;
};

function core_response_handler(request_id, params, response_type, finished) {
    postMessage({
        type: 'response',
        requestId: request_id,
        params: replaceUndefinedWithNulls(params),
        responseType: response_type,
        finished,
    });
}

async function replaceBlobsWithArrayBuffers(value) {
    if (value instanceof Blob) {
        return await value.arrayBuffer();
    }
    if (typeof value === "bigint") {
        if (value < Number.MAX_SAFE_INTEGER && value > Number.MIN_SAFE_INTEGER) {
            return Number(value);
        } else {
            return value.toString();
        }
    }
    if (typeof value === "object" && value !== null) {
        const result = Array.isArray(value) ? [] : {};
        for (const key in value) {
            result[key] = await replaceBlobsWithArrayBuffers(value[key]);
        }
        return result;
    }
    return value;
}

self.onmessage = (e) => {
    const message = e.data;
    switch (message.type) {
    case 'init':
        (async () => {
            await init(message.wasmModule);
            postMessage({ type: 'init' });
        })();
        break;

    case 'createContext':
        postMessage({
            type: 'createContext',
            result: core_create_context(message.configJson),
            requestId: message.requestId,
        });
        break;

    case 'destroyContext':
        core_destroy_context(message.context);
        postMessage({
            type: 'destroyContext'
        });
        break;

    case 'request':
        (async () => {
            core_request(
                message.context,
                message.functionName,
                await replaceBlobsWithArrayBuffers(message.functionParams),
                message.requestId,
            );
        })();
        break;
    }
};
`;

let options = null;

function libWebSetup(libOptions) {
    options = libOptions;
}

function debugLog(message) {
    if (options && options.debugLog) {
        options.debugLog(message);
    }
}


async function loadModule() {
    const startLoadTime = Date.now();
    let wasmModule;
    if (options && options.loadModule) {
        wasmModule = await options.loadModule;
    } else {
        const fetched = fetch((options && options.binaryURL) || "/eversdk.wasm");
        if (WebAssembly.compileStreaming) {
            debugLog("compileStreaming binary");
            return await WebAssembly.compileStreaming(fetched);
        }
        debugLog("compile binary");
        wasmModule = await WebAssembly.compile(await (await fetched).arrayBuffer());
    }
    await init(wasmModule);
    debugLog(`compile time ${Date.now() - startLoadTime}`);
}

function withSeparateWorker() {
    function debugLog(message) {
        if (options && options.debugLog) {
            options.debugLog(message);
        }
    }

    const workerBlob = new Blob(
        [workerScript],
        { type: "application/javascript" },
    );
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);


    let nextCreateContextRequestId = 1;
    const createContextRequests = new Map();
    let initComplete = false;

    let responseHandler = null;

    worker.onmessage = (evt) => {
        const message = evt.data;
        switch (message.type) {
        case "init":
            initComplete = true;
            for (const [requestId, request] of createContextRequests.entries()) {
                worker.postMessage({
                    type: "createContext",
                    requestId,
                    configJson: request.configJson,
                });
            }
            break;
        case "createContext":
            const request = createContextRequests.get(message.requestId);
            if (request) {
                createContextRequests.delete(message.requestId);
                request.resolve(message.result);
            }
            break;
        case "destroyContext":
            break;
        case "response":
            if (responseHandler) {
                responseHandler(
                    message.requestId,
                    message.params,
                    message.responseType,
                    message.finished,
                );
            }
            break;
        }
    };

    worker.onerror = (evt) => {
        console.log(`Error from Web Worker: ${evt.message}`);
    };

    (async () => {
        worker.postMessage({
            type: "init",
            wasmModule: await loadModule(),
        });
    })();

    return Promise.resolve({
        setResponseParamsHandler: (handler) => {
            responseHandler = handler;
        },
        createContext: (configJson) => {
            return new Promise((resolve) => {
                const requestId = nextCreateContextRequestId;
                nextCreateContextRequestId += 1;
                createContextRequests.set(requestId, {
                    configJson,
                    resolve,
                });
                if (initComplete) {
                    worker.postMessage({
                        type: "createContext",
                        requestId,
                        configJson,
                    });
                }
            });
        },
        destroyContext: (context) => {
            worker.postMessage({
                type: "destroyContext",
                context,
            });
        },
        sendRequestParams: (context, requestId, functionName, functionParams) => {
            worker.postMessage({
                type: "request",
                context,
                requestId,
                functionName,
                functionParams,
            });
        },
    });
}

function withoutSeparateWorker() {
//****************************************************************** WRAPPER BEGIN

let wasm;

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedBigInt64Memory0 = new BigInt64Array();

function getBigInt64Memory0() {
    if (cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
                state.a = 0;

            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_50(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__Fn__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__he8db5fa167706a09(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_53(arg0, arg1) {
    wasm._dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hed540c88454df031(arg0, arg1);
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_56(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc182e4d50354196b(arg0, arg1);
}

function __wbg_adapter_59(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7cbc3c322963706f(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wbg_adapter_62(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3709808ff1741914(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_65(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h6c6161aacd664479(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_68(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h68aa97d113ee360c(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {string} config_json
* @returns {string}
*/
function core_create_context(config_json) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.core_create_context(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(r0, r1);
    }
}

/**
* @param {number} context
*/
function core_destroy_context(context) {
    wasm.core_destroy_context(context);
}

/**
* @param {number} context
* @param {string} function_name
* @param {any} params
* @param {number} request_id
*/
function core_request(context, function_name, params, request_id) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(function_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.core_request(retptr, context, ptr0, len0, addHeapObject(params), request_id);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function getImports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_new_8d2af00bc1e329ee = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_3f3d764d4747d564 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d9aa266703cb98be = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_newwithlength_7c42f7e738a9d5d3 = function(arg0) {
        const ret = new Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_a68214f35c417fa9 = function(arg0, arg1, arg2) {
        getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_newwithu8arraysequence_f863246af83e1785 = function() { return handleError(function (arg0) {
        const ret = new Blob(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_765201544a2b6869 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_ArrayBuffer_e5e48f4762c5610b = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof ArrayBuffer;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg_new_8c3f0052272a457a = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_keys_0702294afaeb6044 = function(arg0) {
        const ret = Object.keys(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_6e3bbe7c8bd4dbd8 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_get_57245cc7d7c7619d = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_new0_a57059d72c5b7aee = function() {
        const ret = new Date();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getTime_cb82adb2556ed13e = function(arg0) {
        const ret = getObject(arg0).getTime();
        return ret;
    };
    imports.wbg.__wbindgen_jsval_loose_eq = function(arg0, arg1) {
        const ret = getObject(arg0) == getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = getObject(arg0);
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_is_bigint = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'bigint';
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbg_isSafeInteger_dfa0593e8d7ac35a = function(arg0) {
        const ret = Number.isSafeInteger(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbindgen_bigint_get_as_i64 = function(arg0, arg1) {
        const v = getObject(arg1);
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getBigInt64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0n : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbindgen_bigint_from_i64 = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_jsval_eq = function(arg0, arg1) {
        const ret = getObject(arg0) === getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_u64 = function(arg0) {
        const ret = BigInt.asUintN(64, arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_isArray_27c46c67f498e15d = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_iterator_6f9d4f28845f426c = function() {
        const ret = Symbol.iterator;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_in = function(arg0, arg1) {
        const ret = getObject(arg0) in getObject(arg1);
        return ret;
    };
    imports.wbg.__wbg_entries_65a76a413fc91037 = function(arg0) {
        const ret = Object.entries(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = getObject(arg0) === null;
        return ret;
    };
    imports.wbg.__wbg_String_91fba7ded13ba54c = function(arg0, arg1) {
        const ret = String(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_0b9bfdd97583284e = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_String_33099856e8a8246a = function(arg0, arg1) {
        const ret = String(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_coreresponsehandler_a52879454c60c764 = function(arg0, arg1, arg2, arg3) {
        core_response_handler(arg0 >>> 0, takeObject(arg1), arg2 >>> 0, arg3 !== 0);
    };
    imports.wbg.__wbg_message_fe2af63ccc8985bc = function(arg0) {
        const ret = getObject(arg0).message;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_1d9a920c6bfc44a8 = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_268f7b7dd3430798 = function() {
        const ret = new Map();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_933729cf5b66ac11 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'string';
        return ret;
    };
    imports.wbg.__wbg_set_fbc33d020f507b72 = function(arg0, arg1, arg2) {
        getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
    };
    imports.wbg.__wbg_process_0cc2ada8524d6f83 = function(arg0) {
        const ret = getObject(arg0).process;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_versions_c11acceab27a6c87 = function(arg0) {
        const ret = getObject(arg0).versions;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_node_7ff1ce49caf23815 = function(arg0) {
        const ret = getObject(arg0).node;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_NODE_MODULE_cf6401cc1091279e = function() {
        const ret = module;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_require_a746e79b322b9336 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_crypto_2036bed7c44c25e7 = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_msCrypto_a21fc88caf1ecdc8 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithlength_f5933855e4f48a19 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_transaction_cce96cbebd81fe1c = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = getObject(arg0).transaction(getStringFromWasm0(arg1, arg2), takeObject(arg3));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setoncomplete_3e57a8cec8327f66 = function(arg0, arg1) {
        getObject(arg0).oncomplete = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_00051c0213f27b2c = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbg_setonabort_404bee3b9940d03d = function(arg0, arg1) {
        getObject(arg0).onabort = getObject(arg1);
    };
    imports.wbg.__wbg_item_52a6bec36314687b = function(arg0, arg1, arg2) {
        const ret = getObject(arg1).item(arg2 >>> 0);
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_objectStore_f17976b0e6377830 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).objectStore(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_target_bf704b7db7ad1387 = function(arg0) {
        const ret = getObject(arg0).target;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_readyState_fb287f170113917c = function(arg0) {
        const ret = getObject(arg0).readyState;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setonsuccess_5f71593bc51653a3 = function(arg0, arg1) {
        getObject(arg0).onsuccess = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_d5771cc5bf9ea74c = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbg_next_aaef7c8aa5e212ac = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_done_1b73b0672e15f234 = function(arg0) {
        const ret = getObject(arg0).done;
        return ret;
    };
    imports.wbg.__wbg_value_1ccc36bc03462d71 = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbg_call_97ae9d8645dc388b = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_next_579e583d33566a86 = function(arg0) {
        const ret = getObject(arg0).next;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_self_6d479506f72c6a71 = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_window_f2557cc78490aceb = function() { return handleError(function () {
        const ret = window.window;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_globalThis_7f206bda628d5286 = function() { return handleError(function () {
        const ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_global_ba75c50d1cf384f4 = function() { return handleError(function () {
        const ret = __webpack_require__.g.global;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_newnoargs_b5b063fc6c2f0376 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_83db9690f9353e79 = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    };
    imports.wbg.__wbg_length_9e1ae1900cb0fbd5 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_set_bf3f89b92d5a34bf = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_self_7eede1f4488bf346 = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_crypto_c909fb428dcbddb6 = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_msCrypto_511eefefbfc70ae4 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_MODULE_ef3aa2eb251158a5 = function() {
        const ret = module;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_require_900d5c3984fe7703 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_307049345d0bd88c = function(arg0) {
        const ret = getObject(arg0).getRandomValues;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_randomFillSync_85b3f4c52c56c313 = function(arg0, arg1, arg2) {
        getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_subarray_58ad4efbb5bcb886 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_cd175915511f705e = function(arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    };
    imports.wbg.__wbg_randomFillSync_065afffde01daa66 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_b99eec4244a475bb = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_instanceof_Uint8Array_971eeda69eb75003 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Uint8Array;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_put_84e7fc93eee27b28 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).put(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_delete_8abedd1043b4105d = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).delete(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setTimeout_d6fcf0d9067b8e64 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_clearTimeout_7d6f7bfeed34b348 = function(arg0, arg1) {
        getObject(arg0).clearTimeout(arg1);
    };
    imports.wbg.__wbg_newwithstrandinit_05d7180788420c40 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_headers_85824e993aa739bf = function(arg0) {
        const ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_992c1d31586b2957 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_fetch_0fe04905cccfc2aa = function(arg0, arg1) {
        const ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Response_eaa426220848a39e = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Response;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_status_c4ef3dd591e63435 = function(arg0) {
        const ret = getObject(arg0).status;
        return ret;
    };
    imports.wbg.__wbg_url_74285ddf2747cb3d = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_setonversionchange_840d65cd0888dfb0 = function(arg0, arg1) {
        getObject(arg0).onversionchange = getObject(arg1);
    };
    imports.wbg.__wbg_setonupgradeneeded_17d0b9530f1e0cac = function(arg0, arg1) {
        getObject(arg0).onupgradeneeded = getObject(arg1);
    };
    imports.wbg.__wbg_setonblocked_e66d6be5c879980d = function(arg0, arg1) {
        getObject(arg0).onblocked = getObject(arg1);
    };
    imports.wbg.__wbg_message_a7af3ee0cc0fe28d = function(arg0, arg1) {
        const ret = getObject(arg1).message;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_Window_5684341ff6dfe3ad = function(arg0) {
        const ret = getObject(arg0).Window;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_WorkerGlobalScope_e0447ffcae8bb272 = function(arg0) {
        const ret = getObject(arg0).WorkerGlobalScope;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_indexedDB_050f0962ab607ac5 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).indexedDB;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_indexedDB_8d9e9ab4616df7f0 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).indexedDB;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_open_a31c3fe1fdc244eb = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_newwithstr_d5b5f9b985ee84fb = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_d29e507f6606de91 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setonmessage_c5a806b62a0c5607 = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    };
    imports.wbg.__wbg_setonopen_9ce48dce57e549b5 = function(arg0, arg1) {
        getObject(arg0).onopen = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_02393260b3e29972 = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbg_send_80b256d87a6779e5 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_data_7b1f01f4e6a64fbe = function(arg0) {
        const ret = getObject(arg0).data;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stringify_d6471d300ded9b68 = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_objectStoreNames_8c06c40d2b05141c = function(arg0) {
        const ret = getObject(arg0).objectStoreNames;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_createObjectStore_d3e2789c13dde1fc = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).createObjectStore(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Error_56b496a10a56de66 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Error;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_getTimezoneOffset_89bd4275e1ca8341 = function(arg0) {
        const ret = getObject(arg0).getTimezoneOffset();
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_then_cedad20fbbd9418a = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_resolve_99fe17964f31ffc0 = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_11f7a54d67b4bfad = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_result_9e399c14676970d9 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).result;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_error_aacf5ac191e54ed0 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).error;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_6285bf458a1ee758 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).get(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Window_acc97ff9f5d2c7b4 = function(arg0) {
        let result;
        try {
            result = true;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_close_45d053bea59e7746 = function() { return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments) };
    imports.wbg.__wbg_text_1169d752cc697903 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).text();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_closure_wrapper947 = function(arg0, arg1, arg2) {
        const ret = makeClosure(arg0, arg1, 44, __wbg_adapter_50);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper958 = function(arg0, arg1, arg2) {
        const ret = makeClosure(arg0, arg1, 47, __wbg_adapter_53);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6159 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 238, __wbg_adapter_56);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6824 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 247, __wbg_adapter_59);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6874 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 244, __wbg_adapter_62);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6875 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1206, __wbg_adapter_65);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6876 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 241, __wbg_adapter_68);
        return addHeapObject(ret);
    };

    return imports;
}

function initMemory(imports, maybe_memory) {

}

function finalizeInit(instance, module) {
    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    cachedBigInt64Memory0 = new BigInt64Array();
    cachedFloat64Memory0 = new Float64Array();
    cachedInt32Memory0 = new Int32Array();
    cachedUint8Memory0 = new Uint8Array();


    return wasm;
}

function initSync(module) {
    const imports = getImports();

    initMemory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return finalizeInit(instance, module);
}

async function init(input) {
    if (typeof input === 'undefined') {    }
    const imports = getImports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    initMemory(imports);

    const { instance, module } = await load(await input, imports);

    return finalizeInit(instance, module);
}


//****************************************************************** WRAPPER END
    function replaceUndefinedWithNulls(value) {
        if (value === undefined) {
            return null;
        }
        if (value instanceof Blob) {
            return value;
        }
        if (typeof value === "object" && value !== null) {
            const result = Array.isArray(value) ? [] : {};
            for (const key in value) {
                result[key] = replaceUndefinedWithNulls(value[key]);
            }
            return result;
        }
        return value;
    }

    async function replaceBlobsWithArrayBuffers(value) {
        if (value instanceof Blob) {
            return await value.arrayBuffer();
        }
        if (typeof value === "bigint") {
            if (value < Number.MAX_SAFE_INTEGER && value > Number.MIN_SAFE_INTEGER) {
                return Number(value);
            } else {
                return value.toString();
            }
        }
        if (typeof value === "object" && value !== null) {
            const result = Array.isArray(value) ? [] : {};
            for (const key in value) {
                result[key] = await replaceBlobsWithArrayBuffers(value[key]);
            }
            return result;
        }
        return value;
    }


    let deferredCreateContext = [];
    let responseHandler = null;

    function core_response_handler(request_id, params, response_type, finished) {
        if (responseHandler) {
            responseHandler(
                request_id,
                params,
                response_type,
                finished,
            );
        }
    }

    (async () => {
        await init(await loadModule());
        for (const createContext of deferredCreateContext) {
            createContext.resolve(core_create_context(createContext.configJson));
        }
        deferredCreateContext = null;
    })();

    return Promise.resolve({
        setResponseParamsHandler: (handler) => {
            responseHandler = handler;
        },
        createContext: (configJson) => {
            return deferredCreateContext === null
                ? Promise.resolve(core_create_context(configJson))
                : new Promise((resolve) => {
                    deferredCreateContext.push({
                        configJson,
                        resolve,
                    });
                });
        },
        destroyContext: (context) => {
            core_destroy_context(context);
        },
        sendRequestParams: (context, requestId, functionName, functionParams) => {
            (async () => {
                core_request(
                    context,
                    functionName,
                    await replaceBlobsWithArrayBuffers(functionParams),
                    requestId,
                );
            })();
        },
    });

}

function libWeb() {
    return options && options.disableSeparateWorker ? withoutSeparateWorker() : withSeparateWorker();
}


/***/ }),

/***/ "./src/HelloContract.js":
/*!******************************!*\
  !*** ./src/HelloContract.js ***!
  \******************************/
/***/ ((module) => {

const abi = {
	"ABI version": 2,
	"header": ["time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "touch",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "getTimestamp",
			"inputs": [
			],
			"outputs": [
				{"name":"value0","type":"uint256"}
			]
		}
	],
	"data": [
	],
	"events": [
	]
};

const contractPackage = {
    abi,
    tvcInBase64: 'te6ccgECEgEAAisAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAib/APSkICLAAZL0oOGK7VNYMPShCAQBCvSkIPShBQIDzsAHBgAv12omhp/+mf6YBrhf/8NT/8MPwzfDH8MUAC/3whZGX//CHnhZ/8I2eFgHwlAOX/5PaqQCASALCQH+/38h7UTQINdJwgGOFNP/0z/TANcL//hqf/hh+Gb4Y/hijhv0BXD4anABgED0DvK91wv/+GJw+GNw+GZ/+GHi0wABn4ECANcYIPkBWPhC+RDyqN7TPwGOHvhDIbkgnzAg+COBA+iogggbd0Cgud6S+GPggDTyNNjTHwH4I7zyuQoAONMfIcEDIoIQ/////byxkvI84AHwAfhHbpLyPN4CASANDACzvUWq+f/CC3Rx52omgQa6ThAMcKaf/pn+mAa4X//DU//DD8M3wx/DFHDfoCuHw1OADAIHoHeV7rhf/8MTh8Mbh8Mz/8MPFvfCN5Obj8M2j8AHwR/DV4Ab/8M8AgEgDw4AL7tzEuRfhBbpLwBN7R+AD4I/hq8AN/+GeAIBIBEQAIO586yQfwgt0l4Am9o/CUQ4H/HEZHoaYD9IBgY5GfDkGdAMGegZ8DnwOfJPzrJBxDnhf/kuP2Abxhgf8l4Ae8//DPAAatxwItDWAjHSADDcIccAkOAh1w0fkvI84VMRkOHBAyKCEP////28sZLyPOAB8AH4R26S8jze',
};

module.exports = contractPackage;


/***/ }),

/***/ "./src/GiverV2.keys.json":
/*!*******************************!*\
  !*** ./src/GiverV2.keys.json ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"public":"2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16","secret":"172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3"}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.hmd = (module) => {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: () => {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _eversdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @eversdk/core */ "./node_modules/@eversdk/core/dist/index.js");
/* harmony import */ var _eversdk_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_eversdk_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _eversdk_lib_web__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @eversdk/lib-web */ "./node_modules/@eversdk/lib-web/index.js");
/* harmony import */ var _HelloContract_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HelloContract.js */ "./src/HelloContract.js");
/* harmony import */ var _HelloContract_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_HelloContract_js__WEBPACK_IMPORTED_MODULE_2__);





_eversdk_core__WEBPACK_IMPORTED_MODULE_0__.TonClient.useBinaryLibrary(_eversdk_lib_web__WEBPACK_IMPORTED_MODULE_1__.libWeb);
const client = new _eversdk_core__WEBPACK_IMPORTED_MODULE_0__.TonClient({
    network: {
        server_address: "http://localhost:80"
    }
});

function setText(id, text) {
    document.getElementById(id).innerText = text
}

// Address of giver on Evernode SE
const giverAddress = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';
// Giver ABI on Evernode SE
const giverAbi = (0,_eversdk_core__WEBPACK_IMPORTED_MODULE_0__.abiContract)({
    'ABI version': 2,
    header: ['time', 'expire'],
    functions: [
        {
            name: 'sendTransaction',
            inputs: [
                { 'name': 'dest', 'type': 'address' },
                { 'name': 'value', 'type': 'uint128' },
                { 'name': 'bounce', 'type': 'bool' }
            ],
            outputs: []
        },
        {
            name: 'getMessages',
            inputs: [],
            outputs: [
                {
                    components: [
                        { name: 'hash', type: 'uint256' },
                        { name: 'expireAt', type: 'uint64' }
                    ],
                    name: 'messages',
                    type: 'tuple[]'
                }
            ]
        },
        {
            name: 'upgrade',
            inputs: [
                { name: 'newcode', type: 'cell' }
            ],
            outputs: []
        },
        {
            name: 'constructor',
            inputs: [],
            outputs: []
        }
    ],
    data: [],
    events: []
});
// Giver keypair:
const giverKeyPair = __webpack_require__(/*! ./GiverV2.keys.json */ "./src/GiverV2.keys.json");

// Requesting 10 local test tokens from Evernode SE giver
async function get_tokens_from_giver(client, account) {
    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: giverAbi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: 10_000_000_000,
                    bounce: false
                }
            },
            signer: {
                type: 'Keys',
                keys: giverKeyPair
            },
        },
    }
    await client.processing.process_message(params)
}


window.addEventListener('load', async () => {
    setText("version", (await client.client.version()).version);
    // Define contract ABI in the Application
    // See more info about ABI type here https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_abi.md#abi
    const abi = (0,_eversdk_core__WEBPACK_IMPORTED_MODULE_0__.abiContract)((_HelloContract_js__WEBPACK_IMPORTED_MODULE_2___default().abi));

    // Generate an ed25519 key pair
    const helloKeys = await client.crypto.generate_random_sign_keys();

    // Prepare parameters for deploy message encoding
    // See more info about `encode_message` method parameters here https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_abi.md#encode_message
    const deployOptions = {
        abi,
        deploy_set: {
            tvc: (_HelloContract_js__WEBPACK_IMPORTED_MODULE_2___default().tvcInBase64),
            initial_data: {}
        },
        call_set: {
            function_name: 'constructor',
            input: {}
        },
        signer: {
            type: 'Keys',
            keys: helloKeys
        }
    }

    // Encode deploy message
    // Get future `Hello` contract address from `encode_message` result
    // to sponsor it with tokens before deploy
    const { address } = await client.abi.encode_message(deployOptions);
    setText("address", address);

    // Request contract deployment funds form a local Evernode SE giver
    // not suitable for other networks
    await get_tokens_from_giver(client, address);
    setText("prepaid", "Success")

    // Deploy `hello` contract
    // See more info about `process_message` here
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_processing.md#process_message
    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
    });

    setText("deployed", "Success")

    // Encode the message with `touch` function call
    const params = {
        send_events: false,
        message_encode_params: {
            address,
            abi,
            call_set: {
                function_name: 'touch',
                input: {}
            },
            // There is no pubkey key check in the contract
            // so we can leave it empty. Never use this approach in production
            // because anyone can call this function
            signer: { type: 'None' }
        }
    }
    // Call `touch` function
    let response = await client.processing.process_message(params);
    setText("touchOutput", JSON.stringify(response.decoded.output));

    // console.log(`Contract run transaction with output ${response.decoded.output}, ${response.transaction.id}`);

    // Execute the get method `getTimestamp` on the latest account's state
    // This can be managed in 3 steps:
    // 1. Download the latest Account State (BOC)
    // 2. Encode message
    // 3. Execute the message locally on the downloaded state
    const [boc, message] = await Promise.all([
        // Download the latest state (so-called BOC)
        // See more info about query method here
        // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_net.md#query
        // See more about BOC here https://docs.ton.dev/86757ecb2/p/45e664-basics-of-free-ton-blockchain/t/11b639
        client.net
            .query({
                query: `
                query {
                  blockchain {
                    account(
                      address: "${address}"
                    ) {
                       info {
                        boc
                      }
                    }
                  }
                }`,
            })
            .then(({ result }) => result.data.blockchain.account.info.boc)
            .catch(() => {
                throw Error(`Failed to fetch account data`)
            }),
        // Encode the message with `getTimestamp` call
        client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getTimestamp',
                input: {}
            },
            signer: { type: 'None' }
        }).then(({ message }) => message)
    ]);

    // Execute `getTimestamp` get method  (execute the message locally on TVM)
    // See more info about run_tvm method here
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_tvm.md#run_tvm
    response = await client.tvm.run_tvm({ message, account: boc, abi });
    setText("getTimestampOutput", Number.parseInt(response.decoded.output.value0));
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsbUJBQW1CO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSw0QkFBNEI7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxjQUFjO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLDZCQUE2QjtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSw4QkFBOEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsNkJBQTZCO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSw2QkFBNkI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxtQ0FBbUM7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLG1DQUFtQztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLHNCQUFzQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxvQkFBb0I7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkVBQTZFO0FBQzdFO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhEQUE4RDtBQUM5RDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRTtBQUNsRTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFO0FBQ2xFO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBQTJEO0FBQzNEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsNkRBQTZEO0FBQzdEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsNkRBQTZEO0FBQzdEO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRDtBQUNBO0FBQ0EsS0FBSztBQUNMLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRTtBQUNyRTtBQUNBLEtBQUs7QUFDTCxzRUFBc0U7QUFDdEU7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRDtBQUNBO0FBQ0EsS0FBSztBQUNMLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0EsS0FBSztBQUNMLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLHdFQUF3RTtBQUN4RTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBEO0FBQzFEO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRUFBZ0U7QUFDaEU7QUFDQTtBQUNBLEtBQUs7QUFDTCxnRUFBZ0U7QUFDaEU7QUFDQTtBQUNBLEtBQUs7QUFDTCwyREFBMkQ7QUFDM0Q7QUFDQTtBQUNBLEtBQUs7QUFDTCxpRUFBaUU7QUFDakU7QUFDQTtBQUNBLEtBQUs7QUFDTCwwREFBMEQ7QUFDMUQ7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQ7QUFDM0Q7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRUFBZ0U7QUFDaEU7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdFQUF3RTtBQUN4RTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkRBQTZEO0FBQzdEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsNERBQTREO0FBQzVEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RDtBQUNBLEtBQUs7QUFDTCwyREFBMkQ7QUFDM0Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxZQUFZLG1CQUFtQjs7QUFFL0I7QUFDQTs7O0FBR0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhEQUE4RDtBQUM5RDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRTtBQUNsRTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFO0FBQ2xFO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBQTJEO0FBQzNEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsNkRBQTZEO0FBQzdEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsNkRBQTZEO0FBQzdELG9CQUFvQixxQkFBTTtBQUMxQjtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsMkRBQTJEO0FBQzNEO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUVBQXFFO0FBQ3JFO0FBQ0EsS0FBSztBQUNMLHNFQUFzRTtBQUN0RTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsNkRBQTZEO0FBQzdEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0Esd0VBQXdFO0FBQ3hFO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQ7QUFDMUQ7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdFQUFnRTtBQUNoRTtBQUNBO0FBQ0EsS0FBSztBQUNMLGdFQUFnRTtBQUNoRTtBQUNBO0FBQ0EsS0FBSztBQUNMLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0EsS0FBSztBQUNMLDBEQUEwRDtBQUMxRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdFQUFnRTtBQUNoRTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0VBQXdFO0FBQ3hFO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQ7QUFDN0Q7QUFDQTtBQUNBLEtBQUs7QUFDTCw0REFBNEQ7QUFDNUQ7QUFDQTtBQUNBLEtBQUs7QUFDTCwwREFBMEQ7QUFDMUQ7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTREO0FBQzVEO0FBQ0EsS0FBSztBQUNMLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBLFlBQVksbUJBQW1COztBQUUvQjtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakIs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d0IsSUFBSSx3QkFBd0I7O0FBRS9HO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLFFBQVE7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYixxQkFBcUIsUUFBUTtBQUM3QjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHNCQUFzQjtBQUN0QixTQUFTLFVBQVUsU0FBUztBQUM1Qjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsNEJBQTRCO0FBQ3RFO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vLi9ub2RlX21vZHVsZXMvQGV2ZXJzZGsvY29yZS9kaXN0L2Jpbi5qcyIsIndlYnBhY2s6Ly90b25jbGllbnQtd2ViLWhlbGxvLy4vbm9kZV9tb2R1bGVzL0BldmVyc2RrL2NvcmUvZGlzdC9jbGllbnQuanMiLCJ3ZWJwYWNrOi8vdG9uY2xpZW50LXdlYi1oZWxsby8uL25vZGVfbW9kdWxlcy9AZXZlcnNkay9jb3JlL2Rpc3QvZXJyb3JzLmpzIiwid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vLi9ub2RlX21vZHVsZXMvQGV2ZXJzZGsvY29yZS9kaXN0L2luZGV4LmpzIiwid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vLi9ub2RlX21vZHVsZXMvQGV2ZXJzZGsvY29yZS9kaXN0L21vZHVsZXMuanMiLCJ3ZWJwYWNrOi8vdG9uY2xpZW50LXdlYi1oZWxsby8uL25vZGVfbW9kdWxlcy9AZXZlcnNkay9saWItd2ViL2luZGV4LmpzIiwid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vLi9zcmMvSGVsbG9Db250cmFjdC5qcyIsIndlYnBhY2s6Ly90b25jbGllbnQtd2ViLWhlbGxvL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vdG9uY2xpZW50LXdlYi1oZWxsby93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdG9uY2xpZW50LXdlYi1oZWxsby93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vd2VicGFjay9ydW50aW1lL2hhcm1vbnkgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly90b25jbGllbnQtd2ViLWhlbGxvL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vdG9uY2xpZW50LXdlYi1oZWxsby93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RvbmNsaWVudC13ZWItaGVsbG8vLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ29tbW9uQmluYXJ5QnJpZGdlID0gZXhwb3J0cy51c2VMaWJyYXJ5ID0gZXhwb3J0cy5nZXRCcmlkZ2UgPSBleHBvcnRzLlJlc3BvbnNlVHlwZSA9IHZvaWQgMDtcbmNvbnN0IGVycm9yc18xID0gcmVxdWlyZShcIi4vZXJyb3JzXCIpO1xudmFyIFJlc3BvbnNlVHlwZTtcbihmdW5jdGlvbiAoUmVzcG9uc2VUeXBlKSB7XG4gICAgUmVzcG9uc2VUeXBlW1Jlc3BvbnNlVHlwZVtcIlN1Y2Nlc3NcIl0gPSAwXSA9IFwiU3VjY2Vzc1wiO1xuICAgIFJlc3BvbnNlVHlwZVtSZXNwb25zZVR5cGVbXCJFcnJvclwiXSA9IDFdID0gXCJFcnJvclwiO1xuICAgIFJlc3BvbnNlVHlwZVtSZXNwb25zZVR5cGVbXCJOb3BcIl0gPSAyXSA9IFwiTm9wXCI7XG4gICAgUmVzcG9uc2VUeXBlW1Jlc3BvbnNlVHlwZVtcIkFwcFJlcXVlc3RcIl0gPSAzXSA9IFwiQXBwUmVxdWVzdFwiO1xuICAgIFJlc3BvbnNlVHlwZVtSZXNwb25zZVR5cGVbXCJBcHBOb3RpZnlcIl0gPSA0XSA9IFwiQXBwTm90aWZ5XCI7XG4gICAgUmVzcG9uc2VUeXBlW1Jlc3BvbnNlVHlwZVtcIkN1c3RvbVwiXSA9IDEwMF0gPSBcIkN1c3RvbVwiO1xufSkoUmVzcG9uc2VUeXBlID0gZXhwb3J0cy5SZXNwb25zZVR5cGUgfHwgKGV4cG9ydHMuUmVzcG9uc2VUeXBlID0ge30pKTtcbmxldCBicmlkZ2UgPSB1bmRlZmluZWQ7XG5mdW5jdGlvbiBnZXRCcmlkZ2UoKSB7XG4gICAgaWYgKCFicmlkZ2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IGVycm9yc18xLlRvbkNsaWVudEVycm9yKDEsIFwiVE9OIENsaWVudCBiaW5hcnkgYnJpZGdlIGlzbid0IHNldC5cIik7XG4gICAgfVxuICAgIHJldHVybiBicmlkZ2U7XG59XG5leHBvcnRzLmdldEJyaWRnZSA9IGdldEJyaWRnZTtcbmZ1bmN0aW9uIHVzZUxpYnJhcnkobG9hZGVyKSB7XG4gICAgaWYgKFwiY3JlYXRlQ29udGV4dFwiIGluIGxvYWRlcikge1xuICAgICAgICBicmlkZ2UgPSBsb2FkZXI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBicmlkZ2UgPSBuZXcgQ29tbW9uQmluYXJ5QnJpZGdlKGxvYWRlcik7XG4gICAgfVxufVxuZXhwb3J0cy51c2VMaWJyYXJ5ID0gdXNlTGlicmFyeTtcbmNsYXNzIEJpbmFyeUxpYnJhcnlBZGFwdGVyIHtcbiAgICBjb25zdHJ1Y3RvcihsaWJyYXJ5KSB7XG4gICAgICAgIHRoaXMubGlicmFyeSA9IGxpYnJhcnk7XG4gICAgfVxuICAgIHNldFJlc3BvbnNlUGFyYW1zSGFuZGxlcihoYW5kbGVyKSB7XG4gICAgICAgIGlmIChoYW5kbGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMubGlicmFyeS5zZXRSZXNwb25zZUhhbmRsZXIodW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGlicmFyeS5zZXRSZXNwb25zZUhhbmRsZXIoKHJlcXVlc3RJZCwgcGFyYW1zSnNvbiwgcmVzcG9uc2VUeXBlLCBmaW5pc2hlZCkgPT4gaGFuZGxlcihyZXF1ZXN0SWQsIHBhcmFtc0pzb24gIT09IFwiXCIgPyBKU09OLnBhcnNlKHBhcmFtc0pzb24pIDogdW5kZWZpbmVkLCByZXNwb25zZVR5cGUsIGZpbmlzaGVkKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2VuZFJlcXVlc3RQYXJhbXMoY29udGV4dCwgcmVxdWVzdElkLCBmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtc0pzb24gPSAoZnVuY3Rpb25QYXJhbXMgPT09IHVuZGVmaW5lZCkgfHwgKGZ1bmN0aW9uUGFyYW1zID09PSBudWxsKVxuICAgICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgICA6IEpTT04uc3RyaW5naWZ5KGZ1bmN0aW9uUGFyYW1zLCAoXywgdmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gXCJiaWdpbnRcIlxuICAgICAgICAgICAgICAgID8gKHZhbHVlIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgJiYgdmFsdWUgPiBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxuICAgICAgICAgICAgICAgICAgICA/IE51bWJlcih2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiB2YWx1ZS50b1N0cmluZygpKVxuICAgICAgICAgICAgICAgIDogdmFsdWUpO1xuICAgICAgICB0aGlzLmxpYnJhcnkuc2VuZFJlcXVlc3QoY29udGV4dCwgcmVxdWVzdElkLCBmdW5jdGlvbk5hbWUsIHBhcmFtc0pzb24pO1xuICAgIH1cbiAgICBjcmVhdGVDb250ZXh0KGNvbmZpZ0pzb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlicmFyeS5jcmVhdGVDb250ZXh0KGNvbmZpZ0pzb24pO1xuICAgIH1cbiAgICBkZXN0cm95Q29udGV4dChjb250ZXh0KSB7XG4gICAgICAgIHRoaXMubGlicmFyeS5kZXN0cm95Q29udGV4dChjb250ZXh0KTtcbiAgICB9XG59XG5jbGFzcyBDb21tb25CaW5hcnlCcmlkZ2Uge1xuICAgIGNvbnN0cnVjdG9yKGxvYWRlcikge1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubG9hZEVycm9yID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmxpYnJhcnkgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMucmVxdWVzdHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubmV4dFJlcXVlc3RJZCA9IDE7XG4gICAgICAgIHRoaXMuY29udGV4dENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5yZXNwb25zZUhhbmRsZXJBc3NpZ25lZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBbXTtcbiAgICAgICAgbG9hZGVyKCkudGhlbigobGlicmFyeSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZUxvYWRpbmcgPSB0aGlzLmxvYWRpbmc7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgbGlicmFyeVdpdGhQYXJhbXMgPSBcInNldFJlc3BvbnNlUGFyYW1zSGFuZGxlclwiIGluIGxpYnJhcnlcbiAgICAgICAgICAgICAgICA/IGxpYnJhcnlcbiAgICAgICAgICAgICAgICA6IG5ldyBCaW5hcnlMaWJyYXJ5QWRhcHRlcihsaWJyYXJ5KTtcbiAgICAgICAgICAgIHRoaXMubGlicmFyeSA9IGxpYnJhcnlXaXRoUGFyYW1zO1xuICAgICAgICAgICAgc2F2ZUxvYWRpbmcgPT09IG51bGwgfHwgc2F2ZUxvYWRpbmcgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHNhdmVMb2FkaW5nLmZvckVhY2goeCA9PiB4LnJlc29sdmUobGlicmFyeVdpdGhQYXJhbXMpKTtcbiAgICAgICAgfSwgKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZUxvYWRpbmcgPSB0aGlzLmxvYWRpbmc7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmxvYWRFcnJvciA9IHJlYXNvbiAhPT0gbnVsbCAmJiByZWFzb24gIT09IHZvaWQgMCA/IHJlYXNvbiA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHNhdmVMb2FkaW5nID09PSBudWxsIHx8IHNhdmVMb2FkaW5nID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzYXZlTG9hZGluZy5mb3JFYWNoKHggPT4geC5yZWplY3QocmVhc29uKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjaGVja1Jlc3BvbnNlSGFuZGxlcigpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgY29uc3QgbXVzdEJlQXNzaWduZWQgPSAodGhpcy5jb250ZXh0Q291bnQgPiAwKSB8fCAodGhpcy5yZXF1ZXN0cy5zaXplID4gMCk7XG4gICAgICAgIGlmICh0aGlzLnJlc3BvbnNlSGFuZGxlckFzc2lnbmVkICE9PSBtdXN0QmVBc3NpZ25lZCkge1xuICAgICAgICAgICAgaWYgKG11c3RCZUFzc2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgKF9hID0gdGhpcy5saWJyYXJ5KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0UmVzcG9uc2VQYXJhbXNIYW5kbGVyKChyZXF1ZXN0SWQsIHBhcmFtcywgcmVzcG9uc2VUeXBlLCBmaW5pc2hlZCkgPT4gdGhpcy5oYW5kbGVMaWJyYXJ5UmVzcG9uc2UocmVxdWVzdElkLCBwYXJhbXMsIHJlc3BvbnNlVHlwZSwgZmluaXNoZWQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIChfYiA9IHRoaXMubGlicmFyeSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLnNldFJlc3BvbnNlUGFyYW1zSGFuZGxlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZXNwb25zZUhhbmRsZXJBc3NpZ25lZCA9IG11c3RCZUFzc2lnbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNyZWF0ZUNvbnRleHQoY29uZmlnKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zdCBsaWIgPSB0aGlzLmxpYnJhcnkgfHwgKHlpZWxkIHRoaXMubG9hZFJlcXVpcmVkKCkpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Q291bnQgKz0gMTtcbiAgICAgICAgICAgIHJldHVybiBDb21tb25CaW5hcnlCcmlkZ2UucGFyc2VSZXN1bHQoeWllbGQgbGliLmNyZWF0ZUNvbnRleHQoSlNPTi5zdHJpbmdpZnkoY29uZmlnKSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGVzdHJveUNvbnRleHQoY29udGV4dCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHRoaXMuY29udGV4dENvdW50ID0gTWF0aC5tYXgodGhpcy5jb250ZXh0Q291bnQgLSAxLCAwKTtcbiAgICAgICAgdGhpcy5jaGVja1Jlc3BvbnNlSGFuZGxlcigpO1xuICAgICAgICAoX2EgPSB0aGlzLmxpYnJhcnkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5kZXN0cm95Q29udGV4dChjb250ZXh0KTtcbiAgICB9XG4gICAgcmVxdWVzdChjb250ZXh0LCBmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uUGFyYW1zLCByZXNwb25zZUhhbmRsZXIpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc3QgbGliID0gKF9hID0gdGhpcy5saWJyYXJ5KSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB5aWVsZCB0aGlzLmxvYWRSZXF1aXJlZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICByZWplY3QsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlcixcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IHRoaXMuZ2VuZXJhdGVSZXF1ZXN0SWQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RzLnNldChyZXF1ZXN0SWQsIHJlcXVlc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tSZXNwb25zZUhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICBsaWIuc2VuZFJlcXVlc3RQYXJhbXMoY29udGV4dCwgcmVxdWVzdElkLCBmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uUGFyYW1zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbG9hZFJlcXVpcmVkKCkge1xuICAgICAgICBpZiAodGhpcy5saWJyYXJ5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5saWJyYXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5sb2FkRXJyb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHRoaXMubG9hZEVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5sb2FkaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgZXJyb3JzXzEuVG9uQ2xpZW50RXJyb3IoMSwgXCJUT04gQ2xpZW50IGJpbmFyeSBsaWJyYXJ5IGlzbid0IHNldC5cIikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICAoX2EgPSB0aGlzLmxvYWRpbmcpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5wdXNoKHtcbiAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgIHJlamVjdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2VuZXJhdGVSZXF1ZXN0SWQoKSB7XG4gICAgICAgIGNvbnN0IGlkID0gdGhpcy5uZXh0UmVxdWVzdElkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB0aGlzLm5leHRSZXF1ZXN0SWQgKz0gMTtcbiAgICAgICAgICAgIGlmICh0aGlzLm5leHRSZXF1ZXN0SWQgPj0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRSZXF1ZXN0SWQgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlICh0aGlzLnJlcXVlc3RzLmhhcyh0aGlzLm5leHRSZXF1ZXN0SWQpKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbiAgICBoYW5kbGVMaWJyYXJ5UmVzcG9uc2UocmVxdWVzdElkLCBwYXJhbXMsIHJlc3BvbnNlVHlwZSwgZmluaXNoZWQpIHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdHMuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaW5pc2hlZCkge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0cy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tSZXNwb25zZUhhbmRsZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBSZXNwb25zZVR5cGUuU3VjY2VzczpcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc29sdmUocGFyYW1zKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUmVzcG9uc2VUeXBlLkVycm9yOlxuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVqZWN0KHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnN0IGlzQXBwT2JqZWN0T3JDdXN0b20gPSByZXNwb25zZVR5cGUgPT09IFJlc3BvbnNlVHlwZS5BcHBOb3RpZnlcbiAgICAgICAgICAgICAgICAgICAgfHwgcmVzcG9uc2VUeXBlID09PSBSZXNwb25zZVR5cGUuQXBwUmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICB8fCByZXNwb25zZVR5cGUgPj0gUmVzcG9uc2VUeXBlLkN1c3RvbTtcbiAgICAgICAgICAgICAgICBpZiAoaXNBcHBPYmplY3RPckN1c3RvbSAmJiByZXF1ZXN0LnJlc3BvbnNlSGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlSGFuZGxlcihwYXJhbXMsIHJlc3BvbnNlVHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBwYXJzZVJlc3VsdChyZXN1bHRKc29uKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0SnNvbik7XG4gICAgICAgIGlmIChcImVycm9yXCIgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzXzEuVG9uQ2xpZW50RXJyb3IocmVzdWx0LmVycm9yLmNvZGUsIHJlc3VsdC5lcnJvci5tZXNzYWdlLCByZXN1bHQuZXJyb3IuZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZXN1bHQ7XG4gICAgfVxufVxuZXhwb3J0cy5Db21tb25CaW5hcnlCcmlkZ2UgPSBDb21tb25CaW5hcnlCcmlkZ2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iaW4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gTGFicyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVG9uQ2xpZW50ID0gdm9pZCAwO1xuY29uc3QgbW9kdWxlc18xID0gcmVxdWlyZShcIi4vbW9kdWxlc1wiKTtcbmNvbnN0IGJpbl8xID0gcmVxdWlyZShcIi4vYmluXCIpO1xuY2xhc3MgVG9uQ2xpZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmNvbnRleHRDcmVhdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5jb250ZXh0RXJyb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnICE9PSBudWxsICYmIGNvbmZpZyAhPT0gdm9pZCAwID8gY29uZmlnIDoge307XG4gICAgICAgIHRoaXMuY2xpZW50ID0gbmV3IG1vZHVsZXNfMS5DbGllbnRNb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMuY3J5cHRvID0gbmV3IG1vZHVsZXNfMS5DcnlwdG9Nb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMuYWJpID0gbmV3IG1vZHVsZXNfMS5BYmlNb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMuYm9jID0gbmV3IG1vZHVsZXNfMS5Cb2NNb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMucHJvY2Vzc2luZyA9IG5ldyBtb2R1bGVzXzEuUHJvY2Vzc2luZ01vZHVsZSh0aGlzKTtcbiAgICAgICAgdGhpcy51dGlscyA9IG5ldyBtb2R1bGVzXzEuVXRpbHNNb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMubmV0ID0gbmV3IG1vZHVsZXNfMS5OZXRNb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMudHZtID0gbmV3IG1vZHVsZXNfMS5Udm1Nb2R1bGUodGhpcyk7XG4gICAgICAgIHRoaXMucHJvb2ZzID0gbmV3IG1vZHVsZXNfMS5Qcm9vZnNNb2R1bGUodGhpcyk7XG4gICAgfVxuICAgIHN0YXRpYyBzZXQgZGVmYXVsdChjbGllbnQpIHtcbiAgICAgICAgdGhpcy5fZGVmYXVsdCA9IGNsaWVudDtcbiAgICB9XG4gICAgc3RhdGljIGdldCBkZWZhdWx0KCkge1xuICAgICAgICBpZiAodGhpcy5fZGVmYXVsdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fZGVmYXVsdCA9IG5ldyBUb25DbGllbnQodGhpcy5fZGVmYXVsdENvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHQ7XG4gICAgfVxuICAgIHN0YXRpYyBzZXQgZGVmYXVsdENvbmZpZyhjb25maWcpIHtcbiAgICAgICAgdGhpcy5fZGVmYXVsdENvbmZpZyA9IGNvbmZpZztcbiAgICB9XG4gICAgc3RhdGljIGdldCBkZWZhdWx0Q29uZmlnKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmYXVsdENvbmZpZztcbiAgICB9XG4gICAgc3RhdGljIHVzZUJpbmFyeUxpYnJhcnkobG9hZGVyKSB7XG4gICAgICAgICgwLCBiaW5fMS51c2VMaWJyYXJ5KShsb2FkZXIpO1xuICAgIH1cbiAgICBzdGF0aWMgdG9LZXkoZCkge1xuICAgICAgICByZXR1cm4gdG9IZXgoZCwgMjU2KTtcbiAgICB9XG4gICAgc3RhdGljIHRvSGFzaDY0KGQpIHtcbiAgICAgICAgcmV0dXJuIHRvSGV4KGQsIDY0KTtcbiAgICB9XG4gICAgc3RhdGljIHRvSGFzaDEyOChkKSB7XG4gICAgICAgIHJldHVybiB0b0hleChkLCAxMjgpO1xuICAgIH1cbiAgICBzdGF0aWMgdG9IYXNoMjU2KGQpIHtcbiAgICAgICAgcmV0dXJuIHRvSGV4KGQsIDI1Nik7XG4gICAgfVxuICAgIHN0YXRpYyB0b0hhc2g1MTIoZCkge1xuICAgICAgICByZXR1cm4gdG9IZXgoZCwgNTEyKTtcbiAgICB9XG4gICAgc3RhdGljIHRvSGV4KGRlYywgYml0cyA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRvSGV4KGRlYywgYml0cyk7XG4gICAgfVxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgICAgICBpZiAoY29udGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAoMCwgYmluXzEuZ2V0QnJpZGdlKSgpLmRlc3Ryb3lDb250ZXh0KGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc29sdmVFcnJvcihmdW5jdGlvbk5hbWUsIHBhcmFtcywgZXJyKSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoZXJyLmNvZGUgIT09IDIzIHx8ICEoKF9hID0gZXJyLmRhdGEpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zdWdnZXN0X3VzZV9oZWxwZXJfZm9yKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFttb2ROYW1lLCBmdW5jTmFtZV0gPSBmdW5jdGlvbk5hbWUuc3BsaXQoXCIuXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFwaSA9ICh5aWVsZCB0aGlzLmNsaWVudC5nZXRfYXBpX3JlZmVyZW5jZSgpKS5hcGk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsVHlwZXNBcnJheSA9IGFwaS5tb2R1bGVzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGVsZW1lbnQpID0+IGFjY3VtdWxhdG9yLmNvbmNhdChlbGVtZW50LnR5cGVzKSwgW10pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbFR5cGVzRGljdCA9IHt9O1xuICAgICAgICAgICAgICAgIGFsbFR5cGVzQXJyYXkuZm9yRWFjaCgoZWxlbWVudCkgPT4gYWxsVHlwZXNEaWN0W2VsZW1lbnQubmFtZV0gPSBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGUgPSBhcGkubW9kdWxlcy5maW5kKCh4KSA9PiB4Lm5hbWUgPT09IG1vZE5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBtb2R1bGUuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHgubmFtZSA9PT0gZnVuY05hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gZnVuYy5wYXJhbXNbMV07XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgb25seSBjb250ZXh0IHBhcmFtIChvciBBcHBPYmplY3Qgc2Vjb25kIHBhcmFtKSwgdGhlcmUgaXMgbm90aGluZyB0byBhbmFseXplXG4gICAgICAgICAgICAgICAgaWYgKCFwYXJhbSB8fCBwYXJhbS5nZW5lcmljX25hbWUgPT0gXCJBcHBPYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbVR5cGVJbmZvID0gYWxsVHlwZXNEaWN0W3BhcmFtLnJlZl9uYW1lXTtcbiAgICAgICAgICAgICAgICB3YWxrUGFyYW1ldGVycyhwYXJhbVR5cGVJbmZvLCBwYXJhbXMsIFwiXCIpO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHdhbGtQYXJhbWV0ZXJzKHZhbHVlVHlwZUluZm8sIHZhbHVlLCBwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodmFsdWVUeXBlSW5mby50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQXJyYXlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuZm9yRWFjaCh2ID0+IHdhbGtQYXJhbWV0ZXJzKHZhbHVlVHlwZUluZm8uYXJyYXlfaXRlbSwgdiwgYCR7cGF0aH1baV1gKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlN0cnVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlVHlwZUluZm8uc3RydWN0X2ZpZWxkcy5mb3JFYWNoKChzZikgPT4gd2Fsa1BhcmFtZXRlcnMoc2YsIHZhbHVlW3NmLm5hbWVdLCBwYXRoID8gYCR7cGF0aH0uJHtzZi5uYW1lfWAgOiBzZi5uYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiT3B0aW9uYWxcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2Fsa1BhcmFtZXRlcnModmFsdWVUeXBlSW5mby5vcHRpb25hbF9pbm5lciwgdmFsdWUsIHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSZWZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVUeXBlSW5mby5yZWZfbmFtZSAhPSBcIlZhbHVlXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVUeXBlSW5mby5yZWZfbmFtZSAhPSBcIkFQSVwiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlVHlwZUluZm8ucmVmX25hbWUgIT0gXCJBYmlQYXJhbVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhbGtQYXJhbWV0ZXJzKGFsbFR5cGVzRGljdFt2YWx1ZVR5cGVJbmZvLnJlZl9uYW1lXSwgdmFsdWUsIHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbnVtT2ZUeXBlc1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZVR5cGVJbmZvLmVudW1fdHlwZXMuc29tZSgoZXQpID0+IGV0Lm5hbWUgPT0gdmFsdWUudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVyTmFtZSA9IHZhbHVlVHlwZUluZm8ubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoZWxwZXJGdW5jdGlvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGVJbmZvLmVudW1fdHlwZXMuZm9yRWFjaCgoZXQpID0+IGhlbHBlckZ1bmN0aW9ucy5wdXNoKHBhcmFtZXRlck5hbWUgKyBldC5uYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBgQ29uc2lkZXIgdXNpbmcgb25lIG9mIHRoZSBoZWxwZXIgbWV0aG9kcyAoJHtoZWxwZXJGdW5jdGlvbnMuam9pbihcIiwgXCIpfSkgZm9yIHRoZSBcXFwiJHtwYXRofVxcXCIgcGFyYW1ldGVyXFxuYCArIGVyci5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSAoX2IgPSBlLm1lc3NhZ2UpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IGAke2V9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb250ZXh0UmVxdWlyZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHRFcnJvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QodGhpcy5jb250ZXh0RXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHRDcmVhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHRDcmVhdGlvbiA9IFtdO1xuICAgICAgICAgICAgKDAsIGJpbl8xLmdldEJyaWRnZSkoKS5jcmVhdGVDb250ZXh0KHRoaXMuY29uZmlnKS50aGVuKChjb250ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRpb24gPSB0aGlzLmNvbnRleHRDcmVhdGlvbjtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHRDcmVhdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgICAgIGNyZWF0aW9uID09PSBudWxsIHx8IGNyZWF0aW9uID09PSB2b2lkIDAgPyB2b2lkIDAgOiBjcmVhdGlvbi5mb3JFYWNoKHggPT4geC5yZXNvbHZlKGNvbnRleHQpKTtcbiAgICAgICAgICAgIH0sIChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGlvbiA9IHRoaXMuY29udGV4dENyZWF0aW9uO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dENyZWF0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dEVycm9yID0gcmVhc29uICE9PSBudWxsICYmIHJlYXNvbiAhPT0gdm9pZCAwID8gcmVhc29uIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGNyZWF0aW9uID09PSBudWxsIHx8IGNyZWF0aW9uID09PSB2b2lkIDAgPyB2b2lkIDAgOiBjcmVhdGlvbi5mb3JFYWNoKHggPT4geC5yZWplY3QocmVhc29uKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgKF9hID0gdGhpcy5jb250ZXh0Q3JlYXRpb24pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5wdXNoKHtcbiAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgIHJlamVjdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVxdWVzdChmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uUGFyYW1zLCByZXNwb25zZUhhbmRsZXIpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IChfYSA9IHRoaXMuY29udGV4dCkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogeWllbGQgdGhpcy5jb250ZXh0UmVxdWlyZWQoKTtcbiAgICAgICAgICAgIHJldHVybiAoMCwgYmluXzEuZ2V0QnJpZGdlKSgpXG4gICAgICAgICAgICAgICAgLnJlcXVlc3QoY29udGV4dCwgZnVuY3Rpb25OYW1lLCBmdW5jdGlvblBhcmFtcywgcmVzcG9uc2VIYW5kbGVyICE9PSBudWxsICYmIHJlc3BvbnNlSGFuZGxlciAhPT0gdm9pZCAwID8gcmVzcG9uc2VIYW5kbGVyIDogKCgpID0+IHtcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgeWllbGQgdGhpcy5yZXNvbHZlRXJyb3IoZnVuY3Rpb25OYW1lLCBmdW5jdGlvblBhcmFtcywgcmVhc29uKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlc29sdmVfYXBwX3JlcXVlc3QoYXBwX3JlcXVlc3RfaWQsIHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKGFwcF9yZXF1ZXN0X2lkKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5jbGllbnQucmVzb2x2ZV9hcHBfcmVxdWVzdCh7XG4gICAgICAgICAgICAgICAgICAgIGFwcF9yZXF1ZXN0X2lkLFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiT2tcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlamVjdF9hcHBfcmVxdWVzdChhcHBfcmVxdWVzdF9pZCwgZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmIChhcHBfcmVxdWVzdF9pZCkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuY2xpZW50LnJlc29sdmVfYXBwX3JlcXVlc3Qoe1xuICAgICAgICAgICAgICAgICAgICBhcHBfcmVxdWVzdF9pZCxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkVycm9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlRvbkNsaWVudCA9IFRvbkNsaWVudDtcblRvbkNsaWVudC5fZGVmYXVsdENvbmZpZyA9IHt9O1xuVG9uQ2xpZW50Ll9kZWZhdWx0ID0gbnVsbDtcbi8vIENvbnZlcnRzIHZhbHVlIHRvIGhleFxuZnVuY3Rpb24gdG9IZXgodmFsdWUsIGJpdHMpIHtcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIHZhbHVlID09PSBcImJpZ2ludFwiKSB7XG4gICAgICAgIGhleCA9IHZhbHVlLnRvU3RyaW5nKDE2KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKFwiMHhcIikpIHtcbiAgICAgICAgICAgIGhleCA9IHZhbHVlLnN1YnN0cmluZygyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGhleCA9IGRlY1RvSGV4KHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaGV4ID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgbGV0IGxlbiA9IGJpdHMgLyA0O1xuICAgIHdoaWxlIChoZXgubGVuZ3RoID4gbGVuICYmIGhleC5zdGFydHNXaXRoKFwiMFwiKSkge1xuICAgICAgICBoZXggPSBoZXguc3Vic3RyaW5nKDEpO1xuICAgIH1cbiAgICByZXR1cm4gaGV4LnBhZFN0YXJ0KGxlbiwgXCIwXCIpO1xufVxuZnVuY3Rpb24gZGVjVG9IZXgoZGVjKSB7XG4gICAgdmFyIF9hO1xuICAgIGxldCBiaWdOdW0gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlYy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBkID0gKChfYSA9IGRlYy5jb2RlUG9pbnRBdChpKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMCkgLSA0ODtcbiAgICAgICAgY29uc3QgbXVsOCA9IHNobChiaWdOdW0sIDMpO1xuICAgICAgICBjb25zdCBtdWwyID0gc2hsKGJpZ051bSwgMSk7XG4gICAgICAgIGNvbnN0IG11bDEwID0gYWRkKG11bDgsIG11bDIpO1xuICAgICAgICBiaWdOdW0gPSBhZGQobXVsMTAsIFtkXSk7XG4gICAgfVxuICAgIGxldCBoZXggPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSBiaWdOdW0ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpIC09IDEpIHtcbiAgICAgICAgaGV4ICs9IGJpZ051bVtpXS50b1N0cmluZygxNikucGFkU3RhcnQoNCwgXCIwXCIpO1xuICAgIH1cbiAgICByZXR1cm4gaGV4O1xufVxuZnVuY3Rpb24gc2hsKGJpZ051bSwgYml0cykge1xuICAgIGxldCByZXN0ID0gMDtcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpZ051bS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBsZXQgdiA9IChiaWdOdW1baV0gPDwgYml0cykgKyByZXN0O1xuICAgICAgICByZXN1bHQucHVzaCh2ICYgMHhGRkZGKTtcbiAgICAgICAgcmVzdCA9ICh2ID4+IDE2KSAmIDB4RkZGRjtcbiAgICB9XG4gICAgaWYgKHJlc3QgPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHJlc3QpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gYWRkKGEsIGIpIHtcbiAgICBsZXQgcmVzdCA9IDA7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgY29uc3QgbGVuID0gTWF0aC5tYXgoYS5sZW5ndGgsIGIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGxldCB2ID0gKGkgPCBhLmxlbmd0aCA/IGFbaV0gOiAwKSArIChpIDwgYi5sZW5ndGggPyBiW2ldIDogMCkgKyByZXN0O1xuICAgICAgICByZXN1bHQucHVzaCh2ICYgMHhGRkZGKTtcbiAgICAgICAgcmVzdCA9ICh2ID4+IDE2KSAmIDB4RkZGRjtcbiAgICB9XG4gICAgaWYgKHJlc3QgPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHJlc3QpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xpZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Ub25DbGllbnRFcnJvciA9IHZvaWQgMDtcbmNsYXNzIFRvbkNsaWVudEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UsIGRhdGEpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICAgIHRoaXMuY29kZSA9IGNvZGU7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgfVxufVxuZXhwb3J0cy5Ub25DbGllbnRFcnJvciA9IFRvbkNsaWVudEVycm9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXJyb3JzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XG4gICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG0sIGspO1xuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XG4gICAgICBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9O1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xuICAgIG9bazJdID0gbVtrXTtcbn0pKTtcbnZhciBfX2V4cG9ydFN0YXIgPSAodGhpcyAmJiB0aGlzLl9fZXhwb3J0U3RhcikgfHwgZnVuY3Rpb24obSwgZXhwb3J0cykge1xuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0cywgcCkpIF9fY3JlYXRlQmluZGluZyhleHBvcnRzLCBtLCBwKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vbW9kdWxlc1wiKSwgZXhwb3J0cyk7XG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vY2xpZW50XCIpLCBleHBvcnRzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmJ1aWxkZXJPcEludGVnZXIgPSBleHBvcnRzLkJvY0Vycm9yQ29kZSA9IGV4cG9ydHMuYm9jQ2FjaGVUeXBlVW5waW5uZWQgPSBleHBvcnRzLmJvY0NhY2hlVHlwZVBpbm5lZCA9IGV4cG9ydHMuQWJpTW9kdWxlID0gZXhwb3J0cy5tZXNzYWdlU291cmNlRW5jb2RpbmdQYXJhbXMgPSBleHBvcnRzLm1lc3NhZ2VTb3VyY2VFbmNvZGVkID0gZXhwb3J0cy5zdGF0ZUluaXRTb3VyY2VUdmMgPSBleHBvcnRzLnN0YXRlSW5pdFNvdXJjZVN0YXRlSW5pdCA9IGV4cG9ydHMuc3RhdGVJbml0U291cmNlTWVzc2FnZSA9IGV4cG9ydHMuTWVzc2FnZUJvZHlUeXBlID0gZXhwb3J0cy5zaWduZXJTaWduaW5nQm94ID0gZXhwb3J0cy5zaWduZXJLZXlzID0gZXhwb3J0cy5zaWduZXJFeHRlcm5hbCA9IGV4cG9ydHMuc2lnbmVyTm9uZSA9IGV4cG9ydHMuYWJpU2VyaWFsaXplZCA9IGV4cG9ydHMuYWJpSGFuZGxlID0gZXhwb3J0cy5hYmlKc29uID0gZXhwb3J0cy5hYmlDb250cmFjdCA9IGV4cG9ydHMuQWJpRXJyb3JDb2RlID0gZXhwb3J0cy5DcnlwdG9Nb2R1bGUgPSBleHBvcnRzLnJlc3VsdE9mQXBwRW5jcnlwdGlvbkJveERlY3J5cHQgPSBleHBvcnRzLnJlc3VsdE9mQXBwRW5jcnlwdGlvbkJveEVuY3J5cHQgPSBleHBvcnRzLnJlc3VsdE9mQXBwRW5jcnlwdGlvbkJveEdldEluZm8gPSBleHBvcnRzLnBhcmFtc09mQXBwRW5jcnlwdGlvbkJveERlY3J5cHQgPSBleHBvcnRzLnBhcmFtc09mQXBwRW5jcnlwdGlvbkJveEVuY3J5cHQgPSBleHBvcnRzLnBhcmFtc09mQXBwRW5jcnlwdGlvbkJveEdldEluZm8gPSBleHBvcnRzLnJlc3VsdE9mQXBwU2lnbmluZ0JveFNpZ24gPSBleHBvcnRzLnJlc3VsdE9mQXBwU2lnbmluZ0JveEdldFB1YmxpY0tleSA9IGV4cG9ydHMucGFyYW1zT2ZBcHBTaWduaW5nQm94U2lnbiA9IGV4cG9ydHMucGFyYW1zT2ZBcHBTaWduaW5nQm94R2V0UHVibGljS2V5ID0gZXhwb3J0cy5yZXN1bHRPZkFwcFBhc3N3b3JkUHJvdmlkZXJHZXRQYXNzd29yZCA9IGV4cG9ydHMucGFyYW1zT2ZBcHBQYXNzd29yZFByb3ZpZGVyR2V0UGFzc3dvcmQgPSBleHBvcnRzLmJveEVuY3J5cHRpb25BbGdvcml0aG1OYWNsU2VjcmV0Qm94ID0gZXhwb3J0cy5ib3hFbmNyeXB0aW9uQWxnb3JpdGhtTmFjbEJveCA9IGV4cG9ydHMuYm94RW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwID0gZXhwb3J0cy5jcnlwdG9Cb3hTZWNyZXRFbmNyeXB0ZWRTZWNyZXQgPSBleHBvcnRzLmNyeXB0b0JveFNlY3JldFByZWRlZmluZWRTZWVkUGhyYXNlID0gZXhwb3J0cy5jcnlwdG9Cb3hTZWNyZXRSYW5kb21TZWVkUGhyYXNlID0gZXhwb3J0cy5DaXBoZXJNb2RlID0gZXhwb3J0cy5lbmNyeXB0aW9uQWxnb3JpdGhtTmFjbFNlY3JldEJveCA9IGV4cG9ydHMuZW5jcnlwdGlvbkFsZ29yaXRobU5hY2xCb3ggPSBleHBvcnRzLmVuY3J5cHRpb25BbGdvcml0aG1DaGFDaGEyMCA9IGV4cG9ydHMuZW5jcnlwdGlvbkFsZ29yaXRobUFFUyA9IGV4cG9ydHMuQ3J5cHRvRXJyb3JDb2RlID0gZXhwb3J0cy5DbGllbnRNb2R1bGUgPSBleHBvcnRzLmFwcFJlcXVlc3RSZXN1bHRPayA9IGV4cG9ydHMuYXBwUmVxdWVzdFJlc3VsdEVycm9yID0gZXhwb3J0cy5OZXR3b3JrUXVlcmllc1Byb3RvY29sID0gZXhwb3J0cy5DbGllbnRFcnJvckNvZGUgPSB2b2lkIDA7XG5leHBvcnRzLnJlc3VsdE9mQXBwRGVib3RCcm93c2VySW5wdXQgPSBleHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VyQXBwcm92ZSA9IGV4cG9ydHMucGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJTZW5kID0gZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3Nlckludm9rZURlYm90ID0gZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3NlckdldFNpZ25pbmdCb3ggPSBleHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VySW5wdXQgPSBleHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VyU2hvd0FjdGlvbiA9IGV4cG9ydHMucGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJTd2l0Y2hDb21wbGV0ZWQgPSBleHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VyU3dpdGNoID0gZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3NlckxvZyA9IGV4cG9ydHMuZGVib3RBY3Rpdml0eVRyYW5zYWN0aW9uID0gZXhwb3J0cy5EZWJvdEVycm9yQ29kZSA9IGV4cG9ydHMuTmV0TW9kdWxlID0gZXhwb3J0cy5BZ2dyZWdhdGlvbkZuID0gZXhwb3J0cy5wYXJhbXNPZlF1ZXJ5T3BlcmF0aW9uUXVlcnlDb3VudGVycGFydGllcyA9IGV4cG9ydHMucGFyYW1zT2ZRdWVyeU9wZXJhdGlvbkFnZ3JlZ2F0ZUNvbGxlY3Rpb24gPSBleHBvcnRzLnBhcmFtc09mUXVlcnlPcGVyYXRpb25XYWl0Rm9yQ29sbGVjdGlvbiA9IGV4cG9ydHMucGFyYW1zT2ZRdWVyeU9wZXJhdGlvblF1ZXJ5Q29sbGVjdGlvbiA9IGV4cG9ydHMuU29ydERpcmVjdGlvbiA9IGV4cG9ydHMuTmV0RXJyb3JDb2RlID0gZXhwb3J0cy5Udm1Nb2R1bGUgPSBleHBvcnRzLmFjY291bnRGb3JFeGVjdXRvckFjY291bnQgPSBleHBvcnRzLmFjY291bnRGb3JFeGVjdXRvclVuaW5pdCA9IGV4cG9ydHMuYWNjb3VudEZvckV4ZWN1dG9yTm9uZSA9IGV4cG9ydHMuVHZtRXJyb3JDb2RlID0gZXhwb3J0cy5VdGlsc01vZHVsZSA9IGV4cG9ydHMuQWNjb3VudEFkZHJlc3NUeXBlID0gZXhwb3J0cy5hZGRyZXNzU3RyaW5nRm9ybWF0QmFzZTY0ID0gZXhwb3J0cy5hZGRyZXNzU3RyaW5nRm9ybWF0SGV4ID0gZXhwb3J0cy5hZGRyZXNzU3RyaW5nRm9ybWF0QWNjb3VudElkID0gZXhwb3J0cy5Qcm9jZXNzaW5nTW9kdWxlID0gZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRSZW1wRXJyb3IgPSBleHBvcnRzLnByb2Nlc3NpbmdFdmVudFJlbXBPdGhlciA9IGV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50UmVtcEluY2x1ZGVkSW50b0FjY2VwdGVkQmxvY2sgPSBleHBvcnRzLnByb2Nlc3NpbmdFdmVudFJlbXBJbmNsdWRlZEludG9CbG9jayA9IGV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50UmVtcFNlbnRUb1ZhbGlkYXRvcnMgPSBleHBvcnRzLnByb2Nlc3NpbmdFdmVudE1lc3NhZ2VFeHBpcmVkID0gZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRGZXRjaE5leHRCbG9ja0ZhaWxlZCA9IGV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50V2lsbEZldGNoTmV4dEJsb2NrID0gZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRTZW5kRmFpbGVkID0gZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnREaWRTZW5kID0gZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRXaWxsU2VuZCA9IGV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50RmV0Y2hGaXJzdEJsb2NrRmFpbGVkID0gZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRXaWxsRmV0Y2hGaXJzdEJsb2NrID0gZXhwb3J0cy5Qcm9jZXNzaW5nRXJyb3JDb2RlID0gZXhwb3J0cy5Cb2NNb2R1bGUgPSBleHBvcnRzLmJ1aWxkZXJPcEFkZHJlc3MgPSBleHBvcnRzLmJ1aWxkZXJPcENlbGxCb2MgPSBleHBvcnRzLmJ1aWxkZXJPcENlbGwgPSBleHBvcnRzLmJ1aWxkZXJPcEJpdFN0cmluZyA9IHZvaWQgMDtcbmV4cG9ydHMuUHJvb2ZzTW9kdWxlID0gZXhwb3J0cy5Qcm9vZnNFcnJvckNvZGUgPSBleHBvcnRzLkRlYm90TW9kdWxlID0gZXhwb3J0cy5yZXN1bHRPZkFwcERlYm90QnJvd3NlckFwcHJvdmUgPSBleHBvcnRzLnJlc3VsdE9mQXBwRGVib3RCcm93c2VySW52b2tlRGVib3QgPSBleHBvcnRzLnJlc3VsdE9mQXBwRGVib3RCcm93c2VyR2V0U2lnbmluZ0JveCA9IHZvaWQgMDtcbi8vIGNsaWVudCBtb2R1bGVcbnZhciBDbGllbnRFcnJvckNvZGU7XG4oZnVuY3Rpb24gKENsaWVudEVycm9yQ29kZSkge1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJOb3RJbXBsZW1lbnRlZFwiXSA9IDFdID0gXCJOb3RJbXBsZW1lbnRlZFwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJJbnZhbGlkSGV4XCJdID0gMl0gPSBcIkludmFsaWRIZXhcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiSW52YWxpZEJhc2U2NFwiXSA9IDNdID0gXCJJbnZhbGlkQmFzZTY0XCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkludmFsaWRBZGRyZXNzXCJdID0gNF0gPSBcIkludmFsaWRBZGRyZXNzXCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkNhbGxiYWNrUGFyYW1zQ2FudEJlQ29udmVydGVkVG9Kc29uXCJdID0gNV0gPSBcIkNhbGxiYWNrUGFyYW1zQ2FudEJlQ29udmVydGVkVG9Kc29uXCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIldlYnNvY2tldENvbm5lY3RFcnJvclwiXSA9IDZdID0gXCJXZWJzb2NrZXRDb25uZWN0RXJyb3JcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiV2Vic29ja2V0UmVjZWl2ZUVycm9yXCJdID0gN10gPSBcIldlYnNvY2tldFJlY2VpdmVFcnJvclwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJXZWJzb2NrZXRTZW5kRXJyb3JcIl0gPSA4XSA9IFwiV2Vic29ja2V0U2VuZEVycm9yXCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkh0dHBDbGllbnRDcmVhdGVFcnJvclwiXSA9IDldID0gXCJIdHRwQ2xpZW50Q3JlYXRlRXJyb3JcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiSHR0cFJlcXVlc3RDcmVhdGVFcnJvclwiXSA9IDEwXSA9IFwiSHR0cFJlcXVlc3RDcmVhdGVFcnJvclwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJIdHRwUmVxdWVzdFNlbmRFcnJvclwiXSA9IDExXSA9IFwiSHR0cFJlcXVlc3RTZW5kRXJyb3JcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiSHR0cFJlcXVlc3RQYXJzZUVycm9yXCJdID0gMTJdID0gXCJIdHRwUmVxdWVzdFBhcnNlRXJyb3JcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiQ2FsbGJhY2tOb3RSZWdpc3RlcmVkXCJdID0gMTNdID0gXCJDYWxsYmFja05vdFJlZ2lzdGVyZWRcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiTmV0TW9kdWxlTm90SW5pdFwiXSA9IDE0XSA9IFwiTmV0TW9kdWxlTm90SW5pdFwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJJbnZhbGlkQ29uZmlnXCJdID0gMTVdID0gXCJJbnZhbGlkQ29uZmlnXCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkNhbm5vdENyZWF0ZVJ1bnRpbWVcIl0gPSAxNl0gPSBcIkNhbm5vdENyZWF0ZVJ1bnRpbWVcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiSW52YWxpZENvbnRleHRIYW5kbGVcIl0gPSAxN10gPSBcIkludmFsaWRDb250ZXh0SGFuZGxlXCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkNhbm5vdFNlcmlhbGl6ZVJlc3VsdFwiXSA9IDE4XSA9IFwiQ2Fubm90U2VyaWFsaXplUmVzdWx0XCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkNhbm5vdFNlcmlhbGl6ZUVycm9yXCJdID0gMTldID0gXCJDYW5ub3RTZXJpYWxpemVFcnJvclwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJDYW5ub3RDb252ZXJ0SnNWYWx1ZVRvSnNvblwiXSA9IDIwXSA9IFwiQ2Fubm90Q29udmVydEpzVmFsdWVUb0pzb25cIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiQ2Fubm90UmVjZWl2ZVNwYXduZWRSZXN1bHRcIl0gPSAyMV0gPSBcIkNhbm5vdFJlY2VpdmVTcGF3bmVkUmVzdWx0XCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIlNldFRpbWVyRXJyb3JcIl0gPSAyMl0gPSBcIlNldFRpbWVyRXJyb3JcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiSW52YWxpZFBhcmFtc1wiXSA9IDIzXSA9IFwiSW52YWxpZFBhcmFtc1wiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJDb250cmFjdHNBZGRyZXNzQ29udmVyc2lvbkZhaWxlZFwiXSA9IDI0XSA9IFwiQ29udHJhY3RzQWRkcmVzc0NvbnZlcnNpb25GYWlsZWRcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiVW5rbm93bkZ1bmN0aW9uXCJdID0gMjVdID0gXCJVbmtub3duRnVuY3Rpb25cIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiQXBwUmVxdWVzdEVycm9yXCJdID0gMjZdID0gXCJBcHBSZXF1ZXN0RXJyb3JcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiTm9TdWNoUmVxdWVzdFwiXSA9IDI3XSA9IFwiTm9TdWNoUmVxdWVzdFwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJDYW5Ob3RTZW5kUmVxdWVzdFJlc3VsdFwiXSA9IDI4XSA9IFwiQ2FuTm90U2VuZFJlcXVlc3RSZXN1bHRcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiQ2FuTm90UmVjZWl2ZVJlcXVlc3RSZXN1bHRcIl0gPSAyOV0gPSBcIkNhbk5vdFJlY2VpdmVSZXF1ZXN0UmVzdWx0XCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkNhbk5vdFBhcnNlUmVxdWVzdFJlc3VsdFwiXSA9IDMwXSA9IFwiQ2FuTm90UGFyc2VSZXF1ZXN0UmVzdWx0XCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIlVuZXhwZWN0ZWRDYWxsYmFja1Jlc3BvbnNlXCJdID0gMzFdID0gXCJVbmV4cGVjdGVkQ2FsbGJhY2tSZXNwb25zZVwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJDYW5Ob3RQYXJzZU51bWJlclwiXSA9IDMyXSA9IFwiQ2FuTm90UGFyc2VOdW1iZXJcIjtcbiAgICBDbGllbnRFcnJvckNvZGVbQ2xpZW50RXJyb3JDb2RlW1wiSW50ZXJuYWxFcnJvclwiXSA9IDMzXSA9IFwiSW50ZXJuYWxFcnJvclwiO1xuICAgIENsaWVudEVycm9yQ29kZVtDbGllbnRFcnJvckNvZGVbXCJJbnZhbGlkSGFuZGxlXCJdID0gMzRdID0gXCJJbnZhbGlkSGFuZGxlXCI7XG4gICAgQ2xpZW50RXJyb3JDb2RlW0NsaWVudEVycm9yQ29kZVtcIkxvY2FsU3RvcmFnZUVycm9yXCJdID0gMzVdID0gXCJMb2NhbFN0b3JhZ2VFcnJvclwiO1xufSkoQ2xpZW50RXJyb3JDb2RlID0gZXhwb3J0cy5DbGllbnRFcnJvckNvZGUgfHwgKGV4cG9ydHMuQ2xpZW50RXJyb3JDb2RlID0ge30pKTtcbi8qKlxuICogTmV0d29yayBwcm90b2NvbCB1c2VkIHRvIHBlcmZvcm0gR3JhcGhRTCBxdWVyaWVzLlxuICovXG52YXIgTmV0d29ya1F1ZXJpZXNQcm90b2NvbDtcbihmdW5jdGlvbiAoTmV0d29ya1F1ZXJpZXNQcm90b2NvbCkge1xuICAgIE5ldHdvcmtRdWVyaWVzUHJvdG9jb2xbXCJIVFRQXCJdID0gXCJIVFRQXCI7XG4gICAgTmV0d29ya1F1ZXJpZXNQcm90b2NvbFtcIldTXCJdID0gXCJXU1wiO1xufSkoTmV0d29ya1F1ZXJpZXNQcm90b2NvbCA9IGV4cG9ydHMuTmV0d29ya1F1ZXJpZXNQcm90b2NvbCB8fCAoZXhwb3J0cy5OZXR3b3JrUXVlcmllc1Byb3RvY29sID0ge30pKTtcbmZ1bmN0aW9uIGFwcFJlcXVlc3RSZXN1bHRFcnJvcih0ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0Vycm9yJyxcbiAgICAgICAgdGV4dCxcbiAgICB9O1xufVxuZXhwb3J0cy5hcHBSZXF1ZXN0UmVzdWx0RXJyb3IgPSBhcHBSZXF1ZXN0UmVzdWx0RXJyb3I7XG5mdW5jdGlvbiBhcHBSZXF1ZXN0UmVzdWx0T2socmVzdWx0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ09rJyxcbiAgICAgICAgcmVzdWx0LFxuICAgIH07XG59XG5leHBvcnRzLmFwcFJlcXVlc3RSZXN1bHRPayA9IGFwcFJlcXVlc3RSZXN1bHRPaztcbi8qKlxuICogUHJvdmlkZXMgaW5mb3JtYXRpb24gYWJvdXQgbGlicmFyeS5cbiAqL1xuY2xhc3MgQ2xpZW50TW9kdWxlIHtcbiAgICBjb25zdHJ1Y3RvcihjbGllbnQpIHtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBjbGllbnQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgQ29yZSBMaWJyYXJ5IEFQSSByZWZlcmVuY2VcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkdldEFwaVJlZmVyZW5jZVxuICAgICAqL1xuICAgIGdldF9hcGlfcmVmZXJlbmNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY2xpZW50LmdldF9hcGlfcmVmZXJlbmNlJyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgQ29yZSBMaWJyYXJ5IHZlcnNpb25cbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlZlcnNpb25cbiAgICAgKi9cbiAgICB2ZXJzaW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY2xpZW50LnZlcnNpb24nKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBDb3JlIExpYnJhcnkgQVBJIHJlZmVyZW5jZVxuICAgICAqIEByZXR1cm5zIENsaWVudENvbmZpZ1xuICAgICAqL1xuICAgIGNvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NsaWVudC5jb25maWcnKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBkZXRhaWxlZCBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGJ1aWxkLlxuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mQnVpbGRJbmZvXG4gICAgICovXG4gICAgYnVpbGRfaW5mbygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NsaWVudC5idWlsZF9pbmZvJyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlc29sdmVzIGFwcGxpY2F0aW9uIHJlcXVlc3QgcHJvY2Vzc2luZyByZXN1bHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZSZXNvbHZlQXBwUmVxdWVzdH0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICByZXNvbHZlX2FwcF9yZXF1ZXN0KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY2xpZW50LnJlc29sdmVfYXBwX3JlcXVlc3QnLCBwYXJhbXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ2xpZW50TW9kdWxlID0gQ2xpZW50TW9kdWxlO1xuLy8gY3J5cHRvIG1vZHVsZVxudmFyIENyeXB0b0Vycm9yQ29kZTtcbihmdW5jdGlvbiAoQ3J5cHRvRXJyb3JDb2RlKSB7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkludmFsaWRQdWJsaWNLZXlcIl0gPSAxMDBdID0gXCJJbnZhbGlkUHVibGljS2V5XCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkludmFsaWRTZWNyZXRLZXlcIl0gPSAxMDFdID0gXCJJbnZhbGlkU2VjcmV0S2V5XCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkludmFsaWRLZXlcIl0gPSAxMDJdID0gXCJJbnZhbGlkS2V5XCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkludmFsaWRGYWN0b3JpemVDaGFsbGVuZ2VcIl0gPSAxMDZdID0gXCJJbnZhbGlkRmFjdG9yaXplQ2hhbGxlbmdlXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkludmFsaWRCaWdJbnRcIl0gPSAxMDddID0gXCJJbnZhbGlkQmlnSW50XCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIlNjcnlwdEZhaWxlZFwiXSA9IDEwOF0gPSBcIlNjcnlwdEZhaWxlZFwiO1xuICAgIENyeXB0b0Vycm9yQ29kZVtDcnlwdG9FcnJvckNvZGVbXCJJbnZhbGlkS2V5U2l6ZVwiXSA9IDEwOV0gPSBcIkludmFsaWRLZXlTaXplXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIk5hY2xTZWNyZXRCb3hGYWlsZWRcIl0gPSAxMTBdID0gXCJOYWNsU2VjcmV0Qm94RmFpbGVkXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIk5hY2xCb3hGYWlsZWRcIl0gPSAxMTFdID0gXCJOYWNsQm94RmFpbGVkXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIk5hY2xTaWduRmFpbGVkXCJdID0gMTEyXSA9IFwiTmFjbFNpZ25GYWlsZWRcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiQmlwMzlJbnZhbGlkRW50cm9weVwiXSA9IDExM10gPSBcIkJpcDM5SW52YWxpZEVudHJvcHlcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiQmlwMzlJbnZhbGlkUGhyYXNlXCJdID0gMTE0XSA9IFwiQmlwMzlJbnZhbGlkUGhyYXNlXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkJpcDMySW52YWxpZEtleVwiXSA9IDExNV0gPSBcIkJpcDMySW52YWxpZEtleVwiO1xuICAgIENyeXB0b0Vycm9yQ29kZVtDcnlwdG9FcnJvckNvZGVbXCJCaXAzMkludmFsaWREZXJpdmVQYXRoXCJdID0gMTE2XSA9IFwiQmlwMzJJbnZhbGlkRGVyaXZlUGF0aFwiO1xuICAgIENyeXB0b0Vycm9yQ29kZVtDcnlwdG9FcnJvckNvZGVbXCJCaXAzOUludmFsaWREaWN0aW9uYXJ5XCJdID0gMTE3XSA9IFwiQmlwMzlJbnZhbGlkRGljdGlvbmFyeVwiO1xuICAgIENyeXB0b0Vycm9yQ29kZVtDcnlwdG9FcnJvckNvZGVbXCJCaXAzOUludmFsaWRXb3JkQ291bnRcIl0gPSAxMThdID0gXCJCaXAzOUludmFsaWRXb3JkQ291bnRcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiTW5lbW9uaWNHZW5lcmF0aW9uRmFpbGVkXCJdID0gMTE5XSA9IFwiTW5lbW9uaWNHZW5lcmF0aW9uRmFpbGVkXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIk1uZW1vbmljRnJvbUVudHJvcHlGYWlsZWRcIl0gPSAxMjBdID0gXCJNbmVtb25pY0Zyb21FbnRyb3B5RmFpbGVkXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIlNpZ25pbmdCb3hOb3RSZWdpc3RlcmVkXCJdID0gMTIxXSA9IFwiU2lnbmluZ0JveE5vdFJlZ2lzdGVyZWRcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiSW52YWxpZFNpZ25hdHVyZVwiXSA9IDEyMl0gPSBcIkludmFsaWRTaWduYXR1cmVcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiRW5jcnlwdGlvbkJveE5vdFJlZ2lzdGVyZWRcIl0gPSAxMjNdID0gXCJFbmNyeXB0aW9uQm94Tm90UmVnaXN0ZXJlZFwiO1xuICAgIENyeXB0b0Vycm9yQ29kZVtDcnlwdG9FcnJvckNvZGVbXCJJbnZhbGlkSXZTaXplXCJdID0gMTI0XSA9IFwiSW52YWxpZEl2U2l6ZVwiO1xuICAgIENyeXB0b0Vycm9yQ29kZVtDcnlwdG9FcnJvckNvZGVbXCJVbnN1cHBvcnRlZENpcGhlck1vZGVcIl0gPSAxMjVdID0gXCJVbnN1cHBvcnRlZENpcGhlck1vZGVcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiQ2Fubm90Q3JlYXRlQ2lwaGVyXCJdID0gMTI2XSA9IFwiQ2Fubm90Q3JlYXRlQ2lwaGVyXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkVuY3J5cHREYXRhRXJyb3JcIl0gPSAxMjddID0gXCJFbmNyeXB0RGF0YUVycm9yXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkRlY3J5cHREYXRhRXJyb3JcIl0gPSAxMjhdID0gXCJEZWNyeXB0RGF0YUVycm9yXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkl2UmVxdWlyZWRcIl0gPSAxMjldID0gXCJJdlJlcXVpcmVkXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkNyeXB0b0JveE5vdFJlZ2lzdGVyZWRcIl0gPSAxMzBdID0gXCJDcnlwdG9Cb3hOb3RSZWdpc3RlcmVkXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkludmFsaWRDcnlwdG9Cb3hUeXBlXCJdID0gMTMxXSA9IFwiSW52YWxpZENyeXB0b0JveFR5cGVcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiQ3J5cHRvQm94U2VjcmV0U2VyaWFsaXphdGlvbkVycm9yXCJdID0gMTMyXSA9IFwiQ3J5cHRvQm94U2VjcmV0U2VyaWFsaXphdGlvbkVycm9yXCI7XG4gICAgQ3J5cHRvRXJyb3JDb2RlW0NyeXB0b0Vycm9yQ29kZVtcIkNyeXB0b0JveFNlY3JldERlc2VyaWFsaXphdGlvbkVycm9yXCJdID0gMTMzXSA9IFwiQ3J5cHRvQm94U2VjcmV0RGVzZXJpYWxpemF0aW9uRXJyb3JcIjtcbiAgICBDcnlwdG9FcnJvckNvZGVbQ3J5cHRvRXJyb3JDb2RlW1wiSW52YWxpZE5vbmNlU2l6ZVwiXSA9IDEzNF0gPSBcIkludmFsaWROb25jZVNpemVcIjtcbn0pKENyeXB0b0Vycm9yQ29kZSA9IGV4cG9ydHMuQ3J5cHRvRXJyb3JDb2RlIHx8IChleHBvcnRzLkNyeXB0b0Vycm9yQ29kZSA9IHt9KSk7XG5mdW5jdGlvbiBlbmNyeXB0aW9uQWxnb3JpdGhtQUVTKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0FFUycsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmVuY3J5cHRpb25BbGdvcml0aG1BRVMgPSBlbmNyeXB0aW9uQWxnb3JpdGhtQUVTO1xuZnVuY3Rpb24gZW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0NoYUNoYTIwJyxcbiAgICAgICAgdmFsdWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuZW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwID0gZW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwO1xuZnVuY3Rpb24gZW5jcnlwdGlvbkFsZ29yaXRobU5hY2xCb3godmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnTmFjbEJveCcsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmVuY3J5cHRpb25BbGdvcml0aG1OYWNsQm94ID0gZW5jcnlwdGlvbkFsZ29yaXRobU5hY2xCb3g7XG5mdW5jdGlvbiBlbmNyeXB0aW9uQWxnb3JpdGhtTmFjbFNlY3JldEJveCh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdOYWNsU2VjcmV0Qm94JyxcbiAgICAgICAgdmFsdWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuZW5jcnlwdGlvbkFsZ29yaXRobU5hY2xTZWNyZXRCb3ggPSBlbmNyeXB0aW9uQWxnb3JpdGhtTmFjbFNlY3JldEJveDtcbnZhciBDaXBoZXJNb2RlO1xuKGZ1bmN0aW9uIChDaXBoZXJNb2RlKSB7XG4gICAgQ2lwaGVyTW9kZVtcIkNCQ1wiXSA9IFwiQ0JDXCI7XG4gICAgQ2lwaGVyTW9kZVtcIkNGQlwiXSA9IFwiQ0ZCXCI7XG4gICAgQ2lwaGVyTW9kZVtcIkNUUlwiXSA9IFwiQ1RSXCI7XG4gICAgQ2lwaGVyTW9kZVtcIkVDQlwiXSA9IFwiRUNCXCI7XG4gICAgQ2lwaGVyTW9kZVtcIk9GQlwiXSA9IFwiT0ZCXCI7XG59KShDaXBoZXJNb2RlID0gZXhwb3J0cy5DaXBoZXJNb2RlIHx8IChleHBvcnRzLkNpcGhlck1vZGUgPSB7fSkpO1xuZnVuY3Rpb24gY3J5cHRvQm94U2VjcmV0UmFuZG9tU2VlZFBocmFzZShkaWN0aW9uYXJ5LCB3b3JkY291bnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnUmFuZG9tU2VlZFBocmFzZScsXG4gICAgICAgIGRpY3Rpb25hcnksXG4gICAgICAgIHdvcmRjb3VudCxcbiAgICB9O1xufVxuZXhwb3J0cy5jcnlwdG9Cb3hTZWNyZXRSYW5kb21TZWVkUGhyYXNlID0gY3J5cHRvQm94U2VjcmV0UmFuZG9tU2VlZFBocmFzZTtcbmZ1bmN0aW9uIGNyeXB0b0JveFNlY3JldFByZWRlZmluZWRTZWVkUGhyYXNlKHBocmFzZSwgZGljdGlvbmFyeSwgd29yZGNvdW50KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1ByZWRlZmluZWRTZWVkUGhyYXNlJyxcbiAgICAgICAgcGhyYXNlLFxuICAgICAgICBkaWN0aW9uYXJ5LFxuICAgICAgICB3b3JkY291bnQsXG4gICAgfTtcbn1cbmV4cG9ydHMuY3J5cHRvQm94U2VjcmV0UHJlZGVmaW5lZFNlZWRQaHJhc2UgPSBjcnlwdG9Cb3hTZWNyZXRQcmVkZWZpbmVkU2VlZFBocmFzZTtcbmZ1bmN0aW9uIGNyeXB0b0JveFNlY3JldEVuY3J5cHRlZFNlY3JldChlbmNyeXB0ZWRfc2VjcmV0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0VuY3J5cHRlZFNlY3JldCcsXG4gICAgICAgIGVuY3J5cHRlZF9zZWNyZXQsXG4gICAgfTtcbn1cbmV4cG9ydHMuY3J5cHRvQm94U2VjcmV0RW5jcnlwdGVkU2VjcmV0ID0gY3J5cHRvQm94U2VjcmV0RW5jcnlwdGVkU2VjcmV0O1xuZnVuY3Rpb24gYm94RW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0NoYUNoYTIwJyxcbiAgICAgICAgdmFsdWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuYm94RW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwID0gYm94RW5jcnlwdGlvbkFsZ29yaXRobUNoYUNoYTIwO1xuZnVuY3Rpb24gYm94RW5jcnlwdGlvbkFsZ29yaXRobU5hY2xCb3godmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnTmFjbEJveCcsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmJveEVuY3J5cHRpb25BbGdvcml0aG1OYWNsQm94ID0gYm94RW5jcnlwdGlvbkFsZ29yaXRobU5hY2xCb3g7XG5mdW5jdGlvbiBib3hFbmNyeXB0aW9uQWxnb3JpdGhtTmFjbFNlY3JldEJveCh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdOYWNsU2VjcmV0Qm94JyxcbiAgICAgICAgdmFsdWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuYm94RW5jcnlwdGlvbkFsZ29yaXRobU5hY2xTZWNyZXRCb3ggPSBib3hFbmNyeXB0aW9uQWxnb3JpdGhtTmFjbFNlY3JldEJveDtcbmZ1bmN0aW9uIHBhcmFtc09mQXBwUGFzc3dvcmRQcm92aWRlckdldFBhc3N3b3JkKGVuY3J5cHRpb25fcHVibGljX2tleSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdHZXRQYXNzd29yZCcsXG4gICAgICAgIGVuY3J5cHRpb25fcHVibGljX2tleSxcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJhbXNPZkFwcFBhc3N3b3JkUHJvdmlkZXJHZXRQYXNzd29yZCA9IHBhcmFtc09mQXBwUGFzc3dvcmRQcm92aWRlckdldFBhc3N3b3JkO1xuZnVuY3Rpb24gcmVzdWx0T2ZBcHBQYXNzd29yZFByb3ZpZGVyR2V0UGFzc3dvcmQoZW5jcnlwdGVkX3Bhc3N3b3JkLCBhcHBfZW5jcnlwdGlvbl9wdWJrZXkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnR2V0UGFzc3dvcmQnLFxuICAgICAgICBlbmNyeXB0ZWRfcGFzc3dvcmQsXG4gICAgICAgIGFwcF9lbmNyeXB0aW9uX3B1YmtleSxcbiAgICB9O1xufVxuZXhwb3J0cy5yZXN1bHRPZkFwcFBhc3N3b3JkUHJvdmlkZXJHZXRQYXNzd29yZCA9IHJlc3VsdE9mQXBwUGFzc3dvcmRQcm92aWRlckdldFBhc3N3b3JkO1xuZnVuY3Rpb24gcGFyYW1zT2ZBcHBTaWduaW5nQm94R2V0UHVibGljS2V5KCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdHZXRQdWJsaWNLZXknLFxuICAgIH07XG59XG5leHBvcnRzLnBhcmFtc09mQXBwU2lnbmluZ0JveEdldFB1YmxpY0tleSA9IHBhcmFtc09mQXBwU2lnbmluZ0JveEdldFB1YmxpY0tleTtcbmZ1bmN0aW9uIHBhcmFtc09mQXBwU2lnbmluZ0JveFNpZ24odW5zaWduZWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnU2lnbicsXG4gICAgICAgIHVuc2lnbmVkLFxuICAgIH07XG59XG5leHBvcnRzLnBhcmFtc09mQXBwU2lnbmluZ0JveFNpZ24gPSBwYXJhbXNPZkFwcFNpZ25pbmdCb3hTaWduO1xuZnVuY3Rpb24gcmVzdWx0T2ZBcHBTaWduaW5nQm94R2V0UHVibGljS2V5KHB1YmxpY19rZXkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnR2V0UHVibGljS2V5JyxcbiAgICAgICAgcHVibGljX2tleSxcbiAgICB9O1xufVxuZXhwb3J0cy5yZXN1bHRPZkFwcFNpZ25pbmdCb3hHZXRQdWJsaWNLZXkgPSByZXN1bHRPZkFwcFNpZ25pbmdCb3hHZXRQdWJsaWNLZXk7XG5mdW5jdGlvbiByZXN1bHRPZkFwcFNpZ25pbmdCb3hTaWduKHNpZ25hdHVyZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdTaWduJyxcbiAgICAgICAgc2lnbmF0dXJlLFxuICAgIH07XG59XG5leHBvcnRzLnJlc3VsdE9mQXBwU2lnbmluZ0JveFNpZ24gPSByZXN1bHRPZkFwcFNpZ25pbmdCb3hTaWduO1xuZnVuY3Rpb24gcGFyYW1zT2ZBcHBFbmNyeXB0aW9uQm94R2V0SW5mbygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnR2V0SW5mbycsXG4gICAgfTtcbn1cbmV4cG9ydHMucGFyYW1zT2ZBcHBFbmNyeXB0aW9uQm94R2V0SW5mbyA9IHBhcmFtc09mQXBwRW5jcnlwdGlvbkJveEdldEluZm87XG5mdW5jdGlvbiBwYXJhbXNPZkFwcEVuY3J5cHRpb25Cb3hFbmNyeXB0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRW5jcnlwdCcsXG4gICAgICAgIGRhdGEsXG4gICAgfTtcbn1cbmV4cG9ydHMucGFyYW1zT2ZBcHBFbmNyeXB0aW9uQm94RW5jcnlwdCA9IHBhcmFtc09mQXBwRW5jcnlwdGlvbkJveEVuY3J5cHQ7XG5mdW5jdGlvbiBwYXJhbXNPZkFwcEVuY3J5cHRpb25Cb3hEZWNyeXB0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRGVjcnlwdCcsXG4gICAgICAgIGRhdGEsXG4gICAgfTtcbn1cbmV4cG9ydHMucGFyYW1zT2ZBcHBFbmNyeXB0aW9uQm94RGVjcnlwdCA9IHBhcmFtc09mQXBwRW5jcnlwdGlvbkJveERlY3J5cHQ7XG5mdW5jdGlvbiByZXN1bHRPZkFwcEVuY3J5cHRpb25Cb3hHZXRJbmZvKGluZm8pIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnR2V0SW5mbycsXG4gICAgICAgIGluZm8sXG4gICAgfTtcbn1cbmV4cG9ydHMucmVzdWx0T2ZBcHBFbmNyeXB0aW9uQm94R2V0SW5mbyA9IHJlc3VsdE9mQXBwRW5jcnlwdGlvbkJveEdldEluZm87XG5mdW5jdGlvbiByZXN1bHRPZkFwcEVuY3J5cHRpb25Cb3hFbmNyeXB0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRW5jcnlwdCcsXG4gICAgICAgIGRhdGEsXG4gICAgfTtcbn1cbmV4cG9ydHMucmVzdWx0T2ZBcHBFbmNyeXB0aW9uQm94RW5jcnlwdCA9IHJlc3VsdE9mQXBwRW5jcnlwdGlvbkJveEVuY3J5cHQ7XG5mdW5jdGlvbiByZXN1bHRPZkFwcEVuY3J5cHRpb25Cb3hEZWNyeXB0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRGVjcnlwdCcsXG4gICAgICAgIGRhdGEsXG4gICAgfTtcbn1cbmV4cG9ydHMucmVzdWx0T2ZBcHBFbmNyeXB0aW9uQm94RGVjcnlwdCA9IHJlc3VsdE9mQXBwRW5jcnlwdGlvbkJveERlY3J5cHQ7XG5mdW5jdGlvbiBkaXNwYXRjaEFwcFBhc3N3b3JkUHJvdmlkZXIob2JqLCBwYXJhbXMsIGFwcF9yZXF1ZXN0X2lkLCBjbGllbnQpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgc3dpdGNoIChwYXJhbXMudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ0dldFBhc3N3b3JkJzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgb2JqLmdldF9wYXNzd29yZChwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsaWVudC5yZXNvbHZlX2FwcF9yZXF1ZXN0KGFwcF9yZXF1ZXN0X2lkLCBPYmplY3QuYXNzaWduKHsgdHlwZTogcGFyYW1zLnR5cGUgfSwgcmVzdWx0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjbGllbnQucmVqZWN0X2FwcF9yZXF1ZXN0KGFwcF9yZXF1ZXN0X2lkLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoQXBwU2lnbmluZ0JveChvYmosIHBhcmFtcywgYXBwX3JlcXVlc3RfaWQsIGNsaWVudCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBzd2l0Y2ggKHBhcmFtcy50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnR2V0UHVibGljS2V5JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgb2JqLmdldF9wdWJsaWNfa2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1NpZ24nOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB5aWVsZCBvYmouc2lnbihwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsaWVudC5yZXNvbHZlX2FwcF9yZXF1ZXN0KGFwcF9yZXF1ZXN0X2lkLCBPYmplY3QuYXNzaWduKHsgdHlwZTogcGFyYW1zLnR5cGUgfSwgcmVzdWx0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjbGllbnQucmVqZWN0X2FwcF9yZXF1ZXN0KGFwcF9yZXF1ZXN0X2lkLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoQXBwRW5jcnlwdGlvbkJveChvYmosIHBhcmFtcywgYXBwX3JlcXVlc3RfaWQsIGNsaWVudCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBzd2l0Y2ggKHBhcmFtcy50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnR2V0SW5mbyc6XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlpZWxkIG9iai5nZXRfaW5mbygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdFbmNyeXB0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgb2JqLmVuY3J5cHQocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnRGVjcnlwdCc6XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlpZWxkIG9iai5kZWNyeXB0KHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xpZW50LnJlc29sdmVfYXBwX3JlcXVlc3QoYXBwX3JlcXVlc3RfaWQsIE9iamVjdC5hc3NpZ24oeyB0eXBlOiBwYXJhbXMudHlwZSB9LCByZXN1bHQpKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNsaWVudC5yZWplY3RfYXBwX3JlcXVlc3QoYXBwX3JlcXVlc3RfaWQsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuLyoqXG4gKiBDcnlwdG8gZnVuY3Rpb25zLlxuICovXG5jbGFzcyBDcnlwdG9Nb2R1bGUge1xuICAgIGNvbnN0cnVjdG9yKGNsaWVudCkge1xuICAgICAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW50ZWdlciBmYWN0b3JpemF0aW9uXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBlcmZvcm1zIHByaW1lIGZhY3Rvcml6YXRpb24g4oCTIGRlY29tcG9zaXRpb24gb2YgYSBjb21wb3NpdGUgbnVtYmVyXG4gICAgICogaW50byBhIHByb2R1Y3Qgb2Ygc21hbGxlciBwcmltZSBpbnRlZ2VycyAoZmFjdG9ycykuXG4gICAgICogU2VlIFtodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JbnRlZ2VyX2ZhY3Rvcml6YXRpb25dXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mRmFjdG9yaXplfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkZhY3Rvcml6ZVxuICAgICAqL1xuICAgIGZhY3Rvcml6ZShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5mYWN0b3JpemUnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNb2R1bGFyIGV4cG9uZW50aWF0aW9uXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBlcmZvcm1zIG1vZHVsYXIgZXhwb25lbnRpYXRpb24gZm9yIGJpZyBpbnRlZ2VycyAoYGJhc2VgXmBleHBvbmVudGAgbW9kIGBtb2R1bHVzYCkuXG4gICAgICogU2VlIFtodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Nb2R1bGFyX2V4cG9uZW50aWF0aW9uXVxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZk1vZHVsYXJQb3dlcn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZNb2R1bGFyUG93ZXJcbiAgICAgKi9cbiAgICBtb2R1bGFyX3Bvd2VyKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm1vZHVsYXJfcG93ZXInLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIENSQzE2IHVzaW5nIFRPTiBhbGdvcml0aG0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mVG9uQ3JjMTZ9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mVG9uQ3JjMTZcbiAgICAgKi9cbiAgICB0b25fY3JjMTYocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8udG9uX2NyYzE2JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHJhbmRvbSBieXRlIGFycmF5IG9mIHRoZSBzcGVjaWZpZWQgbGVuZ3RoIGFuZCByZXR1cm5zIGl0IGluIGBiYXNlNjRgIGZvcm1hdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkdlbmVyYXRlUmFuZG9tQnl0ZXN9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mR2VuZXJhdGVSYW5kb21CeXRlc1xuICAgICAqL1xuICAgIGdlbmVyYXRlX3JhbmRvbV9ieXRlcyhwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5nZW5lcmF0ZV9yYW5kb21fYnl0ZXMnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBwdWJsaWMga2V5IHRvIHRvbiBzYWZlX2Zvcm1hdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkNvbnZlcnRQdWJsaWNLZXlUb1RvblNhZmVGb3JtYXR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mQ29udmVydFB1YmxpY0tleVRvVG9uU2FmZUZvcm1hdFxuICAgICAqL1xuICAgIGNvbnZlcnRfcHVibGljX2tleV90b190b25fc2FmZV9mb3JtYXQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uY29udmVydF9wdWJsaWNfa2V5X3RvX3Rvbl9zYWZlX2Zvcm1hdCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyByYW5kb20gZWQyNTUxOSBrZXkgcGFpci5cbiAgICAgKiBAcmV0dXJucyBLZXlQYWlyXG4gICAgICovXG4gICAgZ2VuZXJhdGVfcmFuZG9tX3NpZ25fa2V5cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5nZW5lcmF0ZV9yYW5kb21fc2lnbl9rZXlzJyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNpZ25zIGEgZGF0YSB1c2luZyB0aGUgcHJvdmlkZWQga2V5cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZTaWdufSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlNpZ25cbiAgICAgKi9cbiAgICBzaWduKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLnNpZ24nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBWZXJpZmllcyBzaWduZWQgZGF0YSB1c2luZyB0aGUgcHJvdmlkZWQgcHVibGljIGtleS4gUmFpc2VzIGVycm9yIGlmIHZlcmlmaWNhdGlvbiBpcyBmYWlsZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mVmVyaWZ5U2lnbmF0dXJlfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlZlcmlmeVNpZ25hdHVyZVxuICAgICAqL1xuICAgIHZlcmlmeV9zaWduYXR1cmUocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8udmVyaWZ5X3NpZ25hdHVyZScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZXMgU0hBMjU2IGhhc2ggb2YgdGhlIHNwZWNpZmllZCBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkhhc2h9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mSGFzaFxuICAgICAqL1xuICAgIHNoYTI1NihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5zaGEyNTYnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIFNIQTUxMiBoYXNoIG9mIHRoZSBzcGVjaWZpZWQgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZIYXNofSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkhhc2hcbiAgICAgKi9cbiAgICBzaGE1MTIocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uc2hhNTEyJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBgc2NyeXB0YCBlbmNyeXB0aW9uXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIERlcml2ZXMga2V5IGZyb20gYHBhc3N3b3JkYCBhbmQgYGtleWAgdXNpbmcgYHNjcnlwdGAgYWxnb3JpdGhtLlxuICAgICAqIFNlZSBbaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU2NyeXB0XS5cbiAgICAgKlxuICAgICAqICMgQXJndW1lbnRzXG4gICAgICogLSBgbG9nX25gIC0gVGhlIGxvZzIgb2YgdGhlIFNjcnlwdCBwYXJhbWV0ZXIgYE5gXG4gICAgICogLSBgcmAgLSBUaGUgU2NyeXB0IHBhcmFtZXRlciBgcmBcbiAgICAgKiAtIGBwYCAtIFRoZSBTY3J5cHQgcGFyYW1ldGVyIGBwYFxuICAgICAqICMgQ29uZGl0aW9uc1xuICAgICAqIC0gYGxvZ19uYCBtdXN0IGJlIGxlc3MgdGhhbiBgNjRgXG4gICAgICogLSBgcmAgbXVzdCBiZSBncmVhdGVyIHRoYW4gYDBgIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYDQyOTQ5NjcyOTVgXG4gICAgICogLSBgcGAgbXVzdCBiZSBncmVhdGVyIHRoYW4gYDBgIGFuZCBsZXNzIHRoYW4gYDQyOTQ5NjcyOTVgXG4gICAgICogIyBSZWNvbW1lbmRlZCB2YWx1ZXMgc3VmZmljaWVudCBmb3IgbW9zdCB1c2UtY2FzZXNcbiAgICAgKiAtIGBsb2dfbiA9IDE1YCAoYG4gPSAzMjc2OGApXG4gICAgICogLSBgciA9IDhgXG4gICAgICogLSBgcCA9IDFgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mU2NyeXB0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlNjcnlwdFxuICAgICAqL1xuICAgIHNjcnlwdChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5zY3J5cHQnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBrZXkgcGFpciBmb3Igc2lnbmluZyBmcm9tIHRoZSBzZWNyZXQga2V5XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqICoqTk9URToqKiBJbiB0aGUgcmVzdWx0IHRoZSBzZWNyZXQga2V5IGlzIGFjdHVhbGx5IHRoZSBjb25jYXRlbmF0aW9uXG4gICAgICogb2Ygc2VjcmV0IGFuZCBwdWJsaWMga2V5cyAoMTI4IHN5bWJvbHMgaGV4IHN0cmluZykgYnkgZGVzaWduIG9mIFtOYUNMXShodHRwOi8vbmFjbC5jci55cC50by9zaWduLmh0bWwpLlxuICAgICAqIFNlZSBhbHNvIFt0aGUgc3RhY2tleGNoYW5nZSBxdWVzdGlvbl0oaHR0cHM6Ly9jcnlwdG8uc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzU0MzUzLykuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTmFjbFNpZ25LZXlQYWlyRnJvbVNlY3JldH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgS2V5UGFpclxuICAgICAqL1xuICAgIG5hY2xfc2lnbl9rZXlwYWlyX2Zyb21fc2VjcmV0X2tleShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5uYWNsX3NpZ25fa2V5cGFpcl9mcm9tX3NlY3JldF9rZXknLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTaWducyBkYXRhIHVzaW5nIHRoZSBzaWduZXIncyBzZWNyZXQga2V5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZk5hY2xTaWdufSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZk5hY2xTaWduXG4gICAgICovXG4gICAgbmFjbF9zaWduKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm5hY2xfc2lnbicsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFZlcmlmaWVzIHRoZSBzaWduYXR1cmUgYW5kIHJldHVybnMgdGhlIHVuc2lnbmVkIG1lc3NhZ2VcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVmVyaWZpZXMgdGhlIHNpZ25hdHVyZSBpbiBgc2lnbmVkYCB1c2luZyB0aGUgc2lnbmVyJ3MgcHVibGljIGtleSBgcHVibGljYFxuICAgICAqIGFuZCByZXR1cm5zIHRoZSBtZXNzYWdlIGB1bnNpZ25lZGAuXG4gICAgICpcbiAgICAgKiBJZiB0aGUgc2lnbmF0dXJlIGZhaWxzIHZlcmlmaWNhdGlvbiwgY3J5cHRvX3NpZ25fb3BlbiByYWlzZXMgYW4gZXhjZXB0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZk5hY2xTaWduT3Blbn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZOYWNsU2lnbk9wZW5cbiAgICAgKi9cbiAgICBuYWNsX3NpZ25fb3BlbihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5uYWNsX3NpZ25fb3BlbicsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNpZ25zIHRoZSBtZXNzYWdlIHVzaW5nIHRoZSBzZWNyZXQga2V5IGFuZCByZXR1cm5zIGEgc2lnbmF0dXJlLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBTaWducyB0aGUgbWVzc2FnZSBgdW5zaWduZWRgIHVzaW5nIHRoZSBzZWNyZXQga2V5IGBzZWNyZXRgXG4gICAgICogYW5kIHJldHVybnMgYSBzaWduYXR1cmUgYHNpZ25hdHVyZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTmFjbFNpZ259IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mTmFjbFNpZ25EZXRhY2hlZFxuICAgICAqL1xuICAgIG5hY2xfc2lnbl9kZXRhY2hlZChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5uYWNsX3NpZ25fZGV0YWNoZWQnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBWZXJpZmllcyB0aGUgc2lnbmF0dXJlIHdpdGggcHVibGljIGtleSBhbmQgYHVuc2lnbmVkYCBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZk5hY2xTaWduRGV0YWNoZWRWZXJpZnl9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mTmFjbFNpZ25EZXRhY2hlZFZlcmlmeVxuICAgICAqL1xuICAgIG5hY2xfc2lnbl9kZXRhY2hlZF92ZXJpZnkocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ubmFjbF9zaWduX2RldGFjaGVkX3ZlcmlmeScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBOYUNsIGtleSBwYWlyXG4gICAgICogQHJldHVybnMgS2V5UGFpclxuICAgICAqL1xuICAgIG5hY2xfYm94X2tleXBhaXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ubmFjbF9ib3hfa2V5cGFpcicpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMga2V5IHBhaXIgZnJvbSBhIHNlY3JldCBrZXlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZOYWNsQm94S2V5UGFpckZyb21TZWNyZXR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIEtleVBhaXJcbiAgICAgKi9cbiAgICBuYWNsX2JveF9rZXlwYWlyX2Zyb21fc2VjcmV0X2tleShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5uYWNsX2JveF9rZXlwYWlyX2Zyb21fc2VjcmV0X2tleScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBrZXkgYXV0aGVudGljYXRlZCBlbmNyeXB0aW9uXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIEVuY3J5cHQgYW5kIGF1dGhlbnRpY2F0ZSBhIG1lc3NhZ2UgdXNpbmcgdGhlIHNlbmRlcnMgc2VjcmV0IGtleSwgdGhlIHJlY2VpdmVycyBwdWJsaWNcbiAgICAgKiBrZXksIGFuZCBhIG5vbmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZk5hY2xCb3h9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mTmFjbEJveFxuICAgICAqL1xuICAgIG5hY2xfYm94KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm5hY2xfYm94JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjcnlwdCBhbmQgdmVyaWZ5IHRoZSBjaXBoZXIgdGV4dCB1c2luZyB0aGUgcmVjZWl2ZXJzIHNlY3JldCBrZXksIHRoZSBzZW5kZXJzIHB1YmxpYyBrZXksIGFuZCB0aGUgbm9uY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTmFjbEJveE9wZW59IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mTmFjbEJveE9wZW5cbiAgICAgKi9cbiAgICBuYWNsX2JveF9vcGVuKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm5hY2xfYm94X29wZW4nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNyeXB0IGFuZCBhdXRoZW50aWNhdGUgbWVzc2FnZSB1c2luZyBub25jZSBhbmQgc2VjcmV0IGtleS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZOYWNsU2VjcmV0Qm94fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZk5hY2xCb3hcbiAgICAgKi9cbiAgICBuYWNsX3NlY3JldF9ib3gocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ubmFjbF9zZWNyZXRfYm94JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjcnlwdHMgYW5kIHZlcmlmaWVzIGNpcGhlciB0ZXh0IHVzaW5nIGBub25jZWAgYW5kIHNlY3JldCBga2V5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZOYWNsU2VjcmV0Qm94T3Blbn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZOYWNsQm94T3BlblxuICAgICAqL1xuICAgIG5hY2xfc2VjcmV0X2JveF9vcGVuKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm5hY2xfc2VjcmV0X2JveF9vcGVuJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJpbnRzIHRoZSBsaXN0IG9mIHdvcmRzIGZyb20gdGhlIHNwZWNpZmllZCBkaWN0aW9uYXJ5XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTW5lbW9uaWNXb3Jkc30gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZNbmVtb25pY1dvcmRzXG4gICAgICovXG4gICAgbW5lbW9uaWNfd29yZHMocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ubW5lbW9uaWNfd29yZHMnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSByYW5kb20gbW5lbW9uaWNcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogR2VuZXJhdGVzIGEgcmFuZG9tIG1uZW1vbmljIGZyb20gdGhlIHNwZWNpZmllZCBkaWN0aW9uYXJ5IGFuZCB3b3JkIGNvdW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTW5lbW9uaWNGcm9tUmFuZG9tfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZk1uZW1vbmljRnJvbVJhbmRvbVxuICAgICAqL1xuICAgIG1uZW1vbmljX2Zyb21fcmFuZG9tKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm1uZW1vbmljX2Zyb21fcmFuZG9tJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIG1uZW1vbmljIGZyb20gcHJlLWdlbmVyYXRlZCBlbnRyb3B5XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTW5lbW9uaWNGcm9tRW50cm9weX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZNbmVtb25pY0Zyb21FbnRyb3B5XG4gICAgICovXG4gICAgbW5lbW9uaWNfZnJvbV9lbnRyb3B5KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLm1uZW1vbmljX2Zyb21fZW50cm9weScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlcyBhIG1uZW1vbmljIHBocmFzZVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGUgcGhyYXNlIHN1cHBsaWVkIHdpbGwgYmUgY2hlY2tlZCBmb3Igd29yZCBsZW5ndGggYW5kIHZhbGlkYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGNoZWNrc3VtXG4gICAgICogc3BlY2lmaWVkIGluIEJJUDAwMzkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTW5lbW9uaWNWZXJpZnl9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mTW5lbW9uaWNWZXJpZnlcbiAgICAgKi9cbiAgICBtbmVtb25pY192ZXJpZnkocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ubW5lbW9uaWNfdmVyaWZ5JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVyaXZlcyBhIGtleSBwYWlyIGZvciBzaWduaW5nIGZyb20gdGhlIHNlZWQgcGhyYXNlXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFZhbGlkYXRlcyB0aGUgc2VlZCBwaHJhc2UsIGdlbmVyYXRlcyBtYXN0ZXIga2V5IGFuZCB0aGVuIGRlcml2ZXNcbiAgICAgKiB0aGUga2V5IHBhaXIgZnJvbSB0aGUgbWFzdGVyIGtleSBhbmQgdGhlIHNwZWNpZmllZCBwYXRoXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mTW5lbW9uaWNEZXJpdmVTaWduS2V5c30gcGFyYW1zXG4gICAgICogQHJldHVybnMgS2V5UGFpclxuICAgICAqL1xuICAgIG1uZW1vbmljX2Rlcml2ZV9zaWduX2tleXMocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ubW5lbW9uaWNfZGVyaXZlX3NpZ25fa2V5cycsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBleHRlbmRlZCBtYXN0ZXIgcHJpdmF0ZSBrZXkgdGhhdCB3aWxsIGJlIHRoZSByb290IGZvciBhbGwgdGhlIGRlcml2ZWQga2V5c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkhES2V5WFBydkZyb21NbmVtb25pY30gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZIREtleVhQcnZGcm9tTW5lbW9uaWNcbiAgICAgKi9cbiAgICBoZGtleV94cHJ2X2Zyb21fbW5lbW9uaWMocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uaGRrZXlfeHBydl9mcm9tX21uZW1vbmljJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBleHRlbmRlZCBwcml2YXRlIGtleSBkZXJpdmVkIGZyb20gdGhlIHNwZWNpZmllZCBleHRlbmRlZCBwcml2YXRlIGtleSBhbmQgY2hpbGQgaW5kZXhcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZIREtleURlcml2ZUZyb21YUHJ2fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkhES2V5RGVyaXZlRnJvbVhQcnZcbiAgICAgKi9cbiAgICBoZGtleV9kZXJpdmVfZnJvbV94cHJ2KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLmhka2V5X2Rlcml2ZV9mcm9tX3hwcnYnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZXJpdmVzIHRoZSBleHRlbmRlZCBwcml2YXRlIGtleSBmcm9tIHRoZSBzcGVjaWZpZWQga2V5IGFuZCBwYXRoXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mSERLZXlEZXJpdmVGcm9tWFBydlBhdGh9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mSERLZXlEZXJpdmVGcm9tWFBydlBhdGhcbiAgICAgKi9cbiAgICBoZGtleV9kZXJpdmVfZnJvbV94cHJ2X3BhdGgocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uaGRrZXlfZGVyaXZlX2Zyb21feHBydl9wYXRoJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXh0cmFjdHMgdGhlIHByaXZhdGUga2V5IGZyb20gdGhlIHNlcmlhbGl6ZWQgZXh0ZW5kZWQgcHJpdmF0ZSBrZXlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZIREtleVNlY3JldEZyb21YUHJ2fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkhES2V5U2VjcmV0RnJvbVhQcnZcbiAgICAgKi9cbiAgICBoZGtleV9zZWNyZXRfZnJvbV94cHJ2KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLmhka2V5X3NlY3JldF9mcm9tX3hwcnYnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0cyB0aGUgcHVibGljIGtleSBmcm9tIHRoZSBzZXJpYWxpemVkIGV4dGVuZGVkIHByaXZhdGUga2V5XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mSERLZXlQdWJsaWNGcm9tWFBydn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZIREtleVB1YmxpY0Zyb21YUHJ2XG4gICAgICovXG4gICAgaGRrZXlfcHVibGljX2Zyb21feHBydihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5oZGtleV9wdWJsaWNfZnJvbV94cHJ2JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgc3ltbWV0cmljIGBjaGFjaGEyMGAgZW5jcnlwdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZDaGFDaGEyMH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZDaGFDaGEyMFxuICAgICAqL1xuICAgIGNoYWNoYTIwKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLmNoYWNoYTIwJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIENyeXB0byBCb3ggaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIENyeXB0byBCb3ggaXMgYSByb290IGNyeXB0byBvYmplY3QsIHRoYXQgZW5jYXBzdWxhdGVzIHNvbWUgc2VjcmV0IChzZWVkIHBocmFzZSB1c3VhbGx5KVxuICAgICAqIGluIGVuY3J5cHRlZCBmb3JtIGFuZCBhY3RzIGFzIGEgZmFjdG9yeSBmb3IgYWxsIGNyeXB0byBwcmltaXRpdmVzIHVzZWQgaW4gU0RLOlxuICAgICAqIGtleXMgZm9yIHNpZ25pbmcgYW5kIGVuY3J5cHRpb24sIGRlcml2ZWQgZnJvbSB0aGlzIHNlY3JldC5cbiAgICAgKlxuICAgICAqIENyeXB0byBCb3ggZW5jcnlwdHMgb3JpZ2luYWwgU2VlZCBQaHJhc2Ugd2l0aCBzYWx0IGFuZCBwYXNzd29yZCB0aGF0IGlzIHJldHJpZXZlZFxuICAgICAqIGZyb20gYHBhc3N3b3JkX3Byb3ZpZGVyYCBjYWxsYmFjaywgaW1wbGVtZW50ZWQgb24gQXBwbGljYXRpb24gc2lkZS5cbiAgICAgKlxuICAgICAqIFdoZW4gdXNlZCwgZGVjcnlwdGVkIHNlY3JldCBzaG93cyB1cCBpbiBjb3JlIGxpYnJhcnkncyBtZW1vcnkgZm9yIGEgdmVyeSBzaG9ydCBwZXJpb2RcbiAgICAgKiBvZiB0aW1lIGFuZCB0aGVuIGlzIGltbWVkaWF0ZWx5IG92ZXJ3cml0dGVuIHdpdGggemVyb2VzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkNyZWF0ZUNyeXB0b0JveH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVnaXN0ZXJlZENyeXB0b0JveFxuICAgICAqL1xuICAgIGNyZWF0ZV9jcnlwdG9fYm94KHBhcmFtcywgb2JqKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uY3JlYXRlX2NyeXB0b19ib3gnLCBwYXJhbXMsIChwYXJhbXMsIHJlc3BvbnNlVHlwZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoQXBwUGFzc3dvcmRQcm92aWRlcihvYmosIHBhcmFtcy5yZXF1ZXN0X2RhdGEsIHBhcmFtcy5hcHBfcmVxdWVzdF9pZCwgdGhpcy5jbGllbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocmVzcG9uc2VUeXBlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hBcHBQYXNzd29yZFByb3ZpZGVyKG9iaiwgcGFyYW1zLCBudWxsLCB0aGlzLmNsaWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIENyeXB0byBCb3guIENsZWFycyBhbGwgc2VjcmV0IGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1JlZ2lzdGVyZWRDcnlwdG9Cb3h9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcmVtb3ZlX2NyeXB0b19ib3gocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ucmVtb3ZlX2NyeXB0b19ib3gnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgQ3J5cHRvIEJveCBJbmZvLiBVc2VkIHRvIGdldCBgZW5jcnlwdGVkX3NlY3JldGAgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgYWxsIHRoZSBjcnlwdG9ib3ggaW5pdGlhbGl6YXRpb25zIGV4Y2VwdCB0aGUgZmlyc3Qgb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdpc3RlcmVkQ3J5cHRvQm94fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkdldENyeXB0b0JveEluZm9cbiAgICAgKi9cbiAgICBnZXRfY3J5cHRvX2JveF9pbmZvKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLmdldF9jcnlwdG9fYm94X2luZm8nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgQ3J5cHRvIEJveCBTZWVkIFBocmFzZS5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQXR0ZW50aW9uISBTdG9yZSB0aGlzIGRhdGEgaW4geW91ciBhcHBsaWNhdGlvbiBmb3IgYSB2ZXJ5IHNob3J0IHBlcmlvZCBvZiB0aW1lIGFuZCBvdmVyd3JpdGUgaXQgd2l0aCB6ZXJvZXMgQVNBUC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UmVnaXN0ZXJlZENyeXB0b0JveH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZHZXRDcnlwdG9Cb3hTZWVkUGhyYXNlXG4gICAgICovXG4gICAgZ2V0X2NyeXB0b19ib3hfc2VlZF9waHJhc2UocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uZ2V0X2NyeXB0b19ib3hfc2VlZF9waHJhc2UnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgaGFuZGxlIG9mIFNpZ25pbmcgQm94IGRlcml2ZWQgZnJvbSBDcnlwdG8gQm94LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkdldFNpZ25pbmdCb3hGcm9tQ3J5cHRvQm94fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZWdpc3RlcmVkU2lnbmluZ0JveFxuICAgICAqL1xuICAgIGdldF9zaWduaW5nX2JveF9mcm9tX2NyeXB0b19ib3gocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uZ2V0X3NpZ25pbmdfYm94X2Zyb21fY3J5cHRvX2JveCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldHMgRW5jcnlwdGlvbiBCb3ggZnJvbSBDcnlwdG8gQm94LlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBEZXJpdmVzIGVuY3J5cHRpb24ga2V5cGFpciBmcm9tIGNyeXB0b2JveCBzZWNyZXQgYW5kIGhkcGF0aCBhbmRcbiAgICAgKiBzdG9yZXMgaXQgaW4gY2FjaGUgZm9yIGBzZWNyZXRfbGlmZXRpbWVgXG4gICAgICogb3IgdW50aWwgZXhwbGljaXRseSBjbGVhcmVkIGJ5IGBjbGVhcl9jcnlwdG9fYm94X3NlY3JldF9jYWNoZWAgbWV0aG9kLlxuICAgICAqIElmIGBzZWNyZXRfbGlmZXRpbWVgIGlzIG5vdCBzcGVjaWZpZWQgLSBvdmVyd3JpdGVzIGVuY3J5cHRpb24gc2VjcmV0IHdpdGggemVyb2VzIGltbWVkaWF0ZWx5IGFmdGVyXG4gICAgICogZW5jcnlwdGlvbiBvcGVyYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mR2V0RW5jcnlwdGlvbkJveEZyb21DcnlwdG9Cb3h9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlZ2lzdGVyZWRFbmNyeXB0aW9uQm94XG4gICAgICovXG4gICAgZ2V0X2VuY3J5cHRpb25fYm94X2Zyb21fY3J5cHRvX2JveChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5nZXRfZW5jcnlwdGlvbl9ib3hfZnJvbV9jcnlwdG9fYm94JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBjYWNoZWQgc2VjcmV0cyAob3ZlcndyaXRlcyB3aXRoIHplcm9lcykgZnJvbSBhbGwgc2lnbmluZyBhbmQgZW5jcnlwdGlvbiBib3hlcywgZGVyaXZlZCBmcm9tIGNyeXB0byBib3guXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1JlZ2lzdGVyZWRDcnlwdG9Cb3h9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgY2xlYXJfY3J5cHRvX2JveF9zZWNyZXRfY2FjaGUocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uY2xlYXJfY3J5cHRvX2JveF9zZWNyZXRfY2FjaGUnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhbiBhcHBsaWNhdGlvbiBpbXBsZW1lbnRlZCBzaWduaW5nIGJveC5cbiAgICAgKiBAcmV0dXJucyBSZWdpc3RlcmVkU2lnbmluZ0JveFxuICAgICAqL1xuICAgIHJlZ2lzdGVyX3NpZ25pbmdfYm94KG9iaikge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLnJlZ2lzdGVyX3NpZ25pbmdfYm94JywgdW5kZWZpbmVkLCAocGFyYW1zLCByZXNwb25zZVR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEFwcFNpZ25pbmdCb3gob2JqLCBwYXJhbXMucmVxdWVzdF9kYXRhLCBwYXJhbXMuYXBwX3JlcXVlc3RfaWQsIHRoaXMuY2xpZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHJlc3BvbnNlVHlwZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoQXBwU2lnbmluZ0JveChvYmosIHBhcmFtcywgbnVsbCwgdGhpcy5jbGllbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGRlZmF1bHQgc2lnbmluZyBib3ggaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0tleVBhaXJ9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlZ2lzdGVyZWRTaWduaW5nQm94XG4gICAgICovXG4gICAgZ2V0X3NpZ25pbmdfYm94KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLmdldF9zaWduaW5nX2JveCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcHVibGljIGtleSBvZiBzaWduaW5nIGtleSBwYWlyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdpc3RlcmVkU2lnbmluZ0JveH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZTaWduaW5nQm94R2V0UHVibGljS2V5XG4gICAgICovXG4gICAgc2lnbmluZ19ib3hfZ2V0X3B1YmxpY19rZXkocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uc2lnbmluZ19ib3hfZ2V0X3B1YmxpY19rZXknLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHNpZ25lZCB1c2VyIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mU2lnbmluZ0JveFNpZ259IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mU2lnbmluZ0JveFNpZ25cbiAgICAgKi9cbiAgICBzaWduaW5nX2JveF9zaWduKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLnNpZ25pbmdfYm94X3NpZ24nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHNpZ25pbmcgYm94IGZyb20gU0RLLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdpc3RlcmVkU2lnbmluZ0JveH0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICByZW1vdmVfc2lnbmluZ19ib3gocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8ucmVtb3ZlX3NpZ25pbmdfYm94JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYW4gYXBwbGljYXRpb24gaW1wbGVtZW50ZWQgZW5jcnlwdGlvbiBib3guXG4gICAgICogQHJldHVybnMgUmVnaXN0ZXJlZEVuY3J5cHRpb25Cb3hcbiAgICAgKi9cbiAgICByZWdpc3Rlcl9lbmNyeXB0aW9uX2JveChvYmopIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5yZWdpc3Rlcl9lbmNyeXB0aW9uX2JveCcsIHVuZGVmaW5lZCwgKHBhcmFtcywgcmVzcG9uc2VUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2VUeXBlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hBcHBFbmNyeXB0aW9uQm94KG9iaiwgcGFyYW1zLnJlcXVlc3RfZGF0YSwgcGFyYW1zLmFwcF9yZXF1ZXN0X2lkLCB0aGlzLmNsaWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChyZXNwb25zZVR5cGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEFwcEVuY3J5cHRpb25Cb3gob2JqLCBwYXJhbXMsIG51bGwsIHRoaXMuY2xpZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgZW5jcnlwdGlvbiBib3ggZnJvbSBTREtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UmVnaXN0ZXJlZEVuY3J5cHRpb25Cb3h9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcmVtb3ZlX2VuY3J5cHRpb25fYm94KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnY3J5cHRvLnJlbW92ZV9lbmNyeXB0aW9uX2JveCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFF1ZXJpZXMgaW5mbyBmcm9tIHRoZSBnaXZlbiBlbmNyeXB0aW9uIGJveFxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY3J5cHRpb25Cb3hHZXRJbmZvfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkVuY3J5cHRpb25Cb3hHZXRJbmZvXG4gICAgICovXG4gICAgZW5jcnlwdGlvbl9ib3hfZ2V0X2luZm8ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uZW5jcnlwdGlvbl9ib3hfZ2V0X2luZm8nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNyeXB0cyBkYXRhIHVzaW5nIGdpdmVuIGVuY3J5cHRpb24gYm94IE5vdGUuXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIEJsb2NrIGNpcGhlciBhbGdvcml0aG1zIHBhZCBkYXRhIHRvIGNpcGhlciBibG9jayBzaXplIHNvIGVuY3J5cHRlZCBkYXRhIGNhbiBiZSBsb25nZXIgdGhlbiBvcmlnaW5hbCBkYXRhLiBDbGllbnQgc2hvdWxkIHN0b3JlIHRoZSBvcmlnaW5hbCBkYXRhIHNpemUgYWZ0ZXIgZW5jcnlwdGlvbiBhbmQgdXNlIGl0IGFmdGVyXG4gICAgICogZGVjcnlwdGlvbiB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgZGF0YSBmcm9tIGRlY3J5cHRlZCBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY3J5cHRpb25Cb3hFbmNyeXB0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkVuY3J5cHRpb25Cb3hFbmNyeXB0XG4gICAgICovXG4gICAgZW5jcnlwdGlvbl9ib3hfZW5jcnlwdChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2NyeXB0by5lbmNyeXB0aW9uX2JveF9lbmNyeXB0JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjcnlwdHMgZGF0YSB1c2luZyBnaXZlbiBlbmNyeXB0aW9uIGJveCBOb3RlLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBCbG9jayBjaXBoZXIgYWxnb3JpdGhtcyBwYWQgZGF0YSB0byBjaXBoZXIgYmxvY2sgc2l6ZSBzbyBlbmNyeXB0ZWQgZGF0YSBjYW4gYmUgbG9uZ2VyIHRoZW4gb3JpZ2luYWwgZGF0YS4gQ2xpZW50IHNob3VsZCBzdG9yZSB0aGUgb3JpZ2luYWwgZGF0YSBzaXplIGFmdGVyIGVuY3J5cHRpb24gYW5kIHVzZSBpdCBhZnRlclxuICAgICAqIGRlY3J5cHRpb24gdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIGRhdGEgZnJvbSBkZWNyeXB0ZWQgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZFbmNyeXB0aW9uQm94RGVjcnlwdH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZFbmNyeXB0aW9uQm94RGVjcnlwdFxuICAgICAqL1xuICAgIGVuY3J5cHRpb25fYm94X2RlY3J5cHQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uZW5jcnlwdGlvbl9ib3hfZGVjcnlwdCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZW5jcnlwdGlvbiBib3ggd2l0aCBzcGVjaWZpZWQgYWxnb3JpdGhtXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQ3JlYXRlRW5jcnlwdGlvbkJveH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVnaXN0ZXJlZEVuY3J5cHRpb25Cb3hcbiAgICAgKi9cbiAgICBjcmVhdGVfZW5jcnlwdGlvbl9ib3gocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjcnlwdG8uY3JlYXRlX2VuY3J5cHRpb25fYm94JywgcGFyYW1zKTtcbiAgICB9XG59XG5leHBvcnRzLkNyeXB0b01vZHVsZSA9IENyeXB0b01vZHVsZTtcbi8vIGFiaSBtb2R1bGVcbnZhciBBYmlFcnJvckNvZGU7XG4oZnVuY3Rpb24gKEFiaUVycm9yQ29kZSkge1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJSZXF1aXJlZEFkZHJlc3NNaXNzaW5nRm9yRW5jb2RlTWVzc2FnZVwiXSA9IDMwMV0gPSBcIlJlcXVpcmVkQWRkcmVzc01pc3NpbmdGb3JFbmNvZGVNZXNzYWdlXCI7XG4gICAgQWJpRXJyb3JDb2RlW0FiaUVycm9yQ29kZVtcIlJlcXVpcmVkQ2FsbFNldE1pc3NpbmdGb3JFbmNvZGVNZXNzYWdlXCJdID0gMzAyXSA9IFwiUmVxdWlyZWRDYWxsU2V0TWlzc2luZ0ZvckVuY29kZU1lc3NhZ2VcIjtcbiAgICBBYmlFcnJvckNvZGVbQWJpRXJyb3JDb2RlW1wiSW52YWxpZEpzb25cIl0gPSAzMDNdID0gXCJJbnZhbGlkSnNvblwiO1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJJbnZhbGlkTWVzc2FnZVwiXSA9IDMwNF0gPSBcIkludmFsaWRNZXNzYWdlXCI7XG4gICAgQWJpRXJyb3JDb2RlW0FiaUVycm9yQ29kZVtcIkVuY29kZURlcGxveU1lc3NhZ2VGYWlsZWRcIl0gPSAzMDVdID0gXCJFbmNvZGVEZXBsb3lNZXNzYWdlRmFpbGVkXCI7XG4gICAgQWJpRXJyb3JDb2RlW0FiaUVycm9yQ29kZVtcIkVuY29kZVJ1bk1lc3NhZ2VGYWlsZWRcIl0gPSAzMDZdID0gXCJFbmNvZGVSdW5NZXNzYWdlRmFpbGVkXCI7XG4gICAgQWJpRXJyb3JDb2RlW0FiaUVycm9yQ29kZVtcIkF0dGFjaFNpZ25hdHVyZUZhaWxlZFwiXSA9IDMwN10gPSBcIkF0dGFjaFNpZ25hdHVyZUZhaWxlZFwiO1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJJbnZhbGlkVHZjSW1hZ2VcIl0gPSAzMDhdID0gXCJJbnZhbGlkVHZjSW1hZ2VcIjtcbiAgICBBYmlFcnJvckNvZGVbQWJpRXJyb3JDb2RlW1wiUmVxdWlyZWRQdWJsaWNLZXlNaXNzaW5nRm9yRnVuY3Rpb25IZWFkZXJcIl0gPSAzMDldID0gXCJSZXF1aXJlZFB1YmxpY0tleU1pc3NpbmdGb3JGdW5jdGlvbkhlYWRlclwiO1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJJbnZhbGlkU2lnbmVyXCJdID0gMzEwXSA9IFwiSW52YWxpZFNpZ25lclwiO1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJJbnZhbGlkQWJpXCJdID0gMzExXSA9IFwiSW52YWxpZEFiaVwiO1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJJbnZhbGlkRnVuY3Rpb25JZFwiXSA9IDMxMl0gPSBcIkludmFsaWRGdW5jdGlvbklkXCI7XG4gICAgQWJpRXJyb3JDb2RlW0FiaUVycm9yQ29kZVtcIkludmFsaWREYXRhXCJdID0gMzEzXSA9IFwiSW52YWxpZERhdGFcIjtcbiAgICBBYmlFcnJvckNvZGVbQWJpRXJyb3JDb2RlW1wiRW5jb2RlSW5pdGlhbERhdGFGYWlsZWRcIl0gPSAzMTRdID0gXCJFbmNvZGVJbml0aWFsRGF0YUZhaWxlZFwiO1xuICAgIEFiaUVycm9yQ29kZVtBYmlFcnJvckNvZGVbXCJJbnZhbGlkRnVuY3Rpb25OYW1lXCJdID0gMzE1XSA9IFwiSW52YWxpZEZ1bmN0aW9uTmFtZVwiO1xufSkoQWJpRXJyb3JDb2RlID0gZXhwb3J0cy5BYmlFcnJvckNvZGUgfHwgKGV4cG9ydHMuQWJpRXJyb3JDb2RlID0ge30pKTtcbmZ1bmN0aW9uIGFiaUNvbnRyYWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0NvbnRyYWN0JyxcbiAgICAgICAgdmFsdWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuYWJpQ29udHJhY3QgPSBhYmlDb250cmFjdDtcbmZ1bmN0aW9uIGFiaUpzb24odmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnSnNvbicsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmFiaUpzb24gPSBhYmlKc29uO1xuZnVuY3Rpb24gYWJpSGFuZGxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0hhbmRsZScsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmFiaUhhbmRsZSA9IGFiaUhhbmRsZTtcbmZ1bmN0aW9uIGFiaVNlcmlhbGl6ZWQodmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnU2VyaWFsaXplZCcsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmFiaVNlcmlhbGl6ZWQgPSBhYmlTZXJpYWxpemVkO1xuZnVuY3Rpb24gc2lnbmVyTm9uZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnTm9uZScsXG4gICAgfTtcbn1cbmV4cG9ydHMuc2lnbmVyTm9uZSA9IHNpZ25lck5vbmU7XG5mdW5jdGlvbiBzaWduZXJFeHRlcm5hbChwdWJsaWNfa2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0V4dGVybmFsJyxcbiAgICAgICAgcHVibGljX2tleSxcbiAgICB9O1xufVxuZXhwb3J0cy5zaWduZXJFeHRlcm5hbCA9IHNpZ25lckV4dGVybmFsO1xuZnVuY3Rpb24gc2lnbmVyS2V5cyhrZXlzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0tleXMnLFxuICAgICAgICBrZXlzLFxuICAgIH07XG59XG5leHBvcnRzLnNpZ25lcktleXMgPSBzaWduZXJLZXlzO1xuZnVuY3Rpb24gc2lnbmVyU2lnbmluZ0JveChoYW5kbGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnU2lnbmluZ0JveCcsXG4gICAgICAgIGhhbmRsZSxcbiAgICB9O1xufVxuZXhwb3J0cy5zaWduZXJTaWduaW5nQm94ID0gc2lnbmVyU2lnbmluZ0JveDtcbnZhciBNZXNzYWdlQm9keVR5cGU7XG4oZnVuY3Rpb24gKE1lc3NhZ2VCb2R5VHlwZSkge1xuICAgIE1lc3NhZ2VCb2R5VHlwZVtcIklucHV0XCJdID0gXCJJbnB1dFwiO1xuICAgIE1lc3NhZ2VCb2R5VHlwZVtcIk91dHB1dFwiXSA9IFwiT3V0cHV0XCI7XG4gICAgTWVzc2FnZUJvZHlUeXBlW1wiSW50ZXJuYWxPdXRwdXRcIl0gPSBcIkludGVybmFsT3V0cHV0XCI7XG4gICAgTWVzc2FnZUJvZHlUeXBlW1wiRXZlbnRcIl0gPSBcIkV2ZW50XCI7XG59KShNZXNzYWdlQm9keVR5cGUgPSBleHBvcnRzLk1lc3NhZ2VCb2R5VHlwZSB8fCAoZXhwb3J0cy5NZXNzYWdlQm9keVR5cGUgPSB7fSkpO1xuZnVuY3Rpb24gc3RhdGVJbml0U291cmNlTWVzc2FnZShzb3VyY2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnTWVzc2FnZScsXG4gICAgICAgIHNvdXJjZSxcbiAgICB9O1xufVxuZXhwb3J0cy5zdGF0ZUluaXRTb3VyY2VNZXNzYWdlID0gc3RhdGVJbml0U291cmNlTWVzc2FnZTtcbmZ1bmN0aW9uIHN0YXRlSW5pdFNvdXJjZVN0YXRlSW5pdChjb2RlLCBkYXRhLCBsaWJyYXJ5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1N0YXRlSW5pdCcsXG4gICAgICAgIGNvZGUsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGxpYnJhcnksXG4gICAgfTtcbn1cbmV4cG9ydHMuc3RhdGVJbml0U291cmNlU3RhdGVJbml0ID0gc3RhdGVJbml0U291cmNlU3RhdGVJbml0O1xuZnVuY3Rpb24gc3RhdGVJbml0U291cmNlVHZjKHR2YywgcHVibGljX2tleSwgaW5pdF9wYXJhbXMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnVHZjJyxcbiAgICAgICAgdHZjLFxuICAgICAgICBwdWJsaWNfa2V5LFxuICAgICAgICBpbml0X3BhcmFtcyxcbiAgICB9O1xufVxuZXhwb3J0cy5zdGF0ZUluaXRTb3VyY2VUdmMgPSBzdGF0ZUluaXRTb3VyY2VUdmM7XG5mdW5jdGlvbiBtZXNzYWdlU291cmNlRW5jb2RlZChtZXNzYWdlLCBhYmkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRW5jb2RlZCcsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIGFiaSxcbiAgICB9O1xufVxuZXhwb3J0cy5tZXNzYWdlU291cmNlRW5jb2RlZCA9IG1lc3NhZ2VTb3VyY2VFbmNvZGVkO1xuZnVuY3Rpb24gbWVzc2FnZVNvdXJjZUVuY29kaW5nUGFyYW1zKHBhcmFtcykge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHsgdHlwZTogJ0VuY29kaW5nUGFyYW1zJyB9LCBwYXJhbXMpO1xufVxuZXhwb3J0cy5tZXNzYWdlU291cmNlRW5jb2RpbmdQYXJhbXMgPSBtZXNzYWdlU291cmNlRW5jb2RpbmdQYXJhbXM7XG4vKipcbiAqIFByb3ZpZGVzIG1lc3NhZ2UgZW5jb2RpbmcgYW5kIGRlY29kaW5nIGFjY29yZGluZyB0byB0aGUgQUJJIHNwZWNpZmljYXRpb24uXG4gKi9cbmNsYXNzIEFiaU1vZHVsZSB7XG4gICAgY29uc3RydWN0b3IoY2xpZW50KSB7XG4gICAgICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGVzIG1lc3NhZ2UgYm9keSBhY2NvcmRpbmcgdG8gQUJJIGZ1bmN0aW9uIGNhbGwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mRW5jb2RlTWVzc2FnZUJvZHl9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRW5jb2RlTWVzc2FnZUJvZHlcbiAgICAgKi9cbiAgICBlbmNvZGVfbWVzc2FnZV9ib2R5KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmVuY29kZV9tZXNzYWdlX2JvZHknLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZBdHRhY2hTaWduYXR1cmVUb01lc3NhZ2VCb2R5fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkF0dGFjaFNpZ25hdHVyZVRvTWVzc2FnZUJvZHlcbiAgICAgKi9cbiAgICBhdHRhY2hfc2lnbmF0dXJlX3RvX21lc3NhZ2VfYm9keShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2FiaS5hdHRhY2hfc2lnbmF0dXJlX3RvX21lc3NhZ2VfYm9keScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZXMgYW4gQUJJLWNvbXBhdGlibGUgbWVzc2FnZVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBBbGxvd3MgdG8gZW5jb2RlIGRlcGxveSBhbmQgZnVuY3Rpb24gY2FsbCBtZXNzYWdlcyxcbiAgICAgKiBib3RoIHNpZ25lZCBhbmQgdW5zaWduZWQuXG4gICAgICpcbiAgICAgKiBVc2UgY2FzZXMgaW5jbHVkZSBtZXNzYWdlcyBvZiBhbnkgcG9zc2libGUgdHlwZTpcbiAgICAgKiAtIGRlcGxveSB3aXRoIGluaXRpYWwgZnVuY3Rpb24gY2FsbCAoaS5lLiBgY29uc3RydWN0b3JgIG9yIGFueSBvdGhlciBmdW5jdGlvbiB0aGF0IGlzIHVzZWQgZm9yIHNvbWUga2luZFxuICAgICAqIG9mIGluaXRpYWxpemF0aW9uKTtcbiAgICAgKiAtIGRlcGxveSB3aXRob3V0IGluaXRpYWwgZnVuY3Rpb24gY2FsbDtcbiAgICAgKiAtIHNpZ25lZC91bnNpZ25lZCArIGRhdGEgZm9yIHNpZ25pbmcuXG4gICAgICpcbiAgICAgKiBgU2lnbmVyYCBkZWZpbmVzIGhvdyB0aGUgbWVzc2FnZSBzaG91bGQgb3Igc2hvdWxkbid0IGJlIHNpZ25lZDpcbiAgICAgKlxuICAgICAqIGBTaWduZXI6Ok5vbmVgIGNyZWF0ZXMgYW4gdW5zaWduZWQgbWVzc2FnZS4gVGhpcyBtYXkgYmUgbmVlZGVkIGluIGNhc2Ugb2Ygc29tZSBwdWJsaWMgbWV0aG9kcyxcbiAgICAgKiB0aGF0IGRvIG5vdCByZXF1aXJlIGF1dGhvcml6YXRpb24gYnkgcHVia2V5LlxuICAgICAqXG4gICAgICogYFNpZ25lcjo6RXh0ZXJuYWxgIHRha2VzIHB1YmxpYyBrZXkgYW5kIHJldHVybnMgYGRhdGFfdG9fc2lnbmAgZm9yIGxhdGVyIHNpZ25pbmcuXG4gICAgICogVXNlIGBhdHRhY2hfc2lnbmF0dXJlYCBtZXRob2Qgd2l0aCB0aGUgcmVzdWx0IHNpZ25hdHVyZSB0byBnZXQgdGhlIHNpZ25lZCBtZXNzYWdlLlxuICAgICAqXG4gICAgICogYFNpZ25lcjo6S2V5c2AgY3JlYXRlcyBhIHNpZ25lZCBtZXNzYWdlIHdpdGggcHJvdmlkZWQga2V5IHBhaXIuXG4gICAgICpcbiAgICAgKiBbU09PTl0gYFNpZ25lcjo6U2lnbmluZ0JveGAgQWxsb3dzIHVzaW5nIGEgc3BlY2lhbCBpbnRlcmZhY2UgdG8gaW1wbGVtZW50IHNpZ25pbmdcbiAgICAgKiB3aXRob3V0IHByaXZhdGUga2V5IGRpc2Nsb3N1cmUgdG8gU0RLLiBGb3IgaW5zdGFuY2UsIGluIGNhc2Ugb2YgdXNpbmcgYSBjb2xkIHdhbGxldCBvciBIU00sXG4gICAgICogd2hlbiBhcHBsaWNhdGlvbiBjYWxscyBzb21lIEFQSSB0byBzaWduIGRhdGEuXG4gICAgICpcbiAgICAgKiBUaGVyZSBpcyBhbiBvcHRpb25hbCBwdWJsaWMga2V5IGNhbiBiZSBwcm92aWRlZCBpbiBkZXBsb3kgc2V0IGluIG9yZGVyIHRvIHN1YnN0aXR1dGUgb25lXG4gICAgICogaW4gVFZNIGZpbGUuXG4gICAgICpcbiAgICAgKiBQdWJsaWMga2V5IHJlc29sdmluZyBwcmlvcml0eTpcbiAgICAgKiAxLiBQdWJsaWMga2V5IGZyb20gZGVwbG95IHNldC5cbiAgICAgKiAyLiBQdWJsaWMga2V5LCBzcGVjaWZpZWQgaW4gVFZNIGZpbGUuXG4gICAgICogMy4gUHVibGljIGtleSwgcHJvdmlkZWQgYnkgc2lnbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY29kZU1lc3NhZ2V9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRW5jb2RlTWVzc2FnZVxuICAgICAqL1xuICAgIGVuY29kZV9tZXNzYWdlKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmVuY29kZV9tZXNzYWdlJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlcyBhbiBpbnRlcm5hbCBBQkktY29tcGF0aWJsZSBtZXNzYWdlXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIEFsbG93cyB0byBlbmNvZGUgZGVwbG95IGFuZCBmdW5jdGlvbiBjYWxsIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogVXNlIGNhc2VzIGluY2x1ZGUgbWVzc2FnZXMgb2YgYW55IHBvc3NpYmxlIHR5cGU6XG4gICAgICogLSBkZXBsb3kgd2l0aCBpbml0aWFsIGZ1bmN0aW9uIGNhbGwgKGkuZS4gYGNvbnN0cnVjdG9yYCBvciBhbnkgb3RoZXIgZnVuY3Rpb24gdGhhdCBpcyB1c2VkIGZvciBzb21lIGtpbmRcbiAgICAgKiBvZiBpbml0aWFsaXphdGlvbik7XG4gICAgICogLSBkZXBsb3kgd2l0aG91dCBpbml0aWFsIGZ1bmN0aW9uIGNhbGw7XG4gICAgICogLSBzaW1wbGUgZnVuY3Rpb24gY2FsbFxuICAgICAqXG4gICAgICogVGhlcmUgaXMgYW4gb3B0aW9uYWwgcHVibGljIGtleSBjYW4gYmUgcHJvdmlkZWQgaW4gZGVwbG95IHNldCBpbiBvcmRlciB0byBzdWJzdGl0dXRlIG9uZVxuICAgICAqIGluIFRWTSBmaWxlLlxuICAgICAqXG4gICAgICogUHVibGljIGtleSByZXNvbHZpbmcgcHJpb3JpdHk6XG4gICAgICogMS4gUHVibGljIGtleSBmcm9tIGRlcGxveSBzZXQuXG4gICAgICogMi4gUHVibGljIGtleSwgc3BlY2lmaWVkIGluIFRWTSBmaWxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY29kZUludGVybmFsTWVzc2FnZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZFbmNvZGVJbnRlcm5hbE1lc3NhZ2VcbiAgICAgKi9cbiAgICBlbmNvZGVfaW50ZXJuYWxfbWVzc2FnZShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2FiaS5lbmNvZGVfaW50ZXJuYWxfbWVzc2FnZScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbWJpbmVzIGBoZXhgLWVuY29kZWQgYHNpZ25hdHVyZWAgd2l0aCBgYmFzZTY0YC1lbmNvZGVkIGB1bnNpZ25lZF9tZXNzYWdlYC4gUmV0dXJucyBzaWduZWQgbWVzc2FnZSBlbmNvZGVkIGluIGBiYXNlNjRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkF0dGFjaFNpZ25hdHVyZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZBdHRhY2hTaWduYXR1cmVcbiAgICAgKi9cbiAgICBhdHRhY2hfc2lnbmF0dXJlKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmF0dGFjaF9zaWduYXR1cmUnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIG1lc3NhZ2UgYm9keSB1c2luZyBwcm92aWRlZCBtZXNzYWdlIEJPQyBhbmQgQUJJLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkRlY29kZU1lc3NhZ2V9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIERlY29kZWRNZXNzYWdlQm9keVxuICAgICAqL1xuICAgIGRlY29kZV9tZXNzYWdlKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmRlY29kZV9tZXNzYWdlJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBtZXNzYWdlIGJvZHkgdXNpbmcgcHJvdmlkZWQgYm9keSBCT0MgYW5kIEFCSS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZEZWNvZGVNZXNzYWdlQm9keX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgRGVjb2RlZE1lc3NhZ2VCb2R5XG4gICAgICovXG4gICAgZGVjb2RlX21lc3NhZ2VfYm9keShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2FiaS5kZWNvZGVfbWVzc2FnZV9ib2R5JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhY2NvdW50IHN0YXRlIEJPQ1xuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBDcmVhdGVzIGFjY291bnQgc3RhdGUgcHJvdmlkZWQgd2l0aCBvbmUgb2YgdGhlc2Ugc2V0cyBvZiBkYXRhIDpcbiAgICAgKiAxLiBCT0Mgb2YgY29kZSwgQk9DIG9mIGRhdGEsIEJPQyBvZiBsaWJyYXJ5XG4gICAgICogMi4gVFZDIChzdHJpbmcgaW4gYGJhc2U2NGApLCBrZXlzLCBpbml0IHBhcmFtc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY29kZUFjY291bnR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRW5jb2RlQWNjb3VudFxuICAgICAqL1xuICAgIGVuY29kZV9hY2NvdW50KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmVuY29kZV9hY2NvdW50JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhY2NvdW50IGRhdGEgdXNpbmcgcHJvdmlkZWQgZGF0YSBCT0MgYW5kIEFCSS5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogTm90ZTogdGhpcyBmZWF0dXJlIHJlcXVpcmVzIEFCSSAyLjEgb3IgaGlnaGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkRlY29kZUFjY291bnREYXRhfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkRlY29kZUFjY291bnREYXRhXG4gICAgICovXG4gICAgZGVjb2RlX2FjY291bnRfZGF0YShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2FiaS5kZWNvZGVfYWNjb3VudF9kYXRhJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVXBkYXRlcyBpbml0aWFsIGFjY291bnQgZGF0YSB3aXRoIGluaXRpYWwgdmFsdWVzIGZvciB0aGUgY29udHJhY3QncyBzdGF0aWMgdmFyaWFibGVzIGFuZCBvd25lcidzIHB1YmxpYyBrZXkuIFRoaXMgb3BlcmF0aW9uIGlzIGFwcGxpY2FibGUgb25seSBmb3IgaW5pdGlhbCBhY2NvdW50IGRhdGEgKGJlZm9yZSBkZXBsb3kpLiBJZiB0aGUgY29udHJhY3QgaXMgYWxyZWFkeSBkZXBsb3llZCwgaXRzIGRhdGEgZG9lc24ndCBjb250YWluIHRoaXMgZGF0YSBzZWN0aW9uIGFueSBtb3JlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlVwZGF0ZUluaXRpYWxEYXRhfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlVwZGF0ZUluaXRpYWxEYXRhXG4gICAgICovXG4gICAgdXBkYXRlX2luaXRpYWxfZGF0YShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2FiaS51cGRhdGVfaW5pdGlhbF9kYXRhJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlcyBpbml0aWFsIGFjY291bnQgZGF0YSB3aXRoIGluaXRpYWwgdmFsdWVzIGZvciB0aGUgY29udHJhY3QncyBzdGF0aWMgdmFyaWFibGVzIGFuZCBvd25lcidzIHB1YmxpYyBrZXkgaW50byBhIGRhdGEgQk9DIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgZW5jb2RlX3R2Y2AgZnVuY3Rpb24gYWZ0ZXJ3YXJkcy5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBmdW5jdGlvbiBpcyBhbmFsb2d1ZSBvZiBgdHZtLmJ1aWxkRGF0YUluaXRgIGZ1bmN0aW9uIGluIFNvbGlkaXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY29kZUluaXRpYWxEYXRhfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkVuY29kZUluaXRpYWxEYXRhXG4gICAgICovXG4gICAgZW5jb2RlX2luaXRpYWxfZGF0YShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2FiaS5lbmNvZGVfaW5pdGlhbF9kYXRhJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBpbml0aWFsIHZhbHVlcyBvZiBhIGNvbnRyYWN0J3Mgc3RhdGljIHZhcmlhYmxlcyBhbmQgb3duZXIncyBwdWJsaWMga2V5IGZyb20gYWNjb3VudCBpbml0aWFsIGRhdGEgVGhpcyBvcGVyYXRpb24gaXMgYXBwbGljYWJsZSBvbmx5IGZvciBpbml0aWFsIGFjY291bnQgZGF0YSAoYmVmb3JlIGRlcGxveSkuIElmIHRoZSBjb250cmFjdCBpcyBhbHJlYWR5IGRlcGxveWVkLCBpdHMgZGF0YSBkb2Vzbid0IGNvbnRhaW4gdGhpcyBkYXRhIHNlY3Rpb24gYW55IG1vcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mRGVjb2RlSW5pdGlhbERhdGF9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRGVjb2RlSW5pdGlhbERhdGFcbiAgICAgKi9cbiAgICBkZWNvZGVfaW5pdGlhbF9kYXRhKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmRlY29kZV9pbml0aWFsX2RhdGEnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIEJPQyBpbnRvIEpTT04gYXMgYSBzZXQgb2YgcHJvdmlkZWQgcGFyYW1ldGVycy5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogU29saWRpdHkgZnVuY3Rpb25zIHVzZSBBQkkgdHlwZXMgZm9yIFtidWlsZGVyIGVuY29kaW5nXShodHRwczovL2dpdGh1Yi5jb20vdG9ubGFicy9UT04tU29saWRpdHktQ29tcGlsZXIvYmxvYi9tYXN0ZXIvQVBJLm1kI3R2bWJ1aWxkZXJzdG9yZSkuXG4gICAgICogVGhlIHNpbXBsZXN0IHdheSB0byBkZWNvZGUgc3VjaCBhIEJPQyBpcyB0byB1c2UgQUJJIGRlY29kaW5nLlxuICAgICAqIEFCSSBoYXMgaXQgb3duIHJ1bGVzIGZvciBmaWVsZHMgbGF5b3V0IGluIGNlbGxzIHNvIG1hbnVhbGx5IGVuY29kZWRcbiAgICAgKiBCT0MgY2FuIG5vdCBiZSBkZXNjcmliZWQgaW4gdGVybXMgb2YgQUJJIHJ1bGVzLlxuICAgICAqXG4gICAgICogVG8gc29sdmUgdGhpcyBwcm9ibGVtIHdlIGludHJvZHVjZSBhIG5ldyBBQkkgdHlwZSBgUmVmKDxQYXJhbVR5cGU+KWBcbiAgICAgKiB3aGljaCBhbGxvd3MgdG8gc3RvcmUgYFBhcmFtVHlwZWAgQUJJIHBhcmFtZXRlciBpbiBjZWxsIHJlZmVyZW5jZSBhbmQsIHRodXMsXG4gICAgICogZGVjb2RlIG1hbnVhbGx5IGVuY29kZWQgQk9Dcy4gVGhpcyB0eXBlIGlzIGF2YWlsYWJsZSBvbmx5IGluIGBkZWNvZGVfYm9jYCBmdW5jdGlvblxuICAgICAqIGFuZCB3aWxsIG5vdCBiZSBhdmFpbGFibGUgaW4gQUJJIG1lc3NhZ2VzIGVuY29kaW5nIHVudGlsIGl0IGlzIGluY2x1ZGVkIGludG8gc29tZSBBQkkgcmV2aXNpb24uXG4gICAgICpcbiAgICAgKiBTdWNoIEJPQyBkZXNjcmlwdGlvbnMgY292ZXJzIG1vc3QgdXNlcnMgbmVlZHMuIElmIHNvbWVvbmUgd2FudHMgdG8gZGVjb2RlIHNvbWUgQk9DIHdoaWNoXG4gICAgICogY2FuIG5vdCBiZSBkZXNjcmliZWQgYnkgdGhlc2UgcnVsZXMgKGkuZS4gQk9DIHdpdGggVExCIGNvbnRhaW5pbmcgY29uc3RydWN0b3JzIG9mIGZsYWdzXG4gICAgICogZGVmaW5pbmcgc29tZSBwYXJzaW5nIGNvbmRpdGlvbnMpIHRoZW4gdGhleSBjYW4gZGVjb2RlIHRoZSBmaWVsZHMgdXAgdG8gZm9yayBjb25kaXRpb24sXG4gICAgICogY2hlY2sgdGhlIHBhcnNlZCBkYXRhIG1hbnVhbGx5LCBleHBhbmQgdGhlIHBhcnNpbmcgc2NoZW1hIGFuZCB0aGVuIGRlY29kZSB0aGUgd2hvbGUgQk9DXG4gICAgICogd2l0aCB0aGUgZnVsbCBzY2hlbWEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mRGVjb2RlQm9jfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkRlY29kZUJvY1xuICAgICAqL1xuICAgIGRlY29kZV9ib2MocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdhYmkuZGVjb2RlX2JvYycsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZXMgZ2l2ZW4gcGFyYW1ldGVycyBpbiBKU09OIGludG8gYSBCT0MgdXNpbmcgcGFyYW0gdHlwZXMgZnJvbSBBQkkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQWJpRW5jb2RlQm9jfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkFiaUVuY29kZUJvY1xuICAgICAqL1xuICAgIGVuY29kZV9ib2MocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdhYmkuZW5jb2RlX2JvYycsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZXMgY29udHJhY3QgZnVuY3Rpb24gSUQgYnkgY29udHJhY3QgQUJJXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQ2FsY0Z1bmN0aW9uSWR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mQ2FsY0Z1bmN0aW9uSWRcbiAgICAgKi9cbiAgICBjYWxjX2Z1bmN0aW9uX2lkKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYWJpLmNhbGNfZnVuY3Rpb25faWQnLCBwYXJhbXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuQWJpTW9kdWxlID0gQWJpTW9kdWxlO1xuZnVuY3Rpb24gYm9jQ2FjaGVUeXBlUGlubmVkKHBpbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdQaW5uZWQnLFxuICAgICAgICBwaW4sXG4gICAgfTtcbn1cbmV4cG9ydHMuYm9jQ2FjaGVUeXBlUGlubmVkID0gYm9jQ2FjaGVUeXBlUGlubmVkO1xuZnVuY3Rpb24gYm9jQ2FjaGVUeXBlVW5waW5uZWQoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1VucGlubmVkJyxcbiAgICB9O1xufVxuZXhwb3J0cy5ib2NDYWNoZVR5cGVVbnBpbm5lZCA9IGJvY0NhY2hlVHlwZVVucGlubmVkO1xudmFyIEJvY0Vycm9yQ29kZTtcbihmdW5jdGlvbiAoQm9jRXJyb3JDb2RlKSB7XG4gICAgQm9jRXJyb3JDb2RlW0JvY0Vycm9yQ29kZVtcIkludmFsaWRCb2NcIl0gPSAyMDFdID0gXCJJbnZhbGlkQm9jXCI7XG4gICAgQm9jRXJyb3JDb2RlW0JvY0Vycm9yQ29kZVtcIlNlcmlhbGl6YXRpb25FcnJvclwiXSA9IDIwMl0gPSBcIlNlcmlhbGl6YXRpb25FcnJvclwiO1xuICAgIEJvY0Vycm9yQ29kZVtCb2NFcnJvckNvZGVbXCJJbmFwcHJvcHJpYXRlQmxvY2tcIl0gPSAyMDNdID0gXCJJbmFwcHJvcHJpYXRlQmxvY2tcIjtcbiAgICBCb2NFcnJvckNvZGVbQm9jRXJyb3JDb2RlW1wiTWlzc2luZ1NvdXJjZUJvY1wiXSA9IDIwNF0gPSBcIk1pc3NpbmdTb3VyY2VCb2NcIjtcbiAgICBCb2NFcnJvckNvZGVbQm9jRXJyb3JDb2RlW1wiSW5zdWZmaWNpZW50Q2FjaGVTaXplXCJdID0gMjA1XSA9IFwiSW5zdWZmaWNpZW50Q2FjaGVTaXplXCI7XG4gICAgQm9jRXJyb3JDb2RlW0JvY0Vycm9yQ29kZVtcIkJvY1JlZk5vdEZvdW5kXCJdID0gMjA2XSA9IFwiQm9jUmVmTm90Rm91bmRcIjtcbiAgICBCb2NFcnJvckNvZGVbQm9jRXJyb3JDb2RlW1wiSW52YWxpZEJvY1JlZlwiXSA9IDIwN10gPSBcIkludmFsaWRCb2NSZWZcIjtcbn0pKEJvY0Vycm9yQ29kZSA9IGV4cG9ydHMuQm9jRXJyb3JDb2RlIHx8IChleHBvcnRzLkJvY0Vycm9yQ29kZSA9IHt9KSk7XG5mdW5jdGlvbiBidWlsZGVyT3BJbnRlZ2VyKHNpemUsIHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0ludGVnZXInLFxuICAgICAgICBzaXplLFxuICAgICAgICB2YWx1ZSxcbiAgICB9O1xufVxuZXhwb3J0cy5idWlsZGVyT3BJbnRlZ2VyID0gYnVpbGRlck9wSW50ZWdlcjtcbmZ1bmN0aW9uIGJ1aWxkZXJPcEJpdFN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdCaXRTdHJpbmcnLFxuICAgICAgICB2YWx1ZSxcbiAgICB9O1xufVxuZXhwb3J0cy5idWlsZGVyT3BCaXRTdHJpbmcgPSBidWlsZGVyT3BCaXRTdHJpbmc7XG5mdW5jdGlvbiBidWlsZGVyT3BDZWxsKGJ1aWxkZXIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnQ2VsbCcsXG4gICAgICAgIGJ1aWxkZXIsXG4gICAgfTtcbn1cbmV4cG9ydHMuYnVpbGRlck9wQ2VsbCA9IGJ1aWxkZXJPcENlbGw7XG5mdW5jdGlvbiBidWlsZGVyT3BDZWxsQm9jKGJvYykge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdDZWxsQm9jJyxcbiAgICAgICAgYm9jLFxuICAgIH07XG59XG5leHBvcnRzLmJ1aWxkZXJPcENlbGxCb2MgPSBidWlsZGVyT3BDZWxsQm9jO1xuZnVuY3Rpb24gYnVpbGRlck9wQWRkcmVzcyhhZGRyZXNzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0FkZHJlc3MnLFxuICAgICAgICBhZGRyZXNzLFxuICAgIH07XG59XG5leHBvcnRzLmJ1aWxkZXJPcEFkZHJlc3MgPSBidWlsZGVyT3BBZGRyZXNzO1xuLyoqXG4gKiBCT0MgbWFuaXB1bGF0aW9uIG1vZHVsZS5cbiAqL1xuY2xhc3MgQm9jTW9kdWxlIHtcbiAgICBjb25zdHJ1Y3RvcihjbGllbnQpIHtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBjbGllbnQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhcnNlcyBtZXNzYWdlIGJvYyBpbnRvIGEgSlNPTlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBKU09OIHN0cnVjdHVyZSBpcyBjb21wYXRpYmxlIHdpdGggR3JhcGhRTCBBUEkgbWVzc2FnZSBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZQYXJzZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZQYXJzZVxuICAgICAqL1xuICAgIHBhcnNlX21lc3NhZ2UocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MucGFyc2VfbWVzc2FnZScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhcnNlcyB0cmFuc2FjdGlvbiBib2MgaW50byBhIEpTT05cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogSlNPTiBzdHJ1Y3R1cmUgaXMgY29tcGF0aWJsZSB3aXRoIEdyYXBoUUwgQVBJIHRyYW5zYWN0aW9uIG9iamVjdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlBhcnNlfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlBhcnNlXG4gICAgICovXG4gICAgcGFyc2VfdHJhbnNhY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MucGFyc2VfdHJhbnNhY3Rpb24nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXJzZXMgYWNjb3VudCBib2MgaW50byBhIEpTT05cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogSlNPTiBzdHJ1Y3R1cmUgaXMgY29tcGF0aWJsZSB3aXRoIEdyYXBoUUwgQVBJIGFjY291bnQgb2JqZWN0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mUGFyc2V9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mUGFyc2VcbiAgICAgKi9cbiAgICBwYXJzZV9hY2NvdW50KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYm9jLnBhcnNlX2FjY291bnQnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXJzZXMgYmxvY2sgYm9jIGludG8gYSBKU09OXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIEpTT04gc3RydWN0dXJlIGlzIGNvbXBhdGlibGUgd2l0aCBHcmFwaFFMIEFQSSBibG9jayBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZQYXJzZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZQYXJzZVxuICAgICAqL1xuICAgIHBhcnNlX2Jsb2NrKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYm9jLnBhcnNlX2Jsb2NrJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGFyc2VzIHNoYXJkc3RhdGUgYm9jIGludG8gYSBKU09OXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIEpTT04gc3RydWN0dXJlIGlzIGNvbXBhdGlibGUgd2l0aCBHcmFwaFFMIEFQSSBzaGFyZHN0YXRlIG9iamVjdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlBhcnNlU2hhcmRzdGF0ZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZQYXJzZVxuICAgICAqL1xuICAgIHBhcnNlX3NoYXJkc3RhdGUocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MucGFyc2Vfc2hhcmRzdGF0ZScsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgYmxvY2tjaGFpbiBjb25maWd1cmF0aW9uIGZyb20ga2V5IGJsb2NrIGFuZCBhbHNvIGZyb20gemVyb3N0YXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkdldEJsb2NrY2hhaW5Db25maWd9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mR2V0QmxvY2tjaGFpbkNvbmZpZ1xuICAgICAqL1xuICAgIGdldF9ibG9ja2NoYWluX2NvbmZpZyhwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2JvYy5nZXRfYmxvY2tjaGFpbl9jb25maWcnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIEJPQyByb290IGhhc2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZHZXRCb2NIYXNofSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkdldEJvY0hhc2hcbiAgICAgKi9cbiAgICBnZXRfYm9jX2hhc2gocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MuZ2V0X2JvY19oYXNoJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlcyBCT0MgZGVwdGhcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZHZXRCb2NEZXB0aH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZHZXRCb2NEZXB0aFxuICAgICAqL1xuICAgIGdldF9ib2NfZGVwdGgocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MuZ2V0X2JvY19kZXB0aCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4dHJhY3RzIGNvZGUgZnJvbSBUVkMgY29udHJhY3QgaW1hZ2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZHZXRDb2RlRnJvbVR2Y30gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZHZXRDb2RlRnJvbVR2Y1xuICAgICAqL1xuICAgIGdldF9jb2RlX2Zyb21fdHZjKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYm9jLmdldF9jb2RlX2Zyb21fdHZjJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IEJPQyBmcm9tIGNhY2hlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQm9jQ2FjaGVHZXR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mQm9jQ2FjaGVHZXRcbiAgICAgKi9cbiAgICBjYWNoZV9nZXQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MuY2FjaGVfZ2V0JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2F2ZSBCT0MgaW50byBjYWNoZSBvciBpbmNyZWFzZSBwaW4gY291bnRlciBmb3IgZXhpc3RpbmcgcGlubmVkIEJPQ1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkJvY0NhY2hlU2V0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkJvY0NhY2hlU2V0XG4gICAgICovXG4gICAgY2FjaGVfc2V0KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnYm9jLmNhY2hlX3NldCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFVucGluIEJPQ3Mgd2l0aCBzcGVjaWZpZWQgcGluIGRlZmluZWQgaW4gdGhlIGBjYWNoZV9zZXRgLiBEZWNyZWFzZSBwaW4gcmVmZXJlbmNlIGNvdW50ZXIgZm9yIEJPQ3Mgd2l0aCBzcGVjaWZpZWQgcGluIGRlZmluZWQgaW4gdGhlIGBjYWNoZV9zZXRgLiBCT0NzIHdoaWNoIGhhdmUgb25seSAxIHBpbiBhbmQgaXRzIHJlZmVyZW5jZSBjb3VudGVyIGJlY29tZSAwIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIGNhY2hlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQm9jQ2FjaGVVbnBpbn0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBjYWNoZV91bnBpbihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2JvYy5jYWNoZV91bnBpbicsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZXMgYmFnIG9mIGNlbGxzIChCT0MpIHdpdGggYnVpbGRlciBvcGVyYXRpb25zLiBUaGlzIG1ldGhvZCBwcm92aWRlcyB0aGUgc2FtZSBmdW5jdGlvbmFsaXR5IGFzIFNvbGlkaXR5IFR2bUJ1aWxkZXIuIFJlc3VsdGluZyBCT0Mgb2YgdGhpcyBtZXRob2QgY2FuIGJlIHBhc3NlZCBpbnRvIFNvbGlkaXR5IGFuZCBDKysgY29udHJhY3RzIGFzIFR2bUNlbGwgdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZFbmNvZGVCb2N9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRW5jb2RlQm9jXG4gICAgICovXG4gICAgZW5jb2RlX2JvYyhwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2JvYy5lbmNvZGVfYm9jJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY29udHJhY3QgY29kZSdzIHNhbHQgaWYgaXQgaXMgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZHZXRDb2RlU2FsdH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZHZXRDb2RlU2FsdFxuICAgICAqL1xuICAgIGdldF9jb2RlX3NhbHQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MuZ2V0X2NvZGVfc2FsdCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgbmV3IHNhbHQgdG8gY29udHJhY3QgY29kZS5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUmV0dXJucyB0aGUgbmV3IGNvbnRyYWN0IGNvZGUgd2l0aCBzYWx0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlNldENvZGVTYWx0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlNldENvZGVTYWx0XG4gICAgICovXG4gICAgc2V0X2NvZGVfc2FsdChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2JvYy5zZXRfY29kZV9zYWx0JywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyB0dmMgaW50byBjb2RlLCBkYXRhLCBsaWJyYXJpZXMgYW5kIHNwZWNpYWwgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZEZWNvZGVUdmN9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRGVjb2RlVHZjXG4gICAgICovXG4gICAgZGVjb2RlX3R2YyhwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2JvYy5kZWNvZGVfdHZjJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlcyB0dmMgZnJvbSBjb2RlLCBkYXRhLCBsaWJyYXJpZXMgYW5zIHNwZWNpYWwgb3B0aW9ucyAoc2VlIGlucHV0IHBhcmFtcylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZFbmNvZGVUdmN9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRW5jb2RlVHZjXG4gICAgICovXG4gICAgZW5jb2RlX3R2YyhwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2JvYy5lbmNvZGVfdHZjJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlcyBhIG1lc3NhZ2VcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQWxsb3dzIHRvIGVuY29kZSBhbnkgZXh0ZXJuYWwgaW5ib3VuZCBtZXNzYWdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkVuY29kZUV4dGVybmFsSW5NZXNzYWdlfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkVuY29kZUV4dGVybmFsSW5NZXNzYWdlXG4gICAgICovXG4gICAgZW5jb2RlX2V4dGVybmFsX2luX21lc3NhZ2UocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MuZW5jb2RlX2V4dGVybmFsX2luX21lc3NhZ2UnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjb21waWxlciB2ZXJzaW9uIHVzZWQgdG8gY29tcGlsZSB0aGUgY29kZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZHZXRDb21waWxlclZlcnNpb259IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mR2V0Q29tcGlsZXJWZXJzaW9uXG4gICAgICovXG4gICAgZ2V0X2NvbXBpbGVyX3ZlcnNpb24ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdib2MuZ2V0X2NvbXBpbGVyX3ZlcnNpb24nLCBwYXJhbXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuQm9jTW9kdWxlID0gQm9jTW9kdWxlO1xuLy8gcHJvY2Vzc2luZyBtb2R1bGVcbnZhciBQcm9jZXNzaW5nRXJyb3JDb2RlO1xuKGZ1bmN0aW9uIChQcm9jZXNzaW5nRXJyb3JDb2RlKSB7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiTWVzc2FnZUFscmVhZHlFeHBpcmVkXCJdID0gNTAxXSA9IFwiTWVzc2FnZUFscmVhZHlFeHBpcmVkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiTWVzc2FnZUhhc05vdERlc3RpbmF0aW9uQWRkcmVzc1wiXSA9IDUwMl0gPSBcIk1lc3NhZ2VIYXNOb3REZXN0aW5hdGlvbkFkZHJlc3NcIjtcbiAgICBQcm9jZXNzaW5nRXJyb3JDb2RlW1Byb2Nlc3NpbmdFcnJvckNvZGVbXCJDYW5Ob3RCdWlsZE1lc3NhZ2VDZWxsXCJdID0gNTAzXSA9IFwiQ2FuTm90QnVpbGRNZXNzYWdlQ2VsbFwiO1xuICAgIFByb2Nlc3NpbmdFcnJvckNvZGVbUHJvY2Vzc2luZ0Vycm9yQ29kZVtcIkZldGNoQmxvY2tGYWlsZWRcIl0gPSA1MDRdID0gXCJGZXRjaEJsb2NrRmFpbGVkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiU2VuZE1lc3NhZ2VGYWlsZWRcIl0gPSA1MDVdID0gXCJTZW5kTWVzc2FnZUZhaWxlZFwiO1xuICAgIFByb2Nlc3NpbmdFcnJvckNvZGVbUHJvY2Vzc2luZ0Vycm9yQ29kZVtcIkludmFsaWRNZXNzYWdlQm9jXCJdID0gNTA2XSA9IFwiSW52YWxpZE1lc3NhZ2VCb2NcIjtcbiAgICBQcm9jZXNzaW5nRXJyb3JDb2RlW1Byb2Nlc3NpbmdFcnJvckNvZGVbXCJNZXNzYWdlRXhwaXJlZFwiXSA9IDUwN10gPSBcIk1lc3NhZ2VFeHBpcmVkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiVHJhbnNhY3Rpb25XYWl0VGltZW91dFwiXSA9IDUwOF0gPSBcIlRyYW5zYWN0aW9uV2FpdFRpbWVvdXRcIjtcbiAgICBQcm9jZXNzaW5nRXJyb3JDb2RlW1Byb2Nlc3NpbmdFcnJvckNvZGVbXCJJbnZhbGlkQmxvY2tSZWNlaXZlZFwiXSA9IDUwOV0gPSBcIkludmFsaWRCbG9ja1JlY2VpdmVkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiQ2FuTm90Q2hlY2tCbG9ja1NoYXJkXCJdID0gNTEwXSA9IFwiQ2FuTm90Q2hlY2tCbG9ja1NoYXJkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiQmxvY2tOb3RGb3VuZFwiXSA9IDUxMV0gPSBcIkJsb2NrTm90Rm91bmRcIjtcbiAgICBQcm9jZXNzaW5nRXJyb3JDb2RlW1Byb2Nlc3NpbmdFcnJvckNvZGVbXCJJbnZhbGlkRGF0YVwiXSA9IDUxMl0gPSBcIkludmFsaWREYXRhXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiRXh0ZXJuYWxTaWduZXJNdXN0Tm90QmVVc2VkXCJdID0gNTEzXSA9IFwiRXh0ZXJuYWxTaWduZXJNdXN0Tm90QmVVc2VkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiTWVzc2FnZVJlamVjdGVkXCJdID0gNTE0XSA9IFwiTWVzc2FnZVJlamVjdGVkXCI7XG4gICAgUHJvY2Vzc2luZ0Vycm9yQ29kZVtQcm9jZXNzaW5nRXJyb3JDb2RlW1wiSW52YWxpZFJlbXBTdGF0dXNcIl0gPSA1MTVdID0gXCJJbnZhbGlkUmVtcFN0YXR1c1wiO1xuICAgIFByb2Nlc3NpbmdFcnJvckNvZGVbUHJvY2Vzc2luZ0Vycm9yQ29kZVtcIk5leHRSZW1wU3RhdHVzVGltZW91dFwiXSA9IDUxNl0gPSBcIk5leHRSZW1wU3RhdHVzVGltZW91dFwiO1xufSkoUHJvY2Vzc2luZ0Vycm9yQ29kZSA9IGV4cG9ydHMuUHJvY2Vzc2luZ0Vycm9yQ29kZSB8fCAoZXhwb3J0cy5Qcm9jZXNzaW5nRXJyb3JDb2RlID0ge30pKTtcbmZ1bmN0aW9uIHByb2Nlc3NpbmdFdmVudFdpbGxGZXRjaEZpcnN0QmxvY2soKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1dpbGxGZXRjaEZpcnN0QmxvY2snLFxuICAgIH07XG59XG5leHBvcnRzLnByb2Nlc3NpbmdFdmVudFdpbGxGZXRjaEZpcnN0QmxvY2sgPSBwcm9jZXNzaW5nRXZlbnRXaWxsRmV0Y2hGaXJzdEJsb2NrO1xuZnVuY3Rpb24gcHJvY2Vzc2luZ0V2ZW50RmV0Y2hGaXJzdEJsb2NrRmFpbGVkKGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0ZldGNoRmlyc3RCbG9ja0ZhaWxlZCcsXG4gICAgICAgIGVycm9yLFxuICAgIH07XG59XG5leHBvcnRzLnByb2Nlc3NpbmdFdmVudEZldGNoRmlyc3RCbG9ja0ZhaWxlZCA9IHByb2Nlc3NpbmdFdmVudEZldGNoRmlyc3RCbG9ja0ZhaWxlZDtcbmZ1bmN0aW9uIHByb2Nlc3NpbmdFdmVudFdpbGxTZW5kKHNoYXJkX2Jsb2NrX2lkLCBtZXNzYWdlX2lkLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1dpbGxTZW5kJyxcbiAgICAgICAgc2hhcmRfYmxvY2tfaWQsXG4gICAgICAgIG1lc3NhZ2VfaWQsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgfTtcbn1cbmV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50V2lsbFNlbmQgPSBwcm9jZXNzaW5nRXZlbnRXaWxsU2VuZDtcbmZ1bmN0aW9uIHByb2Nlc3NpbmdFdmVudERpZFNlbmQoc2hhcmRfYmxvY2tfaWQsIG1lc3NhZ2VfaWQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRGlkU2VuZCcsXG4gICAgICAgIHNoYXJkX2Jsb2NrX2lkLFxuICAgICAgICBtZXNzYWdlX2lkLFxuICAgICAgICBtZXNzYWdlLFxuICAgIH07XG59XG5leHBvcnRzLnByb2Nlc3NpbmdFdmVudERpZFNlbmQgPSBwcm9jZXNzaW5nRXZlbnREaWRTZW5kO1xuZnVuY3Rpb24gcHJvY2Vzc2luZ0V2ZW50U2VuZEZhaWxlZChzaGFyZF9ibG9ja19pZCwgbWVzc2FnZV9pZCwgbWVzc2FnZSwgZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnU2VuZEZhaWxlZCcsXG4gICAgICAgIHNoYXJkX2Jsb2NrX2lkLFxuICAgICAgICBtZXNzYWdlX2lkLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBlcnJvcixcbiAgICB9O1xufVxuZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRTZW5kRmFpbGVkID0gcHJvY2Vzc2luZ0V2ZW50U2VuZEZhaWxlZDtcbmZ1bmN0aW9uIHByb2Nlc3NpbmdFdmVudFdpbGxGZXRjaE5leHRCbG9jayhzaGFyZF9ibG9ja19pZCwgbWVzc2FnZV9pZCwgbWVzc2FnZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdXaWxsRmV0Y2hOZXh0QmxvY2snLFxuICAgICAgICBzaGFyZF9ibG9ja19pZCxcbiAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgbWVzc2FnZSxcbiAgICB9O1xufVxuZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRXaWxsRmV0Y2hOZXh0QmxvY2sgPSBwcm9jZXNzaW5nRXZlbnRXaWxsRmV0Y2hOZXh0QmxvY2s7XG5mdW5jdGlvbiBwcm9jZXNzaW5nRXZlbnRGZXRjaE5leHRCbG9ja0ZhaWxlZChzaGFyZF9ibG9ja19pZCwgbWVzc2FnZV9pZCwgbWVzc2FnZSwgZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRmV0Y2hOZXh0QmxvY2tGYWlsZWQnLFxuICAgICAgICBzaGFyZF9ibG9ja19pZCxcbiAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgZXJyb3IsXG4gICAgfTtcbn1cbmV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50RmV0Y2hOZXh0QmxvY2tGYWlsZWQgPSBwcm9jZXNzaW5nRXZlbnRGZXRjaE5leHRCbG9ja0ZhaWxlZDtcbmZ1bmN0aW9uIHByb2Nlc3NpbmdFdmVudE1lc3NhZ2VFeHBpcmVkKG1lc3NhZ2VfaWQsIG1lc3NhZ2UsIGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ01lc3NhZ2VFeHBpcmVkJyxcbiAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgZXJyb3IsXG4gICAgfTtcbn1cbmV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50TWVzc2FnZUV4cGlyZWQgPSBwcm9jZXNzaW5nRXZlbnRNZXNzYWdlRXhwaXJlZDtcbmZ1bmN0aW9uIHByb2Nlc3NpbmdFdmVudFJlbXBTZW50VG9WYWxpZGF0b3JzKG1lc3NhZ2VfaWQsIHRpbWVzdGFtcCwganNvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdSZW1wU2VudFRvVmFsaWRhdG9ycycsXG4gICAgICAgIG1lc3NhZ2VfaWQsXG4gICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAganNvbixcbiAgICB9O1xufVxuZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRSZW1wU2VudFRvVmFsaWRhdG9ycyA9IHByb2Nlc3NpbmdFdmVudFJlbXBTZW50VG9WYWxpZGF0b3JzO1xuZnVuY3Rpb24gcHJvY2Vzc2luZ0V2ZW50UmVtcEluY2x1ZGVkSW50b0Jsb2NrKG1lc3NhZ2VfaWQsIHRpbWVzdGFtcCwganNvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdSZW1wSW5jbHVkZWRJbnRvQmxvY2snLFxuICAgICAgICBtZXNzYWdlX2lkLFxuICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgIGpzb24sXG4gICAgfTtcbn1cbmV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50UmVtcEluY2x1ZGVkSW50b0Jsb2NrID0gcHJvY2Vzc2luZ0V2ZW50UmVtcEluY2x1ZGVkSW50b0Jsb2NrO1xuZnVuY3Rpb24gcHJvY2Vzc2luZ0V2ZW50UmVtcEluY2x1ZGVkSW50b0FjY2VwdGVkQmxvY2sobWVzc2FnZV9pZCwgdGltZXN0YW1wLCBqc29uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1JlbXBJbmNsdWRlZEludG9BY2NlcHRlZEJsb2NrJyxcbiAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICBqc29uLFxuICAgIH07XG59XG5leHBvcnRzLnByb2Nlc3NpbmdFdmVudFJlbXBJbmNsdWRlZEludG9BY2NlcHRlZEJsb2NrID0gcHJvY2Vzc2luZ0V2ZW50UmVtcEluY2x1ZGVkSW50b0FjY2VwdGVkQmxvY2s7XG5mdW5jdGlvbiBwcm9jZXNzaW5nRXZlbnRSZW1wT3RoZXIobWVzc2FnZV9pZCwgdGltZXN0YW1wLCBqc29uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1JlbXBPdGhlcicsXG4gICAgICAgIG1lc3NhZ2VfaWQsXG4gICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAganNvbixcbiAgICB9O1xufVxuZXhwb3J0cy5wcm9jZXNzaW5nRXZlbnRSZW1wT3RoZXIgPSBwcm9jZXNzaW5nRXZlbnRSZW1wT3RoZXI7XG5mdW5jdGlvbiBwcm9jZXNzaW5nRXZlbnRSZW1wRXJyb3IoZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnUmVtcEVycm9yJyxcbiAgICAgICAgZXJyb3IsXG4gICAgfTtcbn1cbmV4cG9ydHMucHJvY2Vzc2luZ0V2ZW50UmVtcEVycm9yID0gcHJvY2Vzc2luZ0V2ZW50UmVtcEVycm9yO1xuLyoqXG4gKiBNZXNzYWdlIHByb2Nlc3NpbmcgbW9kdWxlLlxuICpcbiAqIEByZW1hcmtzXG4gKiBUaGlzIG1vZHVsZSBpbmNvcnBvcmF0ZXMgZnVuY3Rpb25zIHJlbGF0ZWQgdG8gY29tcGxleCBtZXNzYWdlXG4gKiBwcm9jZXNzaW5nIHNjZW5hcmlvcy5cbiAqL1xuY2xhc3MgUHJvY2Vzc2luZ01vZHVsZSB7XG4gICAgY29uc3RydWN0b3IoY2xpZW50KSB7XG4gICAgICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBtZXNzYWdlIHRvIHRoZSBuZXR3b3JrXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFNlbmRzIG1lc3NhZ2UgdG8gdGhlIG5ldHdvcmsgYW5kIHJldHVybnMgdGhlIGxhc3QgZ2VuZXJhdGVkIHNoYXJkIGJsb2NrIG9mIHRoZSBkZXN0aW5hdGlvbiBhY2NvdW50XG4gICAgICogYmVmb3JlIHRoZSBtZXNzYWdlIHdhcyBzZW50LiBJdCB3aWxsIGJlIHJlcXVpcmVkIGxhdGVyIGZvciBtZXNzYWdlIHByb2Nlc3NpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mU2VuZE1lc3NhZ2V9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mU2VuZE1lc3NhZ2VcbiAgICAgKi9cbiAgICBzZW5kX21lc3NhZ2UocGFyYW1zLCByZXNwb25zZUhhbmRsZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3Byb2Nlc3Npbmcuc2VuZF9tZXNzYWdlJywgcGFyYW1zLCByZXNwb25zZUhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBtb25pdG9yaW5nIG9mIHRoZSBuZXR3b3JrIGZvciB0aGUgcmVzdWx0IHRyYW5zYWN0aW9uIG9mIHRoZSBleHRlcm5hbCBpbmJvdW5kIG1lc3NhZ2UgcHJvY2Vzc2luZy5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogYHNlbmRfZXZlbnRzYCBlbmFibGVzIGludGVybWVkaWF0ZSBldmVudHMsIHN1Y2ggYXMgYFdpbGxGZXRjaE5leHRCbG9ja2AsXG4gICAgICogYEZldGNoTmV4dEJsb2NrRmFpbGVkYCB0aGF0IG1heSBiZSB1c2VmdWwgZm9yIGxvZ2dpbmcgb2YgbmV3IHNoYXJkIGJsb2NrcyBjcmVhdGlvblxuICAgICAqIGR1cmluZyBtZXNzYWdlIHByb2Nlc3NpbmcuXG4gICAgICpcbiAgICAgKiBOb3RlLCB0aGF0IHByZXNlbmNlIG9mIHRoZSBgYWJpYCBwYXJhbWV0ZXIgaXMgY3JpdGljYWwgZm9yIEFCSVxuICAgICAqIGNvbXBsaWFudCBjb250cmFjdHMuIE1lc3NhZ2UgcHJvY2Vzc2luZyB1c2VzIGRyYXN0aWNhbGx5XG4gICAgICogZGlmZmVyZW50IHN0cmF0ZWd5IGZvciBwcm9jZXNzaW5nIG1lc3NhZ2UgZm9yIGNvbnRyYWN0cyB3aGljaFxuICAgICAqIEFCSSBpbmNsdWRlcyBcImV4cGlyZVwiIGhlYWRlci5cbiAgICAgKlxuICAgICAqIFdoZW4gdGhlIEFCSSBoZWFkZXIgYGV4cGlyZWAgaXMgcHJlc2VudCwgdGhlIHByb2Nlc3NpbmcgdXNlc1xuICAgICAqIGBtZXNzYWdlIGV4cGlyYXRpb25gIHN0cmF0ZWd5OlxuICAgICAqIC0gVGhlIG1heGltdW0gYmxvY2sgZ2VuIHRpbWUgaXMgc2V0IHRvXG4gICAgICogICBgbWVzc2FnZV9leHBpcmF0aW9uX3RpbWVvdXQgKyB0cmFuc2FjdGlvbl93YWl0X3RpbWVvdXRgLlxuICAgICAqIC0gV2hlbiBtYXhpbXVtIGJsb2NrIGdlbiB0aW1lIGlzIHJlYWNoZWQsIHRoZSBwcm9jZXNzaW5nIHdpbGxcbiAgICAgKiAgIGJlIGZpbmlzaGVkIHdpdGggYE1lc3NhZ2VFeHBpcmVkYCBlcnJvci5cbiAgICAgKlxuICAgICAqIFdoZW4gdGhlIEFCSSBoZWFkZXIgYGV4cGlyZWAgaXNuJ3QgcHJlc2VudCBvciBgYWJpYCBwYXJhbWV0ZXJcbiAgICAgKiBpc24ndCBzcGVjaWZpZWQsIHRoZSBwcm9jZXNzaW5nIHVzZXMgYHRyYW5zYWN0aW9uIHdhaXRpbmdgXG4gICAgICogc3RyYXRlZ3k6XG4gICAgICogLSBUaGUgbWF4aW11bSBibG9jayBnZW4gdGltZSBpcyBzZXQgdG9cbiAgICAgKiAgIGBub3coKSArIHRyYW5zYWN0aW9uX3dhaXRfdGltZW91dGAuXG4gICAgICpcbiAgICAgKiAtIElmIG1heGltdW0gYmxvY2sgZ2VuIHRpbWUgaXMgcmVhY2hlZCBhbmQgbm8gcmVzdWx0IHRyYW5zYWN0aW9uIGlzIGZvdW5kLFxuICAgICAqIHRoZSBwcm9jZXNzaW5nIHdpbGwgZXhpdCB3aXRoIGFuIGVycm9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZldhaXRGb3JUcmFuc2FjdGlvbn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZQcm9jZXNzTWVzc2FnZVxuICAgICAqL1xuICAgIHdhaXRfZm9yX3RyYW5zYWN0aW9uKHBhcmFtcywgcmVzcG9uc2VIYW5kbGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdwcm9jZXNzaW5nLndhaXRfZm9yX3RyYW5zYWN0aW9uJywgcGFyYW1zLCByZXNwb25zZUhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIG1lc3NhZ2UsIHNlbmRzIGl0IHRvIHRoZSBuZXR3b3JrIGFuZCBtb25pdG9ycyBpdHMgcHJvY2Vzc2luZy5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQ3JlYXRlcyBBQkktY29tcGF0aWJsZSBtZXNzYWdlLFxuICAgICAqIHNlbmRzIGl0IHRvIHRoZSBuZXR3b3JrIGFuZCBtb25pdG9ycyBmb3IgdGhlIHJlc3VsdCB0cmFuc2FjdGlvbi5cbiAgICAgKiBEZWNvZGVzIHRoZSBvdXRwdXQgbWVzc2FnZXMnIGJvZGllcy5cbiAgICAgKlxuICAgICAqIElmIGNvbnRyYWN0J3MgQUJJIGluY2x1ZGVzIFwiZXhwaXJlXCIgaGVhZGVyLCB0aGVuXG4gICAgICogU0RLIGltcGxlbWVudHMgcmV0cmllcyBpbiBjYXNlIG9mIHVuc3VjY2Vzc2Z1bCBtZXNzYWdlIGRlbGl2ZXJ5IHdpdGhpbiB0aGUgZXhwaXJhdGlvblxuICAgICAqIHRpbWVvdXQ6IFNESyByZWNyZWF0ZXMgdGhlIG1lc3NhZ2UsIHNlbmRzIGl0IGFuZCBwcm9jZXNzZXMgaXQgYWdhaW4uXG4gICAgICpcbiAgICAgKiBUaGUgaW50ZXJtZWRpYXRlIGV2ZW50cywgc3VjaCBhcyBgV2lsbEZldGNoRmlyc3RCbG9ja2AsIGBXaWxsU2VuZGAsIGBEaWRTZW5kYCxcbiAgICAgKiBgV2lsbEZldGNoTmV4dEJsb2NrYCwgZXRjIC0gYXJlIHN3aXRjaGVkIG9uL29mZiBieSBgc2VuZF9ldmVudHNgIGZsYWdcbiAgICAgKiBhbmQgbG9nZ2VkIGludG8gdGhlIHN1cHBsaWVkIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogVGhlIHJldHJ5IGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyBhcmUgZGVmaW5lZCBpbiB0aGUgY2xpZW50J3MgYE5ldHdvcmtDb25maWdgIGFuZCBgQWJpQ29uZmlnYC5cbiAgICAgKlxuICAgICAqIElmIGNvbnRyYWN0J3MgQUJJIGRvZXMgbm90IGluY2x1ZGUgXCJleHBpcmVcIiBoZWFkZXJcbiAgICAgKiB0aGVuLCBpZiBubyB0cmFuc2FjdGlvbiBpcyBmb3VuZCB3aXRoaW4gdGhlIG5ldHdvcmsgdGltZW91dCAoc2VlIGNvbmZpZyBwYXJhbWV0ZXIgKSwgZXhpdHMgd2l0aCBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZQcm9jZXNzTWVzc2FnZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZQcm9jZXNzTWVzc2FnZVxuICAgICAqL1xuICAgIHByb2Nlc3NfbWVzc2FnZShwYXJhbXMsIHJlc3BvbnNlSGFuZGxlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgncHJvY2Vzc2luZy5wcm9jZXNzX21lc3NhZ2UnLCBwYXJhbXMsIHJlc3BvbnNlSGFuZGxlcik7XG4gICAgfVxufVxuZXhwb3J0cy5Qcm9jZXNzaW5nTW9kdWxlID0gUHJvY2Vzc2luZ01vZHVsZTtcbmZ1bmN0aW9uIGFkZHJlc3NTdHJpbmdGb3JtYXRBY2NvdW50SWQoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0FjY291bnRJZCcsXG4gICAgfTtcbn1cbmV4cG9ydHMuYWRkcmVzc1N0cmluZ0Zvcm1hdEFjY291bnRJZCA9IGFkZHJlc3NTdHJpbmdGb3JtYXRBY2NvdW50SWQ7XG5mdW5jdGlvbiBhZGRyZXNzU3RyaW5nRm9ybWF0SGV4KCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdIZXgnLFxuICAgIH07XG59XG5leHBvcnRzLmFkZHJlc3NTdHJpbmdGb3JtYXRIZXggPSBhZGRyZXNzU3RyaW5nRm9ybWF0SGV4O1xuZnVuY3Rpb24gYWRkcmVzc1N0cmluZ0Zvcm1hdEJhc2U2NCh1cmwsIHRlc3QsIGJvdW5jZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdCYXNlNjQnLFxuICAgICAgICB1cmwsXG4gICAgICAgIHRlc3QsXG4gICAgICAgIGJvdW5jZSxcbiAgICB9O1xufVxuZXhwb3J0cy5hZGRyZXNzU3RyaW5nRm9ybWF0QmFzZTY0ID0gYWRkcmVzc1N0cmluZ0Zvcm1hdEJhc2U2NDtcbnZhciBBY2NvdW50QWRkcmVzc1R5cGU7XG4oZnVuY3Rpb24gKEFjY291bnRBZGRyZXNzVHlwZSkge1xuICAgIEFjY291bnRBZGRyZXNzVHlwZVtcIkFjY291bnRJZFwiXSA9IFwiQWNjb3VudElkXCI7XG4gICAgQWNjb3VudEFkZHJlc3NUeXBlW1wiSGV4XCJdID0gXCJIZXhcIjtcbiAgICBBY2NvdW50QWRkcmVzc1R5cGVbXCJCYXNlNjRcIl0gPSBcIkJhc2U2NFwiO1xufSkoQWNjb3VudEFkZHJlc3NUeXBlID0gZXhwb3J0cy5BY2NvdW50QWRkcmVzc1R5cGUgfHwgKGV4cG9ydHMuQWNjb3VudEFkZHJlc3NUeXBlID0ge30pKTtcbi8qKlxuICogTWlzYyB1dGlsaXR5IEZ1bmN0aW9ucy5cbiAqL1xuY2xhc3MgVXRpbHNNb2R1bGUge1xuICAgIGNvbnN0cnVjdG9yKGNsaWVudCkge1xuICAgICAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYWRkcmVzcyBmcm9tIGFueSBUT04gZm9ybWF0IHRvIGFueSBUT04gZm9ybWF0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQ29udmVydEFkZHJlc3N9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mQ29udmVydEFkZHJlc3NcbiAgICAgKi9cbiAgICBjb252ZXJ0X2FkZHJlc3MocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCd1dGlscy5jb252ZXJ0X2FkZHJlc3MnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZXMgYW5kIHJldHVybnMgdGhlIHR5cGUgb2YgYW55IFRPTiBhZGRyZXNzLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBBZGRyZXNzIHR5cGVzIGFyZSB0aGUgZm9sbG93aW5nXG4gICAgICpcbiAgICAgKiBgMDo5MTlkYjhlNzQwZDUwYmYzNDlkZjJlZWEwM2ZhMzBjMzg1ZDg0NmI5OTFmZjU1NDJlNjcwOThlZTgzM2ZjN2Y3YCAtIHN0YW5kYXJkIFRPTiBhZGRyZXNzIG1vc3RcbiAgICAgKiBjb21tb25seSB1c2VkIGluIGFsbCBjYXNlcy4gQWxzbyBjYWxsZWQgYXMgaGV4IGFkZHJlc3NcbiAgICAgKiBgOTE5ZGI4ZTc0MGQ1MGJmMzQ5ZGYyZWVhMDNmYTMwYzM4NWQ4NDZiOTkxZmY1NTQyZTY3MDk4ZWU4MzNmYzdmN2AgLSBhY2NvdW50IElELiBBIHBhcnQgb2YgZnVsbFxuICAgICAqIGFkZHJlc3MuIElkZW50aWZpZXMgYWNjb3VudCBpbnNpZGUgcGFydGljdWxhciB3b3JrY2hhaW5cbiAgICAgKiBgRVFDUm5iam5RTlVMODBuZkx1b0QrakREaGRoR3VaSC9WVUxtY0pqdWd6L0g5d2FtYCAtIGJhc2U2NCBhZGRyZXNzLiBBbHNvIGNhbGxlZCBcInVzZXItZnJpZW5kbHlcIi5cbiAgICAgKiBXYXMgdXNlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIFRPTi4gTm93IGl0IGlzIHN1cHBvcnRlZCBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkdldEFkZHJlc3NUeXBlfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkdldEFkZHJlc3NUeXBlXG4gICAgICovXG4gICAgZ2V0X2FkZHJlc3NfdHlwZShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3V0aWxzLmdldF9hZGRyZXNzX3R5cGUnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIHN0b3JhZ2UgZmVlIGZvciBhbiBhY2NvdW50IG92ZXIgYSBzcGVjaWZpZWQgdGltZSBwZXJpb2RcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZDYWxjU3RvcmFnZUZlZX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZDYWxjU3RvcmFnZUZlZVxuICAgICAqL1xuICAgIGNhbGNfc3RvcmFnZV9mZWUocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCd1dGlscy5jYWxjX3N0b3JhZ2VfZmVlJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcHJlc3NlcyBkYXRhIHVzaW5nIFpzdGFuZGFyZCBhbGdvcml0aG1cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZDb21wcmVzc1pzdGR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mQ29tcHJlc3Nac3RkXG4gICAgICovXG4gICAgY29tcHJlc3NfenN0ZChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3V0aWxzLmNvbXByZXNzX3pzdGQnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvbXByZXNzZXMgZGF0YSB1c2luZyBac3RhbmRhcmQgYWxnb3JpdGhtXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mRGVjb21wcmVzc1pzdGR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mRGVjb21wcmVzc1pzdGRcbiAgICAgKi9cbiAgICBkZWNvbXByZXNzX3pzdGQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCd1dGlscy5kZWNvbXByZXNzX3pzdGQnLCBwYXJhbXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuVXRpbHNNb2R1bGUgPSBVdGlsc01vZHVsZTtcbi8vIHR2bSBtb2R1bGVcbnZhciBUdm1FcnJvckNvZGU7XG4oZnVuY3Rpb24gKFR2bUVycm9yQ29kZSkge1xuICAgIFR2bUVycm9yQ29kZVtUdm1FcnJvckNvZGVbXCJDYW5Ob3RSZWFkVHJhbnNhY3Rpb25cIl0gPSA0MDFdID0gXCJDYW5Ob3RSZWFkVHJhbnNhY3Rpb25cIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiQ2FuTm90UmVhZEJsb2NrY2hhaW5Db25maWdcIl0gPSA0MDJdID0gXCJDYW5Ob3RSZWFkQmxvY2tjaGFpbkNvbmZpZ1wiO1xuICAgIFR2bUVycm9yQ29kZVtUdm1FcnJvckNvZGVbXCJUcmFuc2FjdGlvbkFib3J0ZWRcIl0gPSA0MDNdID0gXCJUcmFuc2FjdGlvbkFib3J0ZWRcIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiSW50ZXJuYWxFcnJvclwiXSA9IDQwNF0gPSBcIkludGVybmFsRXJyb3JcIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiQWN0aW9uUGhhc2VGYWlsZWRcIl0gPSA0MDVdID0gXCJBY3Rpb25QaGFzZUZhaWxlZFwiO1xuICAgIFR2bUVycm9yQ29kZVtUdm1FcnJvckNvZGVbXCJBY2NvdW50Q29kZU1pc3NpbmdcIl0gPSA0MDZdID0gXCJBY2NvdW50Q29kZU1pc3NpbmdcIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiTG93QmFsYW5jZVwiXSA9IDQwN10gPSBcIkxvd0JhbGFuY2VcIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiQWNjb3VudEZyb3plbk9yRGVsZXRlZFwiXSA9IDQwOF0gPSBcIkFjY291bnRGcm96ZW5PckRlbGV0ZWRcIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiQWNjb3VudE1pc3NpbmdcIl0gPSA0MDldID0gXCJBY2NvdW50TWlzc2luZ1wiO1xuICAgIFR2bUVycm9yQ29kZVtUdm1FcnJvckNvZGVbXCJVbmtub3duRXhlY3V0aW9uRXJyb3JcIl0gPSA0MTBdID0gXCJVbmtub3duRXhlY3V0aW9uRXJyb3JcIjtcbiAgICBUdm1FcnJvckNvZGVbVHZtRXJyb3JDb2RlW1wiSW52YWxpZElucHV0U3RhY2tcIl0gPSA0MTFdID0gXCJJbnZhbGlkSW5wdXRTdGFja1wiO1xuICAgIFR2bUVycm9yQ29kZVtUdm1FcnJvckNvZGVbXCJJbnZhbGlkQWNjb3VudEJvY1wiXSA9IDQxMl0gPSBcIkludmFsaWRBY2NvdW50Qm9jXCI7XG4gICAgVHZtRXJyb3JDb2RlW1R2bUVycm9yQ29kZVtcIkludmFsaWRNZXNzYWdlVHlwZVwiXSA9IDQxM10gPSBcIkludmFsaWRNZXNzYWdlVHlwZVwiO1xuICAgIFR2bUVycm9yQ29kZVtUdm1FcnJvckNvZGVbXCJDb250cmFjdEV4ZWN1dGlvbkVycm9yXCJdID0gNDE0XSA9IFwiQ29udHJhY3RFeGVjdXRpb25FcnJvclwiO1xufSkoVHZtRXJyb3JDb2RlID0gZXhwb3J0cy5Udm1FcnJvckNvZGUgfHwgKGV4cG9ydHMuVHZtRXJyb3JDb2RlID0ge30pKTtcbmZ1bmN0aW9uIGFjY291bnRGb3JFeGVjdXRvck5vbmUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ05vbmUnLFxuICAgIH07XG59XG5leHBvcnRzLmFjY291bnRGb3JFeGVjdXRvck5vbmUgPSBhY2NvdW50Rm9yRXhlY3V0b3JOb25lO1xuZnVuY3Rpb24gYWNjb3VudEZvckV4ZWN1dG9yVW5pbml0KCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdVbmluaXQnLFxuICAgIH07XG59XG5leHBvcnRzLmFjY291bnRGb3JFeGVjdXRvclVuaW5pdCA9IGFjY291bnRGb3JFeGVjdXRvclVuaW5pdDtcbmZ1bmN0aW9uIGFjY291bnRGb3JFeGVjdXRvckFjY291bnQoYm9jLCB1bmxpbWl0ZWRfYmFsYW5jZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdBY2NvdW50JyxcbiAgICAgICAgYm9jLFxuICAgICAgICB1bmxpbWl0ZWRfYmFsYW5jZSxcbiAgICB9O1xufVxuZXhwb3J0cy5hY2NvdW50Rm9yRXhlY3V0b3JBY2NvdW50ID0gYWNjb3VudEZvckV4ZWN1dG9yQWNjb3VudDtcbmNsYXNzIFR2bU1vZHVsZSB7XG4gICAgY29uc3RydWN0b3IoY2xpZW50KSB7XG4gICAgICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbXVsYXRlcyBhbGwgdGhlIHBoYXNlcyBvZiBjb250cmFjdCBleGVjdXRpb24gbG9jYWxseVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBQZXJmb3JtcyBhbGwgdGhlIHBoYXNlcyBvZiBjb250cmFjdCBleGVjdXRpb24gb24gVHJhbnNhY3Rpb24gRXhlY3V0b3IgLVxuICAgICAqIHRoZSBzYW1lIGNvbXBvbmVudCB0aGF0IGlzIHVzZWQgb24gVmFsaWRhdG9yIE5vZGVzLlxuICAgICAqXG4gICAgICogQ2FuIGJlIHVzZWQgZm9yIGNvbnRyYWN0IGRlYnVnZ2luZywgdG8gZmluZCBvdXQgdGhlIHJlYXNvbiB3aHkgYSBtZXNzYWdlIHdhcyBub3QgZGVsaXZlcmVkIHN1Y2Nlc3NmdWxseS5cbiAgICAgKiBWYWxpZGF0b3JzIHRocm93IGF3YXkgdGhlIGZhaWxlZCBleHRlcm5hbCBpbmJvdW5kIG1lc3NhZ2VzIChpZiB0aGV5IGZhaWxlZCBiZWRvcmUgYEFDQ0VQVGApIGluIHRoZSByZWFsIG5ldHdvcmsuXG4gICAgICogVGhpcyBpcyB3aHkgdGhlc2UgbWVzc2FnZXMgYXJlIGltcG9zc2libGUgdG8gZGVidWcgaW4gdGhlIHJlYWwgbmV0d29yay5cbiAgICAgKiBXaXRoIHRoZSBoZWxwIG9mIHJ1bl9leGVjdXRvciB5b3UgY2FuIGRvIHRoYXQuIEluIGZhY3QsIGBwcm9jZXNzX21lc3NhZ2VgIGZ1bmN0aW9uXG4gICAgICogcGVyZm9ybXMgbG9jYWwgY2hlY2sgd2l0aCBgcnVuX2V4ZWN1dG9yYCBpZiB0aGVyZSB3YXMgbm8gdHJhbnNhY3Rpb24gYXMgYSByZXN1bHQgb2YgcHJvY2Vzc2luZ1xuICAgICAqIGFuZCByZXR1cm5zIHRoZSBlcnJvciwgaWYgdGhlcmUgaXMgb25lLlxuICAgICAqXG4gICAgICogQW5vdGhlciB1c2UgY2FzZSB0byB1c2UgYHJ1bl9leGVjdXRvcmAgaXMgdG8gZXN0aW1hdGUgZmVlcyBmb3IgbWVzc2FnZSBleGVjdXRpb24uXG4gICAgICogU2V0ICBgQWNjb3VudEZvckV4ZWN1dG9yOjpBY2NvdW50LnVubGltaXRlZF9iYWxhbmNlYFxuICAgICAqIHRvIGB0cnVlYCBzbyB0aGF0IGVtdWxhdGlvbiB3aWxsIG5vdCBkZXBlbmQgb24gdGhlIGFjdHVhbCBiYWxhbmNlLlxuICAgICAqIFRoaXMgbWF5IGJlIG5lZWRlZCB0byBjYWxjdWxhdGUgZGVwbG95IGZlZXMgZm9yIGFuIGFjY291bnQgdGhhdCBkb2VzIG5vdCBleGlzdCB5ZXQuXG4gICAgICogSlNPTiB3aXRoIGZlZXMgaXMgaW4gYGZlZXNgIGZpZWxkIG9mIHRoZSByZXN1bHQuXG4gICAgICpcbiAgICAgKiBPbmUgbW9yZSB1c2UgY2FzZSAtIHlvdSBjYW4gcHJvZHVjZSB0aGUgc2VxdWVuY2Ugb2Ygb3BlcmF0aW9ucyxcbiAgICAgKiB0aHVzIGVtdWxhdGluZyB0aGUgc2VxdWVudGlhbCBjb250cmFjdCBjYWxscyBsb2NhbGx5LlxuICAgICAqIEFuZCBzbyBvbi5cbiAgICAgKlxuICAgICAqIFRyYW5zYWN0aW9uIGV4ZWN1dG9yIHJlcXVpcmVzIGFjY291bnQgQk9DIChiYWcgb2YgY2VsbHMpIGFzIGEgcGFyYW1ldGVyLlxuICAgICAqIFRvIGdldCB0aGUgYWNjb3VudCBCT0MgLSB1c2UgYG5ldC5xdWVyeWAgbWV0aG9kIHRvIGRvd25sb2FkIGl0IGZyb20gR3JhcGhRTCBBUElcbiAgICAgKiAoZmllbGQgYGJvY2Agb2YgYGFjY291bnRgKSBvciBnZW5lcmF0ZSBpdCB3aXRoIGBhYmkuZW5jb2RlX2FjY291bnRgIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEFsc28gaXQgcmVxdWlyZXMgbWVzc2FnZSBCT0MuIFRvIGdldCB0aGUgbWVzc2FnZSBCT0MgLSB1c2UgYGFiaS5lbmNvZGVfbWVzc2FnZWAgb3IgYGFiaS5lbmNvZGVfaW50ZXJuYWxfbWVzc2FnZWAuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgbmVlZCB0aGlzIGVtdWxhdGlvbiB0byBiZSBhcyBwcmVjaXNlIGFzIHBvc3NpYmxlIChmb3IgaW5zdGFuY2UgLSBlbXVsYXRlIHRyYW5zYWN0aW9uXG4gICAgICogd2l0aCBwYXJ0aWN1bGFyIGx0IGluIHBhcnRpY3VsYXIgYmxvY2sgb3IgdXNlIHBhcnRpY3VsYXIgYmxvY2tjaGFpbiBjb25maWcsXG4gICAgICogZG93bmxvYWRlZCBmcm9tIGEgcGFydGljdWxhciBrZXkgYmxvY2sgLSB0aGVuIHNwZWNpZnkgYGV4ZWN1dGlvbl9vcHRpb25zYCBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgbmVlZCB0byBzZWUgdGhlIGFib3J0ZWQgdHJhbnNhY3Rpb24gYXMgYSByZXN1bHQsIG5vdCBhcyBhbiBlcnJvciwgc2V0IGBza2lwX3RyYW5zYWN0aW9uX2NoZWNrYCB0byBgdHJ1ZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mUnVuRXhlY3V0b3J9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mUnVuRXhlY3V0b3JcbiAgICAgKi9cbiAgICBydW5fZXhlY3V0b3IocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCd0dm0ucnVuX2V4ZWN1dG9yJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgZ2V0LW1ldGhvZHMgb2YgQUJJLWNvbXBhdGlibGUgY29udHJhY3RzXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBlcmZvcm1zIG9ubHkgYSBwYXJ0IG9mIGNvbXB1dGUgcGhhc2Ugb2YgdHJhbnNhY3Rpb24gZXhlY3V0aW9uXG4gICAgICogdGhhdCBpcyB1c2VkIHRvIHJ1biBnZXQtbWV0aG9kcyBvZiBBQkktY29tcGF0aWJsZSBjb250cmFjdHMuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgdHJ5IHRvIHJ1biBnZXQtbWV0aG9kcyB3aXRoIGBydW5fZXhlY3V0b3JgIHlvdSB3aWxsIGdldCBhbiBlcnJvciwgYmVjYXVzZSBpdCBjaGVja3MgQUNDRVBUIGFuZCBleGl0c1xuICAgICAqIGlmIHRoZXJlIGlzIG5vbmUsIHdoaWNoIGlzIGFjdHVhbGx5IHRydWUgZm9yIGdldC1tZXRob2RzLlxuICAgICAqXG4gICAgICogIFRvIGdldCB0aGUgYWNjb3VudCBCT0MgKGJhZyBvZiBjZWxscykgLSB1c2UgYG5ldC5xdWVyeWAgbWV0aG9kIHRvIGRvd25sb2FkIGl0IGZyb20gR3JhcGhRTCBBUElcbiAgICAgKiAoZmllbGQgYGJvY2Agb2YgYGFjY291bnRgKSBvciBnZW5lcmF0ZSBpdCB3aXRoIGBhYmkuZW5jb2RlX2FjY291bnQgbWV0aG9kYC5cbiAgICAgKiBUbyBnZXQgdGhlIG1lc3NhZ2UgQk9DIC0gdXNlIGBhYmkuZW5jb2RlX21lc3NhZ2VgIG9yIHByZXBhcmUgaXQgYW55IG90aGVyIHdheSwgZm9yIGluc3RhbmNlLCB3aXRoIEZJRlQgc2NyaXB0LlxuICAgICAqXG4gICAgICogQXR0ZW50aW9uISBVcGRhdGVkIGFjY291bnQgc3RhdGUgaXMgcHJvZHVjZXMgYXMgd2VsbCwgYnV0IG9ubHlcbiAgICAgKiBgYWNjb3VudF9zdGF0ZS5zdG9yYWdlLnN0YXRlLmRhdGFgICBwYXJ0IG9mIHRoZSBCT0MgaXMgdXBkYXRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZSdW5Udm19IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mUnVuVHZtXG4gICAgICovXG4gICAgcnVuX3R2bShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3R2bS5ydW5fdHZtJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYSBnZXQtbWV0aG9kIG9mIEZJRlQgY29udHJhY3RcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogRXhlY3V0ZXMgYSBnZXQtbWV0aG9kIG9mIEZJRlQgY29udHJhY3QgdGhhdCBmdWxmaWxscyB0aGUgc21jLWd1aWRlbGluZXMgaHR0cHM6Ly90ZXN0LnRvbi5vcmcvc21jLWd1aWRlbGluZXMudHh0XG4gICAgICogYW5kIHJldHVybnMgdGhlIHJlc3VsdCBkYXRhIGZyb20gVFZNJ3Mgc3RhY2tcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZSdW5HZXR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mUnVuR2V0XG4gICAgICovXG4gICAgcnVuX2dldChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3R2bS5ydW5fZ2V0JywgcGFyYW1zKTtcbiAgICB9XG59XG5leHBvcnRzLlR2bU1vZHVsZSA9IFR2bU1vZHVsZTtcbi8vIG5ldCBtb2R1bGVcbnZhciBOZXRFcnJvckNvZGU7XG4oZnVuY3Rpb24gKE5ldEVycm9yQ29kZSkge1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJRdWVyeUZhaWxlZFwiXSA9IDYwMV0gPSBcIlF1ZXJ5RmFpbGVkXCI7XG4gICAgTmV0RXJyb3JDb2RlW05ldEVycm9yQ29kZVtcIlN1YnNjcmliZUZhaWxlZFwiXSA9IDYwMl0gPSBcIlN1YnNjcmliZUZhaWxlZFwiO1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJXYWl0Rm9yRmFpbGVkXCJdID0gNjAzXSA9IFwiV2FpdEZvckZhaWxlZFwiO1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJHZXRTdWJzY3JpcHRpb25SZXN1bHRGYWlsZWRcIl0gPSA2MDRdID0gXCJHZXRTdWJzY3JpcHRpb25SZXN1bHRGYWlsZWRcIjtcbiAgICBOZXRFcnJvckNvZGVbTmV0RXJyb3JDb2RlW1wiSW52YWxpZFNlcnZlclJlc3BvbnNlXCJdID0gNjA1XSA9IFwiSW52YWxpZFNlcnZlclJlc3BvbnNlXCI7XG4gICAgTmV0RXJyb3JDb2RlW05ldEVycm9yQ29kZVtcIkNsb2NrT3V0T2ZTeW5jXCJdID0gNjA2XSA9IFwiQ2xvY2tPdXRPZlN5bmNcIjtcbiAgICBOZXRFcnJvckNvZGVbTmV0RXJyb3JDb2RlW1wiV2FpdEZvclRpbWVvdXRcIl0gPSA2MDddID0gXCJXYWl0Rm9yVGltZW91dFwiO1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJHcmFwaHFsRXJyb3JcIl0gPSA2MDhdID0gXCJHcmFwaHFsRXJyb3JcIjtcbiAgICBOZXRFcnJvckNvZGVbTmV0RXJyb3JDb2RlW1wiTmV0d29ya01vZHVsZVN1c3BlbmRlZFwiXSA9IDYwOV0gPSBcIk5ldHdvcmtNb2R1bGVTdXNwZW5kZWRcIjtcbiAgICBOZXRFcnJvckNvZGVbTmV0RXJyb3JDb2RlW1wiV2Vic29ja2V0RGlzY29ubmVjdGVkXCJdID0gNjEwXSA9IFwiV2Vic29ja2V0RGlzY29ubmVjdGVkXCI7XG4gICAgTmV0RXJyb3JDb2RlW05ldEVycm9yQ29kZVtcIk5vdFN1cHBvcnRlZFwiXSA9IDYxMV0gPSBcIk5vdFN1cHBvcnRlZFwiO1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJOb0VuZHBvaW50c1Byb3ZpZGVkXCJdID0gNjEyXSA9IFwiTm9FbmRwb2ludHNQcm92aWRlZFwiO1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJHcmFwaHFsV2Vic29ja2V0SW5pdEVycm9yXCJdID0gNjEzXSA9IFwiR3JhcGhxbFdlYnNvY2tldEluaXRFcnJvclwiO1xuICAgIE5ldEVycm9yQ29kZVtOZXRFcnJvckNvZGVbXCJOZXR3b3JrTW9kdWxlUmVzdW1lZFwiXSA9IDYxNF0gPSBcIk5ldHdvcmtNb2R1bGVSZXN1bWVkXCI7XG4gICAgTmV0RXJyb3JDb2RlW05ldEVycm9yQ29kZVtcIlVuYXV0aG9yaXplZFwiXSA9IDYxNV0gPSBcIlVuYXV0aG9yaXplZFwiO1xufSkoTmV0RXJyb3JDb2RlID0gZXhwb3J0cy5OZXRFcnJvckNvZGUgfHwgKGV4cG9ydHMuTmV0RXJyb3JDb2RlID0ge30pKTtcbnZhciBTb3J0RGlyZWN0aW9uO1xuKGZ1bmN0aW9uIChTb3J0RGlyZWN0aW9uKSB7XG4gICAgU29ydERpcmVjdGlvbltcIkFTQ1wiXSA9IFwiQVNDXCI7XG4gICAgU29ydERpcmVjdGlvbltcIkRFU0NcIl0gPSBcIkRFU0NcIjtcbn0pKFNvcnREaXJlY3Rpb24gPSBleHBvcnRzLlNvcnREaXJlY3Rpb24gfHwgKGV4cG9ydHMuU29ydERpcmVjdGlvbiA9IHt9KSk7XG5mdW5jdGlvbiBwYXJhbXNPZlF1ZXJ5T3BlcmF0aW9uUXVlcnlDb2xsZWN0aW9uKHBhcmFtcykge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHsgdHlwZTogJ1F1ZXJ5Q29sbGVjdGlvbicgfSwgcGFyYW1zKTtcbn1cbmV4cG9ydHMucGFyYW1zT2ZRdWVyeU9wZXJhdGlvblF1ZXJ5Q29sbGVjdGlvbiA9IHBhcmFtc09mUXVlcnlPcGVyYXRpb25RdWVyeUNvbGxlY3Rpb247XG5mdW5jdGlvbiBwYXJhbXNPZlF1ZXJ5T3BlcmF0aW9uV2FpdEZvckNvbGxlY3Rpb24ocGFyYW1zKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oeyB0eXBlOiAnV2FpdEZvckNvbGxlY3Rpb24nIH0sIHBhcmFtcyk7XG59XG5leHBvcnRzLnBhcmFtc09mUXVlcnlPcGVyYXRpb25XYWl0Rm9yQ29sbGVjdGlvbiA9IHBhcmFtc09mUXVlcnlPcGVyYXRpb25XYWl0Rm9yQ29sbGVjdGlvbjtcbmZ1bmN0aW9uIHBhcmFtc09mUXVlcnlPcGVyYXRpb25BZ2dyZWdhdGVDb2xsZWN0aW9uKHBhcmFtcykge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHsgdHlwZTogJ0FnZ3JlZ2F0ZUNvbGxlY3Rpb24nIH0sIHBhcmFtcyk7XG59XG5leHBvcnRzLnBhcmFtc09mUXVlcnlPcGVyYXRpb25BZ2dyZWdhdGVDb2xsZWN0aW9uID0gcGFyYW1zT2ZRdWVyeU9wZXJhdGlvbkFnZ3JlZ2F0ZUNvbGxlY3Rpb247XG5mdW5jdGlvbiBwYXJhbXNPZlF1ZXJ5T3BlcmF0aW9uUXVlcnlDb3VudGVycGFydGllcyhwYXJhbXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7IHR5cGU6ICdRdWVyeUNvdW50ZXJwYXJ0aWVzJyB9LCBwYXJhbXMpO1xufVxuZXhwb3J0cy5wYXJhbXNPZlF1ZXJ5T3BlcmF0aW9uUXVlcnlDb3VudGVycGFydGllcyA9IHBhcmFtc09mUXVlcnlPcGVyYXRpb25RdWVyeUNvdW50ZXJwYXJ0aWVzO1xudmFyIEFnZ3JlZ2F0aW9uRm47XG4oZnVuY3Rpb24gKEFnZ3JlZ2F0aW9uRm4pIHtcbiAgICBBZ2dyZWdhdGlvbkZuW1wiQ09VTlRcIl0gPSBcIkNPVU5UXCI7XG4gICAgQWdncmVnYXRpb25GbltcIk1JTlwiXSA9IFwiTUlOXCI7XG4gICAgQWdncmVnYXRpb25GbltcIk1BWFwiXSA9IFwiTUFYXCI7XG4gICAgQWdncmVnYXRpb25GbltcIlNVTVwiXSA9IFwiU1VNXCI7XG4gICAgQWdncmVnYXRpb25GbltcIkFWRVJBR0VcIl0gPSBcIkFWRVJBR0VcIjtcbn0pKEFnZ3JlZ2F0aW9uRm4gPSBleHBvcnRzLkFnZ3JlZ2F0aW9uRm4gfHwgKGV4cG9ydHMuQWdncmVnYXRpb25GbiA9IHt9KSk7XG4vKipcbiAqIE5ldHdvcmsgYWNjZXNzLlxuICovXG5jbGFzcyBOZXRNb2R1bGUge1xuICAgIGNvbnN0cnVjdG9yKGNsaWVudCkge1xuICAgICAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgREFwcFNlcnZlciBHcmFwaFFMIHF1ZXJ5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlF1ZXJ5fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlF1ZXJ5XG4gICAgICovXG4gICAgcXVlcnkocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQucXVlcnknLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBtdWx0aXBsZSBxdWVyaWVzIHBlciBzaW5nbGUgZmV0Y2guXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQmF0Y2hRdWVyeX0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZCYXRjaFF1ZXJ5XG4gICAgICovXG4gICAgYmF0Y2hfcXVlcnkocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuYmF0Y2hfcXVlcnknLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBRdWVyaWVzIGNvbGxlY3Rpb24gZGF0YVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBRdWVyaWVzIGRhdGEgdGhhdCBzYXRpc2ZpZXMgdGhlIGBmaWx0ZXJgIGNvbmRpdGlvbnMsXG4gICAgICogbGltaXRzIHRoZSBudW1iZXIgb2YgcmV0dXJuZWQgcmVjb3JkcyBhbmQgb3JkZXJzIHRoZW0uXG4gICAgICogVGhlIHByb2plY3Rpb24gZmllbGRzIGFyZSBsaW1pdGVkIHRvIGByZXN1bHRgIGZpZWxkc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlF1ZXJ5Q29sbGVjdGlvbn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZRdWVyeUNvbGxlY3Rpb25cbiAgICAgKi9cbiAgICBxdWVyeV9jb2xsZWN0aW9uKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0LnF1ZXJ5X2NvbGxlY3Rpb24nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZ2dyZWdhdGVzIGNvbGxlY3Rpb24gZGF0YS5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQWdncmVnYXRlcyB2YWx1ZXMgZnJvbSB0aGUgc3BlY2lmaWVkIGBmaWVsZHNgIGZvciByZWNvcmRzXG4gICAgICogdGhhdCBzYXRpc2ZpZXMgdGhlIGBmaWx0ZXJgIGNvbmRpdGlvbnMsXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQWdncmVnYXRlQ29sbGVjdGlvbn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZBZ2dyZWdhdGVDb2xsZWN0aW9uXG4gICAgICovXG4gICAgYWdncmVnYXRlX2NvbGxlY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuYWdncmVnYXRlX2NvbGxlY3Rpb24nLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IGZ1bGZpbGxzIHRoZSBjb25kaXRpb25zIG9yIHdhaXRzIGZvciBpdHMgYXBwZWFyYW5jZVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUcmlnZ2VycyBvbmx5IG9uY2UuXG4gICAgICogSWYgb2JqZWN0IHRoYXQgc2F0aXNmaWVzIHRoZSBgZmlsdGVyYCBjb25kaXRpb25zXG4gICAgICogYWxyZWFkeSBleGlzdHMgLSByZXR1cm5zIGl0IGltbWVkaWF0ZWx5LlxuICAgICAqIElmIG5vdCAtIHdhaXRzIGZvciBpbnNlcnQvdXBkYXRlIG9mIGRhdGEgd2l0aGluIHRoZSBzcGVjaWZpZWQgYHRpbWVvdXRgLFxuICAgICAqIGFuZCByZXR1cm5zIGl0LlxuICAgICAqIFRoZSBwcm9qZWN0aW9uIGZpZWxkcyBhcmUgbGltaXRlZCB0byBgcmVzdWx0YCBmaWVsZHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZXYWl0Rm9yQ29sbGVjdGlvbn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZXYWl0Rm9yQ29sbGVjdGlvblxuICAgICAqL1xuICAgIHdhaXRfZm9yX2NvbGxlY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQud2FpdF9mb3JfY29sbGVjdGlvbicsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbmNlbHMgYSBzdWJzY3JpcHRpb25cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQ2FuY2VscyBhIHN1YnNjcmlwdGlvbiBzcGVjaWZpZWQgYnkgaXRzIGhhbmRsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UmVzdWx0T2ZTdWJzY3JpYmVDb2xsZWN0aW9ufSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHVuc3Vic2NyaWJlKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0LnVuc3Vic2NyaWJlJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGNvbGxlY3Rpb24gc3Vic2NyaXB0aW9uXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRyaWdnZXJzIGZvciBlYWNoIGluc2VydC91cGRhdGUgb2YgZGF0YSB0aGF0IHNhdGlzZmllc1xuICAgICAqIHRoZSBgZmlsdGVyYCBjb25kaXRpb25zLlxuICAgICAqIFRoZSBwcm9qZWN0aW9uIGZpZWxkcyBhcmUgbGltaXRlZCB0byBgcmVzdWx0YCBmaWVsZHMuXG4gICAgICpcbiAgICAgKiBUaGUgc3Vic2NyaXB0aW9uIGlzIGEgcGVyc2lzdGVudCBjb21tdW5pY2F0aW9uIGNoYW5uZWwgYmV0d2VlblxuICAgICAqIGNsaWVudCBhbmQgRnJlZSBUT04gTmV0d29yay5cbiAgICAgKiBBbGwgY2hhbmdlcyBpbiB0aGUgYmxvY2tjaGFpbiB3aWxsIGJlIHJlZmxlY3RlZCBpbiByZWFsdGltZS5cbiAgICAgKiBDaGFuZ2VzIG1lYW5zIGluc2VydHMgYW5kIHVwZGF0ZXMgb2YgdGhlIGJsb2NrY2hhaW4gZW50aXRpZXMuXG4gICAgICpcbiAgICAgKiAjIyMgSW1wb3J0YW50IE5vdGVzIG9uIFN1YnNjcmlwdGlvbnNcbiAgICAgKlxuICAgICAqIFVuZm9ydHVuYXRlbHkgc29tZXRpbWVzIHRoZSBjb25uZWN0aW9uIHdpdGggdGhlIG5ldHdvcmsgYnJha2VzIGRvd24uXG4gICAgICogSW4gdGhpcyBzaXR1YXRpb24gdGhlIGxpYnJhcnkgYXR0ZW1wdHMgdG8gcmVjb25uZWN0IHRvIHRoZSBuZXR3b3JrLlxuICAgICAqIFRoaXMgcmVjb25uZWN0aW9uIHNlcXVlbmNlIGNhbiB0YWtlIHNpZ25pZmljYW50IHRpbWUuXG4gICAgICogQWxsIG9mIHRoaXMgdGltZSB0aGUgY2xpZW50IGlzIGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSBuZXR3b3JrLlxuICAgICAqXG4gICAgICogQmFkIG5ld3MgaXMgdGhhdCBhbGwgYmxvY2tjaGFpbiBjaGFuZ2VzIHRoYXQgaGFwcGVuZWQgd2hpbGVcbiAgICAgKiB0aGUgY2xpZW50IHdhcyBkaXNjb25uZWN0ZWQgYXJlIGxvc3QuXG4gICAgICpcbiAgICAgKiBHb29kIG5ld3MgaXMgdGhhdCB0aGUgY2xpZW50IHJlcG9ydCBlcnJvcnMgdG8gdGhlIGNhbGxiYWNrIHdoZW5cbiAgICAgKiBpdCBsb3NlcyBhbmQgcmVzdW1lcyBjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogU28sIGlmIHRoZSBsb3N0IGNoYW5nZXMgYXJlIGltcG9ydGFudCB0byB0aGUgYXBwbGljYXRpb24gdGhlblxuICAgICAqIHRoZSBhcHBsaWNhdGlvbiBtdXN0IGhhbmRsZSB0aGVzZSBlcnJvciByZXBvcnRzLlxuICAgICAqXG4gICAgICogTGlicmFyeSByZXBvcnRzIGVycm9ycyB3aXRoIGByZXNwb25zZVR5cGVgID09IDEwMVxuICAgICAqIGFuZCB0aGUgZXJyb3Igb2JqZWN0IHBhc3NlZCB2aWEgYHBhcmFtc2AuXG4gICAgICpcbiAgICAgKiBXaGVuIHRoZSBsaWJyYXJ5IGhhcyBzdWNjZXNzZnVsbHkgcmVjb25uZWN0ZWRcbiAgICAgKiB0aGUgYXBwbGljYXRpb24gcmVjZWl2ZXMgY2FsbGJhY2sgd2l0aFxuICAgICAqIGByZXNwb25zZVR5cGVgID09IDEwMSBhbmQgYHBhcmFtcy5jb2RlYCA9PSA2MTQgKE5ldHdvcmtNb2R1bGVSZXN1bWVkKS5cbiAgICAgKlxuICAgICAqIEFwcGxpY2F0aW9uIGNhbiB1c2Ugc2V2ZXJhbCB3YXlzIHRvIGhhbmRsZSB0aGlzIHNpdHVhdGlvbjpcbiAgICAgKiAtIElmIGFwcGxpY2F0aW9uIG1vbml0b3JzIGNoYW5nZXMgZm9yIHRoZSBzaW5nbGUgYmxvY2tjaGFpblxuICAgICAqIG9iamVjdCAoZm9yIGV4YW1wbGUgc3BlY2lmaWMgYWNjb3VudCk6ICBhcHBsaWNhdGlvblxuICAgICAqIGNhbiBwZXJmb3JtIGEgcXVlcnkgZm9yIHRoaXMgb2JqZWN0IGFuZCBoYW5kbGUgYWN0dWFsIGRhdGEgYXMgYVxuICAgICAqIHJlZ3VsYXIgZGF0YSBmcm9tIHRoZSBzdWJzY3JpcHRpb24uXG4gICAgICogLSBJZiBhcHBsaWNhdGlvbiBtb25pdG9ycyBzZXF1ZW5jZSBvZiBzb21lIGJsb2NrY2hhaW4gb2JqZWN0c1xuICAgICAqIChmb3IgZXhhbXBsZSB0cmFuc2FjdGlvbnMgb2YgdGhlIHNwZWNpZmljIGFjY291bnQpOiBhcHBsaWNhdGlvbiBtdXN0XG4gICAgICogcmVmcmVzaCBhbGwgY2FjaGVkIChvciB2aXNpYmxlIHRvIHVzZXIpIGxpc3RzIHdoZXJlIHRoaXMgc2VxdWVuY2VzIHByZXNlbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlN1YnNjcmliZUNvbGxlY3Rpb259IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mU3Vic2NyaWJlQ29sbGVjdGlvblxuICAgICAqL1xuICAgIHN1YnNjcmliZV9jb2xsZWN0aW9uKHBhcmFtcywgcmVzcG9uc2VIYW5kbGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuc3Vic2NyaWJlX2NvbGxlY3Rpb24nLCBwYXJhbXMsIHJlc3BvbnNlSGFuZGxlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzdWJzY3JpcHRpb25cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhlIHN1YnNjcmlwdGlvbiBpcyBhIHBlcnNpc3RlbnQgY29tbXVuaWNhdGlvbiBjaGFubmVsIGJldHdlZW5cbiAgICAgKiBjbGllbnQgYW5kIEV2ZXJzY2FsZSBOZXR3b3JrLlxuICAgICAqXG4gICAgICogIyMjIEltcG9ydGFudCBOb3RlcyBvbiBTdWJzY3JpcHRpb25zXG4gICAgICpcbiAgICAgKiBVbmZvcnR1bmF0ZWx5IHNvbWV0aW1lcyB0aGUgY29ubmVjdGlvbiB3aXRoIHRoZSBuZXR3b3JrIGJyZWFrZXMgZG93bi5cbiAgICAgKiBJbiB0aGlzIHNpdHVhdGlvbiB0aGUgbGlicmFyeSBhdHRlbXB0cyB0byByZWNvbm5lY3QgdG8gdGhlIG5ldHdvcmsuXG4gICAgICogVGhpcyByZWNvbm5lY3Rpb24gc2VxdWVuY2UgY2FuIHRha2Ugc2lnbmlmaWNhbnQgdGltZS5cbiAgICAgKiBBbGwgb2YgdGhpcyB0aW1lIHRoZSBjbGllbnQgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIG5ldHdvcmsuXG4gICAgICpcbiAgICAgKiBCYWQgbmV3cyBpcyB0aGF0IGFsbCBjaGFuZ2VzIHRoYXQgaGFwcGVuZWQgd2hpbGVcbiAgICAgKiB0aGUgY2xpZW50IHdhcyBkaXNjb25uZWN0ZWQgYXJlIGxvc3QuXG4gICAgICpcbiAgICAgKiBHb29kIG5ld3MgaXMgdGhhdCB0aGUgY2xpZW50IHJlcG9ydCBlcnJvcnMgdG8gdGhlIGNhbGxiYWNrIHdoZW5cbiAgICAgKiBpdCBsb3NlcyBhbmQgcmVzdW1lcyBjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogU28sIGlmIHRoZSBsb3N0IGNoYW5nZXMgYXJlIGltcG9ydGFudCB0byB0aGUgYXBwbGljYXRpb24gdGhlblxuICAgICAqIHRoZSBhcHBsaWNhdGlvbiBtdXN0IGhhbmRsZSB0aGVzZSBlcnJvciByZXBvcnRzLlxuICAgICAqXG4gICAgICogTGlicmFyeSByZXBvcnRzIGVycm9ycyB3aXRoIGByZXNwb25zZVR5cGVgID09IDEwMVxuICAgICAqIGFuZCB0aGUgZXJyb3Igb2JqZWN0IHBhc3NlZCB2aWEgYHBhcmFtc2AuXG4gICAgICpcbiAgICAgKiBXaGVuIHRoZSBsaWJyYXJ5IGhhcyBzdWNjZXNzZnVsbHkgcmVjb25uZWN0ZWRcbiAgICAgKiB0aGUgYXBwbGljYXRpb24gcmVjZWl2ZXMgY2FsbGJhY2sgd2l0aFxuICAgICAqIGByZXNwb25zZVR5cGVgID09IDEwMSBhbmQgYHBhcmFtcy5jb2RlYCA9PSA2MTQgKE5ldHdvcmtNb2R1bGVSZXN1bWVkKS5cbiAgICAgKlxuICAgICAqIEFwcGxpY2F0aW9uIGNhbiB1c2Ugc2V2ZXJhbCB3YXlzIHRvIGhhbmRsZSB0aGlzIHNpdHVhdGlvbjpcbiAgICAgKiAtIElmIGFwcGxpY2F0aW9uIG1vbml0b3JzIGNoYW5nZXMgZm9yIHRoZSBzaW5nbGVcbiAgICAgKiBvYmplY3QgKGZvciBleGFtcGxlIHNwZWNpZmljIGFjY291bnQpOiAgYXBwbGljYXRpb25cbiAgICAgKiBjYW4gcGVyZm9ybSBhIHF1ZXJ5IGZvciB0aGlzIG9iamVjdCBhbmQgaGFuZGxlIGFjdHVhbCBkYXRhIGFzIGFcbiAgICAgKiByZWd1bGFyIGRhdGEgZnJvbSB0aGUgc3Vic2NyaXB0aW9uLlxuICAgICAqIC0gSWYgYXBwbGljYXRpb24gbW9uaXRvcnMgc2VxdWVuY2Ugb2Ygc29tZSBvYmplY3RzXG4gICAgICogKGZvciBleGFtcGxlIHRyYW5zYWN0aW9ucyBvZiB0aGUgc3BlY2lmaWMgYWNjb3VudCk6IGFwcGxpY2F0aW9uIG11c3RcbiAgICAgKiByZWZyZXNoIGFsbCBjYWNoZWQgKG9yIHZpc2libGUgdG8gdXNlcikgbGlzdHMgd2hlcmUgdGhpcyBzZXF1ZW5jZXMgcHJlc2VudHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mU3Vic2NyaWJlfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZlN1YnNjcmliZUNvbGxlY3Rpb25cbiAgICAgKi9cbiAgICBzdWJzY3JpYmUocGFyYW1zLCByZXNwb25zZUhhbmRsZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ25ldC5zdWJzY3JpYmUnLCBwYXJhbXMsIHJlc3BvbnNlSGFuZGxlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN1c3BlbmRzIG5ldHdvcmsgbW9kdWxlIHRvIHN0b3AgYW55IG5ldHdvcmsgYWN0aXZpdHlcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHN1c3BlbmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuc3VzcGVuZCcpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXN1bWVzIG5ldHdvcmsgbW9kdWxlIHRvIGVuYWJsZSBuZXR3b3JrIGFjdGl2aXR5XG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICByZXN1bWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQucmVzdW1lJyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgSUQgb2YgdGhlIGxhc3QgYmxvY2sgaW4gYSBzcGVjaWZpZWQgYWNjb3VudCBzaGFyZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkZpbmRMYXN0U2hhcmRCbG9ja30gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZGaW5kTGFzdFNoYXJkQmxvY2tcbiAgICAgKi9cbiAgICBmaW5kX2xhc3Rfc2hhcmRfYmxvY2socGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuZmluZF9sYXN0X3NoYXJkX2Jsb2NrJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgdGhlIGxpc3Qgb2YgYWx0ZXJuYXRpdmUgZW5kcG9pbnRzIGZyb20gc2VydmVyXG4gICAgICogQHJldHVybnMgRW5kcG9pbnRzU2V0XG4gICAgICovXG4gICAgZmV0Y2hfZW5kcG9pbnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0LmZldGNoX2VuZHBvaW50cycpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBsaXN0IG9mIGVuZHBvaW50cyB0byB1c2Ugb24gcmVpbml0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VuZHBvaW50c1NldH0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBzZXRfZW5kcG9pbnRzKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0LnNldF9lbmRwb2ludHMnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0cyB0aGUgbGlzdCBvZiBhbHRlcm5hdGl2ZSBlbmRwb2ludHMgZnJvbSBzZXJ2ZXJcbiAgICAgKiBAcmV0dXJucyBSZXN1bHRPZkdldEVuZHBvaW50c1xuICAgICAqL1xuICAgIGdldF9lbmRwb2ludHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuZ2V0X2VuZHBvaW50cycpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGxvd3MgdG8gcXVlcnkgYW5kIHBhZ2luYXRlIHRocm91Z2ggdGhlIGxpc3Qgb2YgYWNjb3VudHMgdGhhdCB0aGUgc3BlY2lmaWVkIGFjY291bnQgaGFzIGludGVyYWN0ZWQgd2l0aCwgc29ydGVkIGJ5IHRoZSB0aW1lIG9mIHRoZSBsYXN0IGludGVybmFsIG1lc3NhZ2UgYmV0d2VlbiBhY2NvdW50c1xuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiAqQXR0ZW50aW9uKiB0aGlzIHF1ZXJ5IHJldHJpZXZlcyBkYXRhIGZyb20gJ0NvdW50ZXJwYXJ0aWVzJyBzZXJ2aWNlIHdoaWNoIGlzIG5vdCBzdXBwb3J0ZWQgaW5cbiAgICAgKiB0aGUgb3BlbnNvdXJjZSB2ZXJzaW9uIG9mIERBcHAgU2VydmVyIChhbmQgd2lsbCBub3QgYmUgc3VwcG9ydGVkKSBhcyB3ZWxsIGFzIGluIEV2ZXJub2RlIFNFICh3aWxsIGJlIHN1cHBvcnRlZCBpbiBTRSBpbiBmdXR1cmUpLFxuICAgICAqIGJ1dCBpcyBhbHdheXMgYWNjZXNzaWJsZSB2aWEgW0VWRVIgT1MgQ2xvdWRzXSguLi90b24tb3MtYXBpL25ldHdvcmtzLm1kKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlF1ZXJ5Q291bnRlcnBhcnRpZXN9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mUXVlcnlDb2xsZWN0aW9uXG4gICAgICovXG4gICAgcXVlcnlfY291bnRlcnBhcnRpZXMocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQucXVlcnlfY291bnRlcnBhcnRpZXMnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdHJlZSBvZiB0cmFuc2FjdGlvbnMgdHJpZ2dlcmVkIGJ5IGEgc3BlY2lmaWMgbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUGVyZm9ybXMgcmVjdXJzaXZlIHJldHJpZXZhbCBvZiBhIHRyYW5zYWN0aW9ucyB0cmVlIHByb2R1Y2VkIGJ5IGEgc3BlY2lmaWMgbWVzc2FnZTpcbiAgICAgKiBpbl9tc2cgLT4gZHN0X3RyYW5zYWN0aW9uIC0+IG91dF9tZXNzYWdlcyAtPiBkc3RfdHJhbnNhY3Rpb24gLT4gLi4uXG4gICAgICogSWYgdGhlIGNoYWluIG9mIHRyYW5zYWN0aW9ucyBleGVjdXRpb24gaXMgaW4gcHJvZ3Jlc3Mgd2hpbGUgdGhlIGZ1bmN0aW9uIGlzIHJ1bm5pbmcsXG4gICAgICogaXQgd2lsbCB3YWl0IGZvciB0aGUgbmV4dCB0cmFuc2FjdGlvbnMgdG8gYXBwZWFyIHVudGlsIHRoZSBmdWxsIHRyZWUgb3IgbW9yZSB0aGFuIDUwIHRyYW5zYWN0aW9uc1xuICAgICAqIGFyZSByZWNlaXZlZC5cbiAgICAgKlxuICAgICAqIEFsbCB0aGUgcmV0cmlldmVkIG1lc3NhZ2VzIGFuZCB0cmFuc2FjdGlvbnMgYXJlIGluY2x1ZGVkXG4gICAgICogaW50byBgcmVzdWx0Lm1lc3NhZ2VzYCBhbmQgYHJlc3VsdC50cmFuc2FjdGlvbnNgIHJlc3BlY3RpdmVseS5cbiAgICAgKlxuICAgICAqIEZ1bmN0aW9uIHJlYWRzIHRyYW5zYWN0aW9ucyBsYXllciBieSBsYXllciwgYnkgcGFnZXMgb2YgMjAgdHJhbnNhY3Rpb25zLlxuICAgICAqXG4gICAgICogVGhlIHJldHJpZXZhbCBwcm9zZXNzIGdvZXMgbGlrZSB0aGlzOlxuICAgICAqIExldCdzIGFzc3VtZSB3ZSBoYXZlIGFuIGluZmluaXRlIGNoYWluIG9mIHRyYW5zYWN0aW9ucyBhbmQgZWFjaCB0cmFuc2FjdGlvbiBnZW5lcmF0ZXMgNSBtZXNzYWdlcy5cbiAgICAgKiAxLiBSZXRyaWV2ZSAxc3QgbWVzc2FnZSAoaW5wdXQgcGFyYW1ldGVyKSBhbmQgY29ycmVzcG9uZGluZyB0cmFuc2FjdGlvbiAtIHB1dCBpdCBpbnRvIHJlc3VsdC5cbiAgICAgKiBJdCBpcyB0aGUgZmlyc3QgbGV2ZWwgb2YgdGhlIHRyZWUgb2YgdHJhbnNhY3Rpb25zIC0gaXRzIHJvb3QuXG4gICAgICogUmV0cmlldmUgNSBvdXQgbWVzc2FnZSBpZHMgZnJvbSB0aGUgdHJhbnNhY3Rpb24gZm9yIG5leHQgc3RlcHMuXG4gICAgICogMi4gUmV0cmlldmUgNSBtZXNzYWdlcyBhbmQgY29ycmVzcG9uZGluZyB0cmFuc2FjdGlvbnMgb24gdGhlIDJuZCBsYXllci4gUHV0IHRoZW0gaW50byByZXN1bHQuXG4gICAgICogUmV0cmlldmUgNSo1IG91dCBtZXNzYWdlIGlkcyBmcm9tIHRoZXNlIHRyYW5zYWN0aW9ucyBmb3IgbmV4dCBzdGVwc1xuICAgICAqIDMuIFJldHJpZXZlIDIwIChzaXplIG9mIHRoZSBwYWdlKSBtZXNzYWdlcyBhbmQgdHJhbnNhY3Rpb25zICgzcmQgbGF5ZXIpIGFuZCAyMCo1PTEwMCBtZXNzYWdlIGlkcyAoNHRoIGxheWVyKS5cbiAgICAgKiA0LiBSZXRyaWV2ZSB0aGUgbGFzdCA1IG1lc3NhZ2VzIGFuZCA1IHRyYW5zYWN0aW9ucyBvbiB0aGUgM3JkIGxheWVyICsgMTUgbWVzc2FnZXMgYW5kIHRyYW5zYWN0aW9ucyAob2YgMTAwKSBmcm9tIHRoZSA0dGggbGF5ZXJcbiAgICAgKiArIDI1IG1lc3NhZ2UgaWRzIG9mIHRoZSA0dGggbGF5ZXIgKyA3NSBtZXNzYWdlIGlkcyBvZiB0aGUgNXRoIGxheWVyLlxuICAgICAqIDUuIFJldHJpZXZlIDIwIG1vcmUgbWVzc2FnZXMgYW5kIDIwIG1vcmUgdHJhbnNhY3Rpb25zIG9mIHRoZSA0dGggbGF5ZXIgKyAxMDAgbW9yZSBtZXNzYWdlIGlkcyBvZiB0aGUgNXRoIGxheWVyLlxuICAgICAqIDYuIE5vdyB3ZSBoYXZlIDErNSsyMCsyMCsyMCA9IDY2IHRyYW5zYWN0aW9ucywgd2hpY2ggaXMgbW9yZSB0aGFuIDUwLiBGdW5jdGlvbiBleGl0cyB3aXRoIHRoZSB0cmVlIG9mXG4gICAgICogMW0tPjF0LT41bS0+NXQtPjI1bS0+MjV0LT4zNW0tPjM1dC4gSWYgd2Ugc2VlIGFueSBtZXNzYWdlIGlkcyBpbiB0aGUgbGFzdCB0cmFuc2FjdGlvbnMgb3V0X21zZ3MsIHdoaWNoIGRvbid0IGhhdmVcbiAgICAgKiBjb3JyZXNwb25kaW5nIG1lc3NhZ2VzIGluIHRoZSBmdW5jdGlvbiByZXN1bHQsIGl0IG1lYW5zIHRoYXQgdGhlIGZ1bGwgdHJlZSB3YXMgbm90IHJlY2VpdmVkIGFuZCB3ZSBuZWVkIHRvIGNvbnRpbnVlIGl0ZXJhdGlvbi5cbiAgICAgKlxuICAgICAqIFRvIHN1bW1hcml6ZSwgaXQgaXMgZ3VhcmFudGVlZCB0aGF0IGVhY2ggbWVzc2FnZSBpbiBgcmVzdWx0Lm1lc3NhZ2VzYCBoYXMgdGhlIGNvcnJlc3BvbmRpbmcgdHJhbnNhY3Rpb25cbiAgICAgKiBpbiB0aGUgYHJlc3VsdC50cmFuc2FjdGlvbnNgLlxuICAgICAqIEJ1dCB0aGVyZSBpcyBubyBndWFyYW50ZWUgdGhhdCBhbGwgbWVzc2FnZXMgZnJvbSB0cmFuc2FjdGlvbnMgYG91dF9tc2dzYCBhcmVcbiAgICAgKiBwcmVzZW50ZWQgaW4gYHJlc3VsdC5tZXNzYWdlc2AuXG4gICAgICogU28gdGhlIGFwcGxpY2F0aW9uIGhhcyB0byBjb250aW51ZSByZXRyaWV2YWwgZm9yIG1pc3NpbmcgbWVzc2FnZXMgaWYgaXQgcmVxdWlyZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mUXVlcnlUcmFuc2FjdGlvblRyZWV9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlc3VsdE9mUXVlcnlUcmFuc2FjdGlvblRyZWVcbiAgICAgKi9cbiAgICBxdWVyeV90cmFuc2FjdGlvbl90cmVlKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0LnF1ZXJ5X3RyYW5zYWN0aW9uX3RyZWUnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGJsb2NrIGl0ZXJhdG9yLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBCbG9jayBpdGVyYXRvciB1c2VzIHJvYnVzdCBpdGVyYXRpb24gbWV0aG9kcyB0aGF0IGd1YXJhbnRpZXMgdGhhdCBldmVyeVxuICAgICAqIGJsb2NrIGluIHRoZSBzcGVjaWZpZWQgcmFuZ2UgaXNuJ3QgbWlzc2VkIG9yIGl0ZXJhdGVkIHR3aWNlLlxuICAgICAqXG4gICAgICogSXRlcmF0ZWQgcmFuZ2UgY2FuIGJlIHJlZHVjZWQgd2l0aCBzb21lIGZpbHRlcnM6XG4gICAgICogLSBgc3RhcnRfdGltZWAg4oCTIHRoZSBib3R0b20gdGltZSByYW5nZS4gT25seSBibG9ja3Mgd2l0aCBgZ2VuX3V0aW1lYFxuICAgICAqIG1vcmUgb3IgZXF1YWwgdG8gdGhpcyB2YWx1ZSBpcyBpdGVyYXRlZC4gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCB0aGVuIHRoZXJlIGlzXG4gICAgICogbm8gYm90dG9tIHRpbWUgZWRnZSwgc28gYWxsIGJsb2NrcyBzaW5jZSB6ZXJvIHN0YXRlIGlzIGl0ZXJhdGVkLlxuICAgICAqIC0gYGVuZF90aW1lYCDigJMgdGhlIHVwcGVyIHRpbWUgcmFuZ2UuIE9ubHkgYmxvY2tzIHdpdGggYGdlbl91dGltZWBcbiAgICAgKiBsZXNzIHRoZW4gdGhpcyB2YWx1ZSBpcyBpdGVyYXRlZC4gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCB0aGVuIHRoZXJlIGlzXG4gICAgICogbm8gdXBwZXIgdGltZSBlZGdlLCBzbyBpdGVyYXRvciBuZXZlciBmaW5pc2hlcy5cbiAgICAgKiAtIGBzaGFyZF9maWx0ZXJgIOKAkyB3b3JrY2hhaW5zIGFuZCBzaGFyZCBwcmVmaXhlcyB0aGF0IHJlZHVjZSB0aGUgc2V0IG9mIGludGVyZXN0aW5nXG4gICAgICogYmxvY2tzLiBCbG9jayBjb25mb3JtcyB0byB0aGUgc2hhcmQgZmlsdGVyIGlmIGl0IGJlbG9uZ3MgdG8gdGhlIGZpbHRlciB3b3JrY2hhaW5cbiAgICAgKiBhbmQgdGhlIGZpcnN0IGJpdHMgb2YgYmxvY2sncyBgc2hhcmRgIGZpZWxkcyBtYXRjaGVzIHRvIHRoZSBzaGFyZCBwcmVmaXguXG4gICAgICogT25seSBibG9ja3Mgd2l0aCBzdWl0YWJsZSBzaGFyZCBhcmUgaXRlcmF0ZWQuXG4gICAgICpcbiAgICAgKiBJdGVtcyBpdGVyYXRlZCBpcyBhIEpTT04gb2JqZWN0cyB3aXRoIGJsb2NrIGRhdGEuIFRoZSBtaW5pbWFsIHNldCBvZiByZXR1cm5lZFxuICAgICAqIGZpZWxkcyBpczpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogaWRcbiAgICAgKiBnZW5fdXRpbWVcbiAgICAgKiB3b3JrY2hhaW5faWRcbiAgICAgKiBzaGFyZFxuICAgICAqIGFmdGVyX3NwbGl0XG4gICAgICogYWZ0ZXJfbWVyZ2VcbiAgICAgKiBwcmV2X3JlZiB7XG4gICAgICogICAgIHJvb3RfaGFzaFxuICAgICAqIH1cbiAgICAgKiBwcmV2X2FsdF9yZWYge1xuICAgICAqICAgICByb290X2hhc2hcbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICogQXBwbGljYXRpb24gY2FuIHJlcXVlc3QgYWRkaXRpb25hbCBmaWVsZHMgaW4gdGhlIGByZXN1bHRgIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEFwcGxpY2F0aW9uIHNob3VsZCBjYWxsIHRoZSBgcmVtb3ZlX2l0ZXJhdG9yYCB3aGVuIGl0ZXJhdG9yIGlzIG5vIGxvbmdlciByZXF1aXJlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZDcmVhdGVCbG9ja0l0ZXJhdG9yfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZWdpc3RlcmVkSXRlcmF0b3JcbiAgICAgKi9cbiAgICBjcmVhdGVfYmxvY2tfaXRlcmF0b3IocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQuY3JlYXRlX2Jsb2NrX2l0ZXJhdG9yJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVzdW1lcyBibG9jayBpdGVyYXRvci5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhlIGl0ZXJhdG9yIHN0YXlzIGV4YWN0bHkgYXQgdGhlIHNhbWUgcG9zaXRpb24gd2hlcmUgdGhlIGByZXN1bWVfc3RhdGVgIHdhcyBjYXRjaGVkLlxuICAgICAqXG4gICAgICogQXBwbGljYXRpb24gc2hvdWxkIGNhbGwgdGhlIGByZW1vdmVfaXRlcmF0b3JgIHdoZW4gaXRlcmF0b3IgaXMgbm8gbG9uZ2VyIHJlcXVpcmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlJlc3VtZUJsb2NrSXRlcmF0b3J9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlZ2lzdGVyZWRJdGVyYXRvclxuICAgICAqL1xuICAgIHJlc3VtZV9ibG9ja19pdGVyYXRvcihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ25ldC5yZXN1bWVfYmxvY2tfaXRlcmF0b3InLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRyYW5zYWN0aW9uIGl0ZXJhdG9yLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUcmFuc2FjdGlvbiBpdGVyYXRvciB1c2VzIHJvYnVzdCBpdGVyYXRpb24gbWV0aG9kcyB0aGF0IGd1YXJhbnR5IHRoYXQgZXZlcnlcbiAgICAgKiB0cmFuc2FjdGlvbiBpbiB0aGUgc3BlY2lmaWVkIHJhbmdlIGlzbid0IG1pc3NlZCBvciBpdGVyYXRlZCB0d2ljZS5cbiAgICAgKlxuICAgICAqIEl0ZXJhdGVkIHJhbmdlIGNhbiBiZSByZWR1Y2VkIHdpdGggc29tZSBmaWx0ZXJzOlxuICAgICAqIC0gYHN0YXJ0X3RpbWVgIOKAkyB0aGUgYm90dG9tIHRpbWUgcmFuZ2UuIE9ubHkgdHJhbnNhY3Rpb25zIHdpdGggYG5vd2BcbiAgICAgKiBtb3JlIG9yIGVxdWFsIHRvIHRoaXMgdmFsdWUgYXJlIGl0ZXJhdGVkLiBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkIHRoZW4gdGhlcmUgaXNcbiAgICAgKiBubyBib3R0b20gdGltZSBlZGdlLCBzbyBhbGwgdGhlIHRyYW5zYWN0aW9ucyBzaW5jZSB6ZXJvIHN0YXRlIGFyZSBpdGVyYXRlZC5cbiAgICAgKiAtIGBlbmRfdGltZWAg4oCTIHRoZSB1cHBlciB0aW1lIHJhbmdlLiBPbmx5IHRyYW5zYWN0aW9ucyB3aXRoIGBub3dgXG4gICAgICogbGVzcyB0aGVuIHRoaXMgdmFsdWUgYXJlIGl0ZXJhdGVkLiBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkIHRoZW4gdGhlcmUgaXNcbiAgICAgKiBubyB1cHBlciB0aW1lIGVkZ2UsIHNvIGl0ZXJhdG9yIG5ldmVyIGZpbmlzaGVzLlxuICAgICAqIC0gYHNoYXJkX2ZpbHRlcmAg4oCTIHdvcmtjaGFpbnMgYW5kIHNoYXJkIHByZWZpeGVzIHRoYXQgcmVkdWNlIHRoZSBzZXQgb2YgaW50ZXJlc3RpbmdcbiAgICAgKiBhY2NvdW50cy4gQWNjb3VudCBhZGRyZXNzIGNvbmZvcm1zIHRvIHRoZSBzaGFyZCBmaWx0ZXIgaWZcbiAgICAgKiBpdCBiZWxvbmdzIHRvIHRoZSBmaWx0ZXIgd29ya2NoYWluIGFuZCB0aGUgZmlyc3QgYml0cyBvZiBhZGRyZXNzIG1hdGNoIHRvXG4gICAgICogdGhlIHNoYXJkIHByZWZpeC4gT25seSB0cmFuc2FjdGlvbnMgd2l0aCBzdWl0YWJsZSBhY2NvdW50IGFkZHJlc3NlcyBhcmUgaXRlcmF0ZWQuXG4gICAgICogLSBgYWNjb3VudHNfZmlsdGVyYCDigJMgc2V0IG9mIGFjY291bnQgYWRkcmVzc2VzIHdob3NlIHRyYW5zYWN0aW9ucyBtdXN0IGJlIGl0ZXJhdGVkLlxuICAgICAqIE5vdGUgdGhhdCBhY2NvdW50cyBmaWx0ZXIgY2FuIGNvbmZsaWN0IHdpdGggc2hhcmQgZmlsdGVyIHNvIGFwcGxpY2F0aW9uIG11c3QgY29tYmluZVxuICAgICAqIHRoZXNlIGZpbHRlcnMgY2FyZWZ1bGx5LlxuICAgICAqXG4gICAgICogSXRlcmF0ZWQgaXRlbSBpcyBhIEpTT04gb2JqZWN0cyB3aXRoIHRyYW5zYWN0aW9uIGRhdGEuIFRoZSBtaW5pbWFsIHNldCBvZiByZXR1cm5lZFxuICAgICAqIGZpZWxkcyBpczpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogaWRcbiAgICAgKiBhY2NvdW50X2FkZHJcbiAgICAgKiBub3dcbiAgICAgKiBiYWxhbmNlX2RlbHRhKGZvcm1hdDpERUMpXG4gICAgICogYm91bmNlIHsgYm91bmNlX3R5cGUgfVxuICAgICAqIGluX21lc3NhZ2Uge1xuICAgICAqICAgICBpZFxuICAgICAqICAgICB2YWx1ZShmb3JtYXQ6REVDKVxuICAgICAqICAgICBtc2dfdHlwZVxuICAgICAqICAgICBzcmNcbiAgICAgKiB9XG4gICAgICogb3V0X21lc3NhZ2VzIHtcbiAgICAgKiAgICAgaWRcbiAgICAgKiAgICAgdmFsdWUoZm9ybWF0OkRFQylcbiAgICAgKiAgICAgbXNnX3R5cGVcbiAgICAgKiAgICAgZHN0XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqIEFwcGxpY2F0aW9uIGNhbiByZXF1ZXN0IGFuIGFkZGl0aW9uYWwgZmllbGRzIGluIHRoZSBgcmVzdWx0YCBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBBbm90aGVyIHBhcmFtZXRlciB0aGF0IGFmZmVjdHMgb24gdGhlIHJldHVybmVkIGZpZWxkcyBpcyB0aGUgYGluY2x1ZGVfdHJhbnNmZXJzYC5cbiAgICAgKiBXaGVuIHRoaXMgcGFyYW1ldGVyIGlzIGB0cnVlYCB0aGUgaXRlcmF0b3IgY29tcHV0ZXMgYW5kIGFkZHMgYHRyYW5zZmVyYCBmaWVsZCBjb250YWluaW5nXG4gICAgICogbGlzdCBvZiB0aGUgdXNlZnVsIGBUcmFuc2FjdGlvblRyYW5zZmVyYCBvYmplY3RzLlxuICAgICAqIEVhY2ggdHJhbnNmZXIgaXMgY2FsY3VsYXRlZCBmcm9tIHRoZSBwYXJ0aWN1bGFyIG1lc3NhZ2UgcmVsYXRlZCB0byB0aGUgdHJhbnNhY3Rpb25cbiAgICAgKiBhbmQgaGFzIHRoZSBmb2xsb3dpbmcgc3RydWN0dXJlOlxuICAgICAqIC0gbWVzc2FnZSDigJMgc291cmNlIG1lc3NhZ2UgaWRlbnRpZmllci5cbiAgICAgKiAtIGlzQm91bmNlZCDigJMgaW5kaWNhdGVzIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJvdW5jZWQsIHdoaWNoIG1lYW5zIHRoZSB2YWx1ZSB3aWxsIGJlIHJldHVybmVkIGJhY2sgdG8gdGhlIHNlbmRlci5cbiAgICAgKiAtIGlzRGVwb3NpdCDigJMgaW5kaWNhdGVzIHRoYXQgdGhpcyB0cmFuc2ZlciBpcyB0aGUgZGVwb3NpdCAodHJ1ZSkgb3Igd2l0aGRyYXcgKGZhbHNlKS5cbiAgICAgKiAtIGNvdW50ZXJwYXJ0eSDigJMgYWNjb3VudCBhZGRyZXNzIG9mIHRoZSB0cmFuc2ZlciBzb3VyY2Ugb3IgZGVzdGluYXRpb24gZGVwZW5kaW5nIG9uIGBpc0RlcG9zaXRgLlxuICAgICAqIC0gdmFsdWUg4oCTIGFtb3VudCBvZiBuYW5vIHRva2VucyB0cmFuc2ZlcnJlZC4gVGhlIHZhbHVlIGlzIHJlcHJlc2VudGVkIGFzIGEgZGVjaW1hbCBzdHJpbmdcbiAgICAgKiBiZWNhdXNlIHRoZSBhY3R1YWwgdmFsdWUgY2FuIGJlIG1vcmUgcHJlY2lzZSB0aGFuIHRoZSBKU09OIG51bWJlciBjYW4gcmVwcmVzZW50LiBBcHBsaWNhdGlvblxuICAgICAqIG11c3QgdXNlIHRoaXMgc3RyaW5nIGNhcmVmdWxseSDigJMgY29udmVyc2lvbiB0byBudW1iZXIgY2FuIGZvbGxvdyB0byBsb29zZSBvZiBwcmVjaXNpb24uXG4gICAgICpcbiAgICAgKiBBcHBsaWNhdGlvbiBzaG91bGQgY2FsbCB0aGUgYHJlbW92ZV9pdGVyYXRvcmAgd2hlbiBpdGVyYXRvciBpcyBubyBsb25nZXIgcmVxdWlyZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mQ3JlYXRlVHJhbnNhY3Rpb25JdGVyYXRvcn0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVnaXN0ZXJlZEl0ZXJhdG9yXG4gICAgICovXG4gICAgY3JlYXRlX3RyYW5zYWN0aW9uX2l0ZXJhdG9yKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0LmNyZWF0ZV90cmFuc2FjdGlvbl9pdGVyYXRvcicsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlc3VtZXMgdHJhbnNhY3Rpb24gaXRlcmF0b3IuXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoZSBpdGVyYXRvciBzdGF5cyBleGFjdGx5IGF0IHRoZSBzYW1lIHBvc2l0aW9uIHdoZXJlIHRoZSBgcmVzdW1lX3N0YXRlYCB3YXMgY2F1Z2h0LlxuICAgICAqIE5vdGUgdGhhdCBgcmVzdW1lX3N0YXRlYCBkb2Vzbid0IHN0b3JlIHRoZSBhY2NvdW50IGZpbHRlci4gSWYgdGhlIGFwcGxpY2F0aW9uIHJlcXVpcmVzXG4gICAgICogdG8gdXNlIHRoZSBzYW1lIGFjY291bnQgZmlsdGVyIGFzIGl0IHdhcyB3aGVuIHRoZSBpdGVyYXRvciB3YXMgY3JlYXRlZCB0aGVuIHRoZSBhcHBsaWNhdGlvblxuICAgICAqIG11c3QgcGFzcyB0aGUgYWNjb3VudCBmaWx0ZXIgYWdhaW4gaW4gYGFjY291bnRzX2ZpbHRlcmAgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQXBwbGljYXRpb24gc2hvdWxkIGNhbGwgdGhlIGByZW1vdmVfaXRlcmF0b3JgIHdoZW4gaXRlcmF0b3IgaXMgbm8gbG9uZ2VyIHJlcXVpcmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZlJlc3VtZVRyYW5zYWN0aW9uSXRlcmF0b3J9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zIFJlZ2lzdGVyZWRJdGVyYXRvclxuICAgICAqL1xuICAgIHJlc3VtZV90cmFuc2FjdGlvbl9pdGVyYXRvcihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ25ldC5yZXN1bWVfdHJhbnNhY3Rpb25faXRlcmF0b3InLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIG5leHQgYXZhaWxhYmxlIGl0ZW1zLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBJbiBhZGRpdGlvbiB0byBhdmFpbGFibGUgaXRlbXMgdGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBgaGFzX21vcmVgIGZsYWdcbiAgICAgKiBpbmRpY2F0aW5nIHRoYXQgdGhlIGl0ZXJhdG9yIGlzbid0IHJlYWNoIHRoZSBlbmQgb2YgdGhlIGl0ZXJhdGVkIHJhbmdlIHlldC5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gY2FuIHJldHVybiB0aGUgZW1wdHkgbGlzdCBvZiBhdmFpbGFibGUgaXRlbXMgYnV0XG4gICAgICogaW5kaWNhdGVzIHRoYXQgdGhlcmUgYXJlIG1vcmUgaXRlbXMgaXMgYXZhaWxhYmxlLlxuICAgICAqIFRoaXMgc2l0dWF0aW9uIGFwcGVhcnMgd2hlbiB0aGUgaXRlcmF0b3IgZG9lc24ndCByZWFjaCBpdGVyYXRlZCByYW5nZVxuICAgICAqIGJ1dCBkYXRhYmFzZSBkb2Vzbid0IGNvbnRhaW5zIGF2YWlsYWJsZSBpdGVtcyB5ZXQuXG4gICAgICpcbiAgICAgKiBJZiBhcHBsaWNhdGlvbiByZXF1ZXN0cyByZXN1bWUgc3RhdGUgaW4gYHJldHVybl9yZXN1bWVfc3RhdGVgIHBhcmFtZXRlclxuICAgICAqIHRoZW4gdGhpcyBmdW5jdGlvbiByZXR1cm5zIGByZXN1bWVfc3RhdGVgIHRoYXQgY2FuIGJlIHVzZWQgbGF0ZXIgdG9cbiAgICAgKiByZXN1bWUgdGhlIGl0ZXJhdGlvbiBmcm9tIHRoZSBwb3NpdGlvbiBhZnRlciByZXR1cm5lZCBpdGVtcy5cbiAgICAgKlxuICAgICAqIFRoZSBzdHJ1Y3R1cmUgb2YgdGhlIGl0ZW1zIHJldHVybmVkIGRlcGVuZHMgb24gdGhlIGl0ZXJhdG9yIHVzZWQuXG4gICAgICogU2VlIHRoZSBkZXNjcmlwdGlvbiB0byB0aGUgYXBwcm9wcmlhdGVkIGl0ZXJhdG9yIGNyZWF0aW9uIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkl0ZXJhdG9yTmV4dH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZJdGVyYXRvck5leHRcbiAgICAgKi9cbiAgICBpdGVyYXRvcl9uZXh0KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnbmV0Lml0ZXJhdG9yX25leHQnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFuIGl0ZXJhdG9yXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIEZyZWVzIGFsbCByZXNvdXJjZXMgYWxsb2NhdGVkIGluIGxpYnJhcnkgdG8gc2VydmUgaXRlcmF0b3IuXG4gICAgICpcbiAgICAgKiBBcHBsaWNhdGlvbiBhbHdheXMgc2hvdWxkIGNhbGwgdGhlIGByZW1vdmVfaXRlcmF0b3JgIHdoZW4gaXRlcmF0b3JcbiAgICAgKiBpcyBubyBsb25nZXIgcmVxdWlyZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1JlZ2lzdGVyZWRJdGVyYXRvcn0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICByZW1vdmVfaXRlcmF0b3IocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCduZXQucmVtb3ZlX2l0ZXJhdG9yJywgcGFyYW1zKTtcbiAgICB9XG59XG5leHBvcnRzLk5ldE1vZHVsZSA9IE5ldE1vZHVsZTtcbi8vIGRlYm90IG1vZHVsZVxudmFyIERlYm90RXJyb3JDb2RlO1xuKGZ1bmN0aW9uIChEZWJvdEVycm9yQ29kZSkge1xuICAgIERlYm90RXJyb3JDb2RlW0RlYm90RXJyb3JDb2RlW1wiRGVib3RTdGFydEZhaWxlZFwiXSA9IDgwMV0gPSBcIkRlYm90U3RhcnRGYWlsZWRcIjtcbiAgICBEZWJvdEVycm9yQ29kZVtEZWJvdEVycm9yQ29kZVtcIkRlYm90RmV0Y2hGYWlsZWRcIl0gPSA4MDJdID0gXCJEZWJvdEZldGNoRmFpbGVkXCI7XG4gICAgRGVib3RFcnJvckNvZGVbRGVib3RFcnJvckNvZGVbXCJEZWJvdEV4ZWN1dGlvbkZhaWxlZFwiXSA9IDgwM10gPSBcIkRlYm90RXhlY3V0aW9uRmFpbGVkXCI7XG4gICAgRGVib3RFcnJvckNvZGVbRGVib3RFcnJvckNvZGVbXCJEZWJvdEludmFsaWRIYW5kbGVcIl0gPSA4MDRdID0gXCJEZWJvdEludmFsaWRIYW5kbGVcIjtcbiAgICBEZWJvdEVycm9yQ29kZVtEZWJvdEVycm9yQ29kZVtcIkRlYm90SW52YWxpZEpzb25QYXJhbXNcIl0gPSA4MDVdID0gXCJEZWJvdEludmFsaWRKc29uUGFyYW1zXCI7XG4gICAgRGVib3RFcnJvckNvZGVbRGVib3RFcnJvckNvZGVbXCJEZWJvdEludmFsaWRGdW5jdGlvbklkXCJdID0gODA2XSA9IFwiRGVib3RJbnZhbGlkRnVuY3Rpb25JZFwiO1xuICAgIERlYm90RXJyb3JDb2RlW0RlYm90RXJyb3JDb2RlW1wiRGVib3RJbnZhbGlkQWJpXCJdID0gODA3XSA9IFwiRGVib3RJbnZhbGlkQWJpXCI7XG4gICAgRGVib3RFcnJvckNvZGVbRGVib3RFcnJvckNvZGVbXCJEZWJvdEdldE1ldGhvZEZhaWxlZFwiXSA9IDgwOF0gPSBcIkRlYm90R2V0TWV0aG9kRmFpbGVkXCI7XG4gICAgRGVib3RFcnJvckNvZGVbRGVib3RFcnJvckNvZGVbXCJEZWJvdEludmFsaWRNc2dcIl0gPSA4MDldID0gXCJEZWJvdEludmFsaWRNc2dcIjtcbiAgICBEZWJvdEVycm9yQ29kZVtEZWJvdEVycm9yQ29kZVtcIkRlYm90RXh0ZXJuYWxDYWxsRmFpbGVkXCJdID0gODEwXSA9IFwiRGVib3RFeHRlcm5hbENhbGxGYWlsZWRcIjtcbiAgICBEZWJvdEVycm9yQ29kZVtEZWJvdEVycm9yQ29kZVtcIkRlYm90QnJvd3NlckNhbGxiYWNrRmFpbGVkXCJdID0gODExXSA9IFwiRGVib3RCcm93c2VyQ2FsbGJhY2tGYWlsZWRcIjtcbiAgICBEZWJvdEVycm9yQ29kZVtEZWJvdEVycm9yQ29kZVtcIkRlYm90T3BlcmF0aW9uUmVqZWN0ZWRcIl0gPSA4MTJdID0gXCJEZWJvdE9wZXJhdGlvblJlamVjdGVkXCI7XG4gICAgRGVib3RFcnJvckNvZGVbRGVib3RFcnJvckNvZGVbXCJEZWJvdE5vQ29kZVwiXSA9IDgxM10gPSBcIkRlYm90Tm9Db2RlXCI7XG59KShEZWJvdEVycm9yQ29kZSA9IGV4cG9ydHMuRGVib3RFcnJvckNvZGUgfHwgKGV4cG9ydHMuRGVib3RFcnJvckNvZGUgPSB7fSkpO1xuZnVuY3Rpb24gZGVib3RBY3Rpdml0eVRyYW5zYWN0aW9uKG1zZywgZHN0LCBvdXQsIGZlZSwgc2V0Y29kZSwgc2lnbmtleSwgc2lnbmluZ19ib3hfaGFuZGxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1RyYW5zYWN0aW9uJyxcbiAgICAgICAgbXNnLFxuICAgICAgICBkc3QsXG4gICAgICAgIG91dCxcbiAgICAgICAgZmVlLFxuICAgICAgICBzZXRjb2RlLFxuICAgICAgICBzaWdua2V5LFxuICAgICAgICBzaWduaW5nX2JveF9oYW5kbGUsXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVib3RBY3Rpdml0eVRyYW5zYWN0aW9uID0gZGVib3RBY3Rpdml0eVRyYW5zYWN0aW9uO1xuZnVuY3Rpb24gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJMb2cobXNnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0xvZycsXG4gICAgICAgIG1zZyxcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3NlckxvZyA9IHBhcmFtc09mQXBwRGVib3RCcm93c2VyTG9nO1xuZnVuY3Rpb24gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJTd2l0Y2goY29udGV4dF9pZCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdTd2l0Y2gnLFxuICAgICAgICBjb250ZXh0X2lkLFxuICAgIH07XG59XG5leHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VyU3dpdGNoID0gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJTd2l0Y2g7XG5mdW5jdGlvbiBwYXJhbXNPZkFwcERlYm90QnJvd3NlclN3aXRjaENvbXBsZXRlZCgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnU3dpdGNoQ29tcGxldGVkJyxcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3NlclN3aXRjaENvbXBsZXRlZCA9IHBhcmFtc09mQXBwRGVib3RCcm93c2VyU3dpdGNoQ29tcGxldGVkO1xuZnVuY3Rpb24gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJTaG93QWN0aW9uKGFjdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdTaG93QWN0aW9uJyxcbiAgICAgICAgYWN0aW9uLFxuICAgIH07XG59XG5leHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VyU2hvd0FjdGlvbiA9IHBhcmFtc09mQXBwRGVib3RCcm93c2VyU2hvd0FjdGlvbjtcbmZ1bmN0aW9uIHBhcmFtc09mQXBwRGVib3RCcm93c2VySW5wdXQocHJvbXB0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0lucHV0JyxcbiAgICAgICAgcHJvbXB0LFxuICAgIH07XG59XG5leHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VySW5wdXQgPSBwYXJhbXNPZkFwcERlYm90QnJvd3NlcklucHV0O1xuZnVuY3Rpb24gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJHZXRTaWduaW5nQm94KCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdHZXRTaWduaW5nQm94JyxcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3NlckdldFNpZ25pbmdCb3ggPSBwYXJhbXNPZkFwcERlYm90QnJvd3NlckdldFNpZ25pbmdCb3g7XG5mdW5jdGlvbiBwYXJhbXNPZkFwcERlYm90QnJvd3Nlckludm9rZURlYm90KGRlYm90X2FkZHIsIGFjdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdJbnZva2VEZWJvdCcsXG4gICAgICAgIGRlYm90X2FkZHIsXG4gICAgICAgIGFjdGlvbixcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJhbXNPZkFwcERlYm90QnJvd3Nlckludm9rZURlYm90ID0gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJJbnZva2VEZWJvdDtcbmZ1bmN0aW9uIHBhcmFtc09mQXBwRGVib3RCcm93c2VyU2VuZChtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1NlbmQnLFxuICAgICAgICBtZXNzYWdlLFxuICAgIH07XG59XG5leHBvcnRzLnBhcmFtc09mQXBwRGVib3RCcm93c2VyU2VuZCA9IHBhcmFtc09mQXBwRGVib3RCcm93c2VyU2VuZDtcbmZ1bmN0aW9uIHBhcmFtc09mQXBwRGVib3RCcm93c2VyQXBwcm92ZShhY3Rpdml0eSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdBcHByb3ZlJyxcbiAgICAgICAgYWN0aXZpdHksXG4gICAgfTtcbn1cbmV4cG9ydHMucGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJBcHByb3ZlID0gcGFyYW1zT2ZBcHBEZWJvdEJyb3dzZXJBcHByb3ZlO1xuZnVuY3Rpb24gcmVzdWx0T2ZBcHBEZWJvdEJyb3dzZXJJbnB1dCh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdJbnB1dCcsXG4gICAgICAgIHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLnJlc3VsdE9mQXBwRGVib3RCcm93c2VySW5wdXQgPSByZXN1bHRPZkFwcERlYm90QnJvd3NlcklucHV0O1xuZnVuY3Rpb24gcmVzdWx0T2ZBcHBEZWJvdEJyb3dzZXJHZXRTaWduaW5nQm94KHNpZ25pbmdfYm94KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0dldFNpZ25pbmdCb3gnLFxuICAgICAgICBzaWduaW5nX2JveCxcbiAgICB9O1xufVxuZXhwb3J0cy5yZXN1bHRPZkFwcERlYm90QnJvd3NlckdldFNpZ25pbmdCb3ggPSByZXN1bHRPZkFwcERlYm90QnJvd3NlckdldFNpZ25pbmdCb3g7XG5mdW5jdGlvbiByZXN1bHRPZkFwcERlYm90QnJvd3Nlckludm9rZURlYm90KCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdJbnZva2VEZWJvdCcsXG4gICAgfTtcbn1cbmV4cG9ydHMucmVzdWx0T2ZBcHBEZWJvdEJyb3dzZXJJbnZva2VEZWJvdCA9IHJlc3VsdE9mQXBwRGVib3RCcm93c2VySW52b2tlRGVib3Q7XG5mdW5jdGlvbiByZXN1bHRPZkFwcERlYm90QnJvd3NlckFwcHJvdmUoYXBwcm92ZWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnQXBwcm92ZScsXG4gICAgICAgIGFwcHJvdmVkLFxuICAgIH07XG59XG5leHBvcnRzLnJlc3VsdE9mQXBwRGVib3RCcm93c2VyQXBwcm92ZSA9IHJlc3VsdE9mQXBwRGVib3RCcm93c2VyQXBwcm92ZTtcbmZ1bmN0aW9uIGRpc3BhdGNoQXBwRGVib3RCcm93c2VyKG9iaiwgcGFyYW1zLCBhcHBfcmVxdWVzdF9pZCwgY2xpZW50KSB7XG4gICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIHN3aXRjaCAocGFyYW1zLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdMb2cnOlxuICAgICAgICAgICAgICAgICAgICBvYmoubG9nKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1N3aXRjaCc6XG4gICAgICAgICAgICAgICAgICAgIG9iai5zd2l0Y2gocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU3dpdGNoQ29tcGxldGVkJzpcbiAgICAgICAgICAgICAgICAgICAgb2JqLnN3aXRjaF9jb21wbGV0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU2hvd0FjdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIG9iai5zaG93X2FjdGlvbihwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdJbnB1dCc6XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlpZWxkIG9iai5pbnB1dChwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdHZXRTaWduaW5nQm94JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgb2JqLmdldF9zaWduaW5nX2JveCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdJbnZva2VEZWJvdCc6XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIG9iai5pbnZva2VfZGVib3QocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU2VuZCc6XG4gICAgICAgICAgICAgICAgICAgIG9iai5zZW5kKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ0FwcHJvdmUnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB5aWVsZCBvYmouYXBwcm92ZShwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsaWVudC5yZXNvbHZlX2FwcF9yZXF1ZXN0KGFwcF9yZXF1ZXN0X2lkLCBPYmplY3QuYXNzaWduKHsgdHlwZTogcGFyYW1zLnR5cGUgfSwgcmVzdWx0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjbGllbnQucmVqZWN0X2FwcF9yZXF1ZXN0KGFwcF9yZXF1ZXN0X2lkLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbi8qKlxuICogW1VOU1RBQkxFXShVTlNUQUJMRS5tZCkgTW9kdWxlIGZvciB3b3JraW5nIHdpdGggZGVib3QuXG4gKi9cbmNsYXNzIERlYm90TW9kdWxlIHtcbiAgICBjb25zdHJ1Y3RvcihjbGllbnQpIHtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBjbGllbnQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFtVTlNUQUJMRV0oVU5TVEFCTEUubWQpIENyZWF0ZXMgYW5kIGluc3RhbmNlIG9mIERlQm90LlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBEb3dubG9hZHMgZGVib3Qgc21hcnQgY29udHJhY3QgKGNvZGUgYW5kIGRhdGEpIGZyb20gYmxvY2tjaGFpbiBhbmQgY3JlYXRlc1xuICAgICAqIGFuIGluc3RhbmNlIG9mIERlYm90IEVuZ2luZSBmb3IgaXQuXG4gICAgICpcbiAgICAgKiAjIFJlbWFya3NcbiAgICAgKiBJdCBkb2VzIG5vdCBzd2l0Y2ggZGVib3QgdG8gY29udGV4dCAwLiBCcm93c2VyIENhbGxiYWNrcyBhcmUgbm90IGNhbGxlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZJbml0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyBSZWdpc3RlcmVkRGVib3RcbiAgICAgKi9cbiAgICBpbml0KHBhcmFtcywgb2JqKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdkZWJvdC5pbml0JywgcGFyYW1zLCAocGFyYW1zLCByZXNwb25zZVR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEFwcERlYm90QnJvd3NlcihvYmosIHBhcmFtcy5yZXF1ZXN0X2RhdGEsIHBhcmFtcy5hcHBfcmVxdWVzdF9pZCwgdGhpcy5jbGllbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocmVzcG9uc2VUeXBlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hBcHBEZWJvdEJyb3dzZXIob2JqLCBwYXJhbXMsIG51bGwsIHRoaXMuY2xpZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFtVTlNUQUJMRV0oVU5TVEFCTEUubWQpIFN0YXJ0cyB0aGUgRGVCb3QuXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIERvd25sb2FkcyBkZWJvdCBzbWFydCBjb250cmFjdCBmcm9tIGJsb2NrY2hhaW4gYW5kIHN3aXRjaGVzIGl0IHRvXG4gICAgICogY29udGV4dCB6ZXJvLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHVzZWQgYnkgRGVib3QgQnJvd3NlciB0byBzdGFydCBhIGRpYWxvZyB3aXRoIGRlYm90LlxuICAgICAqIFdoaWxlIHRoZSBmdW5jdGlvbiBpcyBleGVjdXRpbmcsIHNldmVyYWwgQnJvd3NlciBDYWxsYmFja3MgY2FuIGJlIGNhbGxlZCxcbiAgICAgKiBzaW5jZSB0aGUgZGVib3QgdHJpZXMgdG8gZGlzcGxheSBhbGwgYWN0aW9ucyBmcm9tIHRoZSBjb250ZXh0IDAgdG8gdGhlIHVzZXIuXG4gICAgICpcbiAgICAgKiBXaGVuIHRoZSBkZWJvdCBzdGFydHMgU0RLIHJlZ2lzdGVycyBgQnJvd3NlckNhbGxiYWNrc2AgQXBwT2JqZWN0LlxuICAgICAqIFRoZXJlZm9yZSB3aGVuIGBkZWJvdGUucmVtb3ZlYCBpcyBjYWxsZWQgdGhlIGRlYm90IGlzIGJlaW5nIGRlbGV0ZWQgYW5kIHRoZSBjYWxsYmFjayBpcyBjYWxsZWRcbiAgICAgKiB3aXRoIGBmaW5pc2hgPWB0cnVlYCB3aGljaCBpbmRpY2F0ZXMgdGhhdCBpdCB3aWxsIG5ldmVyIGJlIHVzZWQgYWdhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mU3RhcnR9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgc3RhcnQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudC5yZXF1ZXN0KCdkZWJvdC5zdGFydCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFtVTlNUQUJMRV0oVU5TVEFCTEUubWQpIEZldGNoZXMgRGVCb3QgbWV0YWRhdGEgZnJvbSBibG9ja2NoYWluLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBEb3dubG9hZHMgRGVCb3QgZnJvbSBibG9ja2NoYWluIGFuZCBjcmVhdGVzIGFuZCBmZXRjaGVzIGl0cyBtZXRhZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZGZXRjaH0gcGFyYW1zXG4gICAgICogQHJldHVybnMgUmVzdWx0T2ZGZXRjaFxuICAgICAqL1xuICAgIGZldGNoKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnZGVib3QuZmV0Y2gnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBbVU5TVEFCTEVdKFVOU1RBQkxFLm1kKSBFeGVjdXRlcyBkZWJvdCBhY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIENhbGxzIGRlYm90IGVuZ2luZSByZWZlcmVuY2VkIGJ5IGRlYm90IGhhbmRsZSB0byBleGVjdXRlIGlucHV0IGFjdGlvbi5cbiAgICAgKiBDYWxscyBEZWJvdCBCcm93c2VyIENhbGxiYWNrcyBpZiBuZWVkZWQuXG4gICAgICpcbiAgICAgKiAjIFJlbWFya3NcbiAgICAgKiBDaGFpbiBvZiBhY3Rpb25zIGNhbiBiZSBleGVjdXRlZCBpZiBpbnB1dCBhY3Rpb24gZ2VuZXJhdGVzIGEgbGlzdCBvZiBzdWJhY3Rpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJhbXNPZkV4ZWN1dGV9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZXhlY3V0ZShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2RlYm90LmV4ZWN1dGUnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBbVU5TVEFCTEVdKFVOU1RBQkxFLm1kKSBTZW5kcyBtZXNzYWdlIHRvIERlYm90LlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBVc2VkIGJ5IERlYm90IEJyb3dzZXIgdG8gc2VuZCByZXNwb25zZSBvbiBEaW50ZXJmYWNlIGNhbGwgb3IgZnJvbSBvdGhlciBEZWJvdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mU2VuZH0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBzZW5kKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgnZGVib3Quc2VuZCcsIHBhcmFtcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFtVTlNUQUJMRV0oVU5TVEFCTEUubWQpIERlc3Ryb3lzIGRlYm90IGhhbmRsZS5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUmVtb3ZlcyBoYW5kbGUgZnJvbSBDbGllbnQgQ29udGV4dCBhbmQgZHJvcHMgZGVib3QgZW5naW5lIHJlZmVyZW5jZWQgYnkgdGhhdCBoYW5kbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mUmVtb3ZlfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHJlbW92ZShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ2RlYm90LnJlbW92ZScsIHBhcmFtcyk7XG4gICAgfVxufVxuZXhwb3J0cy5EZWJvdE1vZHVsZSA9IERlYm90TW9kdWxlO1xuLy8gcHJvb2ZzIG1vZHVsZVxudmFyIFByb29mc0Vycm9yQ29kZTtcbihmdW5jdGlvbiAoUHJvb2ZzRXJyb3JDb2RlKSB7XG4gICAgUHJvb2ZzRXJyb3JDb2RlW1Byb29mc0Vycm9yQ29kZVtcIkludmFsaWREYXRhXCJdID0gOTAxXSA9IFwiSW52YWxpZERhdGFcIjtcbiAgICBQcm9vZnNFcnJvckNvZGVbUHJvb2ZzRXJyb3JDb2RlW1wiUHJvb2ZDaGVja0ZhaWxlZFwiXSA9IDkwMl0gPSBcIlByb29mQ2hlY2tGYWlsZWRcIjtcbiAgICBQcm9vZnNFcnJvckNvZGVbUHJvb2ZzRXJyb3JDb2RlW1wiSW50ZXJuYWxFcnJvclwiXSA9IDkwM10gPSBcIkludGVybmFsRXJyb3JcIjtcbiAgICBQcm9vZnNFcnJvckNvZGVbUHJvb2ZzRXJyb3JDb2RlW1wiRGF0YURpZmZlcnNGcm9tUHJvdmVuXCJdID0gOTA0XSA9IFwiRGF0YURpZmZlcnNGcm9tUHJvdmVuXCI7XG59KShQcm9vZnNFcnJvckNvZGUgPSBleHBvcnRzLlByb29mc0Vycm9yQ29kZSB8fCAoZXhwb3J0cy5Qcm9vZnNFcnJvckNvZGUgPSB7fSkpO1xuLyoqXG4gKiBbVU5TVEFCTEVdKFVOU1RBQkxFLm1kKSBNb2R1bGUgZm9yIHByb3ZpbmcgZGF0YSwgcmV0cmlldmVkIGZyb20gVE9OT1MgQVBJLlxuICovXG5jbGFzcyBQcm9vZnNNb2R1bGUge1xuICAgIGNvbnN0cnVjdG9yKGNsaWVudCkge1xuICAgICAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvdmVzIHRoYXQgYSBnaXZlbiBibG9jaydzIGRhdGEsIHdoaWNoIGlzIHF1ZXJpZWQgZnJvbSBUT05PUyBBUEksIGNhbiBiZSB0cnVzdGVkLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyBibG9jayBwcm9vZnMgYW5kIGNvbXBhcmVzIGdpdmVuIGRhdGEgd2l0aCB0aGUgcHJvdmVuLlxuICAgICAqIElmIHRoZSBnaXZlbiBkYXRhIGRpZmZlcnMgZnJvbSB0aGUgcHJvdmVuLCB0aGUgZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxuICAgICAqIFRoZSBpbnB1dCBwYXJhbSBpcyBhIHNpbmdsZSBibG9jaydzIEpTT04gb2JqZWN0LCB3aGljaCB3YXMgcXVlcmllZCBmcm9tIERBcHAgc2VydmVyIHVzaW5nXG4gICAgICogZnVuY3Rpb25zIHN1Y2ggYXMgYG5ldC5xdWVyeWAsIGBuZXQucXVlcnlfY29sbGVjdGlvbmAgb3IgYG5ldC53YWl0X2Zvcl9jb2xsZWN0aW9uYC5cbiAgICAgKiBJZiBibG9jaydzIEJPQyBpcyBub3QgcHJvdmlkZWQgaW4gdGhlIEpTT04sIGl0IHdpbGwgYmUgcXVlcmllZCBmcm9tIERBcHAgc2VydmVyXG4gICAgICogKGluIHRoaXMgY2FzZSBpdCBpcyByZXF1aXJlZCB0byBwcm92aWRlIGF0IGxlYXN0IGBpZGAgb2YgYmxvY2spLlxuICAgICAqXG4gICAgICogUGxlYXNlIG5vdGUsIHRoYXQgam9pbnMgKGxpa2UgYHNpZ25hdHVyZXNgIGluIGBCbG9ja2ApIGFyZSBzZXBhcmF0ZWQgZW50aXRpZXMgYW5kIG5vdCBzdXBwb3J0ZWQsXG4gICAgICogc28gZnVuY3Rpb24gd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaW4gYSBjYXNlIGlmIEpTT04gYmVpbmcgY2hlY2tlZCBoYXMgc3VjaCBlbnRpdGllcyBpbiBpdC5cbiAgICAgKlxuICAgICAqIElmIGBjYWNoZV9pbl9sb2NhbF9zdG9yYWdlYCBpbiBjb25maWcgaXMgc2V0IHRvIGB0cnVlYCAoZGVmYXVsdCksIGRvd25sb2FkZWQgcHJvb2ZzIGFuZFxuICAgICAqIG1hc3Rlci1jaGFpbiBCT0NzIGFyZSBzYXZlZCBpbnRvIHRoZSBwZXJzaXN0ZW50IGxvY2FsIHN0b3JhZ2UgKGUuZy4gZmlsZSBzeXN0ZW0gZm9yIG5hdGl2ZVxuICAgICAqIGVudmlyb25tZW50cyBvciBicm93c2VyJ3MgSW5kZXhlZERCIGZvciB0aGUgd2ViKTsgb3RoZXJ3aXNlIGFsbCB0aGUgZGF0YSBpcyBjYWNoZWQgb25seSBpblxuICAgICAqIG1lbW9yeSBpbiBjdXJyZW50IGNsaWVudCdzIGNvbnRleHQgYW5kIHdpbGwgYmUgbG9zdCBhZnRlciBkZXN0cnVjdGlvbiBvZiB0aGUgY2xpZW50LlxuICAgICAqXG4gICAgICogKipXaHkgUHJvb2ZzIGFyZSBuZWVkZWQqKlxuICAgICAqXG4gICAgICogUHJvb2ZzIGFyZSBuZWVkZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGRhdGEgZG93bmxvYWRlZCBmcm9tIGEgREFwcCBzZXJ2ZXIgaXMgcmVhbCBibG9ja2NoYWluXG4gICAgICogZGF0YS4gQ2hlY2tpbmcgcHJvb2ZzIGNhbiBwcm90ZWN0IGZyb20gdGhlIG1hbGljaW91cyBEQXBwIHNlcnZlciB3aGljaCBjYW4gcG90ZW50aWFsbHkgcHJvdmlkZVxuICAgICAqIGZha2UgZGF0YSwgb3IgYWxzbyBmcm9tIFwiTWFuIGluIHRoZSBNaWRkbGVcIiBhdHRhY2tzIGNsYXNzLlxuICAgICAqXG4gICAgICogKipXaGF0IFByb29mcyBhcmUqKlxuICAgICAqXG4gICAgICogU2ltcGx5LCBwcm9vZiBpcyBhIGxpc3Qgb2Ygc2lnbmF0dXJlcyBvZiB2YWxpZGF0b3JzJywgd2hpY2ggaGF2ZSBzaWduZWQgdGhpcyBwYXJ0aWN1bGFyIG1hc3Rlci1cbiAgICAgKiBibG9jay5cbiAgICAgKlxuICAgICAqIFRoZSB2ZXJ5IGZpcnN0IHZhbGlkYXRvciBzZXQncyBwdWJsaWMga2V5cyBhcmUgaW5jbHVkZWQgaW4gdGhlIHplcm8tc3RhdGUuIFdoZSBrbm93IGEgcm9vdCBoYXNoXG4gICAgICogb2YgdGhlIHplcm8tc3RhdGUsIGJlY2F1c2UgaXQgaXMgc3RvcmVkIGluIHRoZSBuZXR3b3JrIGNvbmZpZ3VyYXRpb24gZmlsZSwgaXQgaXMgb3VyIGF1dGhvcml0eVxuICAgICAqIHJvb3QuIEZvciBwcm92aW5nIHplcm8tc3RhdGUgaXQgaXMgZW5vdWdoIHRvIGNhbGN1bGF0ZSBhbmQgY29tcGFyZSBpdHMgcm9vdCBoYXNoLlxuICAgICAqXG4gICAgICogSW4gZWFjaCBuZXcgdmFsaWRhdG9yIGN5Y2xlIHRoZSB2YWxpZGF0b3Igc2V0IGlzIGNoYW5nZWQuIFRoZSBuZXcgb25lIGlzIHN0b3JlZCBpbiBhIGtleS1ibG9jayxcbiAgICAgKiB3aGljaCBpcyBzaWduZWQgYnkgdGhlIHZhbGlkYXRvciBzZXQsIHdoaWNoIHdlIGFscmVhZHkgdHJ1c3QsIHRoZSBuZXh0IHZhbGlkYXRvciBzZXQgd2lsbCBiZVxuICAgICAqIHN0b3JlZCB0byB0aGUgbmV3IGtleS1ibG9jayBhbmQgc2lnbmVkIGJ5IHRoZSBjdXJyZW50IHZhbGlkYXRvciBzZXQsIGFuZCBzbyBvbi5cbiAgICAgKlxuICAgICAqIEluIG9yZGVyIHRvIHByb3ZlIGFueSBibG9jayBpbiB0aGUgbWFzdGVyLWNoYWluIHdlIG5lZWQgdG8gY2hlY2ssIHRoYXQgaXQgaGFzIGJlZW4gc2lnbmVkIGJ5XG4gICAgICogYSB0cnVzdGVkIHZhbGlkYXRvciBzZXQuIFNvIHdlIG5lZWQgdG8gY2hlY2sgYWxsIGtleS1ibG9ja3MnIHByb29mcywgc3RhcnRlZCBmcm9tIHRoZSB6ZXJvLXN0YXRlXG4gICAgICogYW5kIHVudGlsIHRoZSBibG9jaywgd2hpY2ggd2Ugd2FudCB0byBwcm92ZS4gQnV0IGl0IGNhbiB0YWtlIGEgbG90IG9mIHRpbWUgYW5kIHRyYWZmaWMgdG9cbiAgICAgKiBkb3dubG9hZCBhbmQgcHJvdmUgYWxsIGtleS1ibG9ja3Mgb24gYSBjbGllbnQuIEZvciBzb2x2aW5nIHRoaXMsIHNwZWNpYWwgdHJ1c3RlZCBibG9ja3MgYXJlIHVzZWRcbiAgICAgKiBpbiBFdmVyLVNESy5cbiAgICAgKlxuICAgICAqIFRoZSB0cnVzdGVkIGJsb2NrIGlzIHRoZSBhdXRob3JpdHkgcm9vdCwgYXMgd2VsbCwgYXMgdGhlIHplcm8tc3RhdGUuIEVhY2ggdHJ1c3RlZCBibG9jayBpcyB0aGVcbiAgICAgKiBgaWRgIChlLmcuIGByb290X2hhc2hgKSBvZiB0aGUgYWxyZWFkeSBwcm92ZW4ga2V5LWJsb2NrLiBUaGVyZSBjYW4gYmUgcGxlbnR5IG9mIHRydXN0ZWRcbiAgICAgKiBibG9ja3MsIHNvIHRoZXJlIGNhbiBiZSBhIGxvdCBvZiBhdXRob3JpdHkgcm9vdHMuIFRoZSBoYXNoZXMgb2YgdHJ1c3RlZCBibG9ja3MgZm9yIE1haW5OZXRcbiAgICAgKiBhbmQgRGV2TmV0IGFyZSBoYXJkY29kZWQgaW4gU0RLIGluIGEgc2VwYXJhdGVkIGJpbmFyeSBmaWxlICh0cnVzdGVkX2tleV9ibG9ja3MuYmluKSBhbmQgaXNcbiAgICAgKiBiZWluZyB1cGRhdGVkIGZvciBlYWNoIHJlbGVhc2UgYnkgdXNpbmcgYHVwZGF0ZV90cnVzdGVkX2Jsb2Nrc2AgdXRpbGl0eS5cbiAgICAgKlxuICAgICAqIFNlZSBbdXBkYXRlX3RydXN0ZWRfYmxvY2tzXSguLi8uLi8uLi90b29scy91cGRhdGVfdHJ1c3RlZF9ibG9ja3MpIGRpcmVjdG9yeSBmb3IgbW9yZSBpbmZvLlxuICAgICAqXG4gICAgICogSW4gZnV0dXJlIFNESyByZWxlYXNlcywgb25lIHdpbGwgYWxzbyBiZSBhYmxlIHRvIHByb3ZpZGUgdGhlaXIgaGFzaGVzIG9mIHRydXN0ZWQgYmxvY2tzIGZvclxuICAgICAqIG90aGVyIG5ldHdvcmtzLCBiZXNpZGVzIGZvciBNYWluTmV0IGFuZCBEZXZOZXQuXG4gICAgICogQnkgdXNpbmcgdHJ1c3RlZCBrZXktYmxvY2tzLCBpbiBvcmRlciB0byBwcm92ZSBhbnkgYmxvY2ssIHdlIGNhbiBwcm92ZSBjaGFpbiBvZiBrZXktYmxvY2tzIHRvXG4gICAgICogdGhlIGNsb3Nlc3QgcHJldmlvdXMgdHJ1c3RlZCBrZXktYmxvY2ssIG5vdCBvbmx5IHRvIHRoZSB6ZXJvLXN0YXRlLlxuICAgICAqXG4gICAgICogQnV0IHNoYXJkLWJsb2NrcyBkb24ndCBoYXZlIHByb29mcyBvbiBEQXBwIHNlcnZlci4gSW4gdGhpcyBjYXNlLCBpbiBvcmRlciB0byBwcm92ZSBhbnkgc2hhcmQtXG4gICAgICogYmxvY2sgZGF0YSwgd2Ugc2VhcmNoIGZvciBhIGNvcnJlc3BvbmRpbmcgbWFzdGVyLWJsb2NrLCB3aGljaCBjb250YWlucyB0aGUgcm9vdCBoYXNoIG9mIHRoaXNcbiAgICAgKiBzaGFyZC1ibG9jaywgb3Igc29tZSBzaGFyZCBibG9jayB3aGljaCBpcyBsaW5rZWQgdG8gdGhhdCBibG9jayBpbiBzaGFyZC1jaGFpbi4gQWZ0ZXIgcHJvdmluZ1xuICAgICAqIHRoaXMgbWFzdGVyLWJsb2NrLCB3ZSB0cmF2ZXJzZSB0aHJvdWdoIGVhY2ggbGluayBhbmQgY2FsY3VsYXRlIGFuZCBjb21wYXJlIGhhc2hlcyB3aXRoIGxpbmtzLFxuICAgICAqIG9uZS1ieS1vbmUuIEFmdGVyIHRoYXQgd2UgY2FuIGVuc3VyZSB0aGF0IHRoaXMgc2hhcmQtYmxvY2sgaGFzIGFsc28gYmVlbiBwcm92ZW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BhcmFtc09mUHJvb2ZCbG9ja0RhdGF9IHBhcmFtc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJvb2ZfYmxvY2tfZGF0YShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3Byb29mcy5wcm9vZl9ibG9ja19kYXRhJywgcGFyYW1zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvdmVzIHRoYXQgYSBnaXZlbiB0cmFuc2FjdGlvbidzIGRhdGEsIHdoaWNoIGlzIHF1ZXJpZWQgZnJvbSBUT05PUyBBUEksIGNhbiBiZSB0cnVzdGVkLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIHJlcXVlc3RzIHRoZSBjb3JyZXNwb25kaW5nIGJsb2NrLCBjaGVja3MgYmxvY2sgcHJvb2ZzLCBlbnN1cmVzIHRoYXQgZ2l2ZW5cbiAgICAgKiB0cmFuc2FjdGlvbiBleGlzdHMgaW4gdGhlIHByb3ZlbiBibG9jayBhbmQgY29tcGFyZXMgZ2l2ZW4gZGF0YSB3aXRoIHRoZSBwcm92ZW4uXG4gICAgICogSWYgdGhlIGdpdmVuIGRhdGEgZGlmZmVycyBmcm9tIHRoZSBwcm92ZW4sIHRoZSBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG4gICAgICogVGhlIGlucHV0IHBhcmFtZXRlciBpcyBhIHNpbmdsZSB0cmFuc2FjdGlvbidzIEpTT04gb2JqZWN0IChzZWUgcGFyYW1zIGRlc2NyaXB0aW9uKSxcbiAgICAgKiB3aGljaCB3YXMgcXVlcmllZCBmcm9tIFRPTk9TIEFQSSB1c2luZyBmdW5jdGlvbnMgc3VjaCBhcyBgbmV0LnF1ZXJ5YCwgYG5ldC5xdWVyeV9jb2xsZWN0aW9uYFxuICAgICAqIG9yIGBuZXQud2FpdF9mb3JfY29sbGVjdGlvbmAuXG4gICAgICpcbiAgICAgKiBJZiB0cmFuc2FjdGlvbidzIEJPQyBhbmQvb3IgYGJsb2NrX2lkYCBhcmUgbm90IHByb3ZpZGVkIGluIHRoZSBKU09OLCB0aGV5IHdpbGwgYmUgcXVlcmllZCBmcm9tXG4gICAgICogVE9OT1MgQVBJLlxuICAgICAqXG4gICAgICogUGxlYXNlIG5vdGUsIHRoYXQgam9pbnMgKGxpa2UgYGFjY291bnRgLCBgaW5fbWVzc2FnZWAsIGBvdXRfbWVzc2FnZXNgLCBldGMuIGluIGBUcmFuc2FjdGlvbmBcbiAgICAgKiBlbnRpdHkpIGFyZSBzZXBhcmF0ZWQgZW50aXRpZXMgYW5kIG5vdCBzdXBwb3J0ZWQsIHNvIGZ1bmN0aW9uIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGluIGEgY2FzZVxuICAgICAqIGlmIEpTT04gYmVpbmcgY2hlY2tlZCBoYXMgc3VjaCBlbnRpdGllcyBpbiBpdC5cbiAgICAgKlxuICAgICAqIEZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHByb29mcyBjaGVja2luZywgc2VlIGRlc2NyaXB0aW9uIG9mIGBwcm9vZl9ibG9ja19kYXRhYCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZQcm9vZlRyYW5zYWN0aW9uRGF0YX0gcGFyYW1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwcm9vZl90cmFuc2FjdGlvbl9kYXRhKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVxdWVzdCgncHJvb2ZzLnByb29mX3RyYW5zYWN0aW9uX2RhdGEnLCBwYXJhbXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm92ZXMgdGhhdCBhIGdpdmVuIG1lc3NhZ2UncyBkYXRhLCB3aGljaCBpcyBxdWVyaWVkIGZyb20gVE9OT1MgQVBJLCBjYW4gYmUgdHJ1c3RlZC5cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBmdW5jdGlvbiBmaXJzdCBwcm92ZXMgdGhlIGNvcnJlc3BvbmRpbmcgdHJhbnNhY3Rpb24sIGVuc3VyZXMgdGhhdCB0aGUgcHJvdmVuIHRyYW5zYWN0aW9uXG4gICAgICogcmVmZXJzIHRvIHRoZSBnaXZlbiBtZXNzYWdlIGFuZCBjb21wYXJlcyBnaXZlbiBkYXRhIHdpdGggdGhlIHByb3Zlbi5cbiAgICAgKiBJZiB0aGUgZ2l2ZW4gZGF0YSBkaWZmZXJzIGZyb20gdGhlIHByb3ZlbiwgdGhlIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cbiAgICAgKiBUaGUgaW5wdXQgcGFyYW1ldGVyIGlzIGEgc2luZ2xlIG1lc3NhZ2UncyBKU09OIG9iamVjdCAoc2VlIHBhcmFtcyBkZXNjcmlwdGlvbiksXG4gICAgICogd2hpY2ggd2FzIHF1ZXJpZWQgZnJvbSBUT05PUyBBUEkgdXNpbmcgZnVuY3Rpb25zIHN1Y2ggYXMgYG5ldC5xdWVyeWAsIGBuZXQucXVlcnlfY29sbGVjdGlvbmBcbiAgICAgKiBvciBgbmV0LndhaXRfZm9yX2NvbGxlY3Rpb25gLlxuICAgICAqXG4gICAgICogSWYgbWVzc2FnZSdzIEJPQyBhbmQvb3Igbm9uLW51bGwgYHNyY190cmFuc2FjdGlvbi5pZGAgb3IgYGRzdF90cmFuc2FjdGlvbi5pZGAgYXJlIG5vdCBwcm92aWRlZFxuICAgICAqIGluIHRoZSBKU09OLCB0aGV5IHdpbGwgYmUgcXVlcmllZCBmcm9tIFRPTk9TIEFQSS5cbiAgICAgKlxuICAgICAqIFBsZWFzZSBub3RlLCB0aGF0IGpvaW5zIChsaWtlIGBibG9ja2AsIGBkc3RfYWNjb3VudGAsIGBkc3RfdHJhbnNhY3Rpb25gLCBgc3JjX2FjY291bnRgLFxuICAgICAqIGBzcmNfdHJhbnNhY3Rpb25gLCBldGMuIGluIGBNZXNzYWdlYCBlbnRpdHkpIGFyZSBzZXBhcmF0ZWQgZW50aXRpZXMgYW5kIG5vdCBzdXBwb3J0ZWQsXG4gICAgICogc28gZnVuY3Rpb24gd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaW4gYSBjYXNlIGlmIEpTT04gYmVpbmcgY2hlY2tlZCBoYXMgc3VjaCBlbnRpdGllcyBpbiBpdC5cbiAgICAgKlxuICAgICAqIEZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHByb29mcyBjaGVja2luZywgc2VlIGRlc2NyaXB0aW9uIG9mIGBwcm9vZl9ibG9ja19kYXRhYCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyYW1zT2ZQcm9vZk1lc3NhZ2VEYXRhfSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHByb29mX21lc3NhZ2VfZGF0YShwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlcXVlc3QoJ3Byb29mcy5wcm9vZl9tZXNzYWdlX2RhdGEnLCBwYXJhbXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuUHJvb2ZzTW9kdWxlID0gUHJvb2ZzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kdWxlcy5qcy5tYXAiLCIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gTGFicyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbi8vIFRoaXMgZmlsZSBpcyBqdXN0IGEgdGVtcGxhdGUgdGhhdCB1c2VkIHRvIGdlbmVyYXRlIGluZGV4LmpzIGF0IG5wbSBpbnN0YWxsYXRpb24gc3RhZ2VcblxuY29uc3Qgd29ya2VyU2NyaXB0ID0gYC8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFdSQVBQRVIgQkVHSU5cblxubGV0IHdhc207XG5cbmNvbnN0IGNhY2hlZFRleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcsIHsgaWdub3JlQk9NOiB0cnVlLCBmYXRhbDogdHJ1ZSB9KTtcblxuY2FjaGVkVGV4dERlY29kZXIuZGVjb2RlKCk7XG5cbmxldCBjYWNoZWRVaW50OE1lbW9yeTAgPSBuZXcgVWludDhBcnJheSgpO1xuXG5mdW5jdGlvbiBnZXRVaW50OE1lbW9yeTAoKSB7XG4gICAgaWYgKGNhY2hlZFVpbnQ4TWVtb3J5MC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNhY2hlZFVpbnQ4TWVtb3J5MCA9IG5ldyBVaW50OEFycmF5KHdhc20ubWVtb3J5LmJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRVaW50OE1lbW9yeTA7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0Zyb21XYXNtMChwdHIsIGxlbikge1xuICAgIHJldHVybiBjYWNoZWRUZXh0RGVjb2Rlci5kZWNvZGUoZ2V0VWludDhNZW1vcnkwKCkuc3ViYXJyYXkocHRyLCBwdHIgKyBsZW4pKTtcbn1cblxuY29uc3QgaGVhcCA9IG5ldyBBcnJheSgzMikuZmlsbCh1bmRlZmluZWQpO1xuXG5oZWFwLnB1c2godW5kZWZpbmVkLCBudWxsLCB0cnVlLCBmYWxzZSk7XG5cbmxldCBoZWFwX25leHQgPSBoZWFwLmxlbmd0aDtcblxuZnVuY3Rpb24gYWRkSGVhcE9iamVjdChvYmopIHtcbiAgICBpZiAoaGVhcF9uZXh0ID09PSBoZWFwLmxlbmd0aCkgaGVhcC5wdXNoKGhlYXAubGVuZ3RoICsgMSk7XG4gICAgY29uc3QgaWR4ID0gaGVhcF9uZXh0O1xuICAgIGhlYXBfbmV4dCA9IGhlYXBbaWR4XTtcblxuICAgIGhlYXBbaWR4XSA9IG9iajtcbiAgICByZXR1cm4gaWR4O1xufVxuXG5mdW5jdGlvbiBnZXRPYmplY3QoaWR4KSB7IHJldHVybiBoZWFwW2lkeF07IH1cblxuZnVuY3Rpb24gZHJvcE9iamVjdChpZHgpIHtcbiAgICBpZiAoaWR4IDwgMzYpIHJldHVybjtcbiAgICBoZWFwW2lkeF0gPSBoZWFwX25leHQ7XG4gICAgaGVhcF9uZXh0ID0gaWR4O1xufVxuXG5mdW5jdGlvbiB0YWtlT2JqZWN0KGlkeCkge1xuICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChpZHgpO1xuICAgIGRyb3BPYmplY3QoaWR4KTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG5sZXQgV0FTTV9WRUNUT1JfTEVOID0gMDtcblxuY29uc3QgY2FjaGVkVGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoJ3V0Zi04Jyk7XG5cbmNvbnN0IGVuY29kZVN0cmluZyA9ICh0eXBlb2YgY2FjaGVkVGV4dEVuY29kZXIuZW5jb2RlSW50byA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gZnVuY3Rpb24gKGFyZywgdmlldykge1xuICAgIHJldHVybiBjYWNoZWRUZXh0RW5jb2Rlci5lbmNvZGVJbnRvKGFyZywgdmlldyk7XG59XG4gICAgOiBmdW5jdGlvbiAoYXJnLCB2aWV3KSB7XG4gICAgY29uc3QgYnVmID0gY2FjaGVkVGV4dEVuY29kZXIuZW5jb2RlKGFyZyk7XG4gICAgdmlldy5zZXQoYnVmKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZWFkOiBhcmcubGVuZ3RoLFxuICAgICAgICB3cml0dGVuOiBidWYubGVuZ3RoXG4gICAgfTtcbn0pO1xuXG5mdW5jdGlvbiBwYXNzU3RyaW5nVG9XYXNtMChhcmcsIG1hbGxvYywgcmVhbGxvYykge1xuXG4gICAgaWYgKHJlYWxsb2MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBidWYgPSBjYWNoZWRUZXh0RW5jb2Rlci5lbmNvZGUoYXJnKTtcbiAgICAgICAgY29uc3QgcHRyID0gbWFsbG9jKGJ1Zi5sZW5ndGgpO1xuICAgICAgICBnZXRVaW50OE1lbW9yeTAoKS5zdWJhcnJheShwdHIsIHB0ciArIGJ1Zi5sZW5ndGgpLnNldChidWYpO1xuICAgICAgICBXQVNNX1ZFQ1RPUl9MRU4gPSBidWYubGVuZ3RoO1xuICAgICAgICByZXR1cm4gcHRyO1xuICAgIH1cblxuICAgIGxldCBsZW4gPSBhcmcubGVuZ3RoO1xuICAgIGxldCBwdHIgPSBtYWxsb2MobGVuKTtcblxuICAgIGNvbnN0IG1lbSA9IGdldFVpbnQ4TWVtb3J5MCgpO1xuXG4gICAgbGV0IG9mZnNldCA9IDA7XG5cbiAgICBmb3IgKDsgb2Zmc2V0IDwgbGVuOyBvZmZzZXQrKykge1xuICAgICAgICBjb25zdCBjb2RlID0gYXJnLmNoYXJDb2RlQXQob2Zmc2V0KTtcbiAgICAgICAgaWYgKGNvZGUgPiAweDdGKSBicmVhaztcbiAgICAgICAgbWVtW3B0ciArIG9mZnNldF0gPSBjb2RlO1xuICAgIH1cblxuICAgIGlmIChvZmZzZXQgIT09IGxlbikge1xuICAgICAgICBpZiAob2Zmc2V0ICE9PSAwKSB7XG4gICAgICAgICAgICBhcmcgPSBhcmcuc2xpY2Uob2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBwdHIgPSByZWFsbG9jKHB0ciwgbGVuLCBsZW4gPSBvZmZzZXQgKyBhcmcubGVuZ3RoICogMyk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBnZXRVaW50OE1lbW9yeTAoKS5zdWJhcnJheShwdHIgKyBvZmZzZXQsIHB0ciArIGxlbik7XG4gICAgICAgIGNvbnN0IHJldCA9IGVuY29kZVN0cmluZyhhcmcsIHZpZXcpO1xuXG4gICAgICAgIG9mZnNldCArPSByZXQud3JpdHRlbjtcbiAgICB9XG5cbiAgICBXQVNNX1ZFQ1RPUl9MRU4gPSBvZmZzZXQ7XG4gICAgcmV0dXJuIHB0cjtcbn1cblxuZnVuY3Rpb24gaXNMaWtlTm9uZSh4KSB7XG4gICAgcmV0dXJuIHggPT09IHVuZGVmaW5lZCB8fCB4ID09PSBudWxsO1xufVxuXG5sZXQgY2FjaGVkSW50MzJNZW1vcnkwID0gbmV3IEludDMyQXJyYXkoKTtcblxuZnVuY3Rpb24gZ2V0SW50MzJNZW1vcnkwKCkge1xuICAgIGlmIChjYWNoZWRJbnQzMk1lbW9yeTAuYnl0ZUxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjYWNoZWRJbnQzMk1lbW9yeTAgPSBuZXcgSW50MzJBcnJheSh3YXNtLm1lbW9yeS5idWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkSW50MzJNZW1vcnkwO1xufVxuXG5sZXQgY2FjaGVkRmxvYXQ2NE1lbW9yeTAgPSBuZXcgRmxvYXQ2NEFycmF5KCk7XG5cbmZ1bmN0aW9uIGdldEZsb2F0NjRNZW1vcnkwKCkge1xuICAgIGlmIChjYWNoZWRGbG9hdDY0TWVtb3J5MC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNhY2hlZEZsb2F0NjRNZW1vcnkwID0gbmV3IEZsb2F0NjRBcnJheSh3YXNtLm1lbW9yeS5idWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkRmxvYXQ2NE1lbW9yeTA7XG59XG5cbmxldCBjYWNoZWRCaWdJbnQ2NE1lbW9yeTAgPSBuZXcgQmlnSW50NjRBcnJheSgpO1xuXG5mdW5jdGlvbiBnZXRCaWdJbnQ2NE1lbW9yeTAoKSB7XG4gICAgaWYgKGNhY2hlZEJpZ0ludDY0TWVtb3J5MC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNhY2hlZEJpZ0ludDY0TWVtb3J5MCA9IG5ldyBCaWdJbnQ2NEFycmF5KHdhc20ubWVtb3J5LmJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRCaWdJbnQ2NE1lbW9yeTA7XG59XG5cbmZ1bmN0aW9uIGRlYnVnU3RyaW5nKHZhbCkge1xuICAgIC8vIHByaW1pdGl2ZSB0eXBlc1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh0eXBlID09ICdudW1iZXInIHx8IHR5cGUgPT0gJ2Jvb2xlYW4nIHx8IHZhbCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAgXFxgXFwke3ZhbH1cXGA7XG4gICAgfVxuICAgIGlmICh0eXBlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBcXGBcIlxcJHt2YWx9XCJcXGA7XG4gICAgfVxuICAgIGlmICh0eXBlID09ICdzeW1ib2wnKSB7XG4gICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdmFsLmRlc2NyaXB0aW9uO1xuICAgICAgICBpZiAoZGVzY3JpcHRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdTeW1ib2wnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFxcYFN5bWJvbChcXCR7ZGVzY3JpcHRpb259KVxcYDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB2YWwubmFtZTtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09ICdzdHJpbmcnICYmIG5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFxcYEZ1bmN0aW9uKFxcJHtuYW1lfSlcXGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ0Z1bmN0aW9uJztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBvYmplY3RzXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICBjb25zdCBsZW5ndGggPSB2YWwubGVuZ3RoO1xuICAgICAgICBsZXQgZGVidWcgPSAnWyc7XG4gICAgICAgIGlmIChsZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBkZWJ1ZyArPSBkZWJ1Z1N0cmluZyh2YWxbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGZvcihsZXQgaSA9IDE7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGVidWcgKz0gJywgJyArIGRlYnVnU3RyaW5nKHZhbFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcgKz0gJ10nO1xuICAgICAgICByZXR1cm4gZGVidWc7XG4gICAgfVxuICAgIC8vIFRlc3QgZm9yIGJ1aWx0LWluXG4gICAgY29uc3QgYnVpbHRJbk1hdGNoZXMgPSAvXFxcXFtvYmplY3QgKFteXFxcXF1dKylcXFxcXS8uZXhlYyh0b1N0cmluZy5jYWxsKHZhbCkpO1xuICAgIGxldCBjbGFzc05hbWU7XG4gICAgaWYgKGJ1aWx0SW5NYXRjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY2xhc3NOYW1lID0gYnVpbHRJbk1hdGNoZXNbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFpbGVkIHRvIG1hdGNoIHRoZSBzdGFuZGFyZCAnW29iamVjdCBDbGFzc05hbWVdJ1xuICAgICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbCh2YWwpO1xuICAgIH1cbiAgICBpZiAoY2xhc3NOYW1lID09ICdPYmplY3QnKSB7XG4gICAgICAgIC8vIHdlJ3JlIGEgdXNlciBkZWZpbmVkIGNsYXNzIG9yIE9iamVjdFxuICAgICAgICAvLyBKU09OLnN0cmluZ2lmeSBhdm9pZHMgcHJvYmxlbXMgd2l0aCBjeWNsZXMsIGFuZCBpcyBnZW5lcmFsbHkgbXVjaFxuICAgICAgICAvLyBlYXNpZXIgdGhhbiBsb29waW5nIHRocm91Z2ggb3duUHJvcGVydGllcyBvZiBcXGB2YWxcXGAuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gJ09iamVjdCgnICsgSlNPTi5zdHJpbmdpZnkodmFsKSArICcpJztcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgICAgcmV0dXJuICdPYmplY3QnO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGVycm9yc1xuICAgIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gXFxgXFwke3ZhbC5uYW1lfTogXFwke3ZhbC5tZXNzYWdlfVxcXFxuXFwke3ZhbC5zdGFja31cXGA7XG4gICAgfVxuICAgIC8vIFRPRE8gd2UgY291bGQgdGVzdCBmb3IgbW9yZSB0aGluZ3MgaGVyZSwgbGlrZSBcXGBTZXRcXGBzIGFuZCBcXGBNYXBcXGBzLlxuICAgIHJldHVybiBjbGFzc05hbWU7XG59XG5cbmZ1bmN0aW9uIG1ha2VDbG9zdXJlKGFyZzAsIGFyZzEsIGR0b3IsIGYpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHsgYTogYXJnMCwgYjogYXJnMSwgY250OiAxLCBkdG9yIH07XG4gICAgY29uc3QgcmVhbCA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIC8vIEZpcnN0IHVwIHdpdGggYSBjbG9zdXJlIHdlIGluY3JlbWVudCB0aGUgaW50ZXJuYWwgcmVmZXJlbmNlXG4gICAgICAgIC8vIGNvdW50LiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgUnVzdCBjbG9zdXJlIGVudmlyb25tZW50IHdvbid0XG4gICAgICAgIC8vIGJlIGRlYWxsb2NhdGVkIHdoaWxlIHdlJ3JlIGludm9raW5nIGl0LlxuICAgICAgICBzdGF0ZS5jbnQrKztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmKHN0YXRlLmEsIHN0YXRlLmIsIC4uLmFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKC0tc3RhdGUuY250ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2V4cG9ydF8yLmdldChzdGF0ZS5kdG9yKShzdGF0ZS5hLCBzdGF0ZS5iKTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hID0gMDtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZWFsLm9yaWdpbmFsID0gc3RhdGU7XG5cbiAgICByZXR1cm4gcmVhbDtcbn1cbmZ1bmN0aW9uIF9fd2JnX2FkYXB0ZXJfNTAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgIHdhc20uX2R5bl9jb3JlX19vcHNfX2Z1bmN0aW9uX19Gbl9fQV9fX19PdXRwdXRfX19SX2FzX3dhc21fYmluZGdlbl9fY2xvc3VyZV9fV2FzbUNsb3N1cmVfX19kZXNjcmliZV9faW52b2tlX19oZThkYjVmYTE2NzcwNmEwOShhcmcwLCBhcmcxLCBhZGRIZWFwT2JqZWN0KGFyZzIpKTtcbn1cblxuZnVuY3Rpb24gX193YmdfYWRhcHRlcl81MyhhcmcwLCBhcmcxKSB7XG4gICAgd2FzbS5fZHluX2NvcmVfX29wc19fZnVuY3Rpb25fX0ZuX19fX19PdXRwdXRfX19SX2FzX3dhc21fYmluZGdlbl9fY2xvc3VyZV9fV2FzbUNsb3N1cmVfX19kZXNjcmliZV9faW52b2tlX19oZWQ1NDBjODg0NTRkZjAzMShhcmcwLCBhcmcxKTtcbn1cblxuZnVuY3Rpb24gbWFrZU11dENsb3N1cmUoYXJnMCwgYXJnMSwgZHRvciwgZikge1xuICAgIGNvbnN0IHN0YXRlID0geyBhOiBhcmcwLCBiOiBhcmcxLCBjbnQ6IDEsIGR0b3IgfTtcbiAgICBjb25zdCByZWFsID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgLy8gRmlyc3QgdXAgd2l0aCBhIGNsb3N1cmUgd2UgaW5jcmVtZW50IHRoZSBpbnRlcm5hbCByZWZlcmVuY2VcbiAgICAgICAgLy8gY291bnQuIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBSdXN0IGNsb3N1cmUgZW52aXJvbm1lbnQgd29uJ3RcbiAgICAgICAgLy8gYmUgZGVhbGxvY2F0ZWQgd2hpbGUgd2UncmUgaW52b2tpbmcgaXQuXG4gICAgICAgIHN0YXRlLmNudCsrO1xuICAgICAgICBjb25zdCBhID0gc3RhdGUuYTtcbiAgICAgICAgc3RhdGUuYSA9IDA7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gZihhLCBzdGF0ZS5iLCAuLi5hcmdzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGlmICgtLXN0YXRlLmNudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHdhc20uX193YmluZGdlbl9leHBvcnRfMi5nZXQoc3RhdGUuZHRvcikoYSwgc3RhdGUuYik7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuYSA9IGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJlYWwub3JpZ2luYWwgPSBzdGF0ZTtcblxuICAgIHJldHVybiByZWFsO1xufVxuZnVuY3Rpb24gX193YmdfYWRhcHRlcl81NihhcmcwLCBhcmcxKSB7XG4gICAgd2FzbS5fZHluX2NvcmVfX29wc19fZnVuY3Rpb25fX0ZuTXV0X19fX19PdXRwdXRfX19SX2FzX3dhc21fYmluZGdlbl9fY2xvc3VyZV9fV2FzbUNsb3N1cmVfX19kZXNjcmliZV9faW52b2tlX19oYzE4MmU0ZDUwMzU0MTk2YihhcmcwLCBhcmcxKTtcbn1cblxuZnVuY3Rpb24gX193YmdfYWRhcHRlcl81OShhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmV0cHRyID0gd2FzbS5fX3diaW5kZ2VuX2FkZF90b19zdGFja19wb2ludGVyKC0xNik7XG4gICAgICAgIHdhc20uX2R5bl9jb3JlX19vcHNfX2Z1bmN0aW9uX19Gbk11dF9fQV9fX19PdXRwdXRfX19SX2FzX3dhc21fYmluZGdlbl9fY2xvc3VyZV9fV2FzbUNsb3N1cmVfX19kZXNjcmliZV9faW52b2tlX19oN2NiYzNjMzIyOTYzNzA2ZihyZXRwdHIsIGFyZzAsIGFyZzEsIGFkZEhlYXBPYmplY3QoYXJnMikpO1xuICAgICAgICB2YXIgcjAgPSBnZXRJbnQzMk1lbW9yeTAoKVtyZXRwdHIgLyA0ICsgMF07XG4gICAgICAgIHZhciByMSA9IGdldEludDMyTWVtb3J5MCgpW3JldHB0ciAvIDQgKyAxXTtcbiAgICAgICAgaWYgKHIxKSB7XG4gICAgICAgICAgICB0aHJvdyB0YWtlT2JqZWN0KHIwKTtcbiAgICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHdhc20uX193YmluZGdlbl9hZGRfdG9fc3RhY2tfcG9pbnRlcigxNik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX3diZ19hZGFwdGVyXzYyKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICB3YXNtLl9keW5fY29yZV9fb3BzX19mdW5jdGlvbl9fRm5NdXRfX0FfX19fT3V0cHV0X19fUl9hc193YXNtX2JpbmRnZW5fX2Nsb3N1cmVfX1dhc21DbG9zdXJlX19fZGVzY3JpYmVfX2ludm9rZV9faDM3MDk4MDhmZjE3NDE5MTQoYXJnMCwgYXJnMSwgYWRkSGVhcE9iamVjdChhcmcyKSk7XG59XG5cbmZ1bmN0aW9uIF9fd2JnX2FkYXB0ZXJfNjUoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgIHdhc20uX2R5bl9jb3JlX19vcHNfX2Z1bmN0aW9uX19Gbk11dF9fQV9fX19PdXRwdXRfX19SX2FzX3dhc21fYmluZGdlbl9fY2xvc3VyZV9fV2FzbUNsb3N1cmVfX19kZXNjcmliZV9faW52b2tlX19oNmM2MTYxYWFjZDY2NDQ3OShhcmcwLCBhcmcxLCBhZGRIZWFwT2JqZWN0KGFyZzIpKTtcbn1cblxuZnVuY3Rpb24gX193YmdfYWRhcHRlcl82OChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgd2FzbS5fZHluX2NvcmVfX29wc19fZnVuY3Rpb25fX0ZuTXV0X19BX19fX091dHB1dF9fX1JfYXNfd2FzbV9iaW5kZ2VuX19jbG9zdXJlX19XYXNtQ2xvc3VyZV9fX2Rlc2NyaWJlX19pbnZva2VfX2g2OGFhOTdkMTEzZWUzNjBjKGFyZzAsIGFyZzEsIGFkZEhlYXBPYmplY3QoYXJnMikpO1xufVxuXG4vKipcbiogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZ19qc29uXG4qIEByZXR1cm5zIHtzdHJpbmd9XG4qL1xuZnVuY3Rpb24gY29yZV9jcmVhdGVfY29udGV4dChjb25maWdfanNvbikge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJldHB0ciA9IHdhc20uX193YmluZGdlbl9hZGRfdG9fc3RhY2tfcG9pbnRlcigtMTYpO1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAoY29uZmlnX2pzb24sIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgd2FzbS5jb3JlX2NyZWF0ZV9jb250ZXh0KHJldHB0ciwgcHRyMCwgbGVuMCk7XG4gICAgICAgIHZhciByMCA9IGdldEludDMyTWVtb3J5MCgpW3JldHB0ciAvIDQgKyAwXTtcbiAgICAgICAgdmFyIHIxID0gZ2V0SW50MzJNZW1vcnkwKClbcmV0cHRyIC8gNCArIDFdO1xuICAgICAgICByZXR1cm4gZ2V0U3RyaW5nRnJvbVdhc20wKHIwLCByMSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2FkZF90b19zdGFja19wb2ludGVyKDE2KTtcbiAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2ZyZWUocjAsIHIxKTtcbiAgICB9XG59XG5cbi8qKlxuKiBAcGFyYW0ge251bWJlcn0gY29udGV4dFxuKi9cbmZ1bmN0aW9uIGNvcmVfZGVzdHJveV9jb250ZXh0KGNvbnRleHQpIHtcbiAgICB3YXNtLmNvcmVfZGVzdHJveV9jb250ZXh0KGNvbnRleHQpO1xufVxuXG4vKipcbiogQHBhcmFtIHtudW1iZXJ9IGNvbnRleHRcbiogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uX25hbWVcbiogQHBhcmFtIHthbnl9IHBhcmFtc1xuKiBAcGFyYW0ge251bWJlcn0gcmVxdWVzdF9pZFxuKi9cbmZ1bmN0aW9uIGNvcmVfcmVxdWVzdChjb250ZXh0LCBmdW5jdGlvbl9uYW1lLCBwYXJhbXMsIHJlcXVlc3RfaWQpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXRwdHIgPSB3YXNtLl9fd2JpbmRnZW5fYWRkX3RvX3N0YWNrX3BvaW50ZXIoLTE2KTtcbiAgICAgICAgY29uc3QgcHRyMCA9IHBhc3NTdHJpbmdUb1dhc20wKGZ1bmN0aW9uX25hbWUsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgd2FzbS5jb3JlX3JlcXVlc3QocmV0cHRyLCBjb250ZXh0LCBwdHIwLCBsZW4wLCBhZGRIZWFwT2JqZWN0KHBhcmFtcyksIHJlcXVlc3RfaWQpO1xuICAgICAgICB2YXIgcjAgPSBnZXRJbnQzMk1lbW9yeTAoKVtyZXRwdHIgLyA0ICsgMF07XG4gICAgICAgIHZhciByMSA9IGdldEludDMyTWVtb3J5MCgpW3JldHB0ciAvIDQgKyAxXTtcbiAgICAgICAgaWYgKHIxKSB7XG4gICAgICAgICAgICB0aHJvdyB0YWtlT2JqZWN0KHIwKTtcbiAgICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHdhc20uX193YmluZGdlbl9hZGRfdG9fc3RhY2tfcG9pbnRlcigxNik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvcihmLCBhcmdzKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB3YXNtLl9fd2JpbmRnZW5fZXhuX3N0b3JlKGFkZEhlYXBPYmplY3QoZSkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0QXJyYXlVOEZyb21XYXNtMChwdHIsIGxlbikge1xuICAgIHJldHVybiBnZXRVaW50OE1lbW9yeTAoKS5zdWJhcnJheShwdHIgLyAxLCBwdHIgLyAxICsgbGVuKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZChtb2R1bGUsIGltcG9ydHMpIHtcbiAgICBpZiAodHlwZW9mIFJlc3BvbnNlID09PSAnZnVuY3Rpb24nICYmIG1vZHVsZSBpbnN0YW5jZW9mIFJlc3BvbnNlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlU3RyZWFtaW5nKG1vZHVsZSwgaW1wb3J0cyk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlLmhlYWRlcnMuZ2V0KCdDb250ZW50LVR5cGUnKSAhPSAnYXBwbGljYXRpb24vd2FzbScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiXFxgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmdcXGAgZmFpbGVkIGJlY2F1c2UgeW91ciBzZXJ2ZXIgZG9lcyBub3Qgc2VydmUgd2FzbSB3aXRoIFxcYGFwcGxpY2F0aW9uL3dhc21cXGAgTUlNRSB0eXBlLiBGYWxsaW5nIGJhY2sgdG8gXFxgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVcXGAgd2hpY2ggaXMgc2xvd2VyLiBPcmlnaW5hbCBlcnJvcjpcXFxcblwiLCBlKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnl0ZXMgPSBhd2FpdCBtb2R1bGUuYXJyYXlCdWZmZXIoKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlKGJ5dGVzLCBpbXBvcnRzKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUobW9kdWxlLCBpbXBvcnRzKTtcblxuICAgICAgICBpZiAoaW5zdGFuY2UgaW5zdGFuY2VvZiBXZWJBc3NlbWJseS5JbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgaW5zdGFuY2UsIG1vZHVsZSB9O1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEltcG9ydHMoKSB7XG4gICAgY29uc3QgaW1wb3J0cyA9IHt9O1xuICAgIGltcG9ydHMud2JnID0ge307XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3XzhkMmFmMDBiYzFlMzI5ZWUgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBFcnJvcihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9zdHJpbmdfbmV3ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX21lbW9yeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSB3YXNtLm1lbW9yeTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2J1ZmZlcl8zZjNkNzY0ZDQ3NDdkNTY0ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuYnVmZmVyO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3d2l0aGJ5dGVvZmZzZXRhbmRsZW5ndGhfZDlhYTI2NjcwM2NiOThiZSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IFVpbnQ4QXJyYXkoZ2V0T2JqZWN0KGFyZzApLCBhcmcxID4+PiAwLCBhcmcyID4+PiAwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fb2JqZWN0X2Ryb3BfcmVmID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICB0YWtlT2JqZWN0KGFyZzApO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3d2l0aGxlbmd0aF83YzQyZjdlNzM4YTlkNWQzID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXkoYXJnMCA+Pj4gMCk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRfYTY4MjE0ZjM1YzQxN2ZhOSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApW2FyZzEgPj4+IDBdID0gdGFrZU9iamVjdChhcmcyKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld3dpdGh1OGFycmF5c2VxdWVuY2VfZjg2MzI0NmFmODNlMTc4NSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IEJsb2IoZ2V0T2JqZWN0KGFyZzApKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0Xzc2NTIwMTU0NGEyYjY4NjkgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IFJlZmxlY3QuZ2V0KGdldE9iamVjdChhcmcwKSwgZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaW5zdGFuY2VvZl9BcnJheUJ1ZmZlcl9lNWU0OGY0NzYyYzU2MTBiID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gZ2V0T2JqZWN0KGFyZzApIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0ID0gcmVzdWx0O1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19vYmplY3QgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IGdldE9iamVjdChhcmcwKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKHZhbCkgPT09ICdvYmplY3QnICYmIHZhbCAhPT0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld184YzNmMDA1MjI3MmE0NTdhID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheShnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9vYmplY3RfY2xvbmVfcmVmID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19rZXlzXzA3MDIyOTRhZmFlYjYwNDQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IE9iamVjdC5rZXlzKGdldE9iamVjdChhcmcwKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19sZW5ndGhfNmUzYmJlN2M4YmQ0ZGJkOCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2dldF81NzI0NWNjN2Q3Yzc2MTlkID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMClbYXJnMSA+Pj4gMF07XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX3N0cmluZ19nZXQgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IG9iaiA9IGdldE9iamVjdChhcmcxKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKG9iaikgPT09ICdzdHJpbmcnID8gb2JqIDogdW5kZWZpbmVkO1xuICAgICAgICB2YXIgcHRyMCA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgdmFyIGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ldzBfYTU3MDU5ZDcyYzViN2FlZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0VGltZV9jYjgyYWRiMjU1NmVkMTNlID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuZ2V0VGltZSgpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9qc3ZhbF9sb29zZV9lcSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApID09IGdldE9iamVjdChhcmcxKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fYm9vbGVhbl9nZXQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHYgPSBnZXRPYmplY3QoYXJnMCk7XG4gICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZih2KSA9PT0gJ2Jvb2xlYW4nID8gKHYgPyAxIDogMCkgOiAyO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19iaWdpbnQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZihnZXRPYmplY3QoYXJnMCkpID09PSAnYmlnaW50JztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fbnVtYmVyX2dldCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3Qgb2JqID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgICAgICBjb25zdCByZXQgPSB0eXBlb2Yob2JqKSA9PT0gJ251bWJlcicgPyBvYmogOiB1bmRlZmluZWQ7XG4gICAgICAgIGdldEZsb2F0NjRNZW1vcnkwKClbYXJnMCAvIDggKyAxXSA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiByZXQ7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSAhaXNMaWtlTm9uZShyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaXNTYWZlSW50ZWdlcl9kZmEwNTkzZThkN2FjMzVhID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBOdW1iZXIuaXNTYWZlSW50ZWdlcihnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9iaWdpbnRfZ2V0X2FzX2k2NCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgdiA9IGdldE9iamVjdChhcmcxKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKHYpID09PSAnYmlnaW50JyA/IHYgOiB1bmRlZmluZWQ7XG4gICAgICAgIGdldEJpZ0ludDY0TWVtb3J5MCgpW2FyZzAgLyA4ICsgMV0gPSBpc0xpa2VOb25lKHJldCkgPyAwbiA6IHJldDtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAwXSA9ICFpc0xpa2VOb25lKHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2JpZ2ludF9mcm9tX2k2NCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gYXJnMDtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fanN2YWxfZXEgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKSA9PT0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9iaWdpbnRfZnJvbV91NjQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IEJpZ0ludC5hc1VpbnROKDY0LCBhcmcwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fZXJyb3JfbmV3ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgRXJyb3IoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2lzQXJyYXlfMjdjNDZjNjdmNDk4ZTE1ZCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gQXJyYXkuaXNBcnJheShnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaXRlcmF0b3JfNmY5ZDRmMjg4NDVmNDI2YyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSBTeW1ib2wuaXRlcmF0b3I7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2luID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkgaW4gZ2V0T2JqZWN0KGFyZzEpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZW50cmllc182NWE3NmE0MTNmYzkxMDM3ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBPYmplY3QuZW50cmllcyhnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc191bmRlZmluZWQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKSA9PT0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19udWxsID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkgPT09IG51bGw7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19TdHJpbmdfOTFmYmE3ZGVkMTNiYTU0YyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gU3RyaW5nKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAxXSA9IGxlbjA7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSBwdHIwO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9udW1iZXJfbmV3ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBhcmcwO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3XzBiOWJmZGQ5NzU4MzI4NGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IE9iamVjdCgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfU3RyaW5nXzMzMDk5ODU2ZThhODI0NmEgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IFN0cmluZyhnZXRPYmplY3QoYXJnMSkpO1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAocmV0LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jLCB3YXNtLl9fd2JpbmRnZW5fcmVhbGxvYyk7XG4gICAgICAgIGNvbnN0IGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2NvcmVyZXNwb25zZWhhbmRsZXJfYTUyODc5NDU0YzYwYzc2NCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgY29yZV9yZXNwb25zZV9oYW5kbGVyKGFyZzAgPj4+IDAsIHRha2VPYmplY3QoYXJnMSksIGFyZzIgPj4+IDAsIGFyZzMgIT09IDApO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbWVzc2FnZV9mZTJhZjYzY2NjODk4NWJjID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkubWVzc2FnZTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld18xZDlhOTIwYzZiZmM0NGE4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheSgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3XzI2OGY3YjdkZDM0MzA3OTggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IE1hcCgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0XzkzMzcyOWNmNWI2NmFjMTEgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5zZXQoZ2V0T2JqZWN0KGFyZzEpLCBnZXRPYmplY3QoYXJnMikpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19zdHJpbmcgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZihnZXRPYmplY3QoYXJnMCkpID09PSAnc3RyaW5nJztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldF9mYmMzM2QwMjBmNTA3YjcyID0gZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBnZXRPYmplY3QoYXJnMClbdGFrZU9iamVjdChhcmcxKV0gPSB0YWtlT2JqZWN0KGFyZzIpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfcHJvY2Vzc18wY2MyYWRhODUyNGQ2ZjgzID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkucHJvY2VzcztcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3ZlcnNpb25zX2MxMWFjY2VhYjI3YTZjODcgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS52ZXJzaW9ucztcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25vZGVfN2ZmMWNlNDljYWYyMzgxNSA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm5vZGU7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zdGF0aWNfYWNjZXNzb3JfTk9ERV9NT0RVTEVfY2Y2NDAxY2MxMDkxMjc5ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSBtb2R1bGU7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19yZXF1aXJlX2E3NDZlNzliMzIyYjkzMzYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5yZXF1aXJlKGdldFN0cmluZ0Zyb21XYXNtMChhcmcxLCBhcmcyKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2NyeXB0b18yMDM2YmVkN2M0NGMyNWU3ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuY3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbXNDcnlwdG9fYTIxZmM4OGNhZjFlY2RjOCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm1zQ3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3d2l0aGxlbmd0aF9mNTkzMzg1NWU0ZjQ4YTE5ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheShhcmcwID4+PiAwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3RyYW5zYWN0aW9uX2NjZTk2Y2JlYmQ4MWZlMWMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS50cmFuc2FjdGlvbihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMiksIHRha2VPYmplY3QoYXJnMykpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbmNvbXBsZXRlXzNlNTdhOGNlYzgzMjdmNjYgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbmNvbXBsZXRlID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b25lcnJvcl8wMDA1MWMwMjEzZjI3YjJjID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub25lcnJvciA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldG9uYWJvcnRfNDA0YmVlM2I5OTQwZDAzZCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLm9uYWJvcnQgPSBnZXRPYmplY3QoYXJnMSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19pdGVtXzUyYTZiZWMzNjMxNDY4N2IgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcxKS5pdGVtKGFyZzIgPj4+IDApO1xuICAgICAgICB2YXIgcHRyMCA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgdmFyIGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX29iamVjdFN0b3JlX2YxNzk3NmIwZTYzNzc4MzAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5vYmplY3RTdG9yZShnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMikpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ190YXJnZXRfYmY3MDRiN2RiN2FkMTM4NyA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnRhcmdldDtcbiAgICAgICAgcmV0dXJuIGlzTGlrZU5vbmUocmV0KSA/IDAgOiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19yZWFkeVN0YXRlX2ZiMjg3ZjE3MDExMzkxN2MgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5yZWFkeVN0YXRlO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b25zdWNjZXNzXzVmNzE1OTNiYzUxNjUzYTMgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbnN1Y2Nlc3MgPSBnZXRPYmplY3QoYXJnMSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbmVycm9yX2Q1NzcxY2M1YmY5ZWE3NGMgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbmVycm9yID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9jYl9kcm9wID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCBvYmogPSB0YWtlT2JqZWN0KGFyZzApLm9yaWdpbmFsO1xuICAgICAgICBpZiAob2JqLmNudC0tID09IDEpIHtcbiAgICAgICAgICAgIG9iai5hID0gMDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV4dF9hYWVmN2M4YWE1ZTIxMmFjID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkubmV4dCgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19kb25lXzFiNzNiMDY3MmUxNWYyMzQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5kb25lO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfdmFsdWVfMWNjYzM2YmMwMzQ2MmQ3MSA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnZhbHVlO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19mdW5jdGlvbiA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKGdldE9iamVjdChhcmcwKSkgPT09ICdmdW5jdGlvbic7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19jYWxsXzk3YWU5ZDg2NDVkYzM4OGIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5jYWxsKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25leHRfNTc5ZTU4M2QzMzU2NmE4NiA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm5leHQ7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZWxmXzZkNDc5NTA2ZjcyYzZhNzEgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gc2VsZi5zZWxmO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ193aW5kb3dfZjI1NTdjYzc4NDkwYWNlYiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCByZXQgPSB3aW5kb3cud2luZG93O1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19nbG9iYWxUaGlzXzdmMjA2YmRhNjI4ZDUyODYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2xvYmFsVGhpcy5nbG9iYWxUaGlzO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19nbG9iYWxfYmE3NWM1MGQxY2YzODRmNCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCByZXQgPSBnbG9iYWwuZ2xvYmFsO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19uZXdub2FyZ3NfYjViMDYzZmM2YzJmMDM3NiA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IEZ1bmN0aW9uKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRfODNkYjk2OTBmOTM1M2U3OSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLnNldChnZXRPYmplY3QoYXJnMSksIGFyZzIgPj4+IDApO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbGVuZ3RoXzllMWFlMTkwMGNiMGZiZDUgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5sZW5ndGg7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRfYmYzZjg5YjkyZDVhMzRiZiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gUmVmbGVjdC5zZXQoZ2V0T2JqZWN0KGFyZzApLCBnZXRPYmplY3QoYXJnMSksIGdldE9iamVjdChhcmcyKSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NlbGZfN2VlZGUxZjQ0ODhiZjM0NiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCByZXQgPSBzZWxmLnNlbGY7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2NyeXB0b19jOTA5ZmI0MjhkY2JkZGI2ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuY3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbXNDcnlwdG9fNTExZWVmZWZiZmM3MGFlNCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm1zQ3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc3RhdGljX2FjY2Vzc29yX01PRFVMRV9lZjNhYTJlYjI1MTE1OGE1ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1vZHVsZTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3JlcXVpcmVfOTAwZDVjMzk4NGZlNzcwMyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnJlcXVpcmUoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzEsIGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2dldFJhbmRvbVZhbHVlc18zMDcwNDkzNDVkMGJkODhjID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuZ2V0UmFuZG9tVmFsdWVzO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfcmFuZG9tRmlsbFN5bmNfODViM2Y0YzUyYzU2YzMxMyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLnJhbmRvbUZpbGxTeW5jKGdldEFycmF5VThGcm9tV2FzbTAoYXJnMSwgYXJnMikpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc3ViYXJyYXlfNThhZDRlZmJiNWJjYjg4NiA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnN1YmFycmF5KGFyZzEgPj4+IDAsIGFyZzIgPj4+IDApO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0UmFuZG9tVmFsdWVzX2NkMTc1OTE1NTExZjcwNWUgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5nZXRSYW5kb21WYWx1ZXMoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3JhbmRvbUZpbGxTeW5jXzA2NWFmZmZkZTAxZGFhNjYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5yYW5kb21GaWxsU3luYyhnZXRBcnJheVU4RnJvbVdhc20wKGFyZzEsIGFyZzIpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0UmFuZG9tVmFsdWVzX2I5OWVlYzQyNDRhNDc1YmIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5nZXRSYW5kb21WYWx1ZXMoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaW5zdGFuY2VvZl9VaW50OEFycmF5Xzk3MWVlZGE2OWViNzUwMDMgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBnZXRPYmplY3QoYXJnMCkgaW5zdGFuY2VvZiBVaW50OEFycmF5O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3B1dF84NGU3ZmM5M2VlZTI3YjI4ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkucHV0KGdldE9iamVjdChhcmcxKSwgZ2V0T2JqZWN0KGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZGVsZXRlXzhhYmVkZDEwNDNiNDEwNWQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5kZWxldGUoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0VGltZW91dF9kNmZjZjBkOTA2N2I4ZTY0ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuc2V0VGltZW91dChnZXRPYmplY3QoYXJnMSksIGFyZzIpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19jbGVhclRpbWVvdXRfN2Q2ZjdiZmVlZDM0YjM0OCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLmNsZWFyVGltZW91dChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld3dpdGhzdHJhbmRpbml0XzA1ZDcxODA3ODg0MjBjNDAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBSZXF1ZXN0KGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSwgZ2V0T2JqZWN0KGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaGVhZGVyc184NTgyNGU5OTNhYTczOWJmID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuaGVhZGVycztcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldF85OTJjMWQzMTU4NmIyOTU3ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMiwgYXJnMywgYXJnNCkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkuc2V0KGdldFN0cmluZ0Zyb21XYXNtMChhcmcxLCBhcmcyKSwgZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzMsIGFyZzQpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZmV0Y2hfMGZlMDQ5MDVjY2NmYzJhYSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmZldGNoKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19pbnN0YW5jZW9mX1Jlc3BvbnNlX2VhYTQyNjIyMDg0OGEzOWUgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBnZXRPYmplY3QoYXJnMCkgaW5zdGFuY2VvZiBSZXNwb25zZTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSByZXN1bHQ7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zdGF0dXNfYzRlZjNkZDU5MWU2MzQzNSA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnN0YXR1cztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3VybF83NDI4NWRkZjI3NDdjYjNkID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMSkudXJsO1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAocmV0LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jLCB3YXNtLl9fd2JpbmRnZW5fcmVhbGxvYyk7XG4gICAgICAgIGNvbnN0IGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldG9udmVyc2lvbmNoYW5nZV84NDBkNjVjZDA4ODhkZmIwID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub252ZXJzaW9uY2hhbmdlID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b251cGdyYWRlbmVlZGVkXzE3ZDBiOTUzMGYxZTBjYWMgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbnVwZ3JhZGVuZWVkZWQgPSBnZXRPYmplY3QoYXJnMSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbmJsb2NrZWRfZTY2ZDZiZTVjODc5OTgwZCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLm9uYmxvY2tlZCA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX21lc3NhZ2VfYTdhZjNlZTBjYzBmZTI4ZCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzEpLm1lc3NhZ2U7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAxXSA9IGxlbjA7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSBwdHIwO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfV2luZG93XzU2ODQzNDFmZjZkZmUzYWQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5XaW5kb3c7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19Xb3JrZXJHbG9iYWxTY29wZV9lMDQ0N2ZmY2FlOGJiMjcyID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuV29ya2VyR2xvYmFsU2NvcGU7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19pbmRleGVkREJfMDUwZjA5NjJhYjYwN2FjNSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmluZGV4ZWREQjtcbiAgICAgICAgcmV0dXJuIGlzTGlrZU5vbmUocmV0KSA/IDAgOiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2luZGV4ZWREQl84ZDllOWFiNDYxNmRmN2YwID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuaW5kZXhlZERCO1xuICAgICAgICByZXR1cm4gaXNMaWtlTm9uZShyZXQpID8gMCA6IGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfb3Blbl9hMzFjM2ZlMWZkYzI0NGViID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkub3BlbihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMikpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19uZXd3aXRoc3RyX2Q1YjVmOWI5ODVlZTg0ZmIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBXZWJTb2NrZXQoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpLCBnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMiwgYXJnMykpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19uZXdfZDI5ZTUwN2Y2NjA2ZGU5MSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IFdlYlNvY2tldChnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbm1lc3NhZ2VfYzVhODA2YjYyYTBjNTYwNyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLm9ubWVzc2FnZSA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldG9ub3Blbl85Y2U0OGRjZTU3ZTU0OWI1ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub25vcGVuID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b25lcnJvcl8wMjM5MzI2MGIzZTI5OTcyID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub25lcnJvciA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NlbmRfODBiMjU2ZDg3YTY3NzllNSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLnNlbmQoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzEsIGFyZzIpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZGF0YV83YjFmMDFmNGU2YTY0ZmJlID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuZGF0YTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3N0cmluZ2lmeV9kNjQ3MWQzMDBkZWQ5YjY4ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBKU09OLnN0cmluZ2lmeShnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19vYmplY3RTdG9yZU5hbWVzXzhjMDZjNDBkMmIwNTE0MWMgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5vYmplY3RTdG9yZU5hbWVzO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfY3JlYXRlT2JqZWN0U3RvcmVfZDNlMjc4OWMxM2RkZTFmYyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmNyZWF0ZU9iamVjdFN0b3JlKGdldFN0cmluZ0Zyb21XYXNtMChhcmcxLCBhcmcyKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2luc3RhbmNlb2ZfRXJyb3JfNTZiNDk2YTEwYTU2ZGU2NiA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGdldE9iamVjdChhcmcwKSBpbnN0YW5jZW9mIEVycm9yO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2dldFRpbWV6b25lT2Zmc2V0Xzg5YmQ0Mjc1ZTFjYTgzNDEgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9kZWJ1Z19zdHJpbmcgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGRlYnVnU3RyaW5nKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAxXSA9IGxlbjA7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSBwdHIwO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl90aHJvdyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ190aGVuX2NlZGFkMjBmYmJkOTQxOGEgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS50aGVuKGdldE9iamVjdChhcmcxKSwgZ2V0T2JqZWN0KGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3Jlc29sdmVfOTlmZTE3OTY0ZjMxZmZjMCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gUHJvbWlzZS5yZXNvbHZlKGdldE9iamVjdChhcmcwKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ190aGVuXzExZjdhNTRkNjdiNGJmYWQgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS50aGVuKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19yZXN1bHRfOWUzOTljMTQ2NzY5NzBkOSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnJlc3VsdDtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZXJyb3JfYWFjZjVhYzE5MWU1NGVkMCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmVycm9yO1xuICAgICAgICByZXR1cm4gaXNMaWtlTm9uZShyZXQpID8gMCA6IGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0XzYyODViZjQ1OGExZWU3NTggPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5nZXQoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaW5zdGFuY2VvZl9XaW5kb3dfYWNjOTdmZjlmNWQyYzdiNCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0ID0gcmVzdWx0O1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfY2xvc2VfNDVkMDUzYmVhNTllNzc0NiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLmNsb3NlKCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3RleHRfMTE2OWQ3NTJjYzY5NzkwMyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnRleHQoKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9jbG9zdXJlX3dyYXBwZXI5NDcgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VDbG9zdXJlKGFyZzAsIGFyZzEsIDQ0LCBfX3diZ19hZGFwdGVyXzUwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fY2xvc3VyZV93cmFwcGVyOTU4ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBtYWtlQ2xvc3VyZShhcmcwLCBhcmcxLCA0NywgX193YmdfYWRhcHRlcl81Myk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjYxNTkgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDIzOCwgX193YmdfYWRhcHRlcl81Nik7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjY4MjQgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDI0NywgX193YmdfYWRhcHRlcl81OSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjY4NzQgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDI0NCwgX193YmdfYWRhcHRlcl82Mik7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjY4NzUgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDEyMDYsIF9fd2JnX2FkYXB0ZXJfNjUpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9jbG9zdXJlX3dyYXBwZXI2ODc2ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBtYWtlTXV0Q2xvc3VyZShhcmcwLCBhcmcxLCAyNDEsIF9fd2JnX2FkYXB0ZXJfNjgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG5cbiAgICByZXR1cm4gaW1wb3J0cztcbn1cblxuZnVuY3Rpb24gaW5pdE1lbW9yeShpbXBvcnRzLCBtYXliZV9tZW1vcnkpIHtcblxufVxuXG5mdW5jdGlvbiBmaW5hbGl6ZUluaXQoaW5zdGFuY2UsIG1vZHVsZSkge1xuICAgIHdhc20gPSBpbnN0YW5jZS5leHBvcnRzO1xuICAgIGluaXQuX193YmluZGdlbl93YXNtX21vZHVsZSA9IG1vZHVsZTtcbiAgICBjYWNoZWRCaWdJbnQ2NE1lbW9yeTAgPSBuZXcgQmlnSW50NjRBcnJheSgpO1xuICAgIGNhY2hlZEZsb2F0NjRNZW1vcnkwID0gbmV3IEZsb2F0NjRBcnJheSgpO1xuICAgIGNhY2hlZEludDMyTWVtb3J5MCA9IG5ldyBJbnQzMkFycmF5KCk7XG4gICAgY2FjaGVkVWludDhNZW1vcnkwID0gbmV3IFVpbnQ4QXJyYXkoKTtcblxuXG4gICAgcmV0dXJuIHdhc207XG59XG5cbmZ1bmN0aW9uIGluaXRTeW5jKG1vZHVsZSkge1xuICAgIGNvbnN0IGltcG9ydHMgPSBnZXRJbXBvcnRzKCk7XG5cbiAgICBpbml0TWVtb3J5KGltcG9ydHMpO1xuXG4gICAgaWYgKCEobW9kdWxlIGluc3RhbmNlb2YgV2ViQXNzZW1ibHkuTW9kdWxlKSkge1xuICAgICAgICBtb2R1bGUgPSBuZXcgV2ViQXNzZW1ibHkuTW9kdWxlKG1vZHVsZSk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgV2ViQXNzZW1ibHkuSW5zdGFuY2UobW9kdWxlLCBpbXBvcnRzKTtcblxuICAgIHJldHVybiBmaW5hbGl6ZUluaXQoaW5zdGFuY2UsIG1vZHVsZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXQoaW5wdXQpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAndW5kZWZpbmVkJykgeyAgICB9XG4gICAgY29uc3QgaW1wb3J0cyA9IGdldEltcG9ydHMoKTtcblxuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnIHx8ICh0eXBlb2YgUmVxdWVzdCA9PT0gJ2Z1bmN0aW9uJyAmJiBpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpIHx8ICh0eXBlb2YgVVJMID09PSAnZnVuY3Rpb24nICYmIGlucHV0IGluc3RhbmNlb2YgVVJMKSkge1xuICAgICAgICBpbnB1dCA9IGZldGNoKGlucHV0KTtcbiAgICB9XG5cbiAgICBpbml0TWVtb3J5KGltcG9ydHMpO1xuXG4gICAgY29uc3QgeyBpbnN0YW5jZSwgbW9kdWxlIH0gPSBhd2FpdCBsb2FkKGF3YWl0IGlucHV0LCBpbXBvcnRzKTtcblxuICAgIHJldHVybiBmaW5hbGl6ZUluaXQoaW5zdGFuY2UsIG1vZHVsZSk7XG59XG5cblxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogV1JBUFBFUiBFTkRcblxuZnVuY3Rpb24gcmVwbGFjZVVuZGVmaW5lZFdpdGhOdWxscyh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IFtdIDoge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHJlcGxhY2VVbmRlZmluZWRXaXRoTnVsbHModmFsdWVba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxuZnVuY3Rpb24gY29yZV9yZXNwb25zZV9oYW5kbGVyKHJlcXVlc3RfaWQsIHBhcmFtcywgcmVzcG9uc2VfdHlwZSwgZmluaXNoZWQpIHtcbiAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdyZXNwb25zZScsXG4gICAgICAgIHJlcXVlc3RJZDogcmVxdWVzdF9pZCxcbiAgICAgICAgcGFyYW1zOiByZXBsYWNlVW5kZWZpbmVkV2l0aE51bGxzKHBhcmFtcyksXG4gICAgICAgIHJlc3BvbnNlVHlwZTogcmVzcG9uc2VfdHlwZSxcbiAgICAgICAgZmluaXNoZWQsXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcGxhY2VCbG9ic1dpdGhBcnJheUJ1ZmZlcnModmFsdWUpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCB2YWx1ZS5hcnJheUJ1ZmZlcigpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImJpZ2ludFwiKSB7XG4gICAgICAgIGlmICh2YWx1ZSA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSICYmIHZhbHVlID4gTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIpIHtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IFtdIDoge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IGF3YWl0IHJlcGxhY2VCbG9ic1dpdGhBcnJheUJ1ZmZlcnModmFsdWVba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5zZWxmLm9ubWVzc2FnZSA9IChlKSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGUuZGF0YTtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgIGNhc2UgJ2luaXQnOlxuICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgaW5pdChtZXNzYWdlLndhc21Nb2R1bGUpO1xuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyB0eXBlOiAnaW5pdCcgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnY3JlYXRlQ29udGV4dCc6XG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdjcmVhdGVDb250ZXh0JyxcbiAgICAgICAgICAgIHJlc3VsdDogY29yZV9jcmVhdGVfY29udGV4dChtZXNzYWdlLmNvbmZpZ0pzb24pLFxuICAgICAgICAgICAgcmVxdWVzdElkOiBtZXNzYWdlLnJlcXVlc3RJZCxcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnZGVzdHJveUNvbnRleHQnOlxuICAgICAgICBjb3JlX2Rlc3Ryb3lfY29udGV4dChtZXNzYWdlLmNvbnRleHQpO1xuICAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiAnZGVzdHJveUNvbnRleHQnXG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcblxuICAgIGNhc2UgJ3JlcXVlc3QnOlxuICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29yZV9yZXF1ZXN0KFxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuY29udGV4dCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICBhd2FpdCByZXBsYWNlQmxvYnNXaXRoQXJyYXlCdWZmZXJzKG1lc3NhZ2UuZnVuY3Rpb25QYXJhbXMpLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2UucmVxdWVzdElkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSkoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcbmA7XG5cbmxldCBvcHRpb25zID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGxpYldlYlNldHVwKGxpYk9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gbGliT3B0aW9ucztcbn1cblxuZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZGVidWdMb2cpIHtcbiAgICAgICAgb3B0aW9ucy5kZWJ1Z0xvZyhtZXNzYWdlKTtcbiAgICB9XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gbG9hZE1vZHVsZSgpIHtcbiAgICBjb25zdCBzdGFydExvYWRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBsZXQgd2FzbU1vZHVsZTtcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmxvYWRNb2R1bGUpIHtcbiAgICAgICAgd2FzbU1vZHVsZSA9IGF3YWl0IG9wdGlvbnMubG9hZE1vZHVsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmZXRjaGVkID0gZmV0Y2goKG9wdGlvbnMgJiYgb3B0aW9ucy5iaW5hcnlVUkwpIHx8IFwiL2V2ZXJzZGsud2FzbVwiKTtcbiAgICAgICAgaWYgKFdlYkFzc2VtYmx5LmNvbXBpbGVTdHJlYW1pbmcpIHtcbiAgICAgICAgICAgIGRlYnVnTG9nKFwiY29tcGlsZVN0cmVhbWluZyBiaW5hcnlcIik7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgV2ViQXNzZW1ibHkuY29tcGlsZVN0cmVhbWluZyhmZXRjaGVkKTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1Z0xvZyhcImNvbXBpbGUgYmluYXJ5XCIpO1xuICAgICAgICB3YXNtTW9kdWxlID0gYXdhaXQgV2ViQXNzZW1ibHkuY29tcGlsZShhd2FpdCAoYXdhaXQgZmV0Y2hlZCkuYXJyYXlCdWZmZXIoKSk7XG4gICAgfVxuICAgIGF3YWl0IGluaXQod2FzbU1vZHVsZSk7XG4gICAgZGVidWdMb2coYGNvbXBpbGUgdGltZSAke0RhdGUubm93KCkgLSBzdGFydExvYWRUaW1lfWApO1xufVxuXG5mdW5jdGlvbiB3aXRoU2VwYXJhdGVXb3JrZXIoKSB7XG4gICAgZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmRlYnVnTG9nKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRlYnVnTG9nKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgd29ya2VyQmxvYiA9IG5ldyBCbG9iKFxuICAgICAgICBbd29ya2VyU2NyaXB0XSxcbiAgICAgICAgeyB0eXBlOiBcImFwcGxpY2F0aW9uL2phdmFzY3JpcHRcIiB9LFxuICAgICk7XG4gICAgY29uc3Qgd29ya2VyVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTCh3b3JrZXJCbG9iKTtcbiAgICBjb25zdCB3b3JrZXIgPSBuZXcgV29ya2VyKHdvcmtlclVybCk7XG5cblxuICAgIGxldCBuZXh0Q3JlYXRlQ29udGV4dFJlcXVlc3RJZCA9IDE7XG4gICAgY29uc3QgY3JlYXRlQ29udGV4dFJlcXVlc3RzID0gbmV3IE1hcCgpO1xuICAgIGxldCBpbml0Q29tcGxldGUgPSBmYWxzZTtcblxuICAgIGxldCByZXNwb25zZUhhbmRsZXIgPSBudWxsO1xuXG4gICAgd29ya2VyLm9ubWVzc2FnZSA9IChldnQpID0+IHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGV2dC5kYXRhO1xuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgICAgICBjYXNlIFwiaW5pdFwiOlxuICAgICAgICAgICAgaW5pdENvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW3JlcXVlc3RJZCwgcmVxdWVzdF0gb2YgY3JlYXRlQ29udGV4dFJlcXVlc3RzLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlQ29udGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ0pzb246IHJlcXVlc3QuY29uZmlnSnNvbixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY3JlYXRlQ29udGV4dFwiOlxuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IGNyZWF0ZUNvbnRleHRSZXF1ZXN0cy5nZXQobWVzc2FnZS5yZXF1ZXN0SWQpO1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVDb250ZXh0UmVxdWVzdHMuZGVsZXRlKG1lc3NhZ2UucmVxdWVzdElkKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc29sdmUobWVzc2FnZS5yZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZXN0cm95Q29udGV4dFwiOlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJyZXNwb25zZVwiOlxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlSGFuZGxlcikge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlcihcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5yZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UucGFyYW1zLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnJlc3BvbnNlVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5maW5pc2hlZCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgd29ya2VyLm9uZXJyb3IgPSAoZXZ0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBFcnJvciBmcm9tIFdlYiBXb3JrZXI6ICR7ZXZ0Lm1lc3NhZ2V9YCk7XG4gICAgfTtcblxuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcImluaXRcIixcbiAgICAgICAgICAgIHdhc21Nb2R1bGU6IGF3YWl0IGxvYWRNb2R1bGUoKSxcbiAgICAgICAgfSk7XG4gICAgfSkoKTtcblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBzZXRSZXNwb25zZVBhcmFtc0hhbmRsZXI6IChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgICByZXNwb25zZUhhbmRsZXIgPSBoYW5kbGVyO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVDb250ZXh0OiAoY29uZmlnSnNvbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdElkID0gbmV4dENyZWF0ZUNvbnRleHRSZXF1ZXN0SWQ7XG4gICAgICAgICAgICAgICAgbmV4dENyZWF0ZUNvbnRleHRSZXF1ZXN0SWQgKz0gMTtcbiAgICAgICAgICAgICAgICBjcmVhdGVDb250ZXh0UmVxdWVzdHMuc2V0KHJlcXVlc3RJZCwge1xuICAgICAgICAgICAgICAgICAgICBjb25maWdKc29uLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChpbml0Q29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlQ29udGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnSnNvbixcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlc3Ryb3lDb250ZXh0OiAoY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImRlc3Ryb3lDb250ZXh0XCIsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzZW5kUmVxdWVzdFBhcmFtczogKGNvbnRleHQsIHJlcXVlc3RJZCwgZnVuY3Rpb25OYW1lLCBmdW5jdGlvblBhcmFtcykgPT4ge1xuICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInJlcXVlc3RcIixcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb25QYXJhbXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gd2l0aG91dFNlcGFyYXRlV29ya2VyKCkge1xuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogV1JBUFBFUiBCRUdJTlxuXG5sZXQgd2FzbTtcblxuY29uc3QgY2FjaGVkVGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JywgeyBpZ25vcmVCT006IHRydWUsIGZhdGFsOiB0cnVlIH0pO1xuXG5jYWNoZWRUZXh0RGVjb2Rlci5kZWNvZGUoKTtcblxubGV0IGNhY2hlZFVpbnQ4TWVtb3J5MCA9IG5ldyBVaW50OEFycmF5KCk7XG5cbmZ1bmN0aW9uIGdldFVpbnQ4TWVtb3J5MCgpIHtcbiAgICBpZiAoY2FjaGVkVWludDhNZW1vcnkwLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgICAgY2FjaGVkVWludDhNZW1vcnkwID0gbmV3IFVpbnQ4QXJyYXkod2FzbS5tZW1vcnkuYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZFVpbnQ4TWVtb3J5MDtcbn1cblxuZnVuY3Rpb24gZ2V0U3RyaW5nRnJvbVdhc20wKHB0ciwgbGVuKSB7XG4gICAgcmV0dXJuIGNhY2hlZFRleHREZWNvZGVyLmRlY29kZShnZXRVaW50OE1lbW9yeTAoKS5zdWJhcnJheShwdHIsIHB0ciArIGxlbikpO1xufVxuXG5jb25zdCBoZWFwID0gbmV3IEFycmF5KDMyKS5maWxsKHVuZGVmaW5lZCk7XG5cbmhlYXAucHVzaCh1bmRlZmluZWQsIG51bGwsIHRydWUsIGZhbHNlKTtcblxubGV0IGhlYXBfbmV4dCA9IGhlYXAubGVuZ3RoO1xuXG5mdW5jdGlvbiBhZGRIZWFwT2JqZWN0KG9iaikge1xuICAgIGlmIChoZWFwX25leHQgPT09IGhlYXAubGVuZ3RoKSBoZWFwLnB1c2goaGVhcC5sZW5ndGggKyAxKTtcbiAgICBjb25zdCBpZHggPSBoZWFwX25leHQ7XG4gICAgaGVhcF9uZXh0ID0gaGVhcFtpZHhdO1xuXG4gICAgaGVhcFtpZHhdID0gb2JqO1xuICAgIHJldHVybiBpZHg7XG59XG5cbmZ1bmN0aW9uIGdldE9iamVjdChpZHgpIHsgcmV0dXJuIGhlYXBbaWR4XTsgfVxuXG5mdW5jdGlvbiBkcm9wT2JqZWN0KGlkeCkge1xuICAgIGlmIChpZHggPCAzNikgcmV0dXJuO1xuICAgIGhlYXBbaWR4XSA9IGhlYXBfbmV4dDtcbiAgICBoZWFwX25leHQgPSBpZHg7XG59XG5cbmZ1bmN0aW9uIHRha2VPYmplY3QoaWR4KSB7XG4gICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGlkeCk7XG4gICAgZHJvcE9iamVjdChpZHgpO1xuICAgIHJldHVybiByZXQ7XG59XG5cbmxldCBXQVNNX1ZFQ1RPUl9MRU4gPSAwO1xuXG5jb25zdCBjYWNoZWRUZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigndXRmLTgnKTtcblxuY29uc3QgZW5jb2RlU3RyaW5nID0gKHR5cGVvZiBjYWNoZWRUZXh0RW5jb2Rlci5lbmNvZGVJbnRvID09PSAnZnVuY3Rpb24nXG4gICAgPyBmdW5jdGlvbiAoYXJnLCB2aWV3KSB7XG4gICAgcmV0dXJuIGNhY2hlZFRleHRFbmNvZGVyLmVuY29kZUludG8oYXJnLCB2aWV3KTtcbn1cbiAgICA6IGZ1bmN0aW9uIChhcmcsIHZpZXcpIHtcbiAgICBjb25zdCBidWYgPSBjYWNoZWRUZXh0RW5jb2Rlci5lbmNvZGUoYXJnKTtcbiAgICB2aWV3LnNldChidWYpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlYWQ6IGFyZy5sZW5ndGgsXG4gICAgICAgIHdyaXR0ZW46IGJ1Zi5sZW5ndGhcbiAgICB9O1xufSk7XG5cbmZ1bmN0aW9uIHBhc3NTdHJpbmdUb1dhc20wKGFyZywgbWFsbG9jLCByZWFsbG9jKSB7XG5cbiAgICBpZiAocmVhbGxvYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IGNhY2hlZFRleHRFbmNvZGVyLmVuY29kZShhcmcpO1xuICAgICAgICBjb25zdCBwdHIgPSBtYWxsb2MoYnVmLmxlbmd0aCk7XG4gICAgICAgIGdldFVpbnQ4TWVtb3J5MCgpLnN1YmFycmF5KHB0ciwgcHRyICsgYnVmLmxlbmd0aCkuc2V0KGJ1Zik7XG4gICAgICAgIFdBU01fVkVDVE9SX0xFTiA9IGJ1Zi5sZW5ndGg7XG4gICAgICAgIHJldHVybiBwdHI7XG4gICAgfVxuXG4gICAgbGV0IGxlbiA9IGFyZy5sZW5ndGg7XG4gICAgbGV0IHB0ciA9IG1hbGxvYyhsZW4pO1xuXG4gICAgY29uc3QgbWVtID0gZ2V0VWludDhNZW1vcnkwKCk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gMDtcblxuICAgIGZvciAoOyBvZmZzZXQgPCBsZW47IG9mZnNldCsrKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBhcmcuY2hhckNvZGVBdChvZmZzZXQpO1xuICAgICAgICBpZiAoY29kZSA+IDB4N0YpIGJyZWFrO1xuICAgICAgICBtZW1bcHRyICsgb2Zmc2V0XSA9IGNvZGU7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldCAhPT0gbGVuKSB7XG4gICAgICAgIGlmIChvZmZzZXQgIT09IDApIHtcbiAgICAgICAgICAgIGFyZyA9IGFyZy5zbGljZShvZmZzZXQpO1xuICAgICAgICB9XG4gICAgICAgIHB0ciA9IHJlYWxsb2MocHRyLCBsZW4sIGxlbiA9IG9mZnNldCArIGFyZy5sZW5ndGggKiAzKTtcbiAgICAgICAgY29uc3QgdmlldyA9IGdldFVpbnQ4TWVtb3J5MCgpLnN1YmFycmF5KHB0ciArIG9mZnNldCwgcHRyICsgbGVuKTtcbiAgICAgICAgY29uc3QgcmV0ID0gZW5jb2RlU3RyaW5nKGFyZywgdmlldyk7XG5cbiAgICAgICAgb2Zmc2V0ICs9IHJldC53cml0dGVuO1xuICAgIH1cblxuICAgIFdBU01fVkVDVE9SX0xFTiA9IG9mZnNldDtcbiAgICByZXR1cm4gcHRyO1xufVxuXG5mdW5jdGlvbiBpc0xpa2VOb25lKHgpIHtcbiAgICByZXR1cm4geCA9PT0gdW5kZWZpbmVkIHx8IHggPT09IG51bGw7XG59XG5cbmxldCBjYWNoZWRJbnQzMk1lbW9yeTAgPSBuZXcgSW50MzJBcnJheSgpO1xuXG5mdW5jdGlvbiBnZXRJbnQzMk1lbW9yeTAoKSB7XG4gICAgaWYgKGNhY2hlZEludDMyTWVtb3J5MC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNhY2hlZEludDMyTWVtb3J5MCA9IG5ldyBJbnQzMkFycmF5KHdhc20ubWVtb3J5LmJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRJbnQzMk1lbW9yeTA7XG59XG5cbmxldCBjYWNoZWRGbG9hdDY0TWVtb3J5MCA9IG5ldyBGbG9hdDY0QXJyYXkoKTtcblxuZnVuY3Rpb24gZ2V0RmxvYXQ2NE1lbW9yeTAoKSB7XG4gICAgaWYgKGNhY2hlZEZsb2F0NjRNZW1vcnkwLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgICAgY2FjaGVkRmxvYXQ2NE1lbW9yeTAgPSBuZXcgRmxvYXQ2NEFycmF5KHdhc20ubWVtb3J5LmJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRGbG9hdDY0TWVtb3J5MDtcbn1cblxubGV0IGNhY2hlZEJpZ0ludDY0TWVtb3J5MCA9IG5ldyBCaWdJbnQ2NEFycmF5KCk7XG5cbmZ1bmN0aW9uIGdldEJpZ0ludDY0TWVtb3J5MCgpIHtcbiAgICBpZiAoY2FjaGVkQmlnSW50NjRNZW1vcnkwLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgICAgY2FjaGVkQmlnSW50NjRNZW1vcnkwID0gbmV3IEJpZ0ludDY0QXJyYXkod2FzbS5tZW1vcnkuYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZEJpZ0ludDY0TWVtb3J5MDtcbn1cblxuZnVuY3Rpb24gZGVidWdTdHJpbmcodmFsKSB7XG4gICAgLy8gcHJpbWl0aXZlIHR5cGVzXG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnYm9vbGVhbicgfHwgdmFsID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICBgJHt2YWx9YDtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGBcIiR7dmFsfVwiYDtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB2YWwuZGVzY3JpcHRpb247XG4gICAgICAgIGlmIChkZXNjcmlwdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1N5bWJvbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gYFN5bWJvbCgke2Rlc2NyaXB0aW9ufSlgO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHZhbC5uYW1lO1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT0gJ3N0cmluZycgJiYgbmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYEZ1bmN0aW9uKCR7bmFtZX0pYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnRnVuY3Rpb24nO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIG9iamVjdHNcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHZhbC5sZW5ndGg7XG4gICAgICAgIGxldCBkZWJ1ZyA9ICdbJztcbiAgICAgICAgaWYgKGxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGRlYnVnICs9IGRlYnVnU3RyaW5nKHZhbFswXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKGxldCBpID0gMTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyArPSAnLCAnICsgZGVidWdTdHJpbmcodmFsW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZyArPSAnXSc7XG4gICAgICAgIHJldHVybiBkZWJ1ZztcbiAgICB9XG4gICAgLy8gVGVzdCBmb3IgYnVpbHQtaW5cbiAgICBjb25zdCBidWlsdEluTWF0Y2hlcyA9IC9cXFtvYmplY3QgKFteXFxdXSspXFxdLy5leGVjKHRvU3RyaW5nLmNhbGwodmFsKSk7XG4gICAgbGV0IGNsYXNzTmFtZTtcbiAgICBpZiAoYnVpbHRJbk1hdGNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgICBjbGFzc05hbWUgPSBidWlsdEluTWF0Y2hlc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWlsZWQgdG8gbWF0Y2ggdGhlIHN0YW5kYXJkICdbb2JqZWN0IENsYXNzTmFtZV0nXG4gICAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKHZhbCk7XG4gICAgfVxuICAgIGlmIChjbGFzc05hbWUgPT0gJ09iamVjdCcpIHtcbiAgICAgICAgLy8gd2UncmUgYSB1c2VyIGRlZmluZWQgY2xhc3Mgb3IgT2JqZWN0XG4gICAgICAgIC8vIEpTT04uc3RyaW5naWZ5IGF2b2lkcyBwcm9ibGVtcyB3aXRoIGN5Y2xlcywgYW5kIGlzIGdlbmVyYWxseSBtdWNoXG4gICAgICAgIC8vIGVhc2llciB0aGFuIGxvb3BpbmcgdGhyb3VnaCBvd25Qcm9wZXJ0aWVzIG9mIGB2YWxgLlxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuICdPYmplY3QoJyArIEpTT04uc3RyaW5naWZ5KHZhbCkgKyAnKSc7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICAgIHJldHVybiAnT2JqZWN0JztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBlcnJvcnNcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbC5uYW1lfTogJHt2YWwubWVzc2FnZX1cXG4ke3ZhbC5zdGFja31gO1xuICAgIH1cbiAgICAvLyBUT0RPIHdlIGNvdWxkIHRlc3QgZm9yIG1vcmUgdGhpbmdzIGhlcmUsIGxpa2UgYFNldGBzIGFuZCBgTWFwYHMuXG4gICAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gbWFrZUNsb3N1cmUoYXJnMCwgYXJnMSwgZHRvciwgZikge1xuICAgIGNvbnN0IHN0YXRlID0geyBhOiBhcmcwLCBiOiBhcmcxLCBjbnQ6IDEsIGR0b3IgfTtcbiAgICBjb25zdCByZWFsID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgLy8gRmlyc3QgdXAgd2l0aCBhIGNsb3N1cmUgd2UgaW5jcmVtZW50IHRoZSBpbnRlcm5hbCByZWZlcmVuY2VcbiAgICAgICAgLy8gY291bnQuIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBSdXN0IGNsb3N1cmUgZW52aXJvbm1lbnQgd29uJ3RcbiAgICAgICAgLy8gYmUgZGVhbGxvY2F0ZWQgd2hpbGUgd2UncmUgaW52b2tpbmcgaXQuXG4gICAgICAgIHN0YXRlLmNudCsrO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGYoc3RhdGUuYSwgc3RhdGUuYiwgLi4uYXJncyk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAoLS1zdGF0ZS5jbnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICB3YXNtLl9fd2JpbmRnZW5fZXhwb3J0XzIuZ2V0KHN0YXRlLmR0b3IpKHN0YXRlLmEsIHN0YXRlLmIpO1xuICAgICAgICAgICAgICAgIHN0YXRlLmEgPSAwO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJlYWwub3JpZ2luYWwgPSBzdGF0ZTtcblxuICAgIHJldHVybiByZWFsO1xufVxuZnVuY3Rpb24gX193YmdfYWRhcHRlcl81MChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgd2FzbS5fZHluX2NvcmVfX29wc19fZnVuY3Rpb25fX0ZuX19BX19fX091dHB1dF9fX1JfYXNfd2FzbV9iaW5kZ2VuX19jbG9zdXJlX19XYXNtQ2xvc3VyZV9fX2Rlc2NyaWJlX19pbnZva2VfX2hlOGRiNWZhMTY3NzA2YTA5KGFyZzAsIGFyZzEsIGFkZEhlYXBPYmplY3QoYXJnMikpO1xufVxuXG5mdW5jdGlvbiBfX3diZ19hZGFwdGVyXzUzKGFyZzAsIGFyZzEpIHtcbiAgICB3YXNtLl9keW5fY29yZV9fb3BzX19mdW5jdGlvbl9fRm5fX19fX091dHB1dF9fX1JfYXNfd2FzbV9iaW5kZ2VuX19jbG9zdXJlX19XYXNtQ2xvc3VyZV9fX2Rlc2NyaWJlX19pbnZva2VfX2hlZDU0MGM4ODQ1NGRmMDMxKGFyZzAsIGFyZzEpO1xufVxuXG5mdW5jdGlvbiBtYWtlTXV0Q2xvc3VyZShhcmcwLCBhcmcxLCBkdG9yLCBmKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB7IGE6IGFyZzAsIGI6IGFyZzEsIGNudDogMSwgZHRvciB9O1xuICAgIGNvbnN0IHJlYWwgPSAoLi4uYXJncykgPT4ge1xuICAgICAgICAvLyBGaXJzdCB1cCB3aXRoIGEgY2xvc3VyZSB3ZSBpbmNyZW1lbnQgdGhlIGludGVybmFsIHJlZmVyZW5jZVxuICAgICAgICAvLyBjb3VudC4gVGhpcyBlbnN1cmVzIHRoYXQgdGhlIFJ1c3QgY2xvc3VyZSBlbnZpcm9ubWVudCB3b24ndFxuICAgICAgICAvLyBiZSBkZWFsbG9jYXRlZCB3aGlsZSB3ZSdyZSBpbnZva2luZyBpdC5cbiAgICAgICAgc3RhdGUuY250Kys7XG4gICAgICAgIGNvbnN0IGEgPSBzdGF0ZS5hO1xuICAgICAgICBzdGF0ZS5hID0gMDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmKGEsIHN0YXRlLmIsIC4uLmFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKC0tc3RhdGUuY250ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2V4cG9ydF8yLmdldChzdGF0ZS5kdG9yKShhLCBzdGF0ZS5iKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hID0gYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmVhbC5vcmlnaW5hbCA9IHN0YXRlO1xuXG4gICAgcmV0dXJuIHJlYWw7XG59XG5mdW5jdGlvbiBfX3diZ19hZGFwdGVyXzU2KGFyZzAsIGFyZzEpIHtcbiAgICB3YXNtLl9keW5fY29yZV9fb3BzX19mdW5jdGlvbl9fRm5NdXRfX19fX091dHB1dF9fX1JfYXNfd2FzbV9iaW5kZ2VuX19jbG9zdXJlX19XYXNtQ2xvc3VyZV9fX2Rlc2NyaWJlX19pbnZva2VfX2hjMTgyZTRkNTAzNTQxOTZiKGFyZzAsIGFyZzEpO1xufVxuXG5mdW5jdGlvbiBfX3diZ19hZGFwdGVyXzU5KGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXRwdHIgPSB3YXNtLl9fd2JpbmRnZW5fYWRkX3RvX3N0YWNrX3BvaW50ZXIoLTE2KTtcbiAgICAgICAgd2FzbS5fZHluX2NvcmVfX29wc19fZnVuY3Rpb25fX0ZuTXV0X19BX19fX091dHB1dF9fX1JfYXNfd2FzbV9iaW5kZ2VuX19jbG9zdXJlX19XYXNtQ2xvc3VyZV9fX2Rlc2NyaWJlX19pbnZva2VfX2g3Y2JjM2MzMjI5NjM3MDZmKHJldHB0ciwgYXJnMCwgYXJnMSwgYWRkSGVhcE9iamVjdChhcmcyKSk7XG4gICAgICAgIHZhciByMCA9IGdldEludDMyTWVtb3J5MCgpW3JldHB0ciAvIDQgKyAwXTtcbiAgICAgICAgdmFyIHIxID0gZ2V0SW50MzJNZW1vcnkwKClbcmV0cHRyIC8gNCArIDFdO1xuICAgICAgICBpZiAocjEpIHtcbiAgICAgICAgICAgIHRocm93IHRha2VPYmplY3QocjApO1xuICAgICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2FkZF90b19zdGFja19wb2ludGVyKDE2KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fd2JnX2FkYXB0ZXJfNjIoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgIHdhc20uX2R5bl9jb3JlX19vcHNfX2Z1bmN0aW9uX19Gbk11dF9fQV9fX19PdXRwdXRfX19SX2FzX3dhc21fYmluZGdlbl9fY2xvc3VyZV9fV2FzbUNsb3N1cmVfX19kZXNjcmliZV9faW52b2tlX19oMzcwOTgwOGZmMTc0MTkxNChhcmcwLCBhcmcxLCBhZGRIZWFwT2JqZWN0KGFyZzIpKTtcbn1cblxuZnVuY3Rpb24gX193YmdfYWRhcHRlcl82NShhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgd2FzbS5fZHluX2NvcmVfX29wc19fZnVuY3Rpb25fX0ZuTXV0X19BX19fX091dHB1dF9fX1JfYXNfd2FzbV9iaW5kZ2VuX19jbG9zdXJlX19XYXNtQ2xvc3VyZV9fX2Rlc2NyaWJlX19pbnZva2VfX2g2YzYxNjFhYWNkNjY0NDc5KGFyZzAsIGFyZzEsIGFkZEhlYXBPYmplY3QoYXJnMikpO1xufVxuXG5mdW5jdGlvbiBfX3diZ19hZGFwdGVyXzY4KGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICB3YXNtLl9keW5fY29yZV9fb3BzX19mdW5jdGlvbl9fRm5NdXRfX0FfX19fT3V0cHV0X19fUl9hc193YXNtX2JpbmRnZW5fX2Nsb3N1cmVfX1dhc21DbG9zdXJlX19fZGVzY3JpYmVfX2ludm9rZV9faDY4YWE5N2QxMTNlZTM2MGMoYXJnMCwgYXJnMSwgYWRkSGVhcE9iamVjdChhcmcyKSk7XG59XG5cbi8qKlxuKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnX2pzb25cbiogQHJldHVybnMge3N0cmluZ31cbiovXG5mdW5jdGlvbiBjb3JlX2NyZWF0ZV9jb250ZXh0KGNvbmZpZ19qc29uKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmV0cHRyID0gd2FzbS5fX3diaW5kZ2VuX2FkZF90b19zdGFja19wb2ludGVyKC0xNik7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChjb25maWdfanNvbiwgd2FzbS5fX3diaW5kZ2VuX21hbGxvYywgd2FzbS5fX3diaW5kZ2VuX3JlYWxsb2MpO1xuICAgICAgICBjb25zdCBsZW4wID0gV0FTTV9WRUNUT1JfTEVOO1xuICAgICAgICB3YXNtLmNvcmVfY3JlYXRlX2NvbnRleHQocmV0cHRyLCBwdHIwLCBsZW4wKTtcbiAgICAgICAgdmFyIHIwID0gZ2V0SW50MzJNZW1vcnkwKClbcmV0cHRyIC8gNCArIDBdO1xuICAgICAgICB2YXIgcjEgPSBnZXRJbnQzMk1lbW9yeTAoKVtyZXRwdHIgLyA0ICsgMV07XG4gICAgICAgIHJldHVybiBnZXRTdHJpbmdGcm9tV2FzbTAocjAsIHIxKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICB3YXNtLl9fd2JpbmRnZW5fYWRkX3RvX3N0YWNrX3BvaW50ZXIoMTYpO1xuICAgICAgICB3YXNtLl9fd2JpbmRnZW5fZnJlZShyMCwgcjEpO1xuICAgIH1cbn1cblxuLyoqXG4qIEBwYXJhbSB7bnVtYmVyfSBjb250ZXh0XG4qL1xuZnVuY3Rpb24gY29yZV9kZXN0cm95X2NvbnRleHQoY29udGV4dCkge1xuICAgIHdhc20uY29yZV9kZXN0cm95X2NvbnRleHQoY29udGV4dCk7XG59XG5cbi8qKlxuKiBAcGFyYW0ge251bWJlcn0gY29udGV4dFxuKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25fbmFtZVxuKiBAcGFyYW0ge2FueX0gcGFyYW1zXG4qIEBwYXJhbSB7bnVtYmVyfSByZXF1ZXN0X2lkXG4qL1xuZnVuY3Rpb24gY29yZV9yZXF1ZXN0KGNvbnRleHQsIGZ1bmN0aW9uX25hbWUsIHBhcmFtcywgcmVxdWVzdF9pZCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJldHB0ciA9IHdhc20uX193YmluZGdlbl9hZGRfdG9fc3RhY2tfcG9pbnRlcigtMTYpO1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAoZnVuY3Rpb25fbmFtZSwgd2FzbS5fX3diaW5kZ2VuX21hbGxvYywgd2FzbS5fX3diaW5kZ2VuX3JlYWxsb2MpO1xuICAgICAgICBjb25zdCBsZW4wID0gV0FTTV9WRUNUT1JfTEVOO1xuICAgICAgICB3YXNtLmNvcmVfcmVxdWVzdChyZXRwdHIsIGNvbnRleHQsIHB0cjAsIGxlbjAsIGFkZEhlYXBPYmplY3QocGFyYW1zKSwgcmVxdWVzdF9pZCk7XG4gICAgICAgIHZhciByMCA9IGdldEludDMyTWVtb3J5MCgpW3JldHB0ciAvIDQgKyAwXTtcbiAgICAgICAgdmFyIHIxID0gZ2V0SW50MzJNZW1vcnkwKClbcmV0cHRyIC8gNCArIDFdO1xuICAgICAgICBpZiAocjEpIHtcbiAgICAgICAgICAgIHRocm93IHRha2VPYmplY3QocjApO1xuICAgICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2FkZF90b19zdGFja19wb2ludGVyKDE2KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yKGYsIGFyZ3MpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHdhc20uX193YmluZGdlbl9leG5fc3RvcmUoYWRkSGVhcE9iamVjdChlKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRBcnJheVU4RnJvbVdhc20wKHB0ciwgbGVuKSB7XG4gICAgcmV0dXJuIGdldFVpbnQ4TWVtb3J5MCgpLnN1YmFycmF5KHB0ciAvIDEsIHB0ciAvIDEgKyBsZW4pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkKG1vZHVsZSwgaW1wb3J0cykge1xuICAgIGlmICh0eXBlb2YgUmVzcG9uc2UgPT09ICdmdW5jdGlvbicgJiYgbW9kdWxlIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZVN0cmVhbWluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmcobW9kdWxlLCBpbXBvcnRzKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChtb2R1bGUuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpICE9ICdhcHBsaWNhdGlvbi93YXNtJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmdgIGZhaWxlZCBiZWNhdXNlIHlvdXIgc2VydmVyIGRvZXMgbm90IHNlcnZlIHdhc20gd2l0aCBgYXBwbGljYXRpb24vd2FzbWAgTUlNRSB0eXBlLiBGYWxsaW5nIGJhY2sgdG8gYFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlYCB3aGljaCBpcyBzbG93ZXIuIE9yaWdpbmFsIGVycm9yOlxcblwiLCBlKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnl0ZXMgPSBhd2FpdCBtb2R1bGUuYXJyYXlCdWZmZXIoKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlKGJ5dGVzLCBpbXBvcnRzKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUobW9kdWxlLCBpbXBvcnRzKTtcblxuICAgICAgICBpZiAoaW5zdGFuY2UgaW5zdGFuY2VvZiBXZWJBc3NlbWJseS5JbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgaW5zdGFuY2UsIG1vZHVsZSB9O1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEltcG9ydHMoKSB7XG4gICAgY29uc3QgaW1wb3J0cyA9IHt9O1xuICAgIGltcG9ydHMud2JnID0ge307XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3XzhkMmFmMDBiYzFlMzI5ZWUgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBFcnJvcihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9zdHJpbmdfbmV3ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX21lbW9yeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSB3YXNtLm1lbW9yeTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2J1ZmZlcl8zZjNkNzY0ZDQ3NDdkNTY0ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuYnVmZmVyO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3d2l0aGJ5dGVvZmZzZXRhbmRsZW5ndGhfZDlhYTI2NjcwM2NiOThiZSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IFVpbnQ4QXJyYXkoZ2V0T2JqZWN0KGFyZzApLCBhcmcxID4+PiAwLCBhcmcyID4+PiAwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fb2JqZWN0X2Ryb3BfcmVmID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICB0YWtlT2JqZWN0KGFyZzApO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3d2l0aGxlbmd0aF83YzQyZjdlNzM4YTlkNWQzID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXkoYXJnMCA+Pj4gMCk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRfYTY4MjE0ZjM1YzQxN2ZhOSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApW2FyZzEgPj4+IDBdID0gdGFrZU9iamVjdChhcmcyKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld3dpdGh1OGFycmF5c2VxdWVuY2VfZjg2MzI0NmFmODNlMTc4NSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IEJsb2IoZ2V0T2JqZWN0KGFyZzApKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0Xzc2NTIwMTU0NGEyYjY4NjkgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IFJlZmxlY3QuZ2V0KGdldE9iamVjdChhcmcwKSwgZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaW5zdGFuY2VvZl9BcnJheUJ1ZmZlcl9lNWU0OGY0NzYyYzU2MTBiID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gZ2V0T2JqZWN0KGFyZzApIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0ID0gcmVzdWx0O1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19vYmplY3QgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IGdldE9iamVjdChhcmcwKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKHZhbCkgPT09ICdvYmplY3QnICYmIHZhbCAhPT0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld184YzNmMDA1MjI3MmE0NTdhID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheShnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9vYmplY3RfY2xvbmVfcmVmID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19rZXlzXzA3MDIyOTRhZmFlYjYwNDQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IE9iamVjdC5rZXlzKGdldE9iamVjdChhcmcwKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19sZW5ndGhfNmUzYmJlN2M4YmQ0ZGJkOCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2dldF81NzI0NWNjN2Q3Yzc2MTlkID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMClbYXJnMSA+Pj4gMF07XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX3N0cmluZ19nZXQgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IG9iaiA9IGdldE9iamVjdChhcmcxKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKG9iaikgPT09ICdzdHJpbmcnID8gb2JqIDogdW5kZWZpbmVkO1xuICAgICAgICB2YXIgcHRyMCA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgdmFyIGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ldzBfYTU3MDU5ZDcyYzViN2FlZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0VGltZV9jYjgyYWRiMjU1NmVkMTNlID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuZ2V0VGltZSgpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9qc3ZhbF9sb29zZV9lcSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApID09IGdldE9iamVjdChhcmcxKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fYm9vbGVhbl9nZXQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHYgPSBnZXRPYmplY3QoYXJnMCk7XG4gICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZih2KSA9PT0gJ2Jvb2xlYW4nID8gKHYgPyAxIDogMCkgOiAyO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19iaWdpbnQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZihnZXRPYmplY3QoYXJnMCkpID09PSAnYmlnaW50JztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fbnVtYmVyX2dldCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3Qgb2JqID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgICAgICBjb25zdCByZXQgPSB0eXBlb2Yob2JqKSA9PT0gJ251bWJlcicgPyBvYmogOiB1bmRlZmluZWQ7XG4gICAgICAgIGdldEZsb2F0NjRNZW1vcnkwKClbYXJnMCAvIDggKyAxXSA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiByZXQ7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSAhaXNMaWtlTm9uZShyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaXNTYWZlSW50ZWdlcl9kZmEwNTkzZThkN2FjMzVhID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBOdW1iZXIuaXNTYWZlSW50ZWdlcihnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9iaWdpbnRfZ2V0X2FzX2k2NCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgdiA9IGdldE9iamVjdChhcmcxKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKHYpID09PSAnYmlnaW50JyA/IHYgOiB1bmRlZmluZWQ7XG4gICAgICAgIGdldEJpZ0ludDY0TWVtb3J5MCgpW2FyZzAgLyA4ICsgMV0gPSBpc0xpa2VOb25lKHJldCkgPyAwbiA6IHJldDtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAwXSA9ICFpc0xpa2VOb25lKHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2JpZ2ludF9mcm9tX2k2NCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gYXJnMDtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fanN2YWxfZXEgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKSA9PT0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9iaWdpbnRfZnJvbV91NjQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IEJpZ0ludC5hc1VpbnROKDY0LCBhcmcwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fZXJyb3JfbmV3ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgRXJyb3IoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2lzQXJyYXlfMjdjNDZjNjdmNDk4ZTE1ZCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gQXJyYXkuaXNBcnJheShnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaXRlcmF0b3JfNmY5ZDRmMjg4NDVmNDI2YyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSBTeW1ib2wuaXRlcmF0b3I7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2luID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkgaW4gZ2V0T2JqZWN0KGFyZzEpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZW50cmllc182NWE3NmE0MTNmYzkxMDM3ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBPYmplY3QuZW50cmllcyhnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc191bmRlZmluZWQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKSA9PT0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19udWxsID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkgPT09IG51bGw7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19TdHJpbmdfOTFmYmE3ZGVkMTNiYTU0YyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gU3RyaW5nKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAxXSA9IGxlbjA7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSBwdHIwO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9udW1iZXJfbmV3ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBhcmcwO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3XzBiOWJmZGQ5NzU4MzI4NGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IE9iamVjdCgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfU3RyaW5nXzMzMDk5ODU2ZThhODI0NmEgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IFN0cmluZyhnZXRPYmplY3QoYXJnMSkpO1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAocmV0LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jLCB3YXNtLl9fd2JpbmRnZW5fcmVhbGxvYyk7XG4gICAgICAgIGNvbnN0IGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2NvcmVyZXNwb25zZWhhbmRsZXJfYTUyODc5NDU0YzYwYzc2NCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgY29yZV9yZXNwb25zZV9oYW5kbGVyKGFyZzAgPj4+IDAsIHRha2VPYmplY3QoYXJnMSksIGFyZzIgPj4+IDAsIGFyZzMgIT09IDApO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbWVzc2FnZV9mZTJhZjYzY2NjODk4NWJjID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkubWVzc2FnZTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld18xZDlhOTIwYzZiZmM0NGE4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheSgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3XzI2OGY3YjdkZDM0MzA3OTggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IE1hcCgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0XzkzMzcyOWNmNWI2NmFjMTEgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5zZXQoZ2V0T2JqZWN0KGFyZzEpLCBnZXRPYmplY3QoYXJnMikpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19zdHJpbmcgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZihnZXRPYmplY3QoYXJnMCkpID09PSAnc3RyaW5nJztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldF9mYmMzM2QwMjBmNTA3YjcyID0gZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBnZXRPYmplY3QoYXJnMClbdGFrZU9iamVjdChhcmcxKV0gPSB0YWtlT2JqZWN0KGFyZzIpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfcHJvY2Vzc18wY2MyYWRhODUyNGQ2ZjgzID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkucHJvY2VzcztcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3ZlcnNpb25zX2MxMWFjY2VhYjI3YTZjODcgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS52ZXJzaW9ucztcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25vZGVfN2ZmMWNlNDljYWYyMzgxNSA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm5vZGU7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zdGF0aWNfYWNjZXNzb3JfTk9ERV9NT0RVTEVfY2Y2NDAxY2MxMDkxMjc5ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByZXQgPSBtb2R1bGU7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19yZXF1aXJlX2E3NDZlNzliMzIyYjkzMzYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5yZXF1aXJlKGdldFN0cmluZ0Zyb21XYXNtMChhcmcxLCBhcmcyKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2NyeXB0b18yMDM2YmVkN2M0NGMyNWU3ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuY3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbXNDcnlwdG9fYTIxZmM4OGNhZjFlY2RjOCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm1zQ3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV3d2l0aGxlbmd0aF9mNTkzMzg1NWU0ZjQ4YTE5ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheShhcmcwID4+PiAwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3RyYW5zYWN0aW9uX2NjZTk2Y2JlYmQ4MWZlMWMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS50cmFuc2FjdGlvbihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMiksIHRha2VPYmplY3QoYXJnMykpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbmNvbXBsZXRlXzNlNTdhOGNlYzgzMjdmNjYgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbmNvbXBsZXRlID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b25lcnJvcl8wMDA1MWMwMjEzZjI3YjJjID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub25lcnJvciA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldG9uYWJvcnRfNDA0YmVlM2I5OTQwZDAzZCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLm9uYWJvcnQgPSBnZXRPYmplY3QoYXJnMSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19pdGVtXzUyYTZiZWMzNjMxNDY4N2IgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcxKS5pdGVtKGFyZzIgPj4+IDApO1xuICAgICAgICB2YXIgcHRyMCA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgdmFyIGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX29iamVjdFN0b3JlX2YxNzk3NmIwZTYzNzc4MzAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5vYmplY3RTdG9yZShnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMikpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ190YXJnZXRfYmY3MDRiN2RiN2FkMTM4NyA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnRhcmdldDtcbiAgICAgICAgcmV0dXJuIGlzTGlrZU5vbmUocmV0KSA/IDAgOiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19yZWFkeVN0YXRlX2ZiMjg3ZjE3MDExMzkxN2MgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5yZWFkeVN0YXRlO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b25zdWNjZXNzXzVmNzE1OTNiYzUxNjUzYTMgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbnN1Y2Nlc3MgPSBnZXRPYmplY3QoYXJnMSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbmVycm9yX2Q1NzcxY2M1YmY5ZWE3NGMgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbmVycm9yID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9jYl9kcm9wID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCBvYmogPSB0YWtlT2JqZWN0KGFyZzApLm9yaWdpbmFsO1xuICAgICAgICBpZiAob2JqLmNudC0tID09IDEpIHtcbiAgICAgICAgICAgIG9iai5hID0gMDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbmV4dF9hYWVmN2M4YWE1ZTIxMmFjID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkubmV4dCgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19kb25lXzFiNzNiMDY3MmUxNWYyMzQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5kb25lO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfdmFsdWVfMWNjYzM2YmMwMzQ2MmQ3MSA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnZhbHVlO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9pc19mdW5jdGlvbiA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKGdldE9iamVjdChhcmcwKSkgPT09ICdmdW5jdGlvbic7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19jYWxsXzk3YWU5ZDg2NDVkYzM4OGIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5jYWxsKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25leHRfNTc5ZTU4M2QzMzU2NmE4NiA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm5leHQ7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZWxmXzZkNDc5NTA2ZjcyYzZhNzEgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gc2VsZi5zZWxmO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ193aW5kb3dfZjI1NTdjYzc4NDkwYWNlYiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCByZXQgPSB3aW5kb3cud2luZG93O1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19nbG9iYWxUaGlzXzdmMjA2YmRhNjI4ZDUyODYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2xvYmFsVGhpcy5nbG9iYWxUaGlzO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19nbG9iYWxfYmE3NWM1MGQxY2YzODRmNCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCByZXQgPSBnbG9iYWwuZ2xvYmFsO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19uZXdub2FyZ3NfYjViMDYzZmM2YzJmMDM3NiA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IEZ1bmN0aW9uKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRfODNkYjk2OTBmOTM1M2U3OSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLnNldChnZXRPYmplY3QoYXJnMSksIGFyZzIgPj4+IDApO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbGVuZ3RoXzllMWFlMTkwMGNiMGZiZDUgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5sZW5ndGg7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRfYmYzZjg5YjkyZDVhMzRiZiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gUmVmbGVjdC5zZXQoZ2V0T2JqZWN0KGFyZzApLCBnZXRPYmplY3QoYXJnMSksIGdldE9iamVjdChhcmcyKSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NlbGZfN2VlZGUxZjQ0ODhiZjM0NiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCByZXQgPSBzZWxmLnNlbGY7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2NyeXB0b19jOTA5ZmI0MjhkY2JkZGI2ID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuY3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfbXNDcnlwdG9fNTExZWVmZWZiZmM3MGFlNCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLm1zQ3J5cHRvO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc3RhdGljX2FjY2Vzc29yX01PRFVMRV9lZjNhYTJlYjI1MTE1OGE1ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1vZHVsZTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3JlcXVpcmVfOTAwZDVjMzk4NGZlNzcwMyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnJlcXVpcmUoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzEsIGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2dldFJhbmRvbVZhbHVlc18zMDcwNDkzNDVkMGJkODhjID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuZ2V0UmFuZG9tVmFsdWVzO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfcmFuZG9tRmlsbFN5bmNfODViM2Y0YzUyYzU2YzMxMyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLnJhbmRvbUZpbGxTeW5jKGdldEFycmF5VThGcm9tV2FzbTAoYXJnMSwgYXJnMikpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc3ViYXJyYXlfNThhZDRlZmJiNWJjYjg4NiA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnN1YmFycmF5KGFyZzEgPj4+IDAsIGFyZzIgPj4+IDApO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0UmFuZG9tVmFsdWVzX2NkMTc1OTE1NTExZjcwNWUgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5nZXRSYW5kb21WYWx1ZXMoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3JhbmRvbUZpbGxTeW5jXzA2NWFmZmZkZTAxZGFhNjYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5yYW5kb21GaWxsU3luYyhnZXRBcnJheVU4RnJvbVdhc20wKGFyZzEsIGFyZzIpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0UmFuZG9tVmFsdWVzX2I5OWVlYzQyNDRhNDc1YmIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5nZXRSYW5kb21WYWx1ZXMoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaW5zdGFuY2VvZl9VaW50OEFycmF5Xzk3MWVlZGE2OWViNzUwMDMgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBnZXRPYmplY3QoYXJnMCkgaW5zdGFuY2VvZiBVaW50OEFycmF5O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3B1dF84NGU3ZmM5M2VlZTI3YjI4ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkucHV0KGdldE9iamVjdChhcmcxKSwgZ2V0T2JqZWN0KGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZGVsZXRlXzhhYmVkZDEwNDNiNDEwNWQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5kZWxldGUoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0VGltZW91dF9kNmZjZjBkOTA2N2I4ZTY0ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuc2V0VGltZW91dChnZXRPYmplY3QoYXJnMSksIGFyZzIpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19jbGVhclRpbWVvdXRfN2Q2ZjdiZmVlZDM0YjM0OCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLmNsZWFyVGltZW91dChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX25ld3dpdGhzdHJhbmRpbml0XzA1ZDcxODA3ODg0MjBjNDAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBSZXF1ZXN0KGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSwgZ2V0T2JqZWN0KGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaGVhZGVyc184NTgyNGU5OTNhYTczOWJmID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuaGVhZGVycztcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldF85OTJjMWQzMTU4NmIyOTU3ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMiwgYXJnMywgYXJnNCkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkuc2V0KGdldFN0cmluZ0Zyb21XYXNtMChhcmcxLCBhcmcyKSwgZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzMsIGFyZzQpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZmV0Y2hfMGZlMDQ5MDVjY2NmYzJhYSA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmZldGNoKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19pbnN0YW5jZW9mX1Jlc3BvbnNlX2VhYTQyNjIyMDg0OGEzOWUgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBnZXRPYmplY3QoYXJnMCkgaW5zdGFuY2VvZiBSZXNwb25zZTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSByZXN1bHQ7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zdGF0dXNfYzRlZjNkZDU5MWU2MzQzNSA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnN0YXR1cztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3VybF83NDI4NWRkZjI3NDdjYjNkID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMSkudXJsO1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAocmV0LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jLCB3YXNtLl9fd2JpbmRnZW5fcmVhbGxvYyk7XG4gICAgICAgIGNvbnN0IGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMV0gPSBsZW4wO1xuICAgICAgICBnZXRJbnQzMk1lbW9yeTAoKVthcmcwIC8gNCArIDBdID0gcHRyMDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldG9udmVyc2lvbmNoYW5nZV84NDBkNjVjZDA4ODhkZmIwID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub252ZXJzaW9uY2hhbmdlID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b251cGdyYWRlbmVlZGVkXzE3ZDBiOTUzMGYxZTBjYWMgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGdldE9iamVjdChhcmcwKS5vbnVwZ3JhZGVuZWVkZWQgPSBnZXRPYmplY3QoYXJnMSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbmJsb2NrZWRfZTY2ZDZiZTVjODc5OTgwZCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLm9uYmxvY2tlZCA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX21lc3NhZ2VfYTdhZjNlZTBjYzBmZTI4ZCA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzEpLm1lc3NhZ2U7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAxXSA9IGxlbjA7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSBwdHIwO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfV2luZG93XzU2ODQzNDFmZjZkZmUzYWQgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5XaW5kb3c7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19Xb3JrZXJHbG9iYWxTY29wZV9lMDQ0N2ZmY2FlOGJiMjcyID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuV29ya2VyR2xvYmFsU2NvcGU7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19pbmRleGVkREJfMDUwZjA5NjJhYjYwN2FjNSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmluZGV4ZWREQjtcbiAgICAgICAgcmV0dXJuIGlzTGlrZU5vbmUocmV0KSA/IDAgOiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2luZGV4ZWREQl84ZDllOWFiNDYxNmRmN2YwID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuaW5kZXhlZERCO1xuICAgICAgICByZXR1cm4gaXNMaWtlTm9uZShyZXQpID8gMCA6IGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfb3Blbl9hMzFjM2ZlMWZkYzI0NGViID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkub3BlbihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMikpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19uZXd3aXRoc3RyX2Q1YjVmOWI5ODVlZTg0ZmIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBXZWJTb2NrZXQoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpLCBnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMiwgYXJnMykpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19uZXdfZDI5ZTUwN2Y2NjA2ZGU5MSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IFdlYlNvY2tldChnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19zZXRvbm1lc3NhZ2VfYzVhODA2YjYyYTBjNTYwNyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLm9ubWVzc2FnZSA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NldG9ub3Blbl85Y2U0OGRjZTU3ZTU0OWI1ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub25vcGVuID0gZ2V0T2JqZWN0KGFyZzEpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193Ymdfc2V0b25lcnJvcl8wMjM5MzI2MGIzZTI5OTcyID0gZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICBnZXRPYmplY3QoYXJnMCkub25lcnJvciA9IGdldE9iamVjdChhcmcxKTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3NlbmRfODBiMjU2ZDg3YTY3NzllNSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLnNlbmQoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzEsIGFyZzIpKTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZGF0YV83YjFmMDFmNGU2YTY0ZmJlID0gZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBnZXRPYmplY3QoYXJnMCkuZGF0YTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3N0cmluZ2lmeV9kNjQ3MWQzMDBkZWQ5YjY4ID0gZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICBjb25zdCByZXQgPSBKU09OLnN0cmluZ2lmeShnZXRPYmplY3QoYXJnMCkpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH0sIGFyZ3VtZW50cykgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19vYmplY3RTdG9yZU5hbWVzXzhjMDZjNDBkMmIwNTE0MWMgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5vYmplY3RTdG9yZU5hbWVzO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfY3JlYXRlT2JqZWN0U3RvcmVfZDNlMjc4OWMxM2RkZTFmYyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmNyZWF0ZU9iamVjdFN0b3JlKGdldFN0cmluZ0Zyb21XYXNtMChhcmcxLCBhcmcyKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2luc3RhbmNlb2ZfRXJyb3JfNTZiNDk2YTEwYTU2ZGU2NiA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGdldE9iamVjdChhcmcwKSBpbnN0YW5jZW9mIEVycm9yO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX2dldFRpbWV6b25lT2Zmc2V0Xzg5YmQ0Mjc1ZTFjYTgzNDEgPSBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9kZWJ1Z19zdHJpbmcgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGRlYnVnU3RyaW5nKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIGNvbnN0IHB0cjAgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgY29uc3QgbGVuMCA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgZ2V0SW50MzJNZW1vcnkwKClbYXJnMCAvIDQgKyAxXSA9IGxlbjA7XG4gICAgICAgIGdldEludDMyTWVtb3J5MCgpW2FyZzAgLyA0ICsgMF0gPSBwdHIwO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl90aHJvdyA9IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ190aGVuX2NlZGFkMjBmYmJkOTQxOGEgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS50aGVuKGdldE9iamVjdChhcmcxKSwgZ2V0T2JqZWN0KGFyZzIpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3Jlc29sdmVfOTlmZTE3OTY0ZjMxZmZjMCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gUHJvbWlzZS5yZXNvbHZlKGdldE9iamVjdChhcmcwKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ190aGVuXzExZjdhNTRkNjdiNGJmYWQgPSBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS50aGVuKGdldE9iamVjdChhcmcxKSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diZ19yZXN1bHRfOWUzOTljMTQ2NzY5NzBkOSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnJlc3VsdDtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZXJyb3JfYWFjZjVhYzE5MWU1NGVkMCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLmVycm9yO1xuICAgICAgICByZXR1cm4gaXNMaWtlTm9uZShyZXQpID8gMCA6IGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfZ2V0XzYyODViZjQ1OGExZWU3NTggPSBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IGdldE9iamVjdChhcmcwKS5nZXQoZ2V0T2JqZWN0KGFyZzEpKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfaW5zdGFuY2VvZl9XaW5kb3dfYWNjOTdmZjlmNWQyYzdiNCA9IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0ID0gcmVzdWx0O1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmdfY2xvc2VfNDVkMDUzYmVhNTllNzc0NiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgZ2V0T2JqZWN0KGFyZzApLmNsb3NlKCk7XG4gICAgfSwgYXJndW1lbnRzKSB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JnX3RleHRfMTE2OWQ3NTJjYzY5NzkwMyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzApIHtcbiAgICAgICAgY29uc3QgcmV0ID0gZ2V0T2JqZWN0KGFyZzApLnRleHQoKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9LCBhcmd1bWVudHMpIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9jbG9zdXJlX3dyYXBwZXI5NDcgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VDbG9zdXJlKGFyZzAsIGFyZzEsIDQ0LCBfX3diZ19hZGFwdGVyXzUwKTtcbiAgICAgICAgcmV0dXJuIGFkZEhlYXBPYmplY3QocmV0KTtcbiAgICB9O1xuICAgIGltcG9ydHMud2JnLl9fd2JpbmRnZW5fY2xvc3VyZV93cmFwcGVyOTU4ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBtYWtlQ2xvc3VyZShhcmcwLCBhcmcxLCA0NywgX193YmdfYWRhcHRlcl81Myk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjYxNTkgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDIzOCwgX193YmdfYWRhcHRlcl81Nik7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjY4MjQgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDI0NywgX193YmdfYWRhcHRlcl81OSk7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjY4NzQgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDI0NCwgX193YmdfYWRhcHRlcl82Mik7XG4gICAgICAgIHJldHVybiBhZGRIZWFwT2JqZWN0KHJldCk7XG4gICAgfTtcbiAgICBpbXBvcnRzLndiZy5fX3diaW5kZ2VuX2Nsb3N1cmVfd3JhcHBlcjY4NzUgPSBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIDEyMDYsIF9fd2JnX2FkYXB0ZXJfNjUpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG4gICAgaW1wb3J0cy53YmcuX193YmluZGdlbl9jbG9zdXJlX3dyYXBwZXI2ODc2ID0gZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICBjb25zdCByZXQgPSBtYWtlTXV0Q2xvc3VyZShhcmcwLCBhcmcxLCAyNDEsIF9fd2JnX2FkYXB0ZXJfNjgpO1xuICAgICAgICByZXR1cm4gYWRkSGVhcE9iamVjdChyZXQpO1xuICAgIH07XG5cbiAgICByZXR1cm4gaW1wb3J0cztcbn1cblxuZnVuY3Rpb24gaW5pdE1lbW9yeShpbXBvcnRzLCBtYXliZV9tZW1vcnkpIHtcblxufVxuXG5mdW5jdGlvbiBmaW5hbGl6ZUluaXQoaW5zdGFuY2UsIG1vZHVsZSkge1xuICAgIHdhc20gPSBpbnN0YW5jZS5leHBvcnRzO1xuICAgIGluaXQuX193YmluZGdlbl93YXNtX21vZHVsZSA9IG1vZHVsZTtcbiAgICBjYWNoZWRCaWdJbnQ2NE1lbW9yeTAgPSBuZXcgQmlnSW50NjRBcnJheSgpO1xuICAgIGNhY2hlZEZsb2F0NjRNZW1vcnkwID0gbmV3IEZsb2F0NjRBcnJheSgpO1xuICAgIGNhY2hlZEludDMyTWVtb3J5MCA9IG5ldyBJbnQzMkFycmF5KCk7XG4gICAgY2FjaGVkVWludDhNZW1vcnkwID0gbmV3IFVpbnQ4QXJyYXkoKTtcblxuXG4gICAgcmV0dXJuIHdhc207XG59XG5cbmZ1bmN0aW9uIGluaXRTeW5jKG1vZHVsZSkge1xuICAgIGNvbnN0IGltcG9ydHMgPSBnZXRJbXBvcnRzKCk7XG5cbiAgICBpbml0TWVtb3J5KGltcG9ydHMpO1xuXG4gICAgaWYgKCEobW9kdWxlIGluc3RhbmNlb2YgV2ViQXNzZW1ibHkuTW9kdWxlKSkge1xuICAgICAgICBtb2R1bGUgPSBuZXcgV2ViQXNzZW1ibHkuTW9kdWxlKG1vZHVsZSk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgV2ViQXNzZW1ibHkuSW5zdGFuY2UobW9kdWxlLCBpbXBvcnRzKTtcblxuICAgIHJldHVybiBmaW5hbGl6ZUluaXQoaW5zdGFuY2UsIG1vZHVsZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXQoaW5wdXQpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAndW5kZWZpbmVkJykgeyAgICB9XG4gICAgY29uc3QgaW1wb3J0cyA9IGdldEltcG9ydHMoKTtcblxuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnIHx8ICh0eXBlb2YgUmVxdWVzdCA9PT0gJ2Z1bmN0aW9uJyAmJiBpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpIHx8ICh0eXBlb2YgVVJMID09PSAnZnVuY3Rpb24nICYmIGlucHV0IGluc3RhbmNlb2YgVVJMKSkge1xuICAgICAgICBpbnB1dCA9IGZldGNoKGlucHV0KTtcbiAgICB9XG5cbiAgICBpbml0TWVtb3J5KGltcG9ydHMpO1xuXG4gICAgY29uc3QgeyBpbnN0YW5jZSwgbW9kdWxlIH0gPSBhd2FpdCBsb2FkKGF3YWl0IGlucHV0LCBpbXBvcnRzKTtcblxuICAgIHJldHVybiBmaW5hbGl6ZUluaXQoaW5zdGFuY2UsIG1vZHVsZSk7XG59XG5cblxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogV1JBUFBFUiBFTkRcbiAgICBmdW5jdGlvbiByZXBsYWNlVW5kZWZpbmVkV2l0aE51bGxzKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHJlcGxhY2VVbmRlZmluZWRXaXRoTnVsbHModmFsdWVba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiByZXBsYWNlQmxvYnNXaXRoQXJyYXlCdWZmZXJzKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB2YWx1ZS5hcnJheUJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYmlnaW50XCIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSICYmIHZhbHVlID4gTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IGF3YWl0IHJlcGxhY2VCbG9ic1dpdGhBcnJheUJ1ZmZlcnModmFsdWVba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cblxuICAgIGxldCBkZWZlcnJlZENyZWF0ZUNvbnRleHQgPSBbXTtcbiAgICBsZXQgcmVzcG9uc2VIYW5kbGVyID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIGNvcmVfcmVzcG9uc2VfaGFuZGxlcihyZXF1ZXN0X2lkLCBwYXJhbXMsIHJlc3BvbnNlX3R5cGUsIGZpbmlzaGVkKSB7XG4gICAgICAgIGlmIChyZXNwb25zZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlcihcbiAgICAgICAgICAgICAgICByZXF1ZXN0X2lkLFxuICAgICAgICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICAgICAgICByZXNwb25zZV90eXBlLFxuICAgICAgICAgICAgICAgIGZpbmlzaGVkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGluaXQoYXdhaXQgbG9hZE1vZHVsZSgpKTtcbiAgICAgICAgZm9yIChjb25zdCBjcmVhdGVDb250ZXh0IG9mIGRlZmVycmVkQ3JlYXRlQ29udGV4dCkge1xuICAgICAgICAgICAgY3JlYXRlQ29udGV4dC5yZXNvbHZlKGNvcmVfY3JlYXRlX2NvbnRleHQoY3JlYXRlQ29udGV4dC5jb25maWdKc29uKSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVmZXJyZWRDcmVhdGVDb250ZXh0ID0gbnVsbDtcbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHNldFJlc3BvbnNlUGFyYW1zSGFuZGxlcjogKGhhbmRsZXIpID0+IHtcbiAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlciA9IGhhbmRsZXI7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZUNvbnRleHQ6IChjb25maWdKc29uKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWRDcmVhdGVDb250ZXh0ID09PSBudWxsXG4gICAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoY29yZV9jcmVhdGVfY29udGV4dChjb25maWdKc29uKSlcbiAgICAgICAgICAgICAgICA6IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkQ3JlYXRlQ29udGV4dC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ0pzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVzdHJveUNvbnRleHQ6IChjb250ZXh0KSA9PiB7XG4gICAgICAgICAgICBjb3JlX2Rlc3Ryb3lfY29udGV4dChjb250ZXh0KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VuZFJlcXVlc3RQYXJhbXM6IChjb250ZXh0LCByZXF1ZXN0SWQsIGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25QYXJhbXMpID0+IHtcbiAgICAgICAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29yZV9yZXF1ZXN0KFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlcGxhY2VCbG9ic1dpdGhBcnJheUJ1ZmZlcnMoZnVuY3Rpb25QYXJhbXMpLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pKCk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpYldlYigpIHtcbiAgICByZXR1cm4gb3B0aW9ucyAmJiBvcHRpb25zLmRpc2FibGVTZXBhcmF0ZVdvcmtlciA/IHdpdGhvdXRTZXBhcmF0ZVdvcmtlcigpIDogd2l0aFNlcGFyYXRlV29ya2VyKCk7XG59XG4iLCJjb25zdCBhYmkgPSB7XG5cdFwiQUJJIHZlcnNpb25cIjogMixcblx0XCJoZWFkZXJcIjogW1widGltZVwiLCBcImV4cGlyZVwiXSxcblx0XCJmdW5jdGlvbnNcIjogW1xuXHRcdHtcblx0XHRcdFwibmFtZVwiOiBcImNvbnN0cnVjdG9yXCIsXG5cdFx0XHRcImlucHV0c1wiOiBbXG5cdFx0XHRdLFxuXHRcdFx0XCJvdXRwdXRzXCI6IFtcblx0XHRcdF1cblx0XHR9LFxuXHRcdHtcblx0XHRcdFwibmFtZVwiOiBcInRvdWNoXCIsXG5cdFx0XHRcImlucHV0c1wiOiBbXG5cdFx0XHRdLFxuXHRcdFx0XCJvdXRwdXRzXCI6IFtcblx0XHRcdF1cblx0XHR9LFxuXHRcdHtcblx0XHRcdFwibmFtZVwiOiBcImdldFRpbWVzdGFtcFwiLFxuXHRcdFx0XCJpbnB1dHNcIjogW1xuXHRcdFx0XSxcblx0XHRcdFwib3V0cHV0c1wiOiBbXG5cdFx0XHRcdHtcIm5hbWVcIjpcInZhbHVlMFwiLFwidHlwZVwiOlwidWludDI1NlwifVxuXHRcdFx0XVxuXHRcdH1cblx0XSxcblx0XCJkYXRhXCI6IFtcblx0XSxcblx0XCJldmVudHNcIjogW1xuXHRdXG59O1xuXG5jb25zdCBjb250cmFjdFBhY2thZ2UgPSB7XG4gICAgYWJpLFxuICAgIHR2Y0luQmFzZTY0OiAndGU2Y2NnRUNFZ0VBQWlzQUFnRTBBd0VCQWNBQ0FFUFFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBZ0FpYi9BUFNrSUNMQUFaTDBvT0dLN1ZOWU1QU2hDQVFCQ3ZTa0lQU2hCUUlEenNBSEJnQXYxMm9taHAvK21mNllCcmhmLzhOVC84TVB3emZESDhNVUFDLzN3aFpHWC8vQ0huaFovOEkyZUZnSHdsQU9YLzVQYXFRQ0FTQUxDUUgrLzM4aDdVVFFJTmRKd2dHT0ZOUC8wei9UQU5jTC8vaHFmL2hoK0diNFkvaGlqaHYwQlhENGFuQUJnRUQwRHZLOTF3di8rR0p3K0dOdytHWi8rR0hpMHdBQm40RUNBTmNZSVBrQldQaEMrUkR5cU43VFB3R09IdmhESWJrZ256QWcrQ09CQStpb2dnZ2JkMENndWQ2UytHUGdnRFR5Tk5qVEh3SDRJN3p5dVFvQU9OTWZJY0VESW9JUS8vLy8vYnl4a3ZJODRBSHdBZmhIYnBMeVBONENBU0FOREFDenZVV3ErZi9DQzNSeDUyb21nUWE2VGhBTWNLYWYvcG4rbUFhNFgvL0RVLy9ERDhNM3d4L0RGSERmb0N1SHcxT0FEQUlIb0hlVjdyaGYvOE1UaDhNYmg4TXovOE1QRnZmQ041T2JqOE0yajhBSHdSL0RWNEFiLzhNOEFnRWdEdzRBTDd0ekV1UmZoQmJwTHdCTjdSK0FENEkvaHE4QU4vK0dlQUlCSUJFUUFJTzU4NnlRZndndDBsNEFtOW8vQ1VRNEgvSEVaSG9hWUQ5SUJnWTVHZkRrR2RBTUdlZ1o4RG53T2ZKUHpySkJ4RG5oZi9rdVAyQWJ4aGdmOGw0QWU4Ly9EUEFBYXR4d0l0RFdBakhTQUREY0ljY0FrT0FoMXcwZmt2STg0Vk1Sa09IQkF5S0NFUC8vLy8yOHNaTHlQT0FCOEFINFIyNlM4anplJyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29udHJhY3RQYWNrYWdlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18uaG1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUgPSBPYmplY3QuY3JlYXRlKG1vZHVsZSk7XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZSwgJ2V4cG9ydHMnLCB7XG5cdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRzZXQ6ICgpID0+IHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignRVMgTW9kdWxlcyBtYXkgbm90IGFzc2lnbiBtb2R1bGUuZXhwb3J0cyBvciBleHBvcnRzLiosIFVzZSBFU00gZXhwb3J0IHN5bnRheCwgaW5zdGVhZDogJyArIG1vZHVsZS5pZCk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IGFiaUNvbnRyYWN0LCBUb25DbGllbnQgfSBmcm9tICdAZXZlcnNkay9jb3JlJztcbmltcG9ydCB7IGxpYldlYiB9IGZyb20gJ0BldmVyc2RrL2xpYi13ZWInO1xuXG5pbXBvcnQgY29udHJhY3RQYWNrYWdlIGZyb20gJy4vSGVsbG9Db250cmFjdC5qcyc7XG5cblRvbkNsaWVudC51c2VCaW5hcnlMaWJyYXJ5KGxpYldlYik7XG5jb25zdCBjbGllbnQgPSBuZXcgVG9uQ2xpZW50KHtcbiAgICBuZXR3b3JrOiB7XG4gICAgICAgIHNlcnZlcl9hZGRyZXNzOiBcImh0dHA6Ly9sb2NhbGhvc3Q6ODBcIlxuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiBzZXRUZXh0KGlkLCB0ZXh0KSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmlubmVyVGV4dCA9IHRleHRcbn1cblxuLy8gQWRkcmVzcyBvZiBnaXZlciBvbiBFdmVybm9kZSBTRVxuY29uc3QgZ2l2ZXJBZGRyZXNzID0gJzA6YjVlOTI0MGZjMmQyZjFmZjhjYmIxZDFkZWU3ZmI3Y2FlMTU1ZTVmNjMyMGU1ODVmY2M2ODU2OTg5OTRhMTlhNSc7XG4vLyBHaXZlciBBQkkgb24gRXZlcm5vZGUgU0VcbmNvbnN0IGdpdmVyQWJpID0gYWJpQ29udHJhY3Qoe1xuICAgICdBQkkgdmVyc2lvbic6IDIsXG4gICAgaGVhZGVyOiBbJ3RpbWUnLCAnZXhwaXJlJ10sXG4gICAgZnVuY3Rpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdzZW5kVHJhbnNhY3Rpb24nLFxuICAgICAgICAgICAgaW5wdXRzOiBbXG4gICAgICAgICAgICAgICAgeyAnbmFtZSc6ICdkZXN0JywgJ3R5cGUnOiAnYWRkcmVzcycgfSxcbiAgICAgICAgICAgICAgICB7ICduYW1lJzogJ3ZhbHVlJywgJ3R5cGUnOiAndWludDEyOCcgfSxcbiAgICAgICAgICAgICAgICB7ICduYW1lJzogJ2JvdW5jZScsICd0eXBlJzogJ2Jvb2wnIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvdXRwdXRzOiBbXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnZ2V0TWVzc2FnZXMnLFxuICAgICAgICAgICAgaW5wdXRzOiBbXSxcbiAgICAgICAgICAgIG91dHB1dHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2hhc2gnLCB0eXBlOiAndWludDI1NicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2V4cGlyZUF0JywgdHlwZTogJ3VpbnQ2NCcgfVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbWVzc2FnZXMnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAndHVwbGVbXSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICd1cGdyYWRlJyxcbiAgICAgICAgICAgIGlucHV0czogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ25ld2NvZGUnLCB0eXBlOiAnY2VsbCcgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG91dHB1dHM6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdjb25zdHJ1Y3RvcicsXG4gICAgICAgICAgICBpbnB1dHM6IFtdLFxuICAgICAgICAgICAgb3V0cHV0czogW11cbiAgICAgICAgfVxuICAgIF0sXG4gICAgZGF0YTogW10sXG4gICAgZXZlbnRzOiBbXVxufSk7XG4vLyBHaXZlciBrZXlwYWlyOlxuY29uc3QgZ2l2ZXJLZXlQYWlyID0gcmVxdWlyZSgnLi9HaXZlclYyLmtleXMuanNvbicpO1xuXG4vLyBSZXF1ZXN0aW5nIDEwIGxvY2FsIHRlc3QgdG9rZW5zIGZyb20gRXZlcm5vZGUgU0UgZ2l2ZXJcbmFzeW5jIGZ1bmN0aW9uIGdldF90b2tlbnNfZnJvbV9naXZlcihjbGllbnQsIGFjY291bnQpIHtcbiAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIHNlbmRfZXZlbnRzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZV9lbmNvZGVfcGFyYW1zOiB7XG4gICAgICAgICAgICBhZGRyZXNzOiBnaXZlckFkZHJlc3MsXG4gICAgICAgICAgICBhYmk6IGdpdmVyQWJpLFxuICAgICAgICAgICAgY2FsbF9zZXQ6IHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbl9uYW1lOiAnc2VuZFRyYW5zYWN0aW9uJyxcbiAgICAgICAgICAgICAgICBpbnB1dDoge1xuICAgICAgICAgICAgICAgICAgICBkZXN0OiBhY2NvdW50LFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogMTBfMDAwXzAwMF8wMDAsXG4gICAgICAgICAgICAgICAgICAgIGJvdW5jZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmVyOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0tleXMnLFxuICAgICAgICAgICAgICAgIGtleXM6IGdpdmVyS2V5UGFpclxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9XG4gICAgYXdhaXQgY2xpZW50LnByb2Nlc3NpbmcucHJvY2Vzc19tZXNzYWdlKHBhcmFtcylcbn1cblxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGFzeW5jICgpID0+IHtcbiAgICBzZXRUZXh0KFwidmVyc2lvblwiLCAoYXdhaXQgY2xpZW50LmNsaWVudC52ZXJzaW9uKCkpLnZlcnNpb24pO1xuICAgIC8vIERlZmluZSBjb250cmFjdCBBQkkgaW4gdGhlIEFwcGxpY2F0aW9uXG4gICAgLy8gU2VlIG1vcmUgaW5mbyBhYm91dCBBQkkgdHlwZSBoZXJlIGh0dHBzOi8vZ2l0aHViLmNvbS90b25sYWJzL2V2ZXItc2RrL2Jsb2IvbWFzdGVyL2RvY3MvcmVmZXJlbmNlL3R5cGVzLWFuZC1tZXRob2RzL21vZF9hYmkubWQjYWJpXG4gICAgY29uc3QgYWJpID0gYWJpQ29udHJhY3QoY29udHJhY3RQYWNrYWdlLmFiaSk7XG5cbiAgICAvLyBHZW5lcmF0ZSBhbiBlZDI1NTE5IGtleSBwYWlyXG4gICAgY29uc3QgaGVsbG9LZXlzID0gYXdhaXQgY2xpZW50LmNyeXB0by5nZW5lcmF0ZV9yYW5kb21fc2lnbl9rZXlzKCk7XG5cbiAgICAvLyBQcmVwYXJlIHBhcmFtZXRlcnMgZm9yIGRlcGxveSBtZXNzYWdlIGVuY29kaW5nXG4gICAgLy8gU2VlIG1vcmUgaW5mbyBhYm91dCBgZW5jb2RlX21lc3NhZ2VgIG1ldGhvZCBwYXJhbWV0ZXJzIGhlcmUgaHR0cHM6Ly9naXRodWIuY29tL3RvbmxhYnMvZXZlci1zZGsvYmxvYi9tYXN0ZXIvZG9jcy9yZWZlcmVuY2UvdHlwZXMtYW5kLW1ldGhvZHMvbW9kX2FiaS5tZCNlbmNvZGVfbWVzc2FnZVxuICAgIGNvbnN0IGRlcGxveU9wdGlvbnMgPSB7XG4gICAgICAgIGFiaSxcbiAgICAgICAgZGVwbG95X3NldDoge1xuICAgICAgICAgICAgdHZjOiBjb250cmFjdFBhY2thZ2UudHZjSW5CYXNlNjQsXG4gICAgICAgICAgICBpbml0aWFsX2RhdGE6IHt9XG4gICAgICAgIH0sXG4gICAgICAgIGNhbGxfc2V0OiB7XG4gICAgICAgICAgICBmdW5jdGlvbl9uYW1lOiAnY29uc3RydWN0b3InLFxuICAgICAgICAgICAgaW5wdXQ6IHt9XG4gICAgICAgIH0sXG4gICAgICAgIHNpZ25lcjoge1xuICAgICAgICAgICAgdHlwZTogJ0tleXMnLFxuICAgICAgICAgICAga2V5czogaGVsbG9LZXlzXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFbmNvZGUgZGVwbG95IG1lc3NhZ2VcbiAgICAvLyBHZXQgZnV0dXJlIGBIZWxsb2AgY29udHJhY3QgYWRkcmVzcyBmcm9tIGBlbmNvZGVfbWVzc2FnZWAgcmVzdWx0XG4gICAgLy8gdG8gc3BvbnNvciBpdCB3aXRoIHRva2VucyBiZWZvcmUgZGVwbG95XG4gICAgY29uc3QgeyBhZGRyZXNzIH0gPSBhd2FpdCBjbGllbnQuYWJpLmVuY29kZV9tZXNzYWdlKGRlcGxveU9wdGlvbnMpO1xuICAgIHNldFRleHQoXCJhZGRyZXNzXCIsIGFkZHJlc3MpO1xuXG4gICAgLy8gUmVxdWVzdCBjb250cmFjdCBkZXBsb3ltZW50IGZ1bmRzIGZvcm0gYSBsb2NhbCBFdmVybm9kZSBTRSBnaXZlclxuICAgIC8vIG5vdCBzdWl0YWJsZSBmb3Igb3RoZXIgbmV0d29ya3NcbiAgICBhd2FpdCBnZXRfdG9rZW5zX2Zyb21fZ2l2ZXIoY2xpZW50LCBhZGRyZXNzKTtcbiAgICBzZXRUZXh0KFwicHJlcGFpZFwiLCBcIlN1Y2Nlc3NcIilcblxuICAgIC8vIERlcGxveSBgaGVsbG9gIGNvbnRyYWN0XG4gICAgLy8gU2VlIG1vcmUgaW5mbyBhYm91dCBgcHJvY2Vzc19tZXNzYWdlYCBoZXJlXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RvbmxhYnMvZXZlci1zZGsvYmxvYi9tYXN0ZXIvZG9jcy9yZWZlcmVuY2UvdHlwZXMtYW5kLW1ldGhvZHMvbW9kX3Byb2Nlc3NpbmcubWQjcHJvY2Vzc19tZXNzYWdlXG4gICAgYXdhaXQgY2xpZW50LnByb2Nlc3NpbmcucHJvY2Vzc19tZXNzYWdlKHtcbiAgICAgICAgc2VuZF9ldmVudHM6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlX2VuY29kZV9wYXJhbXM6IGRlcGxveU9wdGlvbnNcbiAgICB9KTtcblxuICAgIHNldFRleHQoXCJkZXBsb3llZFwiLCBcIlN1Y2Nlc3NcIilcblxuICAgIC8vIEVuY29kZSB0aGUgbWVzc2FnZSB3aXRoIGB0b3VjaGAgZnVuY3Rpb24gY2FsbFxuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgc2VuZF9ldmVudHM6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlX2VuY29kZV9wYXJhbXM6IHtcbiAgICAgICAgICAgIGFkZHJlc3MsXG4gICAgICAgICAgICBhYmksXG4gICAgICAgICAgICBjYWxsX3NldDoge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uX25hbWU6ICd0b3VjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXQ6IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gcHVia2V5IGtleSBjaGVjayBpbiB0aGUgY29udHJhY3RcbiAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBsZWF2ZSBpdCBlbXB0eS4gTmV2ZXIgdXNlIHRoaXMgYXBwcm9hY2ggaW4gcHJvZHVjdGlvblxuICAgICAgICAgICAgLy8gYmVjYXVzZSBhbnlvbmUgY2FuIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgICAgICAgICAgc2lnbmVyOiB7IHR5cGU6ICdOb25lJyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gQ2FsbCBgdG91Y2hgIGZ1bmN0aW9uXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnByb2Nlc3NpbmcucHJvY2Vzc19tZXNzYWdlKHBhcmFtcyk7XG4gICAgc2V0VGV4dChcInRvdWNoT3V0cHV0XCIsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmRlY29kZWQub3V0cHV0KSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgQ29udHJhY3QgcnVuIHRyYW5zYWN0aW9uIHdpdGggb3V0cHV0ICR7cmVzcG9uc2UuZGVjb2RlZC5vdXRwdXR9LCAke3Jlc3BvbnNlLnRyYW5zYWN0aW9uLmlkfWApO1xuXG4gICAgLy8gRXhlY3V0ZSB0aGUgZ2V0IG1ldGhvZCBgZ2V0VGltZXN0YW1wYCBvbiB0aGUgbGF0ZXN0IGFjY291bnQncyBzdGF0ZVxuICAgIC8vIFRoaXMgY2FuIGJlIG1hbmFnZWQgaW4gMyBzdGVwczpcbiAgICAvLyAxLiBEb3dubG9hZCB0aGUgbGF0ZXN0IEFjY291bnQgU3RhdGUgKEJPQylcbiAgICAvLyAyLiBFbmNvZGUgbWVzc2FnZVxuICAgIC8vIDMuIEV4ZWN1dGUgdGhlIG1lc3NhZ2UgbG9jYWxseSBvbiB0aGUgZG93bmxvYWRlZCBzdGF0ZVxuICAgIGNvbnN0IFtib2MsIG1lc3NhZ2VdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAvLyBEb3dubG9hZCB0aGUgbGF0ZXN0IHN0YXRlIChzby1jYWxsZWQgQk9DKVxuICAgICAgICAvLyBTZWUgbW9yZSBpbmZvIGFib3V0IHF1ZXJ5IG1ldGhvZCBoZXJlXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90b25sYWJzL2V2ZXItc2RrL2Jsb2IvbWFzdGVyL2RvY3MvcmVmZXJlbmNlL3R5cGVzLWFuZC1tZXRob2RzL21vZF9uZXQubWQjcXVlcnlcbiAgICAgICAgLy8gU2VlIG1vcmUgYWJvdXQgQk9DIGhlcmUgaHR0cHM6Ly9kb2NzLnRvbi5kZXYvODY3NTdlY2IyL3AvNDVlNjY0LWJhc2ljcy1vZi1mcmVlLXRvbi1ibG9ja2NoYWluL3QvMTFiNjM5XG4gICAgICAgIGNsaWVudC5uZXRcbiAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgcXVlcnk6IGBcbiAgICAgICAgICAgICAgICBxdWVyeSB7XG4gICAgICAgICAgICAgICAgICBibG9ja2NoYWluIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudChcbiAgICAgICAgICAgICAgICAgICAgICBhZGRyZXNzOiBcIiR7YWRkcmVzc31cIlxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgaW5mbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2NcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoeyByZXN1bHQgfSkgPT4gcmVzdWx0LmRhdGEuYmxvY2tjaGFpbi5hY2NvdW50LmluZm8uYm9jKVxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIGFjY291bnQgZGF0YWApXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgLy8gRW5jb2RlIHRoZSBtZXNzYWdlIHdpdGggYGdldFRpbWVzdGFtcGAgY2FsbFxuICAgICAgICBjbGllbnQuYWJpLmVuY29kZV9tZXNzYWdlKHtcbiAgICAgICAgICAgIGFiaSxcbiAgICAgICAgICAgIGFkZHJlc3MsXG4gICAgICAgICAgICBjYWxsX3NldDoge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uX25hbWU6ICdnZXRUaW1lc3RhbXAnLFxuICAgICAgICAgICAgICAgIGlucHV0OiB7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25lcjogeyB0eXBlOiAnTm9uZScgfVxuICAgICAgICB9KS50aGVuKCh7IG1lc3NhZ2UgfSkgPT4gbWVzc2FnZSlcbiAgICBdKTtcblxuICAgIC8vIEV4ZWN1dGUgYGdldFRpbWVzdGFtcGAgZ2V0IG1ldGhvZCAgKGV4ZWN1dGUgdGhlIG1lc3NhZ2UgbG9jYWxseSBvbiBUVk0pXG4gICAgLy8gU2VlIG1vcmUgaW5mbyBhYm91dCBydW5fdHZtIG1ldGhvZCBoZXJlXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RvbmxhYnMvZXZlci1zZGsvYmxvYi9tYXN0ZXIvZG9jcy9yZWZlcmVuY2UvdHlwZXMtYW5kLW1ldGhvZHMvbW9kX3R2bS5tZCNydW5fdHZtXG4gICAgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQudHZtLnJ1bl90dm0oeyBtZXNzYWdlLCBhY2NvdW50OiBib2MsIGFiaSB9KTtcbiAgICBzZXRUZXh0KFwiZ2V0VGltZXN0YW1wT3V0cHV0XCIsIE51bWJlci5wYXJzZUludChyZXNwb25zZS5kZWNvZGVkLm91dHB1dC52YWx1ZTApKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9