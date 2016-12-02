
var mosca = require('mosca');

var port = 3000;
var brokerSettings = {
	http: {
		port: port,
		bundle: true,
		static: './'
	},
	backend: {},
	persistence: {
		factory: mosca.persistence.Memory
	}
};
var broker = new mosca.Server(brokerSettings);

var devices = {};
var numDevices = Math.round(randomRange(10, 50));
var telemetryInterval = 1000;
var statusInterval = 10000;
var statusTopic = '/status';
var telemetryTopic = '/telemetry';

broker.on('ready', onBrokerReady);

function onBrokerReady() {
	for (var i = 0; i < numDevices; i++) {
		startDevice('device_' + i);
	}

	setInterval(function () {
		var deviceId = 'device_' + Math.floor(randomRange(0, numDevices));

		(devices[deviceId] ? stopDevice : startDevice)(deviceId);
	}, statusInterval);

	console.log('Listening for WebSocket connections on localhost port ' + port);
}

function startDevice(deviceId) {
	broker.publish({
		topic: deviceId + statusTopic,
		payload: JSON.stringify({ status: 'online' }),
		qos: 1,
		retain: true
	});

	devices[deviceId] = setInterval(publishTelemetry.bind(null, deviceId), telemetryInterval);
}

function stopDevice(deviceId) {
	clearInterval(devices[deviceId]);
	devices[deviceId] = null;

	broker.publish({
		topic: deviceId + statusTopic,
		payload: JSON.stringify({ status: 'offline' }),
		qos: 1,
		retain: true
	});
}

function publishTelemetry(deviceId) {
	broker.publish({
		topic: deviceId + telemetryTopic,
		payload: generateTelemetryMessage(),
		qos: 0,
		retain: true
	});
}

function generateTelemetryMessage(deviceId) {
	return JSON.stringify({
		water_flow: randomFixedRange(3, 7, 1),
		temperature: randomFixedRange(40, 60, 1),
		pressure: randomFixedRange(40, 70, 1),
		switch_state: Math.floor(randomRange(0, 1)),
		timestamp: Math.floor(new Date().getTime() / 1000),
		system_mode: Math.floor(randomRange(1, 5))
	});
}


function randomRange(min, max) {
	return ((Math.random() * (max - min + 1)) + min);
}

function randomFixedRange(min, max, places) {
	return randomRange(min, max).toFixed(places);
}