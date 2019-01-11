/*
 * Copyright (c) 2018. Constantin Galbenu <xprt64@gmail.com> Toate drepturile rezervate. All rights reserved.
 */
var HUB_STATE_RECEIVER_UDP_PORT = process.env.HUB_STATE_RECEIVER_UDP_PORT | 3345;
var dgram = require("dgram");

module.exports.start = function (callbackOnReceivedMessage) {
    const receiver = dgram.createSocket('udp4');
    receiver.on("error", function (err) {
        console.log(`receiver error:\n${err.stack}`);
        receiver.close();
    });
    receiver.on('message', function (msg, rinfo) {
        console.log(`UDP receiver got: ${msg.length} bytes from ${rinfo.address}:${rinfo.port} ${msg}`);
        callbackOnReceivedMessage(msg);
    });
    receiver.on('listening', function () {
        var address = receiver.address();
        console.log(`UDP receiver listening on ${address.address}:${address.port}`);
    });
    receiver.bind(HUB_STATE_RECEIVER_UDP_PORT);
};


