import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const viewInf = ({icon, title}) => {
  return (
    <View style={styles.container}>
        {icon}
      <Text style={styles.textInput}>{title}</Text>
    </View>
  )
}

export default viewInf

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