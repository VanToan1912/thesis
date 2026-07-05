import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors } from "../theme";

export function PrimaryButton({
  title,
  onPress,
  disabled,
  style
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}>
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center"
  },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { color: "#04111b", fontWeight: "800", fontSize: 16 }
});
