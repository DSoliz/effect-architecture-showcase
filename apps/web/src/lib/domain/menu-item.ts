import { Schema } from "effect";

export const MenuItemId = Schema.String.pipe(Schema.brand("MenuItemId"));
export type MenuItemId = typeof MenuItemId.Type;

export const Category = Schema.Literal(
  "appetizer",
  "main",
  "side",
  "drink",
  "dessert"
);
export type Category = typeof Category.Type;

export class MenuItem extends Schema.Class<MenuItem>("MenuItem")({
  id: MenuItemId,
  name: Schema.NonEmptyString,
  description: Schema.String,
  price: Schema.Number.pipe(Schema.positive()),
  category: Category,
  imageUrl: Schema.String,
  available: Schema.Boolean,
}) {}

export class MenuItemNotFoundError extends Schema.TaggedError<MenuItemNotFoundError>()(
  "MenuItemNotFoundError",
  {
    menuItemId: MenuItemId,
  }
) {}
