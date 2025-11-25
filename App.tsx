import React, { useState, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  CheckCircleIcon, 
  Cog6ToothIcon,
  BeakerIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ShareIcon
} from '@heroicons/react/24/solid';
import { FormData, FormStatus } from './types';
import { SetupGuide } from './components/SetupGuide';

// --- CONFIGURACIÓN DE URL ---
// URL fija para conexión automática. 
const GOOGLE_SCRIPT_URL_FIJA = "https://script.google.com/macros/s/AKfycbxRgmget5Z_u6D10X7cFF4zFVDLmkrvhe6bhB9_XAXY36_dZbta9HcfjTGlAUneSe2NZw/exec";

const initialData: FormData = {
  interviewDate: new Date().toISOString().split('T')[0],
  interviewerName: '',
  country: '',
  healthCenter: '',
  fullName: '',
  dob: '',
  age: '',
  weight: '',
  height: '',
  lastPeriodDate: '',
  comorbidities: [],
  comorbiditiesOther: '',
  currentMeds: '',
  confirmedDiagnosis: '',
  diagnosticMethods: [],
  diagnosticMethodsOther: '',
  diagnosisDate: '',
  clinicalStage: '',
  histologicalType: '',
  currentTreatment: '',
  treatmentTypes: [],
  treatmentOther: '',
  sampleCollectionDateTime: '',
  sampleReceptionDateTime: '',
  collectionConditions: '',
  storageConditions: ''
};

// --- Helper Components ---

