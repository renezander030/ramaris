import z from 'zod'

export const getSingleUserSchema = z.object({
  name: z.string(),
  image: z.string()
})

export type getSingleUserInput = z.TypeOf<typeof getSingleUserSchema>