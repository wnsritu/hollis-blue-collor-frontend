export const saveOrderBookingState = (orderData: any) => {
  if (!orderData) return;

  const categoryId =
    orderData.category_id ||
    (orderData.service_category === "House Cleaning"
      ? 2
      : orderData.service_category === "Car Wash"
      ? 3
      : 1);

  if (categoryId === 1) {
    // ─── 1. Laundry ───
    if (orderData.service_type_id) {
      localStorage.setItem("servicetype_id", String(orderData.service_type_id));
      localStorage.setItem("laundry_serviceType", String(orderData.service_type_id));
    }
    const providerId = orderData.provider?.id || orderData.provider_id;
    if (providerId) {
      localStorage.setItem("laundry_providerId", String(providerId));
    }
    const userId = orderData.provider?.user_id || orderData.provider?.user?.id || orderData.provider_id;
    if (userId) {
      localStorage.setItem("laundry_userId", String(userId));
    }

    // Order mode (standard vs bulk)
    if (orderData.order_type === "bulk") {
      localStorage.setItem("laundry_orderMode", "bulk");
      if (orderData.bulk_order) {
        localStorage.setItem(
          "laundry_bulkOrder",
          JSON.stringify({
            weight: orderData.bulk_order.weight || 0,
            notes: orderData.bulk_order.notes || orderData.special_instructions || "",
          })
        );
      }
    } else {
      localStorage.setItem("laundry_orderMode", "standard");
      const items = orderData.items || orderData.booking_items || [];
      if (items.length > 0) {
        const mappedItems: any[] = [];
        items.forEach((item: any) => {
          const itemId = item.item_id || item.item?.id || null;
          const itemName =
            item.item?.name ||
            item.item_name ||
            item.name ||
            item.custom_item_name ||
            "Custom Item";
          const qty = Number(item.quantity) || 1;
          const serviceId = Number(item.service_id || item.service?.id) || 1;

          const existing = mappedItems.find(
            (mi) => mi.itemId === itemId && mi.item === itemName
          );
          if (existing) {
            if (!existing.services.includes(serviceId)) {
              existing.services.push(serviceId);
            }
          } else {
            mappedItems.push({
              itemId: itemId ? Number(itemId) : null,
              item: itemName,
              quantity: qty,
              services: serviceId ? [serviceId] : [1],
              notes: item.notes || item.special_instructions || "",
              isCustom: !itemId || Boolean(item.custom_item_name),
            });
          }
        });
        localStorage.setItem("laundry_orderItems", JSON.stringify(mappedItems));
      }
    }
  } else if (categoryId === 2) {
    // ─── 2. House Cleaning ───
    if (orderData.service_type_id) {
      localStorage.setItem("cleaning_serviceType", String(orderData.service_type_id));
      localStorage.setItem("servicetype_id", String(orderData.service_type_id));
    }
    const providerId = orderData.provider?.id || orderData.provider_id;
    if (providerId) {
      localStorage.setItem("cleaning_provider", String(providerId));
    }
    const items = orderData.items || orderData.booking_items || [];
    const serviceItem = items.find((i: any) => i.service_id || i.service?.id) || items[0];
    const serviceId =
      orderData.service_id ||
      serviceItem?.service_id ||
      serviceItem?.service?.id ||
      orderData.cleaning_type;
    if (serviceId) {
      localStorage.setItem("cleaning_cleaningType", String(serviceId));
    }

    const serviceName =
      serviceItem?.service?.name ||
      orderData.service_name ||
      orderData.service?.name;
    if (serviceName) {
      localStorage.setItem("cleaning_serviceName", serviceName);
    }

    let foundBedrooms = orderData.bedrooms;
    let foundBathrooms = orderData.bathrooms;
    const checkedItems: string[] = [];

    items.forEach((i: any) => {
      const rawName = i.item?.name || i.custom_item_name || i.name || "";
      const lower = rawName.toLowerCase();

      if (foundBedrooms === undefined || foundBedrooms === null) {
        if (lower.includes("studio") || lower.includes("1 bed")) {
          foundBedrooms = 1;
        } else if (lower.includes("2 bed")) {
          foundBedrooms = 2;
        } else if (lower.includes("3 bed")) {
          foundBedrooms = 3;
        } else if (lower.includes("4+") || lower.includes("4 bed")) {
          foundBedrooms = 4;
        }
      }

      if (foundBathrooms === undefined || foundBathrooms === null) {
        if (lower.includes("extra bathroom")) {
          foundBathrooms = (Number(i.quantity) || 1) + 1;
        } else if (lower.includes("bath")) {
          foundBathrooms = Number(i.quantity) || 1;
        }
      }

      if (lower.startsWith("checklist:") || lower.includes("checklist")) {
        const cleanName = rawName.replace(/^checklist:\s*/i, "").trim();
        if (cleanName && !checkedItems.includes(cleanName)) {
          checkedItems.push(cleanName);
        }
      }
    });

    if (foundBedrooms !== undefined && foundBedrooms !== null) {
      localStorage.setItem("cleaning_bedrooms", String(foundBedrooms));
    }
    if (foundBathrooms !== undefined && foundBathrooms !== null) {
      localStorage.setItem("cleaning_bathrooms", String(foundBathrooms));
    }
    if (checkedItems.length > 0) {
      localStorage.setItem("cleaning_checked", JSON.stringify(checkedItems));
    } else if (orderData.checklist_items || orderData.checklist) {
      const itemsArr = Array.isArray(orderData.checklist_items)
        ? orderData.checklist_items
        : Array.isArray(orderData.checklist)
        ? orderData.checklist
        : [];
      localStorage.setItem("cleaning_checked", JSON.stringify(itemsArr));
    }
    const addressObj = orderData.address_details || orderData.address;
    if (addressObj) {
      if (typeof addressObj === "object") {
        localStorage.setItem("cleaning_address", JSON.stringify(addressObj));
      } else if (typeof addressObj === "string") {
        localStorage.setItem("cleaning_address_search", addressObj);
      }
    }
  } else if (categoryId === 3) {
    // ─── 3. Car Wash ───
    if (orderData.service_type_id) {
      localStorage.setItem("carwash_serviceType", String(orderData.service_type_id));
      localStorage.setItem("servicetype_id", String(orderData.service_type_id));
    }
    const providerId = orderData.provider?.id || orderData.provider_id;
    if (providerId) {
      localStorage.setItem("carwash_provider", String(providerId));
    }

    const items = orderData.items || orderData.booking_items || [];

    // Find the item corresponding to vehicle type
    const vehicleItem =
      items.find((i: any) => {
        const name = (
          i.item?.name ||
          i.item_name ||
          i.name ||
          i.custom_item_name ||
          ""
        ).toLowerCase();
        return (
          name.includes("sedan") ||
          name.includes("suv") ||
          name.includes("truck") ||
          name.includes("van") ||
          name.includes("other")
        );
      }) || items[0];

    const rawVehicleName =
      orderData.vehicle_type ||
      orderData.vehicle ||
      orderData.vehicle_name ||
      vehicleItem?.item?.name ||
      vehicleItem?.item_name ||
      vehicleItem?.name ||
      vehicleItem?.custom_item_name;

    if (rawVehicleName) {
      const lower = String(rawVehicleName).toLowerCase();
      let vehicleId = "sedan";
      if (lower.includes("suv")) vehicleId = "suv";
      else if (lower.includes("truck")) vehicleId = "truck";
      else if (lower.includes("van")) vehicleId = "van";
      else if (lower.includes("other")) vehicleId = "other";
      else if (lower.includes("sedan")) vehicleId = "sedan";

      localStorage.setItem("carwash_vehicle", vehicleId);
    }

    const serviceId =
      orderData.service_id ||
      vehicleItem?.service_id ||
      vehicleItem?.service?.id ||
      items[0]?.service_id ||
      items[0]?.service?.id;

    if (serviceId) {
      localStorage.setItem("carwash_service", String(serviceId));
    }

    if (orderData.addons || orderData.booking_addons) {
      const addons = (orderData.addons || orderData.booking_addons || []).map(
        (a: any) => a.name || a.addon_name || a.addon?.name || String(a.id || a.addon_id)
      );
      localStorage.setItem("carwash_addOns", JSON.stringify(addons));
    }
    if (orderData.notes || orderData.special_instructions) {
      localStorage.setItem(
        "carwash_notes",
        orderData.notes || orderData.special_instructions
      );
    }
    if (orderData.location_type) {
      localStorage.setItem("carwash_locType", orderData.location_type);
    }
    const addressObj = orderData.address_details || orderData.address;
    if (addressObj) {
      if (typeof addressObj === "object") {
        localStorage.setItem("carwash_address", JSON.stringify(addressObj));
      } else if (typeof addressObj === "string") {
        localStorage.setItem("carwash_address_search", addressObj);
      }
    }
  }
};

