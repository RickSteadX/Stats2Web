import { Shield, Target, Users, Building2, Zap, Plane, Car, Truck, Bomb, Calendar, Star, Crosshair, MapPin, Radio, LucideProps } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Button } from './components/ui/button';

interface MilitaryDataItem {
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  name: string;
  hit: number;
  destroyed: number;
  hitCell: string;
  destroyedCell: string;
}

const initialMilitaryData: MilitaryDataItem[] = [
  { icon: Target, name: "ОС РОВ", hit: 0, destroyed: 1, hitCell: "B2", destroyedCell: "C2" },
  { icon: Target, name: "Точки вильоту дронів", hit: 0, destroyed: 0, hitCell: "B3", destroyedCell: "C3" },
  { icon: Zap, name: "Антени вор. екіпажів", hit: 0, destroyed: 0, hitCell: "B4", destroyedCell: "C4" },
  { icon: Building2, name: "Ворожі крила", hit: 0, destroyed: 0, hitCell: "B5", destroyedCell: "C5" },
  { icon: Car, name: "Танки", hit: 0, destroyed: 0, hitCell: "B6", destroyedCell: "C6" },
  { icon: Truck, name: "ББМ, БМП, БТР", hit: 0, destroyed: 0, hitCell: "B7", destroyedCell: "C7" },
  { icon: Plane, name: "Гармати, гаубиці", hit: 0, destroyed: 0, hitCell: "B8", destroyedCell: "C8" },
  { icon: Car, name: "САУ", hit: 0, destroyed: 0, hitCell: "B9", destroyedCell: "C9" },
  { icon: Bomb, name: "Міномети", hit: 0, destroyed: 0, hitCell: "B10", destroyedCell: "C10" },
  { icon: Truck, name: "РСЗВ, ЗРК, ЗУ", hit: 0, destroyed: 0, hitCell: "B11", destroyedCell: "C11" },
  { icon: Car, name: "ЛАТ, ВАТ, спец. та інж. техніка, паливозапр.", hit: 0, destroyed: 0, hitCell: "B12", destroyedCell: "C12" },
  { icon: Car, name: "Мотоцикли", hit: 0, destroyed: 0, hitCell: "B13", destroyedCell: "C13" },
  { icon: Car, name: "Баггі військові", hit: 0, destroyed: 0, hitCell: "B14", destroyedCell: "C14" }
];

const initialAdditionalData: MilitaryDataItem[] = [
  { icon: Building2, name: "Склади", hit: 0, destroyed: 0, hitCell: "E2", destroyedCell: "F2" },
  { icon: Building2, name: "Стратегічна інфрастр.", hit: 0, destroyed: 0, hitCell: "E3", destroyedCell: "F3" },
  { icon: Shield, name: "Укриття", hit: 0, destroyed: 0, hitCell: "E4", destroyedCell: "F4" },
  { icon: Building2, name: "Бліндажі", hit: 0, destroyed: 0, hitCell: "E5", destroyedCell: "F5" },
  { icon: Building2, name: "Мережеве обладнання", hit: 0, destroyed: 0, hitCell: "E6", destroyedCell: "F6" },
  { icon: Target, name: "Ворожі коптери", hit: 0, destroyed: 0, hitCell: "E7", destroyedCell: "F7" },
  { icon: Car, name: "Ворожі НРК", hit: 0, destroyed: 0, hitCell: "E8", destroyedCell: "F8" },
  { icon: Zap, name: "Інше", hit: 0, destroyed: 0, hitCell: "E9", destroyedCell: "F9" }
];

const unitBadges = [
  { icon: Shield, name: "1-ша БР" },
  { icon: Star, name: "2-га БР" },
  { icon: Crosshair, name: "3-тя БР" },
  { icon: Target, name: "4-та БР" },
  { icon: MapPin, name: "5-та БР" },
  { icon: Radio, name: "6-та БР" },
  { icon: Shield, name: "7-ма БР" },
  { icon: Star, name: "8-ма БР" },
  { icon: Crosshair, name: "9-та БР" },
  { icon: Target, name: "10-та БР" },
  { icon: MapPin, name: "11-та БР" },
  { icon: Radio, name: "12-та БР" }
];

// Add interface for summary values with cell parameters
interface SummaryValueItem {
  value: number;
  cell: string;
}

// Add interface for date values with cell parameters
interface DateValueItem {
  value: string;
  cell: string;
}

