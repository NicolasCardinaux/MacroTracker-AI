export interface DailyGoals {
  id: string;
  user_id: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
  custom_meals?: string[];
  physical_goal?: 'deficit' | 'maintain' | 'surplus';
  created_at: string;
}

export type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena' | 'Snack';

export interface FoodLog {
  id: number;
  user_id: string;
  date: string;
  meal_type: MealType;
  raw_input: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  base_calories: number;
  base_protein: number;
  base_carbs: number;
  base_fats: number;
  fuente_calculo?: 'gemini' | 'diccionario_local';
  is_verified?: boolean;
  created_at: string;
}

export interface GeminiFoodItem {
  name: string;
  amount: string;
  quantity: number;
  unit: string;
  base_calories: number;
  base_protein: number;
  base_carbs: number;
  base_fats: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  fuente_calculo?: 'gemini' | 'diccionario_local';
  is_verified?: boolean;
}

export interface GeminiNutritionResponse {
  foods: GeminiFoodItem[];
}

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  body_fat?: number;
  created_at: string;
}

export interface SavedMealItem {
  raw_input: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  base_calories: number;
  base_protein: number;
  base_carbs: number;
  base_fats: number;
  is_verified?: boolean;
}

export interface SavedMeal {
  id: string;
  user_id: string;
  combo_name: string;
  items: SavedMealItem[];
  created_at: string;
}

export interface AIConsultation {
  id: number;
  user_id: string;
  consultation_text: string;
  created_at: string;
}
