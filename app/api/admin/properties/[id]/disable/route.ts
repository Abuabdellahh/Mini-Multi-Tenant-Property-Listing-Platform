import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { adminService } from "@/lib/server/services/admin.service"
import { z } from "zod"

const bodySchema = z.object({ disabled: z.boolean() })

// POST /api/admin/properties/:id/disable -> toggle disabledByAdmin (not delete)
export const POST = handle(async (req, { params }) => {
  await requireRole("ADMIN")
  const { id } = await params
  const { disabled } = bodySchema.parse(await req.json())
  const property = await adminService.setDisabled(id, disabled)
  return json({ property })
})
