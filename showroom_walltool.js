// Wall creation tool

Showroom.WallToolControl = function ( domElement ) {
    this._domElement = (domElement !== undefined) ? domElement : document;

    this.enabled = false;


    // private stuff
    var scope = this;


    // Tool in-world icon
    var wallIconImg = THREE.ImageUtils.loadTexture("ui/tool_inworld_wall.png");
    var wallIconMat = new THREE.SpriteMaterial( {
        map: wallIconImg,
        scaleByViewport: true,
        useScreenCoordinates: true,
        sizeAttenuation: true
    } );
    var wallIconSprite = new THREE.Sprite(wallIconMat);


    // Per-wall-segment-created data
    var wallStart = null;
    var wallLast = null;
    var wallPreview = null; // Object3d


    // events
    var wallBeginEvent = {type: 'wallbegin'};
    var wallUpdatedEvent = {type: 'wallupdated'};
    var wallEndEvent = {type: 'wallend'};


    
    this.update = function () {

        // Update position of tool icon
        wallIconSprite.position.x = wallLast.x;
        wallIconSprite.position.y = wallLast.y+3.5;
        wallIconSprite.position.z = wallLast.z;

        this.dispatchEvent(wallUpdatedEvent);
    }



    function onMouseDown(e) {

        if ( scope.enabled === false || e.which != 1) return;
        e.preventDefault();

        // 0 add tool icon in world
        Showroom.AddToScene(wallIconSprite);

        // 1 cast ray to find where you clicked in 3d space
        var point = Showroom.GetMouseWorldPosition( (e.clientX - $("canvas").offset().left),
                                                    (e.clientY - $("canvas").offset().top),
                                                     e.ctrlKey );

        if(point !== undefined)
            wallStart = point;

        // 2 save position in wallStart var
        wallLast = wallStart;
        
        // 3 setup wallPreview 3d object and add to scene
        wallPreview = Showroom.CreateDynamicWallSegment(wallStart.x, wallStart.z, wallLast.x+1, wallLast.z+1);

        // 4 Setup length indicator
        var wallLength = wallStart.distanceTo( wallLast );
        var htmlString = "<div id='wallLengthIndicator' style='background-color: black; color:white; padding: 3px; position:fixed;'></div>";
        $("body").append(htmlString);
        $("#wallLengthIndicator").html(wallLength.toFixed(2) + " m");
        $("#wallLengthIndicator").css("top", $("canvas").offset().top);
        $("#wallLengthIndicator").css("left", Math.floor( $("canvas").width()/2 - $("#wallLengthIndicator").width()/2 ));

        document.addEventListener( 'mousemove', onMouseMove, false );
        document.addEventListener( 'mouseup', onMouseUp, false );
        scope.dispatchEvent( wallBeginEvent );
    }



    function onMouseMove(e) {

        if ( scope.enabled === false || e.which != 1) return;
        e.preventDefault();

        // 1 cast ray to find current world position
        var point = Showroom.GetMouseWorldPosition( (e.clientX - $("canvas").offset().left),
                                                    (e.clientY - $("canvas").offset().top),
                                                     e.ctrlKey );
        
        if(point !== undefined) {
            wallLast = point;
            // 2 update wallPreview 3d model (already in scene)
            wallPreview.geometry.WallUpdateEnd(wallLast.x, wallLast.z);
        }

        // 3 Show wall length indicator
        var wallLength = wallStart.distanceTo( wallLast );
        $("#wallLengthIndicator").html(wallLength.toFixed(2) + " m");

        scope.update();
    }



    function onMouseUp(e) {

        if ( scope.enabled === false || e.which != 1) return;

        Showroom.RemoveFromScene(wallIconSprite);
        // 1 use Showroom.CreateStaticWallSegment(...) with wallStart and
        //   wallLast as parameters.
        Showroom.CreateStaticWallSegment( wallStart.x, wallStart.z,
                                 wallLast.x, wallLast.z );

        // 2 clear wallStart, wallLast, wallPreview
        Showroom.RemoveFromScene(wallPreview);
        wallStart = null;
        wallLast = null;
        wallPreview = null;

        // 3 clean-up length indicator
        $("#wallLengthIndicator").remove();

        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );
        scope.dispatchEvent( wallEndEvent );
    }


    // Default event listeners
    this._domElement.addEventListener( 'mousedown', onMouseDown, false );

    // *FIXME* How about touch events?
    // this._domElement.addEventListener( 'touchstart', touchstart, false );
    // this._domElement.addEventListener( 'touchend', touchend, false );
    // this._domElement.addEventListener( 'touchmove', touchmove, false );

};

Showroom.WallToolControl.prototype = Object.create( THREE.EventDispatcher.prototype );
