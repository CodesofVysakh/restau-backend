import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: await bcrypt.hash('ember2024!', 12) },
  });
  console.log('  ✓ Admin: admin / ember2024!');

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'appetizers' },    update: {}, create: { name: 'Appetizers',      slug: 'appetizers',    displayOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'soups-salads' },  update: {}, create: { name: 'Soups & Salads',  slug: 'soups-salads',  displayOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'main-course' },   update: {}, create: { name: 'Main Course',     slug: 'main-course',   displayOrder: 3 } }),
    prisma.category.upsert({ where: { slug: 'pasta-risotto' }, update: {}, create: { name: 'Pasta & Risotto', slug: 'pasta-risotto', displayOrder: 4 } }),
    prisma.category.upsert({ where: { slug: 'desserts' },      update: {}, create: { name: 'Desserts',        slug: 'desserts',      displayOrder: 5 } }),
    prisma.category.upsert({ where: { slug: 'beverages' },     update: {}, create: { name: 'Beverages',       slug: 'beverages',     displayOrder: 6 } }),
  ]);
  const [apps, soups, mains, pasta, desserts, beverages] = categories;
  console.log(`  ✓ ${categories.length} categories`);

  const items = [
    { categoryId: apps.id,      name: 'Burrata & Heirloom Tomato',   description: 'Creamy burrata with heirloom tomatoes, basil oil, balsamic, and grilled crostini.',       imageUrl: 'https://images.unsplash.com/photo-1582673937754-8d0cfed5dcc9?w=600&q=80', basePrice: 16.00, prepTimeMins: 8,  stockQuantity: 25, dietaryTags: ['vegetarian', 'gluten-free'] },
    { categoryId: apps.id,      name: 'Crispy Calamari',             description: 'Golden-fried calamari rings with lemon aioli, marinara, and fresh chilli.',              imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', basePrice: 14.50, prepTimeMins: 10, stockQuantity: 30, dietaryTags: [] },
    { categoryId: apps.id,      name: 'Truffle Arancini',            description: 'Saffron risotto balls filled with truffle pecorino, served with roasted tomato sauce.',    imageUrl: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&q=80', basePrice: 13.00, prepTimeMins: 12, stockQuantity: 20, dietaryTags: ['vegetarian'] },
    { categoryId: apps.id,      name: 'Tuna Tartare',               description: 'Sushi-grade bluefin tuna with avocado, pickled cucumber, sesame, and wonton crisps.',     imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80', basePrice: 19.00, prepTimeMins: 10, stockQuantity: 15, dietaryTags: ['gluten-free'] },
    { categoryId: soups.id,     name: 'French Onion Soup',           description: 'Slow-caramelised onion broth topped with Gruyère crouton, gratinéed to perfection.',      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80', basePrice: 12.00, prepTimeMins: 8,  stockQuantity: 20, dietaryTags: ['vegetarian'] },
    { categoryId: soups.id,     name: 'Caesar Salad',               description: 'Romaine hearts, house Caesar dressing, Parmigiano shavings, croutons, and anchovies.',    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80', basePrice: 13.50, prepTimeMins: 7,  stockQuantity: 35, dietaryTags: [] },
    { categoryId: soups.id,     name: 'Roasted Beetroot & Feta',    description: 'Golden and candy beet with whipped feta, candied walnuts, and honey-lemon dressing.',     imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', basePrice: 14.00, prepTimeMins: 6,  stockQuantity: 25, dietaryTags: ['vegetarian', 'gluten-free'] },
    { categoryId: mains.id,     name: 'Dry-Aged Ribeye (300g)',      description: '28-day dry-aged prime ribeye with bone marrow butter, watercress, and hand-cut fries.',   imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80', basePrice: 52.00, prepTimeMins: 20, stockQuantity: 12, dietaryTags: ['gluten-free'] },
    { categoryId: mains.id,     name: 'Pan-Seared Sea Bass',        description: 'Line-caught sea bass with saffron cauliflower purée, samphire, and caper brown butter.',  imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80', basePrice: 38.00, prepTimeMins: 18, stockQuantity: 15, dietaryTags: ['gluten-free'] },
    { categoryId: mains.id,     name: 'Roasted Chicken Supreme',    description: 'Free-range chicken supreme, truffle jus, wild mushroom fricassee, dauphinoise.',          imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80', basePrice: 32.00, prepTimeMins: 22, stockQuantity: 20, dietaryTags: ['gluten-free'] },
    { categoryId: mains.id,     name: 'Wild Mushroom Wellington',   description: 'Portobello duxelles in golden puff pastry with red wine jus and roasted roots.',          imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80', basePrice: 28.00, prepTimeMins: 25, stockQuantity: 10, dietaryTags: ['vegan'] },
    { categoryId: pasta.id,     name: 'Spaghetti alle Vongole',     description: 'Fresh spaghetti, Palourde clams, white wine, garlic, chilli, and flat-leaf parsley.',      imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80', basePrice: 26.00, prepTimeMins: 15, stockQuantity: 20, dietaryTags: [] },
    { categoryId: pasta.id,     name: 'Porcini Risotto',            description: 'Carnaroli risotto with porcini, fresh thyme, Parmigiano-Reggiano, and truffle oil.',       imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80', basePrice: 24.00, prepTimeMins: 18, stockQuantity: 18, dietaryTags: ['vegetarian', 'gluten-free'] },
    { categoryId: pasta.id,     name: 'Lobster Tagliatelle',        description: 'Hand-rolled egg tagliatelle, half Boston lobster, bisque cream, tarragon, and dill.',     imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80', basePrice: 44.00, prepTimeMins: 20, stockQuantity: 8,  dietaryTags: [] },
    { categoryId: desserts.id,  name: 'Valrhona Chocolate Fondant', description: 'Warm dark chocolate fondant, salted caramel centre, vanilla ice cream, cocoa tuile.',      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80', basePrice: 12.00, prepTimeMins: 12, stockQuantity: 20, dietaryTags: ['vegetarian'] },
    { categoryId: desserts.id,  name: 'Crème Brûlée',              description: 'Tahitian vanilla crème brûlée, caramelised sugar crust, and fresh seasonal berries.',     imageUrl: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&q=80', basePrice: 10.00, prepTimeMins: 5,  stockQuantity: 25, dietaryTags: ['vegetarian', 'gluten-free'] },
    { categoryId: desserts.id,  name: 'Tiramisu',                   description: 'House-made tiramisu with Savoiardi, espresso, Kahlúa, and mascarpone. 72% cacao.',         imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', basePrice: 11.00, prepTimeMins: 5,  stockQuantity: 20, dietaryTags: ['vegetarian'] },
    { categoryId: beverages.id, name: 'Fresh Orange Juice',         description: 'Cold-pressed Valencia oranges, served immediately. No sugar added.',                       imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=80', basePrice: 6.50,  prepTimeMins: 3,  stockQuantity: 50, dietaryTags: ['vegan', 'gluten-free'] },
    { categoryId: beverages.id, name: 'San Pellegrino (750ml)',     description: 'Naturally sparkling Italian mineral water.',                                               imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80', basePrice: 5.00,  prepTimeMins: 1,  stockQuantity: 100, dietaryTags: ['vegan', 'gluten-free'] },
    { categoryId: beverages.id, name: 'Espresso Martini',           description: 'Freshly brewed espresso shaken with Kahlúa, vodka, and vanilla. Served ice cold.',         imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', basePrice: 14.00, prepTimeMins: 5,  stockQuantity: 40, dietaryTags: ['vegan', 'gluten-free'] },
  ];

  let created = 0;
  for (const item of items) {
    const exists = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!exists) { await prisma.menuItem.create({ data: item }); created++; }
  }
  console.log(`  ✓ ${created} menu items`);

  const ribeye = await prisma.menuItem.findFirst({ where: { name: 'Dry-Aged Ribeye (300g)' } });
  if (ribeye) {
    const eg = await prisma.customizationGroup.findFirst({ where: { menuItemId: ribeye.id, name: 'Doneness' } });
    if (!eg) {
      await prisma.customizationGroup.create({ data: { menuItemId: ribeye.id, name: 'Doneness', required: true, maxSelections: 1, options: { create: [{ label: 'Rare', priceDelta: 0 }, { label: 'Medium Rare', priceDelta: 0 }, { label: 'Medium', priceDelta: 0 }, { label: 'Well Done', priceDelta: 0 }] } } });
      await prisma.customizationGroup.create({ data: { menuItemId: ribeye.id, name: 'Sauce', required: false, maxSelections: 1, options: { create: [{ label: 'Peppercorn sauce', priceDelta: 3.50 }, { label: 'Béarnaise', priceDelta: 3.50 }, { label: 'No sauce', priceDelta: 0 }] } } });
    }
  }

  const caesar = await prisma.menuItem.findFirst({ where: { name: 'Caesar Salad' } });
  if (caesar) {
    const eg = await prisma.customizationGroup.findFirst({ where: { menuItemId: caesar.id } });
    if (!eg) {
      await prisma.customizationGroup.create({ data: { menuItemId: caesar.id, name: 'Add protein', required: false, maxSelections: 1, options: { create: [{ label: 'Grilled chicken', priceDelta: 6.00 }, { label: 'Grilled prawns', priceDelta: 8.00 }, { label: 'No protein', priceDelta: 0 }] } } });
    }
  }
  console.log('  ✓ Customization groups');

  console.log('\n✅ Done! Login: admin / ember2024!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
