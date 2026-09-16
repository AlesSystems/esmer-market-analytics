export type SourceRule = {
  status: "unsupported";
  evidence: "historical-audit-only";
  population: string;
  consequence: "block-metric" | "covered-subset" | "reject-import";
  warning: string;
};

const unsupported = (
  population: string,
  consequence: SourceRule["consequence"],
  warning: string,
): SourceRule => ({ status: "unsupported", evidence: "historical-audit-only", population, consequence, warning });

export const sourceContract = {
  version: "source-contract-v1",
  sourceEvidence: "revalidation-required",
  evidenceReference: "docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md",
  rules: {
    documentInclusion: unsupported("Every financial dictionary type, including unlisted types", "block-metric", "Dictionary meanings do not establish financial inclusion."),
    saleIdentity: unsupported("Types 2, 11 and 35", "block-metric", "Reused receipt keys and absent exact matches do not resolve economic identity."),
    historicalCost: unsupported("Sales and customer returns with absent, zero, negative or unvalidated snapshots", "covered-subset", "Historical last-purchase evidence is an estimate; no current-price fallback."),
    units: unsupported("All quantity, multiplier and cost-unit combinations", "block-metric", "Fractional quantities and unknown units require independently validated conversion."),
    moneyBasis: unsupported("All net, gross, recorded KDV and cost values", "block-metric", "Recorded rates are not legal-rate validation; preserve anomalies."),
    discounts: unsupported("Header and line discounts and charges", "block-metric", "No validated reconciliation or allocation rule exists."),
    rounding: unsupported("Source amounts and quantities", "block-metric", "Preserve decimal strings; synthetic rounding assumptions do not set source precision."),
    returnAttribution: unsupported("Customer returns, including types 4, 8 and 12", "covered-subset", "Unsupported original-sale cost attribution excludes that cost population."),
    conversions: unsupported("Invoice/dispatch pairs 1/5, 3/7 and 4/8", "block-metric", "Conflicting flags and links cannot silently choose or duplicate an event."),
    businessDate: unsupported("Source timestamps and reporting periods", "block-metric", "Market-local dates require evidence independent of machine timezone."),
    sourceIdentity: unsupported("Source IDs across snapshots and resets", "reject-import", "Declare lineage; an ID is not economic identity or a complete change feed."),
    columnMapping: unsupported("Actual source schema and allowlisted streams", "reject-import", "Unaudited column names cannot be invented or selected wholesale."),
    supplierScope: unsupported("Purchasing counterparties", "block-metric", "Shared CARI rows and STOK.CARI do not establish a supplier display allowlist."),
  },
  policies: {
    basket: "Completed sale net after discounts, excluding separately issued returns, divided by completed sale-document count.",
    costCoverage: "Covered sales and costs use the same IDs. Absolute net exposure is the percentage denominator; signed sales and returns remain separate.",
    operatingHeadline: "Require full supported cost, reconciled sales, resolved expense treatment and owner-confirmed expense completeness. Historical cost remains estimated.",
    reportPreservation: "Source refresh preserves app-owned revisions and accepted reports pinned to dataset, mapping and calculation versions.",
  },
  policyEvidence: "approved-product-contract",
  documentTypes: [
    ["1", "Alış faturası"], ["2", "Satış faturası"],
    ["3", "Alıştan iade faturası"], ["4", "Satıştan iade faturası"],
    ["5", "Alış irsaliyesi"], ["7", "Alıştan iade irsaliyesi"],
    ["8", "Satıştan iade irsaliyesi"], ["11", "Perakende satış fişi"],
    ["12", "Perakende satış iade fişi"], ["15", "Stok tüketimi"],
    ["16", "Stok firesi"], ["17", "Stok sayımı"], ["35", "Perakende satış faturası"],
  ],
  unknownDocumentType: {
    status: "unsupported",
    consequence: "reject-import",
    warning: "Unknown essential document semantics cannot enter a financially complete candidate.",
  },
  auditedRawCandidates: {
    FIS: ["ID", "YAZAR_KASA_FIS_NO"],
    FIS_DETAY: ["BELGE_TARIHINDEKI_SON_ALIS_FIYATI", "BIRIM_MALIYET", "LOKASYON_MALIYETI", "FATRALANDIRILMIS_IRSALIYEMI"],
    FIS_ARSIV: ["SILME_TARIHI"],
    FIS_POS: ["KASA_Z", "KASA_FIS"],
  },
  rawCandidateStatus: "historical-observation-not-extraction-allowlist",
  privacy: {
    excluded: ["customer-identity", "contact", "address", "tax-identity", "loyalty", "personnel", "raw-change-sql", "credentials", "employee-payroll"],
    labour: "aggregated-month-only",
    suppliers: "purchasing-counterparties-only-pending-column-review",
  },
  syntheticColumns: {
    sale: ["id", "kind", "documentId", "quantity", "unit", "unitNet", "discountPercent", "net", "kdv", "gross", "cost", "date", "documentType", "status"],
    return: ["id", "kind", "documentId", "quantity", "unit", "net", "cost", "linkedId", "date"],
    replacement: ["id", "kind", "cost", "revision"],
    expense: ["id", "kind", "net", "date", "paidDate", "classification", "kdvTreatment", "revision"],
    conversion: ["id", "kind", "documentId", "documentType", "linkedId", "eventId", "net", "status"],
    adjustment: ["id", "kind", "targetId", "net", "revision"],
    setting: ["id", "kind", "value", "revision"],
    audit: ["id", "kind", "targetId", "revision"],
    report: ["id", "kind", "datasetId", "mappingVersion", "calculationVersion", "appRevision", "net"],
    context: ["id", "kind", "status", "value", "net", "cost", "quantity", "unit", "date", "documentType", "linkedId"],
    supplier: ["id", "kind", "name", "purchaseDocumentId"],
  },
} as const;
