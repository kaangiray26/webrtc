<template>
    <div class="view d-flex justify-content-center p-3">
        <div class="d-flex flex-column">
            <div class="card border-dark shadow-lg">
                <div class="card-body">
                    <div>
                        <div class="input-group">
                            <span class="input-group-text">Peer:</span>
                            <input v-model="target" type="text" class="form-control" placeholder="Peer ID"
                                aria-label="Peer ID" aria-describedby="basic-addon1" autofocus
                                :readonly="peer.status.connected_to_peer">
                            <button v-show="!peer.status.connected_to_peer" type="button" class="btn btn-dark"
                                @click="connect" :disabled="!peer.status.connected_to_server">Connect</button>
                        </div>
                    </div>
                    <div v-if="peer.status.connected_to_peer" class="input-group mt-3">
                        <input v-model="message" type="text" class="form-control" placeholder="Message" aria-label="Message"
                            aria-describedby="basic-addon1" autofocus @keyup.enter="send">
                        <button type="button" class="btn btn-dark" @click="send">></button>
                    </div>
                    <div class="mt-3 user">
                        <span class="user-select-all">{{ peer.locale_id }}</span>
                    </div>
                </div>
            </div>
            <div class="messages card border-dark shadow-lg mt-3">
                <div class="card-body">
                    <div v-for="message in messages" class="">
                        <div class="d-flex"
                            :class="{ 'justify-content-start': message.incoming, 'justify-content-end': !message.incoming }">
                            <div class="d-flex flex-column position-relative message rounded px-2 py-1 m-1">
                                <span class="message-text">{{
                                    message.text
                                }}</span>
                                <small class="text-end ms-5">{{ formatTime(message.dt) }}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { WebRTC } from "/js/webrtc.js";

const peer = ref(null);

const target = ref(null);
const message = ref(null);
const messages = ref([]);

async function connect() {
    peer.value.connect_to_peer(target.value);
}

async function send() {
    let msg = message.value;
    if (!msg || !msg.length) {
        return;
    }

    peer.value.send_message(msg);
    messages.value.unshift({
        incoming: false,
        text: msg,
        dt: new Date()
    });
    message.value = "";
}

function formatTime(dt) {
    let hours = dt.getHours().toString().padStart(2, "0");
    let minutes = dt.getMinutes().toString().padStart(2, "0");
    return hours + ":" + minutes;
}

onBeforeMount(() => {
    peer.value = new WebRTC();
    peer.value.addEventListener("connected", (event) => {
        target.value = peer.value.remote_id;
    });
    peer.value.addEventListener("message", (event) => {
        messages.value.unshift({
            incoming: true,
            text: event.detail,
            dt: new Date()
        });
    });
})
</script>