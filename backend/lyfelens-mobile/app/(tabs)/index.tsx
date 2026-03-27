import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Speech from 'expo-speech'
import { useEffect } from 'react'
import { Button, Dimensions, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedProps,
  useSharedValue, withRepeat, withTiming
} from 'react-native-reanimated'
import Svg, { Circle, Ellipse } from 'react-native-svg'

const { width, height } = Dimensions.get('window')
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const CHEST = { x: 0.50, y: 0.42 }

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const pulse = useSharedValue(28)

  useEffect(() => {
    pulse.value = withRepeat(withTiming(38, { duration: 300 }), -1, true)
    Speech.speak('Place both hands here and press down firmly', {
      language: 'en-IN',
      pitch: 0.85,
      rate: 0.80,
    })
  }, [])

  const animProps = useAnimatedProps(() => ({
    r: pulse.value,
    opacity: 1.2 - pulse.value / 30,
  }))

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Button title="Allow Camera" onPress={requestPermission} />
      </View>
    )
  }

  const cx = CHEST.x * width
  const cy = CHEST.y * height

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      <Svg style={StyleSheet.absoluteFill}>
        <Ellipse cx={cx + 4} cy={cy + 5} rx={26} ry={12} fill="rgba(0,0,0,0.3)" />
        <Ellipse cx={cx - 14} cy={cy} rx={18} ry={10} fill="rgba(0,255,136,0.6)" stroke="#00FF88" strokeWidth={2} />
        <Ellipse cx={cx + 14} cy={cy} rx={18} ry={10} fill="rgba(0,255,136,0.6)" stroke="#00FF88" strokeWidth={2} />
        <AnimatedCircle cx={cx} cy={cy} stroke="#00FF88" strokeWidth={2} fill="none" animatedProps={animProps} />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})