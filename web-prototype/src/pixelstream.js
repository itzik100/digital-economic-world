// Pixel Streaming WebRTC client for Unreal Engine 5
export class PixelStream {
  constructor({ serverUrl, onConnected, onDisconnected }) {
    this.serverUrl = serverUrl;
    this.onConnected = onConnected;
    this.onDisconnected = onDisconnected;
    this.onGameMessage = null;
    this.ws = null;
    this.pc = null;
    this.dataChannel = null;
  }

  connect() {
    this.ws = new WebSocket(this.serverUrl);

    this.ws.onopen = () => {
      console.log('[PS] Signaling connected');
      this._createPeerConnection();
    };

    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'offer') await this._handleOffer(msg);
      if (msg.type === 'iceCandidate') await this._handleIceCandidate(msg.candidate);
      if (msg.type === 'playerCount') console.log('[PS] Players online:', msg.count);
    };

    this.ws.onclose = () => {
      this.onDisconnected?.();
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (e) => console.error('[PS] WS Error:', e);
  }

  _createPeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Receive video/audio from UE5
    this.pc.ontrack = (e) => {
      const video = document.getElementById('pixel-stream-video');
      if (e.streams[0]) video.srcObject = e.streams[0];
    };

    // Data channel for UE5 ↔ frontend messages
    this.pc.ondatachannel = (e) => {
      this.dataChannel = e.channel;
      this.dataChannel.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          this.onGameMessage?.(data);
        } catch {}
      };
      this.dataChannel.onopen = () => {
        console.log('[PS] Data channel open');
        this.onConnected?.();
      };
    };

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._sendWS({ type: 'iceCandidate', candidate: e.candidate });
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('[PS] Connection state:', this.pc.connectionState);
      if (this.pc.connectionState === 'disconnected') this.onDisconnected?.();
    };

    // Input forwarding (keyboard/mouse → UE5)
    this._setupInputForwarding();
  }

  async _handleOffer(offer) {
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this._sendWS(answer);
  }

  async _handleIceCandidate(candidate) {
    if (candidate) await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  sendToGame(data) {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  _sendWS(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  _setupInputForwarding() {
    const canvas = document.getElementById('pixel-stream-canvas');

    const sendInput = (type, data) => this._sendWS({ type, ...data });

    canvas.addEventListener('mousemove', (e) => {
      sendInput('mousemove', { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    });

    canvas.addEventListener('mousedown', (e) => sendInput('mousedown', { button: e.button }));
    canvas.addEventListener('mouseup', (e) => sendInput('mouseup', { button: e.button }));
    canvas.addEventListener('wheel', (e) => sendInput('mousewheel', { delta: e.deltaY }));

    document.addEventListener('keydown', (e) => {
      if (!document.querySelector('.game-panel:not(.hidden)')) {
        sendInput('keydown', { key: e.code });
      }
    });

    document.addEventListener('keyup', (e) => sendInput('keyup', { key: e.code }));
  }
}
