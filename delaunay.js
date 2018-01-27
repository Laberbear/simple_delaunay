/*
    Provides a class to create a valid Delaunay Triangulation
    Author: Laberbear, unless otherwise stated
*/

var mainCanvas = document.getElementById("myCanvas");
var mainContext = mainCanvas.getContext('2d');
 
var canvasWidth = mainCanvas.width;
var canvasHeight = mainCanvas.height;
mainCanvas.width = window.innerWidth
mainCanvas.height = window.innerHeight

class Delaunay {
    constructor(points, canvasWidth){
        //Add super triangle points to the point array
        this.points = [];


        this.points.push({x: canvasWidth / 2,y: -150000});
        this.points.push({x: -100000,y: 60000});
        this.points.push({x: canvasWidth + 100000,y: 60000});

        this.points.push.apply(this.points, points)

        //Create super triangle
        this.triangles = [[0,1,2]];

        this.calcTriangulation()
    }
    calcTriangulation() {
        //First generate points
        //Create Super Triangle
        //Generate basic triangulation
        //Flip edges that are illegal on each triangle

        console.log("Starting Delaunay Triangulation, with", this.points);

        // Iterate through array, adding new points
        for(var i=3;i<this.points.length;i++){
            //For each point, iterate throgh the triangles list
            for(var j=0;j<this.triangles.length;j++){
                var p0 = this.points[this.triangles[j][0]]
                var p1 = this.points[this.triangles[j][1]]
                var p2 = this.points[this.triangles[j][2]]
                if (ptInTriangle(this.points[i], p0,p1,p2)){
                    const newTris = [];                
                    newTris.push([i, this.triangles[j][0], this.triangles[j][1]])
                    newTris.push([i, this.triangles[j][1], this.triangles[j][2]])
                    newTris.push([i, this.triangles[j][0], this.triangles[j][2]])
                    
                    this.triangles.splice(j, 1);
                    //Flip illegal edges

                    for(var k=newTris.length - 1;k>=0;k--){
                        this.addNewTriangle(newTris[k]);
                    }
                    break;
                }
                if(j == this.triangles.length - 1){
                    console.log("THIS POINT SHOULDNT BE REACHED; POINT IS IN NO TRI")
                }
            }
        }

        // Remove all remaining triangles that share a point of the super triangle
        for(var i=this.triangles.length - 1;i>= 0;i--){
            if (this.triangles[i].indexOf(0) != -1 || this.triangles[i].indexOf(1) != -1|| this.triangles[i].indexOf(2) != -1){
                this.triangles.splice(i, 1);
            }
        }
    }

    addNewTriangle(newTri){
        const x = this.flipCheck(newTri);
        if(x !== false){
            this.flipEdge(x);
        } else {
            this.pushToTriangles(newTri);
        }
    }
    pushToTriangles(newTri){
        this.triangles.push(newTri);
    }

    flipEdge(flipData) {
        const newPoint = flipData[0]
        const vertex0 = flipData[1]
        const vertex1 = flipData[2]
        const flipPoint = flipData[3]
        const opposedTriIndex = flipData[4];
        
        //flip edges
        this.triangles.splice(opposedTriIndex, 1);

        this.addNewTriangle([newPoint, flipPoint, vertex1])
        this.addNewTriangle([flipPoint, newPoint, vertex0]);
    }

    flipCheck(tri){
        let flipData = this.flipCheckSide(tri);
        if(flipData){
            return flipData
        }
        flipData = this.flipCheckSide([tri[0], tri[2], tri[1]]);
        if(flipData){
            return flipData
        }
        flipData = this.flipCheckSide([tri[1], tri[2], tri[0]]);
        if(flipData){
            return flipData
        }
        return false;
    }

