# Modal Closure Issue and Solution Guide

## Problem Description

### The Issue
Modal boxes containing dropdown components (Select, Autocomplete, Dropdown, etc.) close unexpectedly when users interact with these dropdown components, particularly in production environments. This issue is less apparent in development but becomes problematic in production builds.

### Root Cause
The problem occurs due to:
1. **Event Propagation**: Dropdown interactions trigger blur/focus events that propagate to modal containers
2. **Focus Management**: When dropdowns open, they can shift focus away from the modal, causing auto-close behavior
3. **Click Outside Detection**: Modal libraries often implement click-outside-to-close logic that gets triggered by dropdown interactions
4. **Production vs Development**: Different behavior between development and production due to optimization differences

### Symptoms
- Modals close immediately when clicking on Select/Autocomplete components
- Dropdowns open briefly then disappear as the modal closes
- Issue more prevalent in production builds
- Users unable to select options from dropdowns inside modals

## Solution Overview

### Custom Modal State Management Hook
Create a robust modal state management system that prevents unwanted closures during dropdown interactions.

## Implementation Guide

### Step 1: Create the Custom Hook

Create `src/hooks/useModalState.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';

interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  forceClose: () => void;
  preventClose: (duration?: number) => void;
  handleDropdownInteraction: () => void;
}

export const useModalState = (initialState: boolean = false): UseModalStateReturn => {
  const [isOpen, setIsOpen] = useState(initialState);
  const preventCloseRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    preventCloseRef.current = false;
  }, []);

  const close = useCallback(() => {
    if (preventCloseRef.current) {
      return;
    }
    setIsOpen(false);
  }, []);

  const forceClose = useCallback(() => {
    preventCloseRef.current = false;
    setIsOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const preventClose = useCallback((duration: number = 300) => {
    preventCloseRef.current = true;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      preventCloseRef.current = false;
      timeoutRef.current = null;
    }, duration);
  }, []);

  const handleDropdownInteraction = useCallback(() => {
    preventClose(500); // Prevent modal close for 500ms during dropdown interaction
  }, [preventClose]);

  return {
    isOpen,
    open,
    close,
    forceClose,
    preventClose,
    handleDropdownInteraction
  };
};
```

### Step 2: Replace useDisclosure with useModalState

#### Before (using useDisclosure):
```typescript
import { useDisclosure } from "@heroui/modal";

const { isOpen, onOpen, onClose } = useDisclosure();
```

#### After (using useModalState):
```typescript
import { useModalState } from "@/hooks/useModalState";

const modalState = useModalState(false);
```

### Step 3: Update Modal Components

#### Before:
```typescript
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    {/* Modal content */}
  </ModalContent>
</Modal>
```

#### After:
```typescript
<Modal isOpen={modalState.isOpen} onClose={modalState.close}>
  <ModalContent>
    {/* Modal content */}
  </ModalContent>
</Modal>
```

### Step 4: Update Button Handlers

#### Before:
```typescript
<Button onPress={onOpen}>Open Modal</Button>
<Button onPress={onClose}>Cancel</Button>
```

#### After:
```typescript
<Button onPress={modalState.open}>Open Modal</Button>
<Button onPress={modalState.close}>Cancel</Button>
```

### Step 5: Protect Dropdown Components

Add dropdown interaction protection to all Select, Autocomplete, and Dropdown components inside modals:

#### For Select Components:
```typescript
<Select
  label="Choose Option"
  selectedKeys={[selectedValue]}
  onSelectionChange={(keys) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedValue(selectedKey);
  }}
  onOpenChange={modalState.handleDropdownInteraction}
  popoverProps={{
    classNames: {
      content: "min-w-[200px]"
    }
  }}
  disallowEmptySelection
  isRequired
>
  {options.map((option) => (
    <SelectItem key={option.key}>{option.name}</SelectItem>
  ))}
</Select>
```

#### For Autocomplete Components:
```typescript
<Autocomplete
  label="Search Items"
  placeholder="Type to search..."
  selectedKey={selectedItem}
  onSelectionChange={(key) => setSelectedItem(key as string)}
  onOpenChange={modalState.handleDropdownInteraction}
  popoverProps={{
    classNames: {
      content: "max-h-60 overflow-auto"
    }
  }}
  isRequired
>
  {items.map((item) => (
    <AutocompleteItem key={item.id} textValue={item.name}>
      {item.name}
    </AutocompleteItem>
  ))}
</Autocomplete>
```

### Step 6: Handle Form Submissions

For successful form submissions, use `forceClose()` to bypass the prevention mechanism:

