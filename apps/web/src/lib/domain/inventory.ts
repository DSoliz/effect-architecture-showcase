import { Schema } from "effect";
import { MenuItemId } from "./menu-item";

export class ItemOutOfStockError extends Schema.TaggedError<ItemOutOfStockError>()(
  "ItemOutOfStockError",
  {
    menuItemId: MenuItemId,
    requested: Schema.Number.pipe(Schema.int(), Schema.positive()),
    available: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
  }
) {}
