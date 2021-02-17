const { path } = require('ramda')
const { url2FA, user, pass } = require('./config')
import {decode as atob, encode as btoa} from 'base-64'

//request2FA :: string -> Promise<string | Nil>

const request2FA = async (filename) => {
    let response = await fetch(url2FA + filename, {
        method:'GET', 
        headers: {'Authorization': 'Basic ' + btoa('ton:integration')}
    });

    if (response.ok) { // если HTTP-статус в диапазоне 200-299
        // получаем тело ответа (см. про этот метод ниже)
        let json = await response.json();
        console.log("json = " + json);
        return json.code2FA;
    } else {
        console.log("Ошибка HTTP: " + response.status);
        return "empty";
    }
} 

module.exports = request2FA