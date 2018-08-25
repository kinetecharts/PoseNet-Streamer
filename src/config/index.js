//Store client config values here

import config from './../../server/config';

const defaults = {
  debug: true, //Includes stats and helpers,
  forceUpdate: false,
  media: {
    devices: [],
    camera: '',
    cameras: [],
  },
  websocket: null,
  broadcastStatus: 'disconnected',
  broadcast: config.broadcast,
  poseNetProps: {
    algorithm: 'Single',
    algorithms: ['Single', 'Multiple'],
    input: {
      mobileNetArchitecture: isMobile() ? 0.50 : 0.75,
      mobileNetArchitectures: [1.01, 1.00, 0.75, 0.50],
      outputStride: 16,
      outputStrides: [8, 16, 32],
      imageScaleFactor: 0.5,
    },
    singlePoseDetection: {
      minPoseConfidence: 0.1,
      minPartConfidence: 0.5,
    },
    multiPoseDetection: {
      maxPoseDetections: 5,
      minPoseConfidence: 0.15,
      minPartConfidence: 0.1,
      nmsRadius: 30.0,
    },
    output: {
      mirror: true,
      showBoundingbox: false,
      showSkeleton: true,
      showKeypoints: true,
    },
  },
};

module.exports = defaults;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}