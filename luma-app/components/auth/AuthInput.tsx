import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { VStack } from '@/components/ui/vstack';

import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: boolean;
  /** Tema escuro do `newlogin.html` — label em caixa alta, borda âmbar, foco com brilho. */
  variant?: 'default' | 'authDark';
  testID?: string;
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  autoCapitalize = 'none',
  keyboardType,
  error = false,
  variant = 'default',
  testID,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';

  const getIcon = () => {
    if (type === 'email') return Mail;
    if (type === 'password') return Lock;
    return User;
  };

  const IconComponent = getIcon();

  if (variant === 'authDark') {
    const borderColor = error
      ? authTheme.error
      : focused
        ? authTheme.borderFocus
        : authTheme.border;
    const iconClass = error
      ? 'text-[#E05252]'
      : focused
        ? 'text-[#D4AF37]'
        : 'text-[rgba(240,237,229,0.3)]';

    return (
      <VStack space="xs" className="mb-2">
        <Text style={styles.darkLabel}>{label}</Text>
        <Input
          variant="outline"
          size="xl"
          isInvalid={error}
          className="min-h-[52px] max-h-[52px] rounded-[14px] border-[1.5px] px-0 overflow-hidden"
          style={{
            backgroundColor: focused ? 'rgba(212, 175, 55, 0.03)' : authTheme.inputBg,
            borderColor,
            shadowColor: focused ? authTheme.amber : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: focused ? 0.35 : 0,
            shadowRadius: focused ? 6 : 0,
            elevation: 0,
          }}
        >
          <InputSlot className="pl-3.5">
            <InputIcon>
              <Icon as={IconComponent} size="md" className={iconClass} />
            </InputIcon>
          </InputSlot>
          <InputField
            value={value}
            onChangeText={onChangeText}
            testID={testID}
            placeholder={placeholder || label}
            placeholderTextColor="rgba(240, 237, 229, 0.3)"
            multiline={false}
            textAlignVertical={Platform.OS === 'android' ? 'center' : undefined}
            secureTextEntry={isPassword && !showPassword}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType || (type === 'email' ? 'email-address' : 'default')}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="text-[15px] py-0"
            style={{ color: authTheme.textPrimary, fontFamily: authFontFamilies.sans }}
          />
          {isPassword && (
            <InputSlot className="pr-3">
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <InputIcon>
                  <Icon
                    as={showPassword ? EyeOff : Eye}
                    size="md"
                    className="text-[rgba(240,237,229,0.3)]"
                  />
                </InputIcon>
              </TouchableOpacity>
            </InputSlot>
          )}
        </Input>
      </VStack>
    );
  }

  return (
    <VStack space="xs" className="mb-2">
      <Input
        variant="outline"
        size="md"
        isInvalid={error}
        className={`${error ? 'border-error-500' : ''}`}
      >
        <InputSlot className="pl-3">
          <InputIcon>
            <Icon as={IconComponent} size="md" className="text-gray-500" />
          </InputIcon>
        </InputSlot>
        <InputField
          value={value}
          onChangeText={onChangeText}
          testID={testID}
          placeholder={placeholder || label}
          placeholderTextColor="#9CA3AF"
          multiline={false}
          textAlignVertical={Platform.OS === 'android' ? 'center' : undefined}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType || (type === 'email' ? 'email-address' : 'default')}
          className="text-sm text-gray-900"
        />
        {isPassword && (
          <InputSlot className="pr-3">
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <InputIcon>
                <Icon
                  as={showPassword ? EyeOff : Eye}
                  size="md"
                  className="text-gray-500"
                />
              </InputIcon>
            </TouchableOpacity>
          </InputSlot>
        )}
      </Input>
    </VStack>
  );
}

const styles = StyleSheet.create({
  darkLabel: {
    fontFamily: authFontFamilies.sansMedium,
    fontSize: 12.5,
    fontWeight: '500' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: authTheme.textSecondary,
    paddingLeft: 2,
    marginBottom: 6,
  },
});
