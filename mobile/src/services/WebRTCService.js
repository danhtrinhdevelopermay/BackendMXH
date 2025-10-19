import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = null;
    this.isInitiator = false;
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
  }

  async initializeCall(socket, isInitiator = false) {
    try {
      this.socket = socket;
      this.isInitiator = isInitiator;

      InCallManager.start({ media: 'audio', ringback: '_BUNDLE_' });
      InCallManager.setForceSpeakerphoneOn(false);

      this.localStream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.createPeerConnection();

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      this.setupSocketListeners();

      return this.localStream;
    } catch (error) {
      console.error('Error initializing call:', error);
      throw error;
    }
  }

  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.configuration);

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        console.log('Received remote stream');
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice_candidate', {
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
    };
  }

  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('webrtc_offer', async (data) => {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket.emit('webrtc_answer', { answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    this.socket.on('webrtc_answer', async (data) => {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    this.socket.on('ice_candidate', async (data) => {
      try {
        if (data.candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });
  }

  async startCall() {
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit('webrtc_offer', { offer });
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  toggleMute(isMuted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }

  toggleSpeaker(isSpeakerOn) {
    InCallManager.setForceSpeakerphoneOn(isSpeakerOn);
  }

  async endCall() {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      if (this.socket) {
        this.socket.off('webrtc_offer');
        this.socket.off('webrtc_answer');
        this.socket.off('ice_candidate');
      }

      InCallManager.stop();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}

export default new WebRTCService();
