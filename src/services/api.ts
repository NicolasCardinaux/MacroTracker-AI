import { supabase } from '../lib/supabase';
import type { DailyGoals, FoodLog, GeminiNutritionResponse, BodyMetric, SavedMeal } from '../types';
import { getLocalDateString } from '../utils/date';

export const api = {
  // --- METAS DIARIAS ---
  async getDailyGoals(userId: string): Promise<DailyGoals | null> {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Usar maybeSingle para evitar error 406

    if (error) {
      console.error('Error fetching daily goals:', error);
      return null;
    }
    
    // Fallback: Si no hay metas, intentamos crearlas.
    // Si da error 409 (ya existe por el trigger), simplemente las volvemos a buscar.
    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from('daily_goals')
        .insert({ user_id: userId, target_calories: 2300, target_protein: 150, target_carbs: 250, target_fats: 75 })
        .select()
        .maybeSingle();
      
      if (insertError) {
        // Ignorar 409 Conflict, significa que el trigger funcionó después de nuestro select original
        const { data: retryData } = await supabase.from('daily_goals').select('*').eq('user_id', userId).single();
        return retryData;
      }
      return newData;
    }

    return data;
  },

  async updateDailyGoals(userId: string, goals: Partial<DailyGoals>): Promise<DailyGoals | null> {
    const { data, error } = await supabase
      .from('daily_goals')
      .update(goals)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating daily goals:', error);
      return null;
    }
    return data;
  },

  // --- REGISTROS DE COMIDA ---
  async getTodayFoodLogs(userId: string): Promise<FoodLog[]> {
    const today = getLocalDateString();
    return this.getFoodLogsByDate(userId, today);
  },

  async getFoodLogsByDate(userId: string, date: string): Promise<FoodLog[]> {
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) {
      console.error('Error fetching food logs:', error);
      return [];
    }
    return data || [];
  },

  async getAllFoodLogs(userId: string): Promise<FoodLog[]> {
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching all food logs:', error);
      return [];
    }
    return data || [];
  },

  async addFoodLogs(userId: string, logs: Omit<FoodLog, 'id' | 'created_at' | 'user_id'>[]): Promise<FoodLog[] | null> {
    const records = logs.map(log => ({ ...log, user_id: userId }));
    const { data, error } = await supabase
      .from('food_logs')
      .insert(records)
      .select();

    if (error) {
      console.error('Error adding food logs:', error);
      return null;
    }
    return data;
  },

  async updateFoodLog(logId: number, log: Partial<FoodLog>): Promise<FoodLog | null> {
    const { data, error } = await supabase
      .from('food_logs')
      .update(log)
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      console.error('Error updating food log:', error);
      return null;
    }
    return data;
  },

  async deleteFoodLog(logId: number): Promise<boolean> {
    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting food log:', error);
      return false;
    }
    return true;
  },

  async deleteFoodLogs(logIds: number[]): Promise<boolean> {
    const { error } = await supabase
      .from('food_logs')
      .delete()
      .in('id', logIds);

    if (error) {
      console.error('Error deleting food logs:', error);
      return false;
    }
    return true;
  },



  // --- AVANCES (BODY METRICS) ---
  async getBodyMetrics(userId: string): Promise<BodyMetric[]> {
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching body metrics:', error);
      return [];
    }
    return data || [];
  },

  async addBodyMetric(userId: string, metric: Omit<BodyMetric, 'id' | 'created_at' | 'user_id'>): Promise<BodyMetric | null> {
    const { data, error } = await supabase
      .from('body_metrics')
      .insert({ ...metric, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error adding body metric:', error);
      return null;
    }
    return data;
  },

  // --- IA (EDGE FUNCTION) ---
  async analyzeFoodWithGemini(transcript: string, audioBase64?: string, mimeType?: string, userId?: string): Promise<GeminiNutritionResponse> {
    const { data, error } = await supabase.functions.invoke('gemini-nutrition', {
      body: { transcript, audioBase64, mimeType, action: 'analyze', user_id: userId }
    });

    if (error) {
      console.error('Edge function error:', error);
      let errorMsg = 'Fallo al analizar la comida con la IA.';
      try {
        if (error.context && typeof error.context.json === 'function') {
           const errBody = await error.context.json();
           if (errBody && errBody.error) errorMsg = errBody.error;
        }
      } catch(e) {}
      throw new Error(errorMsg);
    }

    return data as GeminiNutritionResponse;
  },

  async updateDictionaryFromEdit(foodName: string, macros: { base_calories: number, base_protein: number, base_carbs: number, base_fats: number }, userId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('gemini-nutrition', {
        body: { 
          action: 'update_dictionary',
          food_name: foodName,
          macros: macros,
          user_id: userId
        }
      });

      if (error) {
         console.warn('Learning failed:', error.message || error);
      } else {
         console.log('Learning & Crowdsourcing successful for', foodName);
      }
    } catch (e) {
      console.error('Error updating dictionary from edit:', e);
    }
  },

  async getOriginalMacros(foodName: string): Promise<{base_calories: number, base_protein: number, base_carbs: number, base_fats: number} | null> {
    try {
      let existingUnit = 'unidad';
      const lowerFoodName = foodName.toLowerCase();
      if (lowerFoodName.includes('gramo') || lowerFoodName.includes('gr ') || lowerFoodName.match(/\bgr\b/)) {
         existingUnit = 'gramos';
      } else if (lowerFoodName.includes('ml')) {
         existingUnit = 'ml';
      }

      const cleanName = foodName.split(' (')[0].trim().replace(/^(\d+(?:\.\d+)?\s*(?:unidades|unidad|gramos|gramo|gr|g|ml)?\s*(?:de\s*)?)/i, '').trim();
      
      const { data, error } = await supabase
        .from('food_dictionary')
        .select('base_calories, base_protein, base_carbs, base_fats, default_unit')
        .ilike('food_name', cleanName)
        .is('user_id', null);

      if (error) {
        console.error('Error fetching original macros:', error);
        return null;
      }

      if (data && data.length > 0) {
        // Find the one that matches our extracted unit, or fallback to the first one
        const exactMatch = data.find(d => d.default_unit === existingUnit);
        const matchToUse = exactMatch || data[0];
        return {
          base_calories: matchToUse.base_calories,
          base_protein: matchToUse.base_protein,
          base_carbs: matchToUse.base_carbs,
          base_fats: matchToUse.base_fats
        };
      }
      return null;
    } catch (e) {
      console.error('Error in getOriginalMacros:', e);
      return null;
    }
  },

  async checkIfVerified(foodName: string, calories: number, protein: number, carbs: number, fats: number): Promise<boolean> {
    const original = await this.getOriginalMacros(foodName);
    if (!original) return false;
    
    // Allow small rounding differences
    const isCalMatch = Math.abs(original.base_calories - calories) < 1;
    const isProMatch = Math.abs(original.base_protein - protein) < 1;
    const isCarMatch = Math.abs(original.base_carbs - carbs) < 1;
    const isFatMatch = Math.abs(original.base_fats - fats) < 1;
    
    return isCalMatch && isProMatch && isCarMatch && isFatMatch;
  },

  async scanBarcode(barcode: string): Promise<any | null> {
    try {
      // 1. Check local DB (global food_dictionary)
      const { data: localData } = await supabase
        .from('food_dictionary')
        .select('*')
        .eq('barcode', barcode)
        .is('user_id', null)
        .limit(1);

      if (localData && localData.length > 0) {
        return {
          source: 'local',
          product: {
            name: localData[0].food_name,
            base_calories: localData[0].base_calories,
            base_protein: localData[0].base_protein,
            base_carbs: localData[0].base_carbs,
            base_fats: localData[0].base_fats,
            unit: localData[0].default_unit
          }
        };
      }

      // 2. Check Open Food Facts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const nut = p.nutriments || {};
        
        // Extract 100g or per serving. We prefer 100g/ml if available, else serving.
        // Let's standardise on 100g/100ml as base macros.
        let base_cals = nut['energy-kcal_100g'];
        let base_prot = nut['proteins_100g'];
        let base_carb = nut['carbohydrates_100g'];
        let base_fat = nut['fat_100g'];

        // Fallback to serving if 100g is missing
        if (base_cals === undefined && nut['energy-kcal_serving'] !== undefined) {
          const servingSize = parseFloat(p.serving_quantity) || 100;
          const factor = 100 / servingSize;
          base_cals = nut['energy-kcal_serving'] * factor;
          base_prot = (nut['proteins_serving'] || 0) * factor;
          base_carb = (nut['carbohydrates_serving'] || 0) * factor;
          base_fat = (nut['fat_serving'] || 0) * factor;
        }

        if (base_cals !== undefined) {
           return {
             source: 'openfoodfacts',
             product: {
               name: p.product_name_es || p.product_name || "Producto escaneado",
               base_calories: base_cals,
               base_protein: base_prot || 0,
               base_carbs: base_carb || 0,
               base_fats: base_fat || 0,
               unit: 'gramos' // usually 100g is standard
             }
           };
        }
      }

      return null;
    } catch (e) {
      console.error("Error scanning barcode", e);
      return null;
    }
  },

  async analyzeNutritionLabel(base64Image: string, barcode: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('gemini-nutrition', {
      body: { 
        action: 'analyze_nutrition_label',
        image: base64Image,
        barcode: barcode
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error('Fallo al analizar la imagen.');
    }

    return data;
  },

  async saveAiConsultation(userId: string, text: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_consultations')
      .insert({ user_id: userId, consultation_text: text });
      
    if (error) {
      console.error('Error saving AI consultation:', error);
      alert('Error guardando la consulta: ' + (error.message || JSON.stringify(error)));
      return false;
    }
    return true;
  },

  async getAiConsultations(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_consultations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI consultations:', error);
      return [];
    }
    return data || [];
  },

  async getWeeklyAnalysis(weeklyData: any[], goals: any): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-nutrition', {
        body: { action: 'weekly_analysis', weeklyData, goals }
      });
      if (error) {
        console.error('Edge function error (weekly_analysis):', error);
        return null;
      }
      return data.recommendation;
    } catch (e) {
      console.error('Error fetching weekly analysis:', e);
      return null;
    }
  },

  async transcribeAudioWithGemini(audioBase64: string, mimeType: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gemini-nutrition', {
      body: { audioBase64, mimeType, action: 'transcribe' }
    });

    if (error) {
      console.error('Edge function error (transcribe):', error);
      throw new Error('Fallo al transcribir el audio.');
    }

    return data.transcript || '';
  },

  async getSavedMeals(userId: string) {
    const { data, error } = await supabase
      .from('saved_meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved meals:', error);
      return [];
    }
    return data;
  },

  async saveMealCombo(comboData: Omit<SavedMeal, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('saved_meals')
      .insert([comboData])
      .select()
      .single();

    if (error) {
      console.error('Error saving meal combo:', error);
      throw error;
    }
    return data;
  },

  async deleteSavedMeal(id: string) {
    const { error } = await supabase
      .from('saved_meals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting saved meal:', error);
      throw error;
    }
  }
};
