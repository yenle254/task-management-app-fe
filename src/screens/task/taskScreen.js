import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import NoTask from "../../../assets/icons/notask.svg";
import PlusIcon from "../../../assets/icons/plus.svg";
import SearchIcon from "../../../assets/icons/search.svg";
import { useTaskStore } from "../../../store/index";
import HeaderPromo from "../../components/headerPromo";
import CardTask from "../../components/task/cardTask";
import IconCardText from "../../components/task/iconCardText";
import TaskStatusCard from "../../components/task/taskStatusCard";
import { useAuth } from "../../contexts/authContext";
import Colors from "../../styles/color";
import { CategoryMap } from "../../utils/categoryMapping";

const TaskScreen = () => {
  const navigation = useNavigation();
  
  const { user, canManageTasks, isLoading: authLoading } = useAuth();

  const {
    tasks,
    myTasks,
    taskStats,
    isLoading,
    fetchTasks,
    fetchMyTasks,
    fetchTaskStats,
    getFilteredTasks,
    setFilters,
    filters
  } = useTaskStore();

  const Todo = CategoryMap["todo"];
  const Inprogress = CategoryMap["inprogress"];
  const Done = CategoryMap["done"];

  const [selectedTab, setSelectedTab] = useState("All");
  const [selectedView, setSelectedView] = useState("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) loadInitialData();
    }, [authLoading, user])
  );

  useEffect(() => {
    if (user) {
      setFilters({ search: searchQuery });
    }
  }, [searchQuery, user]);

  const loadInitialData = async () => {
    try {
      await fetchMyTasks();
      if (user?.role === "hr_manager" || user?.role === "team_lead") {
        await fetchTasks();
      }
      await fetchTaskStats();
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getCurrentTasks = () => {
    if (selectedView === "my") {
      return myTasks || [];
    }

    if (user?.role === "hr_manager" || user?.role === "team_lead") {
      return getFilteredTasks();
    }

    return myTasks || [];
  };


  const groupTasksByStatus = (taskList) => {
    return {
      todo: taskList.filter(t => t.status === "todo"),
      in_progress: taskList.filter(t => t.status === "in_progress"),
      done: taskList.filter(t => t.status === "done")
    };
  };

  const currentTasks = getCurrentTasks();
  const groupedTasks = groupTasksByStatus(currentTasks);


  const todoCount = groupedTasks.todo.length;
  const inProgressCount = groupedTasks.in_progress.length;
  const doneCount = groupedTasks.done.length;


  const taskData = {
    all: currentTasks,
    inProgress: groupedTasks.in_progress,
    finish: groupedTasks.done,
    todo: groupedTasks.todo
  };


  const formatTaskForCard = (task) => {
    return {
      id: task._id,
      name: task.title,
      description: task.description || "",
      endDate: task.dueDate 
        ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
        : "No date",
      comment: task.comments?.length || 0,
      progress: task.progress || 0,
      category: task.status,
      flag: task.priority || "medium",
      assignees: task.assignedTo || [],
    };
  };

  const renderTabContent = () => {
    let data = [];
    switch (selectedTab) {
      case "All":
        data = taskData.all;
        break;
      case "Todo":
        data = taskData.todo;
        break;
      case "InProgress":
        data = taskData.inProgress;
        break;
      case "Finished":
        data = taskData.finish;
        break;
      default:
        data = [];
    }

    if (isLoading && data.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.noTaskContainer}>
          <View style={styles.noTask}>
            <NoTask width={126} height={86} />
            <Text style={{ fontSize: 19, fontWeight: "bold" }}>
              No Task Assigned
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                color: "#555555ff",
              }}
            >
              It looks like you don&apos;t have any task right now. This place will be
              updated as new task are added!!!
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {data.map((task) => {
          const formattedTask = formatTaskForCard(task);
          return (
            <TouchableOpacity
              key={formattedTask.id}
              onPress={() => navigation.navigate("TaskDetail", { taskId: formattedTask.id })}
            >
              <CardTask 
                name={formattedTask.name}
                description={formattedTask.description}
                endDate={formattedTask.endDate}
                comment={formattedTask.comment}
                progress={formattedTask.progress}
                category={formattedTask.category}
                flag={formattedTask.flag}
                bgColor={Colors.white}
                assignees={formattedTask.assignees}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const canViewAllTasks = user?.role === "hr_manager" || user?.role === "team_lead";
  if (authLoading || !user) {
    return (
      <View style={styles.fullScreenLoading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.secondary }}>
      <HeaderPromo
        text="Challenges ahead!"
        subtext="Don't worry, they're not multiplying.. yet."
        color={Colors.primary}
      />
      
      {/* Summary Card */}
      <View style={styles.summary}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerText}>Summary of your work</Text>
              <Text style={styles.headerSubtext}>
                {selectedView === "my" 
                  ? "Your assigned tasks"
                  : user?.role === "hr_manager" 
                    ? "All company tasks"
                    : "Your team's tasks"}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowSearch(!showSearch)}
              style={styles.searchButton}
            >
              <SearchIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          {showSearch && (
            <View style={styles.searchContainer}>
              <SearchIcon width={16} height={16} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}


          {canViewAllTasks && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, selectedView === "all" && styles.activeViewButton]}
                onPress={() => setSelectedView("all")}
              >
                <Text style={[styles.viewButtonText, selectedView === "all" && styles.activeViewButtonText]}>
                  {user?.role === "hr_manager" ? "All Tasks" : "Team Tasks"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, selectedView === "my" && styles.activeViewButton]}
                onPress={() => setSelectedView("my")}
              >
                <Text style={[styles.viewButtonText, selectedView === "my" && styles.activeViewButtonText]}>
                  My Tasks
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <IconCardText
            icon={<Todo width={16} height={16} />}
            text="To do"
            subtext={todoCount}
            subtextStyle={{
              fontSize: 16,
              fontWeight: "600",
              color: "#000000",
            }}
            textStyle={{
              fontSize: 12,
            }}
          />
          <IconCardText
            icon={<Inprogress width={16} height={16} />}
            text="Ongoing"
            subtext={inProgressCount}
            subtextStyle={{
              fontSize: 16,
              fontWeight: "600",
              color: "#000000",
            }}
            textStyle={{
              fontSize: 12,
            }}
          />
          <IconCardText
            icon={<Done width={16} height={16} />}
            text="Done"
            subtext={doneCount}
            subtextStyle={{
              fontSize: 16,
              fontWeight: "600",
              color: "#000000",
            }}
            textStyle={{
              fontSize: 12,
            }}
          />
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {selectedView === "my" && (
          <TaskStatusCard
            todoCount={todoCount}
            inProgressCount={inProgressCount}
            doneCount={doneCount}
          />
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "All" && styles.activeTab]}
            onPress={() => setSelectedTab("All")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "All" && styles.activeTabText,
              ]}
            >
              All
            </Text>
            {taskData.all.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taskData.all.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === "Todo" && styles.activeTab]}
            onPress={() => setSelectedTab("Todo")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Todo" && styles.activeTabText,
              ]}
            >
              To do
            </Text>
            {taskData.todo.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taskData.todo.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === "InProgress" && styles.activeTab]}
            onPress={() => setSelectedTab("InProgress")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "InProgress" && styles.activeTabText,
              ]}
            >
              Ongoing
            </Text>
            {taskData.inProgress.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taskData.inProgress.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === "Finished" && styles.activeTab]}
            onPress={() => setSelectedTab("Finished")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Finished" && styles.activeTabText,
              ]}
            >
              Finished
            </Text>
            {taskData.finish.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taskData.finish.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={styles.scrollViewContent}
          contentContainerStyle={styles.scrollViewContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </View>
      </ScrollView>


      {canManageTasks && canManageTasks() && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreateTask")}
        >
          <PlusIcon width={24} height={24} fill="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TaskScreen;

const styles = StyleSheet.create({
  fullScreenLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
  },
  summary: {
    marginTop: -80,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  headerSubtext: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    marginTop: 4,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f7f7f7",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  clearButton: {
    fontSize: 18,
    color: "#999",
    paddingHorizontal: 8,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeViewButton: {
    backgroundColor: Colors.primary,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  activeViewButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  body: {
    flexDirection: "row",
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "#f7f7f7ff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scrollViewContent: {
    flex: 1,
    alignItems: "center",
  },
  scrollViewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  contentContainer: {
    gap: 12,
    width: "90%",
  },
  noTask: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 13,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  noTaskContainer: {
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});