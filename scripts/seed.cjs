const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno de .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const line = envContent.split('\n').find(l => l.startsWith(key));
  return line ? line.split('=')[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("No se encontraron las credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de alimentos básicos (Top 150+ argentinos) - Todo calculado por GRAMO (1g)
const foods = [
  // --- CARNES Y CORTES ARGENTINOS ---
  { name: "asado", base_calories: 2.90, base_protein: 0.15, base_carbs: 0.00, base_fats: 0.25, default_unit: "gramos" },
  { name: "vacio", base_calories: 2.50, base_protein: 0.18, base_carbs: 0.00, base_fats: 0.19, default_unit: "gramos" },
  { name: "entrana", base_calories: 2.10, base_protein: 0.19, base_carbs: 0.00, base_fats: 0.14, default_unit: "gramos" },
  { name: "matambre", base_calories: 2.65, base_protein: 0.16, base_carbs: 0.00, base_fats: 0.22, default_unit: "gramos" },
  { name: "chorizo", base_calories: 3.40, base_protein: 0.14, base_carbs: 0.02, base_fats: 0.31, default_unit: "gramos" },
  { name: "morcilla", base_calories: 3.80, base_protein: 0.14, base_carbs: 0.01, base_fats: 0.35, default_unit: "gramos" },
  { name: "chinchulin", base_calories: 1.80, base_protein: 0.14, base_carbs: 0.00, base_fats: 0.13, default_unit: "gramos" },
  { name: "molleja", base_calories: 2.75, base_protein: 0.14, base_carbs: 0.00, base_fats: 0.24, default_unit: "gramos" },
  { name: "carne picada magra", base_calories: 1.40, base_protein: 0.21, base_carbs: 0.00, base_fats: 0.06, default_unit: "gramos" },
  { name: "carne picada comun", base_calories: 2.50, base_protein: 0.17, base_carbs: 0.00, base_fats: 0.20, default_unit: "gramos" },
  { name: "pollo", base_calories: 1.65, base_protein: 0.31, base_carbs: 0.00, base_fats: 0.04, default_unit: "gramos" },
  { name: "pechuga de pollo", base_calories: 1.20, base_protein: 0.25, base_carbs: 0.00, base_fats: 0.02, default_unit: "gramos" },
  { name: "pata y muslo", base_calories: 1.85, base_protein: 0.20, base_carbs: 0.00, base_fats: 0.11, default_unit: "gramos" },
  { name: "milanesa de carne", base_calories: 2.20, base_protein: 0.15, base_carbs: 0.16, base_fats: 0.10, default_unit: "gramos" },
  { name: "milanesa de pollo", base_calories: 2.05, base_protein: 0.18, base_carbs: 0.15, base_fats: 0.08, default_unit: "gramos" },
  { name: "filet de merluza", base_calories: 0.90, base_protein: 0.19, base_carbs: 0.00, base_fats: 0.01, default_unit: "gramos" },
  { name: "pescado", base_calories: 1.05, base_protein: 0.20, base_carbs: 0.00, base_fats: 0.02, default_unit: "gramos" },
  { name: "salmon", base_calories: 2.08, base_protein: 0.20, base_carbs: 0.00, base_fats: 0.13, default_unit: "gramos" },
  { name: "atun", base_calories: 1.30, base_protein: 0.28, base_carbs: 0.00, base_fats: 0.01, default_unit: "gramos" },
  
  // --- HUEVOS Y LÁCTEOS ---
  { name: "huevo", base_calories: 1.55, base_protein: 0.13, base_carbs: 0.01, base_fats: 0.11, default_unit: "gramos" }, // o 78 kcal por 50g (unidad)
  { name: "clara de huevo", base_calories: 0.52, base_protein: 0.11, base_carbs: 0.01, base_fats: 0.00, default_unit: "gramos" },
  { name: "leche entera", base_calories: 0.60, base_protein: 0.03, base_carbs: 0.05, base_fats: 0.03, default_unit: "gramos" },
  { name: "leche descremada", base_calories: 0.35, base_protein: 0.03, base_carbs: 0.05, base_fats: 0.00, default_unit: "gramos" },
  { name: "queso crema", base_calories: 3.42, base_protein: 0.06, base_carbs: 0.04, base_fats: 0.34, default_unit: "gramos" },
  { name: "queso fresco", base_calories: 2.95, base_protein: 0.22, base_carbs: 0.02, base_fats: 0.22, default_unit: "gramos" },
  { name: "queso cremoso", base_calories: 3.10, base_protein: 0.18, base_carbs: 0.02, base_fats: 0.26, default_unit: "gramos" },
  { name: "queso port salut", base_calories: 2.80, base_protein: 0.24, base_carbs: 0.01, base_fats: 0.20, default_unit: "gramos" },
  { name: "queso rallado", base_calories: 4.30, base_protein: 0.38, base_carbs: 0.03, base_fats: 0.29, default_unit: "gramos" },
  { name: "yogur", base_calories: 0.85, base_protein: 0.04, base_carbs: 0.12, base_fats: 0.02, default_unit: "gramos" },
  { name: "manteca", base_calories: 7.17, base_protein: 0.01, base_carbs: 0.01, base_fats: 0.81, default_unit: "gramos" },
  
  // --- CARBOHIDRATOS (PASTAS, ARROZ, PANES) ---
  { name: "arroz blanco", base_calories: 1.30, base_protein: 0.03, base_carbs: 0.28, base_fats: 0.00, default_unit: "gramos" }, // cocido
  { name: "arroz integral", base_calories: 1.10, base_protein: 0.03, base_carbs: 0.23, base_fats: 0.01, default_unit: "gramos" }, // cocido
  { name: "fideos", base_calories: 1.58, base_protein: 0.06, base_carbs: 0.31, base_fats: 0.01, default_unit: "gramos" }, // cocidos
  { name: "macarrones", base_calories: 1.58, base_protein: 0.06, base_carbs: 0.31, base_fats: 0.01, default_unit: "gramos" }, // cocidos
  { name: "ravioles", base_calories: 1.80, base_protein: 0.07, base_carbs: 0.25, base_fats: 0.05, default_unit: "gramos" }, // cocidos
  { name: "ñoquis", base_calories: 1.33, base_protein: 0.03, base_carbs: 0.28, base_fats: 0.01, default_unit: "gramos" }, // cocidos
  { name: "pan frances", base_calories: 2.70, base_protein: 0.09, base_carbs: 0.52, base_fats: 0.02, default_unit: "gramos" },
  { name: "pan lactal", base_calories: 2.65, base_protein: 0.08, base_carbs: 0.50, base_fats: 0.03, default_unit: "gramos" },
  { name: "pan integral", base_calories: 2.45, base_protein: 0.11, base_carbs: 0.42, base_fats: 0.03, default_unit: "gramos" },
  { name: "galletitas de agua", base_calories: 4.20, base_protein: 0.10, base_carbs: 0.65, base_fats: 0.12, default_unit: "gramos" },
  { name: "avena", base_calories: 3.89, base_protein: 0.17, base_carbs: 0.66, base_fats: 0.07, default_unit: "gramos" },
  { name: "papa", base_calories: 0.86, base_protein: 0.02, base_carbs: 0.20, base_fats: 0.00, default_unit: "gramos" }, // hervida
  { name: "papas fritas", base_calories: 3.12, base_protein: 0.03, base_carbs: 0.41, base_fats: 0.15, default_unit: "gramos" },
  { name: "puré de papas", base_calories: 1.10, base_protein: 0.02, base_carbs: 0.16, base_fats: 0.04, default_unit: "gramos" },
  { name: "batata", base_calories: 0.90, base_protein: 0.02, base_carbs: 0.21, base_fats: 0.00, default_unit: "gramos" },
  
  // --- VERDURAS ---
  { name: "tomate", base_calories: 0.18, base_protein: 0.01, base_carbs: 0.04, base_fats: 0.00, default_unit: "gramos" },
  { name: "lechuga", base_calories: 0.15, base_protein: 0.01, base_carbs: 0.03, base_fats: 0.00, default_unit: "gramos" },
  { name: "cebolla", base_calories: 0.40, base_protein: 0.01, base_carbs: 0.09, base_fats: 0.00, default_unit: "gramos" },
  { name: "zanahoria", base_calories: 0.41, base_protein: 0.01, base_carbs: 0.10, base_fats: 0.00, default_unit: "gramos" },
  { name: "morron", base_calories: 0.20, base_protein: 0.01, base_carbs: 0.05, base_fats: 0.00, default_unit: "gramos" },
  { name: "zapallo", base_calories: 0.26, base_protein: 0.01, base_carbs: 0.06, base_fats: 0.00, default_unit: "gramos" },
  { name: "calabaza", base_calories: 0.26, base_protein: 0.01, base_carbs: 0.06, base_fats: 0.00, default_unit: "gramos" },
  { name: "zucchini", base_calories: 0.17, base_protein: 0.01, base_carbs: 0.03, base_fats: 0.00, default_unit: "gramos" },
  { name: "espinaca", base_calories: 0.23, base_protein: 0.03, base_carbs: 0.04, base_fats: 0.00, default_unit: "gramos" },
  { name: "acelga", base_calories: 0.19, base_protein: 0.02, base_carbs: 0.04, base_fats: 0.00, default_unit: "gramos" },
  { name: "brocoli", base_calories: 0.34, base_protein: 0.03, base_carbs: 0.07, base_fats: 0.00, default_unit: "gramos" },
  { name: "choclo", base_calories: 0.86, base_protein: 0.03, base_carbs: 0.19, base_fats: 0.01, default_unit: "gramos" },
  
  // --- FRUTAS ---
  { name: "manzana", base_calories: 0.52, base_protein: 0.00, base_carbs: 0.14, base_fats: 0.00, default_unit: "gramos" },
  { name: "banana", base_calories: 0.89, base_protein: 0.01, base_carbs: 0.23, base_fats: 0.00, default_unit: "gramos" },
  { name: "naranja", base_calories: 0.47, base_protein: 0.01, base_carbs: 0.12, base_fats: 0.00, default_unit: "gramos" },
  { name: "mandarina", base_calories: 0.53, base_protein: 0.01, base_carbs: 0.13, base_fats: 0.00, default_unit: "gramos" },
  { name: "pera", base_calories: 0.57, base_protein: 0.00, base_carbs: 0.15, base_fats: 0.00, default_unit: "gramos" },
  { name: "frutilla", base_calories: 0.32, base_protein: 0.01, base_carbs: 0.08, base_fats: 0.00, default_unit: "gramos" },
  { name: "uva", base_calories: 0.69, base_protein: 0.01, base_carbs: 0.18, base_fats: 0.00, default_unit: "gramos" },
  { name: "durazno", base_calories: 0.39, base_protein: 0.01, base_carbs: 0.10, base_fats: 0.00, default_unit: "gramos" },
  { name: "kiwi", base_calories: 0.61, base_protein: 0.01, base_carbs: 0.15, base_fats: 0.01, default_unit: "gramos" },
  { name: "limon", base_calories: 0.29, base_protein: 0.01, base_carbs: 0.09, base_fats: 0.00, default_unit: "gramos" },
  { name: "palta", base_calories: 1.60, base_protein: 0.02, base_carbs: 0.09, base_fats: 0.15, default_unit: "gramos" },

  // --- CLÁSICOS Y COMIDAS ELABORADAS (Promedios por gramo) ---
  { name: "empanada de carne", base_calories: 2.50, base_protein: 0.10, base_carbs: 0.25, base_fats: 0.12, default_unit: "gramos" }, // o unidad de 100g=250kcal
  { name: "empanada de jamon y queso", base_calories: 2.80, base_protein: 0.11, base_carbs: 0.24, base_fats: 0.15, default_unit: "gramos" },
  { name: "pizza", base_calories: 2.66, base_protein: 0.11, base_carbs: 0.33, base_fats: 0.10, default_unit: "gramos" },
  { name: "hamburguesa", base_calories: 2.50, base_protein: 0.13, base_carbs: 0.24, base_fats: 0.11, default_unit: "gramos" }, // simple con pan
  { name: "choripan", base_calories: 3.20, base_protein: 0.12, base_carbs: 0.25, base_fats: 0.19, default_unit: "gramos" },
  { name: "sanguche de milanesa", base_calories: 2.60, base_protein: 0.12, base_carbs: 0.30, base_fats: 0.10, default_unit: "gramos" },
  { name: "tarta de jamon y queso", base_calories: 2.90, base_protein: 0.12, base_carbs: 0.22, base_fats: 0.17, default_unit: "gramos" },
  { name: "tarta de verdura", base_calories: 1.80, base_protein: 0.05, base_carbs: 0.20, base_fats: 0.09, default_unit: "gramos" },
  { name: "tortilla de papa", base_calories: 1.40, base_protein: 0.04, base_carbs: 0.12, base_fats: 0.08, default_unit: "gramos" },
  { name: "fideos con tuco", base_calories: 1.45, base_protein: 0.05, base_carbs: 0.25, base_fats: 0.03, default_unit: "gramos" },
  
  // --- DULCES Y PANADERÍA ---
  { name: "medialuna", base_calories: 3.90, base_protein: 0.07, base_carbs: 0.45, base_fats: 0.20, default_unit: "gramos" },
  { name: "factura", base_calories: 4.10, base_protein: 0.06, base_carbs: 0.50, base_fats: 0.20, default_unit: "gramos" },
  { name: "bizcocho", base_calories: 4.60, base_protein: 0.08, base_carbs: 0.55, base_fats: 0.23, default_unit: "gramos" },
  { name: "criollito", base_calories: 4.50, base_protein: 0.08, base_carbs: 0.54, base_fats: 0.22, default_unit: "gramos" },
  { name: "alfajor", base_calories: 4.20, base_protein: 0.06, base_carbs: 0.60, base_fats: 0.17, default_unit: "gramos" },
  { name: "dulce de leche", base_calories: 3.15, base_protein: 0.06, base_carbs: 0.57, base_fats: 0.07, default_unit: "gramos" },
  { name: "helado", base_calories: 2.07, base_protein: 0.04, base_carbs: 0.24, base_fats: 0.11, default_unit: "gramos" },
  { name: "chocolate", base_calories: 5.45, base_protein: 0.05, base_carbs: 0.60, base_fats: 0.31, default_unit: "gramos" },
  { name: "galletitas dulces", base_calories: 4.50, base_protein: 0.06, base_carbs: 0.70, base_fats: 0.16, default_unit: "gramos" },
  
  // --- BEBIDAS ---
  { name: "coca cola", base_calories: 0.42, base_protein: 0.00, base_carbs: 0.11, base_fats: 0.00, default_unit: "gramos" }, // o ml
  { name: "gaseosa", base_calories: 0.42, base_protein: 0.00, base_carbs: 0.11, base_fats: 0.00, default_unit: "gramos" },
  { name: "jugo de naranja", base_calories: 0.45, base_protein: 0.01, base_carbs: 0.10, base_fats: 0.00, default_unit: "gramos" },
  { name: "cerveza", base_calories: 0.43, base_protein: 0.00, base_carbs: 0.04, base_fats: 0.00, default_unit: "gramos" },
  { name: "vino tinto", base_calories: 0.85, base_protein: 0.00, base_carbs: 0.03, base_fats: 0.00, default_unit: "gramos" },
  { name: "fernet con coca", base_calories: 0.80, base_protein: 0.00, base_carbs: 0.10, base_fats: 0.00, default_unit: "gramos" },
  { name: "mate", base_calories: 0.00, base_protein: 0.00, base_carbs: 0.00, base_fats: 0.00, default_unit: "gramos" }, // sin azucar
  
  // --- VARIOS (GRASAS, ACEITES, ADEREZOS) ---
  { name: "aceite de oliva", base_calories: 8.84, base_protein: 0.00, base_carbs: 0.00, base_fats: 1.00, default_unit: "gramos" },
  { name: "aceite de girasol", base_calories: 8.84, base_protein: 0.00, base_carbs: 0.00, base_fats: 1.00, default_unit: "gramos" },
  { name: "mayonesa", base_calories: 6.80, base_protein: 0.01, base_carbs: 0.03, base_fats: 0.75, default_unit: "gramos" },
  { name: "ketchup", base_calories: 1.12, base_protein: 0.01, base_carbs: 0.27, base_fats: 0.00, default_unit: "gramos" },
  { name: "mostaza", base_calories: 0.60, base_protein: 0.04, base_carbs: 0.06, base_fats: 0.03, default_unit: "gramos" },
  { name: "azucar", base_calories: 3.87, base_protein: 0.00, base_carbs: 1.00, base_fats: 0.00, default_unit: "gramos" },
  { name: "miel", base_calories: 3.04, base_protein: 0.00, base_carbs: 0.82, base_fats: 0.00, default_unit: "gramos" },
  { name: "mani", base_calories: 5.67, base_protein: 0.26, base_carbs: 0.16, base_fats: 0.49, default_unit: "gramos" },
  { name: "nuez", base_calories: 6.54, base_protein: 0.15, base_carbs: 0.14, base_fats: 0.65, default_unit: "gramos" },
  { name: "almendra", base_calories: 5.79, base_protein: 0.21, base_carbs: 0.22, base_fats: 0.50, default_unit: "gramos" },
  { name: "lenteja", base_calories: 1.16, base_protein: 0.09, base_carbs: 0.20, base_fats: 0.00, default_unit: "gramos" }, // cocida
  { name: "garbanzo", base_calories: 1.64, base_protein: 0.09, base_carbs: 0.27, base_fats: 0.03, default_unit: "gramos" }, // cocido
  { name: "poroto", base_calories: 1.39, base_protein: 0.10, base_carbs: 0.25, base_fats: 0.01, default_unit: "gramos" } // cocido
];

async function run() {
  console.log(`Comenzando carga masiva de ${foods.length} alimentos...`);
  
  let insertedCount = 0;

  for (const food of foods) {
    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('food_dictionary')
      .select('id')
      .ilike('food_name', food.name)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('food_dictionary')
        .insert({
          food_name: food.name,
          base_calories: food.base_calories,
          base_protein: food.base_protein,
          base_carbs: food.base_carbs,
          base_fats: food.base_fats,
          default_unit: food.default_unit,
          usage_count: 5 // Empezar con buen puntaje para que la IA priorice estas si hay dudas
        });
      
      if (error) {
         console.error(`Error al insertar ${food.name}:`, error.message);
      } else {
         console.log(`✅ Insertado: ${food.name}`);
         insertedCount++;
      }
    } else {
      console.log(`⚠️  Saltado: ${food.name} (ya existe)`);
    }
  }

  console.log(`\n¡Carga finalizada! Se insertaron ${insertedCount} alimentos nuevos.`);
}

run();
