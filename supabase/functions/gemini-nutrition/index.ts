import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Missing Gemini API Key')
    }

    if (!transcript) {
      throw new Error('No transcript provided')
    }

    const systemInstruction = `
Eres un asistente experto en nutrición y bases de datos de alimentos en Argentina. 
Tu tarea es recibir una descripción de alimentos y dividirla en ALIMENTOS INDIVIDUALES con sus macros exactos.

REGLAS CRÍTICAS:
1. NUNCA redondees a números enteros si el valor tiene decimales. Usa valores exactos.
2. Identifica si el alimento está cocido, crudo, frito, etc., si es posible, y ponlo en el nombre.
3. ORTOGRAFÍA Y PRESENTACIÓN: La primera letra de cada palabra importante debe ir en Mayúscula (Ej: "Pechuga de Pollo Cocida" NO "pechuga de pollo cocida"). Usa un formato de redacción limpio y premium.
4. AGRUPACIÓN: Si el usuario indica múltiples unidades de una misma comida (Ej: "3 huevos" o "3 milanesas de 150g"), NUNCA crees objetos separados. Agrupa todo en UN SOLO objeto multiplicando los macros totales, e indica la cantidad total en el "amount" (Ej: "3 unidades" o "3 unidades (450g total)").
5. Debes devolver un objeto JSON estricto con un arreglo "foods" que contenga cada alimento agrupado por separado.

Estructura JSON requerida:
{
  "foods": [
    {
      "name": "string (Ej: Pechuga de Pollo cocida)",
      "amount": "string (Ej: 150g o 1 unidad)",
      "calories": number (Ej: 165.5),
      "protein": number (Ej: 31.2),
      "carbs": number (Ej: 0.0),
      "fats": number (Ej: 3.6)
    }
  ]
}
`

    // Usando gemini-2.5-flash como solicitó el usuario en el último paso
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: transcript }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        }
      })
    })

    const data = await response.json()
    
    if (data.error) {
       throw new Error(data.error.message)
    }

    const rawContent = data.candidates[0].content.parts[0].text
    const parsedData = JSON.parse(rawContent)

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
