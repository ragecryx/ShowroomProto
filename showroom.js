
var Showroom = (function () {

        // General config
        var width = 1024; // WebGL Context Width
        var height = 576; // WebGL Context Height
        var fov = 45; // Camera Field of View
        var aspectRatio = width / height; // WebGL Context Aspect Ratio
        var near = 0.1; // Near clipping distance
        var far = 10000; // Far clipping distance


        // Three.js initialization
        var container = null; // html element that contains webgl context
        // Renderer options and initialization
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

        // Current camera initialization
        var currentCamera = cameras.previewCamera;
        var currentCameraName = "preview";

        // Scene initialization
        var scene = new THREE.Scene();

        
        // Default object(s) config/data
        //   Materials
        var defaultMaterial = new THREE.MeshLambertMaterial( {color: 0xFFFFFF} );
        var debugMaterial = new THREE.MeshLambertMaterial( {color: 0xCC0000} );


        // Floor/Grid initialization
        var worldGrid = new THREE.GridHelper(20, 1);

        // worldGrid makes a grid of lines aka can't test for intersections
        // so worldGridGeo is a (non-rendered) plane of the same size used
        // for intersection checks with the floor.
        var worldGridGeo = new THREE.Geometry();
        worldGridGeo.vertices.push(
                new THREE.Vector3(1000, 0, 1000),
                new THREE.Vector3(-1000, 0, 1000),
                new THREE.Vector3(-1000, 0, -1000),
                new THREE.Vector3(1000, 0, -1000)
            );
        worldGridGeo.faces.push( new THREE.Face3(1,0,3) );
        worldGridGeo.faces.push( new THREE.Face3(2,1,3) );
        worldGridGeo.computeFaceNormals();
        worldGridGeo.computeVertexNormals();
        // the mesh object using the above worldGridGeo geometry
        var worldGridMesh = new THREE.Mesh( worldGridGeo );


        // Wall objects config/data
        var wallOptions = {
            wallHeight: 3.05, // in meters
            wallThickness: 0.3 // in meters
        };
        var wallSegments = []; // All wall segments in the scene
        var wallSegmentsMeshes = []; // the mesh object for all the wall segments in the scene.


        // Room items *TOBEMOVED*
        var roomItems = [];


        // Controls config/data
        var controls = {
            orbitControls: null,
            toolControls: null,
            moveToolControl: null
        };
        

        // Scene Lighting
        var pointLight = null;

        
        // Private method definitions

        // Scene lights initialization function
        function SetupLighting() {
            pointLight = new THREE.PointLight(0xFFFFFF);
            pointLight.intensity = 1.1;
            pointLight.position.x = 10;
            pointLight.position.y = 50;
            pointLight.position.z = 130;
            scene.add( pointLight );
        }

        // App controls (keyboard and mouse) initialization function
        function SetupControls() {

            // Setup Orbit camera controls
            controls.orbitControls = new THREE.OrbitControls( currentCamera );
            controls.orbitControls.addEventListener( 'change', function (){
                Showroom.Render();
            } );


            // Tools controls
            controls.toolControls = new Showroom.WallToolControl( container[ 0 ] );

            controls.toolControls.addEventListener('wallupdated', function() {
                    // console.log("WallToolControl Update.")
                    Showroom.Render();
            } );


            controls.moveToolControl = new Showroom.MoveToolControl( container[ 0 ] );

            controls.moveToolControl.addEventListener('itemMove', function() {
                Showroom.Render();
            });

            controls.moveToolControl.addEventListener('itemPlace', function() {
                Showroom.Render();
            });


            // Keybpard controls (Camera swap etc.)
            $(document).keydown( function (e) {
                if(e.which == 67)
                    Showroom.ToggleActiveCamera();
                if(e.which == 90 && e.ctrlKey === true)
                    Showroom.Undo();
                // Switch camera controls or fix them
                // eg. obj._orbitControls.object = obj._currentCamera;
                    
                Showroom.Render();
            } );

            $(document).keyup( function (e) {
                // nothing yet
            } );
        }


        // Generates a wall segment to be updated regularly (used for previews etc)
        // Returned wall segment geometry object contains an extra method
        //  called WallUpdateEnd(x,z) that recalculates the end vertices of the
        //  geometry.
        function GenerateWallSegment(x1, z1, x2, z2, isDynamic) {
            var dynamic = (isDynamic !== undefined) ? isDynamic : false;
            var segment = {
                startPos: new THREE.Vector3(x1, 0, z1),
                endPos: new THREE.Vector3(x2, 0, z2)
            };
                

            // generate mesh
            var wallGeometry = new THREE.Geometry();
            wallGeometry.dynamic = dynamic;

            // find wall direction and calculate a vector perpendicular
            // to the wall and the floor plane.
            var direction = (new THREE.Vector3(x2-x1, 0, z2-z1)).normalize();
            var crossDirection = new THREE.Vector3();
            crossDirection.crossVectors(direction, new THREE.Vector3(0,1,0)).normalize().multiplyScalar(wallOptions.wallThickness);

            // create wall geometry
            wallGeometry.vertices.push( /* 0 */ segment.startPos,
                                        /* 1 */ segment.endPos,
                                        /* 2 */ new THREE.Vector3(segment.startPos.x, wallOptions.wallHeight, segment.startPos.z),
                                        /* 3 */ new THREE.Vector3(segment.endPos.x, wallOptions.wallHeight, segment.endPos.z),
                                        /* 4 */ (new THREE.Vector3(segment.startPos.x, 0, segment.startPos.z)).sub(crossDirection),
                                        /* 5 */ (new THREE.Vector3(segment.endPos.x, 0, segment.endPos.z)).sub(crossDirection),
                                        /* 6 */ (new THREE.Vector3(segment.startPos.x, wallOptions.wallHeight, segment.startPos.z)).sub(crossDirection),
                                        /* 7 */ (new THREE.Vector3(segment.endPos.x, wallOptions.wallHeight, segment.endPos.z)).sub(crossDirection)
                                      );
                
            // create wall faces
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

            // recalculate face and vertex normals
            wallGeometry.computeFaceNormals();
            wallGeometry.computeVertexNormals();

            // *FIXME* Im a programmer outlaw, I define new functions on
            // other peoples objects... so sue me...
            if(dynamic === true) {
                wallGeometry.WallUpdateEnd = function (x, z) {
                    // This function recalculates the ending point of the wall.
                    // Used by preview geometry during mouse move.
                    var direction = (new THREE.Vector3(x-this.vertices[0].x, 0, z-this.vertices[0].z)).normalize();
                    var crossDirection = new THREE.Vector3();
                    crossDirection.crossVectors(direction, new THREE.Vector3(0,1,0)).normalize().multiplyScalar(wallOptions.wallThickness);

                    this.vertices[1].x = x;
                    this.vertices[1].z = z;

                    this.vertices[3].x = x;
                    this.vertices[3].z = z;

                    this.vertices[4] = (new THREE.Vector3(this.vertices[0].x, 0, this.vertices[0].z)).sub(crossDirection);
                    this.vertices[5] = (new THREE.Vector3(x, 0, z)).sub(crossDirection);
                    this.vertices[6] = (new THREE.Vector3(this.vertices[0].x, wallOptions.wallHeight, this.vertices[0].z)).sub(crossDirection);
                    this.vertices[7] = (new THREE.Vector3(x, wallOptions.wallHeight, z)).sub(crossDirection);
                
                    this.verticesNeedUpdate = true;
                    this.normalsNeedUpdate = true;
                };
            }

            return wallGeometry;
        }

        // Private data and methods definition end here
        // =====================================================================
        // Public method definitions start here

        return {
            Initialize: function () {
                container = $("#ShowroomApp");
                scene.add( worldGrid );
                scene.add( currentCamera );

                SetupControls();
                SetupLighting();

                // initial camera position/rotation
                cameras.previewCamera.position.y = 1.8;
                cameras.previewCamera.position.x = 2;
                cameras.previewCamera.position.z = 20;
                cameras.planCamera.position.y = 100;
                cameras.planCamera.lookAt( new THREE.Vector3(0, 0, 0) );

                renderer.setSize( width, height );
                renderer.setClearColor( 0xf0f0f0 );
                container.html( renderer.domElement );
            },

            // Triggers a render of the scene
            Render: function () {
                renderer.render( scene, currentCamera );
            },


            // Enables the move object tool
            // *FIXME* Needs to be more generic and support more tools
            EnableMoveTool: function () {
                controls.orbitControls.enabled = false;
                controls.toolControls.enabled = false;
                controls.moveToolControl.enabled = true;
            },


            // Disables camera control and hands it over to the tool
            // *FIXME* Needs to be more generic and support more tools
            EnableToolControls: function () {
                controls.orbitControls.enabled = false;
                controls.moveToolControl.enabled = false;
                controls.toolControls.enabled = true;
            },


            // Disables tools control and hands it over to the camera
            // *FIXME* Needs to be more generic and support more tools
            DisableToolControls: function () {
                controls.toolControls.enabled = false;
                controls.moveToolControl.enabled = false;
                controls.orbitControls.enabled = true;
            },


            // Removes last wall added
            // *FIXME* If the app needs a real undo/redo system this needs remake
            Undo: function() {
                scene.remove(wallSegmentsMeshes.pop());
            },


            // The public method that generates a preview wall segment (dynamic geometry)
            // Uses GenerateWallSegment to create the geometry 
            CreateDynamicWallSegment: function (x1, z1, x2, z2) {
                var wallMaterial =  new THREE.MeshLambertMaterial({color: 0xCC0000});
                var wallMesh = new THREE.Mesh(GenerateWallSegment(x1,z1,x2,z2,true), defaultMaterial);
                scene.add(wallMesh);
                return wallMesh;
            },


            // Adds a fixed wall segment (its geometry is not meant to change)
            CreateStaticWallSegment: function (x1, z1, x2, z2) {
                var wallMaterial =  new THREE.MeshLambertMaterial({color: 0xCC0000});
                var wallMesh = new THREE.Mesh(GenerateWallSegment(x1,z1,x2,z2,false), defaultMaterial);
                scene.add(wallMesh);
                wallSegmentsMeshes.push(wallMesh);
            },


            // Loads a 3d item and adds it to
            // the current scene.
            AddItem: function (objpath) {
                var loader = new THREE.JSONLoader();
                loader.load(objpath, function(geom) {
                    var objMesh = new THREE.Mesh(geom, defaultMaterial);
                    roomItems.push(objMesh);
                    scene.add(objMesh);
                    Showroom.Render();
                });
            },


            GetActiveCamera: function () {
                return currentCamera;
            },


            // Toggles between preview (perspective) camera and
            // floorplan (top, orthographic) camera
            ToggleActiveCamera: function () {
                if( currentCameraName === "preview" ) {
                    currentCamera = cameras.planCamera;
                    currentCameraName = "floorplan";
                } else {
                    currentCamera = cameras.previewCamera;
                    currentCameraName = "preview";
                }
            },


            GetWidthAndHeight: function () {
                return {w: width, h: height};
            },


            // Throws a ray from the point clicked and
            // returns the world position of the intersection
            // point with the floor.
            GetMouseWorldPosition: function (mouseX, mouseY, snap) {
                var snapToGrid = (snap !== undefined) ? snap : false;
                var projector = new THREE.Projector();
                var x = 2 * (mouseX / width) - 1,
                    y = 1 - 2 * (mouseY / height); // mouse x and y coords
                var pickingRay = projector.pickingRay( new THREE.Vector3(x, y, 0), currentCamera );
                var points = pickingRay.intersectObject(worldGridMesh, false);
                if (snapToGrid) {
                    points[0].point.x = Math.round(points[0].point.x);
                    points[0].point.z = Math.round(points[0].point.z);
                }
                return points[0].point; // .distance, .face, .object etc
            },


            // Throws a ray from the point clicked and
            // returns the object that intersects it (excluding walls).
            GetItemUnderMouse: function (mouseX, mouseY) {
                var projector = new THREE.Projector();
                var x = 2 * (mouseX / width) - 1,
                    y = 1 - 2 * (mouseY / height); // mouse x and y coords
                var pickingRay = projector.pickingRay( new THREE.Vector3(x, y, 0), currentCamera );

                // spits a hideous error, please fix it purogurammeru-sama
                return (pickingRay.intersectObjects(roomItems, false))[0].object;
            },


            // Adds an object to the scene and triggers a render
            AddToScene: function (item) {
                scene.add(item);
                Showroom.Render();
            },


            // Removes an object from the scene and triggers a render
            RemoveFromScene: function (item) {
                scene.remove(item);
                Showroom.Render();
            },


            // Removes all objects from the scene and triggers a render
            ClearScene: function () {
                var i;
                while( (i = wallSegmentsMeshes.pop()) !== undefined ) {
                    scene.remove(i);
                }
                wallSegments = [];
                wallSegmentsMeshes = [];
                Showroom.Render();
            }

        }; // Public part returns here, assigned on var Showroom.

})();

