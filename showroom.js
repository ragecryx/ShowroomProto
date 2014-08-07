
var Showroom = (function () {

        // General config
        var width = 1024;
        var height = 576;
        var fov = 45;
        var aspectRatio = width / height;
        var near = 0.1;
        var far = 10000;


        // Three.js initialization
        var container = null;
        var rendererOptions =  {
            antialias: true
        };
        var renderer = new THREE.WebGLRenderer( rendererOptions );


        // Camera & Scene initialization
        var cameraOptions = {
            planCameraZoom: 32
        };
        var cameras = {
            previewCamera: new THREE.PerspectiveCamera( fov, aspectRatio, near, far ),

            planCamera: new THREE.OrthographicCamera( width / - cameraOptions.planCameraZoom,
                                                      width / cameraOptions.planCameraZoom,
                                                      height / cameraOptions.planCameraZoom,
                                                      height / - cameraOptions.planCameraZoom,
                                                      near, far )
        };

        var currentCamera = cameras.previewCamera;
        var currentCameraName = "preview";

        var scene = new THREE.Scene();

        
        // Default object(s) config/data
        var defaultMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
        var worldGrid = new THREE.GridHelper(20, 1);


        // Wall objects config/data
        var wallOptions = {
            wallHeight: 3.05,
            wallThickness: 0.3
        };
        var wallSegments = [];


        // Controls config/data
        var controls = {
            orbitControls: null,
            toolControls: null
        };
        

        // Scene Lighting
        var pointLight = null;

        
        // Private method definitions

        function SetupLighting() {
            pointLight = new THREE.PointLight(0xFFFFFF);
            pointLight.intensity = 1.1;
            pointLight.position.x = 10;
            pointLight.position.y = 50;
            pointLight.position.z = 130;
            scene.add( pointLight );
        }

        function SetupControls() {
            // Setup Orbit camera controls
            controls.orbitControls = new THREE.OrbitControls( currentCamera );
            controls.orbitControls.addEventListener( 'change', function (){ Showroom.Render(); } );

            // Tools controls
            controls.toolControls = new WallToolControl( container[ 0 ] );

            controls.toolControls.addEventListener('wallupdated', function() {
                    console.log("DING!! WALL UPDATED CALLBACK!!!")
                }
            );

            // Extra controls (Camera swap etc.)
            $(document).keydown( function (e) {
                    if(e.which == 67)
                        Showroom.ToggleActiveCamera();
                    // obj._orbitControls.object = obj._currentCamera;
                    
                    Showroom.Render();
            } );
        }



        // Public method definitions

        return {
            Initialize: function () {
                container = $("#ShowroomApp");
                scene.add( worldGrid );
                scene.add( currentCamera );

                SetupControls();
                SetupLighting();

                cameras.previewCamera.position.y = 1.8;
                cameras.previewCamera.position.x = 2;
                cameras.previewCamera.position.z = 20;
                cameras.planCamera.position.y = 100;
                cameras.planCamera.lookAt( new THREE.Vector3(0, 0, 0) );

                renderer.setSize( width, height );
                renderer.setClearColor( 0xf0f0f0 );
                container.html( renderer.domElement );
            },


            Render: function () {
                renderer.render( scene, currentCamera );
            },


            EnableToolControls: function () {
                controls.orbitControls.enabled = false;
                controls.toolControls.enabled = true;
            },


            DisableToolControls: function () {
                controls.toolControls.enabled = false;
                controls.orbitControls.enabled = true;
            },


            AddWallSegment: function(x1, z1, x2, z2) {
                var segment = {
                    startPos: new THREE.Vector3(x1, 0, z1),
                    endPos: new THREE.Vector3(x2, 0, z2)
                };
                wallSegments.push( segment );
                
                // generate mesh
                var wallGeometry = new THREE.Geometry();

                var direction = (new THREE.Vector3(x2-x1, 0, z2-z1)).normalize();
                var crossDirection = new THREE.Vector3();
                crossDirection.crossVectors(direction, new THREE.Vector3(0,1,0)).normalize().multiplyScalar(wallOptions.wallThickness);

                wallGeometry.vertices.push( segment.startPos,
                                            segment.endPos,
                                            new THREE.Vector3(segment.startPos.x, wallOptions.wallHeight, segment.startPos.z),
                                            new THREE.Vector3(segment.endPos.x, wallOptions.wallHeight, segment.endPos.z),
                                            (new THREE.Vector3(segment.startPos.x, 0, segment.startPos.z)).sub(crossDirection),
                                            (new THREE.Vector3(segment.endPos.x, 0, segment.endPos.z)).sub(crossDirection),
                                            (new THREE.Vector3(segment.startPos.x, wallOptions.wallHeight, segment.startPos.z)).sub(crossDirection),
                                            (new THREE.Vector3(segment.endPos.x, wallOptions.wallHeight, segment.endPos.z)).sub(crossDirection)
                                          );
                

                wallGeometry.faces.push( new THREE.Face3(0,1,2) );
                wallGeometry.faces.push( new THREE.Face3(2,1,3) );
                wallGeometry.faces.push( new THREE.Face3(2,7,6) );
                wallGeometry.faces.push( new THREE.Face3(2,3,7) );
                wallGeometry.faces.push( new THREE.Face3(0,2,6) );
                wallGeometry.faces.push( new THREE.Face3(0,6,4) );
                wallGeometry.faces.push( new THREE.Face3(5,7,3) );
                wallGeometry.faces.push( new THREE.Face3(5,3,1) );
                wallGeometry.faces.push( new THREE.Face3(6,5,4) );
                wallGeometry.faces.push( new THREE.Face3(6,7,5) );

                wallGeometry.computeFaceNormals();
                wallGeometry.computeVertexNormals();

                var wallMaterial =  new THREE.MeshLambertMaterial({color: 0xCC0000});
                var wallMesh = new THREE.Mesh(wallGeometry, defaultMaterial);
                scene.add(wallMesh);
            },

            ToggleActiveCamera: function () {
                if( currentCameraName === "preview" ) {
                    currentCamera = cameras.planCamera;
                    currentCameraName = "floorplan";
                } else {
                    currentCamera = cameras.previewCamera;
                    currentCameraName = "preview";
                }
            }

        }; // Return ends here

})();

