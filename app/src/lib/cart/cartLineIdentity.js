export function normalizeLineNote(note) {
  return String(note || '').trim().replace(/\s+/g, ' ');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeIdentityNote(note) {
  return normalizeLineNote(note).toLowerCase();
}

export function normalizeSelectedOptionIds(optionIds = []) {
  return [...new Set((optionIds || []).map((id) => String(id).trim()).filter(Boolean))].sort();
}

export function buildCartLineId(productId, selectedOptionIds = [], lineNote = '') {
  const normalizedProductId = String(productId || '').trim();
  const optionPart = normalizeSelectedOptionIds(selectedOptionIds).join(',');
  const notePart = normalizeIdentityNote(lineNote);

  if (!optionPart && !notePart) {
    return normalizedProductId;
  }

  return [normalizedProductId, optionPart || 'none', notePart || 'none'].join('::');
}

export function getCartLineProductId(line) {
  return line?.productId || line?.product_id || line?.id || null;
}

export function getCartLineDisplayName(line) {
  return line?.productSnapshot?.name || line?.product_snapshot?.name || line?.name || 'Item';
}

export function getCartLineDisplayUnitPrice(line) {
  return Number(
    line?.displayUnitPrice
    ?? line?.price
    ?? line?.productSnapshot?.finalUnitPrice
    ?? line?.product_snapshot?.finalUnitPrice
    ?? line?.product_snapshot?.final_unit_price
    ?? line?.productSnapshot?.basePrice
    ?? line?.product_snapshot?.price
    ?? 0
  );
}

export function getCartLineModifierDisplay(line) {
  return line?.modifierDisplay
    || line?.modifier_display
    || line?.product_snapshot?.modifierDisplay
    || line?.product_snapshot?.modifiers
    || line?.order_item_modifier_selections
    || [];
}

export function getCartLineNote(line) {
  return normalizeLineNote(line?.lineNote || line?.line_note || line?.product_snapshot?.lineNote || '');
}

export function isConfiguredCartLine(line) {
  return normalizeSelectedOptionIds(line?.selectedOptionIds || line?.selected_option_ids).length > 0 || getCartLineNote(line).length > 0;
}

export function normalizeCartLine(line) {
  const productId = getCartLineProductId(line);
  const selectedOptionIds = normalizeSelectedOptionIds(line?.selectedOptionIds || line?.selected_option_ids || []);
  const lineNote = normalizeLineNote(line?.lineNote || line?.line_note || '');
  const displayUnitPrice = getCartLineDisplayUnitPrice(line);
  const name = getCartLineDisplayName(line);
  const lineId = line?.lineId || buildCartLineId(productId, selectedOptionIds, lineNote);

  return {
    ...line,
    id: line?.id || productId,
    lineId,
    productId,
    selectedOptionIds,
    lineNote,
    productSnapshot: line?.productSnapshot || {
      name,
      basePrice: Number(line?.price ?? line?.product_snapshot?.price ?? displayUnitPrice ?? 0),
      imageUrl: line?.images?.[0] || line?.imageUrl || line?.product_snapshot?.image || null,
      category: line?.category || null,
    },
    modifierDisplay: getCartLineModifierDisplay(line),
    displayUnitPrice,
    name,
    price: displayUnitPrice,
    quantity: Number(line?.quantity || 0),
  };
}

export function buildSimpleCartLine(product) {
  return normalizeCartLine({
    ...product,
    id: product.id,
    productId: product.id,
    lineId: buildCartLineId(product.id),
    productSnapshot: {
      name: product.name,
      basePrice: Number(product.price || 0),
      imageUrl: product.images?.[0] || product.imageUrl || null,
      category: product.category || null,
    },
    modifierDisplay: [],
    displayUnitPrice: Number(product.price || 0),
  });
}

export function buildConfiguredCartLine(product, selectedOptions = [], lineNote = '') {
  const selectedOptionIds = normalizeSelectedOptionIds(selectedOptions.map((option) => option.id));
  const displayUnitPrice = selectedOptions.reduce(
    (sum, option) => sum + Number(option.priceDelta || 0),
    Number(product.price || 0),
  );

  return normalizeCartLine({
    id: product.id,
    productId: product.id,
    store_id: product.store_id,
    quantity: 1,
    selectedOptionIds,
    lineNote,
    productSnapshot: {
      name: product.name,
      basePrice: Number(product.price || 0),
      imageUrl: product.images?.[0] || product.imageUrl || null,
      category: product.category || null,
    },
    modifierDisplay: selectedOptions.map((option) => ({
      groupName: option.groupName,
      optionName: option.name,
      priceDelta: Number(option.priceDelta || 0),
    })),
    displayUnitPrice,
    lineId: buildCartLineId(product.id, selectedOptionIds, lineNote),
    name: product.name,
    price: displayUnitPrice,
  });
}

export function hasConfiguredCartLines(items = []) {
  return (items || []).some((item) => isConfiguredCartLine(item));
}

export function hasNonUuidSelectedOptionIds(items = []) {
  return (items || []).some((item) => (
    normalizeSelectedOptionIds(item?.selectedOptionIds || item?.selected_option_ids)
      .some((optionId) => !UUID_PATTERN.test(optionId))
  ));
}

export function toOrderCreateItemPayload(line) {
  const normalizedLine = normalizeCartLine(line);
  const payload = {
    product_id: normalizedLine.productId || normalizedLine.id,
    quantity: normalizedLine.quantity,
  };

  if (isConfiguredCartLine(normalizedLine)) {
    payload.selected_option_ids = normalizeSelectedOptionIds(normalizedLine.selectedOptionIds);
    payload.line_note = normalizeLineNote(normalizedLine.lineNote) || null;
    payload.client_line_id = normalizedLine.lineId;
  }

  return payload;
}
