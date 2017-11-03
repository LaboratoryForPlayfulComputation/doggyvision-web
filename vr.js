var scene, camera, video, renderer, stereoRenderer, onRenderFcts;

function onLoad(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);

    renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    var width = window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth ||
                document.body.offsetWidth;
    var height = window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight ||
                document.body.offsetHeight;                        
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';

    stereoRenderer = new THREE.VREffect(renderer);         
    stereoRenderer.setSize(width, height);

    video = document.getElementById("video");
    onRenderFcts = [];
}

function vrEffect(){
    document.body.appendChild(renderer.domElement);
    initArVideo(video);
    runRenderingLoop();    
}

function initArVideo(source){
    var videoTexture = new THREE.VideoTexture(source);
    videoTexture.minFilter =  THREE.NearestFilter;
    //let videoInWebgl = new THREEx.ArVideoInWebgl(videoTexture);
    var videoInWebgl = new ArVideo(videoTexture, source);
    scene.add(videoInWebgl.object3d);   
    source.style.visibility = 'hidden';   
    //board().video = videoInWebgl;
}

class ArVideo {

    constructor(videoTexture, source){
        this.videoTexture = videoTexture;
        this.source = source;
        var geometry = new THREE.PlaneGeometry(2, 2);
        var material = new THREE.MeshBasicMaterial({
            map : videoTexture,
        });
        var seethruPlane = new THREE.Mesh(geometry, material);
        this.object3d = seethruPlane;            
    }

    update(camera) { // type: THREE.PerspectiveCamera
        camera.updateMatrixWorld(true)
        var position = new THREE.Vector3(-0,0,-20)  // TODO how come you got that offset on x ???
        var position = new THREE.Vector3(-0,0,-20)  // TODO how come you got that offset on x ???
        this.object3d.position.copy(position)
        camera.localToWorld(this.object3d.position)
        camera.matrixWorld.decompose( camera.position, camera.quaternion, camera.scale );   
        this.object3d.quaternion.copy( camera.quaternion )
        var fov = THREE.Math.radToDeg(Math.atan(1/camera.projectionMatrix.elements[5]))*2;
        var elementWidth = parseFloat(this.source.domElement.style.width.replace(/px$/,''), 10 );
        var elementHeight = parseFloat(this.source.domElement.style.height.replace(/px$/,''), 10 );
        var aspect = elementWidth / elementHeight
        this.object3d.scale.y = Math.tan(THREE.Math.DEG2RAD * fov/2)*position.length() 
        this.object3d.scale.x = this.object3d.scale.y * aspect
    }            
}

function runRenderingLoop(){
    var lastTimeMsec = 0;
    requestAnimationFrame(function animate(nowMsec){
        requestAnimationFrame(animate);
        lastTimeMsec = lastTimeMsec || nowMsec-1000/60;
        var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
        lastTimeMsec = nowMsec;
        stereoRenderer.render(scene, camera);  
        onRenderFcts.forEach(function(onRenderFct){
            onRenderFct(deltaMsec/1000, nowMsec/1000);
        });
    });
}

window.onload = onLoad;