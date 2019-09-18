import React from 'react';
import WebSocket from 'ws';

import _ from 'lodash';

import Message from './Message';

import { slide as Menu } from 'react-burger-menu';
import DatGui, { DatFolder, DatSelect, DatBoolean, DatButton, DatNumber, DatString } from 'react-dat-gui';

import { ButtonGroup, Button } from 'react-bootstrap';

//Import top level files
import 'bootstrap/dist/css/bootstrap.css';
import 'react-dat-gui/build/react-dat-gui.css';
import styles from './Main.css';

import PoseNet from '../poseNet/poseNet';

import defaults from '../config'

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = defaults;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.forceUpdate === true) {
      this.setState({ forceUpdate: false });
      return true;
    }

    if (this.props && this.state) {
      if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
        this.state.poseNet.updatePoseNet(nextState.poseNetProps, nextState.media);
        return true;
      }
      return false;
    }
    return false;
  }

  componentWillMount() {
    this.setState({
      poseNet: new PoseNet(this.state.poseNetProps, this.state.media, this.broadcastPoses.bind(this)),
    });
  }

  componentDidMount() {
    // once the dom has mounted, initialize
    this.getCameras();
    this.initializeSocketBroadcast();
    this.initializePeerConnection(this.state.peerjs.pID);
    this.state.poseNet.init();
  }

  initializePeerConnection(pID) {
    console.log('initializePeerConnection pID', pID);
      // Create own peer object with connection to shared PeerJS server
      this.state.peer = new Peer(null, {
          debug: 0,
        //   config: {
        //     sdpSemantics: "unified-plan",
        //     iceTransportPolicy: "relay" // <- this is a hint for WebRTC to use the relay server
        // }
      });
      this.state.peer.on('open', (id) => {
          // Workaround for peer.reconnect deleting previous id
          if (this.state.peer.id === null) {
              console.log('Received null id from peer open');
              this.setState({
                peerStatus: 'Null id'
              });
              this.state.peer.id = this.state.lastPeerId;
          } else {
            this.state.lastPeerId = this.state.peer.id;
          }
          console.log('My Peer ID: ' + this.state.peer.id);

          if (pID !== 0) {
            this.state.peerjs.id = pID;
            this.joinPeer(pID);
          }
      });
      this.state.peer.on('disconnected', () => {
          console.log('Connection lost. Please reconnect');
          this.setState({
            peerStatus: 'Lost'
          });
          // Workaround for peer.reconnect deleting previous id
          this.state.peer.id = this.state.lastPeerId;
          this.state.peer._lastServerId = this.state.lastPeerId;
          this.state.peer.reconnect();
      });
      this.state.peer.on('close', () => {
          this.state.peerConn = null;
          console.log('Connection Closed');
          this.setState({
            peerStatus: 'Closed'
          });
      });
      this.state.peer.on('error', (err) => {
          console.log(err);
          this.setState({
            peerStatus: 'Error'
          });
          // alert('' + err);
      });
  };
  /**
   * Create the connection between the two Peers.
   *
   * Sets up callbacks that handle any events related to the
   * connection and data received on it.
   */
  joinPeer(dID) {
      console.log('joinPeer dID', dID);
      // Close old connection
      if (this.state.peerConn) {
        this.state.peerConn.close();
      }
      // Create connection to destination peer specified in the input field
      this.state.peerConn = this.state.peer.connect(dID, {
          reliable: true
      });
      this.state.peerConn.on('open', () => {
          console.log("Connected to: " + this.state.peerConn.peer);
          this.setState({
            peerStatus: "Connected"
          });
          // Check URL params for comamnds that should be sent immediately
          var command = this.getUrlParam("command");
          if (command)
          this.state.peerConn.send(command);
      });
      // Handle incoming data (messages only since this is the signal sender)
      // this.state.peerConn.on('data', (data) => {
      //     // addMessage("<span className=\"peerMsg\">Peer:</span> " + data);
      //     this.setState({
      //       peerStatus: "Peer msg:" + JSON.stringify(data),
      //     });
      // });
      this.state.peerConn.on('close', () => {
          // status.innerHTML = "Connection closed";
          this.setState({
            peerStatus: "Closed",
          });
      });
  };
  /**
   * Get first "GET style" parameter from href.
   * This enables delivering an initial command upon page load.
   *
   * Would have been easier to use location.hash.
   */
  getUrlParam(name) {
      name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
      var regexS = "[\\?&]" + name + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(window.location.href);
      if (results == null)
          return null;
      else
          return results[1];
  };
  /**
   * Send a signal via the peer connection and add it to the log.
   * This will only occur if the connection is still alive.
   */
    signal(sigName) {
      if (this.state.peerConn.open) {
          this.state.peerConn.send(sigName);
          // console.log(sigName + " signal sent");
          this.setState({
            peerStatus: sigName + " signal sent",
          });
          // addMessage(cueString + sigName);
      }
  }
  // goButton.onclick = function () {
  //     signal("Go");
  // };
  // resetButton.onclick = function () {
  //     signal("Reset");
  // };
  // fadeButton.onclick = function () {
  //     signal("Fade");
  // };
  // offButton.onclick = function () {
  //     signal("Off");
  // };
  addMessage(msg) {
      var now = new Date();
      var h = now.getHours();
      var m = addZero(now.getMinutes());
      var s = addZero(now.getSeconds());
      if (h > 12) {
          h -= 12;
      }
      else if (h === 0) {
          h = 12;
      }
      // message.innerHTML = "<br><span className=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
  }
  addZero(t) {
    if (t < 10)
        t = "0" + t;
    return t;
  }
  clearMessages() {
      // message.innerHTML = "";
      addMessage("Msgs cleared");
  }
  
  getCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
      return;
    }

    // List cameras and microphones.
    navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
      const cams = _.filter(devices, (d) => { return d.kind == "videoinput"; });

      this.setState({
        media: {
          devices: cams,
          cameras: _.map(cams, 'label'),
          camera: _.map(cams, 'label')[0],
        },
      });
    })
    .catch((err) => {
      console.log(err.name + ": " + err.message);
    });
  }

  updatePeer(props) {
    this.setState({
      peerjs: _.cloneDeep(props),
      peerStatus: props.enabled ? this.state.peerStatus : "Disabled",
    });
    if (props.enabled) {
      if (this.state.peer !== null) {
        this.joinPeer(props.pID);
      } else {
        this.initializePeerConnection(props.pID);
      }
    } else {
      this.closePeerConnection();
    }
  }

  updateBroadcast(props) {
    this.setState({
      broadcast: _.cloneDeep(props),
      broadcastStatus: props.enabled ? "enabled" : "disabled",
    });
    
    if (props.enabled) {
      this.initializeSocketBroadcast();
    } else {
      this.closeSocket();
    }
  }

  updateCamera(props) {
    this.setState({ media: _.cloneDeep(props) });
  }

  getModelURL(props) {
    const MOBILENET_BASE_URL = 'models/posenet/mobilenet/';
    const RESNET50_BASE_URL = 'models/posenet/resnet50/';
    let graphJson = '';
    switch (props.architecture) {
      case 'MobileNetV1':
          const toStr = {1.0: '100', 0.75: '075', 0.50: '050'};
          graphJson = `model-stride${props.inputMobileNetV1.outputStride}.json`;
          // quantBytes=4 corresponding to the non-quantized full-precision checkpoints.
          if (props.inputMobileNetV1.quantBytes == 4) {
            return MOBILENET_BASE_URL + `float/${toStr[props.inputMobileNetV1.multiplier]}/` + graphJson;
          } else {
            return MOBILENET_BASE_URL + `quant${props.inputMobileNetV1.quantBytes}/${toStr[props.inputMobileNetV1.multiplier]}/` + graphJson;
          }
      break;
      case 'ResNet50':
        graphJson = `model-stride${props.inputResNet50.outputStride}.json`;
        // quantBytes=4 corresponding to the non-quantized full-precision checkpoints.
        if (props.inputResNet50.quantBytes == 4) {
          return RESNET50_BASE_URL + `float/` + graphJson;
        } else {
          return RESNET50_BASE_URL + `quant${props.inputResNet50.quantBytes}/` + graphJson;
        }
        break;
    }
  }

  updatePoseNet(props) {
    let p = _.cloneDeep(props);
    switch (p.architecture) {
      case 'MobileNetV1':
        p.inputMobileNetV1.outputStride = parseInt(p.inputMobileNetV1.outputStride);
        p.inputMobileNetV1.multiplier = parseFloat(p.inputMobileNetV1.multiplier);
        
        p.inputMobileNetV1.inputResolution = parseInt(p.inputMobileNetV1.inputResolution);
    
        p.inputMobileNetV1.modelUrl = this.getModelURL(p);
        p.inputMobileNetV1.quantBytes = parseFloat(p.inputMobileNetV1.quantBytes);
        break;
      case 'ResNet50':
        p.inputResNet50.outputStride = parseInt(p.inputResNet50.outputStride);
        p.inputResNet50.multiplier = 1;

        p.inputResNet50.inputResolution = parseInt(p.inputResNet50.inputResolution);
    
        p.inputResNet50.modelUrl = this.getModelURL(p);
        p.inputResNet50.quantBytes = parseFloat(p.inputResNet50.quantBytes);
        break;
    }
    this.setState({ poseNetProps: p });
  }

  closePeerConnection() {
    this.setState({
      peer: null
    });
  }
  
  closeSocket() {
    if (this.state.websocket !== null) {
      console.log('Closing socket... ');
      this.state.websocket.close();
      this.state.websocket = null;
    }
  }

  initializeSocketBroadcast() {
    if (this.state.websocket == null && this.state.broadcast.enabled) {
      const url = 'ws://' + this.state.broadcast.ip + ':' + this.state.broadcast.port;
      
      this.state.websocket = new WebSocket(url);
      this.state.websocket.onopen = this.onOpen.bind(this);
      this.state.websocket.onclose = this.onClose.bind(this);
      this.state.websocket.onmessage = this.onMessage.bind(this);
      this.state.websocket.onerror = this.onError.bind(this);

      console.log('Creating socket... ', url);
      this.setState({
        broadcastStatus: "creating...",
      });
    }
  }

  onOpen() {
    console.log('Socket connected');
    this.setState({
      broadcastStatus: "connected!",
    });
  }
  
  onClose() {
    // this.broadcasting = false;
    console.log('Socket closed');
    if (this.state.broadcastStatus !== 'connection error :(') {
      this.setState({
        broadcastStatus: "closed",
      });
    }
  }

  onMessage(msg) {
    // console.log('new msg: ', msg);
  }
  
  onError(err) {
    console.log('Socket error: ', err);
    this.setState({
      broadcastStatus: "connection error :(",
    }); 
  }

  broadcastPoses(poses, c) {
    let p = _.filter(poses, (pose) => {
      // console.log(pose.score >= c);
      if (pose.score >= c) {
        return true;
      }
      return false;
    });
    // peerjs active
    if (this.state.peerConn !== null) {
      if (p.length > 0) { 
        // console.log(p);
        this.state.peerConn.send(
          JSON.stringify(p)
        );
      }
    }

    // websocket active
    if (this.state.websocket !== null && this.state.broadcast.enabled && this.state.websocket.readyState === this.state.websocket.OPEN) { 
      if (p.length > 0) {
        this.state.websocket.send(JSON.stringify(p));
      }
    }
  }

  render() {
    return (
      <div className="app">
        <div id="poseNetPreview">
          <canvas id="preview" />
        </div>
        <div id="poseNetPredictions">
          <canvas id="predictions" />
        </div>
        <Menu isOpen={true} width={ '280px' } right customBurgerIcon={ <img src="/images/gear.png" /> }>
        
          <DatGui data={this.state.media} onUpdate={this.updateCamera.bind(this)} liveUpdate={true}>
            <DatButton label="Scan for cameras"  onClick={this.getCameras.bind(this)} />
            { (this.state.media.cameras.length > 0) ? <DatSelect label="Camera" path='camera' options={this.state.media.cameras} /> : <DatBoolean label="Enabled"  path='broadcast.enabled' /> }
          </DatGui>
          <DatGui data={this.state.peerjs} onUpdate={this.updatePeer.bind(this)} liveUpdate={true}>
            <DatFolder title="Peerjs">
              <Message label="label" message={!this.state.peerConn ? 'Enter Peer ID to Connect' : 'Connected to: ' + this.state.peerConn.peer} />
              <DatBoolean label="Enabled"  path='enabled' />
              <Message label="status" message={"Status: " + this.state.peerStatus} />
              <DatString label="Destination ID" path='pID'/>
            </DatFolder>
          </DatGui>
          <DatGui data={this.state.broadcast} onUpdate={this.updateBroadcast.bind(this)} liveUpdate={true}>
            <DatFolder title='Websocket'>
              <DatBoolean label="Enabled"  path='enabled' />
              <Message message={'Status: ' + this.state.broadcastStatus} />
              <DatString label="IP" path='ip'/>
              <DatString label="Port" path='port'/>
            </DatFolder>
          </DatGui>
          <DatGui data={this.state.poseNetProps} onUpdate={this.updatePoseNet.bind(this)} liveUpdate={true}>
            <DatFolder title='PoseNet'>
              <DatSelect label="Type" path='algorithm' options={this.state.poseNetProps.algorithms} />
              <DatSelect label="Architecture" path='architecture' options={this.state.poseNetProps.architectures} />
              { (this.state.poseNetProps.architecture === 'MobileNetV1') ?
                <DatFolder title='Input MobileNetV1'>
                  <DatSelect label="Output Stride" path='inputMobileNetV1.outputStride' options={this.state.poseNetProps.inputMobileNetV1.outputStrides} />
                  
                  <DatSelect label="Image Res" path='inputMobileNetV1.inputResolution' options={this.state.poseNetProps.inputMobileNetV1.inputResolutions} />
                  <DatSelect label="Multiplier" path='inputMobileNetV1.multiplier' options={this.state.poseNetProps.inputMobileNetV1.multipliers} />
                  
                  <DatSelect label="Quant Bytes" path='inputMobileNetV1.quantBytes' options={this.state.poseNetProps.inputMobileNetV1.quants} />
                </DatFolder>
                :
                <DatFolder title='Input ResNet50'>
                  <DatSelect label="Output Stride" path='inputResNet50.outputStride' options={this.state.poseNetProps.inputResNet50.outputStrides} />
                  
                  <DatSelect label="Image Res" path='inputResNet50.inputResolution' options={this.state.poseNetProps.inputResNet50.inputResolutions} />
                  <DatSelect label="Multiplier" path='inputResNet50.multiplier' options={this.state.poseNetProps.inputResNet50.multipliers} />
                  
                  <DatSelect label="Quant Bytes" path='inputResNet50.quantBytes' options={this.state.poseNetProps.inputResNet50.quants} />
                </DatFolder>
              }
              { (this.state.poseNetProps.algorithm === 'Single') ?
                  <DatFolder title='Single Pose'>
                    <DatNumber label="Flip Horizontal"  path='multiPoseDetection.flipHorizontal' min={1} max={20} step={1} />
                    <DatNumber label="Min Pose Confidence" path='singlePoseDetection.minPoseConfidence' min={0.0} max={1.0}/>
                    <DatNumber label="Min Part Confidence" path='singlePoseDetection.minPartConfidence' min={0.0} max={1.0}/>
                  </DatFolder>
                  :
                  <DatFolder title='Multi Pose'>
                    <DatNumber label="Flip Horizontal"  path='multiPoseDetection.flipHorizontal' min={1} max={20} step={1} />
                    <DatNumber label="Max Pose Detection"  path='multiPoseDetection.maxPoseDetections' min={1} max={20} step={1} />
                    <DatNumber label="Min Pose Confidence"  path='multiPoseDetection.minPoseConfidence' min={0.0} max={1.0}/>
                    <DatNumber label="Min Part Confidence"  path='multiPoseDetection.minPartConfidence' min={0.0} max={1.0}/>
                    <DatNumber label="Radius"  path='multiPoseDetection.nmsRadius' min={0.0} max={40.0}/>
                  </DatFolder>
              }
              <DatButton label="PoseNet Information"  onClick={()=> {
                window.open('https://github.com/tensorflow/tfjs-models/tree/master/posenet');
              }} />
            </DatFolder>
            <DatFolder title='View'>
              <DatBoolean label="Mirror"  path='output.mirror' />
              <DatBoolean label="Show Bounding Box"  path='output.showBoundingbox' />
              <DatBoolean label="Show Skeleton"  path='output.showSkeleton' />
              <DatBoolean label="Show Points"  path='output.showKeypoints' />
            </DatFolder>
          </DatGui>
        </Menu>
      </div>
    );
  }
}

export default Main;
