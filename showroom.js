
function Showroom(container) {
    this._width = 1024;
    this._height = 576;
    this._viewangle = 45;
    this._aspectratio = this._width / this._height;
    this._near = 0.1;
    this._far = 10000;
    this._container = container;
    this._renderer = new THREE.WebGLRenderer({antialias: true});
    this._camera = new THREE.PerspectiveCamera( this._viewangle, 
                                                this._aspectratio, 
                                                this._near,
                                                this._far );
    this._scene = new THREE.Scene();

    this._scene.add(this._camera);
    this._camera.position.z = 300;
    this._renderer.setSize(this._width, this._height);
    this._renderer.setClearColor( 0xf0f0f0 );
    this._container.html(this._renderer.domElement);
    this._pointLight = new THREE.PointLight(0xFFFFFF);
    this._pointLight.intensity = 1.1;
    this._pointLight.position.x = 10;
    this._pointLight.position.y = 50;
    this._pointLight.position.z = 130;
    this._scene.add(this._pointLight);
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

Showroom.prototype.Render = function () {
    this._renderer.render(this._scene, this._camera);
};

Showroom.prototype.SetLightPos = function (x,y,z) {
    this._pointLight.position.x = x - this._width/2 - $("canvas").offset().left;
    this._pointLight.position.y = (this._height-y) - this._height/2 - $("canvas").offset().top;
    this._pointLight.position.z = z;
};
