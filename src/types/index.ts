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
  created_at: string;
}

export interface GeminiFoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
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
