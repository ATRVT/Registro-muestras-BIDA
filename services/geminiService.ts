import { GoogleGenAI, Type } from "@google/genai";
import { FormData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const cleanDataWithAI = async (data: FormData): Promise<FormData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a medical data entry assistant. Analyze the JSON form data.
        
        Tasks:
        1. Capitalize proper names (Person names, Countries, Health Centers).
        2. Ensure dates are in YYYY-MM-DD format.
        3. Correct spelling errors in "Other" text fields and medication names.
        4. Calculate Age automatically from DOB if Age is missing or looks wrong (assume current date).
        5. Return the cleaned object.
        
        Input Data: ${JSON.stringify(data)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formId: { type: Type.STRING },
            interviewDate: { type: Type.STRING },
            interviewerName: { type: Type.STRING },
            country: { type: Type.STRING },
            healthCenter: { type: Type.STRING },
            fullName: { type: Type.STRING },
            dob: { type: Type.STRING },
            age: { type: Type.STRING },
            weight: { type: Type.STRING },
            height: { type: Type.STRING },
            lastPeriodDate: { type: Type.STRING },
            comorbidities: { type: Type.ARRAY, items: { type: Type.STRING } },
            comorbiditiesOther: { type: Type.STRING },
            currentMeds: { type: Type.STRING },
            confirmedDiagnosis: { type: Type.STRING },
            diagnosticMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
            diagnosticMethodsOther: { type: Type.STRING },
            diagnosisDate: { type: Type.STRING },
            clinicalStage: { type: Type.STRING },
            histologicalType: { type: Type.STRING },
            currentTreatment: { type: Type.STRING },
            treatmentTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
            treatmentOther: { type: Type.STRING },
            sampleCountry: { type: Type.STRING },
            sampleCollectionDateTime: { type: Type.STRING },
            sampleReceptionDateTime: { type: Type.STRING },
            collectionConditions: { type: Type.STRING },
            storageConditions: { type: Type.STRING }
          },
          required: ["fullName", "interviewerName"]
        }
      }
    });

    const text = response.text;
    if (!text) return data;
    
    return JSON.parse(text) as FormData;
  } catch (error) {
    console.error("Gemini processing failed, using raw data", error);
    return data;
  }
};
