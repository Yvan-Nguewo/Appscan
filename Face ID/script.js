const video = document.getElementById('video')

/*Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/Models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/Models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/Models'),
    faceapi.nets.faceExpressNet.loadFromUri('/Models'),
]).then(startVideo)*/

function startVideo(){
    navigator.getUserMedia(
        {video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedias(video)
    document.body.append(canvas)
    const displaySize = {width: video.width, height: video.height}
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
        const detections = await faceapi.detectAllFace(video,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
        console.log(detections)
        const resizeDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
        faceapi.draw.drawDetections(canvas, resizeDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizeDetections)
    }, 100)
})

startVideo()


const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}




const fileUpload = document.getElementById("fileUpload");
const uploadedImageDiv = document.getElementById("uploadedImage");

fileUpload.addEventListener("change", getImage, false);

const Model_url = "./Models";
let modelsloaded = [];

faceapi.nets.tinyFaceDetector.loadFromUri(Model_url).then(() => {
  modelsloaded = [...modelsloaded, "tinyFaceDetector loaded"];
});

faceapi.nets.ssdMobilenetv1.loadFromUri(Model_url).then(() => {
  modelsloaded = [...modelsloaded, "ssdMobilenetv1 loaded"];
});

function getImage(){
  console.log("images", this.files[0]);
  const imageToProcess = this.files[0];
  let image = new Image(imageToProcess.width, imageToProcess.height);
  image.src = URL.createObjectURL(imageToProcess);
  uploadedImageDiv.style.border = "1px solid #FCB514";
  uploadedImageDiv.appendChild(image);
  processImage(image);
}

function processImage(image){
  if(modelsloaded.length !== 2){
    console.log("please wait while: models are still loading");
    return;
  }
  faceapi.detectAllFaces(image).then(facesDetection => {
    console.log("detectAllFaces facesDetected", facesDetection);
  })
}