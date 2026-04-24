const { FoodLog, Food, User, CustomFood } = require("../models");
const { Op } = require("sequelize");

// ============================================================
// UC-008: Upgrade to Premium
// ============================================================

// GET /premium/upgrade
exports.getUpgrade = (req, res) => {
  if (
    req.session.user.role === "premium" ||
    req.session.user.role === "admin"
  ) {
    return res.redirect("/dashboard");
  }
  res.render("premium/upgrade", { error: null });
};

// POST /premium/upgrade
exports.postUpgrade = async (req, res) => {
  const { cardNumber, cardExpiry, cardCvc, cardName } = req.body;
  try {
    // Validate payment fields are present
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      return res.render("premium/upgrade", {
        error: "Please fill in all payment fields.",
      });
    }

    // Basic card number validation (must be 13-19 digits)
    const digitsOnly = cardNumber.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(digitsOnly)) {
      return res.render("premium/upgrade", {
        error: "Please enter a valid card number.",
      });
    }

    // Simulate payment processing (always succeeds for demo)
    const last4 = digitsOnly.slice(-4);
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    await User.update(
      {
        role: "premium",
        premiumSince: now,
        nextBillingDate: nextBilling.toISOString().split("T")[0],
        cancelAtPeriodEnd: false,
        paymentLast4: last4,
      },
      { where: { id: req.session.user.id } },
    );

    req.session.user.role = "premium";
    res.redirect("/dashboard?upgraded=1");
  } catch (err) {
    console.error(err);
    res.render("premium/upgrade", {
      error:
        "Payment could not be processed. Please double check your payment information and try again.",
    });
  }
};

// ============================================================
// UC-007: View Food Log History (30-Day History Page)
// ============================================================

// GET /premium/history
exports.getHistory = async (req, res) => {
  try {
    const searchDate = req.query.date || null;
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const logs = await FoodLog.findAll({
      where: {
        userId: req.session.user.id,
        logDate: { [Op.in]: dates },
      },
      include: [{ model: Food }],
    });

    let history = dates.map((date) => {
      const dayLogs = logs.filter((l) => l.logDate === date);
      const totalCalories = dayLogs.reduce(
        (sum, l) => sum + l.totalCalories,
        0,
      );

      // Calculate macro totals for premium users
      let totalProtein = 0,
        totalCarbs = 0,
        totalFat = 0,
        totalFiber = 0;
      dayLogs.forEach((l) => {
        if (l.Food) {
          const s = l.servings;
          totalProtein += (l.Food.protein || 0) * s;
          totalCarbs += (l.Food.carbs || 0) * s;
          totalFat += (l.Food.fat || 0) * s;
          totalFiber += (l.Food.fiber || 0) * s;
        }
      });

      return {
        date,
        totalCalories,
        entryCount: dayLogs.length,
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        totalFiber: Math.round(totalFiber * 10) / 10,
      };
    });

    // If a search date is provided, filter to just that date
    if (searchDate) {
      history = history.filter((h) => h.date === searchDate);
    }

    res.render("premium/history", { history, searchDate, error: null });
  } catch (err) {
    console.error(err);
    res.render("premium/history", {
      history: [],
      searchDate: null,
      error: "Could not load history.",
    });
  }
};

// ============================================================
// UC-007 continued: Food Log Page (single day detail)
// ============================================================

