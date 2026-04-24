import { Schema } from "effect";

export class CheckoutInfo extends Schema.Class<CheckoutInfo>("CheckoutInfo")({
  name: Schema.NonEmptyString,
  phone: Schema.String.pipe(
    Schema.pattern(/^\d{10}$/, {
      message: () => "Phone number must be exactly 10 digits",
    })
  ),
  notes: Schema.optional(Schema.String),
}) {}
