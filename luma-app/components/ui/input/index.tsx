'use client';
import React from 'react';
import { createInput } from '@gluestack-ui/core/input/creator';
import { View, Pressable, TextInput } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { UIIcon } from '@gluestack-ui/core/icon/creator';

const SCOPE = 'INPUT';

const StyledUIIcon = styled(UIIcon, { className: "style" });

const UIInput = createInput({
  Root: withStyleContext(View, SCOPE),
  Icon: StyledUIIcon,
  Slot: Pressable,
  Input: TextInput,
});


const inputStyle = tva({
  base: 'w-full flex-row items-center rounded-md border border-border dark:bg-input/30 bg-transparent shadow-xs transition-[color,box-shadow] overflow-hidden data-[focus=true]:outline-none data-[focus=true]:border-ring dark:data-[focus=true]:border-ring data-[focus=true]:web:ring-[3px] data-[focus=true]:web:ring-ring/50 data-[invalid=true]:border-destructive/40 dark:data-[invalid=true]:border-destructive/40 data-[invalid=true]:web:ring-destructive/20 dark:data-[invalid=true]:web:ring-destructive/40 data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 px-3 gap-2',
  variants: {
    variant: {
      outline: '',
      underlined: 'border-0 border-b rounded-none shadow-none',
    },
    size: {
      sm: 'min-h-8 max-h-8',
      md: 'min-h-9 max-h-9',
      lg: 'min-h-11 max-h-11',
      xl: 'min-h-12 max-h-12',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

const inputIconStyle = tva({
  base: 'justify-center items-center text-muted-foreground fill-none h-4 w-4',
});

const inputSlotStyle = tva({
  base: 'justify-center items-center web:disabled:cursor-not-allowed',
});

/** Base sem `web:` / `ios:` com valor arbitrário — evita crash em `react-native-css` (nativeStyleMapping: path undefined). */
const inputFieldStyle = tva({
  base: 'min-h-0 flex-1 text-foreground text-sm md:text-sm py-1 placeholder:text-muted-foreground',
});

type IInputProps = React.ComponentProps<typeof UIInput> &
  VariantProps<typeof inputStyle> & {
    className?: string;
    /** Compat: estado inválido (API anterior gluestack) */
    isInvalid?: boolean;
  };
const Input = React.forwardRef<React.ComponentRef<typeof UIInput>, IInputProps>(
  function Input(
    { className, variant = 'outline', size = 'md', isInvalid, ...props },
    ref
  ) {
    const invalidClass = isInvalid ? ' border-destructive' : '';
    return (
      <UIInput
        ref={ref}
        {...props}
        className={inputStyle({
          variant,
          size,
          class: [className ?? '', invalidClass].filter(Boolean).join(' '),
        })}
        context={{}}
      />
    );
  }
);

type IInputIconProps = React.ComponentProps<typeof UIInput.Icon> &
  VariantProps<typeof inputIconStyle> & {
    className?: string;
    /** Aceita número (px) além dos tokens de tamanho */
    size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xs';
    height?: number;
    width?: number;
  };

const InputIcon = React.forwardRef<
  React.ComponentRef<typeof UIInput.Icon>,
  IInputIconProps
>(function InputIcon({ className, ...props }, ref) {
  return (
    <UIInput.Icon
      ref={ref}
      {...props}
      className={inputIconStyle({ class: className ?? '' })}
    />
  );
});

type IInputSlotProps = React.ComponentProps<typeof UIInput.Slot> &
  VariantProps<typeof inputSlotStyle> & { className?: string };

const InputSlot = React.forwardRef<
  React.ComponentRef<typeof UIInput.Slot>,
  IInputSlotProps
>(function InputSlot({ className, ...props }, ref) {
  return (
    <UIInput.Slot
      ref={ref}
      {...props}
      className={inputSlotStyle({
        class: className ?? '',
      })}
    />
  );
});

type IInputFieldProps = React.ComponentProps<typeof UIInput.Input> &
  VariantProps<typeof inputFieldStyle> & { className?: string };

const InputField = React.forwardRef<
  React.ComponentRef<typeof UIInput.Input>,
  IInputFieldProps
>(function InputField({ className, ...props }, ref) {
  return (
    <UIInput.Input
      ref={ref}
      {...props}
      className={inputFieldStyle({
        class: className ?? '',
      })}
    />
  );
});

Input.displayName = 'Input';
InputIcon.displayName = 'InputIcon';
InputSlot.displayName = 'InputSlot';
InputField.displayName = 'InputField';

export { Input, InputField, InputIcon, InputSlot };
