# cdp protocol implementation

See http://www.ciholas.com/downloads/dwusb/CDP-2016.08.15.pdf

Currently only emits `position` events (`0x100`)

## usage

```javascript
const cdp = require('cdp');

// optional arguments:
// address: ip address to listen on (default: all)
// mcast: multicast address to subscribe to (default: 239.255.76.67)
const server = cdp.start();

server.on('position', (data) => {
    console.log(data);
});

server.on('masterposition', (data) => {
    console.log(data);
});

server.on('anchorposition', (data) => {
    console.log(data);
});
```

data format:

```json
{
  "tag": "0x10006c0",
  "position": {
    "x": 9.415,
    "y": 1.306,
    "z": 1.627
  }
}
```

## server setup

Make sure the "external" protocol stream goes to the network you're listening on.