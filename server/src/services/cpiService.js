// server/src/services/cpiService.js
const cpiData = require('../utils/cpiData.json');

/**
 * Returns the CPI data for a given listing category.
 * Returns: { data: CategoryCPI, error } 
 */
const getCPIByCategory = (category) => {
  if (!category || typeof category !== 'string') {
    return { data: null, error: 'category is required' };
  }

  const categoryData = cpiData.categories[category];

  if (!categoryData) {
    return { data: null, error: `No CPI data found for category: ${category}` };
  }

  return {
    data: {
      category,
      statssaCategory: categoryData.statssa_category,
      cpiIndex: categoryData.cpi_index,
      annualChangePercent: categoryData.annual_change_percent,
      source: cpiData.source,
      referenceDate: cpiData.reference_date,
    },
    error: null,
  };
};

/**
 * Calculates a suggested price range based on CPI index and asking price.
 * Returns: { low: number, high: number, source: string }
 */
const getSuggestedPriceRange = (askingPrice, category) => {
  const { data, error } = getCPIByCategory(category);

  if (error || !data) {
    return null;
  }

  // Adjust price range based on annual CPI change for that category
  const changeMultiplier = data.annualChangePercent / 100;
  const low = parseFloat((askingPrice * (1 - Math.abs(changeMultiplier))).toFixed(2));
  const high = parseFloat((askingPrice * (1 + Math.abs(changeMultiplier))).toFixed(2));

  return {
    low,
    high,
    cpiIndex: data.cpiIndex,
    annualChangePercent: data.annualChangePercent,
    source: data.source,
    referenceDate: data.referenceDate,
  };
};

module.exports = { getCPIByCategory, getSuggestedPriceRange };