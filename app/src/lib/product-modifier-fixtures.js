export const MOCK_PRODUCT_MODIFIERS = {
  '1': [
    {
      id: 'drink-group',
      name: 'Choose a drink',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: 'coke', name: 'Coke', priceDelta: 0 },
        { id: 'sprite', name: 'Sprite', priceDelta: 0 },
        { id: 'water', name: 'Water', priceDelta: 0 },
      ],
    },
    {
      id: 'extras-group',
      name: 'Extras',
      required: false,
      minSelect: 0,
      maxSelect: 3,
      options: [
        { id: 'cheese', name: 'Extra cheese', priceDelta: 0.5 },
        { id: 'sauce', name: 'Extra sauce', priceDelta: 0.3 },
      ],
    },
  ],
};

export function getMockProductModifierGroups(product) {
  if (!product?.id) return [];
  return MOCK_PRODUCT_MODIFIERS[product.id] || [];
}
