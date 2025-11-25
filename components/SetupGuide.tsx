import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, LinkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUrl: (url: string) => void;
  currentUrl: string;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ isOpen, onClose, onSaveUrl, currentUrl }) => {
  const [urlInput, setUrlInput] = useState(currentUrl);

  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const handleSave = () => {
    onSaveUrl(urlInput);
    onClose();
  };

  if (!isOpen) return null;

  const scriptCode = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    // Usar la primera hoja visible
    var sheet = doc.getSheets()[0];
    
    var data = JSON.parse(e.postData.contents);
    
    // --- LÓGICA DE ID INTELIGENTE (001-GT-XX) ---
    
    // 1. Obtener Iniciales del Centro (ej. "San Juan" -> "SJ")
    var centerName = data.healthCenter || "Indefinido";
    var initials = centerName.toString()
      .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") // Quitar acentos
      .replace(/[^a-zA-Z0-9 ]/g, "") // Quitar caracteres raros
      .split(" ")
      .map(function(w) { return w.charAt(0).toUpperCase(); })
      .join("")
      .substring(0, 4); // Máx 4 letras

    if (initials.length === 0) initials = "XX";

    // 2. Calcular Secuencial (001, 002...)
    var lastRow = sheet.getLastRow();
    var nextNum = 1;

    // Si hay datos anteriores (más allá del encabezado), mirar el último ID
    if (lastRow > 1) {
      var lastId = sheet.getRange(lastRow, 1).getValue().toString(); 
      // El formato esperado es NUMERO-GT-LETRAS (ej. 005-GT-HM)
      var parts = lastId.split("-");
      // Si el primer trozo es un número, le sumamos 1
      if (parts.length > 0 && !isNaN(parseInt(parts[0], 10))) {
        nextNum = parseInt(parts[0], 10) + 1;
      }
    }

    // Formatear con ceros a la izquierda (ej. 001)
    var seqStr = ("000" + nextNum).slice(-3);
    
    // ID FINAL: 001-GT-SJ
    var autoId = seqStr + "-GT-" + initials;
    // --------------------------------

    // Función auxiliar para formatear arrays
    function formatValue(val) {
      if (Array.isArray(val)) return val.join(", ");
      return val || "";
    }

    // Encabezados exactos
    var headers = [
      "ID Registro", "Fecha Ingreso", "Fecha Entrevista", "Entrevistador", 
      "País", "Centro Salud", 
      "Nombre Paciente", "Fecha Nacimiento", "Edad", "Peso (Kg)", "Talla (cm)",
      "3.1 F. Última Regla", "3.2 Comorbilidades", "Otras Comorb.", "3.3 Medicamentos",
      "3.4 Diagnóstico Conf.", "3.5 Métodos Diag.", "Otros Métodos", "3.6 Fecha Diag.", 
      "3.7 Estadio Clínico", "3.8 Tipo Histológico", "3.9 Tratamiento Actual", 
      "Tipos Tratamiento", "Otros Trat.",
      "4.1 F/H Recolección", "4.2 F/H Recepción", 
      "4.3 Cond. Recolección", "4.4 Cond. Almacenamiento"
    ];

    // Si la hoja está vacía, poner encabezados y colores
    if (sheet.getLastRow() === 0) {
       sheet.appendRow(headers);
       var headerRange = sheet.getRange(1, 1, 1, headers.length);
       headerRange.setBackground("#024580").setFontColor("white").setFontWeight("bold");
       sheet.setFrozenRows(1);
    }

    // Preparar la fila nueva
    var newRow = [
      autoId,
      new Date(), // Fecha de sistema
      "'" + data.interviewDate, // Comilla simple fuerza texto para evitar cambio de fecha
      data.interviewerName,
      data.country, 
      data.healthCenter,
      data.fullName, 
      "'" + data.dob, 
      data.age, 
      data.weight, 
      data.height,
      "'" + data.lastPeriodDate, 
      formatValue(data.comorbidities), 
      data.comorbiditiesOther, 
      data.currentMeds,
      data.confirmedDiagnosis, 
      formatValue(data.diagnosticMethods), 
      data.diagnosticMethodsOther, 
      "'" + data.diagnosisDate,
      data.clinicalStage, 
      data.histologicalType, 
      data.currentTreatment,
      formatValue(data.treatmentTypes), 
      data.treatmentOther,
      "'" + data.sampleCollectionDateTime.replace("T", " "), 
      "'" + data.sampleReceptionDateTime.replace("T", " "),
      data.collectionConditions, 
      data.storageConditions
    ];

    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "id": autoId }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    lock.releaseLock();
  }
}`;

  return (
    <div className="fixed inset-0 bg-[#024580]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-[#024580]">Actualizar Código (ID Inteligente)</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f878a3]/10 text-gray-400 hover:text-[#f878a3] rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* STEP 1 */}
          <div className="space-y-2 relative">
             <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f9953c]/20 text-[#f9953c] font-bold text-sm shrink-0 z-10 bg-white">1</span>
              <h3 className="font-semibold text-[#024580]">Copiar Código Actualizado</h3>
            </div>
            <p className="text-gray-600 ml-11 text-sm">
              Copia todo este bloque y reemplaza lo que tengas en <strong>Google Apps Script</strong>.
            </p>
            <div className="ml-11 mt-2 relative group">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono h-48 select-all">
                {scriptCode}
              </pre>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(scriptCode);
                  alert("¡Código copiado al portapapeles!");
                }}
                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded text-xs backdrop-blur-md flex items-center gap-1 transition cursor-pointer"
              >
                <ClipboardDocumentIcon className="w-4 h-4" /> Copiar
              </button>
            </div>
          </div>

          {/* STEP 2 */}
           <div className="space-y-2 relative">
             <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f9953c]/20 text-[#f9953c] font-bold text-sm shrink-0 z-10 bg-white">2</span>
              <h3 className="font-semibold text-[#024580]">IMPORTANTE: Publicar Nueva Versión</h3>
            </div>
            
            <div className="ml-11 bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 shrink-0" />
                    <div className="text-sm text-red-800">
                        <strong>Si no haces esto, los cambios NO funcionarán:</strong><br/><br/>
                        1. Clic en botón azul <strong>"Implementar"</strong> &gt; <strong>"Gestionar implementaciones"</strong>.<br/>
                        2. Clic en el icono de <strong>Lápiz (Editar)</strong>.<br/>
                        3. En "Versión", selecciona: <strong>"Nueva versión"</strong>.<br/>
                        4. Clic en <strong>"Implementar"</strong> o "Listo".
                    </div>
                </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#30e674]/20 text-[#30e674] font-bold text-sm shrink-0">3</span>
              <h3 className="font-semibold text-[#024580]">Conectar la App</h3>
            </div>
            <p className="text-gray-600 ml-11 text-sm">
              Copia la "URL de la aplicación web" que te da Google y pégala aquí:
            </p>
            <div className="ml-11 mt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#f878a3] focus:ring focus:ring-[#f878a3]/20 outline-none transition-all text-sm font-mono text-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-[#024580] hover:bg-[#024580]/90 text-white font-semibold rounded-xl transition-colors shadow-lg flex items-center gap-2"
          >
            Guardar y Conectar
          </button>
        </div>
      </div>
    </div>
  );
};