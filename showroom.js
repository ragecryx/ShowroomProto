
function Showroom() {
    this._width = 1024;
    this._height = 576;
    this._viewangle = 45;
    this._aspectratio = this._width / this._height;
    this._near = 0.1;
    this._far = 10000;
    
    this._defaultMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
    // Wall segments
    this._wallHeight = 3;
    this._wallSegments = [];


    this._container = $("#ShowroomApp");
    this._renderer = new THREE.WebGLRenderer({antialias: true});

    this._previewCamera = new THREE.PerspectiveCamera( this._viewangle, this._aspectratio, this._near, this._far );
    this._floorPlanCamera = new THREE.OrthographicCamera( this._width / - 2, this._width / 2, this._height / 2, this._height / - 2, 1, 1000 );
    this._currentCamera = this._previewCamera;
    this._currentCameraName = "preview";
    
    this._scene = new THREE.Scene();

    this._scene.add(this._currentCamera);
    this._previewCamera.position.y = 1.8;
    this._previewCamera.position.z = 2;
    this._floorPlanCamera.position.y = 100;
    this._floorPlanCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));

    this._renderer.setSize(this._width, this._height);
    this._renderer.setClearColor( 0xf0f0f0 );
    this._container.html(this._renderer.domElement);

    this._pointLight = new THREE.PointLight(0xFFFFFF);
    this._pointLight.intensity = 1.1;
    this._pointLight.position.x = 10;
    this._pointLight.position.y = 50;
    this._pointLight.position.z = 130;
    this._scene.add(this._pointLight);

    // pretty basic controls
    function controlHandleFunc(obj){
       return function(e){
        //e.preventDefault();
        if(e.which == 38) // up arrow
            obj._currentCamera.position.z -= 1;
        else if(e.which == 40)
            obj._currentCamera.position.z += 1;
        else if(e.which == 37)
            obj._currentCamera.position.x -= 1;
        else if(e.which == 39)
            obj._currentCamera.position.x += 1;
        else if(e.which == 67)
            if(obj._currentCameraName === "preview") {
                obj._currentCamera = obj._floorPlanCamera;
                obj._currentCameraName = "floorplan";
            } else {
                obj._currentCamera = obj._previewCamera;
                obj._currentCameraName = "preview";
            }
        obj.Render();
        };
    }
    $(document).keydown(controlHandleFunc(this));

}



Showroom.prototype.AddSphere = function () {
    var radius = 50;
    var segments = 16;
    var rings = 16;

    var sphereMaterial = new THREE.MeshLambertMaterial({color: 0xCC0000});

    var sphere = new THREE.Mesh( new THREE.SphereGeometry(radius, segments, rings),
                                 sphereMaterial );

    this._scene.add(sphere);
};



Showroom.prototype.AddCube = function() {
    var cubeMaterial = new THREE.MeshLambertMaterial({color: 0x00CC00});
    var cube = new THREE.Mesh(new THREE.BoxGeometry(30,70,30), cubeMaterial);
    cube.position.x = 40;
    this._scene.add(cube);
};



Showroom.prototype.AddWallSegment = function(x1, z1, x2, z2) {
    var segment = { startPos: new THREE.Vector3(x1, 0, z1),
                              endPos: new THREE.Vector3(x2, 0, z2) };
    this._wallSegments.push(segment);
    
    // generate mesh
    var wallGeometry = new THREE.Geometry();
    
    wallGeometry.vertices.push( segment.startPos,
                                segment.endPos,
                                new THREE.Vector3(segment.startPos.x, this._wallHeight, segment.startPos.z),
                                new THREE.Vector3(segment.endPos.x, this._wallHeight, segment.endPos.z) );
    
    wallGeometry.faces.push(new THREE.Face3(0,1,2));
    wallGeometry.faces.push(new THREE.Face3(2,1,3));
    
    wallGeometry.computeFaceNormals();
    wallGeometry.computeVertexNormals();

    // test add to scene
    var wallMaterial =  new THREE.MeshLambertMaterial({color: 0xCC0000});
    var wallMesh = new THREE.Mesh(wallGeometry, this._defaultMaterial);
    this._scene.add(wallMesh);
};



Showroom.prototype.Render = function () {
    this._renderer.render(this._scene, this._currentCamera);
};



Showroom.prototype.SetLightPos = function (x,y,z) {
    this._pointLight.position.x = x - this._width/2 - $("canvas").offset().left;
    this._pointLight.position.y = (this._height-y) - this._height/2 - $("canvas").offset().top;
    this._pointLight.position.z = z;
};

