import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/contexts/authContext";
import RootNavigator from "./src/navigations/rootNavigator";


const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}><AuthProvider>
        <RootNavigator />
    </AuthProvider></GestureHandlerRootView>
  );
};

export default App;
