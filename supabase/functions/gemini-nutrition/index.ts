import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractJsonFromString(str: string): string {
  let cleaned = str.replace(/^```(?:json)?/im, '').replace(/```$/im, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) startIdx = Math.min(firstBrace, firstBracket);
  else if (firstBrace !== -1) startIdx = firstBrace;
  else if (firstBracket !== -1) startIdx = firstBracket;
  
  if (startIdx !== -1) {
    const endBrace = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');
    let endIdx = -1;
    if (endBrace !== -1 && endBracket !== -1) endIdx = Math.max(endBrace, endBracket);
    else if (endBrace !== -1) endIdx = endBrace;
    else if (endBracket !== -1) endIdx = endBracket;
    
    if (endIdx !== -1) cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { transcript, audioBase64, mimeType, action, food_name, macros, user_id } = requestBody
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    const apiKey2 = Deno.env.get('GEMINI_API_KEY_2') // API Key de respaldo (Opcional)
    const groqKey = Deno.env.get('GROQ_API_KEY') // Groq API Key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') // OpenRouter API Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!apiKey) throw new Error('Missing Gemini API Key')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase Keys')
    if (!transcript && !audioBase64 && !action) throw new Error('No input provided')

    // Función genérica para IAs compatibles con el estándar de OpenAI (Groq, OpenRouter)
    const callOpenAICompatible = async (apiUrl: string, apiKeyValue: string, model: string, systemInstruction: string, userPrompt: string, requireJson = false) => {
      const bodyParams: any = {
        model: model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1
      };
      if (requireJson && apiUrl.includes("groq")) {
         bodyParams.response_format = { type: "json_object" };
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyValue}`
        },
        body: JSON.stringify(bodyParams)
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    }

    // Función wrapper para reintentar con la segunda API Key y manejar caídas de servidor (503)
    const fetchGemini = async (model: string, payload: any, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (res.status === 429 && apiKey2) {
          console.log("Límite excedido (429) en API Key 1. Usando GEMINI_API_KEY_2 de respaldo...")
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey2}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        }

        // Si el servidor de Google está saturado (503) o ambas keys fallaron por cuota (429), reintentamos tras una pausa
        if ((res.status === 503 || res.status === 429) && i < retries) {
          const delayMs = 1500 * (i + 1);
          console.log(`Error ${res.status} de Google. Reintentando en ${delayMs}ms... (Intento ${i+1} de ${retries})`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue;
        }

        return res
      }
      throw new Error("Gemini API Error 429")
    }

    const executeAiChain = async (systemInstruction: string, userPrompt: string, geminiPayload: any) => {
      try {
        const res = await fetchGemini('gemini-2.5-flash', geminiPayload, 0);
        const data = await res.json();
        if (data.error && data.error.code === 429) throw new Error("Gemini 429");
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
      } catch (err: any) {
        console.warn("Gemini falló, intentando respaldos:", err.message);
        let debugInfo = `Gemini falló. `;
        
        if (groqKey) {
          try {
            console.log("Activando Groq (Llama 3.1)...");
            const groqRes = await callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", groqKey, "llama-3.1-8b-instant", systemInstruction, userPrompt, true);
            return groqRes;
          } catch(e: any) {
            debugInfo += `Groq Error: ${e.message}. `;
            console.warn("Groq falló:", e.message);
          }
        } else {
          debugInfo += `GroqKey MISSING. `;
        }
        
        if (openRouterKey) {
          try {
            console.log("Activando OpenRouter (Llama 3.1 Free)...");
            const orRes = await callOpenAICompatible("https://openrouter.ai/api/v1/chat/completions", openRouterKey, "meta-llama/llama-3.1-8b-instruct:free", systemInstruction, userPrompt, false);
            return orRes;
          } catch(e: any) {
            debugInfo += `OpenRouter Error: ${e.message}. `;
            console.warn("OpenRouter falló:", e.message);
          }
        } else {
          debugInfo += `OpenRouterKey MISSING. `;
        }

        throw new Error(`Límite de la Inteligencia Artificial alcanzado. Todas las IAs de respaldo fallaron. Debug: ${debugInfo}`);
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // --- MODO: SOLO TRANSCRIBIR AUDIO (STT) ---
    if (action === 'transcribe' && audioBase64) {
      const sttInstruction = `
Eres un asistente experto en transcripción de audio.
Tu única tarea es transcribir EXACTAMENTE lo que el usuario dice en el audio.
El audio está en idioma Español (Argentina).
No agregues comentarios, no respondas a las preguntas del audio, no agregues formato markdown.
SOLO devuelve el texto plano transcrito. Si el audio está vacío o no se entiende, devuelve "".
`
      const sttResponse = await fetchGemini('gemini-2.5-flash', {
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } }, { text: "Transcribe este audio." }] }],
        systemInstruction: { parts: [{ text: sttInstruction }] },
        generationConfig: { temperature: 0.1 }
      })

      const sttData = await sttResponse.json()
      if (sttData.error) {
        if (sttData.error.code === 429) throw new Error("Límite de la Inteligencia Artificial alcanzado. Por favor, espera 1 minuto o configura una GEMINI_API_KEY_2 de respaldo.");
        throw new Error(sttData.error.message);
      }
      if (!sttData.candidates || sttData.candidates.length === 0) {
        throw new Error("Gemini STT no devolvió resultados. Posible bloqueo de seguridad: " + JSON.stringify(sttData.promptFeedback || {}));
      }
      const rawContent = sttData.candidates[0].content.parts[0].text
      return new Response(JSON.stringify({ transcript: rawContent.trim() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- MODO: ACTUALIZAR DICCIONARIO (LEARNING & CROWDSOURCING) ---
    if (action === 'update_dictionary') {
      let cleanName = food_name.split(' (')[0].trim();
      cleanName = cleanName.replace(/^(\d+(?:\.\d+)?\s*(?:unidades|unidad|gramos|gramo|gr|g|ml)?\s*(?:de\s*)?)/i, '').trim();

      let userTargetId = null;
      let globalTargetId = null;
      let exactName = cleanName;
      let existingUnit = 'unidad'; // default fallback

      // 1. Búsqueda exacta
      const { data } = await supabase.from('food_dictionary').select('id, user_id, food_name, default_unit').ilike('food_name', cleanName);
      if (data && data.length > 0) {
        const userCopy = data.find((r: any) => r.user_id === user_id);
        const globalCopy = data.find((r: any) => r.user_id === null);
        if (userCopy) {
            userTargetId = userCopy.id;
            existingUnit = userCopy.default_unit;
        }
        if (globalCopy) {
            globalTargetId = globalCopy.id;
            exactName = globalCopy.food_name; // Respetar capitalización de DB
            if (!userCopy) existingUnit = globalCopy.default_unit;
        }
      } else {
        // 2. Búsqueda fuzzy fallback
        const words = cleanName.split(' ').filter((w: string) => w.length >= 4);
        for (const word of words) {
          let searchWord = word;
          if (searchWord.toLowerCase().endsWith('s')) searchWord = searchWord.slice(0, -1);
          
          const { data: fallbackData } = await supabase.from('food_dictionary').select('id, user_id, food_name, default_unit').ilike('food_name', `%${searchWord}%`);
          if (fallbackData && fallbackData.length > 0) {
            const userCopy = fallbackData.find((r: any) => r.user_id === user_id);
            const globalCopy = fallbackData.find((r: any) => r.user_id === null);
            if (userCopy) {
                userTargetId = userCopy.id;
                existingUnit = userCopy.default_unit;
            }
            if (globalCopy) {
                globalTargetId = globalCopy.id;
                exactName = globalCopy.food_name;
                if (!userCopy) existingUnit = globalCopy.default_unit;
            }
            break; // Stop looking after first successful fuzzy match
          }
        }
      }

      // Si no existe nada global ni de usuario, lo insertamos como global inicial
      if (!userTargetId && !globalTargetId) {
         const { data: newGlobal, error: globalErr } = await supabase.from('food_dictionary').insert({
            food_name: exactName,
            base_calories: macros.base_calories,
            base_protein: macros.base_protein,
            base_carbs: macros.base_carbs,
            base_fats: macros.base_fats,
            default_unit: 'unidad', // Más seguro por defecto
            user_id: null,
            source: 'User'
         }).select('id').single();
         if (globalErr) return new Response(JSON.stringify({ error: globalErr }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
         if (newGlobal) globalTargetId = newGlobal.id;
      } 
      // Si el usuario ya tiene su copia, la actualizamos
      else if (userTargetId) {
         const { error: updErr } = await supabase.from('food_dictionary').update(macros).eq('id', userTargetId);
         if (updErr) return new Response(JSON.stringify({ error: updErr }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } 
      // Si existe global pero no de usuario, insertamos la copia del usuario
      else if (globalTargetId && user_id) {
         const { error: insErr } = await supabase.from('food_dictionary').insert({
            food_name: exactName,
            base_calories: macros.base_calories,
            base_protein: macros.base_protein,
            base_carbs: macros.base_carbs,
            base_fats: macros.base_fats,
            default_unit: existingUnit, // <--- COPIAMOS LA UNIDAD ORIGINAL!
            user_id: user_id,
            source: 'User',
            usage_count: 1
         });
         if (insErr) return new Response(JSON.stringify({ error: insErr }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }



      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- MODO: ANÁLISIS SEMANAL (WEEKLY_ANALYSIS) ---
    if (action === 'weekly_analysis') {
      const { weeklyData, goals } = requestBody;
      const weeklyInstruction = `Eres un nutricionista experto y empático.
El usuario te enviará un resumen de sus últimos 7 días de alimentación (Día, Calorías consumidas, Proteínas consumidas) y sus Metas Diarias.
Tu tarea es analizar rápidamente cómo le fue en la semana y darle una recomendación breve, amigable y motivadora.
No hagas una lista enorme. Escribe 1 o 2 párrafos cortos (máximo 4 oraciones en total).
Ejemplo de estilo: "¡Vienes excelente con la proteína esta semana! Noté que el fin de semana te pasaste un poco de calorías, trata de equilibrar las grasas el domingo. ¡Sigue así que vas muy bien!"`;

      const prompt = `Metas Diarias del Usuario: ${JSON.stringify(goals)}.
Resumen de los últimos 7 días: ${JSON.stringify(weeklyData)}.
Analiza esto y dime: ¿Cómo es mi alimentación? ¿Cómo va todo?`;

      const aiResponse = await fetchGemini('gemini-2.5-flash', {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: weeklyInstruction }] },
        generationConfig: { temperature: 0.7 }
      });
      const data = await aiResponse.json();
      if (data.error) throw new Error(data.error.message);
      const recommendation = data.candidates[0].content.parts[0].text;
      
      return new Response(JSON.stringify({ recommendation }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- MODO: ANALIZAR MACROS (HÍBRIDO CACHÉ + IA) ---

    // Paso 1: Usar IA (o regex rápido) para extraer las entidades (Nombres y Cantidades)
    let extractedItems = null;

    // PRE-CACHE CHECK: Si el usuario escribe algo muy simple (ej: "manzana", "manzana 200gr", "200gr de manzana"), 
    // usamos Regex para evitar llamar a la IA y ahorrar cuota de Google.
    if (transcript && !audioBase64) {
      const t = transcript.trim();
      const weightMatch = t.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)\s*(?:de\s*)?(\d+(?:,|\.)?\d*)\s*(gr|gramos|g)$/i);
      const weightMatch2 = t.match(/^(\d+(?:,|\.)?\d*)\s*(gr|gramos|g)\s*(?:de\s*)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)$/i);
      const isSimpleText = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/i.test(t);
      const wordCount = t.split(/\s+/).length;
      const hasConnectors = /\b(y|con)\b/i.test(t);
      const hasNumberWords = /\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|medio|media|mitad|cuarto)\b/i.test(t);

      if (weightMatch && !hasConnectors) {
         extractedItems = [{ name: weightMatch[1].trim(), quantity: Number(weightMatch[2].replace(',','.')), unit: 'gramos', original_text: t }];
      } else if (weightMatch2 && !hasConnectors) {
         extractedItems = [{ name: weightMatch2[3].trim(), quantity: Number(weightMatch2[1].replace(',','.')), unit: 'gramos', original_text: t }];
      } else if (isSimpleText && wordCount <= 3 && !hasConnectors && !hasNumberWords) {
         extractedItems = [{ name: t, quantity: 1, unit: 'unidad', original_text: t }];
      }
    }

    if (!extractedItems) {
      // Si el texto es complejo o es un audio, recurrimos a Gemini (Cuesta 1 request)
      const extractInstruction = `
Eres un asistente que extrae alimentos de un texto.
Devuelve un JSON estricto con un arreglo "items".
Cada item debe tener:
- "name": el nombre singular y genérico del alimento (Ej: "huevo frito", "manzana"). ¡OBLIGATORIO SEPARAR ALIMENTOS! Si el usuario enumera varios alimentos juntos usando "y" o "con" (ej: "dos huevos con una tostada y media palta"), DEBES devolver elementos separados en el array: uno para "huevo revuelto", otro para "tostada", otro para "palta". ¡NUNCA los combines en un solo nombre largo! ¡PROHIBIDO INCLUIR NÚMEROS O PESOS EN EL NOMBRE!
- "quantity": cantidad numérica. SIEMPRE usa decimales para fracciones (Ej: si el usuario dice "media palta" o "mitad de manzana", la cantidad es 0.5. Si dice "un cuarto", es 0.25).
- "unit": unidad de medida ("unidad", "gramos", "taza", etc).
CRÍTICO: Si el texto menciona un PESO en gramos (ej: "1 manzana de 230 gramos"), LA UNIDAD DEBE SER OBLIGATORIAMENTE "gramos" y LA CANTIDAD debe ser el peso numérico (230). NO uses "unidad" si se especifica el peso.
- "original_text": el texto original detectado (Ej: "1 manzana de 230 gramos").

CRÍTICO: Si el texto del usuario NO contiene alimentos reales (por ejemplo si dice "cualquier cosa", "nada", "hola", o habla de temas que no son comida), debes devolver OBLIGATORIAMENTE un arreglo vacío: { "items": [] }.

Ejemplo Entrada: "Me comí dos huevos fritos y 150 gramos de arroz"
Salida Esperada:
{
  "items": [
    { "name": "huevo frito", "quantity": 2, "unit": "unidad", "original_text": "dos huevos fritos" },
    { "name": "arroz blanco cocido", "quantity": 150, "unit": "gramos", "original_text": "150 gramos de arroz" }
  ]
}

Ejemplo Entrada: "cualquier cosa"
Salida Esperada:
{
  "items": []
}
`

      // Solo usamos fallback si es texto. Si tiene audioBase64 forzamos a Gemini porque Groq/OpenRouter no manejan STT directo fácil.
      if (audioBase64) {
        const extractResponse = await fetchGemini('gemini-2.5-flash', {
          contents: [
            {
              role: "user",
              parts: [
                ...(transcript ? [{ text: transcript }] : []),
                { inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } }
              ]
            }
          ],
          systemInstruction: { parts: [{ text: extractInstruction }] },
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })

        const extractData = await extractResponse.json()
        if (extractData.error) throw new Error(extractData.error.message);
        extractedItems = JSON.parse(extractJsonFromString(extractData.candidates[0].content.parts[0].text)).items || []
      } else {
        const rawJsonText = await executeAiChain(
          extractInstruction,
          transcript || "",
          {
            contents: [{ role: "user", parts: [{ text: transcript || "" }] }],
            systemInstruction: { parts: [{ text: extractInstruction }] },
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
          }
        );
        extractedItems = JSON.parse(extractJsonFromString(rawJsonText)).items || [];
      }
    }

    const finalFoods = []

    for (const item of extractedItems) {
      // Limpiar el nombre por si Gemini accidentalmente incluyó el peso (ej: "manzana de 235 gramos" -> "manzana")
      const cleanName = String(item.name).toLowerCase()
        .replace(/\b(?:de\s*)?\d+(?:,|\.)?\d*\s*(?:gr|gramo|gramos|g|kg|ml)\b/gi, '')
        .trim();

      // Paso 2: Buscar en Supabase Caché
      // Primero intentamos búsqueda EXACTA o prefijo (Mucho más preciso que algoritmos fuzzy)
      let { data: matches } = await supabase
        .from('food_dictionary')
        .select('*')
        .ilike('food_name', cleanName)
        .limit(20);
        
      if (!matches || matches.length === 0) {
         matches = (await supabase
            .from('food_dictionary')
            .select('*')
            .ilike('food_name', `${cleanName}%`)
            .limit(20)).data;
      }

      // Si no hay match exacto, recurrimos al algoritmo Fuzzy (Trigramas)
      if (!matches || matches.length === 0) {
        const { data: fuzzyMatches, error: rpcError } = await supabase.rpc('match_food_text', {
          query_text: cleanName,
          match_threshold: 0.25,
          match_count: 20
        });
        
        if (rpcError) console.error("Error en match_food_text:", rpcError);

        if (fuzzyMatches && fuzzyMatches.length > 0) {
           matches = fuzzyMatches;
        } else {
           // Fallback final: Buscar por la última palabra
           const words = cleanName.split(' ').filter((w: string) => w.length >= 3);
           const keyword = words.length > 0 ? words[words.length - 1] : cleanName;
           
           const { data: fallbackMatches } = await supabase
             .from('food_dictionary')
             .select('*')
             .ilike('food_name', `%${keyword}%`)
             .limit(20);
             
           if (fallbackMatches && fallbackMatches.length > 0) {
              matches = fallbackMatches;
           }
        }
      }

      // Priorizar siempre los alimentos propios del usuario sobre los globales!
      if (matches && matches.length > 0 && user_id) {
         matches.sort((a: any, b: any) => {
            if (a.user_id === user_id && b.user_id !== user_id) return -1;
            if (b.user_id === user_id && a.user_id !== user_id) return 1;
            return 0; // mantener orden por similitud u otros
         });
      }

      // Normalizar unidad de forma más agresiva para aumentar los Cache Hits
      let normalizedUnit = (item.unit || 'unidad').toLowerCase()
      if (normalizedUnit.includes('gramo') || normalizedUnit.includes('gr')) {
        normalizedUnit = 'gramos'
      } else {
        normalizedUnit = 'unidad'
      }

      // Solo consideramos un HIT si la unidad también coincide lógicamente
      const validMatch = matches?.find((m: any) => m.default_unit === normalizedUnit && (m.user_id === null || m.user_id === user_id))

      if (validMatch) {
        // HIT EN CACHÉ!
        const match = validMatch
        console.log("Caché HIT para:", item.name, "-> Encontrado como:", match.food_name, match.user_id ? "(User)" : "(Global)")
        
        // Actualizar contador de uso de forma asíncrona
        supabase.from('food_dictionary').update({ usage_count: match.usage_count + 1 }).eq('id', match.id).then()

        finalFoods.push({
          name: match.food_name,
          amount: item.original_text,
          quantity: item.quantity,
          unit: normalizedUnit,
          base_calories: Number(match.base_calories),
          base_protein: Number(match.base_protein),
          base_carbs: Number(match.base_carbs),
          base_fats: Number(match.base_fats),
          total_calories: Number(match.base_calories) * item.quantity,
          total_protein: Number(match.base_protein) * item.quantity,
          total_carbs: Number(match.base_carbs) * item.quantity,
          total_fats: Number(match.base_fats) * item.quantity,
          fuente_calculo: 'diccionario_local'
        })
      } else {
        // MISS EN CACHÉ -> Preguntar a Gemini por este alimento específico
        console.log("Caché MISS para:", item.name, "-> Consultando Gemini Macros")
        
        const macroInstruction = `
Eres un experto en nutrición. Tu tarea es dar la información nutricional para 1 unidad base de este alimento.
La unidad base puede ser 1 unidad entera, o 1 gramo si el alimento se mide en peso.

CRÍTICO: Si el texto provisto NO es un alimento real consumible por humanos (por ejemplo: "cualquier cosa", "nada", "teclado", "hola"), debes devolver EXACTAMENTE este JSON:
{ "name": "NOT_A_FOOD", "base_calories": 0, "base_protein": 0, "base_carbs": 0, "base_fats": 0, "default_unit": "unidad" }

Si es un alimento válido, devuelve un JSON con:
- "name": Nombre limpio y capitalizado (Ej: "Huevo Frito").
- "base_calories", "base_protein", "base_carbs", "base_fats": valores numéricos exactos solicitados.
- "default_unit": la unidad utilizada ("unidad" o "gramos").
`
        const unitContext = normalizedUnit === 'gramos' ? 'Calcula los macros para exactamente 100 gramos de este alimento.' : 'Calcula los macros para exactamente 1 unidad de este alimento.'

        const userPromptMacro = `Alimento: ${item.name}. ${unitContext}`;
        const rawMacroJson = await executeAiChain(
          macroInstruction,
          userPromptMacro,
          {
            contents: [{ role: "user", parts: [{ text: userPromptMacro }] }],
            systemInstruction: { parts: [{ text: macroInstruction }] },
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
          }
        );
        
        const parsedMacro = JSON.parse(extractJsonFromString(rawMacroJson));
        
        if (normalizedUnit === 'gramos') {
           // La IA siempre calcula sobre 100g para mayor precisión. Aquí lo dividimos para obtener el valor de 1 gramo.
           parsedMacro.base_calories = Number((parsedMacro.base_calories / 100).toFixed(4));
           parsedMacro.base_protein = Number((parsedMacro.base_protein / 100).toFixed(4));
           parsedMacro.base_carbs = Number((parsedMacro.base_carbs / 100).toFixed(4));
           parsedMacro.base_fats = Number((parsedMacro.base_fats / 100).toFixed(4));
        }
        
        if (parsedMacro.name === "NOT_A_FOOD") {
          throw new Error(`La palabra "${item.name}" no fue reconocida como un alimento válido.`);
        }

        const normalizedParsedName = parsedMacro.name.toLowerCase().trim();
        const { data: existingGlobal } = await supabase.from('food_dictionary')
          .select('id, usage_count, base_calories, base_protein, base_carbs, base_fats')
          .ilike('food_name', normalizedParsedName)
          .is('user_id', null)
          .limit(1)
          .maybeSingle();

        let finalMacros = parsedMacro;

        if (existingGlobal) {
          console.log(`[Deduplicación] Evitando duplicado global para "${parsedMacro.name}". Reutilizando ID: ${existingGlobal.id}`);
          finalMacros = {
             ...parsedMacro,
             base_calories: Number(existingGlobal.base_calories),
             base_protein: Number(existingGlobal.base_protein),
             base_carbs: Number(existingGlobal.base_carbs),
             base_fats: Number(existingGlobal.base_fats)
          };
          // Update usage count asynchronously
          supabase.from('food_dictionary').update({ usage_count: (existingGlobal.usage_count || 0) + 1 }).eq('id', existingGlobal.id).then();
        } else {
          // Guardar en Caché para la próxima vez (como Global AI)
          const { error: insertError } = await supabase.from('food_dictionary').insert({
            food_name: parsedMacro.name,
            base_calories: parsedMacro.base_calories,
            base_protein: parsedMacro.base_protein,
            base_carbs: parsedMacro.base_carbs,
            base_fats: parsedMacro.base_fats,
            default_unit: parsedMacro.default_unit,
            usage_count: 1,
            user_id: null,
            source: 'AI'
          })
          
          if (insertError) {
            console.error("CRITICAL ERROR: No se pudo guardar el alimento en caché (Supabase Insert Falló):", insertError);
          } else {
            console.log("¡Alimento nuevo aprendido y guardado con éxito en Supabase!", parsedMacro.name);
          }
        }

        finalFoods.push({
          name: parsedMacro.name,
          amount: item.original_text,
          quantity: item.quantity,
          unit: normalizedUnit,
          base_calories: finalMacros.base_calories,
          base_protein: finalMacros.base_protein,
          base_carbs: finalMacros.base_carbs,
          base_fats: finalMacros.base_fats,
          total_calories: finalMacros.base_calories * item.quantity,
          total_protein: finalMacros.base_protein * item.quantity,
          total_carbs: finalMacros.base_carbs * item.quantity,
          total_fats: finalMacros.base_fats * item.quantity,
          fuente_calculo: existingGlobal ? 'diccionario_local' : 'gemini'
        })
      }
    }

    if (finalFoods.length === 0) {
      throw new Error("No se reconoció ningún alimento válido en tu mensaje. Por favor, intenta escribirlo de otra forma.");
    }

    return new Response(
      JSON.stringify({ foods: finalFoods }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
