SOURCE_IMAGE = 'test.jpg';
SOURCE_WIDTH = 463;
SOURCE_HEIGHT = 399;

/** 
 * Creates the canvases to hold the source and result images.
 */
function createCanvases() {
  const sourceContainer = document.getElementById('source-container');
  const resultContainer = document.getElementById('result-container');
  const sourceCanvas = document.createElement('canvas');
  const resultCanvas = document.createElement('canvas');
  sourceCanvas.id = 'source-canvas';
  resultCanvas.id = 'result-canvas';
  sourceCanvas.width = SOURCE_WIDTH;
  sourceCanvas.height = SOURCE_HEIGHT;
  resultCanvas.width = SOURCE_WIDTH;
  resultCanvas.height = SOURCE_HEIGHT;
  sourceContainer.appendChild(sourceCanvas);
  resultContainer.appendChild(resultCanvas);
}

function loadSourceImage(image) {
  const sourceImage = new Image();
  sourceImage.src = image;
  sourceImage.onload = () => {

    // Draw the source image on the source canvas.
    // TODO(dugb) Move this somewhere more appropriate.
    const sourceCanvas = document.getElementById('source-canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(sourceImage, 0, 0);

    // Get the pixels from the source.
    const pixels = sourceCtx.getImageData(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);

    // Convert the pixels to greyscale.
    const greyscalePixels = grayscale(pixels);

    // Put the greyscale pixels on the results canvas.
    const resultCanvas = document.getElementById('result-canvas');
    const resultCtx = resultCanvas.getContext('2d');
    id = resultCtx.createImageData(SOURCE_WIDTH, SOURCE_HEIGHT);

    const vertical = convoluteFloat32(greyscalePixels,
      [-1, -2, -1,
        0, 0, 0,
        1, 2, 1]);
    const horizontal = convoluteFloat32(greyscalePixels,
      [-1, 0, 1,
      -2, 0, 2,
      -1, 0, 1]);

    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.abs(vertical.data[i]);
      id.data[i] = v;
      const h = Math.abs(horizontal.data[i]);
      id.data[i + 1] = h;
      id.data[i + 2] = (v + h) / 4;
      id.data[i + 3] = 255;
    }

    resultCtx.putImageData(id, 0, 0);
  }
}

function convoluteFloat32(pixels, weights, opaque) {
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side / 2);

  var src = pixels.data;
  var sw = pixels.width;
  var sh = pixels.height;

  var w = sw;
  var h = sh;
  var output = {
    width: w, height: h, data: new Float32Array(w * h * 4)
  };
  var dst = output.data;

  var alphaFac = opaque ? 1 : 0;

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var sy = y;
      var sx = x;
      var dstOff = (y * w + x) * 4;
      var r = 0, g = 0, b = 0, a = 0;
      for (var cy = 0; cy < side; cy++) {
        for (var cx = 0; cx < side; cx++) {
          var scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
          var scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
          var srcOff = (scy * sw + scx) * 4;
          var wt = weights[cy * side + cx];
          r += src[srcOff] * wt;
          g += src[srcOff + 1] * wt;
          b += src[srcOff + 2] * wt;
          a += src[srcOff + 3] * wt;
        }
      }
      dst[dstOff] = r;
      dst[dstOff + 1] = g;
      dst[dstOff + 2] = b;
      dst[dstOff + 3] = a + alphaFac * (255 - a);
    }
  }
  return output;
};

function grayscale(pixels) {
  var d = pixels.data;
  for (var i = 0; i < d.length; i += 4) {
    var r = d[i];
    var g = d[i + 1];
    var b = d[i + 2];
    // CIE luminance for the RGB
    var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    d[i] = d[i + 1] = d[i + 2] = v
  }
  return pixels;
};

createCanvases();
window.onload = function () {
  loadSourceImage(SOURCE_IMAGE)
}
