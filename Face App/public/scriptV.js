const video = document.getElementById('video')
let predictedAges= [];
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    /*if (detections.length)
    saveCanvas(canvas);*/

    const getFaceAndDescriptor = (canvas, type = 'base64') => {
      if (!canvas) return Promise.reject(new Error('Foto no válida'));
    
      return new Promise(async (resolve, reject) => {
        try {
          const photo = {
            thumbnail: {
              b64: null,
              blob: null,
            },
            faces: [],
          };
          resizeToMax(canvas); //<- reduce canvas height and width if it necesary
          const result = await faceapi.detectAllFaces(canvas, faceDetectionOptionsFiles);
          if (!result) return reject(new Error('Cara no encontrada'));
          if (result.length > 1) {
            return reject(new Error(`Foto no válida, se encontraron ${result.length} rostros`));
          }
          if (result.length === 0) {
            return reject(new Error('La imagen no contiene un rostro o se encuentra muy lejos'));
          }
    
          let { box } = result[0];
          let region = new faceapi.Rect(box._x, box._y, box._width, box._height);
          const boxFace = box;
          let face = await faceapi.extractFaces(canvas, [region]);
    
          const landmarks = await faceapi.detectFaceLandmarksTiny(face[0]);
          box = landmarks.align();
          region = new faceapi.Rect(box._x, box._y, box._width, box._height);
          face = await faceapi.extractFaces(face[0], [region]);
          canvas2gray(face[0]); // Convierte el canvas a escala de grises
          const blobFace = await canvas2blob(face[0]);
          let descriptor = await faceapi.computeFaceDescriptor(face[0]); // get Float32Array
          // Encode descriptor to send a server
          descriptor =  btoa(String.fromCharCode.apply(null, new Uint8Array(descriptor.buffer)))
          // Push blob of face and descriptor
          photo.faces.push({
            blob: blobFace,
            descriptor,
          });
    
          box = boxFace;
          if (canvas.height > 240 && canvas.width > 320) {
            let x;
            let y;
            let h = canvas.height * 0.9;
            let w = box.width;
            const centerX = box.width / 2;
            const centerY = box.height / 2;
            x = box.x - centerX;
            if (x < 0) x = box.x;
            else w = box.width * 2;
            y = box.y - centerY;
            if (y < 0) y = 0;
            if (h - y < canvas.height) h -= y;
            else h = box.height;
            // Get thumbnail
            region = new faceapi.Rect(x, y, w, h); // region center imagen
          } else {
            region = new faceapi.Rect(box.x, box.y, box.width, box.height);
          }
    
          const thumbnail = await faceapi.extractFaces(canvas, [region]);
          const blobThumbnail = await canvas2blob(thumbnail[0]);
          photo.thumbnail = {
            blob: blobThumbnail,
          };
          if (type === 'base64') photo.thumbnail.b64 = thumbnail[0].toDataURL('image/jpeg');
    
          resolve(photo);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    };
    /*const age = resizedDetections[0].age;
    const interpolatedAge = interpolatedAgePredictions(age);
    const bottomRight = {
      x: resizedDetections[0].detection.box.bottomRight.x -50,
      y: resizedDetections[0].detection.box.bottomRight.y,
    }

    new faceapi.draw.DrawTextField(
      [`${faceapi.utils. round(interpolatedAge, 0)} years`],
      bottomRight
    ).draw(canvas);
    */

  
  }, 100)
})
/*
function interpolatedAgePredictions(age){
  predictedAges = [age].concat(predictedAges).slice(0 ,30)
  const avgPredictedAge = predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}



function saveCanvas(canvas) {
  const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  
  window.location.href=image;
}
*/



function canvas2blob(can, type = 'image/jpeg', quality = 0.97) {
  return Promise.try(() => {
    if (!can) throw new Error('Empty canvas');
    return new Promise((resolve, reject) => {
      can.toBlob(resolve, type, quality);
    });
  });
}

function resizeToMax(can, max_size = 640) {
  if (!can || !can.width || !can.height) return;
  let { width } = can;
  let { height } = can;
  if (width <= max_size && height <= max_size) return;
  if (width > height) {
    if (width > max_size) {
      height *= max_size / width;
      width = max_size;
    }
  } else if (height > max_size) {
    width *= max_size / height;
    height = max_size;
  }
  can.width = width;
  can.height = height;
}

function canvas2gray(c) {
  if (!c || !c.width || !c.height) return;
  const ctx = c.getContext('2d');

  const idataSrc = ctx.getImageData(0, 0, c.width, c.height); // original
  const idataTrg = ctx.createImageData(c.width, c.height); // empty data
  const dataSrc = idataSrc.data; // reference the data itself
  const dataTrg = idataTrg.data;
  const len = dataSrc.length;
  let i = 0;
  let luma;

  // convert by iterating over each pixel each representing RGBA
  for (; i < len; i += 4) {
    // calculate luma, here using Rec 709
    luma = dataSrc[i] * 0.2126 + dataSrc[i + 1] * 0.7152 + dataSrc[i + 2] * 0.0722;

    // update target's RGB using the same luma value for all channels
    dataTrg[i] = dataTrg[i + 1] = dataTrg[i + 2] = luma;
    dataTrg[i + 3] = dataSrc[i + 3]; // copy alpha
  }
  // put back luma data so we can save it as image
  ctx.putImageData(idataTrg, 0, 0);
}
