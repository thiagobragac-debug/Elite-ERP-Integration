export function filterTenants(tenantsList: any[], searchQuery: string, filterValues: any) {
  return tenantsList.filter((t) => {
    const matchesSearch =
      (t?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t?.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterValues.status === 'all' ||
      (t.status || 'Ativo').toLowerCase() === filterValues.status.toLowerCase();

    const matchesPlan =
      filterValues.plan === 'all' ||
      (t.plan || '').toLowerCase() === filterValues.plan.toLowerCase();

    const matchesUsers =
      filterValues.maxUsers >= 1000 ||
      (t.users >= filterValues.minUsers && t.users <= filterValues.maxUsers);

    const matchesDate =
      (!filterValues.dateStart ||
        (t.created_at &&
          new Date(t.created_at) >= new Date(filterValues.dateStart))) &&
      (!filterValues.dateEnd ||
        (t.created_at && new Date(t.created_at) <= new Date(filterValues.dateEnd)));

    return (
      matchesSearch && matchesStatus && matchesPlan && matchesUsers && matchesDate
    );
  });
}

export function filterPlans(plansList: any[], searchQuery: string, filterValues: any) {
  return plansList.filter((p) => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const minPrice = filterValues.minPrice ?? 0;
    const maxPrice = filterValues.maxPrice ?? 10000;
    const planPrice = Number(p.price) || 0;
    const matchesPrice = planPrice >= minPrice && planPrice <= maxPrice;

    const minUsers = filterValues.minUsers ?? 0;
    const maxUsers = filterValues.maxUsers ?? 1000;
    const planUsersLimit =
      p.users_limit === null || p.users_limit === undefined
        ? 999999
        : Number(p.users_limit);
    const matchesUsers = planUsersLimit >= minUsers && planUsersLimit <= maxUsers;

    const minStorage = filterValues.minStorage ?? 0;
    const maxStorage = filterValues.maxStorage ?? 1000;
    const planStorage = Number(p.storage_gb) || 0;
    const matchesStorage = planStorage >= minStorage && planStorage <= maxStorage;

    return matchesSearch && matchesPrice && matchesUsers && matchesStorage;
  });
}

export function filterBilling(invoicesList: any[], searchQuery: string, filterValues: any) {
  return invoicesList.filter((item) => {
    const matchesSearch =
      (item.tenants?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    let filterStatus = (filterValues.status || '').toLowerCase();
    if (filterStatus === 'atrasada') {
      filterStatus = 'atrasado';
    }
    if (filterStatus === 'paga') {
      filterStatus = 'pago';
    }
    const matchesStatus =
      filterValues.status === 'all' ||
      (item.status || '').toLowerCase() === filterStatus;

    const minPrice = filterValues.minPrice ?? 0;
    const maxPrice = filterValues.maxPrice ?? 10000;
    const invoiceAmount = Number(item.amount) || 0;
    const matchesPrice = invoiceAmount >= minPrice && invoiceAmount <= maxPrice;

    const matchesDate =
      (!filterValues.dateStart ||
        (item.due_date &&
          new Date(item.due_date) >= new Date(filterValues.dateStart))) &&
      (!filterValues.dateEnd ||
        (item.due_date && new Date(item.due_date) <= new Date(filterValues.dateEnd)));

    return matchesSearch && matchesStatus && matchesPrice && matchesDate;
  });
}

export function filterCampaigns(campaignsList: any[], searchQuery: string, filterValues: any) {
  return campaignsList.filter((camp) => {
    const matchesSearch = (camp.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Advanced Filters
    const isExpired = new Date(camp.end_date) < new Date();
    const isActive = camp.is_active && !isExpired;
    let campStatus = 'ativa';
    if (!camp.is_active) {
      campStatus = 'pausada';
    }
    if (isExpired) {
      campStatus = 'expirada';
    }

    const matchesStatus =
      filterValues.status === 'all' || campStatus === filterValues.status.toLowerCase();
    const matchesMinDiscount =
      !filterValues.minDiscount || camp.discount_percentage >= filterValues.minDiscount;
    const matchesMaxDiscount =
      filterValues.maxDiscount >= 100 ||
      filterValues.maxDiscount === undefined ||
      camp.discount_percentage <= filterValues.maxDiscount;

    const matchesDateStart =
      !filterValues.dateStart ||
      new Date(camp.start_date) >= new Date(filterValues.dateStart);
    const matchesDateEnd =
      !filterValues.dateEnd ||
      new Date(camp.end_date) <= new Date(filterValues.dateEnd);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMinDiscount &&
      matchesMaxDiscount &&
      matchesDateStart &&
      matchesDateEnd
    );
  });
}
