var video, canvas, context, imageData, deuteranopia, brightnessDiscrimination, visualAcuity;
var deuteranopia = true;
var brightnessDiscrimination = true;
var visualAcuity = 0;

function deuteranopiaChanged(){
  deuteranopia = !deuteranopia;
}

function brightnessDiscriminationChanged(){
  brightnessDiscrimination = !brightnessDiscrimination;
}

function visualAcuityChanged(){
  visualAcuity = document.getElementById("myRange").value;
}

function onLoad(){
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  canvas2 = document.getElementById("canvas2");
  context = canvas.getContext("2d");
  context2 = canvas2.getContext("2d");

  canvas.width = parseInt(canvas.style.width);
  canvas.height = parseInt(canvas.style.height);
  canvas2.width = parseInt(canvas2.style.width);
  canvas2.height = parseInt(canvas2.style.height);      
  
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (navigator.getUserMedia){
    function successCallback(stream){
      if (window.webkitURL) {
        video.src = window.webkitURL.createObjectURL(stream);
      } else if (video.mozSrcObject !== undefined) {
        video.mozSrcObject = stream;
      } else {
        video.src = stream;
      }
    }
    function errorCallback(error){
    }
    navigator.getUserMedia({video: true}, successCallback, errorCallback);
    requestAnimationFrame(tick);
  }
}

function tick(){
  requestAnimationFrame(tick);
  if (video.readyState === video.HAVE_ENOUGH_DATA){
    snapshot();
  }
}

function snapshot(){
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  //imageData = imgprocess(imageData, true, false, 2);
  context2.putImageData(imgprocess(imageData, deuteranopia, brightnessDiscrimination, visualAcuity), 0, 0);
  //context.drawImage(video, 0, 0, canvas.width, canvas.height);
}
      
window.onload = onLoad;