import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Loader2, Search, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onResult: (productData: any, barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onResult }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [barcodeFound, setBarcodeFound] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [visionMode, setVisionMode] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scanning || manualMode || visionMode) return;

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 }
          },
          async (decodedText) => {
            // Success
            if (!processing) {
              handleBarcodeScanned(decodedText);
            }
          },
          (_errorMessage) => {
            // Ignoring parse errors (happens every frame if no barcode)
          }
        );
      } catch (err) {
        console.error("Error starting scanner", err);
        setError("No se pudo iniciar la cámara. Verifica los permisos.");
        setManualMode(true);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [scanning, manualMode, visionMode, processing]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setScanning(false);
    setProcessing(true);
    setBarcodeFound(barcode);
    await stopScanner();

    try {
      const product = await api.scanBarcode(barcode);
      if (product) {
        onResult(product.product, barcode);
        onClose();
      } else {
        // Not found in DB or OpenFoodFacts
        setProcessing(false);
        setVisionMode(true);
      }
    } catch (e) {
      console.error(e);
      setError("Error al buscar el producto.");
      setProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Strip data:image/jpeg;base64,
        const base64Data = base64String.split(',')[1];
        
        try {
          const macros = await api.analyzeNutritionLabel(base64Data, barcodeFound || "unknown");
          
          // Return the extracted data
          onResult({
            name: "Producto Escaneado",
            ...macros
          }, barcodeFound || "");
          
          onClose();
        } catch (err: any) {
          setError(err.message || "Error al analizar la imagen");
          setProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Error al procesar la imagen");
      setProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-950">
        <div>
          <h2 className="text-xl font-bold text-white">Escáner</h2>
          <p className="text-sm text-zinc-400">Escanea el código de barras</p>
        </div>
        <button onClick={() => { stopScanner(); onClose(); }} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {error && (
          <div className="absolute top-6 left-6 right-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {processing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center border border-primary-500/30">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">
              {visionMode ? 'Analizando etiqueta...' : 'Buscando producto...'}
            </h3>
            <p className="text-zinc-400 text-center max-w-xs">
              {visionMode ? 'Gemini Vision está extrayendo los macros. Esto puede tomar unos segundos.' : 'Buscando en la base de datos global y Open Food Facts.'}
            </p>
          </div>
        ) : visionMode ? (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <Search className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-zinc-100">Producto no encontrado</h3>
              <p className="text-zinc-400">
                ¡No pasa nada! Tómale una foto clara a la <strong className="text-zinc-200">tabla nutricional</strong> y nuestra IA extraerá los datos. 
                Se guardará para que el próximo usuario sí lo encuentre.
              </p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-primary-500/20"
            >
              <Camera className="w-6 h-6" />
              Tomar foto a la tabla
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="w-full aspect-square rounded-3xl overflow-hidden bg-black border-2 border-zinc-800 shadow-2xl relative">
              <div id="reader" className="w-full h-full object-cover"></div>
              <div className="absolute inset-0 pointer-events-none border-[3px] border-primary-500/50 rounded-3xl m-8"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-[2px] bg-primary-500/80 animate-scan"></div>
              </div>
            </div>
            <p className="mt-8 text-center text-zinc-400">
              Apunta la cámara al código de barras del producto para escanearlo.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
