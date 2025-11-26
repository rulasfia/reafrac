import { Form as FormPrimitive } from "@base-ui-components/react/form"

import { cn } from "@/lib/utils/index"

function Form({ className, ...props }: FormPrimitive.Props) {
  return (
    <FormPrimitive
      data-slot="form"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

export { Form }
