var map;


class Map {

   constructor () {
      this.texture = new THREE.TextureLoader().load(
            'three.js/examples/textures/minecraft/atlas.png' );
      this.texture.magFilter = THREE.NearestFilter;
      this.data = this.generateHeights( worldWidth, worldDepth );

      this.matrix = new THREE.Matrix4();
      this.geometries = [];
      this.geometry = this.initializeGeometry();
      this.mesh = new THREE.Mesh( this.geometry, new THREE.MeshLambertMaterial(
                { map: this.texture, side: THREE.DoubleSide } ) );
   }

   initializeGeometry () {
      /*
       * Currently initializes positive x, y, z face geometry for a rectangular
       * prism.
       */
      var pxGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
      pxGeometry.attributes.uv.array[ 1 ] = 0.5;
      pxGeometry.attributes.uv.array[ 3 ] = 0.5;
      pxGeometry.rotateY( Math.PI / 2 );
      pxGeometry.translate( 50, 0, 0 );

      var nxGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
      nxGeometry.attributes.uv.array[ 1 ] = 0.5;
      nxGeometry.attributes.uv.array[ 3 ] = 0.5;
      nxGeometry.rotateY( - Math.PI / 2 );
      nxGeometry.translate( - 50, 0, 0 );

      var pyGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
      pyGeometry.attributes.uv.array[ 5 ] = 0.5;
      pyGeometry.attributes.uv.array[ 7 ] = 0.5;
      pyGeometry.rotateX( - Math.PI / 2 );
      pyGeometry.translate( 0, 50, 0 );

      var pzGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
      pzGeometry.attributes.uv.array[ 1 ] = 0.5;
      pzGeometry.attributes.uv.array[ 3 ] = 0.5;
      pzGeometry.translate( 0, 0, 50 );

      var nzGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
      nzGeometry.attributes.uv.array[ 1 ] = 0.5;
      nzGeometry.attributes.uv.array[ 3 ] = 0.5;
      nzGeometry.rotateY( Math.PI );
      nzGeometry.translate( 0, 0, - 50 );


      for ( var z = 0; z < worldDepth; z ++ ) {
         for ( var x = 0; x < worldWidth; x ++ ) {

            var h = this.getY( x, z );

            this.matrix.makeTranslation(
               x * 100,
               h * 100,
               z * 100,
            );

            var px = this.getY( x + 1, z );
            var nx = this.getY( x - 1, z );
            var pz = this.getY( x, z + 1 );
            var nz = this.getY( x, z - 1 );

            this.addGeometry(pyGeometry.clone());

            // if x plane is below height or 0
            if ( isBelowHeight(px, h) || x === 0 ) {
               this.addGeometry(pxGeometry.clone());
            }

            // if neg x plane is below height or at the edge
            if ( isBelowHeight(nx, h) || x === worldWidth - 1 ) {
               this.addGeometry(nxGeometry.clone());
            }

            if ( isBelowHeight(pz, h) || z === worldDepth - 1 ) {
               this.addGeometry(pzGeometry.clone());
            }

            if ( isBelowHeight(nz, h) || z === 0 ) {
               this.addGeometry(nzGeometry.clone());
            }
         }
      }
      var geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
            this.geometries );
      geometry.computeBoundingSphere();
      geometry.computeFaceNormals();
      return geometry;
   }

   addGeometry( element ) {
      this.geometries.push(element.applyMatrix( this.matrix) );
   }

   getMapMesh() {
      return this.mesh;
   }

   generateHeights( width, height ) {
      var perlin = new ImprovedNoise();

      var data = [];
      var quality = 2;
      var z = Math.random() * 100;

      for ( var i = 0; i < height; i ++ ) {
         var row = [];
         for ( var j = 0; j < width; j++ ) {
            row[j] = Math.max(0, Math.ceil(perlin.noise(i, j, z) * 10));
         }
         data[i] = row;
      }
      return data;
   }

   getY( x, z ) {
      x = Math.min(Math.max(0, x), worldWidth-1);
      z = Math.min(Math.max(0, z), worldDepth-1);
      return this.data[x][z] * 0.2;

   }
}


function getY( x, z ) {
   return map.getY( x, z );

}

function isBelowHeight( x, h ) {

   return x !== h && x !== h + 1;

}

function getMapMesh() {

  return map.getMapMesh();

}

function init() {

   map = new Map();

}

init();

