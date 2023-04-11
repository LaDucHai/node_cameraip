const net = require('net');

const PORT = 9090;

const tcpHolePunching = () => {
    // server
    const server = net.createServer(function(connection) { 
        console.log('client connected');
        
        connection.on('end', function() {
           console.log('client disconnected');
        });

        connection.write('Hello World!\r\n');
        connection.pipe(connection);
    });
     
    server.listen(PORT, function() { 
        console.log(`server is listening ${PORT}`);
        console.log('serverAddress:', server.address());
    });

    // client
    // const client = net.connect({address: '192.168.1.100', port: 1234}, function() {
    //     console.log('connected to server!');  
    // });
     
    // client.on('data', function(data) {
    //     console.log(data.toString());
    //     client.end();
    // });
     
    // client.on('end', function() { 
    //     console.log('disconnected from server');
    // });
}


module.exports = tcpHolePunching;