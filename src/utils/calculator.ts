export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'deficit' | 'maintain' | 'surplus';

export interface CalculatorData {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: GoalType;
}

export interface CalculationResult {
  bmi: number;
  bmiCategory: 'Bajo peso' | 'Normal' | 'Sobrepeso' | 'Obesidad';
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    protein: number; // grams
    fats: number; // grams
    carbs: number; // grams
  }
}

export function calculateNutritionalNeeds(data: CalculatorData): CalculationResult {
  const { weight, height, age, gender, activityLevel, goal } = data;

  // 1. Calcular BMI (IMC)
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  let bmiCategory: CalculationResult['bmiCategory'] = 'Normal';
  if (bmi < 18.5) bmiCategory = 'Bajo peso';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Sobrepeso';
  else if (bmi >= 30) bmiCategory = 'Obesidad';

  // 2. Calcular BMR (Mifflin-St Jeor)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 3. Calcular TDEE
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = bmr * activityMultipliers[activityLevel];

  // 4. Calcular Calorías Objetivo
  let targetCalories = tdee;
  if (goal === 'deficit') {
    targetCalories -= 500;
  } else if (goal === 'surplus') {
    targetCalories += 500;
  }

  // 5. Calcular Macros
  // Proteína: 2.2g por kg de peso corporal es un estándar excelente para fitness.
  const protein = Math.round(weight * 2.2);
  const proteinCalories = protein * 4;

  // Grasas: 25% de las calorías totales
  const fatsCalories = targetCalories * 0.25;
  const fats = Math.round(fatsCalories / 9);

  // Carbohidratos: El resto de las calorías
  const carbsCalories = targetCalories - proteinCalories - fatsCalories;
  // Si las calorías son muy bajas, asegurar un mínimo de carbos
  const carbs = Math.max(0, Math.round(carbsCalories / 4));

  return {
    bmi: Number(bmi.toFixed(1)),
    bmiCategory,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: {
      protein,
      fats,
      carbs
    }
  };
}
