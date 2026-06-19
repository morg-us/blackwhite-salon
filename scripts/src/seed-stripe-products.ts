import { getUncachableStripeClient } from './stripeClient.js';

const PRODUCTS = [
  {
    name: "Argan Yağı Şampuanı",
    description: "Fas'tan ithal saf argan yağı içeren profesyonel saç bakım şampuanı. 300ml.",
    price: 45000, // 450 TL in kuruş
    metadata: { category: "sac-bakimi", featured: "true" },
  },
  {
    name: "Keratin Saç Maskesi",
    description: "Yoğun nem ve keratin ile hasar görmüş saçları onaran profesyonel maske. 200ml.",
    price: 38000,
    metadata: { category: "sac-bakimi", featured: "true" },
  },
  {
    name: "Kalıcı Oje Seti",
    description: "15 renk seçeneği ile 3 hafta boyunca parlak kalan profesyonel kalıcı oje koleksiyonu.",
    price: 32000,
    metadata: { category: "tirnak", featured: "false" },
  },
  {
    name: "Cilt Bakım Serumu",
    description: "Hyaluronik asit ve C vitamini içeren premium cilt nemlendirici serum. 30ml.",
    price: 68000,
    metadata: { category: "cilt-bakimi", featured: "true" },
  },
  {
    name: "Saç Koruma Spreyi",
    description: "Isıdan koruyan ve parlaklık veren profesyonel saç spreyi. UV filtreli. 200ml.",
    price: 29000,
    metadata: { category: "sac-bakimi", featured: "false" },
  },
  {
    name: "El & Ayak Bakım Seti",
    description: "Krem, losyon ve tırnak bakım yağı içeren lüks el ve ayak bakım hediye seti.",
    price: 55000,
    metadata: { category: "hediye", featured: "true" },
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("🔌 Stripe bağlantısı kuruldu");

  for (const p of PRODUCTS) {
    // Check if already exists
    const existing = await stripe.products.search({ query: `name:'${p.name}' AND active:'true'` });
    if (existing.data.length > 0) {
      console.log(`✓ Mevcut: ${p.name} (${existing.data[0].id})`);
      continue;
    }

    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      metadata: p.metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.price,
      currency: "try",
    });

    console.log(`✅ Oluşturuldu: ${p.name} → ${price.id} (${(p.price / 100).toFixed(0)} TL)`);
  }

  console.log("\n🎉 Stripe ürünleri hazır! Webhook otomatik olarak DB'ye sync edecek.");
}

seedProducts().catch(err => {
  console.error("❌ Hata:", err.message);
  process.exit(1);
});
