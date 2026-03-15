import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-image-cropper-modal',
  templateUrl: './image-cropper-modal.component.html',
  styleUrls: ['./image-cropper-modal.component.scss']
})
export class ImageCropperModalComponent {
  @Input() imageBase64: string = '';
  @Input() outputSize = 500; // <-- Novo: tamanho da imagem final cortada
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewCanvas') previewCanvas!: ElementRef<HTMLCanvasElement>;

  ctx!: CanvasRenderingContext2D;
  img = new Image();

  isDragging = false;
  isResizing = false;
  resizeHandleSize = 20;

  startX = 0;
  startY = 0;
  selectionSize = 0;
  offsetX = 0;
  offsetY = 0;

  canvasScale = 1;
  maxCanvasHeight = window.innerHeight * 0.7;
  minSelectionSize = 50;

  constructor(public activeModal: NgbActiveModal) { }

  ngAfterViewInit() {
    this.loadImage();
  }

  loadImage() {
    this.img.src = this.imageBase64;
    this.img.onload = () => {
      const canvas = this.canvas.nativeElement;

      const scale = Math.min(1, this.maxCanvasHeight / this.img.naturalHeight);
      this.canvasScale = scale;
      canvas.width = this.img.naturalWidth * scale;
      canvas.height = this.img.naturalHeight * scale;

      this.ctx = canvas.getContext('2d')!;
      this.redraw();

      const minSide = Math.min(canvas.width, canvas.height);
      this.selectionSize = minSide / 2;
      this.startX = (canvas.width - this.selectionSize) / 2;
      this.startY = (canvas.height - this.selectionSize) / 2;

      this.drawSelection();
      this.updatePreview();
    };
  }

  redraw() {
    const canvas = this.canvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
  }

  startInteraction(x: number, y: number) {
    if (this.isOverHandle(x, y)) {
      this.isResizing = true;
    } else if (this.isInsideSelection(x, y)) {
      this.isDragging = true;
      this.offsetX = x - this.startX;
      this.offsetY = y - this.startY;
    }
  }

  duringInteraction(x: number, y: number) {
    if (!this.isDragging && !this.isResizing) return;

    if (this.isDragging) {
      this.startX = x - this.offsetX;
      this.startY = y - this.offsetY;

      // Limita para não sair da imagem
      this.startX = Math.max(0, Math.min(this.startX, this.canvas.nativeElement.width - this.selectionSize));
      this.startY = Math.max(0, Math.min(this.startY, this.canvas.nativeElement.height - this.selectionSize));
    }

    if (this.isResizing) {
      let newSize = Math.max(x - this.startX, y - this.startY);
      if (newSize < this.minSelectionSize) {
        newSize = this.minSelectionSize;
      }

      // Limita dentro da imagem
      newSize = Math.min(newSize,
        this.canvas.nativeElement.width - this.startX,
        this.canvas.nativeElement.height - this.startY
      );
      this.selectionSize = newSize;
    }

    this.redraw();
    this.drawSelection();
    this.updatePreview();
  }

  endInteraction() {
    this.isDragging = false;
    this.isResizing = false;
  }

  isInsideSelection(x: number, y: number) {
    return (
      x >= this.startX &&
      x <= this.startX + this.selectionSize &&
      y >= this.startY &&
      y <= this.startY + this.selectionSize
    );
  }

  isOverHandle(x: number, y: number) {
    const handleX = this.startX + this.selectionSize;
    const handleY = this.startY + this.selectionSize;
    return (
      x >= handleX - this.resizeHandleSize &&
      x <= handleX + this.resizeHandleSize &&
      y >= handleY - this.resizeHandleSize &&
      y <= handleY + this.resizeHandleSize
    );
  }

  drawSelection() {
    const ctx = this.ctx;

    this.redraw();

    // Salva o estado atual
    ctx.save();

    // Escurece toda a imagem
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    // Faz um buraco na área de recorte (área transparente real)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.rect(this.startX, this.startY, this.selectionSize, this.selectionSize);
    ctx.fill();

    // Restaura o modo de desenho normal
    ctx.globalCompositeOperation = 'source-over';

    // Desenha a borda
    ctx.strokeStyle = '#00BCD4'; // Azul bonitão
    ctx.lineWidth = 3;
    ctx.strokeRect(this.startX, this.startY, this.selectionSize, this.selectionSize);

    // Desenha o quadradinho (handle) para resize
    ctx.fillStyle = '#00BCD4';
    ctx.fillRect(
      this.startX + this.selectionSize - this.resizeHandleSize / 2,
      this.startY + this.selectionSize - this.resizeHandleSize / 2,
      this.resizeHandleSize,
      this.resizeHandleSize
    );

    ctx.restore();
  }



  crop() {
    const cropX = this.startX / this.canvasScale;
    const cropY = this.startY / this.canvasScale;
    const cropSize = this.selectionSize / this.canvasScale;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = this.outputSize;
    croppedCanvas.height = this.outputSize;
    const croppedCtx = croppedCanvas.getContext('2d')!;

    croppedCtx.drawImage(
      this.img,
      cropX,
      cropY,
      cropSize,
      cropSize,
      0,
      0,
      this.outputSize,
      this.outputSize
    );

    const croppedBase64 = croppedCanvas.toDataURL('image/png');
    this.activeModal.close(croppedBase64);
  }

  updatePreview() {
    if (!this.previewCanvas) return;
    const previewCtx = this.previewCanvas.nativeElement.getContext('2d')!;
    const previewSize = 150;
    this.previewCanvas.nativeElement.width = previewSize;
    this.previewCanvas.nativeElement.height = previewSize;

    const cropX = this.startX / this.canvasScale;
    const cropY = this.startY / this.canvasScale;
    const cropSize = this.selectionSize / this.canvasScale;

    previewCtx.clearRect(0, 0, previewSize, previewSize);

    previewCtx.drawImage(
      this.img,
      cropX,
      cropY,
      cropSize,
      cropSize,
      0,
      0,
      previewSize,
      previewSize
    );
  }

  // Suporte Mouse
  onMouseDown(event: MouseEvent) {
    this.startInteraction(event.offsetX, event.offsetY);
  }

  onMouseMove(event: MouseEvent) {
    this.duringInteraction(event.offsetX, event.offsetY);
  }

  onMouseUp() {
    this.endInteraction();
  }

  // Suporte Toque (Mobile)
  onTouchStart(event: TouchEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    this.startInteraction(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  onTouchMove(event: TouchEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    this.duringInteraction(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  onTouchEnd() {
    this.endInteraction();
  }
}
