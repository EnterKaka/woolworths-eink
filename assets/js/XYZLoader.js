import {
	BufferGeometry,
	FileLoader,
	Float32BufferAttribute,
	Loader
} from './three.module.js';

var highValue, lowValue;

//This function is setting function that set global min and max color map.
function init_highlow(){
	highValue = {red: 255, green:0, blue:0};
	lowValue = {red: 0, green:0, blue:255};
}

class XYZLoader extends Loader {

	highValue = {red: 255, green:255, blue:0};
	lowValue = {red: 0, green:204, blue:255};

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		const loader = new FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );
		loader.load( url, function ( text ) {

			try {

				onLoad( scope.parse( text ) );

			} catch ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		}, onProgress, onError );

	}

	parse( text ) {

		const lines = text.split( '\n' );

		const vertices = [];
		const colors = [];

		var values = getminmaxhegiht(lines);
    	var min = values[0];
    	var max = values[1];

		for ( let line of lines ) {

			line = line.trim();

			if ( line.charAt( 0 ) === '#' ) continue; // skip comments

			const lineValues = line.split( /\s+/ );

			if ( lineValues.length === 3 ) {

				// XYZ

				vertices.push( parseFloat( lineValues[ 0 ] ) );
				vertices.push( parseFloat( lineValues[ 1 ] ) );
				vertices.push( parseFloat( lineValues[ 2 ] ) );

				//set color from xyz
				let zvalue = parseFloat( lineValues[ 2 ] );
      			//set rgb from xyz
      			let k=(zvalue - min)/(max - min);
      			let rgb = getrgb(k);
				//set color from xyz
				colors.push(rgb[0]);
				colors.push(rgb[1]);
				colors.push(rgb[2]);
			}
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

		if ( colors.length > 0 ) {

			geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		}

		return geometry;

	}

}

function getminmaxhegiht(lines){
    var min=Infinity, max=-Infinity, values=[];
    let zvalue;
    for ( let line of lines ) {
      line = line.trim();
      if ( line.charAt( 0 ) === '#' ) continue; // skip comments
      var lineValues = line.split( /\s+/ );
      if ( lineValues.length === 3 ) {
        zvalue = parseFloat(lineValues[2]);
        if( min>zvalue){
          min=zvalue;
        }
        if(max<zvalue){
          max=zvalue;
        }
      }
    }
    values.push(min);
    values.push(max);
    return values;
  }

  function getrgb(k){
	k = ( k) * 0.7;
	let rgb = hsvToRgb(k,1,1);
    return rgb;
  }

  function hsvToRgb(h, s, v) {
	var r, g, b;
  
	var i = Math.floor(h * 6);
	var f = h * 6 - i;
	var p = v * (1 - s);
	var q = v * (1 - f * s);
	var t = v * (1 - (1 - f) * s);
  
	switch (i % 6) {
	  case 0: r = v, g = t, b = p; break;
	  case 1: r = q, g = v, b = p; break;
	  case 2: r = p, g = v, b = t; break;
	  case 3: r = p, g = q, b = v; break;
	  case 4: r = t, g = p, b = v; break;
	  case 5: r = v, g = p, b = q; break;
	}
  
	return [ r, g , b ];
  }

export { XYZLoader, getminmaxhegiht, getrgb, init_highlow };
