import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { VStack } from '@/components/ui/vstack';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: boolean;
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
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const getIcon = () => {
    if (type === 'email') return Mail;
    if (type === 'password') return Lock;
    return User;
  };

  const IconComponent = getIcon();

  return (
    <VStack space="xs" className="mb-4">
      <Input
        variant="outline"
        size="lg"
        isInvalid={error}
        className={`${error ? 'border-error-500' : ''}`}
      >
        <InputSlot className="pl-3">
          <InputIcon>
            <Icon as={IconComponent} size={18} className="text-gray-500" />
          </InputIcon>
        </InputSlot>
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType || (type === 'email' ? 'email-address' : 'default')}
          className="text-base text-gray-900"
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
                  size={18}
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
