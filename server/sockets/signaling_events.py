from flask_socketio import emit

def register_signaling_events(socketio):
    @socketio.on('signal')
    def handle_signal(data):
        # For future WebRTC or signaling events
        emit('signal', data, broadcast=True)
