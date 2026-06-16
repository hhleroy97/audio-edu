import { z } from "zod";

/** Layout footprint for a patch node (px). Used for placement and collision. */
export const NodeLayoutSize = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export type NodeLayoutSize = z.infer<typeof NodeLayoutSize>;
