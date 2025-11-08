"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

interface SelectComponentProps extends SelectProps {
  children?: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectComponentProps>(
  ({ onValueChange, children, value, ...props }, _ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '')

    return (
      <SelectContext.Provider value={{ value: internalValue as string, onValueChange }}>
        <div>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...props,
                value: internalValue,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                  const newValue = e.target.value
                  setInternalValue(newValue)
                  onValueChange?.(newValue)
                },
              } as Record<string, unknown>)
            }
            return child
          })}
        </div>
      </SelectContext.Provider>
    )
  }
)
Select.displayName = "Select"

const SelectGroup = React.forwardRef<
  HTMLOptGroupElement,
  React.OptgroupHTMLAttributes<HTMLOptGroupElement>
>(({ ...props }, ref) => <optgroup ref={ref} {...props} />)
SelectGroup.displayName = "SelectGroup"

interface SelectValueProps {
  children?: React.ReactNode
  placeholder?: string
}

const SelectValue = ({ children, placeholder }: SelectValueProps) => (
  <option value="">{placeholder || children}</option>
)

interface SelectTriggerProps {
  children?: React.ReactNode
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
}

const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ children, className, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e)
      }
    }

    const { value, ...selectProps } = props as Record<string, unknown> & { value?: string }

    return (
      <div className="relative w-full" ref={ref}>
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onChange={handleChange}
          value={value}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectContentProps {
  children?: React.ReactNode
}

const SelectContent = ({ children }: SelectContentProps) => <>{children}</>

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
  children?: React.ReactNode
}

const SelectItem = ({ value, children, ...props }: SelectItemProps) => (
  <option value={value} {...props}>
    {children}
  </option>
)
const SelectSeparator = () => null
const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
