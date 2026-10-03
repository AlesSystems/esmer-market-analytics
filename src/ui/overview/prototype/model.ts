export type Layer = "sales" | "cost" | "expenses";
export type VariantProps = {
  selected: Layer;
  onSelect: (layer: Layer) => void;
  onInspect: (section: string) => void;
};
export const fixture = {
  period: "Eylül 2025", cutoff: "30.09.2025", netSales: "1.248.600", comparison: "+%8,4",
  coveredSales: "1.186.170", cost: "912.450", gross: "273.720", margin: "%23,08", coverage: "%95",
  excluded: "62.430", expenses: "Henüz sağlanmadı", documents: "3.842", basket: "324,99",
  days: [30,34,29,39,43,61,52,32,38,35,40,48,63,57,39,46,44,51,54,69,63,47,50,48,58,62,77,69,53,63],
  products: [
    {name:"Süt ve kahvaltılık",sales:"324.636",share:26,gross:"71.200"},
    {name:"Temel gıda",sales:"299.664",share:24,gross:"63.480"},
    {name:"İçecekler",sales:"237.234",share:19,gross:"48.620"},
    {name:"Temizlik ve bakım",sales:"212.262",share:17,gross:"54.100"},
    {name:"Diğer",sales:"174.804",share:14,gross:"36.320"},
  ],
} as const;
export const layers: {id:Layer;label:string;detail:string}[] = [
  {id:"sales",label:"Satış",detail:"Net satış · 1.248.600 ₺. Kayıtlı KDV hariç, müşteri iadeleri düşülmüş."},
  {id:"cost",label:"Maliyet",detail:"Tarihsel tahmini maliyet · 912.450 ₺. Satışların %95’i kapsanıyor; eksik maliyet sıfır değildir."},
  {id:"expenses",label:"Gider",detail:"Gider verileri eksik. Faaliyet kârı hesaplanamıyor."},
];
