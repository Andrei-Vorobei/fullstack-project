export const CATEGORY_NAMES: Record<string, string> = {
  beauty: 'Красота',
  fragrances: 'Парфюмерия',
  furniture: 'Мебель',
  groceries: 'Продукты питания',
  'home-decoration': 'Товары для дома',
  'kitchen-accessories': 'Кухонные принадлежности',
  laptops: 'Ноутбуки',
  'mens-shirts': 'Мужские рубашки',
  'mens-shoes': 'Мужская обувь',
  'mens-watches': 'Мужские часы',
  'mobile-accessories': 'Аксессуары для телефонов',
  motorcycle: 'Мотоциклы',
  'skin-care': 'Уход за кожей',
  smartphones: 'Смартфоны',
  'sports-accessories': 'Спортивные аксессуары',
  sunglasses: 'Солнцезащитные очки',
  tablets: 'Планшеты',
  tops: 'Топы',
  vehicle: 'Автомобили',
  'womens-bags': 'Женские сумки',
  'womens-dresses': 'Женские платья',
  'womens-jewellery': 'Женские украшения',
  'womens-shoes': 'Женская обувь',
  'womens-watches': 'Женские часы',
};

export const getCategoryName = (slug: string): string =>
  CATEGORY_NAMES[slug] ?? slug;
