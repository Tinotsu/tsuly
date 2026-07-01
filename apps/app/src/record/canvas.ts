export function drawCameraCutoutLayer(
  context: CanvasRenderingContext2D,
  cameraVideo: HTMLVideoElement,
  maskCanvas: HTMLCanvasElement,
  layerCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  mirrorMode: boolean,
) {
  const layerContext = layerCanvas.getContext('2d')
  if (!layerContext) return

  if (layerCanvas.width !== maskCanvas.width || layerCanvas.height !== maskCanvas.height) {
    layerCanvas.width = maskCanvas.width
    layerCanvas.height = maskCanvas.height
  }

  layerContext.clearRect(0, 0, layerCanvas.width, layerCanvas.height)
  layerContext.drawImage(cameraVideo, 0, 0, layerCanvas.width, layerCanvas.height)
  layerContext.globalCompositeOperation = 'destination-in'
  layerContext.drawImage(maskCanvas, 0, 0)
  layerContext.globalCompositeOperation = 'source-over'

  drawCameraLayer(context, layerCanvas, x, y, width, height, mirrorMode)
}

export function drawCameraLayer(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  mirrorMode: boolean,
) {
  if (mirrorMode) {
    context.save()
    context.translate(x + width, y)
    context.scale(-1, 1)
    context.drawImage(image, 0, 0, width, height)
    context.restore()
    return
  }

  context.drawImage(image, x, y, width, height)
}
