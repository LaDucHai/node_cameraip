const express = require('express');
const app = express();
const router = require('./router');
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const udpPuching = require('./model/udp-punching');
const tcpHolePunching = require('./model/tcp-hole-punching');


const HTTP_PORT = 3000;
const HTTP_socket = 3001;

const io = socketio(server);
// socket.io
io.on('connection', (socket) => {
    // for(let i = 0; i < 10; i++) {
    //     setTimeout(() => {
    //         socket.emit('test', 'test2');
    //     }, 3000)
    // }
    socket.emit('test', 'test2');
});
io.listen(HTTP_socket);

var FCM = require('fcm-node');
var serverKey = 'AAAA9ZWEkQM:APA91bFtECvcw8UfyVnMgTlRW2fhVzslMtwxVo1vjAkfL1abOFO5jX4K2fergG46adp43IrSDoAoUYECSQAySVbFA7c4M6JM2AUxaC55kaWlpIatGhixA9S1Z2VL4EtnA8bzBDIj9uNa'; //put your server key here
var fcm = new FCM(serverKey);

var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: 'dnEpiX7rTQSg26gYCmbFa5:APA91bF81kk2uLRMAL1upHbeHg24k1scNQEGL2PHGCRJjhfvI1GIp1RYH7-AqaKzwHg0aUpGI0Jvf8BUT64zWGGXwMLPQmrWoqJWRQY4m1dMbHT0GZD7pnwv3wNgcpQWD1M_gPLYr1SP', 
    collapse_key: 'your_collapse_key',
    
    notification: {
        title: 'Title of your push notification', 
        body: 'Body of your push notification',
        image: 'https://tse1.mm.bing.net/th?id=OIP.TUDe74-_OR6O3P4V-3_FYQHaE7&pid=Api&P=0&w=266&h=177',
    },

    data: {  //you can send only notification or only data(or include both)
        my_key: 'my value',
        my_another_key: 'my another value'
    }
};


fcm.send(message, function(err, response){
    if (err) {
        console.log("Something has gone wrong!");
    } else {
        console.log("Successfully sent with response: ", response);
    }
});

//udpPuching();
tcpHolePunching();

app.use(express.json());
app.use(express.static('.'));

app.use('/', router);

app.listen(HTTP_PORT, () => console.log(`HTTP server listening at ${HTTP_PORT}`));