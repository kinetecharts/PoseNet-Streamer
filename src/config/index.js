//Store client config values here

import config from './../../server/config';

export default {
  lastPeerId: null,
  peer: null, // Own peer object
  peerId: null,
  peerConn: null,
  debug: true, //Includes stats and helpers,
  forceUpdate: false,
  media: {
    devices: [],
    camera: '',
    cameras: [],
  },
  websocket: null,
  peerStatus: 'Peerjs Enabled',
  peerjs: { //defaults
    enabled: true,
    id: 0, // your id
    pID: 0, // your peer's id
  },
  peer: null,
  broadcastStatus: 'disabled',
  broadcast: config.websocket,
  poseNetProps: { // https://github.com/tensorflow/tfjs-models/tree/master/posenet
    algorithm: 'Single',
    algorithms: ['Single', 'Multiple'],
    architecture: 'MobileNetV1',
    architectures: ['MobileNetV1', 'ResNet50'],
    inputMobileNetV1: {
      architecture: 'MobileNetV1',
      outputStride: 16, // higher is faster
      outputStrides: [8, 16],
      inputResolution: 513, // lower is faster
      inputResolutions: [161, 193, 257, 289, 321, 353, 385, 417, 449, 481, 513, 801],
      multiplier: 0.50, // MobileNetV1 only, lower is faster
      multipliers: [1.0, 0.75, 0.50],
      quantBytes: 2, // lower is faster
      quants: [1, 2, 4],
      modelUrl: 'models/posenet/mobilenet/quant2/075/model-stride16.json',
    },
    inputResNet50: {
      architecture: 'ResNet50',
      outputStride: 32, // higher is faster
      outputStrides: [16, 32],
      inputResolution: 257, // lower is faster
      inputResolutions: [161, 193, 257, 289, 321, 353, 385, 417, 449, 481, 513, 801],
      multiplier: 1, // MobileNetV1 only, lower is faster
      multipliers: [1.0],
      quantBytes: 2, // lower is faster
      quants: [1, 2, 4],
      modelUrl: 'models/posenet/resnet50/quant2/model-stride32.json',
    },
    singlePoseDetection: {
      flipHorizontal: false,
      minPoseConfidence: 0.1,
      minPartConfidence: 0.5,
    },
    multiPoseDetection: {
      flipHorizontal: false,
      minPoseConfidence: 0.15,
      minPartConfidence: 0.1,
      maxDetections: 5,
      scoreThreshold: 0.85,
      nmsRadius: 30.0,
    },
    output: {
      mirror: true,
      showBoundingbox: false,
      showSkeleton: false,
      showKeypoints: true,
    },
  },
};

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}