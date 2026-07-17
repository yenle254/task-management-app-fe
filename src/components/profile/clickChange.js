import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ArrowRight from '../../../assets/icons/arrow-right.svg';
const clickChange = ({icon, title, onPress}) => {
  return (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          { opacity: pressed ? 0.7 : 1 },
        ]}
    >
        {icon}
        <Text style={styles.textInput}>{title}</Text>
        <ArrowRight width={15} height={15} style={{marginLeft:'auto', tintColor:'#C4C4C4'}} />
    </Pressable>
  )
}

export default clickChange

const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        alignItems:'center',
        marginVertical:10,
    },
    textInput:{
        fontSize:15,
    }
})