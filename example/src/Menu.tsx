import React, { useCallback } from 'react'
import { TouchableOpacity, Text, View } from 'react-native'
import { Garden, InjectedProps, useVisibleEffect } from 'hybrid-navigation'

import styles from './Styles'

export default function Menu({ navigator }: InjectedProps) {
  const push = () => {
    navigator.closeMenu()
    navigator.push('NativeModule')
  }

  function pushToRedux() {
    navigator.closeMenu()
    navigator.push('ReduxCounter')
  }

  function pushToZustand() {
    navigator.closeMenu()
    navigator.push('ZustandCounter')
  }

  function pushToToast() {
    navigator.closeMenu()
    navigator.push('Toast')
  }

  useVisibleEffect(
    useCallback(() => {
      console.log(`Menu is visible`)
      return () => console.log(`Menu is invisible`)
    }, []),
  )

  return (
    <View style={[styles.container, { paddingTop: Garden.topBarHeight() }]}>
      <Text style={styles.welcome}>This's a React Native Menu.</Text>

      <TouchableOpacity onPress={push} activeOpacity={0.2} style={styles.button}>
        <Text style={styles.buttonText}>push to native</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={pushToRedux} activeOpacity={0.2} style={styles.button}>
        <Text style={styles.buttonText}>Redux Counter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={pushToZustand} activeOpacity={0.2} style={styles.button}>
        <Text style={styles.buttonText}>Zustand Counter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={pushToToast} activeOpacity={0.2} style={styles.button}>
        <Text style={styles.buttonText}>Toast</Text>
      </TouchableOpacity>
    </View>
  )
}
