export const translations = {
  it: {
    nav: {
      home: 'Home',
      about: 'Chi Siamo',
      terms: 'Termini',
      catalog: 'Scarica Catalogo',
      contact: 'Contatti',
      login: 'Accedi',
      cart: 'Carrello',
      menu: 'Menu',
      categories: 'Categorie'
    },
    footer: {
      contactInfo: 'Informazioni di Contatto',
      address: 'Via Roma 10, Milano (MI)',
      phone: 'Tel: +39 02 1234567',
      email: 'Email: info@catali18n.com',
      themeLight: 'Chiaro',
      themeDark: 'Scuro',
      themeLabel: 'Tema'
    },
    hero: {
      title: 'Catalogo Prodotti Internazionale',
      subtitle: 'Sfoglia i nostri prodotti premium e richiedi un preventivo personalizzato immediato.',
      cta: 'Esplora Categorie'
    },
    product: {
      sku: 'SKU',
      ean: 'EAN',
      category: 'Categoria',
      addToQuote: 'Aggiungi al Preventivo',
      quantity: 'Quantità',
      inCart: 'Nel carrello',
      related: 'Prodotti correlati',
      backToCategory: 'Torna alla categoria',
      viewProduct: 'Vedi Prodotto',
      productDetails: 'Dettagli Prodotto',
      noProductsInCategory: 'Nessun prodotto disponibile in questa categoria.',
      browseCatalog: 'Sfoglia Catalogo',
      featuredProducts: 'Prodotti in Evidenza',
      browseProductsSub: 'Sfoglia i prodotti raggruppati per applicazione o divisione',
      featuredProductsSub: 'Componenti industriali evidenziati e best-seller',
      added: 'Aggiunto',
      specifications: 'Specifiche Tecniche',
      dimensions: 'Dimensioni (L×P×H)',
      grossWeight: 'Peso Lordo',
      netWeight: 'Peso Netto',
      unitsPerCarton: 'Pz per Cartone',
      cartonDimensions: 'Dim. Cartone (L×P×H)',
      cartonWeight: 'Peso Cartone',
      gallery: 'Galleria Immagini'
    },
    cart: {
      title: 'Il Tuo Preventivo',
      titleQuick: 'Carrello Rapido',
      empty: 'Il carrello è vuoto. Aggiungi prodotti dal catalogo per richiedere un preventivo.',
      emptyQuick: 'Il carrello è vuoto.',
      submit: 'Invia Richiesta di Preventivo',
      name: 'Nome Completo',
      email: 'Indirizzo Email',
      company: 'Nome Azienda',
      address: 'Indirizzo Azienda',
      phone: 'Numero di Telefono',
      notes: 'Note Aggiuntive',
      success: 'Richiesta di preventivo inviata con successo!',
      item: 'Articolo',
      qty: 'Qtà',
      totalItems: 'Articoli totali',
      actionRemove: 'Rimuovi',
      requestQuote: 'Richiedi Preventivo',
      backToCatalog: 'Torna al Catalogo',
      requestDetails: 'Dettagli Richiesta',
      successSubtitle: 'Il nostro team vendite analizzerà la tua richiesta e ti contatterà al più presto.',
      backToHome: 'Torna alla Home',
      sending: 'Invio in corso...'
    }
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About Us',
      terms: 'Terms',
      catalog: 'Download Catalog',
      contact: 'Contact',
      login: 'Login',
      cart: 'Cart',
      menu: 'Menu',
      categories: 'Categories'
    },
    footer: {
      contactInfo: 'Contact Information',
      address: 'Via Roma 10, Milan (MI), Italy',
      phone: 'Phone: +39 02 1234567',
      email: 'Email: info@catali18n.com',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeLabel: 'Theme'
    },
    hero: {
      title: 'Premium Italian Food Supply & Private Label',
      subtitle: 'The Flavors of Italy, Tailored for Your Business. Delivered in Days. Custom mixed pallets. Low-minimum private label. Guaranteed 48-hour quotes.',
      cta: 'Explore Categories'
    },
    product: {
      sku: 'SKU',
      ean: 'EAN',
      category: 'Category',
      addToQuote: 'Add to Quotation',
      quantity: 'Quantity',
      inCart: 'In cart',
      related: 'Related Products',
      backToCategory: 'Back to category',
      viewProduct: 'View Product',
      productDetails: 'Product Details',
      noProductsInCategory: 'No products available in this category.',
      browseCatalog: 'Browse Catalog',
      featuredProducts: 'Featured Products',
      browseProductsSub: 'Browse products grouped by application or division',
      featuredProductsSub: 'Highlighted industrial components and best-sellers',
      added: 'Added',
      specifications: 'Technical Specifications',
      dimensions: 'Dimensions (W×D×H)',
      grossWeight: 'Gross Weight',
      netWeight: 'Net Weight',
      unitsPerCarton: 'Units per Carton',
      cartonDimensions: 'Carton Dim. (W×D×H)',
      cartonWeight: 'Carton Weight',
      gallery: 'Image Gallery'
    },
    cart: {
      title: 'Your Quotation',
      titleQuick: 'Quick Cart',
      empty: 'Your cart is empty. Add products from the catalog to request a quotation.',
      emptyQuick: 'Your cart is empty.',
      submit: 'Send Quotation Request',
      name: 'Full Name',
      email: 'Email Address',
      company: 'Company Name',
      address: 'Company Address',
      phone: 'Phone Number',
      notes: 'Additional Notes',
      success: 'Quotation request sent successfully!',
      item: 'Item',
      qty: 'Qty',
      totalItems: 'Total items',
      actionRemove: 'Remove',
      requestQuote: 'Request Quotation',
      backToCatalog: 'Back to Catalog',
      requestDetails: 'Request Details',
      successSubtitle: 'Our sales team will analyze your request and get back to you shortly.',
      backToHome: 'Back to Home',
      sending: 'Sending...'
    }
  }
} as const;

export type Locale = 'it' | 'en';

export function getTranslations(locale: string) {
  const normalizedLocale: Locale = locale === 'en' ? 'en' : 'it';
  return translations[normalizedLocale];
}
