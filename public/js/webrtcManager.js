/**
 * ============================================================================
 * WebRTC Manager — Peer-to-Peer Audio & Video Streaming with Proximity Sound
 * Gather.town v2 Architecture with Pre-Negotiated Transceivers & Live Signaling
 * ============================================================================
 */

export class WebRTCManager {
  constructor(network, uiManager) {
    this.network = network;
    this.ui = uiManager;

    this.localStream = null;
    this.screenStream = null;
    this.peers = new Map(); // peerId -> { pc, remoteStream, audioElement, videoElement, audioSender, videoSender, pendingCandidates, makingOffer }
    this.isMicActive = false;
    this.isCamActive = false;
    this.isScreenSharing = false;

    // Audio volume analysis for speaking indicator
    this.audioContext = null;
    this.analyser = null;
    this.speakingInterval = null;
    this.isSpeaking = false;

    // Standard public STUN servers for WebRTC NAT traversal
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    };

    this.setupSocketListeners();
    this.setupAutoplayUnlock();
  }

  setupAutoplayUnlock() {
    const unlock = () => {
      this.peers.forEach(peer => {
        if (peer.audioElement && peer.audioElement.paused) {
          peer.audioElement.play().catch(() => {});
        }
      });
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
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
      console.warn('[WebRTC] Camera/Mic access prompt declined or video unavailable:', err.message);
      // Fallback: try audio-only if video fails
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
      this.audioContext.resume().catch(() => {});
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
      // Stream was created audio-only initially, request video track now
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

      this.broadcastStreamTracks();
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
    this.broadcastStreamTracks();
    this.ui.showToast('🖥️ Screen sharing stopped', '#64748B');
    if (this.ui.localPlayerState) {
      this.ui.localPlayerState.avState.screenShare = false;
      this.ui.updateDockAVButtons();
      this.ui.renderVideoGrid();
    }
  }

  broadcastStreamTracks() {
    const aTrack = (this.localStream && this.localStream.getAudioTracks().length > 0)
      ? this.localStream.getAudioTracks()[0]
      : null;

    const vTrack = (this.isScreenSharing && this.screenStream && this.screenStream.getVideoTracks().length > 0)
      ? this.screenStream.getVideoTracks()[0]
      : (this.localStream && this.localStream.getVideoTracks().length > 0)
        ? this.localStream.getVideoTracks()[0]
        : null;

    this.peers.forEach((peer, peerId) => {
      if (!peer.pc || peer.pc.signalingState === 'closed') return;

      // Update audio sender
      if (peer.audioSender) {
        peer.audioSender.replaceTrack(this.isMicActive && aTrack ? aTrack : null)
          .catch(err => console.warn(`[WebRTC] Audio replaceTrack error for peer ${peerId}:`, err));
      } else if (aTrack && this.isMicActive) {
        peer.audioSender = peer.pc.addTrack(aTrack, this.localStream);
      }

      // Update video sender
      if (peer.videoSender) {
        peer.videoSender.replaceTrack((this.isCamActive || this.isScreenSharing) && vTrack ? vTrack : null)
          .catch(err => console.warn(`[WebRTC] Video replaceTrack error for peer ${peerId}:`, err));
      } else if (vTrack && (this.isCamActive || this.isScreenSharing)) {
        peer.videoSender = peer.pc.addTrack(vTrack, this.isScreenSharing ? this.screenStream : this.localStream);
      }
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
      videoElement: null,
      audioSender: null,
      videoSender: null,
      pendingCandidates: [],
      isInitiator
    };
    this.peers.set(remoteId, peerData);

    // Pre-negotiate audio and video transceivers with direction 'sendrecv'
    // Guarantees both m=audio and m=video sections exist in every offer/answer SDP
    const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
    const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
    peerData.audioSender = audioTransceiver.sender;
    peerData.videoSender = videoTransceiver.sender;

    // Attach active local tracks if already enabled
    if (this.localStream) {
      const aTrack = this.localStream.getAudioTracks()[0];
      const vTrack = (this.isScreenSharing && this.screenStream)
        ? this.screenStream.getVideoTracks()[0]
        : this.localStream.getVideoTracks()[0];

      if (aTrack && this.isMicActive) {
        audioTransceiver.sender.replaceTrack(aTrack).catch(() => {});
      }
      if (vTrack && (this.isCamActive || this.isScreenSharing)) {
        videoTransceiver.sender.replaceTrack(vTrack).catch(() => {});
      }
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.network.sendWebRTCSignal(remoteId, { candidate: event.candidate });
      }
    };

    // Incoming remote track
    pc.ontrack = (event) => {
      console.log(`[WebRTC] 📡 Track (${event.track.kind}) received from ${remoteId}`);
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach(t => {
          if (!peerData.remoteStream.getTracks().includes(t)) {
            peerData.remoteStream.addTrack(t);
          }
        });
      } else {
        if (!peerData.remoteStream.getTracks().includes(event.track)) {
          peerData.remoteStream.addTrack(event.track);
        }
      }

      event.track.onunmute = () => {
        this.attachRemoteMedia(remoteId, peerData.remoteStream);
      };

      this.attachRemoteMedia(remoteId, peerData.remoteStream);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection with ${remoteId} state: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(remoteId);
      }
    };

    // Negotiation needed for newly added dynamic tracks
    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== 'stable') return;
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        this.network.sendWebRTCSignal(remoteId, { sdp: pc.localDescription });
      } catch (err) {
        console.warn(`[WebRTC] onnegotiationneeded error with ${remoteId}:`, err);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.network.sendWebRTCSignal(remoteId, { sdp: pc.localDescription });
      } catch (e) {
        console.error(`[WebRTC] Error creating offer to ${remoteId}:`, e);
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
        const desc = new RTCSessionDescription(signal.sdp);
        if (desc.type === 'offer') {
          // Resolve glare / offer collision
          if (pc.signalingState !== 'stable') {
            if (!peer.isInitiator) {
              await Promise.all([
                pc.setLocalDescription({ type: 'rollback' }),
                pc.setRemoteDescription(desc)
              ]);
            } else {
              return; // Yield to initiator
            }
          } else {
            await pc.setRemoteDescription(desc);
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.network.sendWebRTCSignal(fromPeerId, { sdp: pc.localDescription });
        } else if (desc.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(desc);
          }
        }

        // Flush buffered candidates after remote description is set
        if (peer.pendingCandidates && peer.pendingCandidates.length > 0) {
          for (const cand of peer.pendingCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (ce) {
              console.warn(`[WebRTC] Error adding buffered ICE candidate:`, ce);
            }
          }
          peer.pendingCandidates = [];
        }
      } else if (signal.candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          if (!peer.pendingCandidates) peer.pendingCandidates = [];
          peer.pendingCandidates.push(signal.candidate);
        }
      }
    } catch (err) {
      console.warn(`[WebRTC] Error handling signal from ${fromPeerId}:`, err);
    }
  }

  attachRemoteMedia(remoteId, stream) {
    const peer = this.peers.get(remoteId);
    if (!peer) return;

    // 1. Audio element for live audio playback
    if (!peer.audioElement) {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.playsInline = true;
      audio.srcObject = stream;
      document.body.appendChild(audio);
      peer.audioElement = audio;
      audio.play().catch(() => {});
    } else {
      if (peer.audioElement.srcObject !== stream) {
        peer.audioElement.srcObject = stream;
      }
      peer.audioElement.play().catch(() => {});
    }

    // 2. Video element in video grid
    const videoEl = document.getElementById(`video-stream-${remoteId}`);
    if (videoEl) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
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
        // Open office hallway: 2D distance attenuation (max 320px)
        if (target.activeSpace !== 'open_office') {
          peer.audioElement.volume = 0.0;
        } else {
          const dx = target.x - selfX;
          const dy = target.y - selfY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 320;
          const vol = Math.max(0, Math.min(1, 1 - (dist / maxDist)));
          peer.audioElement.volume = vol;
        }
      }
    });
  }
}
