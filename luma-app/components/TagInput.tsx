import { useState } from 'react';
import { X } from 'lucide-react-native';

// Gluestack UI v3 imports
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = 'Adicionar tag...', maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim().toLowerCase();
    
    if (!trimmedValue) return;
    
    // Verificar se já existe
    if (tags.includes(trimmedValue)) {
      setInputValue('');
      return;
    }
    
    // Verificar limite
    if (tags.length >= maxTags) {
      setInputValue('');
      return;
    }
    
    onChange([...tags, trimmedValue]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' || e.nativeEvent.key === ' ') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <VStack space="sm">
      <HStack space="sm" className="flex-wrap">
        {tags.map((tag) => (
          <Badge key={tag} action="primary" variant="outline" className="px-2.5 py-1.5 rounded-2xl border-primary-500 bg-primary-50">
            <BadgeText className="text-primary-500 font-semibold text-xs mr-1.5">{tag}</BadgeText>
            <Pressable
              onPress={() => handleRemoveTag(tag)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-0.5"
            >
              <X size={14} color="#64748b" />
            </Pressable>
          </Badge>
        ))}
      </HStack>
      {tags.length < maxTags && (
        <Input>
          <InputField
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            onSubmitEditing={handleAddTag}
            onKeyPress={handleKeyPress}
            returnKeyType="done"
            maxLength={20}
          />
        </Input>
      )}
      {tags.length >= maxTags && (
        <Text size="xs" className="text-typography-400 italic">
          Limite de {maxTags} tags atingido
        </Text>
      )}
    </VStack>
  );
}
