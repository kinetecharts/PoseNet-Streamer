import React from 'react';
import WebSocket from 'ws';

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
      // console.log('shouldComponentUpdate:', this.state.forceUpdate);
      this.setState({ forceUpdate: false });
      return true;
    }

    if (this.props && this.state) {
      if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
        this.state.poseNet.updatePoseNet(nextState.poseNetProps, nextState.media);
        // console.log('shouldComponentUpdate:', true);
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
    this.state.poseNet.init();
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

      if (this.state.broadcast.enabled) {
        this.initSocketBroadcast();
      }
    })
    .catch((err) => {
      console.log(err.name + ": " + err.message);
    });
  }

  updateBroadcast(props) {
    this.setState({ broadcast: _.cloneDeep(props) });
    if (props.enabled) {
      this.initSocketBroadcast();
    } else {
      this.closeSocket();
    }
  }

  updateCamera(props) {
    this.setState({ media: _.cloneDeep(props) });
  }

  updatePoseNet(props) {
    let p = _.cloneDeep(props);
    p.input.mobileNetArchitecture = parseInt(p.input.mobileNetArchitecture);
    p.input.outputStride = parseInt(p.input.outputStride);
    this.setState({ poseNetProps: p });
  }

  closeSocket() {
    if (this.state.websocket !== null) {
      console.log('Closing socket... ');
      this.state.websocket.close();
      this.state.websocket = null;
    }
  }

  initSocketBroadcast() {
    if (this.state.websocket == null) {
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

  broadcastPoses(p, c) {
    if (this.state.websocket !== null && this.state.broadcast.enabled) { 
      this.state.websocket.send(JSON.stringify({
        pose: p,
        confidence: c,
      }));
    }
  }

  render() {

    let mediaList = <DatBoolean label="Enabled"  path='broadcast.enabled' />;
    if (this.state.media.cameras.length > 0) {
      mediaList = <DatSelect label="Camera" path='camera' options={this.state.media.cameras} />;
    }
    return (
      <div className="app">
        <div id="poseNetPreview">
          <canvas id="preview" />
        </div>
        <div id="poseNetPredictions">
          <canvas id="predictions" />
        </div>
        <Menu width={ '280px' } right customBurgerIcon={ <img src="/images/gear.png" /> }>
          <DatGui data={this.state.media} onUpdate={this.updateCamera.bind(this)}>
            { mediaList }
          </DatGui>
          <DatGui data={this.state.broadcast} onUpdate={this.updateBroadcast.bind(this)}>
            <DatFolder title='Broadcast'>
              <DatBoolean label="Enabled"  path='enabled' />
              <Message message={this.state.broadcastStatus} />
              <DatString label="IP" path='ip'/>
              <DatString label="Port" path='port'/>
            </DatFolder>
          </DatGui>
          <DatGui data={this.state.poseNetProps} onUpdate={this.updatePoseNet.bind(this)}>
            <DatFolder title='PoseNet'>
              <DatSelect label="Type" path='algorithm' options={this.state.poseNetProps.algorithms} />
              <DatFolder title='Input'>
                <DatSelect label="Mobile Arch" path='input.mobileNetArchitecture' options={this.state.poseNetProps.input.mobileNetArchitectures} />
                <DatSelect label="Output Stride" path='input.outputStride' options={this.state.poseNetProps.input.outputStrides} />
                <DatNumber label="Image Scale" path='input.imageScaleFactor' min={0.2} max={1.0}/>
              </DatFolder>
              { (this.state.poseNetProps.algorithm == 'Single') ?
                  <DatFolder title='Single Pose'>
                    <DatNumber label="Min Pose Confidence" path='singlePoseDetection.minPoseConfidence' min={0.0} max={1.0}/>
                    <DatNumber label="Min Part Confidence" path='singlePoseDetection.minPartConfidence' min={0.0} max={1.0}/>
                  </DatFolder>
                  :
                  <DatFolder title='Multi Pose'>
                    <DatNumber label="Max Pose Detection"  path='multiPoseDetection.maxPoseDetections' min={1} max={20} step={1} />
                    <DatNumber label="Min Pose Confidence"  path='multiPoseDetection.minPoseConfidence' min={0.0} max={1.0}/>
                    <DatNumber label="Min Part Confidence"  path='multiPoseDetection.minPartConfidence' min={0.0} max={1.0}/>
                    <DatNumber label="Radius"  path='multiPoseDetection.nmsRadius' min={0.0} max={40.0}/>
                  </DatFolder>
              }
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