```typescript
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    
    // Your form submission logic here
    await submitData();
    
    // Success - force close the modal
    modalState.forceClose();
    
  } catch (error) {
    // Handle error
  } finally {
    setIsSubmitting(false);
  }
};
```

## Complete Example

Here's a complete example of a modal with dropdown components:

```typescript
import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Input
} from "@heroui/react";
import { useModalState } from "@/hooks/useModalState";

interface FormData {
  name: string;
  category: string;
  item: string;
}

export function ExampleModal() {
  const modalState = useModalState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    item: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { key: 'electronics', name: 'Electronics' },
    { key: 'clothing', name: 'Clothing' },
    { key: 'books', name: 'Books' }
  ];

  const items = [
    { id: '1', name: 'Laptop' },
    { id: '2', name: 'Phone' },
    { id: '3', name: 'Tablet' }
  ];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - force close the modal
      modalState.forceClose();
      
      // Reset form
      setFormData({ name: '', category: '', item: '' });
      
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onPress={modalState.open}>Open Modal</Button>
      
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={modalState.close}
        size="2xl"
        isDismissable={!isSubmitting}
        hideCloseButton={isSubmitting}
      >
        <ModalContent>
          <ModalHeader>
            Example Form Modal
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
                isRequired
              />
              
              <Select
                label="Category"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData(prev => ({ ...prev, category: selectedKey }));
                }}
                onOpenChange={modalState.handleDropdownInteraction}
                popoverProps={{
                  classNames: {
                    content: "min-w-[200px]"
                  }
                }}
                disallowEmptySelection
                isRequired
              >
                {categories.map((category) => (
                  <SelectItem key={category.key}>{category.name}</SelectItem>
                ))}
              </Select>
              
              <Autocomplete
                label="Item"
                placeholder="Search for an item..."
                selectedKey={formData.item}
                onSelectionChange={(key) => 
                  setFormData(prev => ({ ...prev, item: key as string }))
                }
                onOpenChange={modalState.handleDropdownInteraction}
                popoverProps={{
                  classNames: {
                    content: "max-h-60 overflow-auto"
                  }
                }}
                isRequired
              >
                {items.map((item) => (
                  <AutocompleteItem key={item.id} textValue={item.name}>
                    {item.name}
                  </AutocompleteItem>
                ))}
              </Autocomplete>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="danger" 
              variant="light" 
              onPress={modalState.close}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !formData.name || !formData.category}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```

## Key Benefits

1. **Prevents Unwanted Closures**: Dropdowns won't trigger modal closure
2. **Maintains UX**: Users can interact with form elements normally
3. **Production-Ready**: Works consistently across development and production
4. **Flexible**: Easy to customize prevention duration and behavior
5. **Type-Safe**: Full TypeScript support
6. **Reusable**: Single hook can be used across all modals

## Best Practices

1. **Always use `handleDropdownInteraction`** for any dropdown component inside modals
2. **Use `forceClose()`** for successful form submissions
3. **Use `close()`** for normal cancel operations
4. **Test in production builds** to ensure the fix works correctly
5. **Adjust prevention duration** based on your UI's specific needs (default 500ms)
6. **Add `disallowEmptySelection`** to Select components for better UX
7. **Use `popoverProps`** to ensure proper dropdown styling and positioning

## Troubleshooting

### Issue: Modal still closes unexpectedly
- Check if all dropdown components have `onOpenChange={modalState.handleDropdownInteraction}`
- Verify you're using `modalState.close` instead of the old `onClose`
- Ensure prevention duration is adequate (try increasing to 1000ms)

### Issue: Modal won't close at all
- Check if `preventClose` is being called without timeout
- Use `forceClose()` instead of `close()` for debugging
- Verify no JavaScript errors are preventing timeout cleanup

### Issue: Dropdown appears but immediately disappears
- Ensure `popoverProps` are properly configured
- Check z-index conflicts between modal and dropdown
- Verify dropdown content has proper dimensions

## Migration Checklist

When converting existing modals:

- [ ] Replace `useDisclosure` with `useModalState`
- [ ] Update modal `isOpen` and `onClose` props
- [ ] Update all button `onPress` handlers
- [ ] Add `onOpenChange` to all Select components
- [ ] Add `onOpenChange` to all Autocomplete components
- [ ] Add `popoverProps` and `disallowEmptySelection` where appropriate
- [ ] Update form submission handlers to use `forceClose()`
- [ ] Remove old modal state variables
- [ ] Test in both development and production builds

This solution provides a robust, reusable approach to preventing modal closure issues while maintaining good user experience and code maintainability.
