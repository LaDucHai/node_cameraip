const dgram = require ('dgram');


const server = dgram.createSocket('udp4');
const client = dgram.createSocket('udp4');


const udpPuching = () => {
    client.send('server xin chao', 1234, '192.168.1.3', (err) => {
        client.close();
    });
    server.on('error', (err) => {
        console.log(`server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`server listening ${address.address}:${address.port}`);
    });

    server.bind(9090);
};

module.exports = udpPuching;