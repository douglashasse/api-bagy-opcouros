function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickImage(image) {
  if (!image || typeof image !== 'object') return null;
  return {
    id: image.id,
    src: image.src,
    alt: image.alt || '',
    position: image.position
  };
}

function pickCategory(category) {
  if (!category || typeof category !== 'object') return null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    breadcrumb: category.breadcrumb,
    url: category.url
  };
}

function pickVariation(variation, product) {
  return {
    id: variation.id,
    product_id: variation.product_id,
    reference: variation.reference,
    sku: variation.sku,
    price: variation.price ?? product.price,
    price_compare: variation.price_compare ?? product.price_compare,
    special_price: variation.special_price ?? null,
    balance: variation.balance,
    reserved_balance: variation.reserved_balance,
    active: variation.active,
    url: variation.url || product.url,
    color: variation.color?.name || null,
    attribute: variation.attribute?.name || null,
    attribute_secondary: variation.attribute_secondary?.name || null
  };
}

function pickFeature(feature) {
  return {
    id: feature.id,
    name: feature.name,
    slug: feature.slug,
    values: Array.isArray(feature.values)
      ? feature.values.map((value) => ({
          id: value.id,
          name: value.name,
          slug: value.slug
        }))
      : []
  };
}

export function sanitizeProduct(product) {
  if (!product || typeof product !== 'object') return product;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    reference: product.reference,
    sku: product.sku,
    url: product.url,
    active: product.active,
    kit: product.kit,
    is_virtual: product.is_virtual,
    is_pre_sale: product.is_pre_sale,
    description: stripHtml(product.description),
    short_description: stripHtml(product.short_description || product.meta_description),
    price: product.price,
    price_compare: product.price_compare,
    billet_discount: product.billet_discount,
    warranty: product.warranty,
    brand: product.brand?.name || product.brand || null,
    category_default: pickCategory(product.category_default),
    categories: Array.isArray(product.categories) ? product.categories.map(pickCategory).filter(Boolean) : [],
    images: Array.isArray(product.images) ? product.images.map(pickImage).filter(Boolean) : [],
    features: Array.isArray(product.features) ? product.features.map(pickFeature) : [],
    variations: Array.isArray(product.variations)
      ? product.variations.map((variation) => pickVariation(variation, product))
      : [],
    dimensions: {
      weight: product.weight,
      depth: product.depth,
      width: product.width,
      height: product.height
    },
    created_at: product.created_at,
    updated_at: product.updated_at
  };
}

export function sanitizeProductResponse(payload) {
  if (Array.isArray(payload)) return payload.map(sanitizeProduct);
  if (!payload || typeof payload !== 'object') return payload;

  const products = Array.isArray(payload.data)
    ? payload.data.map(sanitizeProduct)
    : payload.data
      ? sanitizeProduct(payload.data)
      : undefined;

  return {
    data: products,
    links: payload.links,
    meta: payload.meta
  };
}

export function sanitizeSettings(settings) {
  if (!settings || typeof settings !== 'object') return settings;

  return {
    id: settings.id,
    name: settings.name,
    slug: settings.slug,
    active: settings.active,
    phrase: settings.phrase,
    description: settings.description,
    keywords: settings.keywords,
    domain: settings.domain,
    dooca_domain: settings.dooca_domain,
    ssl: settings.ssl,
    organization: settings.organization,
    platform_version: settings.platform_version,
    products_count: settings.products_count,
    checkout_options: {
      phone: settings.checkout_options?.phone,
      color_primary: settings.checkout_options?.color_primary,
      use_promotions: settings.checkout_options?.use_promotions,
      use_storefront: settings.checkout_options?.use_storefront
    },
    shipping_time_additional: settings.shipping_time_additional,
    shipping_time_additional_kit: settings.shipping_time_additional_kit,
    updated_at: settings.updated_at
  };
}
