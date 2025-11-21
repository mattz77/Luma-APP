import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';

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
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveTag(tag)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {tags.length < maxTags && (
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          style={styles.input}
          onSubmitEditing={handleAddTag}
          onKeyPress={handleKeyPress}
          returnKeyType="done"
          maxLength={20}
        />
      )}
      {tags.length >= maxTags && (
        <Text style={styles.limitText}>Limite de {maxTags} tags atingido</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  removeButton: {
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  limitText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});

