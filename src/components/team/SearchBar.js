import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import Colors from "../../styles/color";
import SearchIcon from "../../../assets/icons/search.svg";

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search...",
  onClear,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <SearchIcon width={20} height={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  icon: {
    marginRight: 12,
    tintColor: "#666666",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 18,
    color: "#666666",
  },
});

export default SearchBar;
