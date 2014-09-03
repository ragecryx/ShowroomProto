// Wall creation tool

Showroom.MoveToolControl = function ( domElement ) {
    this._domElement = (domElement !== undefined) ? domElement : document;

    this.enabled = false;


    // private stuff
    var scope = this;


    // Item data
    var itemObject3d = null;
    var itemPosFirst = null;
    var itemPosLast = null;
    var itemPreview = null; // Object3d


    // events
    var itemMoveEvent = {type: 'itemMove'};
    var itemPlaceEvent = {type: 'itemPlace'};


    
    this.update = function () {
        this.dispatchEvent(itemMoveEvent);
    }



    function onMouseDown(e) {

        if ( scope.enabled === false || e.which != 1) return;
        e.preventDefault();

        // 1 cast ray to find the object you clicked in 3d space
        itemObject3d = Showroom.GetItemUnderMouse( (e.clientX - $("canvas").offset().left),
                                                (e.clientY - $("canvas").offset().top) );

        if(itemObject3d !== null)
            itemPosFirst = itemObject3d.position;

        document.addEventListener( 'mousemove', onMouseMove, false );
        document.addEventListener( 'mouseup', onMouseUp, false );
        scope.dispatchEvent( itemMove );
    }



    function onMouseMove(e) {

        if ( scope.enabled === false || e.which != 1) return;
        e.preventDefault();

        // 1 cast ray to find current world position
        var point = Showroom.GetMouseWorldPosition( (e.clientX - $("canvas").offset().left),
                                                    (e.clientY - $("canvas").offset().top),
                                                     e.ctrlKey );
        
        if(point !== undefined) {
            itemObject3d.position = point;
        }

        scope.update();
    }



    function onMouseUp(e) {

        if ( scope.enabled === false || e.which != 1) return;

        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );
        scope.dispatchEvent( itemPlaceEvent );
    }


    // Default event listeners
    this._domElement.addEventListener( 'mousedown', onMouseDown, false );

    // *FIXME* How about touch events?
    // this._domElement.addEventListener( 'touchstart', touchstart, false );
    // this._domElement.addEventListener( 'touchend', touchend, false );
    // this._domElement.addEventListener( 'touchmove', touchmove, false );

};

Showroom.MoveToolControl.prototype = Object.create( THREE.EventDispatcher.prototype );