export const clearLaundryBookingState = () => {
  localStorage.removeItem("servicetype_id");
  localStorage.removeItem("laundry_serviceType");
  localStorage.removeItem("laundry_userId");
  localStorage.removeItem("laundry_providerId");
  localStorage.removeItem("laundry_orderMode");
  localStorage.removeItem("laundry_orderItems");
  localStorage.removeItem("laundry_bulkOrder");
};

export const clearCleaningBookingState = () => {
  localStorage.removeItem("cleaning_serviceType");
  localStorage.removeItem("cleaning_provider");
  localStorage.removeItem("cleaning_cleaningType");
  localStorage.removeItem("cleaning_serviceName");
  localStorage.removeItem("cleaning_propertyType");
  localStorage.removeItem("cleaning_bedrooms");
  localStorage.removeItem("cleaning_bathrooms");
  localStorage.removeItem("cleaning_checked");
  localStorage.removeItem("cleaning_supplies");
  localStorage.removeItem("cleaning_pets");
  localStorage.removeItem("cleaning_petType");
  localStorage.removeItem("cleaning_instructions");
  localStorage.removeItem("cleaning_address");
  localStorage.removeItem("cleaning_address_search");
};

export const clearCarWashBookingState = () => {
  localStorage.removeItem("carwash_serviceType");
  localStorage.removeItem("carwash_provider");
  localStorage.removeItem("carwash_vehicle");
  localStorage.removeItem("carwash_service");
  localStorage.removeItem("carwash_addOns");
  localStorage.removeItem("carwash_locType");
  localStorage.removeItem("carwash_address");
  localStorage.removeItem("carwash_address_search");
  localStorage.removeItem("carwash_notes");
};

export const clearAllBookingState = () => {
  clearLaundryBookingState();
  clearCleaningBookingState();
  clearCarWashBookingState();
  localStorage.removeItem("servicetype_id");
};
