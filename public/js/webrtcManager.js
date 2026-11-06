/**
 * ============================================================================
 * WebRTC Manager — Peer-to-Peer Audio & Video Streaming with Proximity Sound
 * ============================================================================
 */

export class WebRTCManager {
  constructor(network, uiManager) {
    this.network = network;
    this.ui = uiManager;

    this.localStream = null;
    this.screenStream = null;
    this.peers = new Map(); // peerId -> { pc, remoteStream, audioElement, videoElement }
    this.isMicActive = false;
    this.isCamActive = false;
    this.isScreenSharing = false;

    // Audio volume analysis for talking indicator
    this.audioContext = null;
    this.analyser = null;
    this.speakingInterval = null;
    this.isSpeaking = false;

    // Standard public STUN servers for WebRTC NAT traversal
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.network.on('webrtc_signal', async ({ from, signal }) => {
      await this.handleRemoteSignal(from, signal);
    });

    this.network.on('player_disconnected', ({ id }) => {
      this.closePeer(id);
    });
  }

  // --------------------------------------------------------------------------
  // Local Media Capture
  // --------------------------------------------------------------------------
  async initLocalMedia() {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: true
      });

      // Default both to disabled until user toggles them on
      this.localStream.getVideoTracks().forEach(t => t.enabled = false);
      this.localStream.getAudioTracks().forEach(t => t.enabled = false);

      this.setupAudioAnalysis();
      return this.localStream;
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic access prompt declined or unavailable:', err.message);
      // Try audio-only if video fails
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.localStream.getAudioTracks().forEach(t => t.enabled = false);
        this.setupAudioAnalysis();
        return this.localStream;
      } catch (audioErr) {
        console.warn('[WebRTC] Microphone also unavailable:', audioErr.message);
        return null;
      }
    }
  }

  setupAudioAnalysis() {
    if (!this.localStream || this.localStream.getAudioTracks().length === 0) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.speakingInterval) clearInterval(this.speakingInterval);
      this.speakingInterval = setInterval(() => {
        if (!this.isMicActive) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.updateSpeakingUI(false);
          }
          return;
        }

        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;

        const speakingNow = avg > 18;
        if (speakingNow !== this.isSpeaking) {
          this.isSpeaking = speakingNow;
          this.updateSpeakingUI(speakingNow);
        }
      }, 100);
    } catch (e) {
      console.warn('[WebRTC] AudioAnalyser setup error:', e);
    }
  }

  updateSpeakingUI(speaking) {
    const tile = document.getElementById('self-video-tile');
    if (tile) {
      if (speaking) {
        tile.classList.add('ring-2', 'ring-emerald-400', 'shadow-[0_0_15px_rgba(52,211,153,0.6)]');
      } else {
        tile.classList.remove('ring-2', 'ring-emerald-400', 'shadow-[0_0_15px_rgba(52,211,153,0.6)]');
      }
    }
  }

  // --------------------------------------------------------------------------
  // Media Toggles
  // --------------------------------------------------------------------------
  async toggleMic() {
    await this.initLocalMedia();
    if (!this.localStream) {
      this.ui.showToast('⚠️ No microphone available or access denied', '#EF4444');
      return false;
    }

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      this.ui.showToast('⚠️ No audio input found', '#EF4444');
      return false;
    }

    this.isMicActive = !this.isMicActive;
    audioTracks.forEach(t => t.enabled = this.isMicActive);

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.ui.showToast(this.isMicActive ? '🎤 Microphone turned ON' : '🔇 Microphone MUTED', this.isMicActive ? '#10B981' : '#64748B');
    this.broadcastStreamTracks();
    return this.isMicActive;
  }

  async toggleCamera() {
    await this.initLocalMedia();
    if (!this.localStream) {
      this.ui.showToast('⚠️ No webcam available or access denied', '#EF4444');
      return false;
    }

    let videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      // Stream was created audio-only initially, request video now
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 360 } } });
        const newTrack = vidStream.getVideoTracks()[0];
        this.localStream.addTrack(newTrack);
        videoTracks = [newTrack];
      } catch (err) {
        this.ui.showToast('⚠️ Could not enable camera: ' + err.message, '#EF4444');
        return false;
      }
    }

    this.isCamActive = !this.isCamActive;
    videoTracks.forEach(t => t.enabled = this.isCamActive);

    this.ui.showToast(this.isCamActive ? '📹 Camera turned ON' : '🚫 Camera turned OFF', this.isCamActive ? '#10B981' : '#64748B');
    this.broadcastStreamTracks();
    return this.isCamActive;
  }

  async toggleScreenShare() {
    if (this.isScreenSharing) {
      this.stopScreenShare();
      return false;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      this.isScreenSharing = true;

      const screenTrack = this.screenStream.getVideoTracks()[0];
      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      this.replaceVideoTrack(screenTrack);
      this.ui.showToast('🖥️ Screen sharing started', '#10B981');
      return true;
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled/denied:', err);
      this.isScreenSharing = false;
      return false;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    // Restore camera track if camera was active
    const camTrack = this.localStream?.getVideoTracks()[0];
    if (camTrack && this.isCamActive) {
      this.replaceVideoTrack(camTrack);
    }
    this.ui.showToast('🖥️ Screen sharing stopped', '#64748B');
    if (this.ui.localPlayerState) {
      this.ui.localPlayerState.avState.screenShare = false;
      this.ui.updateDockAVButtons();
      this.ui.renderVideoGrid();
    }
  }

  replaceVideoTrack(track) {
    this.peers.forEach(peer => {
      const senders = peer.pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(track);
      } else if (peer.pc.signalingState !== 'closed') {
        peer.pc.addTrack(track, this.localStream);
      }
    });
  }

  broadcastStreamTracks() {
    if (!this.localStream) return;
    this.peers.forEach(peer => {
      this.localStream.getTracks().forEach(track => {
        const senders = peer.pc.getSenders();
        const existing = senders.find(s => s.track && s.track.kind === track.kind);
        if (existing) {
          existing.replaceTrack(track);
        } else if (peer.pc.signalingState !== 'closed') {
          peer.pc.addTrack(track, this.localStream);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // Peer Connections
  // --------------------------------------------------------------------------
  async connectToPeer(remoteId, isInitiator = false) {
    if (this.peers.has(remoteId)) return;

    const pc = new RTCPeerConnection(this.rtcConfig);
    const peerData = {
      pc,
      remoteStream: new MediaStream(),
      audioElement: null,
      videoElement: null
    };
    this.peers.set(remoteId, peerData);

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.network.sendWebRTCSignal(remoteId, { candidate: event.candidate });
      }
    };

    // Incoming remote track
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        peerData.remoteStream.addTrack(track);
      });
      this.attachRemoteMedia(remoteId, peerData.remoteStream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(remoteId);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.network.sendWebRTCSignal(remoteId, { sdp: pc.localDescription });
      } catch (e) {
        console.error('[WebRTC] Error creating offer:', e);
      }
    }
  }

  async handleRemoteSignal(fromPeerId, signal) {
    let peer = this.peers.get(fromPeerId);

    if (!peer) {
      // Connect as responder
      await this.connectToPeer(fromPeerId, false);
      peer = this.peers.get(fromPeerId);
    }

    if (!peer) return;
    const { pc } = peer;

    try {
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.network.sendWebRTCSignal(fromPeerId, { sdp: pc.localDescription });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.warn('[WebRTC] Error handling signal:', err);
    }
  }

  attachRemoteMedia(remoteId, stream) {
    const peer = this.peers.get(remoteId);
    if (!peer) return;

    // Hidden audio element for audio playback
    if (!peer.audioElement) {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.playsInline = true;
      audio.srcObject = stream;
      document.body.appendChild(audio);
      peer.audioElement = audio;
    }

    // Attach to video tile if tile exists in DOM
    const videoEl = document.getElementById(`video-stream-${remoteId}`);
    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
      peer.videoElement = videoEl;
    }
  }

  closePeer(remoteId) {
    const peer = this.peers.get(remoteId);
    if (!peer) return;

    if (peer.audioElement) {
      peer.audioElement.pause();
      peer.audioElement.remove();
    }
    if (peer.pc) {
      peer.pc.close();
    }
    this.peers.delete(remoteId);
  }

  // --------------------------------------------------------------------------
  // Proximity Audio Volume Tuning
  // --------------------------------------------------------------------------
  updateProximityVolumes(localPlayer, allPlayers) {
    if (!localPlayer) return;
    const selfX = localPlayer.x;
    const selfY = localPlayer.y;
    const selfSpace = localPlayer.activeSpace;

    this.peers.forEach((peer, peerId) => {
      const target = allPlayers.get(peerId);
      if (!target || !peer.audioElement) return;

      if (selfSpace !== 'open_office') {
        // Private space: full volume if in same room, muted if not
        peer.audioElement.volume = (target.activeSpace === selfSpace) ? 1.0 : 0.0;
      } else {
        // Open office hallway: 2D distance attenuation (max 240px)
        if (target.activeSpace !== 'open_office') {
          peer.audioElement.volume = 0.0;
        } else {
          const dx = target.x - selfX;
          const dy = target.y - selfY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 240;
          const vol = Math.max(0, Math.min(1, 1 - (dist / maxDist)));
          peer.audioElement.volume = vol;
        }
      }
    });
  }
}
