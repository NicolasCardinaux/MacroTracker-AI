import { supabase } from '../lib/supabase';
import type { DailyGoals, FoodLog, GeminiNutritionResponse, BodyMetric } from '../types';
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
  }
};
