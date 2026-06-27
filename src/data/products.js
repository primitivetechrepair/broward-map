const products = [
  // =======================================================
  // 🌿 FLOWERS
  // =======================================================

  { id: 1, name: "Blew Nerds", image: "/products/flowers/blewnerds.jpg", category: "Flowers" },
  { id: 2, name: "Capo", image: "/products/flowers/capo.jpg", category: "Flowers" },
  { id: 3, name: "Gaslato", image: "/products/flowers/gaslato.jpg", category: "Flowers" },
  { id: 4, name: "Gaston", image: "/products/flowers/gaston.jpg", category: "Flowers" },
  { id: 5, name: "Hang 10", image: "/products/flowers/hang10.jpg", category: "Flowers" },
  { id: 6, name: "Honeybuns", image: "/products/flowers/honeybuns.jpg", category: "Flowers" },
  { id: 7, name: "Jimmy Neutron", image: "/products/flowers/jimmyneutron.jpg", category: "Flowers" },
  { id: 8, name: "King Cherry", image: "/products/flowers/kingcherry.jpg", category: "Flowers" },
  { id: 9, name: "Midnight Cherry", image: "/products/flowers/midnightcherry.jpg", category: "Flowers" },
  { id: 10, name: "Purple People Eater", image: "/products/flowers/purplepeopleeater.jpg", category: "Flowers" },
  { id: 11, name: "Purple Push-pop", image: "/products/flowers/purplepushpop.jpg", category: "Flowers" },
  { id: 12, name: "Rainman", image: "/products/flowers/rainman.jpg", category: "Flowers" },
  { id: 13, name: "Smoking Aces", image: "/products/flowers/smokingaces.jpg", category: "Flowers" },
  { id: 14, name: "Toad Venom", image: "/products/flowers/toadvenom.jpg", category: "Flowers" },
  { id: 15, name: "Wasabi", image: "/products/flowers/wasabi.jpg", category: "Flowers" },

  // =======================================================
  // 🍪 EDIBLES
  // =======================================================

  { id: 21, name: "Gummy Bears", price: 15, image: "/products/edibles/gummybears.jpg", category: "Edibles" },
  { id: 22, name: "Sour Gummies", price: 16, image: "/products/edibles/sourgummies.jpg", category: "Edibles" },
  { id: 23, name: "Chocolate Bar", price: 18, image: "/products/edibles/chocolatebar.jpg", category: "Edibles" },
  { id: 24, name: "Brownie Bite", price: 14, image: "/products/edibles/browniebites.jpg", category: "Edibles" },
  { id: 25, name: "Cookies & Cream", price: 17, image: "/products/edibles/cookiesandcream.jpg", category: "Edibles" },
  { id: 26, name: "Peach Rings", price: 15, image: "/products/edibles/peachrings.jpg", category: "Edibles" },
  { id: 27, name: "Fruit Chews", price: 16, image: "/products/edibles/fruitchews.jpg", category: "Edibles" },
  { id: 28, name: "Caramel Squares", price: 19, image: "/products/edibles/caramelsquares.jpg", category: "Edibles" },
  { id: 29, name: "Rice Crispy Treat", price: 14, image: "/products/edibles/ricecrispytreat.jpg", category: "Edibles" },
  { id: 30, name: "Hard Candy Drops", price: 13, image: "/products/edibles/hardcandydrops.jpg", category: "Edibles" },

  // =======================================================
  // 💨 DISPOSABLES
  // =======================================================

  { id: 31, name: "Pineapple Express", price: 35, image: "/products/disposables/pineappleexpress.jpg", category: "Disposables" },
  { id: 32, name: "Blue Dream", price: 38, image: "/products/disposables/bluedream.jpg", category: "Disposables" },
  { id: 33, name: "Gelato", price: 40, image: "/products/disposables/gelato.jpg", category: "Disposables" },
  { id: 34, name: "Strawberry Cough", price: 36, image: "/products/disposables/strawberrycough.jpg", category: "Disposables" },
  { id: 35, name: "OG Kush", price: 39, image: "/products/disposables/ogkush.jpg", category: "Disposables" },

  // =======================================================
  // 💨 VAPES
  // =======================================================

  { id: 36, name: "Blueberry Kush", price: 45, image: "/products/vapes/blueberrykush.jpg", category: "Vapes" },
  { id: 37, name: "Lemon Haze", price: 42, image: "/products/vapes/lemonhaze.jpg", category: "Vapes" },
  { id: 38, name: "Wedding Cake", price: 48, image: "/products/vapes/weddingcake.jpg", category: "Vapes" },
  { id: 39, name: "Grape Ape", price: 44, image: "/products/vapes/grapeape.jpg", category: "Vapes" },
  { id: 40, name: "OG Kush", price: 46, image: "/products/vapes/ogkush.jpg", category: "Vapes" },

  // =======================================================
  // 💉 SYRINGES
  // =======================================================

  { id: 19, name: "Syringe A", price: 30, image: "/products/syringes/syringea.jpg", category: "Syringes" },

  // =======================================================
  // 🧪 CONCENTRATES
  // =======================================================

  { id: 20, name: "Concentrate A", price: 35, image: "/products/concentrates/concentratea.jpg", category: "Concentrates" },

  // =======================================================
// 🧬 PEPTIDES
// =======================================================

{ id: 41, name: "Retatrutide", dose: "10 mg", price: 100, image: "/products/peptides/reta10.webp", category: "Peptides" },
{ id: 42, name: "Retatrutide", dose: "30 mg", price: 250, image: "/products/peptides/reta30.webp", category: "Peptides" },
{ id: 43, name: "Tesamorelin", dose: "10 mg", price: 100, image: "/products/peptides/tesamorelin10.webp", category: "Peptides" },
{ id: 44, name: "MOTS-c", dose: "10 mg", price: 100, image: "/products/peptides/motsc10.webp", category: "Peptides" },
{ id: 45, name: "MOTS-c", dose: "40 mg", price: 275, image: "/products/peptides/motsc40.webp", category: "Peptides" },
{ id: 46, name: "GHK-Cu", dose: "100 mg", price: 100, image: "/products/peptides/ghkcu100.webp", category: "Peptides" },
{ id: 47, name: "NAD+", dose: "1000 mg", price: 150, image: "/products/peptides/nad1000.webp", category: "Peptides" },
{ id: 48, name: "Glow Stack", dose: "70 mg", price: 250, image: "/products/peptides/glowstack70.webp", category: "Peptides" },
{ id: 49, name: "CJC-1295 / Ipamorelin", dose: "10 mg", price: 150, image: "/products/peptides/cjcipa10.webp", category: "Peptides" },
{ id: 50, name: "Kisspeptin", dose: "10 mg", price: 130, image: "/products/peptides/kisspeptin10.webp", category: "Peptides" },
{ id: 51, name: "Epithalon", dose: "50 mg", price: 175, image: "/products/peptides/epithalon50.webp", category: "Peptides" },
{ id: 52, name: "Testosterone Cypionate", dose: "250 mg", price: 120, image: "/products/peptides/testc250.webp", category: "Peptides" },
{ id: 53, name: "Testosterone Enanthate", dose: "250 mg", price: 120, image: "/products/peptides/teste250.webp", category: "Peptides" },
{ id: 54, name: "Primobolan Cypionate", dose: "200 mg", price: 250, image: "/products/peptides/primo200.webp", category: "Peptides" },
{ id: 55, name: "BPC-157", dose: "10 mg", price: 125, image: "/products/peptides/bpc15710.webp", category: "Peptides" },
];

export default products;