class PoseNetReceiver {
  constructor(url) {
    this.connected = false;
    this.websocket = null;

    this.initializeWebSocket(url);
  }

  initializeWebSocket(url) {
    console.log('PoseNet connecting to: ', url);

    this.websocket = new WebSocket(url);
    this.websocket.onopen = this.onOpen.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
    this.websocket.onmessage = this.onMessage.bind(this);
    this.websocket.onerror = this.onError.bind(this);

    // stop Chrome from ruining things and crashing the socket server
    window.addEventListener('beforeunload', () => {
      this.websocket.close();
    });
  }


  onOpen(evt) {
    console.log('PoseNet connected:', evt);
    this.connected = true;
  }

  onClose(evt) {
    console.log('PoseNet disconnected:', evt);
    this.connected = false;
  }

  onMessage(msg) {
    const data = JSON.parse(msg.data);
    console.log(data);
  }

  onError(evt) {
    console.log('PoseNet error:', evt);
  }
}

module.exports = PoseNetReceiver;