    flipCheckSide(currentTri){
        const p0 = this.points[currentTri[0]];
        const p1 = this.points[currentTri[1]];
        const p2 = this.points[currentTri[2]];
        const circumcircle = calc_circumcircle(p0,p1,p2);
        
        //0 is always the new point so 1 and 2 are always the nodes that we search for
        //edge flip check
        let nearestQuad = undefined;
        let nearestQuadDist = undefined;
        let nearestOtherTriIndex = undefined;
        for(var l=0;l<this.triangles.length;l++){
            if(this.triangles[l].indexOf(currentTri[1]) != -1 && this.triangles[l].indexOf(currentTri[2]) != -1){
                let other_tri_shared_p1 = this.triangles[l].indexOf(currentTri[1])
                let other_tri_shared_p2 = this.triangles[l].indexOf(currentTri[2])
                var flip_point_index = undefined;
                if (other_tri_shared_p1 == 0){
                        if (other_tri_shared_p2 == 1){
                        flip_point_index = this.triangles[l][2]
                    } else {
                        flip_point_index = this.triangles[l][1]
                    }
                } else if (other_tri_shared_p1 == 1){
                    if (other_tri_shared_p2 == 0){
                        flip_point_index = this.triangles[l][2]
                    } else {
                        flip_point_index = this.triangles[l][0]
                    }
                } else {
                    if (other_tri_shared_p2 == 0){
                        flip_point_index = this.triangles[l][1]
                    } else {
                        flip_point_index = this.triangles[l][0]
                    }
                }

                const dist = calc_point_distance(circumcircle, this.points[flip_point_index]);
                if(!isPolygonConvex([p0,p1,this.points[flip_point_index], p2,p0])){
//                   concaveQuads.push([p0,p1,this.points[flip_point_index], p2,p0]);
                } else {
                    // && (dist < calc_point_distance(circumcircle, this.points[currentTri[1]]) && dist < calc_point_distance(circumcircle, this.points[currentTri[2]]))
                    if (dist < circumcircle.r){
                        //this edge could be flipped, but lets see if there is a closer one
                        if(nearestQuadDist !== undefined){
                            if(dist < nearestQuadDist){
                                nearestQuadDist = dist;
                                nearestQuad = [flip_point_index, currentTri[0], currentTri[1], currentTri[2]];
                                nearestOtherTriIndex = l;
                            }
                        } else {
                            nearestQuadDist = dist;
                            nearestQuad = [flip_point_index, currentTri[0], currentTri[1], currentTri[2]];
                            nearestOtherTriIndex = l;
                        }
                    }
                }
            }
        }
        if(nearestQuad !== undefined){ 
            return [currentTri[0], currentTri[1], currentTri[2], flip_point_index, nearestOtherTriIndex];
        } else {
            return false
        }
    }

    getTrianglesWithPointIndex(){
        return this.triangles;
    }
    getTrianglesWithPosition(){
        let triangleCoords = [];
        for(let i=0;i<this.triangles.length;i++){
            triangleCoords.push([]);
            for(let j=0;j<3;j++){
                triangleCoords[i].push(this.points[this.triangles[i][j]])
            }
        }
        return triangleCoords
    }
}


function test_delaunay(result, pointArray, canvasWidth){
    let bgDelaunay = new Delaunay(pointArray, canvasWidth);
    if (JSON.stringify(bgDelaunay.getTrianglesWithPosition()) == JSON.stringify(result)) {
        console.log("Algorithm is stable!");
    } else {
        for(var i=0;i<bgDelaunay.triangles.length;i++){
            for(var j=0;j<3;j++){
                if(bgDelaunay.triangles[i][j].x != result[i][j].x || bgDelaunay.triangles[i][j].y != result[i][j].y){
                    console.log("Different values found", i, result[i][j], bgDelaunay.triangles[i][j])
                    console.log(JSON.stringify(bgDelaunay.triangles));
                    console.log(result);
                    console.log("Unstable Algorithm, check changes!");
                    throw DOMException();
                }
            }
        }
    }
}

function resultTest() {
    test_delaunay(testCase0.triangles, testCase0.points, testCase0.width);
    test_delaunay(testCase1.triangles, testCase1.points, testCase1.width);
}

