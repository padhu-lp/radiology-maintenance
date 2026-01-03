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
  ({ onValueChange, children, value, ...props }, ref) => {
    // Use value prop if provided, otherwise manage internal state
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(value || '')
    const currentValue = isControlled ? value : internalValue

    // Update internal value when controlled value changes
    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(value || '')
      }
    }, [value, isControlled])

    // Extract SelectValue and SelectContent/SelectItems from children
    let selectValueElement: React.ReactNode = null
    const selectItemsElements: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if ((child.type as React.ComponentType)?.displayName === 'SelectValue') {
          selectValueElement = child
        } else if ((child.type as React.ComponentType)?.displayName === 'SelectContent') {
          // Extract items from SelectContent
          const childProps = child.props as { children?: React.ReactNode }
          if (childProps.children) {
            const contentChildren = Array.isArray(childProps.children) ? childProps.children : [childProps.children]
            contentChildren.forEach((item: React.ReactNode) => {
              if (item) {
                selectItemsElements.push(item)
              }
            })
          }
        }
      }
    })

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value
      if (!isControlled) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <SelectContext.Provider value={{ value: currentValue as string, onValueChange }}>
        <div className="relative w-full">
          <select
            className={cn(
              "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            )}
            onChange={handleChange}
            value={currentValue}
            {...props}
          >
            {selectValueElement}
            {selectItemsElements}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
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
SelectValue.displayName = "SelectValue"

interface SelectTriggerProps {
  children?: React.ReactNode
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
}

const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ children, className }, ref) => {
    return <div ref={ref} className={className}>{children}</div>
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectContentProps {
  children?: React.ReactNode
}

const SelectContent = ({ children }: SelectContentProps) => {
  // SelectContent is now just a wrapper - the Select component will extract its children
  return <>{children}</>
}
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
  children?: React.ReactNode
}

const SelectItem = ({ value, children, ...props }: SelectItemProps) => (
  <option value={value} {...props}>
    {children}
  </option>
)
SelectItem.displayName = "SelectItem"

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
