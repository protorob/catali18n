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
      backToCategory: 'Torna alla categoria'
    },
    cart: {
      title: 'Il Tuo Preventivo',
      empty: 'Il carrello è vuoto. Aggiungi prodotti dal catalogo per richiedere un preventivo.',
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
      actionRemove: 'Rimuovi'
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
      title: 'International Product Catalog',
      subtitle: 'Browse our premium products and request a custom quotation instantly.',
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
      backToCategory: 'Back to category'
    },
    cart: {
      title: 'Your Quotation',
      empty: 'Your cart is empty. Add products from the catalog to request a quotation.',
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
      actionRemove: 'Remove'
    }
  }
} as const;

export type Locale = 'it' | 'en';

export function getTranslations(locale: string) {
  const normalizedLocale: Locale = locale === 'en' ? 'en' : 'it';
  return translations[normalizedLocale];
}
