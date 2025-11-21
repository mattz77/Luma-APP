import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text, Modal, Pressable, Dimensions } from 'react-native';
import { LucideIcon, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

interface SpeedDialAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  backgroundColor?: string;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  mainIcon?: LucideIcon;
  mainColor?: string;
}

const { width, height } = Dimensions.get('window');

export const SpeedDial = ({ 
  actions, 
  mainIcon: MainIcon = Plus, 
  mainColor = '#FFF44F' 
}: SpeedDialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);

  const measureButton = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonPosition({ x, y, width, height });
    });
  };

  const toggleMenu = () => {
    measureButton(); // Ensure we have fresh coordinates
    const toValue = isOpen ? 0 : 1;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    if (isOpen) toggleMenu();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Render Actions INSIDE the Modal to be above the blur
  const renderActions = () => {
    if (!isOpen) return null;

    return (
       <View 
         style={[
           styles.actionsContainerModal, 
           { 
             left: buttonPosition.x - 150 + (buttonPosition.width / 2), // Center horizontally relative to button center, offset by width/2 of container
             top: buttonPosition.y - (70 * actions.length) - 20, // Start above the button
           }
         ]} 
         pointerEvents="box-none"
       >
        {actions.map((action, index) => {
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0], // Already positioned by container logic, or animate here if needed
          });
          
          // Stagger animation manually or just use the index for position
          // Since we want them to "pop up", let's animate opacity and scale
          
          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          });

          const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButtonContainer,
                {
                  transform: [{ scale }],
                  opacity,
                  marginBottom: 20, // Spacing between items
                },
              ]}
            >
              <View style={styles.labelContainer}>
                <Text style={styles.label}>{action.label}</Text>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: action.backgroundColor || 'rgba(60,40,0,0.9)' }]}
                onPress={() => {
                  closeMenu();
                  action.onPress();
                }}
              >
                <action.icon size={20} color="#FFF44F" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Modal for Backdrop AND Actions */}
      <Modal visible={isOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          </Pressable>
          
          {renderActions()}

          {/* Re-render main button inside modal to keep it visible and clickable to close */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleMenu}
            style={[
              styles.mainButtonModal, 
              { 
                left: buttonPosition.x, 
                top: buttonPosition.y,
                borderColor: 'rgba(255,244,79,0.5)'
              }
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <MainIcon size={24} color={mainColor} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Static Main Button on Page */}
      <View ref={buttonRef} collapsable={false}> 
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleMenu}
          style={[styles.mainButton, { borderColor: 'rgba(255,244,79,0.2)', opacity: isOpen ? 0 : 1 }]}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <MainIcon size={24} color={mainColor} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  // Styles for items inside Modal
  actionsContainerModal: {
    position: 'absolute',
    width: 200, // Fixed width for alignment
    alignItems: 'flex-end', // Align items to the right (above the button)
    paddingRight: 24, // Align circle visually with the button below
  },
  mainButtonModal: {
    position: 'absolute',
    width: 52, 
    height: 52, 
    borderRadius: 18, 
    backgroundColor: 'rgba(60,40,0,0.8)', // Slightly darker in modal
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
  },
  
  // Shared styles
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  mainButton: {
    width: 52, 
    height: 52, 
    borderRadius: 18, 
    backgroundColor: 'rgba(60,40,0,0.4)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.3)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  label: {
    color: '#FFFBE6',
    fontSize: 14,
    fontWeight: '600',
  },
});
