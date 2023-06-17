import { WebSocketServer } from 'ws';

const ws = new WebSocketServer({ port: 9000 });

let users = [];

ws.on('connection', (conn) => {
    conn.on('message', (message) => {
        // Parse message
        let data = null;
        try {
            data = JSON.parse(message);
            console.log("Incoming message:", data.type);
        } catch (e) {
            console.error(e);
            return;
        }

        // Handle message based on type
        if (data.type == 'connect') {
            // Check if user is already connected
            if (users.find(user => user.id === data.id)) {
                conn.send(JSON.stringify({
                    type: 'error',
                    message: 'User id already exists'
                }));
                return
            }

            // Append id to connection
            conn.id = data.id;

            // Add user to list
            users.push({
                id: data.id,
                connection: conn
            });

            // Notify user that connection was successful
            conn.send(JSON.stringify({
                type: 'connect',
                message: 'Connection successful'
            }));
            return
        }

        if (data.type == 'offer') {
            // Find user
            let user = users.find(user => user.id === data.id);

            // Check if user exists
            if (!user) {
                conn.send(JSON.stringify({
                    type: 'error',
                    message: 'User not found'
                }));
                return
            }

            // Send offer to user
            user.connection.send(JSON.stringify({
                type: 'offer',
                id: conn.id,
                offer: data.offer
            }));
            return;
        }

        if (data.type == 'answer') {
            // Find user
            let user = users.find(user => user.id === data.id);

            // Check if user exists
            if (!user) {
                conn.send(JSON.stringify({
                    type: 'error',
                    message: 'User not found'
                }));
                return
            }

            // Send answer to user
            user.connection.send(JSON.stringify({
                type: 'answer',
                id: conn.id,
                answer: data.answer
            }));
            return;
        }

        if (data.type == 'candidate') {
            // Find user
            let user = users.find(user => user.id === data.id);

            // Check if user exists
            if (!user) {
                conn.send(JSON.stringify({
                    type: 'error',
                    message: 'User not found'
                }));
                return
            }

            // Send candidate to user
            user.connection.send(JSON.stringify({
                type: 'candidate',
                id: conn.id,
                candidate: data.candidate
            }));
            return;
        }
    });

    conn.on('close', () => {
        users = users.filter(user => user.id !== conn.id);
    });
})

console.log(`Server started on ws://localhost:${ws.options.port}`);