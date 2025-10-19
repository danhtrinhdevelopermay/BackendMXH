class MockWebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = null;
  }

  async initializeCall(socket, isInitiator = false) {
    console.log('📱 Mock WebRTC: Initializing call (UI only, no real audio)');
    this.socket = socket;
    return null;
  }

  async startCall() {
    console.log('📱 Mock WebRTC: Starting call (UI only)');
  }

  toggleMute(isMuted) {
    console.log(`📱 Mock WebRTC: Mute ${isMuted ? 'ON' : 'OFF'} (UI only)`);
  }

  toggleSpeaker(isSpeakerOn) {
    console.log(`📱 Mock WebRTC: Speaker ${isSpeakerOn ? 'ON' : 'OFF'} (UI only)`);
  }

  async endCall() {
    console.log('📱 Mock WebRTC: Ending call (UI only)');
  }

  getRemoteStream() {
    return null;
  }
}

export default new MockWebRTCService();