// Add initial summary values with cell references
const initialSummaryValues: SummaryValueItem[] = [
  { value: 201, cell: "A68" },   // OS РОВ
  { value: 102, cell: "B68" },   // Destroyed
  { value: 99, cell: "C68" },    // Wounded
  { value: 753, cell: "B71" },    // Total hits
  { value: 1000, cell: "B74" },    // Total
  { value: 228, cell: "B75" },    // Total OS
];

// Add initial date values with cell references
const initialDateValues: DateValueItem[] = [
  { value: "00:00 04.09.2025", cell: "I1" },   // Start date
  { value: "23:59 04.09.2025", cell: "I2" }    // End date
];

// --- THE REACT COMPONENT ---
export default function App() {
  const [militaryData, setMilitaryData] = useState(initialMilitaryData);
  const [additionalData, setAdditionalData] = useState(initialAdditionalData);
  const [summaryValues, setSummaryValues] = useState(initialSummaryValues);
  const [dateValues, setDateValues] = useState(initialDateValues);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSheetSelectorOpen, setIsSheetSelectorOpen] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [workbookData, setWorkbookData] = useState<XLSX.WorkBook | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSheetSelectorOpen) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragActive(true);
      }
    } else if (e.type === "dragleave") {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragActive(false);
      }
    }
  }, [isSheetSelectorOpen]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSheetSelectorOpen) return;
    
    dragCounter.current = 0;
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      const validExtensions = ['.xlsx', '.xls', '.xlsm'];
      const isValidFile = validExtensions.some(ext => file.name.endsWith(ext));
      
      if (isValidFile) {
        const reader = new FileReader();
        
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (!event.target?.result) {
            console.error("FileReader error: Could not read the file.");
            return;
          }

          try {
            const data = new Uint8Array(event.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // Check if there are multiple sheets
            if (workbook.SheetNames.length > 1) {
              // Show sheet selector dialog
              setSheetNames(workbook.SheetNames);
              setWorkbookData(workbook);
              setSelectedFile(file);
              setIsSheetSelectorOpen(true);
            } else {
              // Process directly if only one sheet
              processWorkbook(workbook, workbook.SheetNames[0]);
            }
          } catch (error) {
            console.error("An error occurred while processing the XLSX file:", error);
          }
        };

        reader.onerror = (error) => {
          console.error("FileReader failed:", error);
        };

        reader.readAsArrayBuffer(file);
      } else {
        console.warn("Please drop a valid .xlsx or .xls file.");
      }
    }
  }, [isSheetSelectorOpen]);

  const processWorkbook = useCallback((workbook: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        console.error("Error: The selected spreadsheet is empty or invalid.");
        return;
      }
      
      const getCellValue = (cellAddress: string): number => {
        const cell = worksheet[cellAddress];
        return (cell && typeof cell.v === 'number') ? cell.v : 0;
      };

      const newMilitaryData = initialMilitaryData.map(item => ({
        ...item,
        hit: getCellValue(item.hitCell),
        destroyed: getCellValue(item.destroyedCell),
      }));

      const newAdditionalData = initialAdditionalData.map(item => ({
        ...item,
        hit: getCellValue(item.hitCell),
        destroyed: getCellValue(item.destroyedCell),
      }));
      
      // Update summary values from Excel cells using the cell references
      const newSummaryValues = initialSummaryValues.map(item => ({
        ...item,
        value: getCellValue(item.cell)
      }));
      
      // Update date values from Excel cells using the cell references
      const newDateValues = initialDateValues.map(item => ({
        ...item,
        value: worksheet[item.cell]?.v?.toString() || item.value
      }));
      
      console.log("Updated Military Data:", newMilitaryData);
      console.log("Updated Additional Data:", newAdditionalData);
      console.log("Updated Summary Values:", newSummaryValues);
      console.log("Updated Date Values:", newDateValues);

      setMilitaryData(newMilitaryData);
      setAdditionalData(newAdditionalData);
      setSummaryValues(newSummaryValues);
      setDateValues(newDateValues);
    } catch (error) {
      console.error("An error occurred while processing the sheet:", error);
    }
  }, []);

  const handleSheetSelect = useCallback((sheetName: string) => {
    if (workbookData) {
      processWorkbook(workbookData, sheetName);
      setIsSheetSelectorOpen(false);
      setWorkbookData(null);
      setSelectedFile(null);
    }
  }, [workbookData, processWorkbook]);

  // Helper functions to get specific summary values by index
  const getSummaryValue = (index: number): number => summaryValues[index]?.value || 0;

  const handleFileUpload = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.xlsm'];
    const isValidFile = validExtensions.some(ext => file.name.endsWith(ext));
    
    if (isValidFile) {
      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (!event.target?.result) {
          console.error("FileReader error: Could not read the file.");
          return;
        }

        try {
          const data = new Uint8Array(event.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Check if there are multiple sheets
          if (workbook.SheetNames.length > 1) {
            // Show sheet selector dialog
            setSheetNames(workbook.SheetNames);
            setWorkbookData(workbook);
            setSelectedFile(file);
            setIsSheetSelectorOpen(true);
          } else {
            // Process directly if only one sheet
            processWorkbook(workbook, workbook.SheetNames[0]);
          }
        } catch (error) {
          console.error("An error occurred while processing the XLSX file:", error);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader failed:", error);
      };

      reader.readAsArrayBuffer(file);
    } else {
      console.warn("Please select a valid .xlsx or .xls file.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Function to toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!appRef.current) return;
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (appRef.current.requestFullscreen) {
        appRef.current.requestFullscreen();
      } else if ((appRef.current as any).webkitRequestFullscreen) {
        // Safari
        (appRef.current as any).webkitRequestFullscreen();
      } else if ((appRef.current as any).msRequestFullscreen) {
        // IE11
        (appRef.current as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        // Safari
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        // IE11
        (document as any).msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={appRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white relative overflow-hidden font-['Inter']"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* Hidden file input for click-based upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx,.xls,.xlsm"
        className="hidden"
      />
      
      {/* Sheet Selection Dialog */}
      <Dialog open={isSheetSelectorOpen} onOpenChange={(open) => {
        if (!open) {
          // Reset drag counter when dialog closes
          dragCounter.current = 0;
        }
        setIsSheetSelectorOpen(open);
      }}>
        <DialogContent className="bg-gradient-to-br from-slate-900/90 to-emerald-900/90 border-2 border-emerald-400/60 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-100 font-['JetBrains_Mono'] text-xl">Виберіть аркуш</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-emerald-200">Файл містить кілька аркушів. Виберіть той, який містить дані:</p>
            <Select onValueChange={handleSheetSelect}>
              <SelectTrigger className="bg-slate-800/50 border-emerald-400/50 text-emerald-100">
                <SelectValue placeholder="Оберіть аркуш" />
              </SelectTrigger>
              <SelectContent className={`bg-slate-900 border-emerald-400/50 ${sheetNames.length > 15 ? 'grid grid-cols-2 gap-1 max-h-80' : ''}`}>
                {sheetNames.map((name, index) => (
                  <SelectItem 
                    key={index} 
                    value={name}
                    className="text-emerald-100 hover:bg-emerald-400/20"
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSheetSelectorOpen(false);
                  dragCounter.current = 0;
                }}
                className="border-emerald-400/50 text-emerald-100 hover:bg-emerald-400/20 bg-slate-800/50"
              >
                Скасувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Drop zone overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-emerald-900/80 z-50 flex items-center justify-center border-4 border-dashed border-emerald-400 rounded-xl">
          <div className="text-center">
            <div className="text-4xl mb-4">📁</div>
            <div className="text-2xl font-bold text-emerald-100">Перетягніть файл Excel сюди</div>
            <div className="text-emerald-300 mt-2">Підтримуються формати .xlsx та .xls</div>
          </div>
        </div>
      )}
      
      {/* Enhanced Military Background Pattern */}
      <div className="absolute inset-0 opacity-8">
        {/* Hexagonal Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.12) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 40px 40px'
        }}></div>
        
        {/* Military Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Tactical Elements */}
        <div className="absolute top-16 left-16 w-40 h-40 border border-emerald-400/20 rotate-45"></div>
        <div className="absolute top-32 right-24 w-28 h-28 border-2 border-emerald-400/15 rounded-full"></div>
        <div className="absolute bottom-24 left-32 w-36 h-36 border border-emerald-400/10 rotate-12"></div>
        <div className="absolute bottom-40 right-40 w-32 h-32 border-2 border-cyan-400/10 rounded-full"></div>
        
        {/* Crosshair Patterns */}
        <div className="absolute top-1/3 left-1/5">
          <div className="w-20 h-1 bg-emerald-400/15"></div>
          <div className="w-1 h-20 bg-emerald-400/15 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <div className="absolute bottom-1/3 right-1/5">
          <div className="w-16 h-1 bg-cyan-400/12"></div>
          <div className="w-1 h-16 bg-cyan-400/12 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        
        {/* Tactical Radar Circles */}
        <div className="absolute top-1/2 left-1/4 w-48 h-48 border border-emerald-400/8 rounded-full"></div>
        <div className="absolute top-3/4 right-1/3 w-32 h-32 border border-emerald-400/6 rounded-full"></div>
      </div>

      <div className="relative z-10 h-full">
        {/* Header */}
        <header className="border-b-2 border-emerald-400/40 bg-black/25 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Shield 
                    className="w-12 h-12 text-emerald-400 drop-shadow-lg cursor-pointer hover:text-emerald-300 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-wider text-emerald-100 font-['JetBrains_Mono'] uppercase">
                    РОЗВІДДОНЕСЕННЯ
                  </h1>
                  <div className="text-lg font-bold text-emerald-400 tracking-widest mt-1 font-['JetBrains_Mono']">
                    ЗА ДОБУ
                  </div>
                </div>
              </div>
              <div 
                className={`bg-gradient-to-r from-slate-900/80 to-emerald-900/80 border-2 ${isFullscreen ? 'border-amber-400' : 'border-emerald-400'} px-4 py-2 rounded-lg backdrop-blur-sm shadow-2xl cursor-pointer hover:border-emerald-300 transition-colors`}
                onClick={toggleFullscreen}
              >
                <div className="text-emerald-300 font-['JetBrains_Mono'] font-bold text-sm">з {dateValues[0].value}</div>
                <div className="text-emerald-300 font-['JetBrains_Mono'] font-bold text-sm">по {dateValues[1].value}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Square Content Area */}
        <main className="max-w-6xl mx-auto px-6 py-6">
          <div className="bg-gradient-to-br from-slate-900/60 via-emerald-900/40 to-slate-900/60 border-2 border-emerald-400/50 rounded-3xl backdrop-blur-lg shadow-2xl p-8 relative overflow-hidden">
            
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-emerald-400"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-emerald-400"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-emerald-400"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-emerald-400"></div>

            <div className="h-full flex flex-col p-4">
              {/* Top Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Three Key Stats */}
                <div className="bg-gradient-to-br from-emerald-800/60 to-slate-800/50 border-2 border-emerald-400/60 rounded-xl p-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent"></div>
                  <div className="relative z-10 grid grid-cols-3 gap-6 text-center h-full">
                    <div className="flex flex-col justify-center">
                      <div className="text-4xl font-black text-emerald-100 mb-2 font-['JetBrains_Mono']">{getSummaryValue(0)}</div>
                      <div className="text-emerald-400 font-bold text-sm font-['JetBrains_Mono']">ОС РОВ</div>
                    </div>
                    <div className="flex flex-col justify-center border-x border-emerald-400/30 px-4">
                      <div className="text-4xl font-black text-emerald-100 mb-2 font-['JetBrains_Mono']">{getSummaryValue(1)}</div>
                      <div className="text-emerald-400 font-bold text-sm font-['JetBrains_Mono']">в т. ч. знищено</div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-4xl font-black text-emerald-100 mb-2 font-['JetBrains_Mono']">{getSummaryValue(2)}</div>
                      <div className="text-emerald-400 font-bold text-sm font-['JetBrains_Mono']">в т. ч. поранено</div>
                    </div>
                  </div>
                </div>

                {/* Large Stat with Description */}
                <div className="bg-gradient-to-br from-slate-800/70 to-emerald-800/50 border-2 border-emerald-400/60 rounded-xl p-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent"></div>
                  <div className="relative z-10 flex items-center justify-between h-full">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 font-['JetBrains_Mono'] tracking-wider drop-shadow-2xl">
                      {getSummaryValue(3)}
                    </div>
                    <div className="text-emerald-300 text-sm font-bold leading-relaxed font-['JetBrains_Mono'] text-right">
                      УНІКАЛЬНИХ УРАЖЕНЬ<br />
                      ВОРОЖИХ ЦІЛЕЙ<br />
                      ПРОТЯГОМ ДОБИ
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Table */}
                <div className="bg-slate-900/40 border border-emerald-400/40 rounded-xl p-5 backdrop-blur-sm flex flex-col min-h-0">
                  <div className="grid grid-cols-3 gap-4 mb-6 text-center border-b border-emerald-400/30 pb-3">
                    <div></div>
                    <div className="text-emerald-300 font-bold font-['JetBrains_Mono'] text-lg">УРАЖЕНО</div>
                    <div className="text-emerald-300 font-bold font-['JetBrains_Mono'] text-lg">ЗНИЩЕНО</div>
                  </div>
                  <div className="space-y-2 overflow-y-auto scroll-smooth snap-y snap-mandatory" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(16, 185, 129, 0.5) transparent'}}>
                    {militaryData.filter(item => item.hit > 0 || item.destroyed > 0).map((item, index) => (
                      <div key={index} className={`grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-700/30 hover:bg-emerald-400/5 rounded transition-colors snap-start ${index === 0 ? 'military-highlight' : ''}`}>
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="font-['Inter'] text-sm text-emerald-100">{item.name}</span>
                        </div>
                        <div className="text-center text-2xl font-black text-emerald-200 font-['JetBrains_Mono']">{item.hit}</div>
                        <div className="text-center text-2xl font-black text-amber-400 font-['['JetBrains_Mono']">{item.destroyed}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Table */}
                <div className="bg-slate-900/40 border border-emerald-400/40 rounded-xl p-5 backdrop-blur-sm flex flex-col min-h-0">
                  <div className="grid grid-cols-3 gap-4 mb-6 text-center border-b border-emerald-400/30 pb-3">
                    <div></div>
                    <div className="text-emerald-300 font-bold font-['JetBrains_Mono'] text-lg">УРАЖЕНО</div>
                    <div className="text-emerald-300 font-bold font-['JetBrains_Mono'] text-lg">ЗНИЩЕНО</div>
                  </div>
                  <div className="space-y-2 overflow-y-auto scroll-smooth snap-y snap-mandatory" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(16, 185, 129, 0.5) transparent'}}>
                    {additionalData.filter(item => item.hit > 0 || item.destroyed > 0).map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-700/30 hover:bg-emerald-400/5 rounded transition-colors snap-start">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="font-['Inter'] text-sm text-emerald-100">{item.name}</span>
                        </div>
                        <div className="text-center text-2xl font-black text-emerald-200 font-['JetBrains_Mono']">{item.hit}</div>
                        <div className="text-center text-2xl font-black text-amber-400 font-['JetBrains_Mono']">{item.destroyed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mt-4 bg-gradient-to-r from-slate-900/50 to-emerald-900/40 border border-emerald-400/40 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="text-lg mb-4 font-['JetBrains_Mono'] font-bold text-emerald-200">
                  ВСЬОГО <span className="text-emerald-400">УНІКАЛЬНИХ УРАЖЕНЬ</span><br />
                  ПРОТЯГОМ ВЕРЕСНЯ (01-04.09):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 bg-slate-800/30 p-3 rounded-lg">
                    <Target className="w-6 h-6 text-emerald-400" />
                    <span className="font-['Inter'] font-bold text-emerald-200 text-sm">Ворожих цілей</span>
                    <div className="ml-auto text-3xl font-black text-emerald-300 font-['JetBrains_Mono']">{getSummaryValue(4)}</div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-800/30 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-emerald-400" />
                    <span className="font-['Inter'] font-bold text-emerald-200 text-sm">Особового складу</span>
                    <div className="ml-auto text-3xl font-black text-amber-400 font-['JetBrains_Mono']">{getSummaryValue(5)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - Military Unit Badges */}
        <footer className="border-t-2 border-emerald-400/40 bg-black/25 backdrop-blur-sm mt-4">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="text-center mb-3">
              <h3 className="text-lg font-bold text-emerald-300 font-['JetBrains_Mono'] tracking-wider">ЗАДІЯНІ ПІДРОЗДІЛИ</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {unitBadges.map((badge, index) => (
                <div key={index} className="relative group">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-emerald-800 border-2 border-emerald-400 rounded-lg flex items-center justify-center shadow-lg hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-110">
                    <badge.icon className="w-6 h-6 text-emerald-300 group-hover:text-emerald-100 transition-colors" />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-emerald-400 font-['JetBrains_Mono'] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
