'use strict';
const dgram = require('dgram');
const EventEmitter = require('events');

const emitter = new EventEmitter();

var server;

function start(address, mcast){
    stop();

    server = dgram.createSocket('udp4');

    server.on('error', (err) => {
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        parseMessage(msg);
    });

    server.on('listening', () => {
        if(mcast){
            server.addMembership(mcast);
        }else{
            server.addMembership('239.255.76.67');
        }
    });

    server.bind(7667, address);

    return emitter;
}

function stop(){
    if(server){
        server.stop();
        server = false;
    }
}

function parseMessage(msg){
    if(msg.readUInt32LE() == 0x3230434c && msg.length >= 24){
        let header = {
            seq: msg.readUInt32LE(4),
            proto: msg.toString('utf8', 8, 15),
            device: '0x'+msg.readUInt32LE(16).toString(16),
            packetSize: msg.length
        };

        let pos = 20;
        while(pos < msg.length){
            let dataItem = parseDataItem(msg.slice(pos));
            if(dataItem.header.type == '0x100'){
                emitter.emit('position', {
                    tag: header.device,
                    position: dataItem.data.coordinates
                });
            }else if(dataItem.header.type == '0x102'){
                if(dataItem.data.nodeType == 'master'){
                    emitter.emit('masterposition', {
                        tag: dataItem.data.serial,
                        position: dataItem.data.coordinates
                    });
                }else if(dataItem.data.nodeType == 'anchor'){
                    emitter.emit('anchorposition', {
                        tag: dataItem.data.serial,
                        position: dataItem.data.coordinates
                    });
                }
            }
            pos += dataItem.header.size + 4;
        }
    }
}

function parseDataItem(buf){
    let item = {
        type: '0x'+buf.readUInt16LE(0).toString(16),
        size: buf.readUInt16LE(2),
    };
    let packet;
    switch(item.type){
        case '0x103':
            // anchor status:
            packet = {
                serial: '0x'+buf.readUInt32LE(4).toString(16),
                status: buf[8]
            };
            break;
        case '0x102':
            // infrastructure position
            packet = {
                nodeType: buf[4]==1?'master':'anchor',
                serial: '0x'+buf.readUInt32LE(5).toString(16),
                coordinates: parseCoordinates(buf.slice(9, 21))
            };
            break;
        case '0x100':
            // position
            packet = {
                coordinates: parseCoordinates(buf.slice(4, 16)),
            };
    }

    return {header: item, data: packet};
}

function parseCoordinates(buf){
    return {
        x: buf.readInt32LE(0)/1000,
        y: buf.readInt32LE(4)/1000,
        z: buf.readInt32LE(8)/1000
    };
}

module.exports = {
    start: start,
    stop: stop
};