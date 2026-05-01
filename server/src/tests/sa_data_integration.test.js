// tests/sa_data_integration.test.js
const { getCPIByCategory, getSuggestedPriceRange } = require('../services/cpiService');

describe('SA Data Integration — Stats SA CPI', () => {

  describe('getCPIByCategory', () => {

    test('Given a valid category, when fetched, then CPI data is returned', () => {
      const { data, error } = getCPIByCategory('Electronics');
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.cpiIndex).toBeGreaterThan(0);
    });

    test('Given a valid category, when fetched, then source references Stats SA', () => {
      const { data } = getCPIByCategory('Textbooks');
      expect(data.source).toMatch(/Statistics South Africa/i);
    });

    test('Given each listing category, when fetched, then CPI data exists for all', () => {
      const categories = ['Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Other'];
      categories.forEach((category) => {
        const { data, error } = getCPIByCategory(category);
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });

    test('Given an invalid category, when fetched, then an error is returned', () => {
      const { data, error } = getCPIByCategory('Groceries');
      expect(data).toBeNull();
      expect(error).toMatch(/No CPI data found/i);
    });

    test('Given a null category, when fetched, then an error is returned', () => {
      const { data, error } = getCPIByCategory(null);
      expect(data).toBeNull();
      expect(error).toBe('category is required');
    });

  });

  describe('getSuggestedPriceRange', () => {

    test('Given a valid price and category, when calculated, then a price range is returned', () => {
      const result = getSuggestedPriceRange(1000, 'Electronics');
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('low');
      expect(result).toHaveProperty('high');
    });

    test('Given a valid price and category, when calculated, then low is less than high', () => {
      const result = getSuggestedPriceRange(500, 'Furniture');
      expect(result.low).toBeLessThan(result.high);
    });

    test('Given a valid price and category, when calculated, then result references Stats SA source', () => {
      const result = getSuggestedPriceRange(200, 'Textbooks');
      expect(result.source).toMatch(/Statistics South Africa/i);
    });

    test('Given an invalid category, when calculated, then null is returned', () => {
      const result = getSuggestedPriceRange(500, 'Groceries');
      expect(result).toBeNull();
    });

  });

});