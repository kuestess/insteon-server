var websocket = require('ws')

var host = 'ws://127.0.0.1:8080'
var connection = new websocket(host)

connection.onopen = function () {
    connection.onmessage = function (message) {
        console.log(message.data)
    }
}

connection.onerror = function (error) {
    console.log(error)
}