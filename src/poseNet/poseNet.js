import * as posenet from '@tensorflow-models/posenet';
import Stats from 'stats.js';

class PoseNet {
  constructor(guiProps, media, broadcastPoses) {
    this.stats = new Stats();
    this.posenet = null;
    this.guiState = guiProps;
    this.media = media;
    this.broadcastPoses = broadcastPoses;
  }

  setupFPS() {
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    const d = document.createElement('div')
    d.className = 'bm-item';
    d.id = 'stats-bm-item';
    d.appendChild(this.stats.dom);
    document.getElementsByClassName('bm-item-list')[0].appendChild(d);
  }

  initPosenet(input) {
    return new Promise((resolve) => {
      posenet.load(
        input
        ).then((posenet) => {
        resolve(posenet);
      });
    })
    .catch(function(error) { console.error(error); });
  }

  updatePoseNet(newProps, newMedia) {
    this.guiState = newProps;
    this.media = newMedia;
    this.init();
  }

  init() {
    if (window.stream) {
      window.stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }

    this.preview = document.getElementById('preview');
    this.predictions = document.getElementById('predictions');
    this.video = document.createElement('video');

    this.initPosenet(this.guiState.architecture === 'MobileNetV1' ? this.guiState.inputMobileNetV1 : this.guiState.inputResNet50)
      .then((p) => {
        this.posenet = p;
        this.color = '#ffffff';// + ((1<<24)*Math.random()|0).toString(16);

      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: {
              exact: _.filter(this.media.devices, (device) => {
                return device.label === this.media.camera;
              })[0].deviceId,
            },
          },
        }).then((stream) => {
          window.stream = stream;
          this.video.srcObject = stream;

        
          this.previewContext = this.preview.getContext('2d');
          this.predictionsContext = this.predictions.getContext('2d');

          this.video.onloadedmetadata = (e) => {
            this.video.addEventListener('canplay', () => {
              this.preview.width = this.video.videoWidth;
              this.preview.height = this.video.videoHeight;
              this.predictions.width = this.video.videoWidth;
              this.predictions.height = this.video.videoHeight;
              this.grabFrame();
              this.detect();
            });

            this.video.play();
          };
          
          this.setupFPS();
        })
        .catch(function(error) { console.error(error); });
      }
    });
  }

  grabFrame() {
    if (this.guiState.output.mirror) {
      this.flipCanvas(this.video, this.previewContext, true, false, this.video.videoWidth, this.video.videoHeight);
    } else {
      this.previewContext.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, 0, 0, this.preview.width, this.preview.height);
    }

    requestAnimationFrame(this.grabFrame.bind(this));
  }

  flipCanvas(video, ctx, flipH, flipV, width, height) {
      const scaleH = flipH ? -1 : 1, // Set horizontal scale to -1 if flip horizontal
          scaleV = flipV ? -1 : 1, // Set verical scale to -1 if flip vertical
          posX = flipH ? width * -1 : 0, // Set x position to -100% if flip horizontal
          posY = flipV ? height * -1 : 0; // Set y position to -100% if flip vertical
      ctx.save(); // Save the current state
      ctx.scale(scaleH, scaleV); // Set scale to flip the image
      ctx.drawImage(video, posX, posY, width, height); // draw the image
      ctx.restore(); // Restore the last saved state
  }

  async detect() {
    if (this.guiState.algorithm == 'Multiple') {
      await this.multiplePoses(this.guiState.architecture === 'MobileNetV1' ? this.guiState.inputMobileNetV1 : this.guiState.inputResNet50);
    } else {
      await this.singlePose(this.guiState.architecture === 'MobileNetV1' ? this.guiState.inputMobileNetV1 : this.guiState.inputResNet50);
    }
    requestAnimationFrame(this.detect.bind(this));
  }

  drawPose(pose, confidence) {
    this.stats.begin();
    this.predictionsContext.clearRect(0, 0, this.predictions.width, this.predictions.height);
    if (this.guiState.output.showBoundingbox) {
      this.drawBoundingBox(this.predictionsContext, pose.keypoints, this.color);
    }
    if (this.guiState.output.showKeypoints) {
      this.drawKeypoints(this.predictionsContext, pose.keypoints, confidence, this.color);
    }
    if (this.guiState.output.showSkeleton) {
      this.drawSkeleton(this.predictionsContext, pose.keypoints, confidence, this.color);
    }
    this.stats.end();
  }

  async multiplePoses(input) {
    await this.posenet.estimateMultiplePoses(
      this.preview,
      {
        flipHorizontal: this.guiState.multiPoseDetection.maxPoseDetections,
        maxDetections: this.guiState.multiPoseDetection.maxPoseDetections,
        scoreThreshold: this.guiState.multiPoseDetection.scoreThreshold,
        nmsRadius: this.guiState.multiPoseDetection.nmsRadius,
      }
    ).then((poses) => {
      this.broadcastPoses(poses, this.guiState.multiPoseDetection.minPoseConfidence);
      poses.forEach(pose => this.drawPose(pose, this.guiState.multiPoseDetection.minPoseConfidence));
    });
  }

  async singlePose(input) {
    await this.posenet.estimateSinglePose(
      this.preview,
      input.imageScaleFactor,
      false,
      input.outputStride,
    ).then((pose) => {
      this.broadcastPoses([pose], this.guiState.singlePoseDetection.minPoseConfidence);
      // this.drawPose(pose, this.guiState.singlePoseDetection.minPoseConfidence);
      [pose].forEach(pose => this.drawPose(pose, this.guiState.multiPoseDetection.minPoseConfidence));
    });
  }

  drawKeypoints(context, keypoints, minConfidence, color) {
    // debugger;
    keypoints.forEach((keypoint) => {
      if (keypoint.score < minConfidence) {
        return;
      }
      const { y, x } = keypoint.position;
      context.beginPath();
      context.arc(x, y, 3, 0, 2 * Math.PI);
      context.fillStyle = color;
      context.fill();
      context.stroke();
    });
  }

  drawBoundingBox(context, keypoints, color) {
    const box = posenet.getBoundingBox(keypoints);

    context.lineWidth = 4;
    context.strokeStyle = color;
    context.strokeRect(
      box.minX,
      box.minY,
      box.maxX - box.minX,
      box.maxY - box.minY,
    );
  }

  drawSegment(context, [ay, ax], [by, bx], color) {
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.stroke();
  }

  drawSkeleton(context, keypoints, minConfidence, color) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
      this.drawSegment(context, this.toTuple(keypoints[0].position), this.toTuple(keypoints[1].position), color);
    });
  }

  toTuple({ y, x }) {
    return [y, x];
  }
}

export default PoseNet;
