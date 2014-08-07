
Showroom.WallToolControl = function(domElement) {
	this._domElement = (domElement !== undefined) ? domElement : document;

	this.enabled = false;

	// private stuff
	var scope = this;

	// ephemeral data
	this.__startPos = null;
	this.__endPos = null;
	this.__temp3dObject = null;

	// events
	var wallBeginEvent = {type: 'wallbegin'};
	var wallUpdatedEvent = {type: 'wallupdated'};
	var wallEndEvent = {type: 'wallend'};

	this.update = function () {

		this.dispatchEvent(wallUpdatedEvent);
	}

	function onMouseDown(e) {

		if ( scope.enabled === false ) return;
		e.preventDefault();

		console.log("Wall Tool MOUSE DOWN");

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( wallBeginEvent );
	}

	function onMouseMove(e) {

		if ( scope.enabled === false ) return;
		e.preventDefault();

		console.log("Wall Tool MOUSE MOVE");

		scope.update();
	}

	function onMouseUp(e) {

		if ( scope.enabled === false ) return;

		console.log("Wall Tool MOUSE UP");

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( wallEndEvent );
	}


	this._domElement.addEventListener( 'mousedown', onMouseDown, false );
	// touch?
	// this._domElement.addEventListener( 'touchstart', touchstart, false );
	// this._domElement.addEventListener( 'touchend', touchend, false );
	// this._domElement.addEventListener( 'touchmove', touchmove, false );

};

Showroom.WallToolControl.prototype = Object.create( THREE.EventDispatcher.prototype );