const PillGroup = ({ 
  options, 
  selected, 
  onChange, 
  multiple = false 
}: { 
  options: string[], 
  selected: string | string[], 
  onChange: (val: string) => void,
  multiple?: boolean 
}) => {
  const isSelected = (opt: string) => {
    if (multiple && Array.isArray(selected)) {
      return selected.includes(opt);
    }
    // Type guard: ensure selected is not an array before string comparison
    if (!Array.isArray(selected)) {
      // Uso de 'as any' para evitar error TS2367 estricto
      return (selected as any) === opt;
    }
    return false;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border
            ${isSelected(opt) 
              ? 'bg-[#30e674] text-[#024580] border-[#30e674] shadow-md font-bold transform scale-105' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-[#f3f5f2]'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, sub }: { icon: any, title: string, sub?: string }) => (
  <div className="flex items-start gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
    <div className="p-2 bg-[#f9953c]/10 rounded-lg text-[#f9953c]">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-[#024580]">{title}</h3>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  </div>
);

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
}

const InputField = ({ label, name, type = "text", value, onChange, placeholder = "" }: InputFieldProps) => (
  <div className="w-full">
    <label className="block text-xs font-bold text-[#024580]/80 uppercase mb-1">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      step={type === "number" ? "0.1" : undefined}
      placeholder={placeholder}
      className="w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#108bf7] focus:ring-[#108bf7] py-2 px-3 border transition-colors" 
    />
  </div>
);

// --- Main App Component ---

const App = () => {
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(initialData);
  
  // Inicializamos directamente con la URL fija si existe
  const [scriptUrl, setScriptUrl] = useState<string>(GOOGLE_SCRIPT_URL_FIJA || '');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    // Prioridad: URL Fija > Local Storage
    if (GOOGLE_SCRIPT_URL_FIJA) {
      setScriptUrl(GOOGLE_SCRIPT_URL_FIJA);
    } else {
      const savedUrl = localStorage.getItem('googleScriptUrl');
      if (savedUrl) setScriptUrl(savedUrl);
    }
  }, []);

  const handleSaveUrl = (url: string) => {
    setScriptUrl(url);
    localStorage.setItem('googleScriptUrl', url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Formulario Muestras BIDA',
          text: 'App para recolección de muestras - Cáncer de Mama',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles. ¡Pégalo en WhatsApp!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePillChange = (value: string, fieldName: string, multiple: boolean) => {
    setFormData(prev => {
      if (multiple) {
        const currentArray = (prev[fieldName] as string[]) || [];
        if (currentArray.includes(value)) {
          return { ...prev, [fieldName]: currentArray.filter(item => item !== value) };
        } else {
          return { ...prev, [fieldName]: [...currentArray, value] };
        }
      } else {
        // Toggle logic for single select
        const currentVal = prev[fieldName];
        // Ensure strictly safe string comparison to avoid TS2367 using 'as any'
        const isSame = (typeof currentVal === 'string' && (currentVal as any) === value);
        return { ...prev, [fieldName]: isSame ? '' : value };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si no hay URL fija ni manual, mostrar aviso
    if (!scriptUrl) {
      setShowSetup(true);
      alert("¡Atención! Falta conectar con Google Sheets.");
      return;
    }

    setStatus(FormStatus.SENDING);
    setErrorMsg('');
    
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      setStatus(FormStatus.SUCCESS);
      setTimeout(() => {
        setStatus(FormStatus.IDLE);
        setFormData(initialData);
        window.scrollTo(0, 0);
      }, 3000);

    } catch (error) {
      console.error("Error sending data", error);
      setStatus(FormStatus.ERROR);
      setErrorMsg('Error de red. Verifica tu conexión o la URL.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f2] pb-12 font-sans">
      <SetupGuide 
        isOpen={showSetup} 
        onClose={() => setShowSetup(false)} 
        onSaveUrl={handleSaveUrl}
        currentUrl={scriptUrl}
      />

      {/* Top Header Bar */}
      <div className="bg-[#024580] text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Formulario Muestras BIDA</h1>
            <p className="text-blue-200 text-xs">Cáncer de Mama</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button onClick={handleShare} className="text-blue-200 hover:text-white p-2 rounded-full hover:bg-white/10 transition" title="Compartir App">
              <ShareIcon className="w-6 h-6" />
            </button>

            {/* Settings Icon */}
            <button onClick={() => setShowSetup(true)} className="relative text-[#f878a3] hover:text-white p-2 rounded-full hover:bg-white/10 transition" title="Configuración">
              <Cog6ToothIcon className="w-6 h-6" />
              {!scriptUrl && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-[#024580]"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* Connection Warning - Solo se muestra si NO hay URL configurada */}
        {!scriptUrl && (
          <div className="bg-yellow-50 border-l-4 border-[#f9953c] p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-[#f9953c]" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong className="font-bold">Modo Demo:</strong> La App no está conectada. Haz clic en el engranaje <Cog6ToothIcon className="w-4 h-4 inline text-[#f878a3]"/> arriba para configurar Google Sheets.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Success Badge (Visible solo si está conectado) */}
        {scriptUrl && (
          <div className="flex justify-end mb-2 px-2">
             <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                ✓ Conectado
             </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          
          {status === FormStatus.SUCCESS ? (
            <div className="p-20 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-[#30e674]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-16 h-16 text-[#30e674]" />
              </div>
              <h2 className="text-3xl font-bold text-[#024580] mb-2">¡Ficha Guardada!</h2>
              <p className="text-gray-500">Los datos se han enviado correctamente a Google Sheets.</p>
              <button 
                type="button" 
                onClick={() => setStatus(FormStatus.IDLE)}
                className="mt-8 text-[#024580] font-semibold hover:underline"
              >
                Ingresar otra ficha
              </button>
            </div>
          ) : status === FormStatus.ERROR ? (
             <div className="p-20 text-center animate-in fade-in">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al enviar</h2>
              <p className="text-gray-500 mb-6">{errorMsg || 'Hubo un problema de conexión.'}</p>
              <button 
                type="button" 
                onClick={() => setStatus(FormStatus.IDLE)}
                className="bg-gray-200 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <div className="p-6 sm:p-8">

              {/* General Info Card */}
              <div className="bg-[#024580]/5 rounded-xl p-6 border border-[#024580]/10 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#024580]/80 uppercase mb-1">ID Formulario</label>
                    <div className="bg-white/60 border border-[#024580]/20 text-[#024580] rounded-lg py-2 px-3 text-sm font-mono select-none">
                      (Auto-generado en Sheets)
                    </div>
                  </div>
                  <InputField label="Fecha Entrevista" name="interviewDate" type="date" value={formData.interviewDate} onChange={handleChange} />
                  <InputField label="Entrevistador(a)" name="interviewerName" value={formData.interviewerName} onChange={handleChange} />
                </div>
              </div>

              {/* Section 1 */}
              <SectionTitle icon={MapPinIcon} title="1. Identificación del país y centro participante" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="1.1 País" name="country" value={formData.country} onChange={handleChange} />
                <InputField label="1.2 Centro o Institución" name="healthCenter" value={formData.healthCenter} onChange={handleChange} />
              </div>

              {/* Section 2 */}
              <SectionTitle icon={UserIcon} title="2. Datos Demográficos" />
              <div className="space-y-6">
                <InputField label="2.1 Nombre Completo" name="fullName" value={formData.fullName} onChange={handleChange} />
                
                {/* 4 columns in one row for medium+ screens */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="2.2 F. Nacimiento" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                  <InputField label="2.3 Edad" name="age" type="number" value={formData.age} onChange={handleChange} />
                  <InputField label="2.4 Peso (Kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} />
                  <InputField label="2.5 Talla (cm)" name="height" type="number" value={formData.height} onChange={handleChange} />
                </div>
              </div>

              {/* Section 3 */}
              <SectionTitle icon={ClipboardDocumentCheckIcon} title="3. Condiciones de salud y diagnóstico" />
              <div className="space-y-8">
                <div className="w-full md:w-1/3">
                  <InputField label="3.1 Fecha de la última menstruación" name="lastPeriodDate" type="date" value={formData.lastPeriodDate} onChange={handleChange} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#024580] mb-1">3.2 Comorbilidades</label>
                  <PillGroup 
                    multiple 
                    options={['Hipertensión', 'Diabetes', 'Cardiopatías', 'Alteraciones renales', 'Enfermedad infecciosa']} 
                    selected={formData.comorbidities} 
                    onChange={(val) => handlePillChange(val, 'comorbidities', true)} 
                  />
                  <input type="text" name="comorbiditiesOther" placeholder="Otro (especifique)..." value={formData.comorbiditiesOther} onChange={handleChange} className="mt-3 w-full text-sm border-b border-gray-300 focus:border-[#108bf7] outline-none py-1 bg-transparent text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#024580] mb-2">3.3 Medicamentos que esté tomando actualmente</label>
                  <textarea name="currentMeds" rows={2} value={formData.currentMeds} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm border p-3 text-sm bg-white text-gray-900 focus:border-[#108bf7] focus:ring-[#108bf7]" placeholder="Listar medicamentos..." />
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div>
                    <span className="block text-sm font-bold text-[#024580]">3.4 ¿Cuenta con un diagnóstico médico confirmado de cáncer de mama?</span>
                    <PillGroup 
                      options={['Sí', 'No']} 
                      selected={formData.confirmedDiagnosis} 
                      onChange={(val) => handlePillChange(val, 'confirmedDiagnosis', false)} 
                    />
                  </div>

                  {/* Conditionally rendered based on 3.4 */}
                  {formData.confirmedDiagnosis === 'Sí' && (
                    <div className="space-y-6 mt-6 p-6 rounded-xl bg-[#f878a3]/5 border border-[#f878a3]/30 animate-in fade-in slide-in-from-top-4">
                      <div>
                        <label className="block text-sm font-bold text-[#024580]">3.5 Método de diagnóstico (puede marcar más de uno)</label>
                        <PillGroup 
                          multiple 
                          options={['Mamografía', 'Ecografía mamaria', 'Resonancia magnética', 'Biopsia']} 
                          selected={formData.diagnosticMethods} 
                          onChange={(val) => handlePillChange(val, 'diagnosticMethods', true)} 
                        />
                        <input type="text" name="diagnosticMethodsOther" placeholder="Otro..." value={formData.diagnosticMethodsOther} onChange={handleChange} className="mt-2 w-full text-sm border-b border-gray-300 focus:border-[#108bf7] outline-none bg-transparent text-gray-900" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="3.6 Fecha del diagnóstico" name="diagnosisDate" type="date" value={formData.diagnosisDate} onChange={handleChange} />
                        <div>
                          <label className="block text-xs font-bold text-[#024580]/80 uppercase mb-1">3.7 Estadio clínico del cáncer</label>
                          <select name="clinicalStage" value={formData.clinicalStage} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm border p-2 bg-white text-gray-900 text-sm h-[42px] focus:border-[#108bf7] focus:ring-[#108bf7]">
                            <option value="">Seleccione...</option>
                            {['0', 'I', 'II', 'III', 'IV', 'No sabe'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#024580]/80 uppercase mb-1">3.8 Tipo histológico del cáncer de mama</label>
                        <select name="histologicalType" value={formData.histologicalType} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm border p-2 bg-white text-gray-900 text-sm focus:border-[#108bf7] focus:ring-[#108bf7]">
                          <option value="">Seleccione...</option>
                          <option value="CDIS">I. Carcinoma ductal in situ (CDIS)</option>
                          <option value="CDI">II. Carcinoma ductal invasivo (CDI)</option>
                          <option value="CLIS">III. Carcinoma lobulillar in situ (CLIS)</option>
                          <option value="CLI">IV. Carcinoma lobulillar invasivo (CLI)</option>
                          <option value="Paget">V. Enfermedad de Paget del pezón</option>
                          <option value="Inflamatorio">VI. Cáncer de mama inflamatorio</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#024580]">3.9 ¿Actualmente recibe tratamiento oncológico?</label>
                        <PillGroup 
                          options={['Sí', 'No']} 
                          selected={formData.currentTreatment} 
                          onChange={(val) => handlePillChange(val, 'currentTreatment', false)} 
                        />
                        
                        {formData.currentTreatment === 'Sí' && (
                          <div className="mt-4 ml-2 animate-in fade-in slide-in-from-top-2">
                              <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Seleccione tratamientos:</p>
                              <PillGroup 
                                multiple
                                options={['Cirugía', 'Radioterapia', 'Quimioterapia', 'Terapia hormonal', 'Inmunoterapia']} 
                                selected={formData.treatmentTypes} 
                                onChange={(val) => handlePillChange(val, 'treatmentTypes', true)} 
                              />
                            <input type="text" name="treatmentOther" placeholder="Otro tratamiento..." value={formData.treatmentOther} onChange={handleChange} className="mt-3 w-full text-sm border-b border-gray-300 bg-transparent outline-none focus:border-[#108bf7] text-gray-900" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4 */}
              <SectionTitle icon={BeakerIcon} title="4. Datos de la muestra biológica" />
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="4.1 Fecha/Hora Recolección" name="sampleCollectionDateTime" type="datetime-local" value={formData.sampleCollectionDateTime} onChange={handleChange} />
                  <InputField label="4.2 Fecha/Hora Recepción" name="sampleReceptionDateTime" type="datetime-local" value={formData.sampleReceptionDateTime} onChange={handleChange} />
                </div>

                <div>
                   <label className="block text-sm font-bold text-[#024580] mb-2">4.3 Condiciones durante la recolección</label>
                   <PillGroup 
                     options={['Ayuno', 'Postprandial', 'Durante tratamiento', 'Antes de tratamiento']} 
                     selected={formData.collectionConditions} 
                     onChange={(val) => handlePillChange(val, 'collectionConditions', false)} 
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-[#024580] mb-2">4.4 Condiciones de almacenamiento</label>
                   <PillGroup 
                     options={['Refrigerada', 'Congelada', 'Temperatura ambiente']} 
                     selected={formData.storageConditions} 
                     onChange={(val) => handlePillChange(val, 'storageConditions', false)} 
                   />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-10 pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={status === FormStatus.SENDING}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-[#f9953c]/20 flex items-center justify-center gap-3 transition-all transform active:scale-95
                    ${status === FormStatus.IDLE ? 'bg-[#f9953c] hover:bg-[#e8862d]' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  {status !== FormStatus.SENDING ? (
                    <><span>Guardar Ficha</span><PaperAirplaneIcon className="w-5 h-5" /></>
                  ) : (
                    <><span>Enviando...</span><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div></>
                  )}
                </button>
              </div>

            </div>
          )}
        </form>
        <p className="text-center text-gray-400 text-xs mt-6 mb-12">Sistema de Gestión de Datos Clínicos v1.1</p>
      </div>
    </div>
  );
};

export default App;
