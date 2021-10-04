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
    var values = [];
    var r,g,b;
    r = (k*lowValue.red + (1-k)*highValue.red)/255;
    g = (k*lowValue.green + (1-k)*highValue.green)/255;
    b = (k*lowValue.blue + (1-k)*highValue.blue)/255;
    values.push(r);
    values.push(g);
    values.push(b);
    return values;
  }

export { XYZLoader, getminmaxhegiht, getrgb, init_highlow };