resultTest();



/*
    Helper functions for various tasks
    for full source and copyright see their respective sources
*/


//src: http://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle#comment22628102_2049712
function ptInTriangle(p, p0, p1, p2) {
    var A = 1/2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;
    
    return s >= 0 && t > 0 && (s + t) <= 2 * A * sign;
    // i made a little change: the return was this before
    // return s >= 0 && t > 0 && (s + t) <= 2 * A * sign;
    // in hope to get a valid result when a triangle is on the line
}


//src: https://gist.github.com/mutoo/5617691
function calc_circumcircle(a, b, c) {
  this.a = a
  this.b = b
  this.c = c

  var A = b.x - a.x,
      B = b.y - a.y,
      C = c.x - a.x,
      D = c.y - a.y,
      E = A * (a.x + b.x) + B * (a.y + b.y),
      F = C * (a.x + c.x) + D * (a.y + c.y),
      G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)),
      minx, miny, dx, dy

  /* If the points of the triangle are collinear, then just find the
   * extremes and use the midpoint as the center of the circumcircle. */
  if(Math.abs(G) < 0.000001) {
    minx = Math.min(a.x, b.x, c.x)
    miny = Math.min(a.y, b.y, c.y)
    dx   = (Math.max(a.x, b.x, c.x) - minx) * 0.5
    dy   = (Math.max(a.y, b.y, c.y) - miny) * 0.5

    this.x = minx + dx
    this.y = miny + dy
    this.r = Math.sqrt(dx * dx + dy * dy)
  }

  else {
    this.x = (D*E - B*F) / G
    this.y = (A*F - C*E) / G
    dx = this.x - a.x
    dy = this.y - a.y
    this.r = Math.sqrt(dx * dx + dy * dy)
  }
  return {
      x: this.x,
      y: this.y,
      r: this.r
  }
}


//src: https://gist.github.com/annatomka/82715127b74473859054
function calculateAllCrossProduct(points) {
    var lastSign = null;

    for (var i = 2; i < points.length; i++) {
        //calculate crossproduct from 3 consecutive points
        var crossproduct = calculateCrossProduct(points[i - 2], points[i - 1], points[i]);
		//console.log(i + ". crossproduct from ("+ points[i - 2].x +" "+points[i - 1].x +" "+points[i].x +"): " + crossproduct);
        var currentSign = Math.sign(crossproduct);
        if (lastSign == null) {
        	//last sign init
        	lastSign = currentSign;
	}

        //console.log("Last sign: " + lastSign + " current sign: "+currentSign);
        
        var checkResult = checkCrossProductSign(lastSign, currentSign);
        if (checkResult == false) {
            //different sign in cross products,no need to check the remaining points --> concave polygon --> return function
            return false;
        }
        lastSign = currentSign;
    }

    //first point must check between second and last point, this is the last 3 points that can break convexity
    var crossproductFirstPoint = calculateCrossProduct(points[points.length - 2], points[0], points[1]);
    
    //console.log("cross product first point: ", crossproductFirstPoint);
    
    return checkCrossProductSign(lastSign, Math.sign(crossproductFirstPoint));
}

function checkCrossProductSign(lastSign, newSign) {
    if (lastSign !== newSign) {
        //checked sign differs from the previous one --> concave polygon
        return false;
    }
    return true;
}

function calculateCrossProduct(p1, p2, p3) {
    var dx1 = p2.x - p1.x;
    var dy1 = p2.y - p1.y;
    var dx2 = p3.x - p2.x;
    var dy2 = p3.y - p2.y;

    var zcrossproduct = dx1 * dy2 - dy1 * dx2;
    return zcrossproduct;
}

function isPolygonConvex(points) {    
    return calculateAllCrossProduct(points);
}

function calc_point_distance(p1,p2){
    xDist = p1.x - p2.x;
    yDist = p1.y - p2.y;
    dist = Math.sqrt(yDist * yDist + xDist * xDist);
    return dist;
}