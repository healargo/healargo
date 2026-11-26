"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_COPY } from "@/constants/business";
import type { BusinessProductOption } from "@/types/business";

export function BusinessProductField({
  products,
  productId,
  productName,
  onChange,
}: {
  products: BusinessProductOption[];
  productId: string;
  productName: string;
  onChange: (next: { productId: string; productName: string }) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="business-product-catalog">
          {BUSINESS_COPY.productCatalog}
        </Label>
        <select
          id="business-product-catalog"
          className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={productId}
          onChange={(e) => {
            const id = e.target.value;
            const match = products.find((p) => p._id === id);
            onChange({
              productId: id,
              productName: match?.name ?? productName,
            });
          }}
        >
          <option value="">{BUSINESS_COPY.productNone}</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="business-product-custom">
          {BUSINESS_COPY.productCustom}
        </Label>
        <Input
          id="business-product-custom"
          className="mt-1.5"
          placeholder={BUSINESS_COPY.productCustomPlaceholder}
          value={productName}
          onChange={(e) =>
            onChange({ productId, productName: e.target.value })
          }
        />
      </div>
    </div>
  );
}
