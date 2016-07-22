'use strict';

let WebSocket = require('ws');
let ws = new WebSocket('ws://localhost:5000');

let name = 'bot';
let ingameId = null;

ws.on('open', function open() {
	console.log('Connection succsessful');
});

ws.on('message', function(rawData, flags) {

	let data_b = new ArrayBuffer(rawData.length);
	let data = new DataView(data_b);
	for(let i = 0;i < rawData.length;++ i)
		data.setUint8(i, rawData[i]);

	let pid = data.getUint8(0);

	if(pid === 1)
	{
		let response_b = new ArrayBuffer(1 + name.length);
		let response = new DataView(response_b);
		response.setUint8(0, 0); // pid

		for(let i = 0;i < name.length;++ i)
			response.setUint8(1+i, name.charCodeAt(i));

		ws.send(response_b, {binary: true, mask: true});
	}
	if(pid === 2)
	{
		let ingameId = data.getUint32(1, false);
		setInterval(shoot, 1000 / 10);
	}
});

function shoot()
{
	let packet_b = new ArrayBuffer(5);
	let packet = new DataView(packet_b);
	packet.setUint8(0, 1);

	packet.setFloat32(1, Math.random() * 2 * Math.PI, false);
	ws.send(packet_b);
}
