const { Food, FoodLog, CustomFood } = require('../models');
const { Op } = require('sequelize');

const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// Helper: search USDA FoodData Central API
async function searchUSDA(query) {
  try {
    const response = await fetch(`${USDA_SEARCH_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=15&dataType=Foundation,SR%20Legacy`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.foods) return [];

    return data.foods.map(food => {
      // Extract key nutrients from the foodNutrients array
      const getNutrient = (id) => {
        const n = food.foodNutrients?.find(n => n.nutrientId === id);
        return n ? Math.round(n.value * 10) / 10 : null;
      };

      return {
        fdcId: food.fdcId,
        name: food.description,
        calories: getNutrient(1008) || 0,        // Energy (kcal)
        protein: getNutrient(1003),               // Protein (g)
        carbs: getNutrient(1005),                 // Carbohydrate (g)
        fat: getNutrient(1004),                   // Total fat (g)
        fiber: getNutrient(1079),                 // Fiber (g)
        servingSize: 100,
        servingUnit: 'g',
        source: 'usda'
      };
    });
  } catch (err) {
    console.error('USDA API error:', err.message);
    return [];
  }
}

// GET /food/search
exports.searchFood = async (req, res) => {
  const query = req.query.q || '';
  try {
    let results = [];

    if (query) {
      // Search local database first
      const localResults = await Food.findAll({
        where: { name: { [Op.like]: `%${query}%` } },
        limit: 10
      });

      // Search user's custom foods if they're premium
      let customResults = [];
      if (req.session.user && (req.session.user.role === 'premium' || req.session.user.role === 'admin')) {
        customResults = await CustomFood.findAll({
          where: {
            userId: req.session.user.id,
            name: { [Op.like]: `%${query}%` }
          },
          limit: 5
        });
      }

      // Search USDA API
      const usdaResults = await searchUSDA(query);

      // Combine results: local first, then custom, then USDA
      results = [
        ...localResults.map(f => ({
          id: f.id,
          name: f.name,
          calories: f.calories,
          servingSize: f.servingSize,
          servingUnit: f.servingUnit,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          fiber: f.fiber,
          source: 'local'
        })),
        ...customResults.map(f => ({
          id: `custom-${f.id}`,
          name: f.name,
          calories: f.calories,
          servingSize: f.servingSize,
          servingUnit: f.servingUnit,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          fiber: f.fiber,
          source: 'custom'
        })),
        ...usdaResults.map(f => ({
          id: `usda-${f.fdcId}`,
          name: f.name,
          calories: f.calories,
          servingSize: f.servingSize,
          servingUnit: f.servingUnit,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          fiber: f.fiber,
          source: 'usda',
          fdcId: f.fdcId
        }))
      ];
    }

    res.render('food/search', { results, query, selectedFood: null });
  } catch (err) {
    console.error(err);
    res.render('food/search', { results: [], query, selectedFood: null, error: 'Search failed.' });
  }
};

// GET /food/:id
exports.getFoodDetail = async (req, res) => {
  const query = req.query.q || '';
  const id = req.params.id;
  try {
    let selectedFood = null;

    if (id.startsWith('usda-')) {
      // Fetch from USDA API
      const fdcId = id.replace('usda-', '');
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`);
      if (response.ok) {
        const data = await response.json();
        const getNutrient = (id) => {
          const n = data.foodNutrients?.find(n => (n.nutrient?.id || n.nutrientId) === id);
          return n ? Math.round((n.amount || n.value || 0) * 10) / 10 : null;
        };
        selectedFood = {
          id: `usda-${fdcId}`,
          name: data.description,
          calories: getNutrient(1008) || 0,
          protein: getNutrient(1003),
          carbs: getNutrient(1005),
          fat: getNutrient(1004),
          fiber: getNutrient(1079),
          servingSize: 100,
          servingUnit: 'g',
          source: 'usda',
          fdcId: fdcId
        };
      }
    } else if (id.startsWith('custom-')) {
      // Fetch custom food
      const customId = id.replace('custom-', '');
      const custom = await CustomFood.findOne({
        where: { id: customId, userId: req.session.user.id }
      });
      if (custom) {
        selectedFood = {
          id: `custom-${custom.id}`,
          name: custom.name,
          calories: custom.calories,
          protein: custom.protein,
          carbs: custom.carbs,
          fat: custom.fat,
          fiber: custom.fiber,
          servingSize: custom.servingSize,
          servingUnit: custom.servingUnit,
          source: 'custom'
        };
      }
    } else {
      // Local food
      const food = await Food.findByPk(id);
      if (food) {
        selectedFood = {
          id: food.id,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          servingSize: food.servingSize,
          servingUnit: food.servingUnit,
          source: 'local'
        };
      }
    }

    if (!selectedFood) return res.redirect('/food/search');

    // Re-run search to keep results visible
    let results = [];
    if (query) {
      const localResults = await Food.findAll({
        where: { name: { [Op.like]: `%${query}%` } }, limit: 10
      });
      const usdaResults = await searchUSDA(query);
      results = [
        ...localResults.map(f => ({ id: f.id, name: f.name, calories: f.calories, servingSize: f.servingSize, servingUnit: f.servingUnit, source: 'local' })),
        ...usdaResults.map(f => ({ id: `usda-${f.fdcId}`, name: f.name, calories: f.calories, servingSize: f.servingSize, servingUnit: f.servingUnit, source: 'usda' }))
      ];
    }

    res.render('food/search', { results, query, selectedFood });
  } catch (err) {
    console.error(err);
    res.redirect('/food/search');
  }
};

// POST /food/log
exports.logFood = async (req, res) => {
  const { foodId, servings, mealType, foodName, foodCalories, foodServingSize, foodServingUnit, foodProtein, foodCarbs, foodFat, foodFiber, foodSource } = req.body;
  try {
    let food;

    if (foodSource === 'usda' || foodSource === 'custom') {
      // For USDA or custom foods, find or create a local Food record so we have a proper foreign key
      const [localFood] = await Food.findOrCreate({
        where: { name: foodName, calories: parseInt(foodCalories) },
        defaults: {
          name: foodName,
          calories: parseInt(foodCalories),
          servingSize: parseFloat(foodServingSize) || 100,
          servingUnit: foodServingUnit || 'g',
          protein: foodProtein ? parseFloat(foodProtein) : null,
          carbs: foodCarbs ? parseFloat(foodCarbs) : null,
          fat: foodFat ? parseFloat(foodFat) : null,
          fiber: foodFiber ? parseFloat(foodFiber) : null
        }
      });
      food = localFood;
    } else {
      food = await Food.findByPk(foodId);
    }

    if (!food) return res.redirect('/food/search');

    const totalCalories = Math.round(food.calories * parseFloat(servings));
    const today = new Date().toISOString().split('T')[0];

    await FoodLog.create({
      userId: req.session.user.id,
      foodId: food.id,
      servings: parseFloat(servings),
      mealType,
      totalCalories,
      logDate: today
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/food/search');
  }
};
