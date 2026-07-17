import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { default as React, use } from "react";
import CalendarAc from "../../assets/icons/calendar_ac.svg";
import CalendarInac from "../../assets/icons/calendar_inac.svg";
import HomeAc from "../../assets/icons/home_ac.svg";
import HomeInac from "../../assets/icons/home_inac.svg";
import LeaveAc from "../../assets/icons/leave_ac.svg";
import LeaveInac from "../../assets/icons/leave_inac.svg";
import TaskAc from "../../assets/icons/task_ac.svg";
import TaskInac from "../../assets/icons/task_inac.svg";
import TeamAc from "../../assets/icons/team_ac.svg";
import TeamInac from "../../assets/icons/team_inac.svg";
import ClockinScreen from "../screens/clockinScreen";
import HomeScreen from "../screens/homeScreen";
import LeaveScreen from "../screens/leaveScreen";
import TaskNavigator from "./taskNavigator";
import TeamStackNavigator from "./teamStackNavigator";
import PendingLeavesScreen from "../screens/leave/pendingLeavesScreen";
import { useAuth } from "../contexts/authContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Bottom = createBottomTabNavigator();

const BottomNavigator = () => {
    const { user } = useAuth();
    return (
        <Bottom.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    height: 60 + useSafeAreaInsets().bottom,
                    backgroundColor: 'black',
                    paddingBottom: useSafeAreaInsets().bottom,
                    
                    // borderTopWidth: 1,
                    // borderTopColor: 'white',

                    // borderBottomWidth: 1, 
                    // borderBottomColor: 'white',

                    // marginBottom: useSafeAreaInsets().bottom,

                },
                tabBarIconStyle: {
                    marginVertical: 15,
                },
            }}
        >
            <Bottom.Screen 
                name="home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        focused ? <HomeAc width={28} height={28} /> : <HomeInac width={28} height={28} />
                    ),
                }}
            />
            {user?.role !== "hr_manager" && (
                <Bottom.Screen
                name="clockin"
                component={ClockinScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        focused ? <CalendarAc width={28} height={28} /> : <CalendarInac width={28} height={28} />
                    ),
                }}
            />
            )}
            <Bottom.Screen
                name="task"
                component={TaskNavigator}
                options={{
                    tabBarIcon: ({ focused }) => (
                        focused ? <TaskAc width={28} height={28} /> : <TaskInac width={28} height={28} />
                    ),
                }}
            />
            {user?.role === "hr_manager" && (
                <Bottom.Screen
                    name="team"
                    component={TeamStackNavigator}
                    options={{
                        tabBarIcon: ({ focused }) =>
                            focused ? (
                                <TeamAc width={28} height={28} />
                            ) : (
                                <TeamInac width={28} height={28} />
                            ),
                    }}
                />
            )}
            {user?.role === "hr_manager" ? (
                <Bottom.Screen 
                    name="PendingLeaves"
                    component={PendingLeavesScreen}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            focused ? <LeaveAc width={28} height={28} /> : <LeaveInac width={28} height={28} />
                        ),
                    }}
                />
            ) : (
                <Bottom.Screen
                name="leave"
                component={LeaveScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        focused ? <LeaveAc width={28} height={28} /> : <LeaveInac width={28} height={28} />
                    )
                }}
            />
            )}
        </Bottom.Navigator>
    )
}

export default BottomNavigator;
