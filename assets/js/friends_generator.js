  // Adapted from https://observablehq.com/@tarte0/generate-random-simple-polygon

$(document).ready(function() {generateGroup();});

function downloadCanvas(){
  var c = document.getElementById("polygon_canvas");
  var image = c.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
  var link = document.getElementById("download_button");
  link.download = "friend.png";
  link.href = image;
}

function intersects(a,b,c,d,p,q,r,s) {
  // from Dan Fox: https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
  // returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};

function isPointInside(targetPoint, polygonPoints){
  // trace line from point to edge of image
  // check intersection with every line segment in points
  // count the intersections, return true if odd, false if even
  // https://en.wikipedia.org/wiki/Point_in_polygon
  var count = 0;
  for(var i = 0; i < polygonPoints.length; i++){
    var intersection;
    if(i == polygonPoints.length-1){
      intersection = intersects(targetPoint[0], targetPoint[1], 0, 0, polygonPoints[i][0], polygonPoints[i][1], polygonPoints[0][0], polygonPoints[0][1]);
    }
    else{
      intersection = intersects(targetPoint[0], targetPoint[1], 0, 0, polygonPoints[i][0], polygonPoints[i][1], polygonPoints[i+1][0], polygonPoints[i+1][1]);
    }
    if(intersection == true){
      count++;
    }
  }
  if(count%2 == 0){
    return false;
  }
  else{
    return true;
  }
}

randomPoints = (n, width, height, xOffset, yOffset) => {
  const points = [];
  for(let i=0; i<n; i++){
   var x = Math.random() * (width) + xOffset;
   var y = Math.random() * (height) + yOffset;
   points.push([x, y])
  }
  return points;
}

getRightmostPoint = (points) => {
  var right = 0;
  for(let i=1; i<points.length; i++){
    if(points[i][0] > points[right][0]){
      right = i;
    }
  }
  return right;
}

getBottomPoint = (points) => {
  var bottom = 0;
  for(let i=1; i<points.length; i++){
    if(points[i][1] > points[bottom][1]){
      bottom = i;
    }
  }
  return bottom;
}

getTopPoint = (points) => {
  var top = 0;
  for(let i=1; i<points.length; i++){
    if(points[i][1] < points[top][1]){
      top = i;
    }
  }
  return top;
}

getLeftmostPoint = (points) => {
  var left = 0;
  for(let i=1; i<points.length; i++){
    if(points[i][0] < points[left][0]){
      left = i;
    }
  }
  return left;
}

sortedPoints = (points, width, height, xOffset, yOffset) => {
  var x = width/2 + xOffset;
  var y = height/2 + yOffset;
  const centerPoint = [x,y];
  const sorted = points.slice(0);
  let angleFromCenter;

  const sortByAngle = (p1, p2) => {
    return Math.atan2(p1[1] - centerPoint[1], p1[0] - centerPoint[0]) * 180 / Math.PI -
      Math.atan2(p2[1] - centerPoint[1], p2[0] - centerPoint[0]) * 180 / Math.PI;
  }

  sorted.sort(sortByAngle);
  return sorted;
}

function generateGroup(){
  var c = document.getElementById("polygon_canvas");
  var ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  generateShape(12, 300, 300, 5, 10);
}

function generateShape(numPoints, width, height, xOffset, yOffset){
  var c = document.getElementById("polygon_canvas");
  var ctx = c.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 10;
  var points = randomPoints(numPoints, width, height, xOffset, yOffset);
  var sorted = sortedPoints(points, width, height, xOffset, yOffset);
  // used to calculate polygon center
  var right = getRightmostPoint(sorted);
  var bottom = getBottomPoint(sorted);
  var top = getTopPoint(sorted);
  var left = getLeftmostPoint(sorted);
  var centerPolyX = (sorted[right][0] + sorted[left][0])/2;
  var centerPolyY = (sorted[bottom][1] + sorted[top][1])/2;
  // offsets put polygon in center of canvas, regardless of size
  var centerOffsetX = (c.width/2 - centerPolyX);
  var centerOffsetY = (c.height/2 - centerPolyY);
  var adjacent;
  if(right == 0){
    adjacent = sorted.length - 1;
  }
  else{
    adjacent = right - 1;
  }
  ctx.beginPath();
  ctx.moveTo(sorted[0][0], sorted[0][1]);
  for(var i = 0; i < sorted.length; i++){
    ctx.lineTo(sorted[i][0]+centerOffsetX,sorted[i][1]+centerOffsetY);
  }
  ctx.closePath();
  // adapted from andreabreu's contribution: https://gist.github.com/mucar/3898821
  // original fails when the generated color has a leading zero, added a fix below
  var color = (Math.random()*0xFFFFFF<<0).toString(16);
  while(color.length < 6){
    color = '0' + color;
  }
  color = '#' + color;
  ctx.fillStyle = color;
  ctx.stroke();
  ctx.fill();

  ctx.beginPath();
  var newPoint = [sorted[right][0]-100, sorted[right][1]+20];
  var direction = 1;
  // check is the position for the second eye is inside the polygon. If not, scan downwards for a valid position. If none is found inside the canvas bounds, search upwards
  // note: fails for polygons where jumping 20 pixels dodges all valid positions. Should be made adjustable for arbitrary sized (small) polygons
  while(isPointInside(newPoint, sorted) == false){
    var c = document.getElementById("polygon_canvas");
    if(newPoint[1]+(20 * direction) > height){
      direction = -1;
    }
    newPoint[1] = newPoint[1]+(20 * direction);

  }

  // right eye is drawn at rightmost vertex
  ctx.beginPath();
  ctx.arc(sorted[right][0]+centerOffsetX, sorted[right][1]+centerOffsetY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath()
  ctx.arc(sorted[right][0]+centerOffsetX-2, sorted[right][1]+centerOffsetY-2, 4, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath()
  ctx.arc(newPoint[0]+centerOffsetX, newPoint[1]+centerOffsetY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath()
  ctx.arc(newPoint[0]+centerOffsetX-2, newPoint[1]+centerOffsetY-2, 4, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

}
