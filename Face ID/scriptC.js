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