// GET /premium/history/:date
exports.getDayLog = async (req, res) => {
  const { date } = req.params;
  try {
    const logs = await FoodLog.findAll({
      where: { userId: req.session.user.id, logDate: date },
      include: [{ model: Food }],
      order: [["createdAt", "ASC"]],
    });

    const totalCalories = logs.reduce((sum, l) => sum + l.totalCalories, 0);

    // Calculate macro totals
    let totalProtein = 0,
      totalCarbs = 0,
      totalFat = 0,
      totalFiber = 0;
    logs.forEach((l) => {
      if (l.Food) {
        const s = l.servings;
        totalProtein += (l.Food.protein || 0) * s;
        totalCarbs += (l.Food.carbs || 0) * s;
        totalFat += (l.Food.fat || 0) * s;
        totalFiber += (l.Food.fiber || 0) * s;
      }
    });

    const macros = {
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
    };

    const isPremium =
      req.session.user.role === "premium" || req.session.user.role === "admin";

    res.render("premium/day-log", {
      logs,
      totalCalories,
      macros,
      date,
      isPremium,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/premium/history");
  }
};

// ============================================================
// UC-011: Edit Food Log Entry
// ============================================================

// POST /premium/history/:date/edit/:id
exports.editLogEntry = async (req, res) => {
  const { date, id } = req.params;
  const { servings, mealType } = req.body;
  try {
    const log = await FoodLog.findOne({
      where: { id, userId: req.session.user.id },
      include: [{ model: Food }],
    });
    if (!log) return res.redirect(`/premium/history/${date}`);

    const newServings = parseFloat(servings);
    if (!newServings || newServings <= 0 || isNaN(newServings)) {
      return res.redirect(`/premium/history/${date}?error=invalid_servings`);
    }

    const totalCalories = Math.round(log.Food.calories * newServings);
    await log.update({ servings: newServings, mealType, totalCalories });

    res.redirect(`/premium/history/${date}?success=updated`);
  } catch (err) {
    console.error(err);
    res.redirect(`/premium/history/${date}`);
  }
};

// ============================================================
// UC-011: Delete Food Log Entry
// ============================================================

// POST /premium/history/:date/delete/:id
exports.deleteLogEntry = async (req, res) => {
  const { date, id } = req.params;
  try {
    const log = await FoodLog.findOne({
      where: { id, userId: req.session.user.id },
    });
    if (!log) return res.redirect(`/premium/history/${date}`);

    await log.destroy();
    res.redirect(`/premium/history/${date}?success=deleted`);
  } catch (err) {
    console.error(err);
    res.redirect(`/premium/history/${date}`);
  }
};

// ============================================================
// UC-009: Manage Premium Subscription
// ============================================================

// GET /premium/subscription
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user) {
      return res.render("premium/manage-subscription", {
        subscription: null,
        error:
          "Unable to load subscription information. Please refresh or try again later.",
        success: null,
      });
    }
    res.render("premium/manage-subscription", {
      subscription: {
        plan: "Premium",
        premiumSince: user.premiumSince,
        nextBillingDate: user.nextBillingDate,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        paymentLast4: user.paymentLast4 || "••••",
      },
      error: null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("premium/manage-subscription", {
      subscription: null,
      error:
        "Unable to load subscription information. Please refresh or try again later.",
      success: null,
    });
  }
};

// POST /premium/subscription/cancel
exports.cancelSubscription = async (req, res) => {
  try {
    await User.update(
      { cancelAtPeriodEnd: true },
      { where: { id: req.session.user.id } },
    );
    res.redirect("/premium/subscription?success=cancelled");
  } catch (err) {
    console.error(err);
    res.redirect("/premium/subscription?error=cancel_failed");
  }
};

// ============================================================
// UC-012: Add Custom Food
// ============================================================

// GET /premium/custom-foods
exports.getCustomFoods = async (req, res) => {
  try {
    const customFoods = await CustomFood.findAll({
      where: { userId: req.session.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.render("premium/add-custom-food", {
      customFoods,
      editFood: null,
      error: null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("premium/add-custom-food", {
      customFoods: [],
      editFood: null,
      error: "Could not load custom foods.",
      success: null,
    });
  }
};

// POST /premium/custom-foods
exports.postCustomFood = async (req, res) => {
  const {
    name,
    calories,
    servingSize,
    servingUnit,
    protein,
    carbs,
    fat,
    fiber,
  } = req.body;
  try {
    if (!name || !calories || !servingSize || !servingUnit) {
      const customFoods = await CustomFood.findAll({
        where: { userId: req.session.user.id },
        order: [["createdAt", "DESC"]],
      });
      return res.render("premium/add-custom-food", {
        customFoods,
        editFood: null,
        error: "All fields are required.",
        success: null,
      });
    }

    await CustomFood.create({
      userId: req.session.user.id,
      name,
      calories: parseInt(calories),
      servingSize: parseFloat(servingSize),
      servingUnit,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
    });

    res.redirect("/premium/custom-foods?success=created");
  } catch (err) {
    console.error(err);
    const customFoods = await CustomFood.findAll({
      where: { userId: req.session.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.render("premium/add-custom-food", {
      customFoods,
      editFood: null,
      error: "Could not create custom food. Please check all fields.",
      success: null,
    });
  }
};

// GET /premium/custom-foods/:id/edit
exports.getEditCustomFood = async (req, res) => {
  try {
    const editFood = await CustomFood.findOne({
      where: { id: req.params.id, userId: req.session.user.id },
    });
    if (!editFood) return res.redirect("/premium/custom-foods");

    const customFoods = await CustomFood.findAll({
      where: { userId: req.session.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.render("premium/add-custom-food", {
      customFoods,
      editFood,
      error: null,
      success: null,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/premium/custom-foods");
  }
};

// POST /premium/custom-foods/:id
exports.updateCustomFood = async (req, res) => {
  const {
    name,
    calories,
    servingSize,
    servingUnit,
    protein,
    carbs,
    fat,
    fiber,
  } = req.body;
  try {
    if (!name || !calories || !servingSize || !servingUnit) {
      return res.redirect(`/premium/custom-foods/${req.params.id}/edit`);
    }

    await CustomFood.update(
      {
        name,
        calories: parseInt(calories),
        servingSize: parseFloat(servingSize),
        servingUnit,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: parseFloat(fiber) || 0,
      },
      {
        where: { id: req.params.id, userId: req.session.user.id },
      },
    );

    res.redirect("/premium/custom-foods?success=updated");
  } catch (err) {
    console.error(err);
    res.redirect("/premium/custom-foods");
  }
};

// POST /premium/custom-foods/:id/delete
exports.deleteCustomFood = async (req, res) => {
  try {
    await CustomFood.destroy({
      where: { id: req.params.id, userId: req.session.user.id },
    });
    res.redirect("/premium/custom-foods?success=deleted");
  } catch (err) {
    console.error(err);
    res.redirect("/premium/custom-foods");
  }
};
