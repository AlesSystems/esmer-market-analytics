import type { MonthProfitTotals } from "../../source/month-profit";
import { count, isZeroDecimal, money } from "../format";
import { ChevronDownIcon } from "../icons";
import { Popover } from "../shell/Popover";

export function GrossProfitExplanation({ totals }: { totals: MonthProfitTotals }) {
  const { knownCostSales, cost, grossProfit, unknownCostSales, unknownCostProducts, unknownSaleAmounts } = totals;
  return (
    <Popover buttonClass="link" dialogLabel="Nasıl hesaplandı" panelClass="pop-gross" label={<>Nasıl hesaplandı?<ChevronDownIcon/></>}>
      {cost !== null && grossProfit !== null ? (
        <dl className="gross-calculation">
          <div><dt>Maliyetini hesaplayabildiğimiz satışlar</dt><dd>{money(knownCostSales)}</dd></div>
          <div><dt>Bu satışların tahmini ürün maliyeti</dt><dd>− {money(cost)}</dd></div>
          <div><dt>Tahmini brüt kâr</dt><dd>= {money(grossProfit)}</dd></div>
        </dl>
      ) : <p>Bu ay maliyetini hesaplayabildiğimiz satış olmadığı için brüt kâr hesaplanamadı.</p>}
      {(unknownCostProducts > 0 || !isZeroDecimal(unknownCostSales)) && (
        <p>{money(unknownCostSales)}’lik satışın maliyetini hesaplayamadığımız için bu satışları kâr hesabının dışında bıraktık.</p>
      )}
      {unknownSaleAmounts > 0 && <p>{count(unknownSaleAmounts)} satış kaydının tutarı bilinmiyor.</p>}
    </Popover>
  );
}
