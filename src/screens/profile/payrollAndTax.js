import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import Colors from "../../styles/color";
const PayrollSmallCard = ({ totalHours, received, paidOn }) => {
  return (
    <View style={styles.payrollContainer}>
      <ScrollView horizontal={true}>
      <View style={styles.column}>
        <Text style={styles.topText}>Total Hours</Text>
        <Text style={styles.bottomText}>{totalHours}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.topText}>Received</Text>
        <Text style={styles.bottomText}>{received}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.topText}>Paid On</Text>
        <Text style={styles.bottomText}>{paidOn}</Text>
      </View>
      </ScrollView>
    </View>
  )
}

const PayrollAndTax = () => {
  const [payrolls, setPayrolls] = useState([
    {
      month: 'September 2025',
      totalHours: '40:00:00 hrs',
      received: '$800',
      paidOn: '30 Sept 2025',
    },
    {
      month: 'August 2025',
      totalHours: '40:00:00 hrs',
      received: '$800',
      paidOn: '30 Aug 2025',
    },
    {
      month: 'July 2025',
      totalHours: '40:00:00 hrs',
      received: '$800',
      paidOn: '30 Jul 2025',
    },
  ]);
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton 
        title="Payroll and Tax" 
        onBackPress={() => navigation.goBack()}

      />
      <ScrollView style={styles.scrollContent}>
        {payrolls.map((item, index) => (
          <View key={index} style={styles.monthCard}>
            <Text style={styles.monthText}>{item.month}</Text>
            <PayrollSmallCard 
              totalHours={item.totalHours} 
              received={item.received} 
              paidOn={item.paidOn} 
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export default PayrollAndTax

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  monthCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  payrollContainer: {
    backgroundColor: Colors.gray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    padding: 12,
  },
  topText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#535353',
  },
  bottomText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
  },
})