'use strict';

let WebSocket = require('ws');
let ws = new WebSocket('ws://localhost:5000');

let name = 'bot' + Math.floor(Math.random() * 10000);
let ingameId = null;
let moveDirection = 1;
let target = null;

let users = {};

ws.on('open', function open() {
	console.log('Connection succsessful');
});

ws.on('message', function(rawData, flags) {
	let data_b = new ArrayBuffer(rawData.length);
	let data = new DataView(data_b);
	for(let i = 0;i < rawData.length;++ i)
		data.setUint8(i, rawData[i]);

	let pid = data.getUint8(0);

	if(pid === 1) // auth req
	{
		let response_b = new ArrayBuffer(1 + name.length);
		let response = new DataView(response_b);
		response.setUint8(0, 0); // pid

		for(let i = 0;i < name.length;++ i)
			response.setUint8(1+i, name.charCodeAt(i));

		ws.send(response_b, {binary: true, mask: true});
	}
	if(pid === 2) // init game
	{
		ingameId = data.getUint32(1, false);
		setInterval(shoot, 1000 / 10);
		setInterval(move, 1000 / 10);
		setInterval(changeMoveDirection, 1000 / 1);
		setInterval(aquireTarget, 1000 / 1);
	}
	if(pid === 11) // add user
	{
		let nameRawLen = data.getUint8(1);

		let id = data.getUint32(2+nameRawLen, false);
		let x = data.getInt32(2+nameRawLen+4 + 0, false);
		let y = data.getInt32(2+nameRawLen+4 + 4, false);

		users[id] = {x: x, y: y, dead: false};
	}
	if(pid == 12) // player disconected
		delete users[data.getUint32(1)];
	if(pid === 13) // basic player info
	{
		var count = data.getUint32(1, false);

		for(var i = 0;i < count;++ i)
		{
			var id = data.getUint32(5 + i * 24, false);
			users[id].x = data.getFloat32(9 + i * 24, false);
			users[id].y = data.getFloat32(13 + i * 24, false);
		}
	}
	if(pid === 14) // player died
		users[data.getUint32(1, false)].dead = true;
	if(pid === 15) // player respawned
		users[data.getUint32(1, false)].dead = false;
});

function dist(x1, y1, x2, y2)
{
    let alpha = x1 - x2;
    let beta = y1 - y2;
    return Math.sqrt((alpha * alpha) + (beta * beta));
}

function calcAngle(x1, y1, x2, y2)
{
	let dx = x2 - x1;
	let dy = y2 - y1;
	return Math.atan2(dy, dx);
}

function aquireTarget()
{
	let newTarget = null, minDist = 0;
	for(var id in users)
	{
		if(id == ingameId)
			continue;
		if(users[id].dead)
			continue;

		let currDist = dist(users[id].x, users[id].y, users[ingameId].x, users[ingameId].y);
		if(currDist < minDist || newTarget == null)
		{
			newTarget = id;
			minDist = currDist;
		}
	}
	target = newTarget;
}

function shoot()
{
	if(target == null)
		return;

	let packet_b = new ArrayBuffer(5);
	let packet = new DataView(packet_b);
	packet.setUint8(0, 1);

	let angle = calcAngle(users[ingameId].x, users[ingameId].y, users[target].x, users[target].y);
	packet.setFloat32(1, angle, false);
	ws.send(packet_b);
}

function move()
{
	let packet_b = new ArrayBuffer(2);
	let packet = new DataView(packet_b);
	packet.setUint8(0, 2);

	packet.setUint8(1, moveDirection);
	ws.send(packet_b);
}

function changeMoveDirection()
{
	moveDirection = 1;
	if(Math.random() * 10 < 5)
		moveDirection *= 2;
	if(Math.random() * 10 < 5)
		moveDirection *= 3;
	if(Math.random() * 10 < 5)
		moveDirection *= 5;
	if(Math.random() * 10 < 5)
		moveDirection *= 7;
}
