'use strict'
var Insteon = require('home-controller').Insteon
var hub = new Insteon()
var express = require('express')
var app = express()
var fs = require('fs')

var websocket = require('ws')
var wss = new websocket.Server({port: 8080})

var configFile = fs.readFileSync('./config.json')
var configJSON = JSON.parse(configFile)
var platformIndex = configJSON.platforms.findIndex(function(item){return item.platform =='InsteonLocal'})
var config = configJSON.platforms[platformIndex]

InsteonServer()

function InsteonServer() {
    var self = this
    var platform = this
    
    var devices = config.devices

    var host = config.host
    var port = config.port
    var user = config.user
    var pass = config.pass
    var model = config.model
    var server_port = config.server_port || 3000
	
    var hubConfig = {
        host: host,
        port: port,
        user: user,
        password: pass
    }
	
    connectToHub()
    init()
    
    app.get('/light/:id/on', function(req, res) {
        var id = req.params.id.toUpperCase()
        hub.light(id).turnOn().then(function(status) {
            if (status.response) {
                res.sendStatus(200)
				
            } else {
                res.sendStatus(404)
            }
        })
    })
	
    app.get('/light/:id/off', function(req, res) {
        var id = req.params.id.toUpperCase()
        hub.light(id).turnOff().then(function(status) {
            if (status.response) {
                res.sendStatus(200)
                
            } else {
                res.sendStatus(404)
            }
        })
    })
	
	    app.get('/light/:id/faston', function(req, res) {
        var id = req.params.id.toUpperCase()
        hub.light(id).turnOnFast().then(function(status) {
            if (status.response) {
                res.sendStatus(200)
				
            } else {
                res.sendStatus(404)
            }
        })
    })
	
    app.get('/light/:id/fastoff', function(req, res) {
        var id = req.params.id.toUpperCase()
        hub.light(id).turnOffFast().then(function(status) {
            if (status.response) {
                res.sendStatus(200)
                
            } else {
                res.sendStatus(404)
            }
        })
    })
	
    app.get('/light/:id/status', function(req, res) {
        var id = req.params.id
        hub.light(id).level(function(err, level) {
            res.json({
                "level": level
            })
        })
    })

    app.get('/light/:id/level/:targetLevel', function(req, res) {
        var id = req.params.id
        var targetLevel = req.params.targetLevel

        hub.light(id).level(targetLevel).then(function(status) {
            if (status.response) {
                res.sendStatus(200)
                
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.get('/scene/:group/on', function(req, res) {
        var group = parseInt(req.params.group)
        hub.sceneOn(group).then(function(status) {
            if (status.aborted) {
                res.sendStatus(404)
            } 
            if (status.completed) {
                res.sendStatus(200)
                
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.get('/scene/:group/off', function(req, res) {
        var group = parseInt(req.params.group)
        hub.sceneOff(group).then(function(status) {
            if (status.aborted) {
                res.sendStatus(404)
            } 
            if (status.completed) {
                res.sendStatus(200)
                
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.get('/links', function(req, res) {
        hub.links(function(err, links) {
            res.json(links)
        })
    })

    app.get('/links/:id', function(req, res) {
        var id = req.params.id
        hub.links(id, function(err, links) {
            res.json(links)
        })
    })

    app.get('/info/:id', function(req, res) {
        var id = req.params.id
        hub.info(id, function(err, info) {
            res.json(info)
        })
    })

    app.get('/iolinc/:id/relay_on', function(req, res) {
        var id = req.params.id
        hub.ioLinc(id).relayOn().then(function(status) {
            if (status.response) {
                res.sendStatus(200)
				
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.get('/iolinc/:id/relay_off', function(req, res) {
        var id = req.params.id
        hub.ioLinc(id).relayOff().then(function(status) {
            if (status.response) {
                res.sendStatus(200)
                
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.get('/iolinc/:id/sensor_status', function(req, res) {
        var id = req.params.id
        hub.ioLinc(id).status(function(err, status) {
            res.json(status.sensor)
        })
    })

    app.get('/iolinc/:id/relay_status', function(req, res) {
        var id = req.params.id
        hub.ioLinc(id).status(function(err, status) {
            res.json(status.relay)
        })
    })
	
	app.listen(server_port)
	
	function connectToHub() {
        console.log('Model: ' + model)
        		
		if (model == "2245") {
			console.log('Connecting to Insteon Model 2245 Hub...')
			hub.httpClient(hubConfig, function(had_error) {
				console.log('Connected to Insteon Model 2245 Hub...')
				connectedToHub = true
			})
		} else if (model == "2243") {
			console.log('Connecting to Insteon "Hub Pro" Hub...')
			connectingToHub = true
			hub.serial("/dev/ttyS4",{baudRate:19200}, function(had_error) {
				console.log('Connected to Insteon "Hub Pro" Hub...')
				connectedToHub = true

			})
		} else if (model == "2242") {
			console.log('Connecting to Insteon Model 2242 Hub...')
			hub.connect(host, function() {
				console.log('Connected to Insteon Model 2242 Hub...')
				connectedToHub = true
			})
		} else {
			console.log('Connecting to Insteon PLM...')
			hub.serial(host,{baudRate:19200}, function(had_error) {
				console.log('Connected to Insteon PLM...')
				connectedToHub = true
			})
		}
    }

    function init() {
        console.log('Initiating websocket...')
        wss.on('connection', function (ws) {
            console.log('Client connected to websocket')
            ws.send('Connected to Insteon Server')
        
            devices.forEach(function(device){
                switch (device.deviceType) {     
                    case 'doorsensor':
                    case 'windowsensor':
                    case 'contactsensor':
                        device.door = hub.door(device.deviceID)
                        
                        device.door.on('opened', function(){		
                            console.log('Got open for ' + device.name)
                            ws.send('name: ' + device.name + ' id: ' + device.deviceID + ' state: open')
                        })
                        
                        device.door.on('closed', function(){
                            console.log('Got closed for ' + device.name)
                            ws.send('name: ' + device.name + ' id: ' + device.deviceID + ' state: closed')
                        })
                        
                    break
                    
                    case 'lightbulb':
                    case 'dimmer':                    
                        device.light = hub.light(device.deviceID)
                        
                        device.light.on('turnOn', function (group, level) {
                            console.log(device.name + ' turned on')  
                            ws.send('name: ' + device.name + ' id: ' + device.deviceID + ' state: ' + level)
                        })

                        device.light.on('turnOff', function () {
                            console.log(device.name + ' turned off')
                            ws.send('name: ' + device.name + ' id: ' + device.deviceID + ' state: 0')
                        })

                    break
                }  
            }) 
        }
    )}
}