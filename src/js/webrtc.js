import { reactive } from 'vue';

class WebRTC extends EventTarget {
    constructor() {
        super();
        this.locale_id = crypto.randomUUID();
        this.remote_id = null;
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        }
        this.ws = null;
        this.conn = null;
        this.dataChannel = null;

        this.status = reactive({
            connected_to_peer: false,
            connected_to_server: false
        })

        this.connect_to_server();
    }

    connect_to_server() {
        // Websocket connection
        this.ws = new WebSocket('ws://localhost:9000');
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'connect',
                id: this.locale_id
            }));
        }

        this.ws.onmessage = (event) => {
            let data = null;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                console.error(e);
                return;
            }

            if (data.type == 'connect') {
                if (data.message == 'Connection successful') {
                    this.status.connected_to_server = true;
                }
                return
            }

            if (data.type == 'offer') {
                this.remote_id = data.id;
                this.conn.setRemoteDescription(new RTCSessionDescription(data.offer));
                this.conn.createAnswer().then((answer) => {
                    this.conn.setLocalDescription(answer);
                    this.send_answer(data.id, answer);
                });
                return
            }

            if (data.type == 'answer') {
                this.conn.setRemoteDescription(new RTCSessionDescription(data.answer));
                return
            }

            if (data.type == 'candidate') {
                this.conn.addIceCandidate(new RTCIceCandidate(data.candidate));
                return
            }
        }

        // Peer connection
        this.conn = new RTCPeerConnection(this.config);
        this.conn.onicecandidate = (event) => {
            if (event.candidate && !this.status.connected_to_peer) {
                this.send_ice_candidate(event.candidate);
            }
        }
        this.conn.ondatachannel = (event) => {
            this.receiveChannelCallback(event);
        }
    }

    connect_to_peer(id) {
        console.log("Connecting to peer", id);
        this.remote_id = id;
        this.conn.createOffer().then((offer) => {
            this.send_offer(id, offer);
            this.conn.setLocalDescription(offer);
        });

        // Data channel
        this.dataChannel = this.conn.createDataChannel('dataChannel');
        this.receiveChannelCallback({ channel: this.dataChannel });
    }

    send_offer(id, offer) {
        this.ws.send(JSON.stringify({
            type: 'offer',
            id: id,
            offer: offer
        }));
    }

    send_answer(id, answer) {
        this.ws.send(JSON.stringify({
            type: 'answer',
            id: id,
            answer: answer
        }));
    }

    send_ice_candidate(candidate) {
        this.ws.send(JSON.stringify({
            type: 'candidate',
            id: this.remote_id,
            candidate: candidate
        }));
    }

    send_message(message) {
        this.dataChannel.send(JSON.stringify(message));
    }

    receiveChannelCallback(event) {
        this.dataChannel = event.channel;
        this.dataChannel.onopen = (event) => {
            this.status.connected_to_peer = true;
            this.dispatchEvent(new CustomEvent('connected'));
        }
        this.dataChannel.onmessage = (event) => {
            let data = null;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                console.error(e);
                return;
            }

            this.dispatchEvent(new CustomEvent('message', {
                detail: data
            }));
        }
        this.dataChannel.onclose = (event) => {
            console.log("Data channel closed");
            this.status.connected_to_peer = false;
        }
        this.dataChannel.onerror = (event) => {
            console.log("Data channel error");
        }
    }
}

export { WebRTC }